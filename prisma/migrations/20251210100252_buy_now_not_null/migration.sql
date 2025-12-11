/*
  Warnings:

  - Made the column `buy_now_price` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "buy_now_price" SET NOT NULL;
