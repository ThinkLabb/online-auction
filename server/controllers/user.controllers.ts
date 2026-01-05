import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ProductStatus, OrderStatus, UserRole } from '@prisma/client';
import { errorResponse, successResponse } from '../utils/response';
import { UserServices } from '../services/user.services';

const prisma = new PrismaClient();

export interface Profile {
  role: UserRole;
  email: string;
  name: string;
  address: string | null;
  birthdate: string | null;
  created_at: string;
  plus_review: number;
  minus_review: number;
}

export interface ProductCard {
  product_id: string;
  name: string;
  thumbnail_url: string;

  category: {
    category_id: string;
    category_name_level_1: string;
    category_name_level_2: string;
  };

  current_price: number; // giá cuối cùng đối với sản phẩm đã bán
  bid_count: number;
  end_time: string;
}

export interface UserProduct extends ProductCard {
  seller: {
    user_id: string;
    name: string;
  };
}

export interface FollowingProduct extends UserProduct {
  status: ProductStatus;
  buy_now_price: number;
  current_highest_bidder: {
    user_id: string;
    name: string;
  } | null;
  reviews_count: number;
}

export interface BiddingProduct extends FollowingProduct {
  bid_at: string;
  bid_amount: number;
}

export interface BiddingProducts {
  products: BiddingProduct[];
}

export interface WatchlistProducts {
  products: FollowingProduct[];
}

export interface WonProduct extends UserProduct {
  order: {
    order_id: string;
    final_price: number;
    status: OrderStatus;
    created_at: string;
  };
  review_needed: boolean;
  review: {
    review_id: string;
    is_positive: boolean;
    comment: string | null;
    created_at: string;
  } | null;
}

export interface WonProducts {
  products: WonProduct[];
}

export interface SellingProduct extends ProductCard {
  start_price: number;
  buy_now_price: number;

  highest_bidder: {
    user_id: string;
    name: string;
  } | null;

  created_at: string;
  auto_extend: boolean;
  editable: boolean; // True nếu chưa có ai bid
  reviews_count: number;
}

export interface SellingProducts {
  products: SellingProduct[];
}

export interface SoldProduct extends ProductCard {
  order: {
    order_id: string;
    order_status: OrderStatus;
    created_at: string;
    updated_at: string;

    buyer: {
      user_id: string;
      name: string;
    };

    my_review: {
      review_id: string;
      is_positive: boolean;
      comment: string | null;
      created_at: string;
    } | null;
  } | null;

  can_cancel: boolean;
}

export interface SoldProducts {
  products: SoldProduct[];
}

export interface Review {
  review_id: string;
  reviewer: {
    user_id: string;
    name: string;
  };

  product: {
    product_id: string;
    product_name: string;
    category: {
      category_id: string;
      category_name_level_1: string;
      category_name_level_2: string;
    };
    thumbnail_url: string;
  };

  is_positive: boolean;
  comment: string | null;
  created_at: string;
}

export interface Reviews {
  reviews: Review[];
}

export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const user_id = res.locals.user.id;
    if (!user_id) return res.status(401).json(errorResponse('Unauthorized'));

    const user = await UserServices.getUser(user_id);
    if (!user) return res.status(404).json(errorResponse('User not found in db'));

    const payload: Profile = {
      role: user.role,
      email: user.email,
      name: user.name,
      address: user.address,
      birthdate: user.birthdate ? user.birthdate.toISOString() : null,
      created_at: user.created_at.toISOString(),
      plus_review: user.plus_review,
      minus_review: user.minus_review,
    };

    res.status(200).json(successResponse(user, 'Get profile successfully'));
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json(errorResponse(err.message));
  }
};

// API: PATCH /api/users/profile
export const editUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: Can't find user" });
    }

    const { name, email, birthdate, address } = req.body as {
      name?: string;
      email?: string;
      birthdate?: string;
      address?: string;
    };

    if (!name && !email && !address && !birthdate) {
      return res.status(400).json(errorResponse('No personal data to change'));
    }

    const updateData: any = {};

    if (email) {
      updateData.email = email.trim().toLowerCase();
    }

    if (address) {
      updateData.address = address.trim() === '' ? null : address.trim();
    }

    if (birthdate) {
      const date = new Date(birthdate);
      if (isNaN(date.getTime())) {
        return res.status(400).json(errorResponse('Invalid birthdate format'));
      }
      updateData.birthdate = date;
    }

    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: updateData,
      select: {
        user_id: true,
        name: true,
        email: true,
        address: true,
        birthdate: true,
        updated_at: true,
      },
    });

    return res.status(200).json({
      message: 'Cập nhật hồ sơ thành công!',
      user: {
        ...updatedUser,
        birthdate: updatedUser.birthdate ? updatedUser.birthdate.toISOString().split('T')[0] : null,
      },
    });
  } catch (e: any) {
    if (e.code === 'P2025') {
      return res.status(404).json(errorResponse('User not found'));
    }

    if (e.code === 'P2002' && e.meta?.target?.includes('email')) {
      return res.status(409).json(errorResponse('Email already exists'));
    }

    return res.status(500).json(errorResponse(e.message));
  }
};

export const deleteWatchlistProduct = async (req: Request, res: Response) => {
  try {
    const user_id = res.locals.user.id;
    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized: Can't find user" });
    }

    const { product_id } = req.params;
    if (!product_id) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const result = await prisma.watchlist.deleteMany({
      where: {
        user_id: user_id,
        product_id: BigInt(product_id),
      },
    });

    if (result.count === 0) {
      return res.status(404).json({ message: 'Product not found in your watchlist' });
    }

    return res.status(200).json({ message: 'Removed product from watchlist successfully' });
  } catch (error) {
    console.error('Delete watchlist error:', error);

    // Xử lý lỗi convert BigInt nếu user gửi id linh tinh (vd: "abc")
    if (error instanceof SyntaxError || (error as any).code === 'P2002') {
      return res.status(400).json({ message: 'Invalid Product ID format' });
    }

    return res.status(500).json(errorResponse(String(error)));
  }
};

// export const deleteSellerlistProduct = async (req: Request, res: Response) => {
//   try {
//     const user_id = res.locals.user.id;
//     if (!user_id) {
//       return res.status(401).json(errorResponse("Unauthorized: Can't find user"));
//     }

//     const { product_id } = req.params;
//     if (!product_id) {
//       return res.status(400).json(errorResponse('Product ID is required'));
//     }

//     const result = await prisma.product.updateMany({
//       where: {
//         seller_id: user_id,
//         product_id: BigInt(product_id),
//       },
//       data: {
//         status: ProductStatus.removed,
//       },
//     });

//     if (result.count === 0) {
//       return res.status(404).json({ message: 'Product not found in your watchlist' });
//     }

//     return res.status(200).json({ message: 'Removed product from watchlist successfully' });
//   } catch (error) {
//     console.error('Delete seller list error:', error);

//     // Xử lý lỗi convert BigInt nếu user gửi id linh tinh (vd: "abc")
//     if (error instanceof SyntaxError || (error as any).code === 'P2002') {
//       return res.status(400).json({ message: 'Invalid Product ID format' });
//     }

//     return res.status(500).json(errorResponse(String(error)));
//   }
// };

export const requestRole = async (req: Request, res: Response) => {
  try {
    const user_id = res.locals.user.id;
    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized: Can't find user" });
    }

    const { message, request_type } = req.body as {
      message: string;
      request_type?: string;
    };

    // Only accept 'temporary' requests (7 days)
    const validRequestType = 'temporary';

    const existingRequest = await prisma.sellerUpgradeRequest.findUnique({
      where: { user_id: user_id },
    });

    // Nếu đã có record
    if (existingRequest) {
      // Trường hợp 1: Đã là Seller hoặc đã được duyệt
      if (existingRequest.is_approved) {
        return res.status(400).json({ message: 'You are already a Seller' });
      }

      // Trường hợp 2: Đang chờ duyệt (Chưa duyệt và chưa bị từ chối)
      if (!existingRequest.is_approved && !existingRequest.is_denied) {
        return res.status(409).json({ message: 'Request is pending approval' });
      }

      // Trường hợp 3: Đã bị từ chối trước đó -> Cho phép gửi lại (UPDATE record cũ)
      // Reset is_denied = false, cập nhật message và thời gian gửi
      const updatedResult = await prisma.sellerUpgradeRequest.update({
        where: { user_id: user_id },
        data: {
          message: message,
          request_type: validRequestType,
          is_denied: false, // Reset trạng thái từ chối
          is_approved: false, // Đảm bảo chưa duyệt
          requested_at: new Date(), // Cập nhật lại thời gian gửi
        },
      });

      return res.json(
        successResponse(
          null,
          updatedResult.message ? updatedResult.message : 'Re-submitted request successfully'
        )
      );
    }

    const result = await prisma.sellerUpgradeRequest.create({
      data: {
        user_id: user_id,
        message: message,
        request_type: validRequestType,
      },
    });

    return res.json(successResponse(null, result.message ? result.message : 'Success'));
  } catch (error) {
    return res.status(500).json(errorResponse(String(error)));
  }
};

export const getSellerStatus = async (req: Request, res: Response) => {
  try {
    const user_id = res.locals.user.id;
    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized: Can't find user" });
    }

    // Get user role
    const user = await prisma.user.findUnique({
      where: { user_id: user_id },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user is a seller, check if they have an expiration date
    if (user.role === 'seller') {
      const upgradeRequest = await prisma.sellerUpgradeRequest.findUnique({
        where: { user_id: user_id },
        select: {
          expires_at: true,
          is_approved: true,
          request_type: true,
        },
      });

      if (upgradeRequest && upgradeRequest.is_approved) {
        // Temporary seller (has expiration date)
        if (upgradeRequest.request_type === 'temporary' && upgradeRequest.expires_at) {
          const now = new Date();
          const millisecondsRemaining = upgradeRequest.expires_at.getTime() - now.getTime();
          const daysRemaining = Math.ceil(millisecondsRemaining / (1000 * 60 * 60 * 24));
          const hoursRemaining = Math.floor(millisecondsRemaining / (1000 * 60 * 60));

          return res.json(
            successResponse(
              {
                role: 'seller',
                requestType: 'temporary',
                isTemporary: true,
                expiresAt: upgradeRequest.expires_at.toISOString(),
                daysRemaining: Math.max(0, daysRemaining),
                hoursRemaining: Math.max(0, hoursRemaining),
              },
              'Seller status retrieved'
            )
          );
        }

        // Permanent seller
        return res.json(
          successResponse(
            {
              role: 'seller',
              requestType: 'permanent',
              isTemporary: false,
            },
            'Seller status retrieved'
          )
        );
      }

      // Permanent seller (no expiration)
      return res.json(
        successResponse(
          {
            role: 'seller',
            isTemporary: false,
          },
          'Seller status retrieved'
        )
      );
    }

    // Not a seller
    return res.json(
      successResponse(
        {
          role: user.role,
          isTemporary: false,
        },
        'User status retrieved'
      )
    );
  } catch (error) {
    return res.status(500).json(errorResponse(String(error)));
  }
};

export const UserControllers = {
  BidderControllers: {
    getBiddingProducts: async (req: Request, res: Response) => {
      try {
        const user_id = res.locals.user.id;
        if (!user_id) return res.status(401).json(errorResponse('Unauthorized'));

        const products = await UserServices.BidderServices.getBiddingProducts(user_id);

        const payload: BiddingProduct[] = products.map((product) => ({
          product_id: product.product.product_id.toString(),
          name: product.product.name,
          thumbnail_url: product.product.images[0].image_url,

          category: {
            category_id: product.product.category.category_id.toString(),
            category_name_level_1: product.product.category.name_level_1,
            category_name_level_2: product.product.category.name_level_2
              ? product.product.category.name_level_2
              : '',
          },

          current_price: Number(product.product.current_price), // giá cuối cùng đối với sản phẩm đã bán
          bid_count: product.product.bid_count,
          end_time: new Date(product.product.end_time).toLocaleDateString(),

          seller: {
            user_id: product.product.seller.user_id,
            name: product.product.seller.name,
          },

          status: product.product.status,
          buy_now_price: Number(product.product.buy_now_price),
          current_highest_bidder: product.product.current_highest_bidder
            ? {
                user_id: product.product.current_highest_bidder.user_id,
                name: product.product.current_highest_bidder.name,
              }
            : null,

          reviews_count: product.product._count.reviews,
          bid_at: new Date(product.bid_time).toLocaleDateString(),
          bid_amount: Number(product.bid_amount),
        }));

        return res
          .status(200)
          .json(
            successResponse(
              payload,
              payload.length ? 'Get bidding products successfullly' : 'No bidding product'
            )
          );
      } catch (e) {
        console.log(e);
        return res.status(500).json(errorResponse('Internal server error'));
      }
    },
    getBiddedProducts: async (req: Request, res: Response) => {
      try {
        const user_id = res.locals.user.id;
        if (!user_id) return res.status(401).json(errorResponse('Unauthorized'));

        const products = await UserServices.BidderServices.getBiddedProducts(user_id);

        const payload: BiddingProduct[] = products.map((product) => ({
          product_id: product.product.product_id.toString(),
          name: product.product.name,
          thumbnail_url: product.product.images[0].image_url,

          category: {
            category_id: product.product.category.category_id.toString(),
            category_name_level_1: product.product.category.name_level_1,
            category_name_level_2: product.product.category.name_level_2
              ? product.product.category.name_level_2
              : '',
          },

          current_price: Number(product.product.current_price), // giá cuối cùng đối với sản phẩm đã bán
          bid_count: product.product.bid_count,
          end_time: new Date(product.product.end_time).toLocaleDateString(),

          seller: {
            user_id: product.product.seller.user_id,
            name: product.product.seller.name,
          },

          status: product.product.status,
          buy_now_price: Number(product.product.buy_now_price),
          current_highest_bidder: product.product.current_highest_bidder
            ? {
                user_id: product.product.current_highest_bidder.user_id,
                name: product.product.current_highest_bidder.name,
              }
            : null,

          reviews_count: product.product._count.reviews,
          bid_at: new Date(product.bid_time).toLocaleDateString(),
          bid_amount: Number(product.bid_amount),
        }));

        return res
          .status(200)
          .json(
            successResponse(
              payload,
              payload.length ? 'Get bidding products successfullly' : 'No bidding product'
            )
          );
      } catch (e) {
        console.log(e);
        return res.status(500).json(errorResponse('Internal server error'));
      }
    },
    getWonProducts: async (req: Request, res: Response) => {
      try {
        const user_id = res.locals.user.id;
        if (!user_id) return res.status(401).json(errorResponse('Unauthorized'));

        const products = await UserServices.BidderServices.getWonProducts(user_id);

        const payload: WonProduct[] = products.map((product) => ({
          product_id: product.product.product_id.toString(),
          name: product.product.name,
          thumbnail_url: product.product.images[0].image_url,

          category: {
            category_id: product.product.category.category_id.toString(),
            category_name_level_1: product.product.category.name_level_1,
            category_name_level_2: product.product.category.name_level_2
              ? product.product.category.name_level_2
              : '',
          },

          current_price: Number(product.product.current_price),
          bid_count: product.product.bid_count,
          end_time: new Date(product.product.end_time).toLocaleDateString(),

          seller: {
            user_id: product.product.seller.user_id,
            name: product.product.seller.name,
          },

          order: {
            order_id: product.order_id.toString(),
            final_price: Number(product.final_price),
            status: product.status,
            created_at: new Date(product.created_at).toLocaleDateString(),
          },

          review_needed: product.product.review_needed,
          review: product.buyer_review
            ? {
                review_id: product.buyer_review.review_id.toString(),
                is_positive: product.buyer_review.is_positive,
                comment: product.buyer_review.comment,
                created_at: new Date(product.buyer_review.created_at).toLocaleDateString(),
              }
            : null,
        }));

        return res
          .status(200)
          .json(
            successResponse(
              payload,
              payload.length ? 'Get won products successfullly' : 'No won product'
            )
          );
      } catch (e) {
        console.log(e);
        return res.status(500).json(errorResponse('Internal server error'));
      }
    },
    getWatchlistProducts: async (req: Request, res: Response) => {
      try {
        const user_id = res.locals.user.id;
        if (!user_id) return res.status(401).json(errorResponse('Unauthorized'));

        const products = await UserServices.BidderServices.getWatchlistProducts(user_id);

        const payload: FollowingProduct[] = products.map((product) => ({
          product_id: product.product.product_id.toString(),
          name: product.product.name,
          thumbnail_url: product.product.images[0].image_url,

          category: {
            category_id: product.product.category.category_id.toString(),
            category_name_level_1: product.product.category.name_level_1,
            category_name_level_2: product.product.category.name_level_2
              ? product.product.category.name_level_2
              : '',
          },

          current_price: Number(product.product.current_price), // giá cuối cùng đối với sản phẩm đã bán
          bid_count: product.product.bid_count,
          end_time: new Date(product.product.end_time).toLocaleDateString(),

          seller: {
            user_id: product.product.seller.user_id,
            name: product.product.seller.name,
          },

          status: product.product.status,
          buy_now_price: Number(product.product.buy_now_price),
          current_highest_bidder: product.product.current_highest_bidder
            ? {
                user_id: product.product.current_highest_bidder.user_id,
                name: product.product.current_highest_bidder.name,
              }
            : null,

          reviews_count: product.product._count.reviews,
        }));

        return res
          .status(200)
          .json(
            successResponse(
              payload,
              payload.length ? 'Get bidding products successfullly' : 'No bidding product'
            )
          );
      } catch (e) {
        console.log(e);
        return res.status(500).json(errorResponse('Internal server error'));
      }
    },

    getReviews: async (req: Request, res: Response) => {
      try {
        const user_id = res.locals.user.id;
        if (!user_id) return res.status(401).json(errorResponse('Unauthorized'));

        const reviews = await UserServices.BidderServices.getReviews(user_id);

        const payload: Review[] = reviews.map((review) => ({
          review_id: review.review_id.toString(),
          reviewer: {
            user_id: review.reviewer.user_id,
            name: review.reviewer.name,
          },

          product: {
            product_id: review.product.product_id.toString(),
            product_name: review.product.name,
            category: {
              category_id: review.product.category.category_id.toString(),
              category_name_level_1: review.product.category.name_level_1,
              category_name_level_2: review.product.category.name_level_2
                ? review.product.category.name_level_2
                : '',
            },
            thumbnail_url: review.product.images[0].image_url,
          },

          is_positive: review.is_positive,
          comment: review.comment,
          created_at: new Date(review.created_at).toLocaleDateString(),
        }));

        return res
          .status(200)
          .json(
            successResponse(
              payload,
              payload.length ? 'Get bidding products successfullly' : 'No bidding product'
            )
          );
      } catch (e) {
        console.log(e);
        return res.status(500).json(errorResponse('Internal server error'));
      }
    },

    getReviewsFromBuyers: async (req: Request, res: Response) => {
      try {
        const user_id = res.locals.user.id;
        if (!user_id) return res.status(401).json(errorResponse('Unauthorized'));

        const reviews = await UserServices.BidderServices.getReviews(user_id);

        const payload: Review[] = reviews.map((review) => ({
          review_id: review.review_id.toString(),
          reviewer: {
            user_id: review.reviewer.user_id,
            name: review.reviewer.name,
          },

          product: {
            product_id: review.product.product_id.toString(),
            product_name: review.product.name,
            category: {
              category_id: review.product.category.category_id.toString(),
              category_name_level_1: review.product.category.name_level_1,
              category_name_level_2: review.product.category.name_level_2
                ? review.product.category.name_level_2
                : '',
            },
            thumbnail_url: review.product.images[0].image_url,
          },

          is_positive: review.is_positive,
          comment: review.comment,
          created_at: new Date(review.created_at).toLocaleDateString(),
        }));

        return res
          .status(200)
          .json(
            successResponse(
              payload,
              payload.length ? 'Get bidding products successfullly' : 'No bidding product'
            )
          );
      } catch (e) {
        console.log(e);
        return res.status(500).json(errorResponse('Internal server error'));
      }
    },

    getReviewsFromSellers: async (req: Request, res: Response) => {
      try {
        const user_id = res.locals.user.id;
        if (!user_id) return res.status(401).json(errorResponse('Unauthorized'));

        const reviews = await UserServices.BidderServices.getReviewsFromSellers(user_id);

        const payload: Review[] = reviews.map((review) => ({
          review_id: review.review_id.toString(),
          reviewer: {
            user_id: review.reviewer.user_id,
            name: review.reviewer.name,
          },

          product: {
            product_id: review.product.product_id.toString(),
            product_name: review.product.name,
            category: {
              category_id: review.product.category.category_id.toString(),
              category_name_level_1: review.product.category.name_level_1,
              category_name_level_2: review.product.category.name_level_2
                ? review.product.category.name_level_2
                : '',
            },
            thumbnail_url: review.product.images[0].image_url,
          },

          is_positive: review.is_positive,
          comment: review.comment,
          created_at: new Date(review.created_at).toLocaleDateString(),
        }));

        return res
          .status(200)
          .json(
            successResponse(
              payload,
              payload.length ? 'Get bidding products successfullly' : 'No bidding product'
            )
          );
      } catch (e) {
        console.log(e);
        return res.status(500).json(errorResponse('Internal server error'));
      }
    },
  },

  SellerControllers: {
    getSellerProducts: async (req: Request, res: Response) => {
      try {
        const user_id = res.locals.user.id;
        if (!user_id) return res.status(401).json({ message: "Unauthorized: Can't find user" });

        const products = await UserServices.SellerServices.getSellingProducts(user_id);

        const payload: SellingProduct[] = products.map((product) => ({
          product_id: product.product_id.toString(),
          name: product.name,
          thumbnail_url: product.images[0].image_url,

          category: {
            category_id: product.category.category_id.toString(),
            category_name_level_1: product.category.name_level_1,
            category_name_level_2: product.category.name_level_2
              ? product.category.name_level_2
              : '',
          },

          current_price: Number(product.current_price),
          bid_count: product.bid_count,
          end_time: new Date(product.end_time).toLocaleDateString(),

          start_price: Number(product.start_price),
          buy_now_price: Number(product.buy_now_price),

          highest_bidder: product.current_highest_bidder
            ? {
                user_id: product.current_highest_bidder.user_id,
                name: product.current_highest_bidder.name,
              }
            : null,

          auto_extend: product.auto_extend,
          editable: product.bids.length === 0,
          reviews_count: product._count.reviews,
          created_at: new Date(product.created_at).toLocaleDateString(),
        }));

        // 4. Trả về kết quả
        return res.json(
          successResponse(
            payload,
            payload.length
              ? 'Get seller products list successfully'
              : 'Get seller products list failed'
          )
        );
      } catch (e) {
        console.error('Get seller products error:', e);
        // Xử lý lỗi BigInt serialize nếu chưa cấu hình global
        const message = e instanceof Error ? e.message : String(e);
        return res.status(500).json(errorResponse(message));
      }
    },
    getProductsWithWinner: async (req: Request, res: Response) => {
      try {
        const seller_id = res.locals.user.id;
        if (!seller_id) return res.status(401).json(errorResponse('Unauthorized'));

        if (res.locals.user.role !== 'seller')
          return res.status(403).json(errorResponse('Forbidden'));

        const products = await UserServices.SellerServices.getProductsWithWinner(seller_id);

        const payload: SoldProduct[] = products.map((product) => ({
          product_id: product.product_id.toString(),
          name: product.name,
          thumbnail_url: product.images[0].image_url,

          category: {
            category_id: product.category.category_id.toString(),
            category_name_level_1: product.category.name_level_1,
            category_name_level_2: product.category.name_level_2
              ? product.category.name_level_2
              : '',
          },

          current_price: Number(product.current_price),
          bid_count: product.bid_count,
          end_time: new Date(product.end_time).toLocaleDateString(),

          order: product.order
            ? {
                order_id: product.order.order_id.toString(),
                order_status: product.order.status,
                created_at: new Date(product.order.created_at).toLocaleDateString(),
                updated_at: new Date(product.order.updated_at).toLocaleDateString(),

                buyer: {
                  user_id: product.order.buyer.user_id,
                  name: product.order.buyer.name,
                },

                my_review: product.order.seller_review
                  ? {
                      review_id: product.order.seller_review.review_id.toString(),
                      is_positive: product.order.seller_review.is_positive,
                      comment: product.order.seller_review.comment,
                      created_at: new Date(
                        product.order.seller_review.created_at
                      ).toLocaleDateString(),
                    }
                  : null,
              }
            : null,

          can_cancel: product.order?.status === 'pending_payment',
        }));

        return res
          .status(200)
          .json(
            successResponse(
              payload,
              payload.length ? 'Get products with winner successfullly' : 'No products with winner'
            )
          );
      } catch (e) {
        console.log(e);
        return res.status(500).json(errorResponse('Internal server error'));
      }
    },
  },
};
