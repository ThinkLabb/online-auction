import db from '../services/database.ts';
import type { Request, Response } from 'express';
import { errorResponse, successResponse } from '../utils/response.ts';
import * as productService from '../services/product.services.ts';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { BUCKET_NAME, s3Client } from '../config/s3.ts';
import { Readable } from 'stream'; // <--- 1. Import cái này
import { Prisma } from '@prisma/client';

// import nodemailer from 'nodemailer';
import * as mailService from '../services/mail.service.ts';

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
        end_time: new Date(productData.auctionEndTime),
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
      };
    });

    return res.json(formattedProducts);
  } catch (e) {
    return res.status(500).json(errorResponse(String(e)));
  }
};

export const getTopBiddedProducts = async (req: Request, res: Response) => {
  try {
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
      };
    });

    return res.json(formattedProducts);
  } catch (e) {
    return res.status(500).json(errorResponse(String(e)));
  }
};

export const getHighPriceProducts = async (req: Request, res: Response) => {
  try {
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

const calculateRating = (plus: number, minus: number) => {
  const total = plus + minus;
  if (total === 0) return 0;
  return Number(((plus / total) * 5).toFixed(1));
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

    // take 5 related products
    const relatedProductsRaw = await db.prisma.product.findMany({
      where: {
        category_id: productData.category_id,
        product_id: { not: productData.product_id },
        status: 'open', // Đang mở bán
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
        price: Number(p.current_price) > 0 ? Number(p.current_price) : Number(p.start_price),
        buyNowPrice: p.buy_now_price ? Number(p.buy_now_price) : null,
        bidCount: p.bid_count,
        postedDate: new Date(p.created_at).toLocaleDateString('en-GB'),
        timeLeft: timeLeft,
        bidderName: p.current_highest_bidder?.name || 'No Bids Yet',
        image: p.images[0]?.image_url || null,
      };
    });

    const descriptionList = productData.description_history.map((hist) => ({
      text: hist.description,
      date: new Date(hist.added_at).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
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
      isSeller: user ? user.id === productData.seller.user_id : false,

      relatedProducts: relatedProducts,
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
      whereClause.category = {};
      whereClause.category.name_level_1 = String(level1);
      if (level2 && level2 !== '*') {
        whereClause.category.name_level_2 = String(level2);
      }
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

    const result = await db.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { product_id: BigInt(productId) },
      });

      if (!product) {
        throw new Error('Sản phẩm không tồn tại.');
      }

      if (product.status !== 'open') {
        throw new Error('Sản phẩm này đã bán, hết hạn hoặc không còn khả dụng.');
      }

      if (Number(product.buy_now_price) == 0) {
        throw new Error('Sản phẩm này không hỗ trợ tính năng Mua Ngay.');
      }

      if (product.seller_id === buyerId) {
        throw new Error('Bạn không thể mua sản phẩm do chính mình đăng bán.');
      }

      await Promise.all([
        // 1. Tạo đơn hàng
        tx.order.create({
          data: {
            product_id: product.product_id,
            buyer_id: buyerId,
            seller_id: product.seller_id,
            final_price: product.buy_now_price,
            status: 'pending_payment',
          },
        }),

        // 2. Cập nhật sản phẩm
        tx.product.update({
          where: { product_id: product.product_id },
          data: {
            status: 'sold',
            current_price: product.buy_now_price,
            current_highest_bidder_id: buyerId,
            end_time: new Date(),
            bid_count: { increment: 1 },
          },
        }),

        // 3. Lưu lịch sử bid
        tx.bidHistory.create({
          data: {
            product_id: product.product_id,
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
  } catch (error) {
    console.error('Buy Now Error:', error);
  }
};

// QA section, a user can ask question about a product, seller gets email notification
export const createProductQA = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { question } = req.body;
    const user = res.locals.user; //asker

    // validate input
    if (!question) return res.status(400).json({ message: 'Question cannot be empty' });

    /// find product
    const product = await db.prisma.product.findUnique({
      where: { product_id: BigInt(id) },
      include: { seller: { select: { email: true, name: true } } },
    });
    // if no product found
    if (!product) return res.status(404).json({ message: 'Product not found' });

    /// save question to database
    await db.prisma.productQandA.create({
      data: {
        product_id: BigInt(id),
        questioner_id: user.id,
        question_text: question,
        question_time: new Date(),
      },
    });

    // send email to seller
    const productLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/product/${id}`;

    await mailService.sendCustomEmail({
      to: product.seller.email,
      subject: `New Question: ${product.name}`,
      html: `
        <h3>Hello ${product.seller.name},</h3>
        <p>User <strong>${user.name}</strong> asked a question about your product (${product.name}):</p>
        <div style="background:#f3f4f6; padding:15px; border-left:4px solid #8D0000;">
          "${question}"
        </div>
        <p><a href="${productLink}">Reply Now</a></p>
      `,
    });
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
    const user = res.locals.user; // current user (seller)

    // validate input
    if (!answer) return res.status(400).json({ message: 'Answer cannot be empty' });

    // find question from database
    const qa = await db.prisma.productQandA.findUnique({
      where: { qa_id: BigInt(qaId) },
      include: {
        product: true,
        questioner: { select: { email: true, name: true } }, // <--- questioner info for emailing
      },
    });

    // check if question exists
    if (!qa) return res.status(404).json({ message: 'Question not found' });

    // check if current user is the seller of the product
    if (qa.product.seller_id !== user.id) {
      return res.status(403).json({ message: 'Unauthorized: You are not the seller' });
    }

    // save answer to database
    await db.prisma.productQandA.update({
      where: { qa_id: BigInt(qaId) },
      data: {
        answer_text: answer,
        answer_time: new Date(),
      },
    });

    // send email to questioner
    const productLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/product/${qa.product_id}`;

    await mailService.sendCustomEmail({
      to: qa.questioner.email,
      subject: `Answer for ${qa.product.name}`,
      html: `
        <h3>Hello ${qa.questioner.name},</h3>
        <p>Seller <strong>${user.name}</strong> answered your question about product ${qa.product.name}:</p>
        <div style="background:#f3f4f6; padding:15px; border-left:4px solid #8D0000;">
          <p><strong>You asked:</strong> "${qa.question_text}"</p>
          <p><strong>Answer:</strong> "${answer}"</p
        </div>
        <p><a href="${productLink}">Reply Now</a></p>
      `,
    });
    return res.status(201).json({ message: 'Answer sent successfully!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: String(error) });
  }
};
