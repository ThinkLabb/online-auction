import * as productService from '../services/product.services.ts'
import { errorResponse, successResponse } from '../utils/response.ts';
import { Request, Response } from 'express';
import db from '../services/database.ts';

export const getAdCatergories = async (req: Request, res: Response) => {
	try {
		const result = await productService.getAdminCategories();
		if (!result.success) {
			return res.status(400).json(errorResponse(result.message));
		}
		
		return res.status(200).json(successResponse(result.categories, result.message));
	} catch(e) {
		return res.status(400).json(errorResponse(e));
	}
}


export const getAdProducts = async (req: Request, res: Response) => {
    try {
      const currentDate = new Date();
      const productsFromDB = await db.prisma.product.findMany({
        select: {
          product_id: true,
          name: true,
          current_price: true,
          end_time: true, 
        },
        orderBy: {
          end_time: 'desc',
        },
      });

      const products = productsFromDB.map((product) => {
        const isActive = product.end_time.getTime() > currentDate.getTime();
				console.log(isActive);
            
        return {
          id: String(product.product_id),
          name: product.name,
          current_price: product.current_price,
          status: isActive ? "Active Auction" : "Ended"
        };
      });

      return res.status(200).json(successResponse(products, "Get Products successfully"));
        
    } catch (e) {
      return res.status(500).json(errorResponse(String(e)));
    }
}

export const getAdUsers = async (req: Request, res: Response) => {
	try {
		const users = await db.prisma.user.findMany();

		return res.status(200).json(successResponse(users, "Get users successfully"))

	} catch(e) {
    return res.status(500).json(errorResponse(String(e)));
	}
}

export const getUpgradeRequest = async (req: Request, res: Response) => {
  try {
		const upgradeRequestFromDB = await db.prisma.sellerUpgradeRequest.findMany({
      where: {
        is_approved: false,
        is_denied: false,
      },
      select: {
        request_id: true,
        message: true,
        requested_at: true,
    
        user: {
          select: {
            user_id: true,
            name: true,
          },
        },
      }
    });

    const upgradeRequest = upgradeRequestFromDB.map((up) => {     
      return {
        request_id: String(up.request_id),
        user_id: String(up.user.user_id),
        name: up.user.name,
        message: up.message,
        request_at: up.requested_at.toISOString().split("T")[0]
      };
    });
		return res.status(200).json(successResponse(upgradeRequest, "Get upgradeRequest successfully"))

	} catch(e) {
    return res.status(500).json(errorResponse(String(e)));
	}
}