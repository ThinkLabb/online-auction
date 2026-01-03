import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  CLEANING DATABASE (Deleting old data)...');

  // 1. Clean up database
  await Promise.all([
    prisma.orderChat.deleteMany(),
    prisma.reviews.deleteMany(),
    prisma.productQandA.deleteMany(),
    prisma.watchlist.deleteMany(),
    prisma.bidHistory.deleteMany(),
    prisma.productImages.deleteMany(),
    prisma.productDescriptionHistory.deleteMany(),
    prisma.deniedBidders.deleteMany(),
    prisma.sellerUpgradeRequest.deleteMany(),
  ]);

  await prisma.order.deleteMany();
  await prisma.product.deleteMany();

  await Promise.all([
    prisma.category.deleteMany(),
    prisma.user.deleteMany(),
    prisma.auctionConfig.deleteMany(),
  ]);

  console.log('🌱  SEEDING CONFIGURATIONS (Parallel Execution)...');

  const password = bcrypt.hashSync('Demo1234!', 12);

  // 2. Create Config
  const configPromise = prisma.auctionConfig.create({
    data: {
      id: 1,
      extend_window_minutes: 5,
      extend_duration_minutes: 10,
    },
  });

  // 3. Create Categories
  const categoriesData = [
    { l1: 'Electronics', l2: 'Smartphones' },
    { l1: 'Electronics', l2: 'Laptops' },
    { l1: 'Electronics', l2: 'Tablets' },

    { l1: 'Fashion', l2: 'Watches' },
    { l1: 'Fashion', l2: 'Shoes' },
    { l1: 'Fashion', l2: 'Clothing' },

    { l1: 'Furniture', l2: 'Tables & Chairs' },
    { l1: 'Furniture', l2: 'Sofa' },

    { l1: 'Collectibles', l2: 'Art & Paintings' },
  ];

  // Storing promises to await later
  const categoryPromises = categoriesData.map((cat) =>
    prisma.category.create({
      data: { name_level_1: cat.l1, name_level_2: cat.l2 },
    })
  );

  // 4. Create Users (Admin, Bidders, Sellers)
  console.log('👤  SEEDING USERS...');

  // Admin
  const adminPromise = prisma.user.create({
    data: {
      email: 'admin@system.com',
      password,
      name: 'Super Admin',
      role: UserRole.admin,
      is_email_verified: true,
      address: '1, Đường Đồng Khởi, Phường Bến Nghé, TP. Hồ Chí Minh',
    },
  });

  // 2 Default Bidders
  const bidder1Promise = prisma.user.create({
    data: {
      email: 'bidder1@demo.com',
      password,
      name: 'Adam bidder',
      role: UserRole.bidder,
      is_email_verified: true,
      address: '123, Đường Nguyễn Trãi, Phường 2, TP. Hồ Chí Minh',
      minus_review: 1,
    },
  });

  const bidder2Promise = prisma.user.create({
    data: {
      email: 'bidder2@demo.com',
      password,
      name: 'Eva bidder',
      role: UserRole.bidder,
      is_email_verified: true,
      address: '456, Đường Hai Bà Trưng, Phường Đa Kao, TP. Hồ Chí Minh',
      plus_review: 1,
    },
  });

  // New Bidder: Hạo Nam
  const bidder3Promise = prisma.user.create({
    data: {
      email: 'namhaohuynh@gmail.com',
      password,
      name: 'Hạo Nam',
      role: UserRole.bidder,
      is_email_verified: true,
      plus_review: 1,
      address: '55, Đường Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
    },
  });

  const seller1Promise = prisma.user.create({
    data: {
      email: 'seller1@demo.com',
      password,
      name: 'Ltp seller',
      role: UserRole.seller,
      is_email_verified: true,
      plus_review: 1,
      address: '789, Đường Xuân Thủy, Phường Dịch Vọng Hậu, TP. Hà Nội',
    },
  });

  const seller2Promise = prisma.user.create({
    data: {
      email: 'seller2@demo.com',
      password,
      name: 'Doe seller',
      role: UserRole.seller,
      is_email_verified: true,
      address: '321, Đường Bạch Đằng, Phường Hải Châu 1, TP. Đà Nẵng',
      minus_review: 1,
    },
  });

  // New Seller: KDDDD
  const seller3Promise = prisma.user.create({
    data: {
      email: 'ntcong@gmail.com',
      password,
      name: 'KDDDD',
      role: UserRole.seller,
      is_email_verified: true,
      address: '88, Đường Láng, Phường Láng Thượng, Quận Đống Đa, TP. Hà Nội',
    },
  });

  // Execute all creations in parallel
  // We capture the results of sellers and categories to link products accurately
  const [
    _config,
    _admin,
    seller1,
    seller2,
    _bidder1,
    _bidder2,
    _bidder3,
    _seller3,
    ...createdCategories
  ] = await Promise.all([
    configPromise,
    adminPromise,
    seller1Promise,
    seller2Promise,
    bidder1Promise,
    bidder2Promise,
    bidder3Promise,
    seller3Promise,
    ...categoryPromises,
  ]);

  console.log('✅  Created Config & Users');

  // 5. Create Products
  console.log('📦  SEEDING PRODUCTS...');

  // Helper to find category ID
  const tabletCat = createdCategories.find((c) => c.name_level_2 === 'Tablets');
  const watchCat = createdCategories.find((c) => c.name_level_2 === 'Watches');
  const clothingCat = createdCategories.find((c) => c.name_level_2 === 'Clothing');
  const phoneCat = createdCategories.find((c) => c.name_level_2 === 'Smartphones');
  const laptopCat = createdCategories.find((c) => c.name_level_2 === 'Laptops');
  const shoesCat = createdCategories.find((c) => c.name_level_2 === 'Shoes');
  const tableCat = createdCategories.find((c) => c.name_level_2 === 'Tables & Chairs');
  const sofaCat = createdCategories.find((c) => c.name_level_2 === 'Sofa');
  const artCat = createdCategories.find((c) => c.name_level_2 === 'Art & Paintings');

  if (
    !tabletCat ||
    !watchCat ||
    !clothingCat ||
    !phoneCat ||
    !laptopCat ||
    !shoesCat ||
    !tableCat ||
    !sofaCat ||
    !artCat
  ) {
    throw new Error('Required Categories not found');
  }

  const now = new Date();
  const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const threeDay = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const minute20 = new Date(now.getTime() + 20 * 60 * 1000);
  const daybefore = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // --- THÊM BIẾN THỜI GIAN ĐỂ POST DATE KHÁC NHAU ---
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

  // --- EXISTING PRODUCTS ---

  // Product 1: iPad Pro (Tablets)
  await prisma.product.create({
    data: {
      name: 'iPad Pro',
      seller_id: seller1.user_id,
      category_id: tabletCat.category_id,
      start_price: 500,
      current_price: 500,
      buy_now_price: 1000,
      step_price: 30,
      created_at: twoDaysAgo, // Posted 2 days ago
      end_time: oneWeekLater,
      auto_extend: true,
      review_needed: false,
      allow_unrated_bidder: true,
      description_history: {
        create: {
          description: 'Hàng mới nguyên seal, chính hãng VN/A. Dung lượng 256GB.',
        },
      },
      images: {
        create: [
          { image_url: 'productsImg/71a0e5bc-870e-4877-9872-4c9da9b46e52_1767345886373_1.png' },
          { image_url: 'productsImg/71a0e5bc-870e-4877-9872-4c9da9b46e52_1767345886371_0.png' },
          { image_url: 'productsImg/71a0e5bc-870e-4877-9872-4c9da9b46e52_1767345886374_2.png' },
          { image_url: 'productsImg/71a0e5bc-870e-4877-9872-4c9da9b46e52_1767345886374_3.png' },
        ],
      },
    },
  });

  // Product 2: Hoodie black (Clothing)
  await prisma.product.create({
    data: {
      name: 'Hoodie black',
      seller_id: seller2.user_id,
      category_id: clothingCat.category_id,
      start_price: 20,
      current_price: 20,
      buy_now_price: 100,
      step_price: 2,
      created_at: new Date(daybefore.getTime() - 3 * 24 * 60 * 60 * 1000),
      end_time: daybefore,
      auto_extend: true,
      review_needed: true,
      allow_unrated_bidder: false,
      description_history: {
        create: {
          description: 'Ấm áp mùa đông không cần crush.',
        },
      },
      images: {
        create: [
          { image_url: 'productsImg/71a0e5bc-870e-4877-9872-4c9da9b46e52_1767346275901_0.png' },
          { image_url: 'productsImg/71a0e5bc-870e-4877-9872-4c9da9b46e52_1767346275901_1.png' },
          { image_url: 'productsImg/71a0e5bc-870e-4877-9872-4c9da9b46e52_1767346275901_2.png' },
          { image_url: 'productsImg/71a0e5bc-870e-4877-9872-4c9da9b46e52_1767346275902_3.png' },
        ],
      },
    },
  });

  // Product 3: Color (Art & Paintings)
  await prisma.product.create({
    data: {
      name: 'Color',
      seller_id: seller2.user_id,
      category_id: artCat.category_id,
      start_price: 5,
      current_price: 5,
      buy_now_price: 20,
      step_price: 1,
      created_at: fiveHoursAgo, // Posted 5 hours ago
      end_time: threeDay,
      auto_extend: true,
      review_needed: true,
      allow_unrated_bidder: false,
      description_history: {
        create: {
          description: 'Vẽ cả thế giới.',
        },
      },
      images: {
        create: [
          { image_url: 'productsImg/85e068c5-659a-4948-9ea1-8dae1993af22_1767346632544_0.png' },
          { image_url: 'productsImg/85e068c5-659a-4948-9ea1-8dae1993af22_1767346632545_1.png' },
          { image_url: 'productsImg/85e068c5-659a-4948-9ea1-8dae1993af22_1767346632545_2.png' },
          { image_url: 'productsImg/85e068c5-659a-4948-9ea1-8dae1993af22_1767346632545_3.png' },
        ],
      },
    },
  });

  // Product 4: Samsung watch (Watches)
  await prisma.product.create({
    data: {
      name: 'Samsung watch',
      seller_id: seller2.user_id,
      category_id: watchCat.category_id,
      start_price: 100,
      current_price: 100,
      buy_now_price: 500,
      step_price: 10,
      created_at: tenMinutesAgo, // Posted 10 mins ago
      end_time: threeDay,
      auto_extend: true,
      review_needed: true,
      allow_unrated_bidder: false,
      description_history: {
        create: {
          description: 'Smart watch ...',
        },
      },
      images: {
        create: [
          { image_url: 'productsImg/a83a957a-913b-4ce0-87dc-f9b3e3f02ff2_1767352855371_0.png' },
          { image_url: 'productsImg/a83a957a-913b-4ce0-87dc-f9b3e3f02ff2_1767352855371_1.png' },
          { image_url: 'productsImg/a83a957a-913b-4ce0-87dc-f9b3e3f02ff2_1767352855371_2.png' },
          { image_url: 'productsImg/a83a957a-913b-4ce0-87dc-f9b3e3f02ff2_1767352855371_3.png' },
        ],
      },
    },
  });

  // --- NEW PRODUCTS FOR MISSING CATEGORIES ---

  // Product 5: Smartphone (Smartphones)
  await prisma.product.create({
    data: {
      name: 'iPhone 16 Ultra',
      seller_id: seller1.user_id,
      category_id: phoneCat.category_id,
      start_price: 1100,
      current_price: 1100,
      buy_now_price: 1500,
      step_price: 50,
      created_at: now, // Just now
      end_time: oneWeekLater,
      auto_extend: true,
      review_needed: false,
      allow_unrated_bidder: true,
      description_history: {
        create: {
          description: 'The latest iPhone with AI features.',
        },
      },
      images: {
        create: [
                  { image_url: 'productsImg/a2461e73-85ba-49da-ac50-e231ef0352e5_1767421906666_0.png' },
                  { image_url: 'productsImg/a2461e73-85ba-49da-ac50-e231ef0352e5_1767421906666_1.png' },
                  { image_url: 'productsImg/a2461e73-85ba-49da-ac50-e231ef0352e5_1767421906666_2.png' },
                  { image_url: 'productsImg/a2461e73-85ba-49da-ac50-e231ef0352e5_1767421906666_3.png' },
                ],
      },
    },
  });

  // Product 6: Laptop (Laptops)
  await prisma.product.create({
    data: {
      name: 'MacBook Pro M3',
      seller_id: seller1.user_id,
      category_id: laptopCat.category_id,
      start_price: 2000,
      current_price: 2000,
      buy_now_price: 3000,
      step_price: 100,
      created_at: twoDaysAgo, // Posted 2 days ago
      end_time: oneWeekLater,
      auto_extend: true,
      review_needed: true,
      allow_unrated_bidder: false,
      description_history: {
        create: {
          description: 'Space Gray, 1TB SSD, 16GB RAM.',
        },
      },
      images: {
        create: [
          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424499201_1.png' },
          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424499200_0.png' },
          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424499201_2.png' },
          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424499201_3.png' },
        ],
      },
    },
  });

  // Product 7: Shoes (Shoes)
  await prisma.product.create({
    data: {
      name: 'Nike Air Jordan 1',
      seller_id: seller2.user_id,
      category_id: shoesCat.category_id,
      start_price: 150,
      current_price: 150,
      buy_now_price: 400,
      step_price: 10,
      created_at: fiveHoursAgo, // Posted 5 hours ago
      end_time: threeDay,
      auto_extend: true,
      review_needed: false,
      allow_unrated_bidder: true,
      description_history: {
        create: {
          description: 'Classic High Top, Size 10 US.',
        },
      },
      images: {
        create: [
                  { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424633717_0.png' },
                  { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424633717_1.png' },
                  { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424633717_2.png' },
                  { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424633718_3.png' },
                ],
      },
    },
  });

  // Product 8: Tables & Chairs (Tables & Chairs)
  await prisma.product.create({
    data: {
      name: 'Wooden Dining Table',
      seller_id: _seller3.user_id, // Using new seller
      category_id: tableCat.category_id,
      start_price: 300,
      current_price: 300,
      buy_now_price: 800,
      step_price: 20,
      created_at: tenMinutesAgo, // Posted 10 mins ago
      end_time: oneWeekLater,
      auto_extend: false,
      review_needed: true,
      allow_unrated_bidder: false,
      description_history: {
        create: {
          description: 'Solid oak table, seats 6 people.',
        },
      },
      images: {
        create: [
                  { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767425057770_0.png' },
                  { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767425057771_1.png' },
                  { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767425057771_2.png' },
                  { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767425057771_3.png' },
                ],
      },
    },
  });

  // Product 9: Sofa (Sofa)
  await prisma.product.create({
    data: {
      name: 'Italian Leather Sofa',
      seller_id: _seller3.user_id,
      category_id: sofaCat.category_id,
      start_price: 1200,
      current_price: 1200,
      buy_now_price: 2500,
      step_price: 100,
      created_at: now,
      end_time: threeDay,
      auto_extend: true,
      review_needed: true,
      allow_unrated_bidder: false,
      description_history: {
        create: {
          description: 'Premium leather, dark brown, 3-seater.',
        },
      },
      images: {
        create: [
                  { image_url: 'productsImg/a2461e73-85ba-49da-ac50-e231ef0352e5_1767421958073_0.png' },
                  { image_url: 'productsImg/a2461e73-85ba-49da-ac50-e231ef0352e5_1767421958073_1.png' },
                  { image_url: 'productsImg/a2461e73-85ba-49da-ac50-e231ef0352e5_1767421958073_2.png' },
                  { image_url: 'productsImg/a2461e73-85ba-49da-ac50-e231ef0352e5_1767421958073_3.png' },
                ],
      },
    },
  });
  // Product 10: Samsung Galaxy S24 (Smartphones)
  await prisma.product.create({
    data: {
      name: 'Samsung Galaxy S24 Ultra',
      seller_id: _seller3.user_id,
      category_id: phoneCat.category_id,
      start_price: 1000,
      current_price: 1000,
      buy_now_price: 1400,
      step_price: 50,
      created_at: fiveHoursAgo,
      end_time: oneWeekLater,
      auto_extend: true,
      review_needed: true,
      allow_unrated_bidder: true,
      description_history: { create: { description: 'Titanium Grey, 512GB, New.' } },
      images: { create: [
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424780257_0.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424780257_1.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424780257_2.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424780257_3.png' },
                        ] },
    },
  });

  // Product 11: Dell XPS 15 (Laptops)
  await prisma.product.create({
    data: {
      name: 'Dell XPS 15',
      seller_id: seller2.user_id,
      category_id: laptopCat.category_id,
      start_price: 1800,
      current_price: 1800,
      buy_now_price: 2500,
      step_price: 100,
      created_at: tenMinutesAgo,
      end_time: threeDay,
      auto_extend: true,
      review_needed: false,
      allow_unrated_bidder: true,
      description_history: { create: { description: 'OLED Display, i9 Processor, 32GB RAM.' } },
      images: { create: [
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424032210_0.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424032211_1.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424032211_2.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424032211_3.png' },
                        ] },
    },
  });

  // Product 12: Samsung Galaxy Tab S9 (Tablets)
  await prisma.product.create({
    data: {
      name: 'Samsung Galaxy Tab S9',
      seller_id: _seller3.user_id,
      category_id: tabletCat.category_id,
      start_price: 700,
      current_price: 700,
      buy_now_price: 900,
      step_price: 20,
      created_at: twoDaysAgo,
      end_time: oneWeekLater,
      auto_extend: true,
      review_needed: true,
      allow_unrated_bidder: false,
      description_history: { create: { description: 'Water resistant, S-Pen included.' } },
      images: { create: [
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424847122_0.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424847122_1.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424847123_2.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424847123_3.png' },
                        ] },
    },
  });

  // Product 13: Rolex Submariner (Watches)
  await prisma.product.create({
    data: {
      name: 'Rolex Submariner Date',
      seller_id: seller1.user_id,
      category_id: watchCat.category_id,
      start_price: 12000,
      current_price: 12000,
      buy_now_price: 15000,
      step_price: 500,
      created_at: fiveHoursAgo,
      end_time: threeDay,
      auto_extend: true,
      review_needed: true,
      allow_unrated_bidder: false,
      description_history: {
        create: { description: 'Authentic, Box and Papers included. Mint condition.' },
      },
      images: { create: [
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424720145_0.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424720145_1.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424720146_2.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424720146_3.png' },
                        ] },
    },
  });

  // Product 14: Adidas Ultraboost (Shoes)
  await prisma.product.create({
    data: {
      name: 'Adidas Ultraboost Light',
      seller_id: _seller3.user_id,
      category_id: shoesCat.category_id,
      start_price: 80,
      current_price: 80,
      buy_now_price: 180,
      step_price: 5,
      created_at: now,
      end_time: oneWeekLater,
      auto_extend: true,
      review_needed: false,
      allow_unrated_bidder: true,
      description_history: { create: { description: 'Running shoes, Cloud White, Size 9.' } },
      images: { create: [
                { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767423947218_0.png' },
                { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767423947227_1.png' },
                { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767423947228_2.png' },
                { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767423947229_3.png' },
              ] },
    },
  });

  // Product 15: Levi\'s Jeans (Clothing)
  await prisma.product.create({
    data: {
      name: "Levi's 501 Original Fit Jeans",
      seller_id: seller1.user_id,
      category_id: clothingCat.category_id,
      start_price: 30,
      current_price: 30,
      buy_now_price: 80,
      step_price: 2,
      created_at: tenMinutesAgo,
      end_time: threeDay,
      auto_extend: false,
      review_needed: false,
      allow_unrated_bidder: true,
      description_history: { create: { description: 'Classic straight leg, blue denim.' } },
      images: { create: [
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424252580_0.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424252581_1.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424252581_2.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424252581_3.png' },
                        ] },
    },
  });

  // Product 16: Vintage T-Shirt (Clothing)
  await prisma.product.create({
    data: {
      name: 'Vintage Rock Band T-Shirt',
      seller_id: _seller3.user_id,
      category_id: clothingCat.category_id,
      start_price: 50,
      current_price: 50,
      buy_now_price: 150,
      step_price: 5,
      created_at: twoDaysAgo,
      end_time: oneWeekLater,
      auto_extend: true,
      review_needed: false,
      allow_unrated_bidder: true,
      description_history: { create: { description: 'Rare 90s concert tee, slight wear.' } },
      images: { create: [
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424970619_0.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424970620_1.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424970620_2.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424970621_3.png' },
                        ] },
    },
  });

  // Product 17: Office Chair (Tables & Chairs)
  await prisma.product.create({
    data: {
      name: 'Ergonomic Office Chair',
      seller_id: seller1.user_id,
      category_id: tableCat.category_id,
      start_price: 150,
      current_price: 150,
      buy_now_price: 300,
      step_price: 10,
      created_at: fiveHoursAgo,
      end_time: threeDay,
      auto_extend: true,
      review_needed: false,
      allow_unrated_bidder: true,
      description_history: { create: { description: 'Mesh back, adjustable lumbar support.' } },
      images: { create: [
                          { image_url: 'productsImg/ac8a2c97-e56a-46a9-adf4-ba7126a5b2c2_1767425338864_0.png' },
                          { image_url: 'productsImg/ac8a2c97-e56a-46a9-adf4-ba7126a5b2c2_1767425338865_1.png' },
                          { image_url: 'productsImg/ac8a2c97-e56a-46a9-adf4-ba7126a5b2c2_1767425338866_2.png' },
                          { image_url: 'productsImg/ac8a2c97-e56a-46a9-adf4-ba7126a5b2c2_1767425338866_3.png' },
                        ] },
    },
  });

  // Product 18: Modern Fabric Sofa (Sofa)
  await prisma.product.create({
    data: {
      name: 'Modern Grey Fabric Sofa',
      seller_id: seller2.user_id,
      category_id: sofaCat.category_id,
      start_price: 400,
      current_price: 400,
      buy_now_price: 900,
      step_price: 20,
      created_at: tenMinutesAgo,
      end_time: oneWeekLater,
      auto_extend: true,
      review_needed: true,
      allow_unrated_bidder: false,
      description_history: { create: { description: 'Minimalist design, comfortable seating.' } },
      images: { create: [
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424568914_0.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424568914_1.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424568915_2.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424568915_3.png' },
                        ] },
    },
  });

  // Product 19: Abstract Oil Painting (Art & Paintings)
  await prisma.product.create({
    data: {
      name: 'Abstract Oil Painting "Sunset"',
      seller_id: seller1.user_id,
      category_id: artCat.category_id,
      start_price: 200,
      current_price: 200,
      buy_now_price: 500,
      step_price: 20,
      created_at: now,
      end_time: oneWeekLater,
      auto_extend: true,
      review_needed: true,
      allow_unrated_bidder: false,
      description_history: {
        create: { description: 'Original artwork, signed by artist. 24x36 inches.' },
      },
      images: { create: [
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424906054_0.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424906054_1.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424906055_2.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424906055_3.png' },
                        ] },
    },
  });

  // Product 20: Digital Art Print (Art & Paintings)
  await prisma.product.create({
    data: {
      name: 'Limited Edition Digital Print',
      seller_id: _seller3.user_id,
      category_id: artCat.category_id,
      start_price: 40,
      current_price: 40,
      buy_now_price: 100,
      step_price: 5,
      created_at: twoDaysAgo,
      end_time: threeDay,
      auto_extend: false,
      review_needed: false,
      allow_unrated_bidder: true,
      description_history: {
        create: { description: 'High quality print on archival paper. Number 5/50.' },
      },
      images: { create: [
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424374539_0.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424374540_1.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424374540_2.png' },
                          { image_url: 'productsImg/38584fc5-b02e-4479-a83d-c4dc19f9351b_1767424374540_3.png' },
                        ] },
    },
  });

  console.log('✅  Created All Products (Covering all categories)');
  console.log(`✅  Created ${createdCategories.length} Categories`);
  console.log('🏁  SEEDING COMPLETED!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
