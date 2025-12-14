-- 1. Xóa Trigger và Function cũ trước (để clean)
DROP TRIGGER IF EXISTS trigger_auto_extend_on_bid ON "BidHistory";
DROP FUNCTION IF EXISTS auto_extend_auction;

-- 2. Tạo Function mới (Logic đã fix: Dùng NEW.bid_time thay vì NOW())
CREATE OR REPLACE FUNCTION auto_extend_auction()
RETURNS TRIGGER AS $$
DECLARE
    rec_product RECORD;
    cfg_window INT;
    cfg_duration INT;
    time_remaining INTERVAL;
BEGIN
    -- Lấy thông tin sản phẩm
    SELECT end_time, auto_extend 
    INTO rec_product
    FROM "Product"
    WHERE product_id = NEW.product_id;

    -- [LOG] Để debug (có thể xóa sau này nếu muốn)
    RAISE NOTICE 'Trigger Check -> ProductID: %, EndTime: %, BidTime: %', NEW.product_id, rec_product.end_time, NEW.bid_time;

    -- Nếu sản phẩm không bật tự động gia hạn -> Dừng
    IF rec_product.auto_extend IS FALSE THEN
        RETURN NEW;
    END IF;

    -- Lấy cấu hình (Mặc định 5 phút window, cộng 10 phút duration nếu null)
    SELECT extend_window_minutes, extend_duration_minutes
    INTO cfg_window, cfg_duration
    FROM "AuctionConfig"
    LIMIT 1;

    IF cfg_window IS NULL THEN cfg_window := 5; END IF;
    IF cfg_duration IS NULL THEN cfg_duration := 10; END IF;

    -- [FIX QUAN TRỌNG]: Tính thời gian còn lại dựa trên THỜI ĐIỂM ĐẤU GIÁ (NEW.bid_time)
    -- Tránh việc server database bị lệch giờ hoặc latency của transaction
    time_remaining := rec_product.end_time - NEW.bid_time;

    RAISE NOTICE '-> Time Remaining: %, Window: % mins', time_remaining, cfg_window;

    -- Logic: 
    -- 1. time_remaining > 0: Nghĩa là lúc bid, sản phẩm chưa hết hạn.
    -- 2. time_remaining <= Window: Nghĩa là bid vào phút chót.
    IF time_remaining > INTERVAL '0 seconds' AND time_remaining <= (cfg_window * INTERVAL '1 minute') THEN
        
        -- Cập nhật: Cộng thêm thời gian vào end_time hiện tại
        UPDATE "Product"
        SET end_time = end_time + (cfg_duration * INTERVAL '1 minute')
        WHERE product_id = NEW.product_id;

        RAISE NOTICE '-> SUCCESS: Extended by % minutes', cfg_duration;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Tạo lại Trigger gắn vào bảng
CREATE TRIGGER trigger_auto_extend_on_bid
AFTER INSERT ON "BidHistory"
FOR EACH ROW
EXECUTE FUNCTION auto_extend_auction();