import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  CLEANING DATABASE (Deleting old data)...')
  
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

  console.log('🌱  SEEDING CONFIGURATIONS (Parallel Execution)...')

  const password = bcrypt.hashSync('Demo1234!', 12); 

  // 2. Create Config
  const configPromise = prisma.auctionConfig.create({
    data: {
      id: 1,
      extend_window_minutes: 5,
      extend_duration_minutes: 10
    }
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
  const categoryPromises = categoriesData.map(cat => 
    prisma.category.create({
      data: { name_level_1: cat.l1, name_level_2: cat.l2 }
    })
  );

  // 4. Create Users (Admin, Bidders, Sellers)
  console.log('👤  SEEDING USERS...')

  // Admin
  const adminPromise = prisma.user.create({
    data: { 
        email: 'admin@system.com', 
        password, 
        name: 'Super Admin', 
        role: UserRole.admin, 
        is_email_verified: true,
        address: '1, Đường Đồng Khởi, Phường Bến Nghé, TP. Hồ Chí Minh' 
    }
  });

  // 2 Default Bidders
  const bidder1Promise = prisma.user.create({
    data: { 
        email: 'bidder1@demo.com', 
        password, 
        name: 'Adam bidder', 
        role: UserRole.bidder, 
        is_email_verified: true,
        address: '123, Đường Nguyễn Trãi, Phường 2, TP. Hồ Chí Minh' 
    }
  });

  const bidder2Promise = prisma.user.create({
    data: { 
        email: 'bidder2@demo.com', 
        password, 
        name: 'Eva bidder', 
        role: UserRole.bidder, 
        is_email_verified: true,
        address: '456, Đường Hai Bà Trưng, Phường Đa Kao, TP. Hồ Chí Minh' 
    }
  });

  // New Bidder: Hạo Nam
  const bidder3Promise = prisma.user.create({
    data: { 
        email: 'namhaohuynh@gmail.com', 
        password, 
        name: 'Hạo Nam', 
        role: UserRole.bidder, 
        is_email_verified: true,
        address: '55, Đường Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh' 
    }
  });

  // 2 Default Sellers
  const seller1Promise = prisma.user.create({
    data: { 
        email: 'seller1@demo.com', 
        password, 
        name: 'Ltp seller', 
        role: UserRole.seller, 
        is_email_verified: true,
        address: '789, Đường Xuân Thủy, Phường Dịch Vọng Hậu, TP. Hà Nội' 
    }
  });

  const seller2Promise = prisma.user.create({
    data: {
        email: 'seller2@demo.com',
        password,
        name: 'Doe seller',
        role: UserRole.seller, 
        is_email_verified: true,
        address: '321, Đường Bạch Đằng, Phường Hải Châu 1, TP. Đà Nẵng' 
    }
  });

  // New Seller: KDDDD
  const seller3Promise = prisma.user.create({
    data: {
        email: 'ntcong@gmail.com',
        password,
        name: 'KDDDD',
        role: UserRole.seller, 
        is_email_verified: true,
        address: '88, Đường Láng, Phường Láng Thượng, Quận Đống Đa, TP. Hà Nội' 
    }
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
    ...categoryPromises 
  ]);

  console.log('✅  Created Config & Users');

  // 5. Create Products
  console.log('📦  SEEDING PRODUCTS...')

  // Helper to find category ID
  const tabletCat = createdCategories.find(c => c.name_level_2 === 'Tablets');
  const watchCat = createdCategories.find(c => c.name_level_2 === 'Watches');
  const clothingCat = createdCategories.find(c => c.name_level_2 === 'Clothing');
  const phoneCat = createdCategories.find(c => c.name_level_2 === 'Smartphones');
  const laptopCat = createdCategories.find(c => c.name_level_2 === 'Laptops');
  const shoesCat = createdCategories.find(c => c.name_level_2 === 'Shoes');
  const tableCat = createdCategories.find(c => c.name_level_2 === 'Tables & Chairs');
  const sofaCat = createdCategories.find(c => c.name_level_2 === 'Sofa');
  const artCat = createdCategories.find(c => c.name_level_2 === 'Art & Paintings');

  if (!tabletCat || !watchCat || !clothingCat || !phoneCat || !laptopCat || !shoesCat || !tableCat || !sofaCat || !artCat) {
      throw new Error("Required Categories not found");
  }

  const now = new Date();
  const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const threeDay = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const minute20 = new Date(now.getTime() + 20 * 60 * 1000);
  const daybefore = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Product 1: iPad Pro (Linked to Seller 1)
  await prisma.product.create({
    data: {
      name: 'iPad Pro',
      seller_id: seller1.user_id, 
      category_id: tabletCat.category_id,
      start_price: 500,
      current_price: 500,
      buy_now_price: 1000,
      step_price: 30,
      created_at: now, // Created just now
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
    }
  });

  // Product 2: Hoodie black (Linked to Seller 2) - Ended Auction
  await prisma.product.create({
    data: {
      name: 'Hoodie black',
      seller_id: seller2.user_id,
      category_id: clothingCat.category_id,
      start_price: 20,
      current_price: 20,
      buy_now_price: 100,
      step_price: 2,
      created_at: new Date(daybefore.getTime() - 3 * 24 * 60 * 60 * 1000), // Created 3 days before it ended
      end_time: daybefore, // Ends in the past
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
          { image_url: 'productsImg/71a0e5bc-870e-4877-9872-4c9da9b46e52_1767346275902_3.png' }
        ],
      },
    }
  });

  // Product 3: Color (Linked to Seller 2)
  await prisma.product.create({
    data: {
      name: 'Color',
      seller_id: seller2.user_id,
      category_id: artCat.category_id,
      start_price: 5,
      current_price: 5,
      buy_now_price: 20,
      step_price: 1,
      created_at: now, // Created just now
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
          { image_url: 'productsImg/85e068c5-659a-4948-9ea1-8dae1993af22_1767346632545_3.png' }
        ],
      },
    }
  });

  await prisma.product.create({
    data: {
      name: 'Samsung watch',
      seller_id: seller2.user_id,
      category_id: watchCat.category_id,
      start_price: 100,
      current_price: 100,
      buy_now_price: 500,
      step_price: 10,
      created_at: now, // Created just now
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
          { image_url: 'productsImg/a83a957a-913b-4ce0-87dc-f9b3e3f02ff2_1767352855371_3.png' }
        ],
      },
    }
  });

  console.log('✅  Created 3 Products');
  console.log(`✅  Created ${createdCategories.length} Categories`);
  console.log('🏁  SEEDING COMPLETED!');
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })