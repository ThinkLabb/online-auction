-- Replaces the existing function with the new logic
CREATE OR REPLACE FUNCTION delete_bids_on_deny()
RETURNS TRIGGER AS $$
DECLARE
    remaining_bid_count INT;
    new_max_bid DECIMAL(12, 2);
    new_highest_bidder UUID; 
    product_start_price DECIMAL(12, 2);
BEGIN
    -- 1. Delete the banned user's bids
    DELETE FROM "BidHistory"
    WHERE product_id = NEW.product_id
      AND bidder_id = NEW.bidder_id;

    -- 2. Calculate statistics from REMAINING bids
    SELECT COUNT(*), MAX(bid_amount)
    INTO remaining_bid_count, new_max_bid
    FROM "BidHistory"
    WHERE product_id = NEW.product_id;

    -- 3. Logic to determine new highest bidder
    IF remaining_bid_count > 0 THEN
        -- Find the user who holds the new max bid
        SELECT bidder_id INTO new_highest_bidder
        FROM "BidHistory"
        WHERE product_id = NEW.product_id AND bid_amount = new_max_bid
        ORDER BY bid_time ASC
        LIMIT 1;
    ELSE
        -- No bids left; revert to start price
        SELECT start_price INTO product_start_price
        FROM "Product"
        WHERE product_id = NEW.product_id;

        new_max_bid := product_start_price;
        new_highest_bidder := NULL;
    END IF;

    -- 4. Update the Product table
    -- Note: We cast to UUID explicitly to match the column type
    UPDATE "Product"
    SET 
        bid_count = remaining_bid_count,
        current_price = COALESCE(new_max_bid, 0),
        current_highest_bidder_id = new_highest_bidder
    WHERE product_id = NEW.product_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;