import { count } from "console";
import db from "./database.ts";
import { ProductStatus, OrderStatus } from "@prisma/client";

export const UserServices = {
  getUser: async (user_id: string) => {
    return db.prisma.user.findUnique({ where: { user_id: user_id } });
  },

  BidderServices: {
    getBiddingProducts: async (user_id: string) => {
      return db.prisma.bidHistory.findMany({
        where: { 
          bidder_id: user_id,
          product: { status: "open" },
        },
        select: {
          bid_amount: true,
          bid_time: true,
          product: {
            select: {
              product_id: true,
              name: true,
              status: true,

              current_price: true,
              buy_now_price: true,

              bid_count: true,
              end_time: true,

              seller: { 
                select: {
                  user_id: true,
                  name: true,
                }
              },
              category: {
                select: {
                  category_id: true,
                  name_level_1: true,
                  name_level_2: true,
                },
              },
              current_highest_bidder: {
                select: { 
                  user_id: true,
                  name: true
                },
              },
              images: { take: 1, select: { image_url: true },},
              _count: { select: {reviews: true } }
            },
          }
        },
        distinct: ["product_id"],
        orderBy: { bid_time: "desc" },
      });
    },
    
    getWonProducts: async (user_id: string) => {
      return db.prisma.order.findMany({
        where: { buyer_id: user_id },
        select: {
          order_id: true,
          final_price: true,
          status: true,

          created_at: true,
          updated_at: true,

          buyer_review: {
            select: {
              review_id: true,
              is_positive: true,
              comment: true,
              created_at: true,
            }
          },

          product: {
            select: {
              product_id: true,
              name: true,
              
              current_price: true,
              bid_count: true,
              end_time: true,

              review_needed: true,

              seller: {
                select: {
                  user_id: true,
                  name: true
                }
              },

              category: {
                select: {
                  category_id: true,
                  name_level_1: true,
                  name_level_2: true
                }
              },

              images: { take: 1, select: { image_url: true } },
              _count: { select: { reviews: true} }
            }
          }
        },
        distinct: ["product_id"],
        orderBy: { created_at: 'desc'}
      })
    },

    getWatchlistProducts: async (user_id: string) => {
      return db.prisma.watchlist.findMany({
        where: { user_id: user_id },
        include: {
          product: {
            select: {
              product_id: true,
              name: true,
              images: { take: 1, select: { image_url: true } },
              category: {
                  select: {
                    category_id: true,
                    name_level_1: true,
                    name_level_2: true,
                  },
                },

              current_price: true,
              bid_count: true,
              end_time: true,
              seller: { 
                select: {
                  user_id: true,
                  name: true,
                }
              },

              status: true,
              buy_now_price: true,
 
              current_highest_bidder: {
                select: { 
                  user_id: true,
                  name: true
                },
              },
              _count: { select: { reviews: true } }
            },
          }
        },
        distinct: ['product_id'],
        orderBy: { product: { end_time: 'asc'} }
      })
    },

    getReviewsFromBuyers: async (user_id: string) => {
      return db.prisma.reviews.findMany({
        where: { 
          reviewee_id: user_id,
          order_as_buyer_review: { isNot: null }
        },
        select: {
          review_id: true,
          reviewer: {
            select: {
              user_id: true,
              name: true,
            }
          },          
          product: {
            select: {
              product_id: true,
              name: true,

              category: {
                select: {
                  category_id: true,
                  name_level_1: true,
                  name_level_2: true
                }
              },

              images: { take: 1, select: {image_url: true} },
            }
          },

          is_positive: true,
          comment: true,
          created_at: true,
        }
      })
    },

    getReviewsFromSellers: async (user_id: string) => {
      return db.prisma.reviews.findMany({
        where: { 
          reviewee_id: user_id,
          order_as_seller_review: { isNot: null }
        },
        select: {
          review_id: true,
          reviewer: {
            select: {
              user_id: true,
              name: true,
            }
          },          
          product: {
            select: {
              product_id: true,
              name: true,

              category: {
                select: {
                  category_id: true,
                  name_level_1: true,
                  name_level_2: true
                }
              },

              images: { take: 1, select: {image_url: true} },
            }
          },

          is_positive: true,
          comment: true,
          created_at: true,
        }
      })
    }
  },

  SellerServices: {
    getAllProducts: async (seller_id: string) => {
      return db.prisma.product.findMany({where: { seller_id: seller_id }});
    },

    getSellingProducts: async (seller_id: string) => {
      return db.prisma.product.findMany({
        where: {
          seller_id: seller_id,
          status: ProductStatus.open,
          end_time: { gt: new Date() }
        },
        select: {
          product_id: true,
          name: true,
          images: { take: 1, select: { image_url: true },},
          category: {
            select: {
              category_id: true,
              name_level_1: true,
              name_level_2: true,
            },
          },
          current_price: true,
          bid_count: true,
          end_time: true,

          start_price: true,
          buy_now_price: true,

          current_highest_bidder: {
            select: { 
              user_id: true,
              name: true
            },
          },

          auto_extend: true,
          bids: true,
          _count: { select: { reviews: true } }
        },
      })
    },

    getProductsWithWinner: async (seller_id: string) => {
      return db.prisma.product.findMany({
        where: {
          seller_id: seller_id,
          order: { isNot: null }
        },
        select: {
          product_id: true,
          name: true,

          images: {
            take: 1,
            select: { image_url: true }
          },

          category: {
            select: {
              category_id: true,
              name_level_1: true,
              name_level_2: true,
            }
          },

          current_price: true,
          bid_count: true,
          end_time: true,

          order: {
            select: {
              order_id: true,
              final_price: true,
              status: true,

              created_at: true,
              updated_at: true,

              buyer: {
                select: { 
                  user_id: true,
                  name: true 
                }
              },

              seller_review: {
                select: {
                  review_id: true,

                  is_positive: true,
                  comment: true,
                  created_at: true
                }
              }
            }
          }
        },
        orderBy: {
          end_time: 'desc'
        }
      })
    }
  }
}