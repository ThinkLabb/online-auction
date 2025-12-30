import type { Request, Response } from 'express';
import { errorResponse, successResponse } from '../utils/response.ts';
import {
  getOrderService,
  changeOrderService,
  addReviewService,
  addChatService,
  getChatService,
  getOrderImageService
} from '../services/payment.services.ts';
import { Readable } from 'stream';

/* ================= GET ORDER ================= */
export const getOrder = async (req: Request, res: Response) => {
  try {
    const order = await getOrderService(req.params.orderid, res.locals.user);

    if (!order) {
      return res.status(400).json(errorResponse('Not found'));
    }

    return res
      .status(200)
      .json(successResponse(order, 'Get order successfully!'));
  } catch (e: any) {
    if (e.message === 'FORBIDDEN') {
      return res
        .status(400)
        .json(errorResponse('Can not access payment of this product'));
    }
    return res.status(400).json(errorResponse(e));
  }
};

/* ================= CHANGE ORDER ================= */
export const changeOrder = async (req: Request, res: Response) => {
  try {
    const orderFromDB = await changeOrderService(
      req.params.orderid,
      req.body
    );

    const orderUpdate = {
      status: String(orderFromDB.status),
      shipping_address: orderFromDB.shipping_address,
      payment_invoice: orderFromDB.payment_proof_url,
      shipping_invoice: orderFromDB.shipping_proof_url
    };

    return res
      .status(200)
      .json(successResponse(orderUpdate, 'Order updated successfully!'));
  } catch (e) {
    return res.status(400).json(errorResponse(String(e)));
  }
};

/* ================= REVIEW ================= */
export const addReview = async (req: Request, res: Response) => {
  try {
    const r = await addReviewService(req.body);

    return res.status(200).json(
      successResponse(
        {
          reviewer_id: r.reviewer_id,
          reviewee_id: r.reviewee_id,
          product_id: r.product_id.toString(),
          is_positive: r.is_positive,
          comment: r.comment
        },
        'Add review successfully!'
      )
    );
  } catch (e) {
    return res.status(400).json(errorResponse(String(e)));
  }
};

/* ================= CHAT ================= */
export const addChat = async (req: Request, res: Response) => {
  try {
    const c = await addChatService(req.body);

    return res.status(200).json(
      successResponse(
        {
          chat_message_id: String(c.chat_message_id),
          order_id: String(c.order_id),
          sender_id: String(c.sender_id),
          message_text: c.message_text,
          sent_at: c.sent_at
        },
        'Send message successfully!'
      )
    );
  } catch (e) {
    return res.status(400).json(errorResponse(String(e)));
  }
};

export const getChat = async (req: Request, res: Response) => {
  try {
    const messages = await getChatService(req.params.orderid);

    return res.status(200).json(
      successResponse(
        messages.map(c => ({
          chat_message_id: String(c.chat_message_id),
          message_text: c.message_text,
          sender_id: String(c.sender_id),
          sent_at: Number(c.sent_at)
        })),
        'Send message successfully!'
      )
    );
  } catch (e) {
    return res.status(400).json(errorResponse(String(e)));
  }
};

/* ================= IMAGE ================= */
export const getOrderImage = async (req: Request, res: Response) => {
  try {
    const s3Response = await getOrderImageService(req.params.key);

    res.setHeader(
      'Content-Type',
      s3Response.ContentType || 'image/png'
    );
    res.setHeader('Cache-Control', 'private, max-age=86400');

    if (s3Response.Body instanceof Readable) {
      s3Response.Body.pipe(res);
    }
  } catch {
    res.status(404).send('Image not found');
  }
};
