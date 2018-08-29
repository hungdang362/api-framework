import { SchemaCommandBus } from './SchemaCommandBus';
import { Command } from '../Command';
import { autoInject } from '../../system/Injection';

import * as uuid from 'uuid';

import { ConfigContract } from '../../config/ConfigContract';
import { MessageBroker } from '../../lib/message/MessageBroker';
import { Logger } from '../../system/Logger'
import { CommandBus } from '../CommandBus';

@autoInject
export class SchemaBrokerBus extends SchemaCommandBus {

    private readonly id: string;
    private readonly queue: string;

    private types = new Map<string, CommandBus | any>();

    constructor(
        readonly logger: Logger,
        readonly config: ConfigContract,
        readonly messageBroker: MessageBroker
    ) {
        super();

        this.id = uuid.v4();
        const { name, env, registry: { configuration: { "label": project } } } = config;

        this.queue = `${project}.${env}.${name}.${this.id}`;

        this.subscribe();
    }

    /**
     * Get list of router
     */
    get routers() {
        const { env, registry: { configuration: { "label": project } } } = this.config;

        return {
            topic: { name: `${project}.${env}.topic`, type: 'exchange' },
            direct: { name: `${project}.${env}.direct`, type: 'exchange' }
        };
    }

    /**
     * Initialize queue for subscribe
     */
    async subscribe() {
        const { "queue": name, messageBroker, logger } = this;


        await messageBroker.connect();
        await messageBroker.sub({ name, consume: this.consume.bind(this) });

        await this.routing();
    }

    /**
     * Routing message
     */
    async routing() {
        const { messageBroker, config, "queue": queueName } = this;
        const { name, registry: { configuration: { "label": project } } } = config;

        const queue = { name: queueName, type: 'queue' };

        const { topic, direct } = this.routers;

        // Create router
        await messageBroker.router({ name: topic.name, type: 'topic' });
        await messageBroker.router({ name: direct.name, type: 'direct' });

        await messageBroker.routing({ src: topic, dest: queue, pattern: `${project}.Demo` })
        await messageBroker.routing({ src: topic, dest: queue, pattern: `${project}` })
        await messageBroker.routing({ src: direct, dest: queue, pattern: name });
    }

    /**
     * Message consumer
     * 
     * @param msg string
     */
    private async consume(msg: any) {

        const { "content": raw, fields, properties } = msg;
        const { "command": type, agruments } = JSON.parse(raw.toString('utf8'));

        const Type = this.types.get(type);
        const command = new Type(agruments);

        const result = await this.execute(command);

        return result;
    }

    /**
     * Push worker to queue
     *
     * @param type
     * @param handler
     */
    register<T>(type: Command.Static<T>, handler: Command.Handler<T>, ) {
        super.register(type, handler);

        if (type.name) this.types.set(type.name, type);
    }

    /**
     * Note: Only support balancing with Direct Exchange
     * 
     * @param payload Payload
     */
    async publish(payload: Payload) {

        return this.messageBroker.pub(
            payload.app,
            JSON.stringify(payload),
            this.routers.direct.name
        );

    }

}

export interface Payload {
    app: string,
    command: string | Object,
    agruments: Object
}
