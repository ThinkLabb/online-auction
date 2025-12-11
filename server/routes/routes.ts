import express, { Request, Response } from 'express';
import * as authController from '../controllers/auth.controllers.ts';
import { celebrate, Joi, Segments } from 'celebrate';
import * as emailController from '../controllers/email.controller.ts';
import * as productController from '../controllers/product.controllers.ts';
import {
  getAdCatergories,
  getAdProducts,
  getAdUsers,
  getUpgradeRequest,
} from '../controllers/admin.controler.ts';
import {
  getProduct,
  getProductsEndest,
  uploadProducts,
  createProductQA,
} from '../controllers/product.controllers.ts';
import { banBidder, getBidHistory, placeBid } from '../controllers/bid.controller.ts';

const router = express.Router();

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,30}$/;

const createUserSchema = {
  [Segments.BODY]: Joi.object({
    name: Joi.string().required().min(3).max(8),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(8).max(30).regex(strongPasswordRegex),
    code: Joi.string().required(),
    address: Joi.string().required().min(5).max(100),
  }),
};

const userLogin = {
  [Segments.BODY]: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required().min(8).max(30).regex(strongPasswordRegex),
  }),
};

router.post('/auth/register', celebrate(createUserSchema), authController.register);

router.post('/auth/signin', celebrate(userLogin), authController.login);

router.post('/auth/me', authController.getAuthentication, authController.getAccount);

router.post('/auth/logout', authController.logout);

router.get('/home/products/endest', getProductsEndest);
router.get('/home/products/highestprice', productController.getHighPriceProducts);
router.get('/home/products/topbid', productController.getTopBiddedProducts);

router.get('/product/:id', authController.getPublicAuthentication, getProduct);

router.get('/product/:id/bids', authController.getSellerAuthentication, getBidHistory);

router.delete('/ban/:productId/:bidderId', authController.getSellerAuthentication, banBidder);

router.post('/bid/:productId', authController.getAuthentication, placeBid);

router.get('/products/:level1/:level2', productController.getProductsLV);

router.post('/upload', authController.getSellerAuthentication, uploadProducts);

router.get('/upload', authController.getSellerAuthentication, (_: Request, res: Response) =>
  res.sendStatus(200)
);

router.get('/assets/productsImg/:key', productController.getProductImage);

router.use('/sendmail', emailController.sendMail);

router.use('/verify', emailController.verifyCode);

router.use('/changepassword', authController.changePassword);

router.get('/categories', productController.getCategories);

router.get('/admin', authController.getAuthentication, authController.checkAdmin);

router.get('/admin/categories', getAdCatergories);

router.get('/admin/products', getAdProducts);

router.get('/admin/users', getAdUsers);

router.get('/admin/upgradeRequests', getUpgradeRequest);

// QA route: ask question about a product
router.post('/product/:id/qa', authController.getAuthentication, createProductQA);

export default router;
