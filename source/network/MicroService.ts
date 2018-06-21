import { Eureka as Client } from 'eureka-js-client'
import { ConfigContract as Config } from '../config/ConfigContract';
import { autoInject } from '../system/Injection'
import { Logger } from '../system/Logger';

import resilient = require('resilient');

@autoInject
export class MicroService {

    private client: Client | any;

    private instanceId: string;
    private homePageUrl: string;

    private instances = new Map<String, Object>();

    constructor(readonly config: Config, readonly logger: Logger) {

        const { registry: { eureka: { server: { proto = 'http' } } } } = config;

        this.instanceId = `${config.listen.addr}:${config.name}:${config.listen.port}`;
        this.homePageUrl = `${proto}://${config.listen.addr}:${config.listen.port}`;

        process.on('SIGINT', () => {
            this.stop();
            setTimeout(function () { process.exit(); }, 500);
        });

        this.init();
        this.start();
    }


    init() {

        const { config, homePageUrl, instanceId, logger } = this;
        const {
            'name': app, listen,
            registry: { eureka: { instance, server } }
        } = config;

        this.client = new Client({
            logger,
            instance: {
                instanceId, app,
                hostName: instance.host || listen.host,
                ipAddr: instance.addr || listen.addr,
                port: {
                    '$': instance.port || listen.port,
                    '@enabled': true,
                },
                vipAddress: app.toLowerCase(),
                dataCenterInfo: {
                    '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
                    name: 'MyOwn',
                },
                homePageUrl: homePageUrl.concat('/'),
                healthCheckUrl: homePageUrl.concat('/', 'health'),
                statusPageUrl: homePageUrl.concat('/', 'info'),
                leaseInfo: {
                    renewalIntervalInSecs: instance.renewalIntervalInSecs,
                    durationInSecs: instance.durationInSecs
                }
            },
            eureka: {
                host: server.host,
                port: server.port,
                servicePath: '/eureka/apps/',
                registryFetchInterval: instance.registryFetchInterval,
                fetchRegistry: true
            },
        } as any);

        this.client.on('registryUpdated', this.update.bind(this));

    }

    getInstance(): Client {
        return this.client;
    }

    start() {
        this.client.start();
    }

    stop() {
        this.client.stop();
    }

    update() {
        const { logger, instances, client: { cache: { 'app': apps } } } = this;

        instances.clear();

        for (const name in apps) {
            const app = apps[name];

            const servers = app.map((instance) => {
                return `http://${instance.ipAddr}:${instance.port.$}`;
            })

            const balancer = resilient();
            balancer.setServers(servers);

            instances.set(name.toLowerCase(), balancer);
        }

        logger.debug(`Fetch Registry: (${Object.keys(apps).length}) services`);
    }

    service(name: string) {
        const { logger, instances } = this;

        if (!instances.has(name)) {
            logger.warn(`Service "${name}" not found`);

            return null;
        }

        return instances.get(name);
    }

}