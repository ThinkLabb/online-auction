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

export const addCategory = async (req: Request, res: Response) => {
	try {
    const newCategory = req.body.category;
    if (newCategory.parent_name != null) {
      await db.prisma.category.create({
        data: { name_level_1: newCategory.parent_name, name_level_2: newCategory.name }
      });
    } else {
      await db.prisma.category.create({
        data: { name_level_1: newCategory.name, name_level_2: null }
      });
    }
   
		return getAdCatergories(req, res);
	} catch(e) {
		return res.status(400).json(errorResponse(e));
	}
}



export const deleteCategory = async (req: Request, res: Response) => {
	try {
    const category = req.body;
    await db.prisma.category.deleteMany({
      where: {
        name_level_1: category.name,
      },
    })

    await db.prisma.category.deleteMany({
      where: {
        name_level_2: category.name,
      },
    })
		return getAdCatergories(req, res);
	} catch(e) {
		return res.status(400).json(errorResponse(e));
	}
}



export const updateCategory = async (req: Request, res: Response) => {
  try {
    const newCategory = req.body.newCategory

    if (newCategory.parent_name === null) {
      return res.status(500).json(errorResponse("Can not set parent null"));
    } else {
      await db.prisma.category.update({
      data: {
        name_level_1: newCategory.parent_name,
        name_level_2: newCategory.name,
      },
      where: {
        category_id: newCategory.id
      }
    })
    }
    return getAdCatergories(req, res);
	} catch(e) {
    return res.status(500).json(errorResponse(String(e)));
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

export const deleteProducts = async (req: Request, res: Response) => {
  try {
    const id = req.body.id

    await db.prisma.product.delete({
      where: {
        product_id: id
      }
    })

    return getAdProducts(req, res);

  } catch(e) {
    return res.status(500).json(errorResponse(String(e)))
  }
}

export const getAdUsers = async (req: Request, res: Response) => {
	try {
		const users = await db.prisma.user.findMany({
      where: {
        role: {
          not: "admin"
        }
      }
    });

		return res.status(200).json(successResponse(users, "Get users successfully"))

	} catch(e) {
    return res.status(500).json(errorResponse(String(e)));
	}
}

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const email = req.body.email

    await db.prisma.user.delete({
      where: {
        email: email
      }
    })

    return getAdUsers(req, res);

  } catch(e) {
    return res.status(500).json(errorResponse(String(e)))
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

export const getAdName = async (req: Request, res: Response) => {
  const user = res.locals.user
  return res.status(200).json(successResponse(user.name, "Get admin name successfully!"));
} 

export const responseUpgradeRequest = async (req: Request, res: Response) => {
  try {
    const content = req.body;

    if (content.answer === "approve") {
      await db.prisma.sellerUpgradeRequest.update({
        data: {
          is_approved: true,
        },
        where: {
          request_id: content.id,
        }
      })
      await db.prisma.user.update({
        data: {
          role: 'seller'
        },
        where: {
          user_id: content.user_id
        }
      })
    } else if (content.answer === "deny") {
      await db.prisma.sellerUpgradeRequest.update({
        data: {
          is_denied: true,
        },
        where: {
          request_id: content.id,
        }
      })
    }
   
    return getUpgradeRequest(req, res);
  } catch(e) {
    return res.status(500).json(errorResponse(String(e)))
  }
} 