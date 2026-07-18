import express from 'express';
import { loginAdmin } from '../controllers/auth.controller.js';

const authRouter = express.Router();

authRouter.post('/login', loginAdmin);

export default authRouter;
