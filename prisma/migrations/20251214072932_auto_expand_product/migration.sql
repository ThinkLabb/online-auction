-- 1. Function xử lý logic gia hạn
CREATE OR REPLACE FUNCTION auto_extend_auction()
RETURNS TRIGGER AS $$
DECLARE
    prod_end_time TIMESTAMP;
    prod_auto_extend BOOLEAN;
    cfg_window INT;
    cfg_duration INT;
BEGIN
    -- Lấy thông tin sản phẩm
    SELECT end_time, auto_extend 
    INTO prod_end_time, prod_auto_extend
    FROM "Product"
    WHERE product_id = NEW.product_id;

    -- Nếu sản phẩm không bật auto_extend thì dừng
    IF prod_auto_extend IS FALSE THEN
        RETURN NEW;
    END IF;

    -- Lấy cấu hình từ bảng AuctionConfig (lấy dòng đầu tiên)
    SELECT extend_window_minutes, extend_duration_minutes
    INTO cfg_window, cfg_duration
    FROM "AuctionConfig"
    LIMIT 1;

    -- Fallback nếu chưa config thì dùng mặc định 5 và 10
    IF cfg_window IS NULL THEN cfg_window := 5; END IF;
    IF cfg_duration IS NULL THEN cfg_duration := 10; END IF;

    -- Logic: Nếu (Hạn chót - Hiện tại) <= Window VÀ Hạn chót > Hiện tại
    IF prod_end_time > NOW() AND (prod_end_time - NOW()) <= (cfg_window * INTERVAL '1 minute') THEN
        
        -- Cộng thêm thời gian vào end_time
        UPDATE "Product"
        SET end_time = end_time + (cfg_duration * INTERVAL '1 minute')
        WHERE product_id = NEW.product_id;
        
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Tạo Trigger gắn vào bảng BidHistory
-- Trigger này chạy SAU KHI (AFTER) insert một bid mới thành công
CREATE OR REPLACE TRIGGER trigger_auto_extend_on_bid
AFTER INSERT ON "BidHistory"
FOR EACH ROW
EXECUTE FUNCTION auto_extend_auction();