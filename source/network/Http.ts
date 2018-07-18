/// <reference types="reflect-metadata" />

const HTTP_LIST = Symbol('http:list');


interface Annotation {
    httpMethod: string;
    routePath: string;
    property: any;
}

function create(httpMethod: string) {

    return function factory(routePath: string) {

        return function annotate(target, property) {

            const value = Reflect.getMetadata(HTTP_LIST, target);
            const list = value as Annotation[] || [];

            list.push({ httpMethod, routePath, property });
            Reflect.defineMetadata(HTTP_LIST, list, target);

        };

    };

}

const Http = {
    get: create('get'),
    post: create('post'),
    patch: create('patch'),
    put: create('put'),
    del: create('delete'),
    all: create('all')
};


const HttpMetadata = {

    get(target): Annotation[] {
        return Reflect.getMetadata(HTTP_LIST, target);
    }

};


export { Http, HttpMetadata };