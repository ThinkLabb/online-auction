import { Prisma } from '@prisma/client';
import db from '../services/database.ts';
import type { Request, Response } from 'express';

export const getBidHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // This is the product_id
    const user = res.locals.user; // Assumed authenticated user

    // 1. Check Product Ownership
    // We fetch the product to ensure it exists and the user is the seller
    const product = await db.prisma.product.findUnique({
      where: {
        product_id: BigInt(id), // Convert string ID from params to BigInt
      },
      select: {
        seller_id: true,
      },
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Security Check: Compare user_id (String/UUID) with seller_id (String/UUID)
    if (product.seller_id !== user.id) {
      return res
        .status(403)
        .json({ message: 'Unauthorized. Only the seller can view bid history.' });
    }

    // 2. Fetch Bids
    const bids = await db.prisma.bidHistory.findMany({
      where: {
        product_id: BigInt(id),
      },
      // Join with the User model to get bidder details
      include: {
        bidder: {
          select: {
            user_id: true,
            name: true,
          },
        },
      },
      // Order by highest bid first
      orderBy: {
        bid_amount: 'desc',
      },
    });

    // 3. Map to Response Format
    const historyData = bids.map((bid) => ({
      id: bid.bid_id.toString(), // Convert BigInt ID to string
      bidderId: bid.bidder.user_id,
      bidderName: bid.bidder.name,
      amount: Number(bid.bid_amount), // Convert Decimal to Number for frontend
      time: bid.bid_time.toISOString(), // Send ISO string for frontend formatting
    }));

    return res.status(200).json(historyData);
  } catch (e) {
    console.error(e);
    // Explicitly handle the BigInt serialization if returning raw error objects
    return res.status(500).json({ message: String(e) });
  }
};

export const banBidder = async (req: Request, res: Response) => {
  try {
    const { productId, bidderId } = req.params;
    if (!productId || !bidderId) {
      return res.status(400).json({ message: 'Product ID and Bidder ID are required.' });
    }
    const deniedBidder = await db.prisma.deniedBidders.create({
      data: {
        product_id: BigInt(productId),
        bidder_id: bidderId,
      },
    });

    return res.status(200).json({
      message: 'User banned successfully.',
      data: {
        ...deniedBidder,
        product_id: deniedBidder.product_id.toString(),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const placeBid = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { amount } = req.body;
    const user = res.locals.user;

    const bidAmount = parseFloat(amount);
    const prodIdBigInt = BigInt(productId);

    const result = await db.prisma.$transaction(
      async (tx) => {
        const [product, userData, currentTopBid] = await Promise.all([
          tx.product.findUnique({ where: { product_id: prodIdBigInt } }),
          tx.user.findUnique({ where: { user_id: user.id } }),
          tx.bidHistory.findFirst({
            where: { product_id: prodIdBigInt },
            orderBy: [{ bid_amount: 'desc' }, { bid_time: 'asc' }],
          }),
        ]);

        if (!product) throw new Error('Product not found');
        if (!userData) throw new Error('User not found');

        const now = new Date();
        if (now > product.end_time || product.status !== 'open') {
          throw new Error('Auction has ended');
        }

        // --- LOGIC KIỂM TRA ĐIỂM ĐÁNH GIÁ (UPDATED) ---
        const minus = userData.minus_review || 0;
        const plus = userData.plus_review || 0;
        const total = plus + minus;

        // TRƯỜNG HỢP 1: Người dùng chưa từng được đánh giá (Total = 0)
        if (total === 0) {
          // Kiểm tra xem sản phẩm có cho phép người chưa có rating bid không
          // Giả sử field trong DB là 'allow_unrated_bidder' như schema trước đó
          if (product.allow_unrated_bidder === false) {
            throw new Error('UNRATED_NOT_ALLOWED');
          }
          // Nếu allow_unrated_bidder = true, cho phép đi tiếp (bỏ qua check 80%)
        }

        // TRƯỜNG HỢP 2: Người dùng ĐÃ CÓ đánh giá (Total > 0)
        else {
          // Nếu sản phẩm yêu cầu review > 80%
          if (product.review_needed) {
            const ratio = plus / total;
            if (ratio < 0.8) {
              throw new Error('REVIEW_LOW');
            }
          }
        }
        // ------------------------------------------------

        const currentDisplayPrice = Number(product.current_price) || Number(product.start_price);
        const stepPrice = Number(product.step_price);
        const startPrice = Number(product.start_price);

        const minRequired = currentDisplayPrice + stepPrice;
        const actualMinRequired = product.bid_count === 0 ? startPrice : minRequired;

        if (bidAmount < actualMinRequired) {
          throw new Error(`Bid too low. Minimum allowed is ${actualMinRequired}`);
        }

        // ... (Phần logic tính toán giá mới giữ nguyên như cũ) ...
        let newCurrentPrice = 0;
        let newHighestBidderId = user.id;

        if (!currentTopBid) {
          newCurrentPrice = startPrice;
          newHighestBidderId = user.id;
        } else {
          const currentMaxBid = Number(currentTopBid.bid_amount);
          const currentWinnerId = currentTopBid.bidder_id;

          if (user.id === currentWinnerId) {
            newHighestBidderId = user.id;
            newCurrentPrice = currentDisplayPrice;
          } else {
            if (bidAmount > currentMaxBid) {
              newHighestBidderId = user.id;
              newCurrentPrice = currentMaxBid + stepPrice;
              if (newCurrentPrice > bidAmount) newCurrentPrice = bidAmount;
            } else if (bidAmount < currentMaxBid) {
              newHighestBidderId = currentWinnerId;
              newCurrentPrice = bidAmount;
              if (newCurrentPrice < currentDisplayPrice) newCurrentPrice = currentDisplayPrice;
            } else {
              newHighestBidderId = currentWinnerId;
              newCurrentPrice = currentMaxBid;
            }
          }
        }

        const newBid = await tx.bidHistory.create({
          data: {
            product_id: prodIdBigInt,
            bidder_id: user.id,
            bid_amount: bidAmount,
          },
        });

        const updatedProduct = await tx.product.update({
          where: { product_id: prodIdBigInt },
          data: {
            current_price: newCurrentPrice,
            current_highest_bidder_id: newHighestBidderId,
            bid_count: { increment: 1 },
          },
        });

        return { newBid, updatedProduct };
      },
      {
        maxWait: 5000,
        timeout: 20000,
      }
    );

    return res.status(200).json({
      message: 'Bid placed successfully!',
      bid: {
        ...result.newBid,
        product_id: result.newBid.product_id.toString(),
        bid_id: result.newBid.bid_id.toString(),
      },
      currentPrice: result.updatedProduct.current_price,
      currentWinnerId: result.updatedProduct.current_highest_bidder_id,
      isWinner: result.updatedProduct.current_highest_bidder_id === user.id,
    });
  } catch (error: any) {
    console.error('Bid Error:', error);

    // Xử lý lỗi trả về client
    if (error.message === 'UNRATED_NOT_ALLOWED') {
      return res.status(403).json({
        message: 'Seller does not allow bidders with no rating history.',
      });
    }

    if (error.message === 'REVIEW_LOW') {
      return res.status(403).json({
        message: 'Your positive rating score is below 80%. You cannot bid on this product.',
      });
    }

    if (error.message.includes('Bid too low') || error.message === 'Auction has ended') {
      return res.status(400).json({ message: error.message });
    }

    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      if (error.message.includes('This user is banned from bidding on this product')) {
        return res.status(403).json({
          message: 'You have been banned from bidding on this product by the seller.',
        });
      }
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};
