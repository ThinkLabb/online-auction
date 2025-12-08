import express, { Request, Response } from "express";
import * as authController from "../controllers/auth.controllers.ts";
import { celebrate, Joi, Segments } from "celebrate";
import * as emailController from "../controllers/email.controller.ts";
import * as productController from "../controllers/product.controllers.ts";
import path from "path";
import { getUserProfile, getMyProfile } from "../controllers/user.controllers.ts";
import { getProduct, getProductsEndest, uploadProducts } from "../controllers/product.controllers.ts";

const router = express.Router();

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,30}$/;

const createUserSchema = {
  [Segments.BODY]: Joi.object({
    name: Joi.string().required().min(3).max(8),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(8).max(30).regex(strongPasswordRegex),
  }),
};

router.post('/auth/register', celebrate(createUserSchema), authController.register);

router.post('/auth/signin', authController.login);

router.post('/auth/me', authController.getAuthentication, authController.getAccount);

router.post('/auth/logout', authController.logout);

router.get('/home/products/endest', getProductsEndest);
router.get('/home/products/highestprice', productController.getHighPriceProducts);
router.get('/home/products/topbid', productController.getTopBiddedProducts);

router.get('/product/:id', authController.getPublicAuthentication, getProduct);

router.get('/product/:id/bids', authController.getSellerAuthentication, productController.getBidHistory);

router.delete('/ban/:productId/:bidderId', authController.getSellerAuthentication, productController.banBidder);

router.post('/bid/:productId', authController.getAuthentication, productController.placeBid);

router.get('/products/:level1/:level2', productController.getProductsLV);

router.post('/upload', authController.getSellerAuthentication, uploadProducts);

router.get('/upload', authController.getSellerAuthentication, (_: Request, res: Response) => res.sendStatus(200));

const publicDirectoryPath = path.join('./server', 'assets', 'products');

router.use('/assets', express.static(publicDirectoryPath));

router.use('/sendmail', emailController.sendMail)

router.use('/verify', emailController.verifyCode)

router.use('/changepassword', authController.changePassword)

router.use('/categories', productController.getCategories)

// ===== PROFILE PAGE'S API =====

router.get('/bidder/:id', getUserProfile);

router.get('/profile', authController.getAuthentication, getMyProfile);

router.use('/profile/verifyuser', authController.verifyUser)

// ===============================

export default router;
