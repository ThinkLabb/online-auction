import { Prisma } from '@prisma/client';
import db from '../services/database.ts';
import type { Request, Response } from 'express';
import { sendNewBidEmail, sendBidRejectedEmail } from '../services/mail.service.ts';
import { successResponse, errorResponse } from '../utils/response.ts';
import { getProductBids } from '../services/product.services.ts';

interface BidHistoryItem {
  id: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  time: string;
}

export const getBidderProductBidHistory = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    if (!user.id) return res.status(401).json(errorResponse('No user found'));

    const { id } = req.params;
    if (!id) return res.status(400).json(errorResponse("No product's id found"));

    const result = await getProductBids(Number(id));

    if (!result) return res.status(200).json(successResponse([], 'No bid yet'));

    const bids = result.bids;

    const return_data: BidHistoryItem[] = bids.map((bid) => ({
      id: bid.bid_id.toString(),
      amount: Number(bid.bid_amount),
      time: new Date(bid.bid_time).toISOString(),
      bidderId: bid.bidder.user_id,
      bidderName: bid.bidder.name,
    }));

    res
      .status(200)
      .json(
        successResponse(
          return_data,
          return_data.length ? "Found product's bids successfully" : 'No bid yet'
        )
      );
  } catch (e: any) {
    return res.status(500).json(errorResponse(e.message));
  }
};

export const getBidHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // This is the product_id
    const user = res.locals.user; // Assumed authenticated user

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

    if (product.seller_id !== user.id) {
      return res
        .status(403)
        .json({ message: 'Unauthorized. Only the seller can view bid history.' });
    }

    const bids = await db.prisma.bidHistory.findMany({
      where: {
        product_id: BigInt(id),
      },
      include: {
        bidder: {
          select: {
            user_id: true,
            name: true,
          },
        },
      },
      orderBy: {
        bid_amount: 'desc',
      },
    });

    const historyData = bids.map((bid) => ({
      id: bid.bid_id.toString(),
      bidderId: bid.bidder.user_id,
      bidderName: bid.bidder.name,
      amount: Number(bid.bid_amount),
      time: bid.bid_time.toISOString(),
    }));

    return res.status(200).json(historyData);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: String(e) });
  }
};

export const banBidder = async (req: Request, res: Response) => {
  try {
    const { productId, bidderId } = req.params;
    if (!productId || !bidderId) {
      return res.status(400).json({ message: 'Product ID and Bidder ID are required.' });
    }

    const prodIdBigInt = BigInt(productId);

    const result = await db.prisma.$transaction(async (tx) => {
      const deniedBidder = await tx.deniedBidders.create({
        data: {
          product_id: prodIdBigInt,
          bidder_id: bidderId,
        },
      });

      const product = await tx.product.findUnique({
        where: { product_id: prodIdBigInt },
      });

      if (!product) throw new Error('Product not found');

      const remainingBids = await tx.bidHistory.findMany({
        where: { product_id: prodIdBigInt },
        orderBy: [{ bid_amount: 'desc' }, { bid_time: 'asc' }],
        take: 2,
      });

      let newCurrentPrice = Number(product.start_price);
      let newHighestBidderId = null;
      const stepPrice = Number(product.step_price);

      if (remainingBids.length === 0) {
        newCurrentPrice = Number(product.start_price);
        newHighestBidderId = null;
      } else if (remainingBids.length === 1) {
        newHighestBidderId = remainingBids[0].bidder_id;
        newCurrentPrice = Number(product.start_price);
      } else {
        const winnerMaxBid = Number(remainingBids[0].bid_amount);
        const secondMaxBid = Number(remainingBids[1].bid_amount);

        newHighestBidderId = remainingBids[0].bidder_id;

        let calculatedPrice = secondMaxBid + stepPrice;

        if (calculatedPrice > winnerMaxBid) {
          calculatedPrice = winnerMaxBid;
        }

        newCurrentPrice = calculatedPrice;
      }

      const newBidCount = await tx.bidHistory.count({
        where: { product_id: prodIdBigInt },
      });

      const updatedProduct = await tx.product.update({
        where: { product_id: prodIdBigInt },
        data: {
          current_price: newCurrentPrice,
          current_highest_bidder_id: newHighestBidderId,
          bid_count: newBidCount,
        },
      });

      return { deniedBidder, updatedProduct };
    });

    try {
      const bannedUser = await db.prisma.user.findUnique({
        where: { user_id: bidderId },
        select: { email: true, name: true },
      });

      const product = await db.prisma.product.findUnique({
        where: { product_id: prodIdBigInt },
        select: { name: true },
      });

      if (bannedUser && product) {
        const productLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/product/${productId}`;
        await sendBidRejectedEmail(bannedUser.email, product.name, productLink);
      }
    } catch (emailError) {
      console.error('Failed to send bid rejection email:', emailError);
    }

    return res.status(200).json({
      message: 'User banned and auction state recalculated successfully.',
      data: {
        bannedUser: {
          ...result.deniedBidder,
          product_id: result.deniedBidder.product_id.toString(),
        },
        newProductState: {
          current_price: result.updatedProduct.current_price,
          current_highest_bidder_id: result.updatedProduct.current_highest_bidder_id,
          bid_count: result.updatedProduct.bid_count,
        },
      },
    });
  } catch (error: any) {
    console.error('Ban Bidder Error: ', error);
    if (error.code === 'P2010' || error.message.includes('trigger')) {
      return res.status(500).json({ message: 'Database trigger failed.', error: error.message });
    }
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
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

        const minus = userData.minus_review || 0;
        const plus = userData.plus_review || 0;
        const total = plus + minus;

        if (total === 0) {
          if (product.allow_unrated_bidder === false) {
            throw new Error('UNRATED_NOT_ALLOWED');
          }
        } else {
          if (product.review_needed) {
            const ratio = plus / total;
            if (ratio < 0.8) {
              throw new Error('REVIEW_LOW');
            }
          }
        }

        const currentDisplayPrice = Number(product.current_price) || Number(product.start_price);
        const stepPrice = Number(product.step_price);
        const startPrice = Number(product.start_price);

        const minRequired = currentDisplayPrice + stepPrice;
        const actualMinRequired = product.bid_count === 0 ? startPrice : minRequired;

        if (bidAmount < actualMinRequired) {
          throw new Error(`Bid too low. Minimum allowed is ${actualMinRequired}`);
        }

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
          include: {
            seller: {
              select: { email: true, name: true },
            },
          },
        });

        return {
          newBid,
          updatedProduct,
          productName: product.name,
          previousBidderId: currentTopBid?.bidder_id,
        };
      },
      {
        maxWait: 5000,
        timeout: 20000,
      }
    );

    try {
      const bidder = await db.prisma.user.findUnique({
        where: { user_id: user.id },
        select: { email: true, name: true },
      });

      let oldBidderEmail: string | undefined = undefined;

      // Get the previous highest bidder's email if there was one
      if (result.previousBidderId && result.previousBidderId !== user.id) {
        const previousBidder = await db.prisma.user.findUnique({
          where: { user_id: result.previousBidderId },
          select: { email: true },
        });
        oldBidderEmail = previousBidder?.email;
      }

      const productLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/product/${productId}`;
      const formattedPrice = new Intl.NumberFormat('vi-VN').format(
        Number(result.updatedProduct.current_price)
      );

      if (result.updatedProduct.seller && bidder) {
        await sendNewBidEmail(
          result.productName,
          formattedPrice,
          productLink,
          result.updatedProduct.seller.email,
          bidder.email,
          oldBidderEmail
        );
      }
    } catch (emailError) {
      console.error('Failed to send bid notification emails:', emailError);
    }

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
