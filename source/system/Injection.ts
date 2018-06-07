/// <reference path="../typings/reflect-metadata.d.ts" />

import * as _ from 'lodash';

import { ReflectiveInjector } from '@angular/core/src/di';

import { Injector } from '@angular/core'

export { autoInject, component, bootstrap };


function autoInject(target) {
}


interface Type<T> extends Function {
	new(...args): T;
}

interface Provide<T> {
	provide: Type<T>,
	useClass: Type<T>,
	deps: Type<T>[]
}


interface ComponentMetadata {
	implClasses: Type<any>[];
}


const COMPONENT = Symbol('component');


function component(metadata: ComponentMetadata) {
	return function (target) {
		Reflect.defineMetadata(COMPONENT, metadata, target);
	};
}


function bootstrap<T>(target: Type<T>, providers: any[]): T {

	const targetProvider: Provide<T> = { provide: target, useClass: target, deps: [] };

	const foundProviders = _.unionWith(findParamTypes(targetProvider), _.isEqual);
	const knownProviders = foundProviders.concat(targetProvider);

	const implProviders = _.flatMap(knownProviders, getImplClasses).map(createProvider);

	const concreteProviders = _.differenceWith(knownProviders, implProviders, _.isEqual);

	const injector = Injector.create([
		concreteProviders, implProviders, providers
	]);

	return injector.get(target);

}


function findParamTypes(target: Provide<any>): any[] {

	const value = Reflect.getMetadata('design:paramtypes', target.provide);
	if (!value) return [];

	const ownTypes = value.map(provide => {
		target.deps.push(provide);
		return { provide, useClass: provide, deps: [] }
	});
	const subTypes = _.flatMap(ownTypes, findParamTypes);

	return ownTypes.concat(subTypes);

}


function getImplClasses<T>(target: Provide<T>) {

	const value = Reflect.getMetadata(COMPONENT, target.provide);
	if (!value) return [];

	const metadata = value as ComponentMetadata;
	return metadata.implClasses;

}

function createProvider<T>(child: Type<T>) {
	const parent = Object.getPrototypeOf(child);
	return { provide: parent, useClass: child, deps: [] };
}