import { EnvironmentConfigs } from './Config';
import { Injector } from './Injector';
import { Logger } from './Logger';

const configs = new EnvironmentConfigs();
const logger = new Logger(configs.log);
const injector = new Injector(configs, logger);
const app = injector.createApplication();

process.on('SIGINT', () => {
    logger.info('Received signal SIGINT');
    app.stop(() => {
        process.exit(0);
    });
});
process.on('SIGTERM', () => {
    logger.info('Received signal SIGTERM');
    app.stop(() => {
        process.exit(0);
    });
});

app.startExtractionProcess();

module.exports = app;
