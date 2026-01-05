import { Request, Response } from 'express';
import { errorResponse, successResponse } from '../utils/response';
import { UserRole } from '@prisma/client';
import { Review, ReviewServices } from '../services/review.services';
import { OrderServices } from '../services/order.services';

export const ReviewController = {
  create: async (req: Request, res: Response) => {
    try {
      const { order_id, role, comment, is_positive } = req.body as {
        order_id: string;
        role: UserRole;
        comment: string;
        is_positive: boolean;
      };

      if (!order_id || is_positive === null)
        return res.status(400).json(errorResponse('Missed input data'));

      const order = await OrderServices.findByID(order_id);
      if (!order) return res.status(404).json(errorResponse('Order not found'));

      const review: Review = {
        product_id: Number(order.product_id),
        reviewer_id: role === 'bidder' ? order.buyer_id : order.seller_id,
        reviewee_id: role === 'bidder' ? order.seller_id : order.buyer_id,
        is_positive: is_positive,
        comment: comment,
      };

      const result = await ReviewServices.create(review);
      return res.status(201).json(
        successResponse(
          {
            comment: result.comment,
            is_positive: result.is_positive,
            product_id: Number(result.product_id),
            created_at: new Date(result.created_at).toLocaleDateString(),
            review_id: Number(result.review_id),
            reviewer_id: result.reviewer_id,
            reviewee_id: result.reviewee_id,
          },
          'Created review successfully!'
        )
      );
    } catch (e: any) {
      return res.status(500).json(errorResponse(e.message));
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { review_id, comment, is_positive } = req.body as {
        review_id: string;
        comment: string | null;
        is_positive: boolean;
      };

      if (is_positive === null) return res.status(400).json(errorResponse('Missed input data'));

      const result = await ReviewServices.update(Number(review_id), comment, is_positive);
      return res.status(201).json(
        successResponse(
          {
            comment: result.comment,
            is_positive: result.is_positive,
            product_id: Number(result.product_id),
            created_at: new Date(result.created_at).toLocaleDateString(),
            review_id: Number(result.review_id),
            reviewer_id: result.reviewer_id,
            reviewee_id: result.reviewee_id,
          },
          'Updated review successfully!'
        )
      );
    } catch (e: any) {
      return res.status(500).json(errorResponse(e.message));
    }
  },
};
