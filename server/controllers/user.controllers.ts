import { Request, Response, NextFunction } from "express";
import { PrismaClient } from '@prisma/client';
import { ProductStatus, OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { authenticateUser, changePassword } from "../services/auth.services";
import { errorResponse } from "../utils/response";

const prisma = new PrismaClient();

type BiddingProduct = {
  product_id: number,
  name: string,
  image_url: string,
  status: ProductStatus,
  buy_now_price?: number,
  current_price: number,
  bid_count: number,
  end_time: number,

  seller_name: string,
  category_name: string,
  current_highest_bidder_name?: string
}

type WonProduct = {
  product_id: number;
  name: string;
  image_url: string;
  final_price: number;
  won_at: number; // timestamp
  order_status: OrderStatus;
  seller_name: string;
  category_name: string;
  can_review: boolean;
  order_id: number;
};

type WatchlistItem = {
  product_id: number;
  name: string;
  image_url: string;
  current_price: number;
  buy_now_price?: number;
  bid_count: number;
  end_time: number;
  seller_name: string;
  category_name: string;
  added_at: number;
};

type ReviewReceived = {
  review_id: number;
  reviewer_name: string;
  is_positive: boolean;
  comment: string | null;
  created_at: number;
  product_name: string;
  product_id: number;
};

export const getMyProfile = async (req: Request, res: Response<any>) => {
  try {
    const userID = res.locals.user.id;
    console.log(userID);
    if (!userID) return res.status(401).json({ message: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { user_id: userID },
      select: {
        name: true,
        email: true,
        role: true,
        created_at: true,
        plus_review: true,
        minus_review: true
      }
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    const [
      totalBids, bidsThisWeek, totalWins, watchlistCount,
    ] = await Promise.all([
      prisma.bidHistory.count({ where: { bidder_id: userID } }),
      prisma.bidHistory.count({
        where: {
          bidder_id: userID,
        },

      }),
      prisma.order.count({ where: { buyer_id: userID, status: "completed" } }),
      prisma.watchlist.count({ where: { user_id: userID } }),
    ]);

    const rating = user.plus_review - user.minus_review;
    const ratingLabel =
      rating >= 10 ? "Very Reliable" :
      rating >= 5 ? "Reliable" :
      rating >= 0 ? "Neutral" : "Unreliable";

    const winRate = totalBids > 0 ? Math.floor((totalWins / totalBids) * 100) : 0;

    const rawBiddingProducts = await prisma.bidHistory.findMany({
      where: { 
        bidder_id: userID,
        product: { status: "open" },
      },
      include: {
        product: {
          include: {
            seller: { select: {name: true} },
            category: { select: {
              name_level_1: true,
              name_level_2: true
            }},
            images: {
              take: 1,
              select: { image_url: true }
            },
            current_highest_bidder: { select: {name: true} }
          }
        }
      },
      distinct: ["product_id"],
      orderBy: { bid_time: "desc" },
    });

    const biddingProducts: BiddingProduct[] = rawBiddingProducts.map((item) => ({
      product_id: Number (item.product_id),
      name: item.product.name,
      image_url: item.product.images[0]?.image_url,
      status: item.product.status,
      buy_now_price: item.product.buy_now_price ? Number(item.product.buy_now_price) : undefined,
      current_price: Number(item.product.current_price),
      bid_count: item.product.bid_count,
      end_time: item.product.end_time.getTime(),

      seller_name: item.product.seller.name,
      category_name: `${item.product.category.name_level_1} > ${item.product.category.name_level_2}`,
      current_highest_bidder_name: item.product.current_highest_bidder?.name
    }));

    const rawWonProducts = await prisma.order.findMany({
      where: { buyer_id: userID},
      include: {
        product: {
          include: {
            seller: { select: { name: true }},
            category: {
              select: {
                name_level_1: true,
                name_level_2: true
              }
            },
            images: { take: 1, select: {image_url: true }}
          }
        }
      },
      orderBy: { created_at: "desc" }
    });

    const wonProducts = rawWonProducts.map((item) => ({
      product_id: Number(item.product.product_id),
      order_id: Number(item.order_id),
      name: item.product.name,
      image_url: item.product.images[0]?.image_url,
      final_price: Number(item.final_price),
      won_at: item.created_at.getTime(),
      order_status: item.status,
      seller_name: item.product.seller.name,
      category_name: `${item.product.category.name_level_1} > ${item.product.category.name_level_2}`,
      can_review: !item.buyer_review_id,
    }));

    const rawWatchlist = await prisma.watchlist.findMany({
      where: { user_id: userID },
      include: {
        product: {
          include: {
            seller: { select: { name: true } },
            category: true,
            images: { take: 1, select: { image_url: true } },
          },
        },
      },
      orderBy: { product: { end_time: "asc" } },
    });

    const myWatchlist = rawWatchlist.map((item): WatchlistItem => ({
      product_id: Number(item.product.product_id),
      name: item.product.name,
      image_url: item.product.images[0]?.image_url,
      current_price: Number(item.product.current_price),
      buy_now_price: item.product.buy_now_price ? Number(item.product.buy_now_price) : undefined,
      bid_count: item.product.bid_count,
      end_time: item.product.end_time.getTime(),
      seller_name: item.product.seller.name,
      category_name: `${item.product.category.name_level_1} > ${item.product.category.name_level_2}`,
      added_at: item.product.created_at.getTime(),
    }));

    const rawRatings = await prisma.reviews.findMany({
      where: { reviewee_id: userID },
      include: {
        reviewer: { select: { name: true } },
        product: { select: { name: true, product_id: true } },
      },
      orderBy: { created_at: "desc" },
    });

    const myRatings = rawRatings.map((item): ReviewReceived => ({
      review_id: Number(item.review_id),
      reviewer_name: item.reviewer.name,
      is_positive: item.is_positive,
      comment: item.comment,
      created_at: item.created_at.getTime(),
      product_name: item.product.name,
      product_id: Number(item.product.product_id),
    }));

    res.json({
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      total_bids: totalBids,
      bids_this_week: bidsThisWeek,
      total_wins: totalWins,
      win_rate: winRate,
      watchlist_count: watchlistCount,
      rating,
      rating_label: ratingLabel,
      bidding_products: biddingProducts,
      won_products: wonProducts,
      watchlist: myWatchlist,
      ratings: myRatings
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userID = req.params.id;

    if (!userID)
      return res.status(400).json({ message: "Invalid user ID" });

    const user = await prisma.user.findUnique({
      where: { user_id: userID }
    });

    if (!user)
      return res.status(404).json({ message: "User not found" });

    const [totalBids, bidsThisWeek, totalWins, numbWatchlist] = await Promise.all([
      prisma.bidHistory.count({
        where:{ bidder_id: userID }
      }),
      prisma.bidHistory.count({
        where: {
          bidder_id: userID,
          bid_time: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        }
      }),
      prisma.order.count({
        where: {
          buyer_id: userID,
          status: "completed"
        }
      }),
      prisma.watchlist.count({
        where: { user_id: userID }
      })
    ]);

    const ratingPoint = user.plus_review - user.minus_review;
    let ratingLabel = "Unreliable";
    if (ratingPoint >= 10) ratingLabel = "Very Reliable";
    else if (ratingPoint >= 5) ratingLabel = "Reliable";
    else if (ratingPoint >= 0) ratingLabel = "Neutral";

    const winRate = totalBids > 0 ? Math.floor((totalWins / totalBids) * 100) : 0;
    
    return res.json({
      ...user,
      total_bids: totalBids,
      bids_this_week: bidsThisWeek,
      total_wins: totalWins,
      win_rate: winRate,
      watchlist_count: numbWatchlist,
      rating: ratingPoint,
      rating_label: ratingLabel
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }

}

// API: PATCH /api/users/profile
export const editUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: Can't find user" });
    }

    // 2. Lấy dữ liệu từ body
    const { name, email, birthdate, address } = req.body as {
      name?: string;
      email?: string;
      birthdate?: Date; // format: "1999-12-31"
      address?: string;
    };

    // 3. Validate cơ bản
    if (!name && !email && !address && !birthdate) {
      return res.status(400).json({ message: "No personal data to change" });
    }

    // if (name && (name.trim().length < 2 || name.trim().length > 50)) {
    //   return res.status(400).json({ message: "Tên phải từ 2 đến 50 ký tự" });
    // }

    if (birthdate) {
      const date = new Date(birthdate);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: "Ngày sinh không hợp lệ" });
      }
      // const age = new Date().getFullYear() - date.getFullYear();
      // if (age < 13 || age > 100) {
      //   return res.status(400).json({ message: "Tuổi phải từ 13 đến 100" });
      // }
    }

    // 4. Cập nhật vào DB
    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: {
        name: name?.trim(),
        email: email?.trim(),
        address: address?.trim() || null,
        birthdate: birthdate ? new Date(birthdate) : undefined,
      },
      select: {
        user_id: true,
        name: true,
        email: true,
        address: true,
        birthdate: true,
      },
    });

    // 5. Trả về kết quả đẹp
    return res.status(200).json({
      message: "Cập nhật hồ sơ thành công!",
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        address: updatedUser.address,
        birthdate: updatedUser.birthdate?.toISOString().split("T")[0] || null,
      },
    });
  } catch (e) {
    // console.error("Edit profile error:", error);
    // // Nếu user không tồn tại
    // if (error.code === "P2025") {
    //   return res.status(404).json({ message: "Không tìm thấy người dùng" });
    // }
    return res.status(500).json(errorResponse(e));
  }
};