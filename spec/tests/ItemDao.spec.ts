import Logger from 'jet-logger';
import pg from 'pg';

import ItemDao, {IItemDao} from '@daos/Item/ItemDao';
import ItemLot, { IItemLot } from '@entities/ItemLot';
import { errorCodes, errorMessages, itemsQueries, retryParams } from '@shared/constants';
import dBConnectionPool from '@db/connection';
import APIError, { IAPIError } from '@entities/apiError';
import PgError, { IPgError } from '../support/entities';


const { Pool } = pg;


describe('Item Dao', () => {

    const item: string = 'foo';
    const itemDao: IItemDao = new ItemDao();


    describe(`getQuantity`, () => {
        
        const queryReturnValue: pg.QueryResult = { 
            rows: [ { total_quantity: 20, valid_until: 100 } ],
            oid: 1,
            fields: [],
            command: '',
            rowCount: 1
        };

        it(`invokes the getItemQuery with the correct parameters`, async () => {
            // Arrange
            spyOn(dBConnectionPool, 'query').and.returnValue(Promise.resolve(queryReturnValue));
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            await itemDao.getQuantity(item);
            // Assert
            expect(dBConnectionPool.query).toHaveBeenCalledOnceWith(itemsQueries.getItemQuery, [item]);
        });

        it(`Returns the correct results`, async () => {
            // Arrange
            spyOn(dBConnectionPool, 'query').and.returnValue(Promise.resolve(queryReturnValue));
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            const results = await itemDao.getQuantity(item);
            // Assert
            expect(results.item).toEqual(item);
            expect(results.quantity).toEqual(20);
            expect(results.expiry).toEqual(100);
        });

        it(`throws the dbQueryFailure error when DB query returns an error`, async () => {
            // Arrange
            spyOn(dBConnectionPool, 'query').and.throwError('');
            spyOn(Logger.prototype, 'err').and.returnValue(undefined);
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            try {
                const results = await itemDao.getQuantity(item);
            }
            // Assert
            catch (err) {
                expect(Logger.prototype.err).toHaveBeenCalledTimes(2);
                expect((err as IAPIError).message).toEqual(errorMessages.dbQueryFailure);
            }
        });
    });

    
    describe(`add`, () => {
        
        const itemLot: IItemLot = new ItemLot(item, 20, 100);
        const addItemsParams = [itemLot.item, itemLot.quantity, Number(itemLot.expiry)];
        const queryReturnValue: pg.QueryResult = { 
            rows: [],
            oid: 1,
            fields: [],
            command: '',
            rowCount: 0
        };

        it(`invokes the addItemsQuery with the correct parameters`, async () => {
            // Arrange
            spyOn(dBConnectionPool, 'query').and.returnValue(Promise.resolve(queryReturnValue));
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            await itemDao.add(itemLot);
            // Assert
            expect(dBConnectionPool.query).toHaveBeenCalledOnceWith(itemsQueries.addItemsQuery, addItemsParams);
        });

        it(`Returns the correct results`, async () => {
            // Arrange
            spyOn(dBConnectionPool, 'query').and.returnValue(Promise.resolve(queryReturnValue));
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            const results = await itemDao.add(itemLot);
            // Assert
            expect(results).toBeUndefined();
        });

        it(`throws the dbQueryFailure error when DB query returns an error`, async () => {
            // Arrange
            spyOn(dBConnectionPool, 'query').and.throwError('');
            spyOn(Logger.prototype, 'err').and.returnValue(undefined);
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            try {
                await itemDao.add(itemLot);
            }
            // Assert
            catch (err) {
                expect(Logger.prototype.err).toHaveBeenCalledTimes(2);
                expect((err as IAPIError).message).toEqual(errorMessages.dbQueryFailure);
            }
        });
    });


    describe(`sell`, () => {
        
        const itemLot: IItemLot = new ItemLot(item, 20, 100);
        const queryReturnValue: pg.QueryResult = { 
            rows: [ { total_quantity: 20, valid_until: 100 } ],
            oid: 1,
            fields: [],
            command: '',
            rowCount: 0
        };
        const getItemQuantityParams: Array<string> = [item];
        const getFirstItemParams: Array<string> = [itemLot.item];

        it(`begins a repeatable read transaction`, async () => {
            // Arrange
            spyOn(dBConnectionPool, 'query').and.returnValue(Promise.resolve(queryReturnValue));
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            await itemDao.sell(itemLot);
            // Assert
            expect(dBConnectionPool.query).toHaveBeenCalledWith(itemsQueries.beginTransactionQuery);
        });

        it(`invokes the getItemQuantityQuery`, async () => {
            // Arrange
            spyOn(dBConnectionPool, 'query').and.returnValue(Promise.resolve(queryReturnValue));
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            await itemDao.sell(itemLot);
            // Assert
            expect(dBConnectionPool.query).toHaveBeenCalledWith(
                itemsQueries.getItemQuantityQuery,
                getItemQuantityParams
            );
        });

        it(`returns the insufficientQuantity error if the available quantity is less than the 
            requested quantity`, async () => {
            // Arrange
            const queryReturnValue: pg.QueryResult = { 
                rows: [ { total_quantity: 10, valid_until: 100 } ],
                oid: 1,
                fields: [],
                command: '',
                rowCount: 0
            };
            spyOn(dBConnectionPool, 'query').and.returnValue(Promise.resolve(queryReturnValue));
            spyOn(Logger.prototype, 'warn').and.returnValue(undefined);
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            try {
                await itemDao.add(itemLot);
            }
            // Assert
            catch (err) {
                expect(Logger.prototype.warn).toHaveBeenCalledTimes(2);
                expect((err as IAPIError).message).toEqual(errorMessages.insufficientQuantity);
            }
        });

        it(`rolls back the transaction if the available quantity is less than the requested quantity`, async () => {
            // Arrange
            const queryReturnValue: pg.QueryResult = { 
                rows: [ { total_quantity: 10, valid_until: 100 } ],
                oid: 1,
                fields: [],
                command: '',
                rowCount: 0
            };
            spyOn(dBConnectionPool, 'query').and.returnValue(Promise.resolve(queryReturnValue));
            spyOn(Logger.prototype, 'warn').and.returnValue(undefined);
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            try {
                await itemDao.add(itemLot);
            }
            // Assert
            catch (err) {
                expect(dBConnectionPool.query).toHaveBeenCalledWith(itemsQueries.rollbackTransactionQuery);
            }
        });

        it(`commits the transaction if all goes well`, async () => {
            // Arrange
            spyOn(dBConnectionPool, 'query').and.returnValue(Promise.resolve(queryReturnValue));
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            await itemDao.sell(itemLot);
            // Assert
            expect(dBConnectionPool.query).toHaveBeenCalledWith(itemsQueries.commitTransactionQuery);
        });

        it(`Returns the correct results if all goes well`, async () => {
            // Arrange
            spyOn(dBConnectionPool, 'query').and.returnValue(Promise.resolve(queryReturnValue));
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            const results = await itemDao.sell(itemLot);
            // Assert
            expect(results).toBeUndefined();
        });

        it(`invokes the getFirstItemQuery when selling the required item quantity`, async () => {
            // Arrange
            const getFirstItemQueryReturnValue: pg.QueryResult = { 
                rows: [ { id: 1, quantity: 20, valid_until: 100 } ],
                oid: 1,
                fields: [],
                command: '',
                rowCount: 0
            };
            spyOn(dBConnectionPool, 'query')
            .withArgs(itemsQueries.getFirstItemQuery, getFirstItemParams)
            .and.returnValue(Promise.resolve(getFirstItemQueryReturnValue))
            .and.returnValue(Promise.resolve(queryReturnValue));
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            await itemDao.sell(itemLot);
            // Assert
            expect(dBConnectionPool.query).toHaveBeenCalledWith(
                itemsQueries.getFirstItemQuery,
                getFirstItemParams
            );
        });

        it(`invokes the deleteItemQuery when selling the required item quantity`, async () => {
            // Arrange
            const getFirstItemQueryReturnValue: pg.QueryResult = { 
                rows: [ { id: 1, quantity: 20, valid_until: 100 } ],
                oid: 1,
                fields: [],
                command: '',
                rowCount: 0
            };
            const deleteItemParams: Array<number> = [getFirstItemQueryReturnValue.rows[0].id];
            spyOn(dBConnectionPool, 'query')
            .withArgs(itemsQueries.getFirstItemQuery, getFirstItemParams)
            .and.returnValue(Promise.resolve(getFirstItemQueryReturnValue))
            .and.returnValue(Promise.resolve(queryReturnValue));
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            await itemDao.sell(itemLot);
            // Assert
            expect(dBConnectionPool.query).toHaveBeenCalledWith(
                itemsQueries.deleteItemQuery,
                deleteItemParams
            );
            // expect(dBConnectionPool.query).toHaveBeenCalledTimes(9)
        });

        it(`invokes the updateItemQuantityQuery when selling the required item quantity`,
            async () => {
            // Arrange
            const getFirstItemQueryReturnValue: pg.QueryResult = { 
                rows: [ { id: 1, quantity: 30, valid_until: 100 } ],
                oid: 1,
                fields: [],
                command: '',
                rowCount: 0
            };
            const updateItemQuantityParams: Array<number> = [
                getFirstItemQueryReturnValue.rows[0].id,
                getFirstItemQueryReturnValue.rows[0].quantity - itemLot.quantity
            ];
            spyOn(dBConnectionPool, 'query')
            .withArgs(itemsQueries.getFirstItemQuery, getFirstItemParams)
            .and.returnValue(Promise.resolve(getFirstItemQueryReturnValue))
            .and.returnValue(Promise.resolve(queryReturnValue));
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            await itemDao.sell(itemLot);
            // Assert
            expect(dBConnectionPool.query).toHaveBeenCalledWith(
                itemsQueries.updateItemQuantityQuery,
                updateItemQuantityParams
            );
        });

        it(`invokes the correct number of queries when selling the required item quantity`,
            async () => {
            // Arrange
            const getFirstItemQueryReturnValue: pg.QueryResult = { 
                rows: [ { id: 1, quantity: 9, valid_until: 100 } ],
                oid: 1,
                fields: [],
                command: '',
                rowCount: 0
            };
            spyOn(dBConnectionPool, 'query')
            .withArgs(itemsQueries.getFirstItemQuery, getFirstItemParams)
            .and.returnValue(Promise.resolve(getFirstItemQueryReturnValue))
            .and.returnValue(Promise.resolve(queryReturnValue));
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            await itemDao.sell(itemLot);
            // Assert
            expect(dBConnectionPool.query).toHaveBeenCalledTimes(9)
        });
        
        it(`retries transaction ${retryParams.dBQueryMaxRetries} times when the DB query returns a
            ${errorCodes.pgConcurrentTransaction} error`, async () => {
            // Arrange
            const error: IPgError = new PgError(errorCodes.pgConcurrentTransaction);
            spyOn(dBConnectionPool, 'query')
            .withArgs(itemsQueries.beginTransactionQuery)
            .and.returnValue(Promise.resolve(queryReturnValue))
            .withArgs(itemsQueries.getItemQuantityQuery, getItemQuantityParams)
            .and.returnValue(Promise.resolve(queryReturnValue))
            .and.throwError(error);
            spyOn(Logger.prototype, 'err').and.returnValue(undefined);
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            spyOn(Logger.prototype, 'warn').and.returnValue(undefined);
            // Act
            try {
                await itemDao.sell(itemLot);
            }
            // Assert
            catch (err) {
                expect(Logger.prototype.err).toHaveBeenCalledTimes(10);
                expect(dBConnectionPool.query).toHaveBeenCalledTimes(15);
            }
        });

        it(`retries transaction ${retryParams.dBQueryMaxRetries} times when the DB query returns a
            ${errorCodes.pgDeadlock} error`, async () => {
            // Arrange
            const error: IPgError = new PgError(errorCodes.pgDeadlock);
            spyOn(dBConnectionPool, 'query')
            .withArgs(itemsQueries.beginTransactionQuery)
            .and.returnValue(Promise.resolve(queryReturnValue))
            .withArgs(itemsQueries.getItemQuantityQuery, getItemQuantityParams)
            .and.returnValue(Promise.resolve(queryReturnValue))
            .and.throwError(error);
            spyOn(Logger.prototype, 'err').and.returnValue(undefined);
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            spyOn(Logger.prototype, 'warn').and.returnValue(undefined);
            // Act
            try {
                await itemDao.sell(itemLot);
            }
            // Assert
            catch (err) {
                expect(Logger.prototype.err).toHaveBeenCalledTimes(10);
                expect(dBConnectionPool.query).toHaveBeenCalledTimes(15);
            }
        });
        
        it(`retries transaction ${retryParams.dBQueryMaxRetries} times when the DB query returns a
            ${errorCodes.pgDeadlock} error`, async () => {
            // Arrange
            spyOn(dBConnectionPool, 'query')
            .withArgs(itemsQueries.beginTransactionQuery)
            .and.returnValue(Promise.resolve(queryReturnValue))
            .withArgs(itemsQueries.getItemQuantityQuery, getItemQuantityParams)
            .and.returnValue(Promise.resolve(queryReturnValue))
            .and.throwError('');
            spyOn(Logger.prototype, 'err').and.returnValue(undefined);
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            try {
                await itemDao.sell(itemLot);
            }
            // Assert
            catch (err) {
                expect(Logger.prototype.err).toHaveBeenCalledTimes(2);
                expect((err as IAPIError).message).toEqual(errorMessages.dbQueryFailure);
            }
        });
    });
});
