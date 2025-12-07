import db from '../services/database.ts';
import type { Request, Response } from 'express';
import { errorResponse, successResponse } from '../utils/response.ts';
import path from 'path';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import * as productService from '../services/product.services.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadProducts = async (req: Request, res: Response) => {
  try {
    const { images, ...productData } = req.body;
    const user = res.locals.user;

    const imgName: string[] = [];

    images.forEach((base64String: string, index: number) => {
      const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const filename = `${user.id}_${Date.now()}_${index}.png`;
      imgName.push(filename);
      writeFileSync(path.join(__dirname, '../assets/products', filename), buffer);
    });

    await db.prisma.product.create({
      data: {
        name: productData.productName,
        seller_id: user.id,
        category_id: 1,
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
          create: imgName.map((url) => ({
            image_url: url,
          })),
        },
      },
    });

    res.json({ message: 'JSON received successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
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
      where: {
        product_id: BigInt(id),
      },
      include: {
        seller: {
          select: { user_id: true, name: true, plus_review: true, minus_review: true },
        },
        category: true,
        current_highest_bidder: {
          select: { name: true, plus_review: true, minus_review: true },
        },
        images: true,

        description_history: {
          orderBy: { added_at: 'asc' },
        },

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

    const now = new Date();
    const endTime = new Date(productData.end_time);
    const timeLeftMs = endTime.getTime() - now.getTime();
    const daysLeft = Math.floor(timeLeftMs / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((timeLeftMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const endsInString = timeLeftMs > 0 ? `${daysLeft} days ${hoursLeft} hours` : 'Ended';

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

    if (descriptionList.length === 0) {
      descriptionList.push({
        text: 'No description provided.',
        date: new Date(productData.created_at).toLocaleDateString(),
      });
    }
    const responseData = {
      id: productData.product_id,
      title: productData.name,
      postedDate: new Date(productData.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      endsIn: endsInString,
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
        : {
            name: 'No Bids Yet',
            rating: 0,
            reviews: 0,
          },
      qa: productData.q_and_a.map((qa) => ({
        question: qa.question_text,
        asker: qa.questioner.name,
        answer: qa.answer_text || 'Waiting for response...',
        responder: qa.answer_text ? `${productData.seller.name} (Seller)` : null,
        time: new Date(qa.question_time).toLocaleDateString(),
      })),
      isSeller: user ? user.id === productData.seller.user_id : false,
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
    if (level1 && level1 !== "*") {
      whereClause.category = {};
      whereClause.category.name_level_1 = String(level1);
      if (level2 && level2 !== "*") {
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

export const getBidHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // This is the product_id
    const user = res.locals.user; // Assumed authenticated user

    // 1. Check Product Ownership
    // We fetch the product to ensure it exists and the user is the seller
    const product = await db.prisma.product.findUnique({
      where: {
        product_id: BigInt(id), // Convert string ID from params to BigInt
      },
      select: {
        seller_id: true,
      },
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Security Check: Compare user_id (String/UUID) with seller_id (String/UUID)
    if (product.seller_id !== user.id) {
      return res
        .status(403)
        .json({ message: 'Unauthorized. Only the seller can view bid history.' });
    }

    // 2. Fetch Bids
    const bids = await db.prisma.bidHistory.findMany({
      where: {
        product_id: BigInt(id),
      },
      // Join with the User model to get bidder details
      include: {
        bidder: {
          select: {
            user_id: true,
            name: true,
          },
        },
      },
      // Order by highest bid first
      orderBy: {
        bid_amount: 'desc',
      },
    });

    // 3. Map to Response Format
    const historyData = bids.map((bid) => ({
      id: bid.bid_id.toString(), // Convert BigInt ID to string
      bidderId: bid.bidder.user_id,
      bidderName: bid.bidder.name,
      amount: Number(bid.bid_amount), // Convert Decimal to Number for frontend
      time: bid.bid_time.toISOString(), // Send ISO string for frontend formatting
    }));

    return res.status(200).json(historyData);
  } catch (e) {
    console.error(e);
    // Explicitly handle the BigInt serialization if returning raw error objects
    return res.status(500).json({ message: String(e) });
  }
};

export const banBidder = async (req: Request, res: Response) => {
  try {
    const { productId, bidderId } = req.params;
    if (!productId || !bidderId) {
      return res.status(400).json({ message: 'Product ID and Bidder ID are required.' });
    }
    const deniedBidder = await db.prisma.deniedBidders.create({
      data: {
        product_id: BigInt(productId),
        bidder_id: bidderId,
      },
    });

    return res.status(200).json({
      message: 'User banned successfully.',
      data: {
        ...deniedBidder,
        product_id: deniedBidder.product_id.toString(),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const placeBid = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { amount } = req.body;
    const user = res.locals.user;
    
    const bidAmount = parseFloat(amount);
    const prodIdBigInt = BigInt(productId);

    const result = await db.prisma.$transaction(async (tx) => {
      const [product, userData, currentTopBid] = await Promise.all([
        tx.product.findUnique({ where: { product_id: prodIdBigInt } }),
        tx.user.findUnique({ where: { user_id: user.id } }),
        tx.bidHistory.findFirst({
          where: { product_id: prodIdBigInt },
          orderBy: [
            { bid_amount: 'desc' },
            { bid_time: 'asc' }
          ]
        })
      ]);

      if (!product) throw new Error('Product not found');
      if (!userData) throw new Error('User not found');

      const now = new Date();
      if (now > product.end_time || product.status !== 'open') {
        throw new Error('Auction has ended');
      }

      if (product.review_needed) {
        const minus = userData.minus_review || 0;
        const plus = userData.plus_review || 0;
        const total = plus + minus;

        if (total > 0) {
          const ratio = plus / total;
          if (ratio < 0.8) {
            throw new Error('REVIEW_LOW');
          }
        } else {
          throw new Error('REVIEW_LOW');
        }
      }

      const currentDisplayPrice = Number(product.current_price) || Number(product.start_price);
      const stepPrice = Number(product.step_price);
      const startPrice = Number(product.start_price);
      
      const minRequired = currentDisplayPrice + stepPrice;
      const actualMinRequired = product.bid_count === 0 ? startPrice : minRequired;

      if (bidAmount < actualMinRequired) {
        throw new Error(`Bid too low. Minimum allowed is ${actualMinRequired}`);
      }

      let newCurrentPrice = 0;
      let newHighestBidderId = user.id;

      if (!currentTopBid) {
         newCurrentPrice = startPrice;
         newHighestBidderId = user.id;
      } else {
         const currentMaxBid = Number(currentTopBid.bid_amount); 
         const currentWinnerId = currentTopBid.bidder_id;

         if (user.id === currentWinnerId) {
            newHighestBidderId = user.id;
            newCurrentPrice = currentDisplayPrice; 
         } else {
            if (bidAmount > currentMaxBid) {
                newHighestBidderId = user.id;
                newCurrentPrice = currentMaxBid + stepPrice;

                if (newCurrentPrice > bidAmount) {
                    newCurrentPrice = bidAmount;
                }
            } else if (bidAmount < currentMaxBid) {
                newHighestBidderId = currentWinnerId;
                newCurrentPrice = bidAmount;
                
                if (newCurrentPrice < currentDisplayPrice) {
                    newCurrentPrice = currentDisplayPrice;
                }
            } else {
                newHighestBidderId = currentWinnerId;
                newCurrentPrice = currentMaxBid;
            }
         }
      }

      const newBid = await tx.bidHistory.create({
        data: {
          product_id: prodIdBigInt,
          bidder_id: user.id,
          bid_amount: bidAmount,
        },
      });

      const updatedProduct = await tx.product.update({
        where: { product_id: prodIdBigInt },
        data: {
          current_price: newCurrentPrice,
          current_highest_bidder_id: newHighestBidderId,
          bid_count: { increment: 1 },
        },
      });

      return { newBid, updatedProduct };
    });

    return res.status(200).json({
      message: 'Bid placed successfully!',
      bid: {
        ...result.newBid,
        product_id: result.newBid.product_id.toString(),
        bid_id: result.newBid.bid_id.toString(),
      },
      currentPrice: result.updatedProduct.current_price, 
      currentWinnerId: result.updatedProduct.current_highest_bidder_id,
      isWinner: result.updatedProduct.current_highest_bidder_id === user.id
    });

  } catch (error: any) {
    console.error('Bid Error:', error);

    if (error.message === 'REVIEW_LOW') {
      return res.status(403).json({
        message: 'Your review score is too low to bid on this product (Required > 80%).',
      });
    }
    if (error.message.includes('Bid too low') || error.message === 'Auction has ended') {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};
