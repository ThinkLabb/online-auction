import { PrismaClient, UserRole, ProductStatus, OrderStatus } from '@prisma/client'
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient()

// --- HELPER FUNCTIONS ---
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

// Rich Sample Data
const SAMPLE_DESCRIPTIONS = [
  "The product is almost new, comes with a 12-month official warranty. Full box with all accessories.",
  "Imported from the US, excellent quality, not a single scratch.",
  "Need quick cash, selling urgently, great price for serious buyers.",
  "Collectible item, high rarity, for professionals only.",
  "Original machine, never repaired, feel free to have a technician inspect it."
];

const SAMPLE_COMMENTS = [
  "Super fast delivery, carefully packaged.",
  "Product is exactly as described, very satisfied.",
  "Shop is enthusiastic, responds to messages quickly.",
  "Nice item, good price, will continue to support.",
  "Excellent, 5 stars for quality!"
];

async function main() {
  console.log('🗑️  CLEANING DATABASE (Deleting old data)...')
  
  // Delete in reverse order to avoid Foreign Key constraints
  await prisma.orderChat.deleteMany()
  await prisma.order.deleteMany()
  await prisma.reviews.deleteMany()
  await prisma.productQandA.deleteMany()
  await prisma.watchlist.deleteMany()
  await prisma.bidHistory.deleteMany()
  await prisma.productImages.deleteMany()
  await prisma.productDescriptionHistory.deleteMany()
  await prisma.deniedBidders.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.sellerUpgradeRequest.deleteMany()
  await prisma.user.deleteMany()

  console.log('🌱  SEEDING STARTED...')

  // -------------------------------------------------------
  // 1. CREATE USERS (20 Users: 1 Admin, 5 Sellers, 15 Bidders)
  // -------------------------------------------------------
  const password = bcrypt.hashSync('Demo1234!', 12); 
  const users = [];

  // Admin
  await prisma.user.create({
    data: { email: 'admin@system.com', password, name: 'System Admin', role: UserRole.admin, is_email_verified: true }
  });

  // Sellers
  const sellers = [];
  for (let i = 1; i <= 5; i++) {
    const s = await prisma.user.create({
      data: { 
        email: `seller${i}@shop.com`, password, name: `Trusted Shop ${i}`, 
        address: `${i} Market Street, HCM`, role: UserRole.seller, is_email_verified: true,
        plus_review: randomInt(10, 100)
      }
    });
    sellers.push(s);
    users.push(s);
  }

  // Bidders
  const bidders = [];
  for (let i = 1; i <= 15; i++) {
    const b = await prisma.user.create({
      data: { 
        email: `bidder${i}@user.com`, password, name: `John Doe Bidder ${i}`, 
        address: `${i} Buyer Lane, Hanoi`, role: UserRole.bidder, is_email_verified: true,
        plus_review: randomInt(0, 20)
      }
    });
    bidders.push(b);
    users.push(b);
  }

  // Create Upgrade Request (3 requests)
  for (let i = 0; i < 3; i++) {
    await prisma.sellerUpgradeRequest.create({
      data: {
        user_id: bidders[i].user_id,
        message: "I want to open a shop to sell handmade goods, please approve, admin.",
        is_approved: false
      }
    });
  }

  // -------------------------------------------------------
  // 2. CREATE CATEGORIES (5 Categories)
  // -------------------------------------------------------
  const categoriesData = [
    { l1: 'Electronics', l2: 'Smartphones' },
    { l1: 'Electronics', l2: 'Laptops' },
    { l1: 'Fashion', l2: 'Watches' },
    { l1: 'Furniture', l2: 'Tables & Chairs' },
    { l1: 'Collectibles', l2: 'Antique Coins' }
  ];
  
  const categories = [];
  for (const cat of categoriesData) {
    categories.push(await prisma.category.create({
      data: { name_level_1: cat.l1, name_level_2: cat.l2 }
    }));
  }

  // -------------------------------------------------------
  // 3. CREATE PRODUCTS (30 Products) & BIDDING LOGIC
  // -------------------------------------------------------
  const productTemplates = [
    { name: 'iPhone 15 Pro Max Titanium', catIdx: 0, basePrice: 1000 },
    { name: 'Samsung Galaxy S24 Ultra', catIdx: 0, basePrice: 900 },
    { name: 'Google Pixel 8 Pro', catIdx: 0, basePrice: 800 },
    { name: 'Xiaomi 14 Ultra', catIdx: 0, basePrice: 700 },
    { name: 'MacBook Pro M3 Max', catIdx: 1, basePrice: 2000 },
    { name: 'Dell XPS 15 2024', catIdx: 1, basePrice: 1500 },
    { name: 'ThinkPad X1 Carbon', catIdx: 1, basePrice: 1400 },
    { name: 'Asus ROG Zephyrus', catIdx: 1, basePrice: 1600 },
    { name: 'Rolex Submariner Date', catIdx: 2, basePrice: 8000 },
    { name: 'Omega Speedmaster', catIdx: 2, basePrice: 5000 },
    { name: 'Seiko 5 Sport', catIdx: 2, basePrice: 200 },
    { name: 'Casio G-Shock Limited', catIdx: 2, basePrice: 150 },
    { name: 'Italian Leather Sofa', catIdx: 3, basePrice: 1000 },
    { name: 'Oak Wood Desk', catIdx: 3, basePrice: 300 },
    { name: 'Smart Night Lamp', catIdx: 3, basePrice: 50 },
    { name: 'Herman Miller Ergonomic Chair', catIdx: 3, basePrice: 1200 },
    { name: 'Indochina Coin 1900', catIdx: 4, basePrice: 100 },
    { name: 'D.R. Vietnam Antique Stamp', catIdx: 4, basePrice: 50 },
    { name: 'Chu Dau Ceramic Vase', catIdx: 4, basePrice: 500 },
    { name: 'Old Quarter Oil Painting', catIdx: 4, basePrice: 300 }
  ];

  // Duplicate the list to ensure 30+ products
  const allProductsData = [...productTemplates, ...productTemplates.slice(0, 10)];

  const products = [];

  for (let i = 0; i < allProductsData.length; i++) {
    const template = allProductsData[i];
    const seller = randomElement(sellers);
    const category = categories[template.catIdx];
    
    // Status: First 10 are SOLD, the rest are OPEN
    const isSold = i < 10;
    const status = isSold ? ProductStatus.sold : ProductStatus.open;
    
    // --- TIME LOGIC FIX ---
    let createdTime = new Date();
    let endTime = new Date();

    if (isSold) {
        // PAST: Created 20 days ago, Ended 13 days ago
        createdTime.setDate(createdTime.getDate() - 20);
        endTime = new Date(createdTime);
        endTime.setDate(endTime.getDate() + 7);
    } else {
        // FUTURE: Created 1 day ago, Ends in 3 to 10 days from NOW
        createdTime.setDate(createdTime.getDate() - 1); 
        endTime = new Date(); // Reset to now
        endTime.setDate(endTime.getDate() + randomInt(3, 10)); // Ends in the future
    }

    const startPrice = template.basePrice;
    const stepPrice = template.basePrice * 0.05; // 5% bid step

    // Create Product Base
    const product = await prisma.product.create({
      data: {
        seller_id: seller.user_id,
        category_id: category.category_id,
        name: `${template.name} #${i + 1}`,
        status: status,
        start_price: startPrice,
        step_price: stepPrice,
        current_price: startPrice,
        buy_now_price: startPrice * 2.5,
        created_at: createdTime,
        end_time: endTime,
        auto_extend: true,
        images: {
          create: [
            { image_url: `https://placehold.co/600x400?text=${encodeURIComponent(template.name)}` },
            { image_url: `https://placehold.co/600x400/333/fff?text=Detail+View` }
          ]
        },
        description_history: {
          create: {
            description: randomElement(SAMPLE_DESCRIPTIONS),
            added_at: createdTime
          }
        },
        q_and_a: {
            create: Array.from({ length: randomInt(0, 2) }).map(() => ({
                questioner_id: randomElement(bidders).user_id,
                question_text: "Can the price of this product be negotiated, shop?",
                question_time: new Date(createdTime.getTime() + 100000),
                answer_text: "No, the price is publicly auctioned and non-negotiable.",
                answer_time: new Date(createdTime.getTime() + 200000),
            }))
        }
      }
    });

    // --- GENERATE BIDS (6-15 bids) ---
    let currentPrice = startPrice;
    let highestBidderId = null;
    const bidCount = randomInt(6, 15);
    const shuffledBidders = [...bidders].sort(() => 0.5 - Math.random());

    for (let k = 0; k < bidCount; k++) {
      const bidder = shuffledBidders[k % shuffledBidders.length];
      
      const increment = stepPrice + randomInt(1, 50);
      const bidAmount = currentPrice + increment;
      
      // Calculate bid time relative to creation, but ensure it's not in the future for "Open" items
      // (Unless we want to simulate a very active live auction, but safer to keep bids in the past/present)
      let bidTime = new Date(createdTime.getTime() + (k * 3600000) + randomInt(0, 300000));
      
      // If calculated bidTime is in the future (for open items), cap it to "now"
      if (bidTime > new Date()) {
          bidTime = new Date(); 
      }

      await prisma.bidHistory.create({
        data: {
            product_id: product.product_id,
            bidder_id: bidder.user_id,
            bid_amount: bidAmount,
            bid_time: bidTime
        }
      });

      currentPrice = bidAmount;
      highestBidderId = bidder.user_id;
    }

    // Update Product with final price
    const updatedProduct = await prisma.product.update({
        where: { product_id: product.product_id },
        data: {
            current_price: currentPrice,
            current_highest_bidder_id: highestBidderId,
            bid_count: bidCount
        }
    });
    
    products.push(updatedProduct);

    // --- WATCHLIST & DENIED BIDDERS ---
    const watchers = shuffledBidders.slice(0, randomInt(3, 5));
    for (const watcher of watchers) {
        await prisma.watchlist.create({
            data: { user_id: watcher.user_id, product_id: product.product_id }
        });
    }

    if (randomInt(1, 10) > 8) {
        await prisma.deniedBidders.create({
            data: { product_id: product.product_id, bidder_id: shuffledBidders[shuffledBidders.length - 1].user_id }
        });
    }
  }

  // -------------------------------------------------------
  // 4. CREATE ORDERS (Only for SOLD products)
  // -------------------------------------------------------
  const soldProducts = products.filter(p => p.status === ProductStatus.sold);
  
  console.log(`Creating Orders for ${soldProducts.length} sold items...`);

  for (const p of soldProducts) {
    if (!p.current_highest_bidder_id) continue;

    const order = await prisma.order.create({
        data: {
            product_id: p.product_id,
            buyer_id: p.current_highest_bidder_id,
            seller_id: p.seller_id,
            final_price: p.current_price,
            status: OrderStatus.completed,
            shipping_address: "123 Delivery Road, District 1, HCMC",
            buyer_confirmed_receipt: true,
            created_at: p.end_time,
        }
    });

    const buyerReview = await prisma.reviews.create({
        data: {
            product_id: p.product_id,
            reviewer_id: p.current_highest_bidder_id,
            reviewee_id: p.seller_id,
            is_positive: true,
            comment: randomElement(SAMPLE_COMMENTS),
            order_as_buyer_review: { connect: { order_id: order.order_id } }
        }
    });

    const sellerReview = await prisma.reviews.create({
        data: {
            product_id: p.product_id,
            reviewer_id: p.seller_id,
            reviewee_id: p.current_highest_bidder_id,
            is_positive: true,
            comment: "Customer paid quickly, very trustworthy.",
            order_as_seller_review: { connect: { order_id: order.order_id } }
        }
    });

    await prisma.order.update({
        where: { order_id: order.order_id },
        data: {
            buyer_review_id: buyerReview.review_id,
            seller_review_id: sellerReview.review_id
        }
    });

    await prisma.orderChat.createMany({
        data: [
            { order_id: order.order_id, sender_id: p.current_highest_bidder_id, message_text: "Hello shop, when will the item be shipped?", sent_at: new Date(p.end_time.getTime() + 100000) },
            { order_id: order.order_id, sender_id: p.seller_id, message_text: "Hello, I just handed it over to the shipping company!", sent_at: new Date(p.end_time.getTime() + 200000) },
            { order_id: order.order_id, sender_id: p.current_highest_bidder_id, message_text: "Thank you, shop!", sent_at: new Date(p.end_time.getTime() + 300000) },
        ]
    });
  }

  console.log('✅  SEEDING COMPLETED!');
  console.log(`   - Users created: ${users.length + 1}`);
  console.log(`   - Products created: ${products.length}`);
  console.log(`   - Orders created: ${soldProducts.length}`);
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })