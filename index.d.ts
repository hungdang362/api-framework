import { Cookie, CookieAttr } from "cookies";
import { CookieOptions } from "express";

declare namespace framework {

    enum Environment {
        PROD = 'prod',
        DEV = 'dev',
        LOCAL = 'local',
        STAGING = 'staging',
        TEST = 'test',
        DEBUG = 'debug'
    }

    enum LogLevel {
        INFO = 'info',
        ERROR = 'error',
        DEBUG = 'debug',
        WARN = 'warn',
        VERBOSE = 'verbose'
    }

    abstract class MessageBroker {

        abstract connect(): Promise<boolean>;
        abstract disconnect(): Promise<boolean>;

        abstract pub(to, content): boolean;
        abstract sub(name: string, consume?: ConsumeCallback): Promise<MessageBroker>;

        /** Route feature only for RabbitMQ  */
        abstract router(name: string, type: string, options?: any): Promise<MessageBroker>;
        abstract routing(src: string, dest: DestRouter, pattern?: string, options?: Object): Promise<MessageBroker>;
    }

    interface DestRouter {
        type: string;
        name: string;
    }

    interface ConsumeCallback {
        (msg: any): void
    }

    function ConfigFactory(path: string);

    abstract class ConfigContract {

        source: {
            path: string;
        }

        name: string;

        env: Environment;

        log: {
            level?: string;
        }

        listen: {
            host: string;
            addr: string;
            port: number;
        }

        registry: {
            broker: {
                dialect: 'rabbitmq' | 'kafka',
                enabled: boolean,
                options?: {
                    username: string,
                    password: string,
                    hostname: string,
                    port: number,
                    exchange: string,
                    type: string,
                }
            },
            eureka: {
                enabled: boolean,
                server: {
                    host: string;
                    port: number;
                    proto: string;
                },
                instance: {
                    host?: string;
                    addr?: string;
                    port?: number;
                    renewalIntervalInSecs?: number;
                    durationInSecs?: number;
                    registryFetchInterval?: number;
                }
            },
            configuration: {
                host: string;
                port: number;
                label: string;
                profiles: string[];
            }
        }

        sequelize: {
            database: string;
            username: string;
            password: string;
            options: any;
        }

        database: {
            host: string;
            port: number;
            name: string;
            username: string;
            password: string;
            options?: any;
        }

    }

    interface JsonLogger {
        debug(message: any);
        info(message: any);
        warn(message: any);
        error(message: any);
    }

    interface Service {
        get(service: string, option?: Option);
        post(service: string, option?: Option);
        put(service: string, option?: Option);
        delete(service: string, option?: Option);
        patch(service: string, option?: Option);
        delete(service: string, option?: Option);
        option(service: string, option?: Option);
    }

    interface Option {
        data?: any;
        params?: any;
        headers?: any;
        timeout?: number;
        auth?: any;
    }

    interface EurekaClient {
        constructor(config: any)
        start(): void;
        stop(): void;
        getInstancesByAppId(appId: string): string[];
        getInstancesByVipAddress(vidAddress: string): string[];
    }

    function bootstrap(target: any, providers: any[]);

    function autoInject(target);

    function injector();

    interface Context {

        req: object | any;
        res: object | any;
        respond: boolean;

        request: IRequest;
        response: Response;

        params: any;

        cookies: Cookies;
        state: any;

        throw(status: number): never;

        header: any;

        hostname: string;

        method: string;
        path: string;
        query: any;

        get(field: string): string;
        is(...types: string[]): string | false;

        body: any;
        status: number;
        type: string;

        set(field: string, value: string): void;

    }

    interface Cookies {
        get(name: string, options?: CookieAttr)
        set(name: string, value: any, options?: CookieOptions)
    }

    interface IRequest extends Request {
        query: any;
        body: any;
    }

    interface Next {
        (): Promise<void>;
    }

    interface Middleware {
        (context: Context, next: Next): Promise<void>;
    }

    class RabbitMQ {
        connect();
        disconnect();
        sub(queue, pattern);
        pub(to, message);
    }

    abstract class Logger {

        public filename: string;

        abstract debug(message: any): void;
        abstract info(message: any): void;
        abstract warn(message: any): void;
        abstract error(message: any): void;

        query(options: any);
    }

    abstract class JsonLogger extends Logger { }
    abstract class WinstonLogger extends Logger { }
    abstract class TextLogger extends Logger { }

    abstract class Storage {
        readonly namespace: any;

        abstract get(key: string | symbol);
        abstract set(key: string | symbol, value: any);
        abstract run(fn: () => Promise<void>);
    }

    function component(metadata: any);

    class Koa {
        use(middleware: any);
        listen(port?: number);
    }

    abstract class Router {
        middleware();
        register(controller);
    }

    namespace Command {

        interface Static<T> {
            new(...args): T;
            readonly name?: string;
            readonly SCHEMA_FILE: string;
        }

        interface Handler<T> {
            (command: T): Promise<any>;
        }

        interface Callback {
            (error: boolean, msg: string): void
        }

    }

    interface Payload {
        app: string,
        command: string | Object,
        agruments: Object
    }

    abstract class CommandBus {

        protected schemaPath: string;

        protected readonly workers: Map<any, Worker>;

        abstract setSchemaPath(schemaPath: string);

        abstract resolve(): Promise<void>

        abstract register<T>(type: Command.Static<T>, handler: Command.Handler<T>);

        abstract execute(command: any, callback?: Command.Callback): Promise<any>;
    }

    abstract class SchemaCommandBus extends CommandBus { }
    abstract class SchemaBrokerBus extends CommandBus {
        publish(payload: Payload);
    }

    function retry<T>(fn: () => Promise<T>, options: RetryOptionDict): Promise<T>

    interface RetryOptionDict {
        readonly logger: Logger;
        readonly condition: string;
        readonly delayTime: (attempt: number) => number;
        readonly maxAttempts: number;
    }

    function sandBox(): boolean;

    namespace HttpMetadata {
        function get(target): Annotation[];

        interface Annotation {
            httpMethod: string;
            routePath: string;
            property: any;
        }
    }

    namespace Http {
        function get(path);
        function del(path);
        function patch(path);
        function post(path);
        function put(path);
        function all(path);
    }

    function Controller(prefix?: string)

    namespace Prefix {
        function set(target, path);
        function get(target);
    }

    class Unauthorized { }
    class Forbidden { }
    class NotFound { }
    class InvalidCommand { }

}

export = framework