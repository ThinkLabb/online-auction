import db from '../services/database.ts';
import type { Request, Response } from 'express';
import { errorResponse, successResponse } from '../utils/response.ts';
import path from 'path';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import * as productService from '../services/product.services.ts'
import { timeEnd } from 'console';

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
          gt: new Date(), // Chỉ lấy các sản phẩm có thời gian kết thúc > hiện tại
        },
      },
      take: 5,
      orderBy: {
        end_time: 'asc', // Sắp xếp tăng dần: Cái nào gần hiện tại nhất (nhỏ nhất trong tương lai) sẽ lên đầu
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
        // Cần đảm bảo convert BigInt sang string/number để tránh lỗi res.json
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

// 1. Get 5 products with the most bids (Hot items)
export const getTopBiddedProducts = async (req: Request, res: Response) => {
  try {
    const topBiddedProducts = await db.prisma.product.findMany({
      where: {
        end_time: {
          gt: new Date(), // Only get active products
        },
      },
      take: 5,
      orderBy: {
        bid_count: 'desc', // Sort by bid count from High to Low
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
          gt: new Date(), // Only get active products
        },
      },
      take: 5,
      orderBy: {
        current_price: 'desc', // Sort by price from High to Low
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

// Helper to serialize BigInt (Prisma returns BigInt, JSON.stringify fails on it)
const bigIntReplacer = (key: string, value: any) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

// Helper to calculate rating (0-5 stars) based on plus/minus reviews
const calculateRating = (plus: number, minus: number) => {
  const total = plus + minus;
  if (total === 0) return 0;
  // Simple calculation: percentage of positive reviews * 5
  return Number(((plus / total) * 5).toFixed(1));
};

// ... imports and helper functions (bigIntReplacer, calculateRating) remain the same

export const getProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

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

    // ... time calculation logic remains the same ...
    const now = new Date();
    const endTime = new Date(productData.end_time);
    const timeLeftMs = endTime.getTime() - now.getTime();
    const daysLeft = Math.floor(timeLeftMs / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((timeLeftMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const endsInString = timeLeftMs > 0 ? `${daysLeft} days ${hoursLeft} hours` : 'Ended';

    // --- CHANGED: Transform description history into an array of objects ---
    const descriptionList = productData.description_history.map((hist) => ({
      text: hist.description,
      date: new Date(hist.added_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
    }));

    // If no description exists, provide a fallback
    if (descriptionList.length === 0) {
      descriptionList.push({ 
        text: "No description provided.", 
        date: new Date(productData.created_at).toLocaleDateString() 
      });
    }

    const responseData = {
      // ... keep other fields ...
      id: productData.product_id,
      title: productData.name,
      postedDate: new Date(productData.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      endsIn: endsInString,
      currentBid: Number(productData.current_price),
      bidsPlaced: productData.bid_count,
      buyNowPrice: productData.buy_now_price ? Number(productData.buy_now_price) : 0,
      minBidStep: Number(productData.step_price),
      
      images: productData.images.length > 0 
        ? productData.images.map(img => img.image_url) 
        : ['https://via.placeholder.com/600x400?text=No+Image'],

      details: {
        brand: productData.category.name_level_1,
        year: "N/A",
        condition: "Used", 
        engine: productData.category.name_level_2,
        frameMaterial: 'See description',
        color: 'See description',
        performance: 'See description',
        exhaust: 'See description',
      },

      // --- NEW DESCRIPTION STRUCTURE ---
      description: descriptionList, 

      conditionText: "Please refer to images and description for full condition details.",
      
      seller: {
        name: productData.seller.name,
        rating: calculateRating(productData.seller.plus_review, productData.seller.minus_review),
        reviews: productData.seller.plus_review + productData.seller.minus_review,
      },
      topBidder: productData.current_highest_bidder ? {
        name: productData.current_highest_bidder.name,
        rating: calculateRating(productData.current_highest_bidder.plus_review, productData.current_highest_bidder.minus_review),
        reviews: productData.current_highest_bidder.plus_review + productData.current_highest_bidder.minus_review,
      } : {
        name: "No Bids Yet",
        rating: 0,
        reviews: 0
      },
      qa: productData.q_and_a.map(qa => ({
        question: qa.question_text,
        asker: qa.questioner.name,
        answer: qa.answer_text || "Waiting for response...",
        responder: qa.answer_text ? `${productData.seller.name} (Seller)` : null,
        time: new Date(qa.question_time).toLocaleDateString(),
      })),
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
}

type SortField = 'end_time' | 'current_price';
type SortOrder = 'asc' | 'desc';

export const getProductsLV = async (req: Request, res: Response) => {
  try {
     const { level1, level2 } = req.params;

    const sortQuery = req.query.sort as SortField | undefined;
    const orderQuery = req.query.order as SortOrder | undefined;
    
    const pageQuery = req.query.page ? parseInt(req.query.page as string) : 1;
    const limitQuery = req.query.limit ? parseInt(req.query.limit as string) : 10; // Mặc định 10

    const page = Math.max(1, pageQuery);
    const limit = Math.max(1, limitQuery);
    const skip = (page - 1) * limit;

    const whereClause: any = {
      category: {
        name_level_1: String(level1),
      },
    };

    if (level2 && level2 !== "*") {
      whereClause.category.name_level_2 = String(level2);
    }

    let orderByClause: any = {};
    const sortField: SortField = sortQuery && ['end_time', 'current_price'].includes(sortQuery) ? sortQuery : 'end_time';                                    
    const sortOrder: SortOrder = orderQuery && ['asc', 'desc'].includes(orderQuery) ? orderQuery : 'asc';

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

    return res.json({products: formattedProducts, totalItems: totalItems});
  } catch (e) {
    return res.status(500).json(errorResponse(String(e)));
  }
};