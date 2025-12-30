import express, { Request, Response } from 'express';
import * as authController from '../controllers/auth.controllers.ts';
import { celebrate, Joi, Segments } from 'celebrate';
import * as emailController from '../controllers/email.controller.ts';
import * as productController from '../controllers/product.controllers.ts';
import {
  addCategory,
  deleteCategory,
  deleteProducts,
  deleteUser,
  getAdCatergories,
  getAdName,
  getAdProducts,
  getAdUsers,
  getAuctionConfig,
  getUpgradeRequest,
  responseUpgradeRequest,
  updateAuctionConfig,
  updateCategory,
} from '../controllers/admin.controler.ts';
import * as userControllers from '../controllers/user.controllers.ts';
import { UserControllers } from '../controllers/user.controllers.ts';
import {
  getProduct,
  getProductsEndest,
  uploadProducts,
  createProductQA,
  replyProductQA,
  searchProducts,
  appendProductDescription,
} from '../controllers/product.controllers.ts';
import { banBidder, getBidHistory, placeBid } from '../controllers/bid.controller.ts';
import {
  addChat,
  addReview,
  changeOrder,
  getChat,
  getOrder,
  getOrderImage,
} from '../controllers/payment.controller.ts';
import { ReviewController } from '../controllers/review.controller.ts';
import { OrderController } from '../controllers/order.controller.ts';

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
    recaptchaToken: Joi.required(),
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
router.post(
  '/products/:productId/buy-now',
  authController.getAuthentication,
  productController.handleBuyNow
);
router.get('/productsLV/:level1/:level2', productController.getProductsLV);

router.post('/upload', authController.getSellerAuthentication, uploadProducts);

router.get('/upload', authController.getSellerAuthentication, (_: Request, res: Response) =>
  res.sendStatus(200)
);

router.get('/assets/productsImg/:key', productController.getProductImage);

router.post('/sendmail', emailController.sendMail);
router.post('/verify', emailController.verifyCode);

router.put('/changepassword', authController.changePassword);

router.get('/categories', productController.getCategories);

router.get('/admin', authController.getAuthentication, authController.checkAdmin, getAdName);

router.get(
  '/admin/categories',
  authController.getAuthentication,
  authController.checkAdmin,
  getAdCatergories
);
router.post(
  '/admin/categories',
  authController.getAuthentication,
  authController.checkAdmin,
  addCategory
);
router.delete(
  '/admin/categories',
  authController.getAuthentication,
  authController.checkAdmin,
  deleteCategory
);
router.put(
  '/admin/categories',
  authController.getAuthentication,
  authController.checkAdmin,
  updateCategory
);

router.get(
  '/admin/products',
  authController.getAuthentication,
  authController.checkAdmin,
  getAdProducts
);
router.delete(
  '/admin/products',
  authController.getAuthentication,
  authController.checkAdmin,
  deleteProducts
);

router.get('/admin/users', authController.getAuthentication, authController.checkAdmin, getAdUsers);
router.delete(
  '/admin/users',
  authController.getAuthentication,
  authController.checkAdmin,
  deleteUser
);

router.get(
  '/admin/upgradeRequests',
  authController.getAuthentication,
  authController.checkAdmin,
  getUpgradeRequest
);
router.put(
  '/admin/upgradeRequests',
  authController.getAuthentication,
  authController.checkAdmin,
  responseUpgradeRequest
);

router.get(
  '/admin/settings',
  authController.getAuthentication,
  authController.checkAdmin,
  getAuctionConfig
);
router.put(
  '/admin/settings',
  authController.getAuthentication,
  authController.checkAdmin,
  updateAuctionConfig
);

// ===== PROFILE PAGE'S API =====
router.get(
  '/profile',
  authController.getAuthentication,
  userControllers.getMyProfile
);

router.get(
  '/profile/biddings',
  authController.getAuthentication,
  UserControllers.BidderControllers.getBiddingProducts
);

router.get(
  '/profile/won-products',
  authController.getAuthentication,
  UserControllers.BidderControllers.getWonProducts
);


router.get(
  '/profile/watchlist',
  authController.getAuthentication,
  UserControllers.BidderControllers.getWatchlistProducts
);

router.get(
  '/profile/reviews',
  authController.getAuthentication,
  UserControllers.BidderControllers.getReviews
);

router.get(
  '/profile/reviews-from-buyers',
  authController.getAuthentication,
  UserControllers.BidderControllers.getReviewsFromBuyers
);

router.get(
  '/profile/reviews-from-sellers',
  authController.getAuthentication,
  UserControllers.BidderControllers.getReviewsFromSellers
);

router.get(
  '/profile/sellings',
  authController.getSellerAuthentication,
  UserControllers.SellerControllers.getSellerProducts
);

router.get(
  '/profile/solds',
  authController.getSellerAuthentication,
  UserControllers.SellerControllers.getProductsWithWinner
)

router.patch(
  '/profile',
  authController.getAuthentication,
  userControllers.editUserProfile
);

router.use(
  '/profile/verifyuser',
  authController.verifyUser
);

router.post(
  '/watch-list/add',
  authController.getAuthentication,
  productController.addToWatchList
);

router.delete(
  '/watch-list/:product_id',
  authController.getAuthentication,
  userControllers.deleteWatchlistProduct
);

router.delete(
  '/seller-list/:product_id',
  authController.getAuthentication,
  userControllers.deleteSellerlistProduct
);

router.post(
  '/profile/role',
  authController.getAuthentication,
  userControllers.requestRole
);
router.get(
  '/profile/seller-status',
  authController.getAuthentication,
  userControllers.getSellerStatus
);

router.post(
  '/review/create',
  authController.getAuthentication,
  ReviewController.create
),

router.put(
  '/review/update',
  authController.getAuthentication,
  ReviewController.update
),

router.post(
  '/rate',
  authController.getAuthentication,
  ReviewController.rate
),

router.post(
  '/comment',
  authController.getAuthentication,
  ReviewController.comment
)

router.post(
  '/order/cancel/:id',
  authController.getSellerAuthentication,
  OrderController.cancel
)

// =========================

router.get('/admin/upgradeRequests', getUpgradeRequest);

// Product search route (full-text search)
router.get('/products/search', productController.searchProducts);

// QA route: ask question about a product
router.post('/product/:id/qa', authController.getAuthentication, createProductQA);
router.post('/qa/:qaId/reply', authController.getSellerAuthentication, replyProductQA);

// Append product description
router.post(
  '/product/:id/description',
  authController.getSellerAuthentication,
  appendProductDescription
);

//============================
// Payment
router.get('/payment/:orderid', authController.getAuthentication, getOrder);

router.put('/payment/:orderid', authController.getAuthentication, changeOrder);

router.post('/payment-review/:orderid', authController.getAuthentication, addReview);

router.get('/assets/orders/:key', getOrderImage);

router.post('/chat/:orderid', authController.getAuthentication, addChat);

router.get('/chat/:orderid', authController.getAuthentication, getChat);

export default router;
