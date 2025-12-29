import { Request, Response } from "express";
import { errorResponse, successResponse } from "../utils/response";
import { OrderServices } from "../services/order.services";

export const OrderController = {
  cancel: async(req: Request, res: Response) => {
    try {
      const order_id = req.params.id;

      if (!order_id) return res.status(400).json(errorResponse("Missed input data"));

      await OrderServices.cancelByID(order_id);
      return res.status(201).json(successResponse(null, "Updated review successfully!"));
    } catch(e) {
      return res.status(500).json(errorResponse(e));
    }
  },
}