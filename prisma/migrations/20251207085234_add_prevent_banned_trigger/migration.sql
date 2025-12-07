-- 1. Create the function to check if user is banned
CREATE OR REPLACE FUNCTION check_if_banned()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if a record exists in DeniedBidders for this user and product
    IF EXISTS (
        SELECT 1 
        FROM "DeniedBidders" 
        WHERE product_id = NEW.product_id 
        AND bidder_id = NEW.bidder_id
    ) THEN
        -- This error message will be sent back to Prisma
        RAISE EXCEPTION 'This user is banned from bidding on this product.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger to run BEFORE insertion
CREATE TRIGGER trigger_check_banned_before_bid
BEFORE INSERT ON "BidHistory"
FOR EACH ROW
EXECUTE FUNCTION check_if_banned();