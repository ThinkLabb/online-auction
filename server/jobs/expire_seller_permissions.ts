import db from '../services/database';

const INTERVAL_MS = 3600_000; // 1 hour (check every hour)

export function startSellerPermissionExpirer() {
  console.log('[SellerPermissionExpirer] started');

  setInterval(async () => {
    const now = new Date();

    try {
      console.log('[SellerPermissionExpirer] running at', now.toISOString());

      // Find all approved requests where expires_at has passed
      const expiredRequests = await db.prisma.sellerUpgradeRequest.findMany({
        where: {
          is_approved: true,
          expires_at: {
            lte: now,
          },
        },
        include: {
          user: {
            select: {
              user_id: true,
              role: true,
              name: true,
            },
          },
        },
      });

      // Downgrade users from seller to bidder
      for (const request of expiredRequests) {
        if (request.user.role === 'seller') {
          try {
            // Downgrade user to bidder
            await db.prisma.user.update({
              where: { user_id: request.user.user_id },
              data: { role: 'bidder' },
            });

            // Delete the upgrade request record
            await db.prisma.sellerUpgradeRequest.delete({
              where: { request_id: request.request_id },
            });

            console.log(
              `[SellerPermissionExpirer] Downgraded user ${request.user.name} (${request.user.user_id}) to bidder`
            );
          } catch (error) {
            console.error(
              `[SellerPermissionExpirer] Failed to downgrade user ${request.user.user_id}:`,
              error
            );
          }
        }
      }

      console.log(`[SellerPermissionExpirer] done | downgraded: ${expiredRequests.length} users`);
    } catch (error) {
      console.error('[SellerPermissionExpirer] error:', error);
    }
  }, INTERVAL_MS);
}
