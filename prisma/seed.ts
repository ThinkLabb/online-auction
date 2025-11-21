import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper để băm mật khẩu
async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log(`Start seeding ...`);

  // --- 1. Tạo Categories ---
  console.log('Seeding categories...');
  const cat1 = await prisma.category.upsert({
    where: { name_level_1_name_level_2: { name_level_1: 'Electronics', name_level_2: 'Phones' } },
    update: {},
    create: { name_level_1: 'Electronics', name_level_2: 'Phones' },
  });

  const cat2 = await prisma.category.upsert({
    where: { name_level_1_name_level_2: { name_level_1: 'Electronics', name_level_2: 'Laptops' } },
    update: {},
    create: { name_level_1: 'Electronics', name_level_2: 'Laptops' },
  });

  const cat3 = await prisma.category.upsert({
    where: { name_level_1_name_level_2: { name_level_1: 'Fashion', name_level_2: 'Watches' } },
    update: {},
    create: { name_level_1: 'Fashion', name_level_2: 'Watches' },
  });

  // --- 2. Tạo Users (Sellers) ---
  console.log('Seeding users...');
  const hashedPassword = await hashPassword('password123'); // Mật khẩu chung cho tất cả user mẫu

  const seller1 = await prisma.user.upsert({
    where: { email: 'seller1@example.com' },
    update: {},
    create: {
      email: 'seller1@example.com',
      full_name: 'John Doe',
      password_hash: hashedPassword,
      role: 'seller', // Đặt làm seller luôn
      is_email_verified: true,
    },
  });

  const seller2 = await prisma.user.upsert({
    where: { email: 'seller2@example.com' },
    update: {},
    create: {
      email: 'seller2@example.com',
      full_name: 'Jane Smith',
      password_hash: hashedPassword,
      role: 'seller',
      is_email_verified: true,
    },
  });

  // --- 3. Tạo 5 Products (cùng với Images và Description) ---
  console.log('Seeding 5 products...');

  // Product 1
  await prisma.product.create({
    data: {
      name: 'Vintage Rolex Watch',
      seller_id: seller1.user_id,
      category_id: cat3.category_id,
      start_price: 1500.00,
      buy_now_price: 3000.00,
      step_price: 50.00,
      current_price: 1500.00,
      end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 ngày nữa
      description_history: {
        create: {
          description: 'A beautiful vintage Rolex from the 1980s. Good condition.',
        },
      },
      images: {
        create: { image_url: 'thinkpad.webp' }, // <-- ĐÃ THAY ĐỔI
      },
    },
  });

  // Product 2
  await prisma.product.create({
    data: {
      name: 'Used MacBook Pro 14"',
      seller_id: seller2.user_id,
      category_id: cat2.category_id,
      start_price: 800.00,
      buy_now_price: 1200.00,
      step_price: 25.00,
      current_price: 800.00,
      end_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 ngày nữa
      description_history: {
        create: {
          description: 'MacBook Pro 14-inch, M1 Pro chip. Minor scratches on the bottom.',
        },
      },
      images: {
        create: { image_url: 'thinkpad.webp' }, // <-- ĐÃ THAY ĐỔI
      },
    },
  });

  // Product 3
  await prisma.product.create({
    data: {
      name: 'iPhone 13 Pro - 256GB',
      seller_id: seller1.user_id,
      category_id: cat1.category_id,
      start_price: 450.00,
      step_price: 10.00,
      current_price: 450.00,
      end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 ngày nữa
      description_history: {
        create: {
          description: 'iPhone 13 Pro, 256GB, Sierra Blue. Battery health 90%.',
        },
      },
      images: {
        create: { image_url: 'thinkpad.webp' }, // <-- ĐÃ THAY ĐỔI
      },
    },
  });

  // Product 4
  await prisma.product.create({
    data: {
      name: 'Dell XPS 15 Laptop',
      seller_id: seller2.user_id,
      category_id: cat2.category_id,
      start_price: 700.00,
      buy_now_price: 1000.00,
      step_price: 20.00,
      current_price: 700.00,
      end_time: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 ngày nữa
      description_history: {
        create: {
          description: 'Dell XPS 15 (9510), Core i7, 16GB RAM, 1TB SSD. Excellent condition.',
        },
      },
      images: {
        create: { image_url: 'thinkpad.webp' }, // <-- ĐÃ THAY ĐỔI
      },
    },
  });

  // Product 5
  await prisma.product.create({
    data: {
      name: 'Samsung Galaxy S22',
      seller_id: seller1.user_id,
      category_id: cat1.category_id,
      start_price: 300.00,
      buy_now_price: 500.00,
      step_price: 10.00,
      current_price: 300.00,
      end_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 ngày nữa
      description_history: {
        create: {
          description: 'Samsung S22, 128GB, Phantom Black. Unlocked.',
        },
      },
      images: {
        create: { image_url: 'thinkpad.webp' }, // <-- ĐÃ THAY ĐỔI
      },
    },
  });

  console.log('Finished seeding products.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    console.log(`Seeding finished.`);
    await prisma.$disconnect();
  });