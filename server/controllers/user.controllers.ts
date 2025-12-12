import { Request, Response, NextFunction } from "express";
import { PrismaClient } from '@prisma/client';
import { ProductStatus, OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { authenticateUser, changePassword } from "../services/auth.services";
import { errorResponse, successResponse } from "../utils/response";
import { locales, string } from "zod";
import { Decimal } from "@prisma/client/runtime/library";
import { profile } from "console";
import { ResolveFnOutput } from "module";
import { useParams } from "react-router-dom";

const prisma = new PrismaClient();

type BiddingProduct = {
  product_id: number,
  name: string,
  image_url: string,
  status: ProductStatus,
  max_bid: number,
  buy_now_price?: number,
  current_price: number,
  bid_count: number,
  end_time: string,

  seller_name: string,
  category_name: string,
  current_highest_bidder_name?: string
}

type WonProduct = {
  product_id: number;
  name: string;
  image_url: string;
  final_price: number;
  won_at: string;
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
  current_highest_bidder_name?: string,
  current_price: number;
  buy_now_price?: number;
  bid_count: number;
  end_time: string;
  seller_name: string;
  category_name: string;
};

type ReviewReceived = {
  review_id: number;
  reviewer_name: string;
  is_positive: boolean;
  comment: string | null;
  created_at: string;
  product_name: string;
  product_id: number;
};

export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const userID = res.locals.user.id;
    if (!userID) return res.status(401).json({ message: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { user_id: userID },
      select: {
        name: true,
        email: true,
        birthdate: true,
        address: true,
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
      select: {
        bid_amount: true,          // 👈 THÊM DÒNG NÀY
        bid_time: true,            // (nếu cần)
        product_id: true,          // (nên lấy để biết thuộc product nào)
        product: {
          include: {
            seller: { select: { name: true } },
            category: {
              select: {
                name_level_1: true,
                name_level_2: true,
              },
            },
            images: {
              take: 1,
              select: { image_url: true },
            },
            current_highest_bidder: {
              select: { name: true },
            },
          },
        },
      },
      distinct: ["product_id"],
      orderBy: { bid_time: "desc" },
    });


    const biddingProducts: BiddingProduct[] = rawBiddingProducts.map((item) => ({
      product_id: Number (item.product_id),
      name: item.product.name,
      image_url: item.product.images[0]?.image_url,
      status: item.product.status,
      max_bid: Number(item.bid_amount),
      buy_now_price: item.product.buy_now_price ? Number(item.product.buy_now_price) : undefined,
      current_price: Number(item.product.current_price),
      bid_count: item.product.bid_count,
      end_time: item.product.end_time? new Date(item.product.end_time).toDateString() : "",

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
            images: { take: 1, select: {image_url: true }},
          }
        }
      },
      orderBy: { created_at: "desc" }
    });

    const wonProducts: WonProduct[] = rawWonProducts.map((item) => ({
      product_id: Number(item.product.product_id),
      name: item.product.name,
      image_url: item.product.images[0]?.image_url,
      final_price: Number(item.final_price),
      won_at: item.created_at? new Date(item.created_at).toLocaleDateString() : "",
      order_status: item.status,
      seller_name: item.product.seller.name,
      category_name: `${item.product.category.name_level_1} > ${item.product.category.name_level_2}`,
      can_review: !item.buyer_review_id,
      order_id: Number(item.order_id)
    }));

    const rawWatchlist = await prisma.watchlist.findMany({
      where: { user_id: userID },
      include: {
        product: {
          include: {
            seller: { select: { name: true } },
            category: true,
            images: { take: 1, select: { image_url: true } },
            current_highest_bidder: { select: { name: true } }
          },
        },
      },
      orderBy: { product: { end_time: "desc" } },
    });

    const myWatchlist: WatchlistItem[] = rawWatchlist.map((item) => ({
      product_id: Number(item.product.product_id),
      name: item.product.name,
      image_url: item.product.images[0]?.image_url,
      current_price: Number(item.product.current_price),
      buy_now_price: item.product.buy_now_price ? Number(item.product.buy_now_price) : undefined,
      bid_count: item.product.bid_count,
      end_time: item.product.end_time? new Date(item.product.end_time).toDateString() : "",
      seller_name: item.product.seller.name,
      category_name: `${item.product.category.name_level_1} > ${item.product.category.name_level_2}`,
      current_highest_bidder_name: item.product.current_highest_bidder?.name
    }));

    const rawRatings = await prisma.reviews.findMany({
      where: { reviewee_id: userID },
      include: {
        reviewer: { select: { name: true } },
        product: { select: { name: true, product_id: true } },
      },
      orderBy: { created_at: "desc" },
    });

    const myRatings: ReviewReceived[] = rawRatings.map((item) => ({
      review_id: Number(item.review_id),
      reviewer_name: item.reviewer.name,
      is_positive: item.is_positive,
      comment: item.comment,
      created_at: item.created_at ? new Date(item.created_at).toDateString() : "",
      product_name: item.product.name,
      product_id: Number(item.product.product_id),
    }));

    res.json({
      name: user.name,
      email: user.email,
      birthdate: user.birthdate? new Date(user.birthdate).toLocaleDateString() : "",
      address: user.address,
      role: user.role,
      created_at: user.created_at ? new Date(user.created_at).toLocaleDateString() : "",
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

// API: PATCH /api/users/profile
export const editUserProfile = async (req: Request, res: Response) => {
  try {
    console.log("Gọi thành công")
    const userId = res.locals.user.id;
    console.log(`Lấy id ${userId} thành công`)

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: Can't find user" });
    }

    // 2. Lấy dữ liệu từ body
    const { name, email, birthdate, address } = req.body as {
      name?: string;
      email?: string;
      birthdate?: string; // format: "1999-12-31"
      address?: string;
    };

    // 3. Validate cơ bản
    if (!name && !email && !address && !birthdate) {
      return res.status(400).json({ message: "No personal data to change" });
    }

    const updateData: any = {};

    if (name) {
      if (name.trim().length < 2) return res.status(400).json({ message: "Name is too short" });
      updateData.name = name.trim();
    }

    if (email) {
      updateData.email = email.trim().toLowerCase();
    }

    if (address) {
      updateData.address = address.trim() === "" ? null : address.trim();
    }

    if (birthdate) {
      const date = new Date(birthdate);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: "Invalid birthdate format" });
      }
      updateData.birthdate = date;
    }

    console.log(updateData)

    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: updateData,
      select: {
        user_id: true,
        name: true,
        email: true,
        address: true,
        birthdate: true,
        updated_at: true
      },
    });

    console.log(updatedUser)

    return res.status(200).json({
      message: "Cập nhật hồ sơ thành công!",
      user: {
        ...updatedUser,
        birthdate: updatedUser.birthdate
          ? updatedUser.birthdate.toISOString().split("T")[0] 
          : null,
      },
    });
  } catch (e: any) {
    // Xử lý lỗi Prisma
    if (e.code === 'P2025') {
      return res.status(404).json({ message: "User not found" });
    }

    // P2002: Unique constraint violation (Lỗi trùng Email)
    if (e.code === 'P2002' && e.meta?.target?.includes('email')) {
      return res.status(409).json({ message: "Email already exists" });
    }

    console.log("Failed rồi\n")
    return res.status(500).json(errorResponse(e));  }
};

export const deleteWatchlistProduct = async (req: Request, res: Response) => {
  try {
    const user_id = res.locals.user.id;
    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized: Can't find user" });
    }

    const {product_id} = req.params;
    if (!product_id) {
        return res.status(400).json({ message: "Product ID is required" });
    }


    const result = await prisma.watchlist.deleteMany({
      where: {
        user_id: user_id,
        product_id: BigInt(product_id)
      }
    })

    if (result.count === 0) {
      return res.status(404).json({ message: "Product not found in your watchlist" });
    }

    return res.status(200).json({ message: "Removed product from watchlist successfully" });

  } catch (error) {
    console.error("Delete watchlist error:", error);
    
    // Xử lý lỗi convert BigInt nếu user gửi id linh tinh (vd: "abc")
    if (error instanceof SyntaxError || (error as any).code === 'P2002') { 
      return res.status(400).json({ message: "Invalid Product ID format" });
    }

    return res.status(500).json(errorResponse(String(error)));
  }
}

export const requestRole = async (req: Request, res: Response) => {
  try {
    const user_id = res.locals.user.id;
    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized: Can't find user" });
    }

    const { message } = req.body as {
      message: string
    };

    const existingRequest = await prisma.sellerUpgradeRequest.findUnique({
      where: { user_id: user_id }
    });

    // Nếu đã có record
    if (existingRequest) {
      // Trường hợp 1: Đã là Seller hoặc đã được duyệt
      if (existingRequest.is_approved) {
        return res.status(400).json({ message: "You are already a Seller" });
      }

      // Trường hợp 2: Đang chờ duyệt (Chưa duyệt và chưa bị từ chối)
      if (!existingRequest.is_approved && !existingRequest.is_denied) {
        return res.status(409).json({ message: "Request is pending approval" });
      }
      
      // Trường hợp 3: Đã bị từ chối trước đó -> Cho phép gửi lại (UPDATE record cũ)
      // Reset is_denied = false, cập nhật message và thời gian gửi
      const updatedResult = await prisma.sellerUpgradeRequest.update({
        where: { user_id: user_id },
        data: {
            message: message,
            is_denied: false,       // Reset trạng thái từ chối
            is_approved: false,     // Đảm bảo chưa duyệt
            requested_at: new Date() // Cập nhật lại thời gian gửi
        }
      });

      return res.json(successResponse(null, updatedResult.message ? updatedResult.message : "Re-submitted request successfully"));
    }

    const result = await prisma.sellerUpgradeRequest.create({
      data: {
        user_id: user_id,
        message: message
      }
    })

    return res.json(successResponse(null, result.message? result.message : "Success"))
  } catch (error) {
    return res.status(500).json(errorResponse(String(error)));
  }



}