import StatusCodes from 'http-status-codes';
import { Request, Response } from 'express';

import ItemDao, { IItemDao } from '@daos/Item/ItemDao';
import ItemLot, { IItemLot } from '@entities/ItemLot';
import { errorMessages } from '@shared/constants';
import logger from '@shared/Logger';

const itemDao: IItemDao = new ItemDao();
const { 
    OK,
    CREATED,
    BAD_REQUEST,
    UNPROCESSABLE_ENTITY,
    INTERNAL_SERVER_ERROR
} = StatusCodes;


/**
 * Get items.
 * 
 * @param req 
 * @param res 
 * @returns 
 */
export async function getItemQuantity(req: Request, res: Response) {
    const loggerPrefix = 'ItemRoutes.getItemQuantity: ';
    const item: string = req.params.item;
    logger.info(`${loggerPrefix}Getting quantity of ${item}`);
    try {
        const itemLot: IItemLot = await itemDao.getQuantity(item);
        const quantity: number = itemLot.quantity;
        const validTill: number | null = itemLot.expiry;
        logger.info(`${loggerPrefix}Quantity of ${item} is ${quantity} units, valid till ${validTill}`);
        return res.status(OK).json({
            quantity: quantity,
            validTill: validTill ? validTill : null
        });
    } catch (err) {
        const errorMessage = `${loggerPrefix}Error while getting item quantity`;
        logger.err(errorMessage);
        return res.status(INTERNAL_SERVER_ERROR).json({
            error: errorMessages.uanbleToCompleteRequest
        });
    }
    
}


/**
 * Add items.
 * 
 * @param req 
 * @param res 
 * @returns 
 */
export async function addItems(req: Request, res: Response) {
    const loggerPrefix = 'ItemRoutes.addItems: ';
    const item: string = req.params.item;
    const { quantity, expiry } = req.body;
    if (!(quantity && Number.isInteger(quantity) && quantity > 0)) {
        return res.status(BAD_REQUEST).json({
            error: errorMessages.missingParamQuantity,
        });
    }
    if (!(expiry && Number.isInteger(expiry))) {
        return res.status(BAD_REQUEST).json({
            error: errorMessages.missingParamExpiry,
        });
    }

    logger.info(`${loggerPrefix}Adding ${quantity} units of ${item}, valid till ${expiry}`);
    const itemLot: IItemLot = new ItemLot(item, quantity, expiry);
    try {
        await itemDao.add(itemLot);
        logger.info(`${loggerPrefix}Added ${quantity} units of ${item}`);
        return res.status(CREATED).end();
    } catch (err) {
        const errorMessage = `${loggerPrefix}Error while adding item`;
        logger.err(errorMessage);
        return res.status(INTERNAL_SERVER_ERROR).json({
            error: errorMessages.uanbleToCompleteRequest
        });
    }
}


/**
 * Sell items.
 * 
 * @param req 
 * @param res 
 * @returns 
 */
export async function sellItems(req: Request, res: Response) {
    const loggerPrefix = 'ItemRoutes.sellItems: ';
    const item: string = req.params.item;
    const { quantity } = req.body;
    if (!(quantity && Number.isInteger(quantity) && quantity > 0)) {
        return res.status(BAD_REQUEST).json({
            error: errorMessages.missingParamQuantity,
        });
    }
    logger.info(`${loggerPrefix}Selling ${quantity} units of ${item}`);
    const itemLot: IItemLot = new ItemLot(item, quantity, null);
    try {
        await itemDao.sell(itemLot);
        logger.info(`${loggerPrefix}Sold ${quantity} units of ${item}`);
        return res.status(OK).end();
    } catch (err) {
        const errorMessage = `${loggerPrefix}Error while selling item`;
        logger.err(errorMessage);
        if ((err as any).message === errorMessages.insufficientQuantity) {
            return res.status(UNPROCESSABLE_ENTITY).json({
                error: errorMessages.insufficientQuantity
            });
        } else {
            return res.status(INTERNAL_SERVER_ERROR).json({
                error: errorMessages.uanbleToCompleteRequest
            });
        }
    }
}
