import {Application} from "./Application";
import { Logger } from './Logger';
import { configs } from './Config';


const logger = new Logger();

const app = new Application(configs, logger);
app.start();
process.on('SIGINT', () => {
    logger.info('Received signal SIGINT');
    app.close(() => {
        process.exit(0);
    });
});
process.on('SIGTERM', () => {
    logger.info('Received signal SIGTERM');
    app.close(() => {
        process.exit(0);
    });
});

app.startExtractionProcess();

module.exports = app;
