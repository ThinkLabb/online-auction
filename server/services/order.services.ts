import db from "./database.ts";

export const OrderServices = {
  findByID: async(order_id: string) => {
    return db.prisma.order.findUnique({where: { order_id: Number(order_id)}});
  }
}