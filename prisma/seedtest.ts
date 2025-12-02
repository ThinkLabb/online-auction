import { PrismaClient, ProductStatus, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log(`=== START SEEDING ===`);

  // --------------------------------------------
  // Categories
  // --------------------------------------------
  const categories = await prisma.category.createMany({
    data: [
      { name_level_1: 'Electronics', name_level_2: 'Phones' },
      { name_level_1: 'Electronics', name_level_2: 'Laptops' },
      { name_level_1: 'Fashion', name_level_2: 'Watches' },
      { name_level_1: 'Home', name_level_2: 'Furniture' },
      { name_level_1: 'Sports', name_level_2: 'Fitness' },
    ],
    skipDuplicates: true,
  });

  const cat_phones = await prisma.category.findFirst({
    where: { name_level_1: 'Electronics', name_level_2: 'Phones' },
  });

  const cat_laptops = await prisma.category.findFirst({
    where: { name_level_1: 'Electronics', name_level_2: 'Laptops' },
  });

  const cat_watch = await prisma.category.findFirst({
    where: { name_level_1: 'Fashion', name_level_2: 'Watches' },
  });

  // --------------------------------------------
  // Users
  // --------------------------------------------
  const hashed = await hashPassword('password123');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashed,
      name: 'Admin User',
      role: 'admin',
      is_email_verified: true,
    },
  });

  const sellerA = await prisma.user.upsert({
    where: { email: 'seller1@example.com' },
    update: {},
    create: {
      email: 'seller1@example.com',
      password: hashed,
      name: 'Seller A',
      role: 'seller',
      is_email_verified: true,
    },
  });

  const sellerB = await prisma.user.upsert({
    where: { email: 'seller2@example.com' },
    update: {},
    create: {
      email: 'seller2@example.com',
      password: hashed,
      name: 'Seller B',
      role: 'seller',
      is_email_verified: true,
    },
  });

  const bidderA = await prisma.user.upsert({
    where: { email: 'bidder1@example.com' },
    update: {},
    create: {
      email: 'bidder1@example.com',
      password: hashed,
      name: 'Bidder A',
      role: 'bidder',
      is_email_verified: true,
    },
  });

  const bidderB = await prisma.user.upsert({
    where: { email: 'bidder2@example.com' },
    update: {},
    create: {
      email: 'bidder2@example.com',
      password: hashed,
      name: 'Bidder B',
      role: 'bidder',
      is_email_verified: true,
    },
  });

  // --------------------------------------------
  // Products (đủ 4 trạng thái)
  // --------------------------------------------
  const p1 = await prisma.product.create({
    data: {
      name: 'iPhone 14 Pro',
      seller_id: sellerA.user_id,
      category_id: cat_phones!.category_id,
      start_price: 500,
      step_price: 20,
      current_price: 500,
      status: ProductStatus.open,
      end_time: new Date(Date.now() + 2 * 86400000),
      description_history: { create: { description: 'Brand new iPhone 14 Pro.' } },
      images: { create: [{ image_url: 'iphone.webp' }] },
    },
  });

  const p2 = await prisma.product.create({
    data: {
      name: 'MacBook Pro M2',
      seller_id: sellerA.user_id,
      category_id: cat_laptops!.category_id,
      start_price: 1200,
      step_price: 50,
      current_price: 1200,
      status: ProductStatus.sold,
      end_time: new Date(Date.now() - 86400000),
      description_history: { create: { description: 'Lightly used MacBook Pro 14".' } },
      images: { create: [{ image_url: 'mac.webp' }] },
    },
  });

  const p3 = await prisma.product.create({
    data: {
      name: 'Vintage Rolex',
      seller_id: sellerB.user_id,
      category_id: cat_watch!.category_id,
      start_price: 2000,
      step_price: 100,
      current_price: 2000,
      status: ProductStatus.expired,
      end_time: new Date(Date.now() - 5 * 86400000),
      description_history: { create: { description: 'Rolex from 1980s.' } },
      images: { create: [{ image_url: 'rolex.webp' }] },
    },
  });

  const p4 = await prisma.product.create({
    data: {
      name: 'Gaming Laptop RTX 4080',
      seller_id: sellerB.user_id,
      category_id: cat_laptops!.category_id,
      start_price: 1500,
      step_price: 50,
      current_price: 1500,
      status: ProductStatus.removed,
      end_time: new Date(Date.now() + 4 * 86400000),
      description_history: { create: { description: 'Very powerful gaming laptop.' } },
      images: { create: [{ image_url: 'gaming.webp' }] },
    },
  });

  // --------------------------------------------
  // BidHistory
  // --------------------------------------------
  await prisma.bidHistory.createMany({
    data: [
      {
        product_id: p1.product_id,
        bidder_id: bidderA.user_id,
        bid_amount: 520,
      },
      {
        product_id: p1.product_id,
        bidder_id: bidderB.user_id,
        bid_amount: 540,
      },
    ],
  });

  // --------------------------------------------
  // Watchlist
  // --------------------------------------------
  await prisma.watchlist.createMany({
    data: [
      { user_id: bidderA.user_id, product_id: p1.product_id },
      { user_id: bidderB.user_id, product_id: p2.product_id },
    ],
  });

  // --------------------------------------------
  // Q&A
  // --------------------------------------------
  await prisma.productQandA.create({
    data: {
      product_id: p1.product_id,
      questioner_id: bidderA.user_id,
      question_text: 'Is the phone still under warranty?',
      answer_text: 'Yes, 10 months remaining.',
    },
  });

  // --------------------------------------------
  // Orders (đủ các trạng thái)
  // --------------------------------------------
  const order1 = await prisma.order.create({
    data: {
      product_id: p2.product_id,
      buyer_id: bidderA.user_id,
      seller_id: sellerA.user_id,
      final_price: 1300,
      status: OrderStatus.payment_confirmed,
      shipping_address: '123 Test Road',
    },
  });

  const order2 = await prisma.order.create({
    data: {
      product_id: p3.product_id,
      buyer_id: bidderB.user_id,
      seller_id: sellerB.user_id,
      final_price: 2500,
      status: OrderStatus.completed,
      shipping_address: '55 Completed Street',
    },
  });

  // --------------------------------------------
  // Reviews
  // --------------------------------------------
  await prisma.reviews.create({
    data: {
      product_id: p3.product_id,
      reviewer_id: bidderB.user_id,
      reviewee_id: sellerB.user_id,
      is_positive: true,
      comment: 'Great seller, fast shipping!',
    },
  });

  await prisma.reviews.create({
    data: {
      product_id: p2.product_id,
      reviewer_id: bidderA.user_id,
      reviewee_id: sellerA.user_id,
      is_positive: false,
      comment: 'Product was scratched.',
    },
  });

  // --------------------------------------------
  // OrderChat
  // --------------------------------------------
  await prisma.orderChat.createMany({
    data: [
      {
        order_id: order1.order_id,
        sender_id: bidderA.user_id,
        message_text: 'When will this be shipped?',
      },
      {
        order_id: order1.order_id,
        sender_id: sellerA.user_id,
        message_text: 'Tomorrow morning!',
      },
    ],
  });

  console.log(`=== SEED COMPLETE ===`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
