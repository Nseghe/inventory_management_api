import supertest from 'supertest';
import StatusCodes from 'http-status-codes';
import { SuperTest, Test } from 'supertest';
import Logger from 'jet-logger';

import app from '@server';
import ItemDao from '@daos/Item/ItemDao';
import ItemLot, { IItemLot } from '@entities/ItemLot';
import { errorMessages } from '@shared/constants';
import APIError, { IAPIError } from '@entities/apiError';
import { IReqBody, IResponse } from '../support/types';




describe('Items Routes', () => {

    const itemsPath: string = '/foo';
    const itemQuantityPath: string = `${itemsPath}/quantity`;
    const addItemsPath: string = `${itemsPath}/add`;
    const sellItemsPath: string = `${itemsPath}/sell`;

    const {
        OK,
        CREATED,
        BAD_REQUEST,
        UNPROCESSABLE_ENTITY,
        INTERNAL_SERVER_ERROR
    } = StatusCodes;
    let agent: SuperTest<Test>;

    beforeAll((done) => {
        agent = supertest.agent(app);
        done();
    });

    describe(`"GET:${itemQuantityPath}"`, () => {

        it(`should return a JSON object with the item quantity and expiry and a status code of "${OK}" if the
            request was successful.`, (done) => {
            // Arrange
            const item: string = 'foo';
            const quantity: number = 20;
            const expiry: number = 100;
            const itemLot: IItemLot = new ItemLot(item, quantity, expiry);
            spyOn(ItemDao.prototype, 'getQuantity').and.returnValue(Promise.resolve(itemLot));
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            agent.get(itemQuantityPath)
            // Assert
                .end((err: Error, res: IResponse) => {
                    expect(res.status).toBe(OK);
                    expect(res.body.quantity).toEqual(quantity);
                    expect(res.body.validTill).toEqual(expiry);
                    expect(res.body.error).toBeUndefined();
                    done();
                });
        });

        it(`should return a JSON object with an error and a status code of "${INTERNAL_SERVER_ERROR}" if the
            request was unsuccessful.`, (done) => {
            // Arrange
            spyOn(ItemDao.prototype, 'getQuantity').and.throwError('');
            spyOn(Logger.prototype, 'err').and.returnValue(undefined);
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            agent.get(itemQuantityPath)
            // Assert
                .end((err: Error, res: IResponse) => {
                    expect(Logger.prototype.err).toHaveBeenCalledTimes(1);
                    expect(res.status).toBe(INTERNAL_SERVER_ERROR);
                    expect(res.body.error).toBe(errorMessages.uanbleToCompleteRequest);
                    done();
                });
        });
    });


    describe(`"POST:${addItemsPath}"`, () => {

        it(`should return an empty response and a status code of "${OK}" if the
            request was successful.`, (done) => {
            // Arrange
            const reqBody: IReqBody = { quantity: 20, expiry: 100 }
            spyOn(ItemDao.prototype, 'add').and.returnValue(Promise.resolve());
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            agent.post(addItemsPath).send(reqBody)
            // Assert
                .end((err: Error, res: IResponse) => {
                    expect(res.status).toBe(CREATED);
                    expect(res.body).toEqual(Object({}));
                    done();
                });
        });

        it(`should return a response with an error and a status code of "${BAD_REQUEST}" if the
            request body does not contain a expiry value.`, (done) => {
            // Arrange
            const reqBody: IReqBody = { quantity: 20 }
            spyOn(ItemDao.prototype, 'add').and.returnValue(Promise.resolve());
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            agent.post(addItemsPath).send(reqBody)
            // Assert
                .end((err: Error, res: IResponse) => {
                    expect(res.status).toBe(BAD_REQUEST);
                    expect(res.body.error).toBe(errorMessages.missingParamExpiry);
                    done();
                });
        });

        it(`should return a response with an error and a status code of "${BAD_REQUEST}" if the
            request body contains a non-integer expiry value.`, (done) => {
            // Arrange
            const reqBody: IReqBody = { quantity: 20, expiry: '100' }
            spyOn(ItemDao.prototype, 'add').and.returnValue(Promise.resolve());
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            agent.post(addItemsPath).send(reqBody)
            // Assert
                .end((err: Error, res: IResponse) => {
                    expect(res.status).toBe(BAD_REQUEST);
                    expect(res.body.error).toBe(errorMessages.missingParamExpiry);
                    done();
                });
        });

        it(`should return a response with an error and a status code of "${BAD_REQUEST}" if the
            request body does not contain a quantity value.`, (done) => {
            // Arrange
            const reqBody: IReqBody = { expiry: 100 }
            spyOn(ItemDao.prototype, 'add').and.returnValue(Promise.resolve());
            spyOn(Logger.prototype, 'err').and.returnValue(undefined);
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            agent.post(addItemsPath).send(reqBody)
            // Assert
                .end((err: Error, res: IResponse) => {
                    expect(res.status).toBe(BAD_REQUEST);
                    expect(res.body.error).toBe(errorMessages.missingParamQuantity);
                    done();
                });
        });

        it(`should return a response with an error and a status code of "${BAD_REQUEST}" if the
            request body contains a non-integer quantity value.`, (done) => {
            // Arrange
            const reqBody: IReqBody = { quantity: '20', expiry: 100 }
            spyOn(ItemDao.prototype, 'add').and.returnValue(Promise.resolve());
            spyOn(Logger.prototype, 'err').and.returnValue(undefined);
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            agent.post(addItemsPath).send(reqBody)
            // Assert
                .end((err: Error, res: IResponse) => {
                    expect(res.status).toBe(BAD_REQUEST);
                    expect(res.body.error).toBe(errorMessages.missingParamQuantity);
                    done();
                });
        });

        it(`should return a response with an error and a status code of "${BAD_REQUEST}" if the
            request body contains an integer quantity value less than zero.`, (done) => {
            // Arrange
            const reqBody: IReqBody = { quantity: -20, expiry: 100 }
            spyOn(ItemDao.prototype, 'add').and.returnValue(Promise.resolve());
            spyOn(Logger.prototype, 'err').and.returnValue(undefined);
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            agent.post(addItemsPath).send(reqBody)
            // Assert
                .end((err: Error, res: IResponse) => {
                    expect(res.status).toBe(BAD_REQUEST);
                    expect(res.body.error).toBe(errorMessages.missingParamQuantity);
                    done();
                });
        });

        it(`should return a JSON object with an error and a status code of "${INTERNAL_SERVER_ERROR}" if the
            request was unsuccessful.`, (done) => {
            // Arrange
            const reqBody: IReqBody = { quantity: 20, expiry: 100 }
            spyOn(ItemDao.prototype, 'add').and.throwError('');
            spyOn(Logger.prototype, 'err').and.returnValue(undefined);
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            agent.post(addItemsPath).send(reqBody)
            // Assert
                .end((err: Error, res: IResponse) => {
                    expect(Logger.prototype.err).toHaveBeenCalledTimes(1);
                    expect(res.status).toBe(INTERNAL_SERVER_ERROR);
                    expect(res.body.error).toBe(errorMessages.uanbleToCompleteRequest);
                    done();
                });
        });
    });


    describe(`"POST:${sellItemsPath}"`, () => {

        it(`should return an empty response and a status code of "${OK}" if the
            request was successful.`, (done) => {
            // Arrange
            const reqBody: IReqBody = { quantity: 20 }
            spyOn(ItemDao.prototype, 'sell').and.returnValue(Promise.resolve());
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            agent.post(sellItemsPath).send(reqBody)
            // Assert
                .end((err: Error, res: IResponse) => {
                    expect(res.status).toBe(OK);
                    expect(res.body).toEqual(Object({}));
                    done();
                });
        });

        
        it(`should return a response with an error and a status code of "${BAD_REQUEST}" if the
            request body does not contain a quantity value.`, (done) => {
            // Arrange
            const reqBody: IReqBody = {}
            spyOn(ItemDao.prototype, 'sell').and.returnValue(Promise.resolve());
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            agent.post(sellItemsPath).send(reqBody)
            // Assert
                .end((err: Error, res: IResponse) => {
                    expect(res.status).toBe(BAD_REQUEST);
                    expect(res.body.error).toBe(errorMessages.missingParamQuantity);
                    done();
                });
        });

        it(`should return a response with an error and a status code of "${BAD_REQUEST}" if the
            request body contains a non-integer quantity value.`, (done) => {
            // Arrange
            const reqBody: IReqBody = { quantity: '20' }
            spyOn(ItemDao.prototype, 'sell').and.returnValue(Promise.resolve());
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            agent.post(sellItemsPath).send(reqBody)
            // Assert
                .end((err: Error, res: IResponse) => {
                    expect(res.status).toBe(BAD_REQUEST);
                    expect(res.body.error).toBe(errorMessages.missingParamQuantity);
                    done();
                });
        });

        it(`should return a response with an error and a status code of "${BAD_REQUEST}" if the
            request body contains an integer quantity value less than zero.`, (done) => {
            // Arrange
            const reqBody: IReqBody = { quantity: -20 }
            spyOn(ItemDao.prototype, 'sell').and.returnValue(Promise.resolve());
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            agent.post(sellItemsPath).send(reqBody)
            // Assert
                .end((err: Error, res: IResponse) => {
                    expect(res.status).toBe(BAD_REQUEST);
                    expect(res.body.error).toBe(errorMessages.missingParamQuantity);
                    done();
                });
        });

        it(`should return a JSON object with an error and a status code of "${UNPROCESSABLE_ENTITY}" if the
            request was unsuccessful due to insufficient item quantity.`, (done) => {
            // Arrange
            const reqBody: IReqBody = { quantity: 20 };
            const error: IAPIError = new APIError(errorMessages.insufficientQuantity)
            spyOn(ItemDao.prototype, 'sell').and.throwError(error);
            spyOn(Logger.prototype, 'err').and.returnValue(undefined);
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            agent.post(sellItemsPath).send(reqBody)
            // Assert
                .end((err: Error, res: IResponse) => {
                    expect(Logger.prototype.err).toHaveBeenCalledTimes(1);
                    expect(res.status).toBe(UNPROCESSABLE_ENTITY);
                    expect(res.body.error).toBe(errorMessages.insufficientQuantity);
                    done();
                });
        });

        it(`should return a JSON object with an error and a status code of "${INTERNAL_SERVER_ERROR}" if the
            request was unsuccessful for any other reason.`, (done) => {
            // Arrange
            const reqBody: IReqBody = { quantity: 20 };
            spyOn(ItemDao.prototype, 'sell').and.throwError('');
            spyOn(Logger.prototype, 'err').and.returnValue(undefined);
            spyOn(Logger.prototype, 'info').and.returnValue(undefined);
            // Act
            agent.post(sellItemsPath).send(reqBody)
            // Assert
                .end((err: Error, res: IResponse) => {
                    expect(Logger.prototype.err).toHaveBeenCalledTimes(1);
                    expect(res.status).toBe(INTERNAL_SERVER_ERROR);
                    expect(res.body.error).toBe(errorMessages.uanbleToCompleteRequest);
                    done();
                });
        });
    });
});
