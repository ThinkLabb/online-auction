import { Request, Response, NextFunction } from "express";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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