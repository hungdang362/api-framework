import { connect, Connection, Options, Channel } from 'amqplib';
import { MessageBroker, Status, RouterOption, RoutingOption, SubOption } from '../MessageBroker';
import { ConfigContract } from '../../../config/ConfigContract';
import { Logger } from '../../../system/Logger';
import { autoInject } from '../../../system/Injection';

@autoInject
export class RabbitMQ extends MessageBroker {

    protected client?: Connection;

    private channel?: Channel;
    private options: any;

    private commits = new Map<string, Bucket>();

    constructor(readonly config: ConfigContract,
        readonly logger: Logger
    ) {
        super(config);
        const { config: { registry: { broker: { options } } } } = this;

        if (!options) {
            throw new Error('RabbitMQ Options not found!');
        }

        this.options = options;
    }

    async retry(sleep = 15 * 1000) {
        const { logger } = this;
        logger.error('RabbitMQ Connection is Closed! Reconnecting...');

        await this.disconnect();
        await new Promise((resolve) => setTimeout(resolve, sleep));

        await this.connect();
    }

    async recover() {
        this.logger.debug('RabbitMQ is recovering last commit...');

        for (const bucket of this.commits.values()) {
            const func = bucket.func.bind(this);
            await func(bucket.option);
        }
    }

    async connect() {
        const { logger, options: { username, hostname, port, password } } = this;

        if (!this.client) {
            const params: Options.Connect = { username, password, hostname, port };

            try {
                this.client = await connect(params);
                logger.info('RabbitMQ is connected!');
                this.channel = await this.client.createChannel();

                // Recover last commit
                await this.recover();
                this.client.on('close', this.retry.bind(this));
            } catch (ex) {
                this.retry();
                return false;
            }

        }

        return true;
    }

    async disconnect() {
        if (!this.client) return false;

        try { await this.client.close() } catch (ex) { };
        this.client = this.channel = undefined;

        return true;
    }

    async router(option: RouterOption) {
        const { commits, channel } = this;
        let { options, type, name } = option;

        options = { ...options, ...{ durable: false, autoDelete: true } };
        if (channel) await channel.assertExchange(name, type, options);

        commits.set(`router:${name}`, { func: this.router, option });

        return this;
    }

    async routing(option: RoutingOption) {
        const { channel, commits } = this;

        const { src, dest, pattern, options } = option;
        const { type, name } = dest;

        if (channel) {
            if (type === 'queue') await channel.bindQueue(name, src.name, pattern || name, options);
            if (type === 'exchange' && pattern) await channel.bindExchange(name, src.name, pattern);
        }

        commits.set(`${JSON.stringify(src)}-${JSON.stringify(dest)}`, { func: this.routing, option });

        return this;
    }

    async sub(option: SubOption) {
        const { consume, name } = option;
        const { channel, commits } = this;

        if (channel) {
            const queueOptions = { autoDelete: true, durable: false };
            await channel.assertQueue(name, queueOptions);

            if (consume) channel.consume(name, consume);
        }

        commits.set(`queue:${name}`, { func: this.sub, option });

        return this;
    }

    pub(to, content, router?: string) {
        const { options: { exchange }, channel } = this;
        if (!channel) return false;

        return channel.publish(router || exchange, to, Buffer.from(content))
    }

}

interface Bucket {
    func: Function,
    option: Object
}