-- 1. Xóa Trigger trước
DROP TRIGGER IF EXISTS trigger_auto_update_product ON "BidHistory";

-- 2. Xóa Function sau
DROP FUNCTION IF EXISTS update_product_stats;