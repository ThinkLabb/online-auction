-- cleanup (an toàn khi migrate lại)
DROP TRIGGER IF EXISTS trg_product_sold_create_order ON "Product";
DROP FUNCTION IF EXISTS trg_create_order_when_sold();

-- function
CREATE OR REPLACE FUNCTION trg_create_order_when_sold()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'sold'
     AND OLD.status <> 'sold'
     AND NEW.current_highest_bidder_id IS NOT NULL
  THEN
    INSERT INTO "Order" (
      product_id,
      buyer_id,
      seller_id,
      final_price,
      status,
      created_at,
      updated_at
    )
    VALUES (
      NEW.product_id,
      NEW.current_highest_bidder_id,
      NEW.seller_id,
      NEW.current_price,
      'pending_payment',
      now(),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- trigger
CREATE TRIGGER trg_product_sold_create_order
AFTER UPDATE OF status ON "Product"
FOR EACH ROW
EXECUTE FUNCTION trg_create_order_when_sold();




CREATE OR REPLACE FUNCTION map_review_to_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Cập nhật Order tương ứng khi có review mới
    UPDATE "Order"
    SET seller_review_id = CASE 
            WHEN NEW.reviewer_id = "Order".seller_id THEN NEW.review_id
            ELSE "Order".seller_review_id
        END,
        buyer_review_id = CASE 
            WHEN NEW.reviewer_id = "Order".buyer_id THEN NEW.review_id
            ELSE "Order".buyer_review_id
        END
    WHERE "Order".product_id = NEW.product_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_review_insert
AFTER INSERT ON "Reviews"
FOR EACH ROW
EXECUTE FUNCTION map_review_to_order();
