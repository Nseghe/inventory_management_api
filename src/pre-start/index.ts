/**
 * Pre-start is where we want to place things that must run BEFORE the express server is started.
 * This is useful for environment variables, command-line arguments, and cron-jobs.
 */

import path from 'path';
import dotenv, { DotenvConfigOutput } from 'dotenv';
import commandLineArgs, { CommandLineOptions } from 'command-line-args';
import cron from 'node-cron';
import Logger from 'jet-logger';

import dBConnectionPool from '@db/connection';



// Setup logger
const logger = new Logger();
logger.timestamp = false;


(async () => {
    const loggerPrefix = 'Pre-start scripts: ';

    // Setup command line options
    const options: CommandLineOptions = commandLineArgs([
        {
            name: 'env',
            alias: 'e',
            defaultValue: 'development',
            type: String,
        },
    ]);

    // Set the env file
    const result: DotenvConfigOutput = dotenv.config({
        path: path.join(__dirname, `env/${options.env}.env`),
    });
    if (result.error) {
        logger.err(loggerPrefix + result.error);
        throw result.error;
    }

    /*
        Initialize the DB - Create items table
    */
    const createItemsTableQuery: string =
        `CREATE TABLE IF NOT EXISTS items (
            id          SERIAL      PRIMARY KEY,
            item        TEXT        NOT NULL,
            quantity    INT         NOT NULL,
            expiry      TIMESTAMP   NOT NULL
        )`;
    try {
        await dBConnectionPool.query(createItemsTableQuery);
    } catch (err) {
        const errorMessage = `${loggerPrefix}Error while creating items table.`;
        logger.err(errorMessage);
        logger.err(err, true);
        throw err;
    }

    // Schedule cron job to clear expired records from database daily
    const cleanDBQuery: string =
        `DELETE FROM items
         WHERE expiry < CURRENT_TIMESTAMP`;
    cron.schedule('59 23 * * *', async () => {
        try {
            await dBConnectionPool.query(cleanDBQuery);
        } catch (err) {
            const errorMessage = `${loggerPrefix}Error while clearing expired records from Database`;
            logger.err(errorMessage);
            logger.err(err, true);
        }
    });
})();
