import db from './database.ts';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { BUCKET_NAME, s3Client } from '../config/s3.ts';
import { Readable } from 'stream';

/* ================= GET ORDER ================= */
export const getOrderService = async (orderid: string, curUser: any) => {
  const curUserId = String(curUser.id);
  const cur_name = String(curUser.name);

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
      product: { select: { name: true } },
      seller: { select: { name: true } },
      buyer: { select: { name: true } },
      seller_review_id: true,
      buyer_review_id: true,
      product_id: true
    },
    where: { order_id: BigInt(orderid) }
  });

  if (!orderFromDB) return null;

  if (
    String(orderFromDB.seller_id) !== curUserId &&
    String(orderFromDB.buyer_id) !== curUserId
  ) {
    throw new Error('FORBIDDEN');
  }

  const isSeller = String(orderFromDB.seller_id) === curUserId;

  let partner_id;
  let partner_name;
  let isReviewed;

  if (isSeller) {
    isReviewed = orderFromDB.seller_review_id !== null;
    partner_id = String(orderFromDB.buyer_id);
    partner_name = String(orderFromDB.buyer.name);
  } else {
    isReviewed = orderFromDB.buyer_review_id !== null;
    partner_id = String(orderFromDB.seller_id);
    partner_name = String(orderFromDB.seller.name);
  }

  return {
    order_id: String(orderFromDB.order_id),
    product_name: String(orderFromDB.product.name),
    product_id: String(orderFromDB.product_id),
    partner_name,
    partner_id,
    final_price: String(orderFromDB.final_price),
    status: String(orderFromDB.status),
    shipping_address: orderFromDB.shipping_address,
    shipping_proof_url: orderFromDB.shipping_proof_url,
    payment_proof_url: orderFromDB.payment_proof_url,
    is_seller: isSeller,
    cur_user_id: curUserId,
    is_reviewed: isReviewed,
    cur_name
  };
};

/* ================= CHANGE ORDER ================= */
export const changeOrderService = async (orderid: string, body: any) => {
  const uploadToS3 = async (base64String: string, type: 'payment' | 'shipping') => {
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const filename = `orders/${orderid}_${type}_${Date.now()}.png`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: buffer,
        ContentType: 'image/png'
      })
    );

    return filename;
  };

  let paymentInvoiceKey: string | undefined;
  let shippingInvoiceKey: string | undefined;

  if (body.payment_invoice) {
    paymentInvoiceKey = await uploadToS3(body.payment_invoice, 'payment');
  }

  if (body.shipping_invoice) {
    shippingInvoiceKey = await uploadToS3(body.shipping_invoice, 'shipping');
  }

  return db.prisma.order.update({
    where: { order_id: BigInt(orderid) },
    data: {
      status: body.status,
      ...(body.shipping_address && { shipping_address: body.shipping_address }),
      ...(paymentInvoiceKey && { payment_proof_url: paymentInvoiceKey }),
      ...(shippingInvoiceKey && { shipping_proof_url: shippingInvoiceKey })
    }
  });
};

/* ================= REVIEW ================= */
export const addReviewService = async (body: any) => {
  return db.prisma.reviews.create({
    data: {
      reviewer_id: body.reviewer_id,
      reviewee_id: body.reviewee_id,
      product_id: BigInt(body.product_id),
      is_positive: body.is_positive,
      comment: body.comment
    }
  });
};

/* ================= CHAT ================= */
export const addChatService = async (body: any) => {
  return db.prisma.orderChat.create({
    data: {
      order_id: body.order_id,
      sender_id: body.sender_id,
      message_text: body.message_text,
      sent_at: new Date(body.sent_at)
    }
  });
};

export const getChatService = async (orderid: string) => {
  return db.prisma.orderChat.findMany({
    where: { order_id: BigInt(orderid) },
    select: {
      chat_message_id: true,
      sender_id: true,
      message_text: true,
      sent_at: true
    },
    orderBy: { chat_message_id: 'asc' }
  });
};

/* ================= IMAGE ================= */
export const getOrderImageService = async (key: string) => {
  return s3Client.send(
    new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `orders/${key}`
    })
  );
};

/* ================= EXTRA ================= */
export const getOrderByUserID = async (userId: BigInt) => {
  try {
    const ordersFromDB = await db.prisma.order.findMany({
      where: {
        status: { notIn: ['cancelled', 'completed'] },
        OR: [
          { seller_id: String(userId), seller_review_id: null },
          { buyer_id: String(userId), seller_review_id: null }
        ]
      },
      select: { order_id: true, status: true }
    });

    if (!ordersFromDB) return null;

    return ordersFromDB.map(o => ({
      order_id: String(o.order_id),
      status: o.status
    }));
  } catch {
    return null;
  }
};

export const getOrderByProductID = async (productId: number) => {
  try {
    const ordersFromDB = await db.prisma.order.findUnique({
      where: { product_id: productId },
      select: { order_id: true }
    });

    if (!ordersFromDB) return null;

    return ordersFromDB.order_id;
  } catch {
    return null;
  }
};
