/// <reference path="../typings/continuation-local-storage.d.ts" />

import { createNamespace } from 'cls-hooked';


export class Storage {

	readonly name = Symbol('storage');

	readonly namespace = createNamespace(this.name);


	get(key: string | symbol) {
		return this.namespace.get(key);
	}


	set(key: string | symbol, value: any) {
		this.namespace.set(key, value);
	}


	async run(fn: () => Promise<void>) {
		const { namespace } = this;
		const context = namespace.createContext();
		try {
			namespace.enter(context);
			await fn();
		} finally {
			namespace.exit(context);
		}
	}

}
