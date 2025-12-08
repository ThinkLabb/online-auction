-- 1. Create the function to delete bids
CREATE OR REPLACE FUNCTION delete_bids_on_deny()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM "BidHistory"
    WHERE product_id = NEW.product_id
      AND bidder_id = NEW.bidder_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger to fire after insert
CREATE TRIGGER trigger_remove_bids_after_deny
AFTER INSERT ON "DeniedBidders"
FOR EACH ROW
EXECUTE FUNCTION delete_bids_on_deny();