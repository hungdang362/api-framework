function exportAll(module) {
    module = require(module);
    for (const name in module) {
        if (!exports.hasOwnProperty(name)) exports[name] = module[name];
    }
}

exportAll('./dist/system/BaseError');
exportAll('./dist/system/Injection');
exportAll('./dist/system/Logger');
exportAll('./dist/system/Retry');
exportAll('./dist/system/Storage');
exportAll('./dist/system/Util');

exportAll('./dist/system/impl/JsonLogger');
exportAll('./dist/system/impl/TextLogger');
exportAll('./dist/system/impl/WinstonLogger');

exportAll('./dist/network/Http');

exportAll('./dist/network/Error');
exportAll('./dist/network/Koa');
exportAll('./dist/network/Router');

exportAll('./dist/cqrs/CommandBus');
exportAll('./dist/cqrs/InvalidCommand');

exportAll('./dist/cqrs/impl/SchemaCommandBus');
exportAll('./dist/cqrs/impl/SchemaBrokerBus');

exportAll('./dist/config/ConfigFactory');
exportAll('./dist/config/ConfigContract');

exportAll('./dist/lib/message/impl/RabbitMQ');
exportAll('./dist/lib/message/MessageBroker');

exportAll('./dist/system/Controller');