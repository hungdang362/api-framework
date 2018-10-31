'use strict';

import { Url, parse, format } from 'url';
import * as request from 'request';
import * as merge from 'deepmerge';

import { ConfigProviderContract } from "../ConfigProviderContract";
import { ConfigContract } from '../ConfigContract';

export class CloudProvider extends ConfigProviderContract {

    private url: Url;

    async load() {

        const { url: { protocol, hostname, port }, source: { registry } } = this;
        const { configuration: { auth } } = registry;

        const pathname = this.getPath();

        return await (new Promise((resolve, reject) => {

            const url = format({ protocol, hostname, port, pathname });

            request({ url, json: true, method: 'GET', auth }, (err, res, body) => {

                if (res.statusCode != 200) {
                    this.logger.error(`Server response status code: ${res.statusCode}`);
                    resolve();
                }

                this.parse(body.propertySources || {});
                this.logger.info('Remote Configuration: Successful');
                resolve(this);
            })

        }));

    }

    exists(key: string): boolean {
        return true;
    }

    getPath(): string | undefined {
        const { url, source } = this;
        const { path } = url;

        if (path === undefined) return undefined;

        return (
            path.endsWith('/') ? path : path + '/').concat(
                encodeURIComponent(source.name), '/',
                encodeURIComponent(source.registry.configuration.profiles.join(',')), '/',
                this.source.registry.configuration.label ? encodeURIComponent(this.source.registry.configuration.label) : ''
            );
    }

    setSource(source: ConfigContract | any): CloudProvider {
        this.source = source;
        const { proto, host, port, prefix } = this.source.registry.configuration;

        this.url = parse(`${proto}://${host}:${port}/${prefix}`);

        return this;
    }

    private deepParse(keys: any[], val: any, lvl: number = 0) {
        const key = keys.shift();
        if (!key) return val;

        return { [key]: this.deepParse(keys, val, ++lvl) };
    }

    private parse(body: any[]) {
        for (const record of body.reverse()) {
            const { source } = record;
            for (const key in source) {
                this.content = merge(this.content, this.deepParse(key.split('.'), source[key]));
            }
        }
    }
}