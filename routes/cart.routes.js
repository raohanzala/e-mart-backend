import express from 'express'

import { addToCart, updateCart, getUserCart, mergeCart, removeFromCart } from '../controllers/cart.controller.js'
import authUser from '../middleware/auth.js'

const cartRouter = express.Router()

cartRouter.get('/get', authUser, getUserCart)
cartRouter.post('/add', authUser, addToCart)
cartRouter.post("/merge", authUser, mergeCart);
cartRouter.post('/update', authUser, updateCart)
cartRouter.post('/remove', authUser, removeFromCart);


export default cartRouter