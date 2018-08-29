import { ConfigContract } from '../../config/ConfigContract';

export abstract class MessageBroker {

    constructor(readonly config: ConfigContract) { };

    abstract connect(): Promise<boolean>;
    abstract disconnect(): Promise<boolean>;

    abstract pub(to, content, router?: string): boolean;
    abstract sub(option: SubOption): Promise<MessageBroker>;

    /** Route feature only for RabbitMQ  */
    abstract router(option: RouterOption): Promise<MessageBroker>;
    abstract routing(option: RoutingOption): Promise<MessageBroker>;
}

export interface Node {
    type: string;
    name: string;
}

export interface SubOption {
    name: string,
    consume: ConsumeCallback
}

export interface ConsumeCallback {
    (msg: any): void
}

export interface RouterOption {
    name: string,
    type: string,
    options?: any
}

export interface RoutingOption {
    src: Node,
    dest: Node,
    pattern?: string,
    options?: any
}

export enum Status {
    CONNECTED = 'connected',
    CLOSED = 'closed'
}