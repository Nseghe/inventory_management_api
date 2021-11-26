import pg from 'pg';

import dBConnectionPool from '@db/connection';
import ItemLot, { IItemLot } from '@entities/ItemLot';
import APIError, { IAPIError } from '@entities/apiError';
import { errorMessages, errorCodes, itemsQueries, retryParams } from '@shared/constants';
import logger from '@shared/Logger';



export interface IItemDao {
    getQuantity: (item: string) => Promise<IItemLot>;
    add: (itemLot: ItemLot) => Promise<void>;
    sell: (itemLot: ItemLot) => Promise<void | string>;
}

class ItemDao implements IItemDao {


    /**
     * @param item
     * @return Promise<IItemLot>
     */
    public async getQuantity(item: string): Promise<IItemLot> {
        const loggerPrefix = 'ItemDao.getQuantity: ';
        const getItemParams: Array<string> = [item];
        logger.info(`${loggerPrefix}Getting quantity of ${item} from database`)
        try {
            const results: pg.QueryResult = await dBConnectionPool.query(
                                                itemsQueries.getItemQuery,
                                                getItemParams
                                            );
            const itemLot: IItemLot = new ItemLot(
                item,
                Number(results.rows[0].total_quantity),
                Number(results.rows[0].valid_until)
            );
            return Promise.resolve(itemLot);
        } catch (err) {
            const errorMessage = `${loggerPrefix}Database connection error.`;
            logger.err(errorMessage);
            logger.err(err, true);
            const apiError: IAPIError = new APIError(errorMessages.dbQueryFailure);
            return Promise.reject(apiError);
        }
    }


    /**
     *
     * @param itemLot
     * @return Promise<void>
     */
    public async add(itemLot: ItemLot): Promise<void> {
        const loggerPrefix = 'ItemDao.add: ';
        const addItemsParams: Array<string | number> = [itemLot.item, itemLot.quantity, Number(itemLot.expiry)];
        logger.info(`${loggerPrefix}Adding ${itemLot.quantity} units of ${itemLot.item} to database, valid till ${itemLot.expiry}`);
        try {
            await dBConnectionPool.query(itemsQueries.addItemsQuery, addItemsParams);
            return Promise.resolve();
        } catch (err) {
            const errorMessage = `${loggerPrefix}Database connection error.`;
            logger.err(errorMessage);
            logger.err(err, true);
            const apiError: IAPIError = new APIError(errorMessages.dbQueryFailure);
            return Promise.reject(apiError);
        }
    }

    /**
     *
     * @param itemLot
     * @return Promise<void>
     */
    public async sell(itemLot: ItemLot): Promise<void> {
        const loggerPrefix = 'ItemDao.sell: ';
        const getItemQuantityParams: Array<string> = [itemLot.item];
        const getFirstItemParams: Array<string> = [itemLot.item];
        let retries: number = retryParams.dBQueryMaxRetries;
        let multiplier: number = retryParams.multiplier;
        let timeout: number = retryParams.timeout;
        logger.info(`${loggerPrefix}Selling ${itemLot.quantity} units of ${itemLot.item} from database`);
        while (retries > 0) {
            try {
                /* 
                    Begin transaction with isolation level set to repeatable read
                    (to properly handle concurrency while retaining reasonable performance)
                */
                await dBConnectionPool.query(itemsQueries.beginTransactionQuery);
                const quantityAvailable: pg.QueryResult = await dBConnectionPool.query(
                                                                itemsQueries.getItemQuantityQuery,
                                                                getItemQuantityParams
                                                            );
                if (quantityAvailable.rows[0].total_quantity < itemLot.quantity) {
                    await dBConnectionPool.query(itemsQueries.rollbackTransactionQuery);
                    const errorMessage = errorMessages.insufficientQuantity;
                    logger.warn(loggerPrefix + errorMessage);
                    const apiError: IAPIError = new APIError(errorMessage);
                    return Promise.reject(apiError);
                }
                let sellQuantity: number = itemLot.quantity;
                while (sellQuantity > 0) {
                    const results: pg.QueryResult = await dBConnectionPool.query(
                                                        itemsQueries.getFirstItemQuery,
                                                        getFirstItemParams
                                                    );
                    if (sellQuantity >= results.rows[0].quantity) {
                        const deleteItemParams: Array<number> = [results.rows[0].id];
                        sellQuantity -= results.rows[0].quantity;
                        await dBConnectionPool.query(itemsQueries.deleteItemQuery, deleteItemParams)
                    } else {
                        const newItemQuantity: number = results.rows[0].quantity - sellQuantity;
                        const updateItemQuantityParams: Array<number> = [results.rows[0].id, newItemQuantity];
                        sellQuantity = 0;
                        await dBConnectionPool.query(itemsQueries.updateItemQuantityQuery, updateItemQuantityParams)
                    }
                }
                await dBConnectionPool.query(itemsQueries.commitTransactionQuery);
                return Promise.resolve();
            } catch (err) {
                const errorMessage = `${loggerPrefix}Database connection error.`;
                logger.err(errorMessage);
                logger.err(err, true);
                if (this._shouldRetryTransaction(err)) {
                    retries -= 1;
                    logger.warn(`${loggerPrefix}Attempt ${retryParams.dBQueryMaxRetries - retries} failed`);
                    logger.info(`${loggerPrefix}Will retry ${retries} more times`);
                    timeout *= multiplier;
                    await new Promise(resolve => setTimeout(resolve, timeout));
                } else {
                    const apiError: IAPIError = new APIError(errorMessages.dbQueryFailure);
                    return Promise.reject(apiError);
                }
            }
        }
        const apiError: IAPIError = new APIError(errorMessages.dbQueryFailure);
        return Promise.reject(apiError);
    }

    /*
        Retry transaction in case of serialization errors (codes 40001 and 40P01)
        due to strict repeatable read transaction isolation level
    */ 
    private _shouldRetryTransaction(err: unknown) {
        const code = typeof err === 'object' ? String((err as any).code) : null
        return code === errorCodes.pgConcurrentTransaction ||
            code === errorCodes.pgDeadlock;
    }
}

export default ItemDao;
