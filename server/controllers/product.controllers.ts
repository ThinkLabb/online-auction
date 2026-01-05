import db from '../services/database.ts';
import type { Request, Response } from 'express';
import { errorResponse, successResponse } from '../utils/response.ts';
import * as productService from '../services/product.services.ts';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { BUCKET_NAME, s3Client } from '../config/s3.ts';
import { Readable } from 'stream';
import { Prisma } from '@prisma/client';

import * as mailService from '../services/mail.service.ts';
import { getOrderByProductID } from '../services/payment.services.ts';

export const uploadProducts = async (req: Request, res: Response) => {
  try {
    const { images, ...productData } = req.body;
    const user = res.locals.user;
    if (!images || !Array.isArray(images)) {
      return res.status(400).json({ error: 'Images must be an array' });
    }
    const uploadPromises = images.map(async (base64String: string, index: number) => {
      const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `productsImg/${user.id}_${Date.now()}_${index}.png`;
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: buffer,
        ContentType: 'image/png',
      });
      await s3Client.send(command);
      return filename;
    });
    const uploadedImageKeys = await Promise.all(uploadPromises);
    await db.prisma.product.create({
      data: {
        name: productData.productName,
        seller_id: user.id,
        category_id: productData.categoryId,
        start_price: productData.startingPrice,
        buy_now_price: productData.buyNowPrice,
        step_price: productData.stepPrice,
        current_price: productData.startingPrice,
        auto_extend: productData.autoRenewal,
        review_needed: productData.isRequiredReview,
        end_time: new Date(productData.auctionEndTime),
        allow_unrated_bidder: productData.allowUnratedBidders,
        description_history: {
          create: {
            description: productData.description,
          },
        },
        images: {
          create: uploadedImageKeys.map((key) => ({
            image_url: key,
          })),
        },
      },
    });
    res.json({ message: 'Product created and image keys saved successfully' });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

export const getProductImage = async (req: Request, res: Response) => {
  try {
    const key = req.params.key;
    const fullKey = `productsImg/${key}`;

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fullKey,
    });

    const s3Response = await s3Client.send(command);

    res.setHeader('Content-Type', s3Response.ContentType || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000');

    if (s3Response.Body instanceof Readable) {
      s3Response.Body.pipe(res);
    } else {
      console.error('S3 Body type:', typeof s3Response.Body);
      throw new Error('S3 Body is not a Node.js Readable stream');
    }
  } catch (error) {
    console.error('Stream Image Error:', error);
    res.status(404).send('Image not found');
  }
};

export const getProductsEndest = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    const nearestEndingProducts = await db.prisma.product.findMany({
      where: {
        end_time: {
          gt: new Date(),
        },
      },
      take: 5,
      orderBy: {
        end_time: 'asc',
      },
      include: {
        current_highest_bidder: true,
        images: {
          take: 1,
          orderBy: {
            image_id: 'asc',
          },
        },
      },
    });

    let watchlistedIds = new Set<string>();
    if (user) {
      const watchlistEntries = await db.prisma.watchlist.findMany({
        where: {
          user_id: user.id,
          product_id: {
            in: nearestEndingProducts.map((p) => p.product_id),
          },
        },
        select: { product_id: true },
      });
      watchlistEntries.forEach((w) => watchlistedIds.add(w.product_id.toString()));
    }

    const formattedProducts = nearestEndingProducts.map((product) => {
      return {
        id: product.product_id.toString(),
        name: product.name,
        bid_count: product.bid_count,
        current_price: product.current_price.toString(),
        buy_now_price: product.buy_now_price ? product.buy_now_price.toString() : null,
        end_time: product.end_time,
        created_at: product.created_at,
        highest_bidder_name: product.current_highest_bidder?.name || null,
        image_url: product.images[0]?.image_url || null,
        isWatchlisted: watchlistedIds.has(product.product_id.toString()),
        isSeller: user ? product.seller_id === user.id : false,
      };
    });

    return res.json(formattedProducts);
  } catch (e) {
    return res.status(500).json(errorResponse(String(e)));
  }
};

export const getTopBiddedProducts = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    const topBiddedProducts = await db.prisma.product.findMany({
      where: {
        end_time: {
          gt: new Date(),
        },
      },
      take: 5,
      orderBy: {
        bid_count: 'desc',
      },
      include: {
        current_highest_bidder: true,
        images: {
          take: 1,
          orderBy: {
            image_id: 'asc',
          },
        },
      },
    });

    let watchlistedIds = new Set<string>();
    if (user) {
      const watchlistEntries = await db.prisma.watchlist.findMany({
        where: {
          user_id: user.id,
          product_id: {
            in: topBiddedProducts.map((p) => p.product_id),
          },
        },
        select: { product_id: true },
      });
      watchlistEntries.forEach((w) => watchlistedIds.add(w.product_id.toString()));
    }

    const formattedProducts = topBiddedProducts.map((product) => {
      return {
        id: product.product_id.toString(),
        name: product.name,
        bid_count: product.bid_count,
        current_price: product.current_price.toString(),
        buy_now_price: product.buy_now_price ? product.buy_now_price.toString() : null,
        end_time: product.end_time,
        created_at: product.created_at,
        highest_bidder_name: product.current_highest_bidder?.name || null,
        image_url: product.images[0]?.image_url || null,
        isWatchlisted: watchlistedIds.has(product.product_id.toString()),
        isSeller: user ? product.seller_id === user.id : false,
      };
    });

    return res.json(formattedProducts);
  } catch (e) {
    return res.status(500).json(errorResponse(String(e)));
  }
};

export const getHighPriceProducts = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    const highPriceProducts = await db.prisma.product.findMany({
      where: {
        end_time: {
          gt: new Date(),
        },
      },
      take: 5,
      orderBy: {
        current_price: 'desc',
      },
      include: {
        current_highest_bidder: true,
        images: {
          take: 1,
          orderBy: {
            image_id: 'asc',
          },
        },
      },
    });

    let watchlistedIds = new Set<string>();
    if (user) {
      const watchlistEntries = await db.prisma.watchlist.findMany({
        where: {
          user_id: user.id,
          product_id: {
            in: highPriceProducts.map((p) => p.product_id),
          },
        },
        select: { product_id: true },
      });
      watchlistEntries.forEach((w) => watchlistedIds.add(w.product_id.toString()));
    }

    const formattedProducts = highPriceProducts.map((product) => {
      return {
        id: product.product_id.toString(),
        name: product.name,
        bid_count: product.bid_count,
        current_price: product.current_price.toString(),
        buy_now_price: product.buy_now_price ? product.buy_now_price.toString() : null,
        end_time: product.end_time,
        created_at: product.created_at,
        highest_bidder_name: product.current_highest_bidder?.name || null,
        image_url: product.images[0]?.image_url || null,
        isWatchlisted: watchlistedIds.has(product.product_id.toString()),
        isSeller: user ? product.seller_id === user.id : false,
      };
    });

    return res.json(formattedProducts);
  } catch (e) {
    return res.status(500).json(errorResponse(String(e)));
  }
};

const bigIntReplacer = (key: string, value: any) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

export const calculateRating = (plus: number, minus: number) => {
  const total = plus + minus;
  if (total === 0) return 0;
  return Number(((plus / total) * 10).toFixed(1));
};

export const getProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = res.locals.user;

    const productData = await db.prisma.product.findUnique({
      where: { product_id: BigInt(id) },
      include: {
        seller: { select: { user_id: true, name: true, plus_review: true, minus_review: true } },
        category: true,
        current_highest_bidder: { select: { name: true, plus_review: true, minus_review: true } },
        images: true,
        description_history: { orderBy: { added_at: 'asc' } },
        q_and_a: {
          include: {
            questioner: { select: { name: true, plus_review: true, minus_review: true } },
          },
          orderBy: { question_time: 'desc' },
        },
        _count: { select: { bids: true } },
      },
    });

    if (!productData) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let orderId = null;
    const isSeller = user ? user.id === productData.seller.user_id : false;
    const isWinner = user ? user.id === productData.current_highest_bidder_id : false;
    if (productData.end_time < new Date() && (isSeller || isWinner)) {
      orderId = await getOrderByProductID(Number(productData.product_id));
      console.log('order id', orderId);
    }

    if (orderId) {
      const response = {
        id: productData.product_id,
        title: productData.name,
        postedDate: null,
        endsIn: null,
        orderId: orderId,
        currentBid: null,
        bidsPlaced: null,
        buyNowPrice: null,
        minBidStep: null,
        images: null,
        details: null,
        description: null,
        conditionText: null,
        seller: null,
        topBidder: null,
        qa: null,

        isSeller: isSeller,
        isWatchlisted: null,

        relatedProducts: null,
      };
      return res.send(JSON.stringify(response, bigIntReplacer));
    }

    let isWatchlisted = false;
    if (user) {
      const watchlistEntry = await db.prisma.watchlist.findUnique({
        where: {
          user_id_product_id: {
            user_id: user.id,
            product_id: productData.product_id,
          },
        },
      });
      isWatchlisted = !!watchlistEntry;
    }

    const relatedProductsRaw = await db.prisma.product.findMany({
      where: {
        category_id: productData.category_id,
        product_id: { not: productData.product_id },
        status: 'open',
        end_time: { gt: new Date() },
      },
      select: {
        product_id: true,
        name: true,
        current_price: true,
        start_price: true,
        buy_now_price: true,
        bid_count: true,
        created_at: true,
        end_time: true,
        current_highest_bidder: { select: { name: true } },
        images: { take: 1, orderBy: { image_id: 'asc' }, select: { image_url: true } },
      },
      take: 5,
      orderBy: { created_at: 'desc' },
    });

    const relatedProducts = relatedProductsRaw.map((p) => {
      const now = new Date();
      const end = new Date(p.end_time);
      const diff = end.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const timeLeft = days > 0 ? `${days} day${days > 1 ? 's' : ''} left` : `${hours}h left`;

      return {
        id: p.product_id.toString(),
        name: p.name,
        bid_count: p.bid_count,
        current_price: p.current_price.toString(),
        buy_now_price: p.buy_now_price ? p.buy_now_price.toString() : null,
        end_time: p.end_time,
        created_at: p.created_at,
        highest_bidder_name: p.current_highest_bidder?.name || null,
        image_url: p.images[0]?.image_url || null,
      };
    });

    const descriptionList = productData.description_history.map((hist) => ({
      text: hist.description,
      date: new Date(hist.added_at).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));
    if (descriptionList.length === 0)
      descriptionList.push({
        text: 'No description provided.',
        date: new Date(productData.created_at).toLocaleDateString(),
      });

    const responseData = {
      id: productData.product_id,
      title: productData.name,
      postedDate: new Date(productData.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      endsIn: productData.end_time,
      orderId: orderId,
      currentBid: Number(productData.current_price),
      bidsPlaced: productData.bid_count,
      buyNowPrice: productData.buy_now_price ? Number(productData.buy_now_price) : 0,
      minBidStep: Number(productData.step_price),
      images:
        productData.images.length > 0
          ? productData.images.map((img) => img.image_url)
          : ['https://via.placeholder.com/600x400?text=No+Image'],
      details: {
        brand: productData.category.name_level_1,
        year: 'N/A',
        condition: 'Used',
        engine: productData.category.name_level_2,
        frameMaterial: 'See description',
        color: 'See description',
        performance: 'See description',
        exhaust: 'See description',
      },
      description: descriptionList,
      conditionText: 'Please refer to images and description for full condition details.',
      seller: {
        name: productData.seller.name,
        rating: calculateRating(productData.seller.plus_review, productData.seller.minus_review),
        reviews: productData.seller.plus_review + productData.seller.minus_review,
      },
      topBidder: productData.current_highest_bidder
        ? {
            name: productData.current_highest_bidder.name,
            rating: calculateRating(
              productData.current_highest_bidder.plus_review,
              productData.current_highest_bidder.minus_review
            ),
            reviews:
              productData.current_highest_bidder.plus_review +
              productData.current_highest_bidder.minus_review,
          }
        : { name: 'No Bids Yet', rating: 0, reviews: 0 },
      qa: productData.q_and_a.map((qa) => ({
        id: qa.qa_id.toString(),
        question: qa.question_text,
        asker: qa.questioner.name,
        answer: qa.answer_text,
        responder: qa.answer_text ? `${productData.seller.name} (Seller)` : null,
        time: new Date(qa.question_time).toLocaleDateString(),
      })),

      isSeller: isSeller,
      isWatchlisted: isWatchlisted,

      relatedProducts: relatedProducts,
      allow_unrated_bidder: productData.allow_unrated_bidder,
      review_needed: productData.review_needed,
    };

    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(responseData, bigIntReplacer));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e) });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  const result = await productService.getCategories();

  if (!result.success) {
    return res.status(400).json(errorResponse(result.message));
  }

  return res.status(200).json(successResponse(result.categories, result.message));
};

type SortField = 'end_time' | 'current_price';
type SortOrder = 'asc' | 'desc';

export const getProductsLV = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    const { level1, level2 } = req.params;
    const sortQuery = req.query.sort as SortField | undefined;
    const orderQuery = req.query.order as SortOrder | undefined;

    const pageQuery = req.query.page ? parseInt(req.query.page as string) : 1;
    const limitQuery = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const page = Math.max(1, pageQuery);
    const limit = Math.max(1, limitQuery);
    const skip = (page - 1) * limit;
    let whereClause: any = {};
    if (level1 && level1 !== '*') {
      whereClause.category = {
        name_level_1: String(level1),
        ...(level2 && level2 !== '*' ? { name_level_2: String(level2) } : {}),
      };
    }

    let orderByClause: any = {};
    const sortField: SortField =
      sortQuery && ['end_time', 'current_price'].includes(sortQuery) ? sortQuery : 'end_time';
    const sortOrder: SortOrder =
      orderQuery && ['asc', 'desc'].includes(orderQuery) ? orderQuery : 'asc';

    if (sortField === 'current_price') {
      orderByClause.current_price = sortOrder;
    } else {
      orderByClause.end_time = sortOrder;
    }

    const totalItems = await db.prisma.product.count({
      where: whereClause,
    });

    const products = await db.prisma.product.findMany({
      where: whereClause,
      orderBy: orderByClause,
      skip: skip,
      take: limit,
      include: {
        current_highest_bidder: true,
        images: {
          take: 1,
          orderBy: {
            image_id: 'asc',
          },
        },
      },
    });
    let watchlistedIds = new Set<string>();
    if (user) {
      const watchlistEntries = await db.prisma.watchlist.findMany({
        where: {
          user_id: user.id,
          product_id: {
            in: products.map((p) => p.product_id),
          },
        },
        select: { product_id: true },
      });
      watchlistEntries.forEach((w) => watchlistedIds.add(w.product_id.toString()));
    }
    const formattedProducts = products.map((product) => {
      return {
        id: String(product.product_id),
        name: product.name,
        bid_count: product.bid_count,
        current_price: product.current_price,
        buy_now_price: product.buy_now_price,
        end_time: product.end_time,
        created_at: product.created_at,
        highest_bidder_name: product.current_highest_bidder?.name || null,
        image_url: product.images[0]?.image_url || null,
        isWatchlisted: watchlistedIds.has(product.product_id.toString()),
        isSeller: user ? product.seller_id === user.id : false,
      };
    });

    return res.json({ products: formattedProducts, totalItems: totalItems });
  } catch (e) {
    return res.status(500).json(errorResponse(String(e)));
  }
};

export const addToWatchList = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }
    await db.prisma.watchlist.create({
      data: {
        user_id: userId,
        product_id: Number(productId),
      },
    });
    return res.status(200).json({ message: 'Added to watch list successfully' });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(409).json({ message: 'Product is already in your watch list' });
      }

      if (error.code === 'P2003') {
        return res.status(404).json({ message: 'Product not found' });
      }
    }
    console.error('Add to watch list error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const handleBuyNow = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const buyerId = res.locals.user.id;

    await db.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { product_id: BigInt(productId) },
      });

      if (!product) {
        throw new Error('Sản phẩm không tồn tại.');
      }
      if (product.status !== 'open') {
        throw new Error('Sản phẩm này đã bán, hết hạn hoặc không còn khả dụng.');
      }
      if (Number(product.buy_now_price) === 0) {
        throw new Error('Sản phẩm này không hỗ trợ tính năng Mua Ngay.');
      }
      if (product.seller_id === buyerId) {
        throw new Error('Bạn không thể mua sản phẩm do chính mình đăng bán.');
      }

      const updateResult = await tx.product.updateMany({
        where: {
          product_id: BigInt(productId),
          status: 'open',
        },
        data: {
          status: 'sold',
          current_price: product.buy_now_price,
          current_highest_bidder_id: buyerId,
          end_time: new Date(),
          bid_count: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        throw new Error('Giao dịch thất bại: Sản phẩm đã được mua bởi người khác.');
      }

      await Promise.all([
        tx.order.upsert({
          where: {
            product_id: BigInt(productId),
          },
          create: {
            product_id: BigInt(productId),
            buyer_id: buyerId,
            seller_id: product.seller_id,
            final_price: product.buy_now_price,
            status: 'pending_payment',
          },
          update: {
            buyer_id: buyerId,
            seller_id: product.seller_id,
            final_price: product.buy_now_price,
            status: 'pending_payment',
            created_at: new Date(),
          },
        }),

        tx.bidHistory.create({
          data: {
            product_id: BigInt(productId),
            bidder_id: buyerId,
            bid_amount: product.buy_now_price,
            bid_time: new Date(),
          },
        }),
      ]);
    });

    return res.status(200).json({
      success: true,
      message: 'Mua ngay thành công!',
    });
  } catch (error: any) {
    console.error('Buy Now Error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Đã có lỗi xảy ra trong quá trình xử lý.',
    });
  }
};

export const createProductQA = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { question } = req.body;
    const user = res.locals.user;

    if (!question) return res.status(400).json({ message: 'Question cannot be empty' });

    const product = await db.prisma.product.findUnique({
      where: { product_id: BigInt(id) },
      include: { seller: { select: { email: true, name: true } } },
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await db.prisma.productQandA.create({
      data: {
        product_id: BigInt(id),
        questioner_id: user.id,
        question_text: question,
        question_time: new Date(),
      },
    });

    const productLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/product/${id}`;
    mailService.sendNewQuestionEmail(product.seller.email, product.name, question, productLink);

    return res.status(201).json({ message: 'Question sent successfully!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server Error' });
  }
};

export const replyProductQA = async (req: Request, res: Response) => {
  try {
    const { qaId } = req.params;
    const { answer } = req.body;
    const user = res.locals.user;

    if (!answer) return res.status(400).json({ message: 'Answer cannot be empty' });

    const qa = await db.prisma.productQandA.findUnique({
      where: { qa_id: BigInt(qaId) },
      include: {
        product: true,
      },
    });

    if (!qa) return res.status(404).json({ message: 'Question not found' });

    if (qa.product.seller_id !== user.id) {
      return res.status(403).json({ message: 'Unauthorized: You are not the seller' });
    }

    await db.prisma.productQandA.update({
      where: { qa_id: BigInt(qaId) },
      data: {
        answer_text: answer,
        answer_time: new Date(),
      },
    });

    const productData = await db.prisma.product.findUnique({
      where: { product_id: qa.product_id },
      include: {
        bids: {
          select: { bidder: { select: { email: true } } },
        },
        q_and_a: {
          select: { questioner: { select: { email: true } } },
        },
      },
    });

    if (productData) {
      const questionerList = new Set<string>();
      productData.q_and_a.forEach((q) => questionerList.add(q.questioner.email));
      productData.bids.forEach((b) => questionerList.add(b.bidder.email));

      questionerList.delete(user.email);

      const recipients = Array.from(questionerList);
      const productLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/product/${qa.product_id.toString()}`;

      if (recipients.length > 0) {
        mailService.sendNewAnswerEmail(
          recipients,
          qa.product.name,
          qa.question_text,
          answer,
          productLink
        );
      }
    }

    return res.status(201).json({ message: 'Answer sent successfully!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: String(error) });
  }
};

export const searchProducts = async (req: Request, res: Response) => {
  try {
    const { keyword, category } = req.query;

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const skip = (page - 1) * limit;

    const sort = req.query.sort as string;
    let orderBy: any = {};

    if (sort === 'price_asc') {
      orderBy = { current_price: 'asc' };
    } else {
      orderBy = { end_time: 'desc' };
    }

    const searchQuery = keyword ? String(keyword).trim().split(/\s+/).join(' & ') : undefined;

    const whereClause: any = {
      OR: [
        {
          status: 'open',
          end_time: { gt: new Date() },
        },
        {
          status: 'sold',
          Order: {
            status: 'pending_payment',
          },
        },
      ],
    };

    if (searchQuery) {
      whereClause.OR = [
        {
          name: {
            search: searchQuery,
          },
        },
        {
          category: {
            name_level_1: { search: searchQuery },
          },
        },
        {
          category: {
            name_level_2: { search: searchQuery },
          },
        },
      ];
    }

    if (category) {
      whereClause.category = {
        ...whereClause.category,
        name_level_1: { contains: String(category), mode: 'insensitive' },
      };
    }

    const totalItems = await db.prisma.product.count({ where: whereClause });

    const products = await db.prisma.product.findMany({
      where: whereClause,
      orderBy: orderBy,
      skip: skip,
      take: limit,
      include: {
        current_highest_bidder: true,
        images: { take: 1, orderBy: { image_id: 'asc' }, select: { image_url: true } },
      },
    });

    const formattedProducts = products.map((product) => ({
      id: product.product_id.toString(),
      name: product.name,
      current_price: product.current_price.toString(),
      buy_now_price: product.buy_now_price ? product.buy_now_price.toString() : null,
      bid_count: product.bid_count,
      end_time: product.end_time,
      created_at: product.created_at,
      image_url: product.images[0]?.image_url || null,
      highest_bidder_name: product.current_highest_bidder?.name || null,
    }));

    return res.status(200).json({
      products: formattedProducts,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json(errorResponse(String(e)));
  }
};

export const appendProductDescription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    const user = res.locals.user;

    if (!description || description.trim() === '') {
      return res.status(400).json({ message: 'Description cannot be empty' });
    }

    const product = await db.prisma.product.findUnique({
      where: { product_id: BigInt(id) },
    });

    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.seller_id !== user.id) {
      return res.status(403).json({ message: 'Unauthorized: You are not the seller' });
    }

    if (product.status !== 'open') {
      return res
        .status(400)
        .json({ message: 'Cannot update description for closed/sold products' });
    }

    await db.prisma.productDescriptionHistory.create({
      data: {
        product_id: BigInt(id),
        description: description,
        added_at: new Date(),
      },
    });

    return res.status(200).json({ message: 'Description appended successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: String(error) });
  }
};
