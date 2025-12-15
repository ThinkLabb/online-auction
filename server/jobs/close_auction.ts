import db from '../services/database'

const INTERVAL_MS = 60_000 // 1 phút

export function startAuctionCloser() {
  console.log('[AuctionCloser] started')

  setInterval(async () => {
    const now = new Date()

    try {
      console.log('[AuctionCloser] running at', now.toISOString())

      // 1️⃣ Đấu giá có người bid → sold
      const soldResult = await db.prisma.$executeRawUnsafe(`
        UPDATE "Product"
        SET status = 'sold'
        WHERE status = 'open'
          AND end_time <= (now() AT TIME ZONE 'UTC')
          AND current_highest_bidder_id IS NOT NULL
      `)

      // 2️⃣ Không có ai bid → expired
      const expiredResult = await db.prisma.$executeRawUnsafe(`
        UPDATE "Product"
        SET status = 'expired'
        WHERE status = 'open'
          AND end_time <= (now() AT TIME ZONE 'UTC')
          AND current_highest_bidder_id IS NULL
      `)

      console.log(
        `[AuctionCloser] done | sold: ${soldResult}, expired: ${expiredResult}`
      )
    } catch (error) {
      console.error('[AuctionCloser] error:', error)
    }
  }, INTERVAL_MS)
}
