import db from './database.ts';

export const getCategories = async () => {
  try {
    const categories = await db.prisma.category.findMany({
      orderBy: {
        name_level_1: 'asc',
      },
      select: {
        category_id: true,
        name_level_1: true,
        name_level_2: true,
      },
    });

    return { success: true, categories, message: 'Get Categories successfully' };
  } catch (e) {
    return { success: false, message: String(e) };
  }
};

interface OutputCategory {
  id: number;
  name: string;
  parent_id: number | null;
  parent_name: string | null;
  product_count: number;
}

export const getAdminCategories = async () => {
  try {
    const categoriesWithCount = await db.prisma.category.findMany({
      select: {
        category_id: true,
        name_level_1: true,
        name_level_2: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        category_id: 'asc',
      },
    });

    const level1Map = new Map<
      string,
      {
        id: number;
        name: string;
        total_products: number;
      }
    >();

    const result: OutputCategory[] = [];

    for (const item of categoriesWithCount) {
      const level1Name = item.name_level_1;
      const level2Name = item.name_level_2;
      const productCount = item._count.products;

      let level1Info = level1Map.get(level1Name);

      if (!level1Info) {
        level1Info = {
          id: item.category_id,
          name: level1Name,
          total_products: 0,
        };

        level1Map.set(level1Name, level1Info);

        result.push({
          id: item.category_id,
          name: level1Name,
          parent_id: null,
          parent_name: null,
          product_count: 0,
        });
      }

      level1Info.total_products += productCount;

      if (level2Name !== null) {
        result.push({
          id: item.category_id,
          name: String(level2Name),
          parent_id: level1Info.id,
          parent_name: level1Name,
          product_count: productCount,
        });
      }
    }

    const categories: OutputCategory[] = result.map((item) => {
      if (item.parent_id === null) {
        const level1Data = level1Map.get(item.name);
        return {
          ...item,
          product_count: level1Data?.total_products ?? 0,
        };
      }
      return item;
    });

    console.log(categories);
    return {
      success: true,
      categories,
      message: 'Get Categories successfully',
    };
  } catch (e) {
    return {
      success: false,
      message: String(e),
    };
  }
};

export const getProductBids = async (product_id: number) => {
  return await db.prisma.product.findUnique({
    where: { product_id: product_id },
    select: {
      bids: {
        orderBy: { bid_time: 'desc' },
        select: {
          bidder: {
            select: {
              user_id: true,
              name: true,
            },
          },
          bid_amount: true,
          bid_time: true,
          bid_id: true,
        },
      },
    },
  });
};
