-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('bidder', 'seller', 'admin');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('open', 'sold', 'expired', 'removed');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending_payment', 'payment_confirmed', 'shipped', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "User" (
    "user_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "birthdate" DATE,
    "role" "UserRole" NOT NULL DEFAULT 'bidder',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "plus_review" INTEGER NOT NULL DEFAULT 0,
    "minus_review" INTEGER NOT NULL DEFAULT 0,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "SellerUpgradeRequest" (
    "request_id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "message" TEXT,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "is_denied" BOOLEAN NOT NULL DEFAULT false,
    "requested_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ,

    CONSTRAINT "SellerUpgradeRequest_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "Category" (
    "category_id" SERIAL NOT NULL,
    "name_level_1" TEXT NOT NULL,
    "name_level_2" TEXT,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "Product" (
    "product_id" BIGSERIAL NOT NULL,
    "seller_id" UUID NOT NULL,
    "category_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'open',
    "start_price" DECIMAL(12,2) NOT NULL,
    "buy_now_price" DECIMAL(12,2),
    "step_price" DECIMAL(10,2) NOT NULL,
    "current_price" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "current_highest_bidder_id" UUID,
    "bid_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMPTZ NOT NULL,
    "auto_extend" BOOLEAN NOT NULL DEFAULT false,
    "review_needed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "ProductImages" (
    "image_id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "image_url" TEXT NOT NULL,

    CONSTRAINT "ProductImages_pkey" PRIMARY KEY ("image_id")
);

-- CreateTable
CREATE TABLE "ProductDescriptionHistory" (
    "desc_id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "description" TEXT NOT NULL,
    "added_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductDescriptionHistory_pkey" PRIMARY KEY ("desc_id")
);

-- CreateTable
CREATE TABLE "BidHistory" (
    "bid_id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "bidder_id" UUID NOT NULL,
    "bid_amount" DECIMAL(12,2) NOT NULL,
    "bid_time" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BidHistory_pkey" PRIMARY KEY ("bid_id")
);

-- CreateTable
CREATE TABLE "Watchlist" (
    "user_id" UUID NOT NULL,
    "product_id" BIGINT NOT NULL,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("user_id","product_id")
);

-- CreateTable
CREATE TABLE "ProductQandA" (
    "qa_id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "questioner_id" UUID NOT NULL,
    "question_text" TEXT NOT NULL,
    "question_time" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answer_text" TEXT,
    "answer_time" TIMESTAMPTZ,

    CONSTRAINT "ProductQandA_pkey" PRIMARY KEY ("qa_id")
);

-- CreateTable
CREATE TABLE "Reviews" (
    "review_id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "reviewee_id" UUID NOT NULL,
    "is_positive" BOOLEAN NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reviews_pkey" PRIMARY KEY ("review_id")
);

-- CreateTable
CREATE TABLE "DeniedBidders" (
    "product_id" BIGINT NOT NULL,
    "bidder_id" UUID NOT NULL,

    CONSTRAINT "DeniedBidders_pkey" PRIMARY KEY ("product_id","bidder_id")
);

-- CreateTable
CREATE TABLE "Order" (
    "order_id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "buyer_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "final_price" DECIMAL(12,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending_payment',
    "payment_proof_url" TEXT,
    "shipping_address" TEXT,
    "shipping_proof_url" TEXT,
    "buyer_confirmed_receipt" BOOLEAN NOT NULL DEFAULT false,
    "seller_review_id" BIGINT,
    "buyer_review_id" BIGINT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "OrderChat" (
    "chat_message_id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "sender_id" UUID NOT NULL,
    "message_text" TEXT NOT NULL,
    "sent_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderChat_pkey" PRIMARY KEY ("chat_message_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SellerUpgradeRequest_user_id_key" ON "SellerUpgradeRequest"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_level_1_name_level_2_key" ON "Category"("name_level_1", "name_level_2");

-- CreateIndex
CREATE UNIQUE INDEX "Order_product_id_key" ON "Order"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "Order_seller_review_id_key" ON "Order"("seller_review_id");

-- CreateIndex
CREATE UNIQUE INDEX "Order_buyer_review_id_key" ON "Order"("buyer_review_id");

-- AddForeignKey
ALTER TABLE "SellerUpgradeRequest" ADD CONSTRAINT "SellerUpgradeRequest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("category_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_current_highest_bidder_id_fkey" FOREIGN KEY ("current_highest_bidder_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImages" ADD CONSTRAINT "ProductImages_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDescriptionHistory" ADD CONSTRAINT "ProductDescriptionHistory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidHistory" ADD CONSTRAINT "BidHistory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidHistory" ADD CONSTRAINT "BidHistory_bidder_id_fkey" FOREIGN KEY ("bidder_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductQandA" ADD CONSTRAINT "ProductQandA_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductQandA" ADD CONSTRAINT "ProductQandA_questioner_id_fkey" FOREIGN KEY ("questioner_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_reviewee_id_fkey" FOREIGN KEY ("reviewee_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeniedBidders" ADD CONSTRAINT "DeniedBidders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeniedBidders" ADD CONSTRAINT "DeniedBidders_bidder_id_fkey" FOREIGN KEY ("bidder_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_seller_review_id_fkey" FOREIGN KEY ("seller_review_id") REFERENCES "Reviews"("review_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyer_review_id_fkey" FOREIGN KEY ("buyer_review_id") REFERENCES "Reviews"("review_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderChat" ADD CONSTRAINT "OrderChat_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderChat" ADD CONSTRAINT "OrderChat_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
