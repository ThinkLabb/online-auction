import db from '../services/database.ts';
import type { Request, Response } from 'express';
import { errorResponse, successResponse } from '../utils/response.ts';

export const getOrder = async (req: Request, res: Response) => {
  try {
    const { orderid } = req.params;
    const curUserId = String(res.locals.user.id);
    const cur_name = String(res.locals.user.name);

    const orderFromDB = await db.prisma.order.findUnique({
        select: {
          order_id: true,
          seller_id: true,
          buyer_id: true,
          final_price: true,
          status: true,
          shipping_address: true,
          product: {
              select: {
                  name: true
              }
          },
          seller: {
            select: {
              name: true
            }
          },

          buyer: {
            select: {
              name: true
            }
          },

          seller_review_id: true,
          buyer_review_id: true,
          
          product_id: true
        },
        where: {
          order_id: BigInt(orderid)
        }
    })

    if (!orderFromDB) {
      return res.status(400).json(errorResponse("Not found"));
    }


    if (String(orderFromDB.seller_id) !== curUserId && String(orderFromDB.buyer_id) !== curUserId) {
      return res.status(400).json(errorResponse("Can not access payment of this product"));
    }
  
    const isSeller = (String(orderFromDB.seller_id) === curUserId)
    let partner_id;
    let partner_name;

    let isReviewed;
    if (isSeller) {
      if (orderFromDB.seller_review_id === null) 
        isReviewed = false
      else isReviewed = true
      partner_id = String(orderFromDB.buyer_id)
      partner_name = String(orderFromDB.buyer.name)
    } else {
      if (orderFromDB.buyer_review_id === null) 
        isReviewed = false
      else isReviewed = true
      partner_id = String(orderFromDB.seller_id)
      partner_name = String(orderFromDB.seller.name)
    }
    const order = {
      order_id: String(orderFromDB.order_id), 
      product_name: String(orderFromDB.product.name),
      product_id: String(orderFromDB.product_id),
      partner_name: partner_name,
      partner_id: partner_id,
      final_price: String(orderFromDB.final_price),
      status: String(orderFromDB.status),
      shipping_address: orderFromDB.shipping_address,
      is_seller: isSeller,
      cur_user_id: String(curUserId),
      is_reviewed: isReviewed,
      cur_name: cur_name,
    }

    return res.status(200).json(successResponse(order, "Get order successfully!"));
  } catch (e) {
    return res.status(400).json(errorResponse(e));
  }
};

export const changeOrder = async (req: Request, res: Response) => {
  try {   
    const { orderid } = req.params;
    const shipping_address = req.body.shipping_address;
    const status = req.body.status;
    const orderFromDB = await db.prisma.order.update({
      data: {
        status: status,
         ...(shipping_address != null && {
          shipping_address: shipping_address,
        }),
      },
      where: {
        order_id: BigInt(orderid)
      }
    });
  
    const orderUpdate = {
      status: String(orderFromDB.status),
      shipping_address: orderFromDB.shipping_address,
    }
    return res.status(200).json(successResponse(orderUpdate, "Get order successfully!"));
  } catch(e) {
    return res.status(400).json(errorResponse(String(e)));
  }
}

export const addReview = async (req: Request, res: Response) => {
  try {
    const newReviewFromDB = await db.prisma.reviews.create({
      data: {
        reviewer_id: req.body.reviewer_id,
        reviewee_id: req.body.reviewee_id,
        product_id: BigInt(req.body.product_id),
        is_positive: req.body.is_positive,
        comment: req.body.comment,
      }
    });

    const newReview = {
      reviewer_id: newReviewFromDB.reviewer_id,
      reviewee_id: newReviewFromDB.reviewee_id,
      product_id: newReviewFromDB.product_id.toString(),
      is_positive: newReviewFromDB.is_positive,
      comment: newReviewFromDB.comment
    }

    return res.status(200).json(successResponse(newReview, "Add review successfully!"))
  } catch(e) {
    return res.status(400).json(errorResponse(String(e)))
  }
}

export const addChat = async (req: Request, res: Response) => {
  try {
    const newMessageDB = await db.prisma.orderChat.create({
      data: {
        order_id: req.body.order_id,
        sender_id: req.body.sender_id,
        message_text: req.body.message_text,
        sent_at: new Date(req.body.sent_at)
      }
    })

    const newMessage = {
      chat_message_id: String(newMessageDB.chat_message_id),
      order_id: String(newMessageDB.order_id),
      sender_id: String(newMessageDB.sender_id),
      message_text: newMessageDB.message_text,
      sent_at: newMessageDB.sent_at
    }

    return res.status(200).json(successResponse(newMessage, "Send message successfully!"))
  } catch(e) {
    return res.status(400).json(errorResponse(String(e)))
  }
}

export const getChat = async (req: Request, res: Response) => {
  try {
    const { orderid } = req.params;

    const newMessagesDB = await db.prisma.orderChat.findMany({
      where: {
        order_id: BigInt(orderid)
      },
      select: {
        chat_message_id: true,
        sender_id: true,
        message_text: true,
        sent_at: true
      },
      orderBy: {
        chat_message_id: "asc",
      },
    })

    const newMessages = newMessagesDB.map(c => ({
      chat_message_id: String(c.chat_message_id),
      message_text: c.message_text,
      sender_id: String(c.sender_id),
      sent_at: Number(c.sent_at)
    }));

    return res.status(200).json(successResponse(newMessages, "Send message successfully!"))
  } catch(e) {
    return res.status(400).json(errorResponse(String(e)))
  }
}

// export const getOrder = async (req: Request, res: Response) => {

// }

export const getOrderByUserID = async (userId: BigInt) => {
  try {
    const ordersFromDB = await db.prisma.order.findMany({
      where: {
        OR: [
          {
            seller_id: String(userId),
            seller_review_id: null,
          },
          {
            buyer_id: String(userId),
            seller_review_id: null,
          }
        ]
      },
      select: {
        order_id: true,
        status: true,
      }
    })

    if (!ordersFromDB) {
      return null
    } 

    const orders = ordersFromDB.map((o) => {
      return {
        order_id: String(o.order_id),
        status: o.status,
      }
    })

    return orders
    

  } catch(e) {
    return null
  }
}