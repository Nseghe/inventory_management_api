import { Router } from 'express';
import { getItemQuantity, addItems, sellItems } from './Items';



// Item-routes
const itemRouter = Router();
itemRouter.get('/:item/quantity', getItemQuantity);
itemRouter.post('/:item/add', addItems);
itemRouter.post('/:item/sell', sellItems);


// Export the base-router
const baseRouter = Router();
baseRouter.use('/', itemRouter);
export default baseRouter;
