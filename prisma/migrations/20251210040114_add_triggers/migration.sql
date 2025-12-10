CREATE OR REPLACE FUNCTION delete_bids_on_deny()
RETURNS TRIGGER AS $$
DECLARE
    remaining_bid_count INT;
    new_max_bid DECIMAL(12, 2);
    new_highest_bidder UUID; 
    product_start_price DECIMAL(12, 2);
BEGIN
    DELETE FROM "BidHistory"
    WHERE product_id = NEW.product_id
      AND bidder_id = NEW.bidder_id;

    SELECT COUNT(*), MAX(bid_amount)
    INTO remaining_bid_count, new_max_bid
    FROM "BidHistory"
    WHERE product_id = NEW.product_id;

    IF remaining_bid_count > 0 THEN
        SELECT bidder_id INTO new_highest_bidder
        FROM "BidHistory"
        WHERE product_id = NEW.product_id AND bid_amount = new_max_bid
        ORDER BY bid_time ASC
        LIMIT 1;
    ELSE
        SELECT start_price INTO product_start_price
        FROM "Product"
        WHERE product_id = NEW.product_id;

        new_max_bid := product_start_price;
        new_highest_bidder := NULL;
    END IF;

    UPDATE "Product"
    SET 
        bid_count = remaining_bid_count,
        current_price = COALESCE(new_max_bid, 0),
        current_highest_bidder_id = new_highest_bidder
    WHERE product_id = NEW.product_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_remove_bids_after_deny
AFTER INSERT ON "DeniedBidders"
FOR EACH ROW
EXECUTE FUNCTION delete_bids_on_deny();

CREATE OR REPLACE FUNCTION check_if_banned()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM "DeniedBidders" 
        WHERE product_id = NEW.product_id 
        AND bidder_id = NEW.bidder_id
    ) THEN
        RAISE EXCEPTION 'This user is banned from bidding on this product.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_check_banned_before_bid
BEFORE INSERT ON "BidHistory"
FOR EACH ROW
EXECUTE FUNCTION check_if_banned();