import db from '../services/database.ts';
import type { Request, Response } from 'express';
import { errorResponse, successResponse } from '../utils/response.ts';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { BUCKET_NAME, s3Client } from '../config/s3.ts';
import { Readable } from 'stream';

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
          shipping_proof_url: true,
          payment_proof_url: true,
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
      shipping_proof_url: orderFromDB.shipping_proof_url,
      payment_proof_url: orderFromDB.payment_proof_url,
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
    const { shipping_address, status, payment_invoice, shipping_invoice } = req.body;

    // --- HELPER: Upload Base64 to S3 ---
    const uploadToS3 = async (base64String: string, type: 'payment' | 'shipping') => {
      // 1. Strip the Base64 header (data:image/png;base64,...)
      const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // 2. Generate a unique filename: orders/{orderId}_{type}_{timestamp}.png
      const filename = `orders/${orderid}_${type}_${Date.now()}.png`;

      // 3. Send to S3
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: buffer,
        ContentType: 'image/png', // You might want to detect mime type dynamically, but png is safe for now
      });

      await s3Client.send(command);
      return filename; // Return the key to save in DB
    };

    // --- HANDLE UPLOADS ---
    let paymentInvoiceKey: string | undefined;
    let shippingInvoiceKey: string | undefined;

    if (payment_invoice) {
      paymentInvoiceKey = await uploadToS3(payment_invoice, 'payment');
    }

    if (shipping_invoice) {
      shippingInvoiceKey = await uploadToS3(shipping_invoice, 'shipping');
    }

    // --- UPDATE DATABASE ---
    const orderFromDB = await db.prisma.order.update({
      where: {
        order_id: BigInt(orderid),
      },
      data: {
        status: status,
        ...(shipping_address && { shipping_address: shipping_address }),
        ...(paymentInvoiceKey && { payment_proof_url: paymentInvoiceKey }), // Assumes DB column is 'payment_invoice'
        ...(shippingInvoiceKey && { shipping_proof_url: shippingInvoiceKey }), // Assumes DB column is 'shipping_invoice'
      },
    });

    const orderUpdate = {
      status: String(orderFromDB.status),
      shipping_address: orderFromDB.shipping_address,
      payment_invoice: orderFromDB.payment_proof_url,
      shipping_invoice: orderFromDB.shipping_proof_url,
    };

    return res.status(200).json(successResponse(orderUpdate, 'Order updated successfully!'));
  } catch (e) {
    console.error('Change Order Error:', e);
    return res.status(400).json(errorResponse(String(e)));
  }
};

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
        status: {
          not: 'cancelled',
        },
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

export const getOrderImage = async (req: Request, res: Response) => {
  try {
    const filename = req.params.key;
    
    const fullKey = `orders/${filename}`;

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fullKey,
    });

    const s3Response = await s3Client.send(command);

    res.setHeader('Content-Type', s3Response.ContentType || 'image/png');
    res.setHeader('Cache-Control', 'private, max-age=86400'); // 'private' so only the user's browser caches it, not CDNs

    if (s3Response.Body instanceof Readable) {
      s3Response.Body.pipe(res);
    } else {
      // @ts-ignore
      const reader = s3Response.Body.transformToWebStream ? s3Response.Body.transformToWebStream() : s3Response.Body;
       // @ts-ignore
      if (reader.pipe) {
         // @ts-ignore
        reader.pipe(res);
      } else {
        throw new Error('S3 Body is not a readable stream');
      }
    }
  } catch (error) {
    console.error('Get Order Image Error:', error);
    res.status(404).send('Image not found');
  }
};