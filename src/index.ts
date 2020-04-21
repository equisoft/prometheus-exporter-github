import { EnvironmentConfigs } from './Config';
import { Injector } from './Injector';
import { Logger } from './Logger';

const logger = new Logger();
const injector = new Injector(new EnvironmentConfigs(), logger);
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
