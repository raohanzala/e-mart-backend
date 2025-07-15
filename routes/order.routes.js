import express from 'express'
import { allOrders, userOrders, updateStatus, paginationOrders, singleOrder, ordersDetails, deleteOrder, guestPlaceOrder, findGuestOrders } from '../controllers/order.controller.js'
import adminAuth from '../middleware/adminAuth.js'
import authUser from '../middleware/auth.js'


const orderRouter = express.Router()

orderRouter.post('/list', adminAuth, allOrders)
orderRouter.delete("/order/:orderId", deleteOrder);
orderRouter.get('/orders', adminAuth, paginationOrders)
orderRouter.post('/orderstatus', adminAuth, updateStatus)
orderRouter.get('/singleOrder/:orderId', adminAuth, singleOrder)
orderRouter.get('/ordersDetails', adminAuth, ordersDetails)

orderRouter.post('/guest-place', guestPlaceOrder)
orderRouter.post('/guest-orders', findGuestOrders)
orderRouter.get('/userorders', authUser, userOrders)


export default orderRouter