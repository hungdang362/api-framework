'use strict';
import { ConfigProviderContract } from "./ConfigProviderContract";
import { ConfigContract } from "./ConfigContract";
import { CloudProvider, DefaultProvider, EnvironmentProvider, StaticProvider } from './provider';
import * as merge from 'deepmerge';

let instance: ConfigContract;

const providers: ConfigProviderContract[] = [
    new DefaultProvider(),
    new EnvironmentProvider(),
    new StaticProvider(),
    new CloudProvider(),
    new StaticProvider(),
    new EnvironmentProvider()
];

export async function ConfigFactory(path: string): Promise<ConfigContract> {

    if (!instance) {
        instance = {} as any;

        for (const provider of providers) {
            provider.setSource(instance);
            await provider.load();

            instance = merge(instance, provider.content);
        }

        instance = { ...instance, ...{ source: { path } } } as ConfigContract;
    }

    return instance;
}
