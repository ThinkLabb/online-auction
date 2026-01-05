import { Request, Response } from 'express';
import { errorResponse, successResponse } from '../utils/response';
import { OrderServices } from '../services/order.services';
import { ReviewServices, Review } from '../services/review.services';

export const OrderController = {
  cancel: async (req: Request, res: Response) => {
    try {
      const order_id = req.params.id;

      if (!order_id) return res.status(400).json(errorResponse('Missed input data'));

      const order = await OrderServices.findByID(order_id);
      if (!order) return res.status(401).json(errorResponse('Order not found'));

      await OrderServices.cancelByID(order_id);

      await ReviewServices.create({
        product_id: Number(order.product_id),
        reviewer_id: order.seller_id,
        reviewee_id: order.buyer_id,
        is_positive: false,
        comment: "Winner didn't make payment.",
      });

      return res.status(201).json(successResponse(null, 'Cancelled transaction successfully!'));
    } catch (e) {
      return res.status(500).json(errorResponse(e));
    }
  },
};
