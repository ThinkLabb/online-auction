import db from '../services/database';
import { sendAuctionSuccessEmail, sendAuctionEndedNoWinnerEmail } from '../services/mail.service';

const INTERVAL_MS = 60_000; // 1 phút

export function startAuctionCloser() {
  console.log('[AuctionCloser] started');

  setInterval(async () => {
    const now = new Date();

    try {
      console.log('[AuctionCloser] running at', now.toISOString());

      // 1️⃣ Đấu giá có người bid → sold
      // Fetch products that need to be marked as sold
      const productsToSell = await db.prisma.product.findMany({
        where: {
          status: 'open',
          end_time: { lte: now },
          current_highest_bidder_id: { not: null },
        },
        include: {
          seller: {
            select: { email: true, name: true },
          },
          current_highest_bidder: {
            select: { email: true, name: true },
          },
        },
      });

      // Update status to sold
      const soldResult = await db.prisma.$executeRawUnsafe(`
        UPDATE "Product"
        SET status = 'sold'
        WHERE status = 'open'
          AND end_time <= (now() AT TIME ZONE 'UTC')
          AND current_highest_bidder_id IS NOT NULL
      `);

      // Send email notifications for sold products
      for (const product of productsToSell) {
        try {
          if (product.seller && product.current_highest_bidder) {
            const productLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/product/${product.product_id}`;
            const formattedPrice = new Intl.NumberFormat('vi-VN').format(
              Number(product.current_price)
            );

            await sendAuctionSuccessEmail(
              product.name,
              formattedPrice,
              productLink,
              product.seller.email,
              product.current_highest_bidder.email
            );
          }
        } catch (emailError) {
          console.error(
            `[AuctionCloser] Failed to send success email for product ${product.product_id}:`,
            emailError
          );
        }
      }

      // 2️⃣ Không có ai bid → expired
      // Fetch products that need to be marked as expired
      const productsToExpire = await db.prisma.product.findMany({
        where: {
          status: 'open',
          end_time: { lte: now },
          current_highest_bidder_id: null,
        },
        include: {
          seller: {
            select: { email: true, name: true },
          },
        },
      });

      // Update status to expired
      const expiredResult = await db.prisma.$executeRawUnsafe(`
        UPDATE "Product"
        SET status = 'expired'
        WHERE status = 'open'
          AND end_time <= (now() AT TIME ZONE 'UTC')
          AND current_highest_bidder_id IS NULL
      `);

      // Send email notifications for expired products
      for (const product of productsToExpire) {
        try {
          if (product.seller) {
            const productLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/product/${product.product_id}`;

            await sendAuctionEndedNoWinnerEmail(product.seller.email, product.name, productLink);
          }
        } catch (emailError) {
          console.error(
            `[AuctionCloser] Failed to send no winner email for product ${product.product_id}:`,
            emailError
          );
        }
      }

      console.log(`[AuctionCloser] done | sold: ${soldResult}, expired: ${expiredResult}`);
    } catch (error) {
      console.error('[AuctionCloser] error:', error);
    }
  }, INTERVAL_MS);
}
