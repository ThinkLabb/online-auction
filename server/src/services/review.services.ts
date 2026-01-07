import db from './database';

export interface Review {
  product_id: number;
  reviewer_id: string;
  reviewee_id: string;
  is_positive: boolean;
  comment?: string;
}

export const ReviewServices = {
  create: async (review: Review) => {
    return db.prisma.reviews.create({ data: review });
  },

  update: async (review_id: number, comment: string | null, is_positive: boolean) => {
    return db.prisma.reviews.update({
      data: { comment: comment, is_positive: is_positive, created_at: new Date() },
      where: { review_id: review_id },
    });
  },

  getById: async (review_id: number) => {
    return db.prisma.reviews.findUnique({
      where: { review_id: review_id },
    });
  },
};
