// import { PrismaClient } from '@prisma/client';
// import * as bcrypt from 'bcryptjs';

// const prisma = new PrismaClient();

// // Helper để băm mật khẩu
// async function hashPassword(password: string) {
//   return bcrypt.hash(password, 10);
// }

// async function main() {
//   console.log(`Start seeding ...`);

//   // --- 1. Tạo Categories ---
//   console.log('Seeding categories...');
//   const cat1 = await prisma.category.upsert({
//     where: { name_level_1_name_level_2: { name_level_1: 'Electronics', name_level_2: 'Phones' } },
//     update: {},
//     create: { name_level_1: 'Electronics', name_level_2: 'Phones' },
//   });

//   const cat2 = await prisma.category.upsert({
//     where: { name_level_1_name_level_2: { name_level_1: 'Electronics', name_level_2: 'Laptops' } },
//     update: {},
//     create: { name_level_1: 'Electronics', name_level_2: 'Laptops' },
//   });

//   const cat3 = await prisma.category.upsert({
//     where: { name_level_1_name_level_2: { name_level_1: 'Fashion', name_level_2: 'Watches' } },
//     update: {},
//     create: { name_level_1: 'Fashion', name_level_2: 'Watches' },
//   });

//   // --- 2. Tạo Users (Sellers) ---
//   console.log('Seeding users...');
//   const hashedPassword = await hashPassword('password123'); // Mật khẩu chung cho tất cả user mẫu

//   const seller1 = await prisma.user.upsert({
//     where: { email: 'seller1@example.com' },
//     update: {},
//     create: {
//       email: 'seller1@example.com',
//       name: 'John Doe',
//       password: hashedPassword,
//       role: 'seller', // Đặt làm seller luôn
//       is_email_verified: true,
//     },
//   });

//   const seller2 = await prisma.user.upsert({
//     where: { email: 'seller2@example.com' },
//     update: {},
//     create: {
//       email: 'seller2@example.com',
//       name: 'Jane Smith',
//       password: hashedPassword,
//       role: 'seller',
//       is_email_verified: true,
//     },
//   });

//   // --- 3. Tạo 5 Products (cùng với Images và Description) ---
//   console.log('Seeding 5 products...');

//   // Product 1
//   await prisma.product.create({
//     data: {
//       name: 'Vintage Rolex Watch',
//       seller_id: seller1.user_id,
//       category_id: cat3.category_id,
//       start_price: 1500.00,
//       buy_now_price: 3000.00,
//       step_price: 50.00,
//       current_price: 1500.00,
//       end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 ngày nữa
//       description_history: {
//         create: {
//           description: 'A beautiful vintage Rolex from the 1980s. Good condition.',
//         },
//       },
//       images: {
//         create: { image_url: 'thinkpad.webp' }, // <-- ĐÃ THAY ĐỔI
//       },
//     },
//   });

//   // Product 2
//   await prisma.product.create({
//     data: {
//       name: 'Used MacBook Pro 14"',
//       seller_id: seller2.user_id,
//       category_id: cat2.category_id,
//       start_price: 800.00,
//       buy_now_price: 1200.00,
//       step_price: 25.00,
//       current_price: 800.00,
//       end_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 ngày nữa
//       description_history: {
//         create: {
//           description: 'MacBook Pro 14-inch, M1 Pro chip. Minor scratches on the bottom.',
//         },
//       },
//       images: {
//         create: { image_url: 'thinkpad.webp' }, // <-- ĐÃ THAY ĐỔI
//       },
//     },
//   });

//   // Product 3
//   await prisma.product.create({
//     data: {
//       name: 'iPhone 13 Pro - 256GB',
//       seller_id: seller1.user_id,
//       category_id: cat1.category_id,
//       start_price: 450.00,
//       step_price: 10.00,
//       current_price: 450.00,
//       end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 ngày nữa
//       description_history: {
//         create: {
//           description: 'iPhone 13 Pro, 256GB, Sierra Blue. Battery health 90%.',
//         },
//       },
//       images: {
//         create: { image_url: 'thinkpad.webp' }, // <-- ĐÃ THAY ĐỔI
//       },
//     },
//   });

//   // Product 4
//   await prisma.product.create({
//     data: {
//       name: 'Dell XPS 15 Laptop',
//       seller_id: seller2.user_id,
//       category_id: cat2.category_id,
//       start_price: 700.00,
//       buy_now_price: 1000.00,
//       step_price: 20.00,
//       current_price: 700.00,
//       end_time: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 ngày nữa
//       description_history: {
//         create: {
//           description: 'Dell XPS 15 (9510), Core i7, 16GB RAM, 1TB SSD. Excellent condition.',
//         },
//       },
//       images: {
//         create: { image_url: 'thinkpad.webp' }, // <-- ĐÃ THAY ĐỔI
//       },
//     },
//   });

//   // Product 5
//   await prisma.product.create({
//     data: {
//       name: 'Samsung Galaxy S22',
//       seller_id: seller1.user_id,
//       category_id: cat1.category_id,
//       start_price: 300.00,
//       buy_now_price: 500.00,
//       step_price: 10.00,
//       current_price: 300.00,
//       end_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 ngày nữa
//       description_history: {
//         create: {
//           description: 'Samsung S22, 128GB, Phantom Black. Unlocked.',
//         },
//       },
//       images: {
//         create: { image_url: 'thinkpad.webp' }, // <-- ĐÃ THAY ĐỔI
//       },
//     },
//   });

//   console.log('Finished seeding products.');
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     console.log(`Seeding finished.`);
//     await prisma.$disconnect();
//   });


import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// --- Cấu hình dữ liệu mẫu ---
const PASSWORD_RAW = 'Password@123'; // Thỏa mãn regex: Hoa, thường, số, ký tự đặc biệt
const NAMES_POOL = [
  'Alex', 'John', 'Dung', 'Hung', 'Lisa', 'Kate', 'Bao', 'Tuan',
  'Minh', 'Vy', 'Dat', 'Son', 'Nhi', 'Khoa', 'Lam', 'Ha'
]; // Tên 3-8 ký tự

// Danh mục mẫu
const CATEGORIES = [
  { l1: 'Electronics', l2: 'Laptops' },
  { l1: 'Electronics', l2: 'Smartphones' },
  { l1: 'Fashion', l2: 'Watches' },
  { l1: 'Fashion', l2: 'Sneakers' },
  { l1: 'Collectibles', l2: 'Coins' },
];

// Helper: Random số trong khoảng
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
// Helper: Lấy phần tử ngẫu nhiên từ mảng
const randomElem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  console.log('🚀 Start seeding...');

  // 1. Dọn dẹp dữ liệu cũ (Xóa theo thứ tự để tránh lỗi khóa ngoại)
  console.log('🗑️ Cleaning old data...');
  await prisma.orderChat.deleteMany();
  await prisma.order.deleteMany();
  await prisma.deniedBidders.deleteMany();
  await prisma.reviews.deleteMany();
  await prisma.productQandA.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.bidHistory.deleteMany();
  await prisma.productDescriptionHistory.deleteMany();
  await prisma.productImages.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 2. Tạo Categories
  console.log('📦 Seeding Categories...');
  const createdCategories = [];
  for (const cat of CATEGORIES) {
    const c = await prisma.category.create({
      data: { name_level_1: cat.l1, name_level_2: cat.l2 },
    });
    createdCategories.push(c);
  }

  // 3. Tạo Users (Admin, Seller, Bidder)
  console.log('bust👥 Seeding Users...');
  const hashedPassword = await bcrypt.hash(PASSWORD_RAW, 10);
  
  // Tạo 1 Admin
  await prisma.user.create({
    data: {
      email: 'admin@fpt.edu.vn',
      password: hashedPassword,
      name: 'Admin',
      role: 'admin',
      is_email_verified: true,
      address: 'Hanoi, Vietnam',
    },
  });

  // Tạo 5 Sellers
  const sellers = [];
  for (let i = 1; i <= 5; i++) {
    const s = await prisma.user.create({
      data: {
        email: `seller${i}@example.com`,
        password: hashedPassword,
        name: `Sell${i}`, // 5 chars
        role: 'seller', // Enum UserRole
        is_email_verified: true,
        address: 'Ho Chi Minh City',
      },
    });
    sellers.push(s);
  }

  // Tạo 15 Bidders (Để đảm bảo đủ người bid cho products)
  const bidders = [];
  for (let i = 0; i < 15; i++) {
    const name = NAMES_POOL[i] || `User${i}`;
    const b = await prisma.user.create({
      data: {
        email: `bidder${i}@example.com`,
        password: hashedPassword,
        name: name,
        role: 'bidder',
        is_email_verified: true,
        address: 'Danang, Vietnam',
      },
    });
    bidders.push(b);
  }

  // 4. Tạo Products & Bids
  console.log('🛍️ Seeding Products & Bids...');
  
  // Danh sách tên sản phẩm mẫu theo index để loop
  const productNames = [
    'MacBook Pro M1', 'iPhone 15 Pro', 'Rolex Submariner', 'Nike Air Jordan', 'Ancient Gold Coin',
    'Dell XPS 15', 'Samsung S24 Ultra', 'Omega Seamaster', 'Adidas Yeezy', 'Silver Dollar 1900',
    'ThinkPad X1 Carbon', 'Google Pixel 8', 'Casio G-Shock', 'Puma Running', 'Bronze Statue',
    'Asus ROG Strix', 'Xiaomi 14', 'Seiko 5 Sport', 'New Balance 550', 'Vintage Stamp'
  ];

  for (let i = 0; i < 20; i++) {
    const seller = randomElem(sellers);
    const category = randomElem(createdCategories);
    const startPrice = randomInt(100, 2000); // Giá khởi điểm ngẫu nhiên
    const stepPrice = randomInt(10, 50);     // Bước giá
    const buyNowPrice = startPrice * 2;
    
    // Tạo Product trước (Status: Open)
    const product = await prisma.product.create({
      data: {
        name: productNames[i],
        seller_id: seller.user_id,
        category_id: category.category_id,
        start_price: startPrice,
        buy_now_price: buyNowPrice,
        step_price: stepPrice,
        current_price: startPrice, // Sẽ update sau khi bid
        status: 'open', // Enum ProductStatus
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Kết thúc sau 7 ngày
        description_history: {
          create: {
            description: `This is a generic description for ${productNames[i]}. High quality, authentic item.`,
          },
        },
        images: {
          create: [
            { image_url: 'https://1.bp.blogspot.com/-eg0ABkVxizM/YFw9RNI_vTI/AAAAAAAAAZc/SnRChGiPbWskUrB29jYpfULnR_F8opc1wCLcBGAsYHQ/w1600/71tCSEJgUgL._SL1500_.jpg' },
            { image_url: 'https://ds393qgzrxwzn.cloudfront.net/resize/m720x480/cat1/img/images/0/Vt2qxDlUyE.jpg' },
          ],
        },
      },
    });

    // --- Giả lập lịch sử đấu giá (5 lượt) ---
    // Chọn ngẫu nhiên 5 bidder khác nhau từ danh sách bidder
    const shuffledBidders = [...bidders].sort(() => 0.5 - Math.random());
    const selectedBidders = shuffledBidders.slice(0, 5);
    
    let currentBidPrice = startPrice;
    let lastBidderId = null;

    // Tạo bid từ thấp đến cao
    for (let j = 0; j < 5; j++) {
      // Mỗi lần bid tăng giá lên 1 khoảng ngẫu nhiên (ít nhất là bằng step_price)
      const jump = stepPrice + randomInt(0, 50); 
      currentBidPrice += jump;
      lastBidderId = selectedBidders[j].user_id;

      // Thời gian bid cách nhau vài tiếng
      const bidTime = new Date();
      bidTime.setHours(bidTime.getHours() - (5 - j)); // Lùi lại vài giờ

      await prisma.bidHistory.create({
        data: {
          product_id: product.product_id,
          bidder_id: selectedBidders[j].user_id,
          bid_amount: currentBidPrice,
          bid_time: bidTime,
        },
      });
    }

    // Cập nhật lại thông tin Product sau khi có người bid
    // Phải update: current_price, current_highest_bidder_id, bid_count
    if (lastBidderId) {
      await prisma.product.update({
        where: { product_id: product.product_id },
        data: {
          current_price: currentBidPrice,
          current_highest_bidder_id: lastBidderId,
          bid_count: 5,
        },
      });
    }
    
    console.log(`   -> Created product: ${product.name} with 5 bids (Final Price: ${currentBidPrice})`);
  }

  console.log('✅ Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });