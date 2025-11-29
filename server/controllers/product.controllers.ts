import db from '../services/database.ts';
import type { Request, Response } from 'express';
import { errorResponse } from '../utils/response.ts';
import path from 'path';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

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

export const getProducts = async (req: Request, res: Response) => {
  try {
    const nearestEndingProducts = await db.prisma.product.findMany({
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

    return res.json(formattedProducts);
  } catch (e) {
    return res.status(500).json(errorResponse(String(e)));
  }
};
