import type { Request, Response } from "express";
import * as authService from "../services/auth.services.ts";
import { errorResponse, successResponse } from "../utils/response.ts";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import db from "../services/database.ts"

export const register = async (req: Request, res: Response) => {
  try {
    const result = await authService.create(req.body);

    if (!result.success || !result.user) {
      return res.status(400).json(errorResponse(result.message));
    }

    const user = result.user;

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not set");
    const token = jwt.sign(
      { id: user.user_id, name: user.full_name, email: user.email },
      secret,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60,
    });

    return res.status(201).json(successResponse(
      { name: user.full_name, email: user.email },
      result.message
    ));

  } catch (e) {
    return res.status(500).json(errorResponse(String(e)));
  }
};


export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const data = await authService.authenticateUser({ email, password });

    if (!data.success || !data.user) {
      return res.status(400).json(errorResponse(data.message));
    }

    const user = data.user;
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json(errorResponse(data.message));
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not set");


    const token = jwt.sign(
      { id: user.user_id, name: user.full_name, email: user.email },
      secret,
      { expiresIn: "1h" }
    );


    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60,
    });

    return res.status(200).json(successResponse(
      { name: user.full_name, email: user.email },
      data.message
    ));

  } catch (e) {
    return res.status(500).json(errorResponse(String(e)));
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

    const formattedProducts = nearestEndingProducts.map(product => {
      return {
        name: product.name,
        bid_count: product.bid_count,
        current_price: product.current_price,
        buy_now_price: product.buy_now_price,
        end_time: product.end_time,
        created_at: product.created_at,
        highest_bidder_name: product.current_highest_bidder?.full_name || null,
        image_url: product.images[0]?.image_url || null,
      };
    });

    return res.json(formattedProducts);

  } catch (e) {
    return res.status(500).json(errorResponse(String(e)));
  }
};