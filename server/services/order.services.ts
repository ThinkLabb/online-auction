import db from "./database.ts";

export const OrderServices = {
  findByID: async(order_id: string) => {
    return db.prisma.order.findUnique({where: { order_id: Number(order_id)}});
  },

  cancelByID: async(order_id: string) => {
    return db.prisma.order.update({
      where: {order_id: Number(order_id)},
      data: {status: 'cancelled'}
    })
  }
}