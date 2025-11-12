import express from "express";
import * as authController from "../controllers/auth.controllers.ts";
import { celebrate, Joi, Segments } from "celebrate";
import path from "path";

const router = express.Router();

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,30}$/;

const createUserSchema = {
    [Segments.BODY]: Joi.object({
        name: Joi.string().required().min(3).max(8),
        email: Joi.string().email().required(),
        password: Joi.string().required().min(8).max(30).regex(strongPasswordRegex),
    })
}

router.post("/auth/register", celebrate(createUserSchema), authController.register);

router.post("/auth/signin", authController.login);

router.get("/home/products", authController.getProducts)

const publicDirectoryPath = path.join('./server',  'assets', 'products');

router.use('/assets', express.static(publicDirectoryPath));

export default router;