import * as compose from 'koa-compose';
import * as Origin from 'koa-router';

import { json as parse } from 'co-body';
import { Context } from 'koa';

import { HttpMetadata } from './Http';
import { Logger } from '../system/Logger';
import { autoInject } from '../system/Injection';

const PREFIX = Symbol('route:prefix');

@autoInject
export class Router {

	private readonly router: Origin;

	constructor(readonly logger: Logger) {
		this.router = new Origin();
	}

	register(controller) {
		const annotations = HttpMetadata.get(controller);

		const prefix = Prefix.get(controller);
		
		for (const route of annotations) {
			const path = `${prefix}${route.routePath}`;
			const handler = controller[route.property].bind(controller);

			this.logger.debug(`[${route.httpMethod.toUpperCase()}] ${path}`);

			this.router[route.httpMethod](path, handler);
		}
	}

	getRoutes() {
		return this.router.routes();
	}

	middleware() {
		return compose([parseBody, awaitBody, this.getRoutes(), this.router.allowedMethods()]);
	}

}

const Prefix = {

	set(target, prefix) {
		Reflect.defineMetadata(PREFIX, prefix, target);
	},

	get(target) {
		return Reflect.getMetadata(PREFIX, target) || '';
	}

}

async function parseBody(context: Context, next: Function) {
	if (context.is('json')) {
		context.request['body'] = await parse(context);
	}
	await next();
}


async function awaitBody(context: Context, next: Function) {
	await next();
	if (context.body && context.body.then) {
		context.body = await context.body;
	}
}

export { Prefix }