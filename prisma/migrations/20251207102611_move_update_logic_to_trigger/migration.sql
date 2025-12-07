-- 1. Tạo hàm xử lý update Product
CREATE OR REPLACE FUNCTION update_product_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE "Product"
    SET 
        current_price = NEW.bid_amount,      -- Giá hiện tại = Giá vừa bid
        current_highest_bidder_id = NEW.bidder_id, -- Người giữ giá = Người vừa bid
        bid_count = bid_count + 1            -- Tăng số lượt bid
    WHERE product_id = NEW.product_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Gắn Trigger vào bảng BidHistory (AFTER INSERT)
CREATE TRIGGER trigger_auto_update_product
AFTER INSERT ON "BidHistory"
FOR EACH ROW
EXECUTE FUNCTION update_product_stats();