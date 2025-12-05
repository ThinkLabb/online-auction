import db from "./database.ts";

export const getCategories = async() => {
    try {
        const categories = await db.prisma.category.findMany({
            orderBy: {
                name_level_1: 'asc',
            },
            select: {
                category_id: true,
                name_level_1: true,
                name_level_2: true
            }
        });

        return { success: true, categories, message: "Get Categories successfully" };
    } catch(e) {
        return { success: false, message: String(e)};
    }
}