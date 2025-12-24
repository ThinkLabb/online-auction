import { PrismaClient, UserRole, ProductStatus, OrderStatus } from '@prisma/client'
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient()

// --- HELPER FUNCTIONS ---
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const randomBoolean = () => Math.random() < 0.5;

// Rich Sample Data
const SAMPLE_DESCRIPTIONS = [
  "The product is almost new, comes with a 12-month official warranty. Full box with all accessories.",
  "Imported from the US, excellent quality, not a single scratch.",
  "Need quick cash, selling urgently, great price for serious buyers.",
  "Collectible item, high rarity, for professionals only.",
  "Original machine, never repaired, feel free to have a technician inspect it."
];

async function main() {
  console.log('🗑️  CLEANING DATABASE (Deleting old data)...')
  
  // Clean sequentially to avoid FK constraints
  const deleteOrder = [
    prisma.orderChat.deleteMany(),
    prisma.order.deleteMany(),
    prisma.reviews.deleteMany(),
    prisma.productQandA.deleteMany(),
    prisma.watchlist.deleteMany(),
    prisma.bidHistory.deleteMany(),
    prisma.productImages.deleteMany(),
    prisma.productDescriptionHistory.deleteMany(),
    prisma.deniedBidders.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.sellerUpgradeRequest.deleteMany(),
    prisma.user.deleteMany(),
    prisma.auctionConfig.deleteMany(),
  ];

  // Execute deletes sequentially to be safe, or Promise.all if cascade is perfect. 
  // Keeping sequential here prevents "Foreign key constraint failed" during cleanup.
  for (const action of deleteOrder) {
    await action;
  }

  console.log('🌱  SEEDING STARTED...')

  // -------------------------------------------------------
  // 0. CREATE AUCTION CONFIG
  // -------------------------------------------------------
  await prisma.auctionConfig.create({
    data: {
      id: 1,
      extend_window_minutes: 5,
      extend_duration_minutes: 10
    }
  });

  // -------------------------------------------------------
  // 1. CREATE USERS (Parallel)
  // -------------------------------------------------------
  const password = bcrypt.hashSync('Demo1234!', 12); 
  
  // Prepare Admin
  const adminPromise = prisma.user.create({
    data: { email: 'admin@system.com', password, name: 'System Admin', role: UserRole.admin, is_email_verified: true }
  });

  // Prepare Sellers
  const sellerPromises = Array.from({ length: 5 }).map((_, i) => 
    prisma.user.create({
      data: { 
        email: `seller${i + 1}@shop.com`, password, name: `Trusted Shop ${i + 1}`, 
        address: `${i + 1} Market Street, HCM`, role: UserRole.seller, is_email_verified: true,
        plus_review: randomInt(10, 100)
      }
    })
  );

  // Prepare Bidders
  const bidderPromises = Array.from({ length: 15 }).map((_, i) => 
    prisma.user.create({
      data: { 
        email: `bidder${i + 1}@user.com`, password, name: `John Doe Bidder ${i + 1}`, 
        address: `${i + 1} Buyer Lane, Hanoi`, role: UserRole.bidder, is_email_verified: true,
        plus_review: randomInt(0, 20)
      }
    })
  );

  // Execute User Creation in Parallel
  const [admin, ...restUsers] = await Promise.all([adminPromise, ...sellerPromises, ...bidderPromises]);
  
  // Split back into groups
  const sellers = restUsers.slice(0, 5);
  const bidders = restUsers.slice(5);

  // Create Upgrade Requests (Parallel)
  const upgradePromises = bidders.slice(0, 3).map(bidder => 
    prisma.sellerUpgradeRequest.create({
      data: {
        user_id: bidder.user_id,
        message: "I want to open a shop to sell handmade goods, please approve, admin.",
        is_approved: false
      }
    })
  );
  await Promise.all(upgradePromises);

  // -------------------------------------------------------
  // 2. CREATE CATEGORIES (Parallel)
  // -------------------------------------------------------
  const categoriesData = [
    { l1: 'Electronics', l2: 'Smartphones' },
    { l1: 'Electronics', l2: 'Laptops' },
    { l1: 'Fashion', l2: 'Watches' },
    { l1: 'Furniture', l2: 'Tables & Chairs' },
    { l1: 'Collectibles', l2: 'Antique Coins' }
  ];
  
  const categories = await Promise.all(
    categoriesData.map(cat => prisma.category.create({
      data: { name_level_1: cat.l1, name_level_2: cat.l2 }
    }))
  );

  // -------------------------------------------------------
  // 3. CREATE PRODUCTS (Parallel)
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

  // Duplicate to get 30+ items
  const allProductsData = [...productTemplates, ...productTemplates.slice(0, 10)];

  // Define the logic for a SINGLE product creation flow
  const createProductFlow = async (template: any, i: number) => {
    const seller = randomElement(sellers);
    const category = categories[template.catIdx];
    
    const isSold = i < 10;
    const status = isSold ? ProductStatus.sold : ProductStatus.open;
    
    let createdTime = new Date();
    let endTime = new Date();

    if (isSold) {
        createdTime.setDate(createdTime.getDate() - 20);
        endTime = new Date(createdTime);
        endTime.setDate(endTime.getDate() + 7);
    } else {
        createdTime.setDate(createdTime.getDate() - 1); 
        endTime = new Date(); 
        endTime.setDate(endTime.getDate() + randomInt(3, 10)); 
    }

    const startPrice = template.basePrice;
    const stepPrice = template.basePrice * 0.05;

    // 1. Create Product
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
        review_needed: randomBoolean(),
        allow_unrated_bidder: randomInt(1, 10) > 2, // 80% chance to allow unrated
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
                question_text: "Can the price of this product be negotiated?",
                question_time: new Date(createdTime.getTime() + 100000),
                answer_text: "No, the price is publicly auctioned.",
                answer_time: new Date(createdTime.getTime() + 200000),
            }))
        }
      }
    });

    // 2. Generate Bids (Sequential per product, but parallel across products)
    let currentPrice = startPrice;
    let highestBidderId = null;
    const bidCount = randomInt(6, 15);
    const shuffledBidders = [...bidders].sort(() => 0.5 - Math.random());

    for (let k = 0; k < bidCount; k++) {
      const bidder = shuffledBidders[k % shuffledBidders.length];
      const increment = stepPrice + randomInt(1, 50);
      const bidAmount = Number(currentPrice) + increment; // Ensure number addition
      
      let bidTime = new Date(createdTime.getTime() + (k * 3600000) + randomInt(0, 300000));
      if (bidTime > new Date()) bidTime = new Date(); 

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

    // 3. Update Product with final state
    const updatedProduct = await prisma.product.update({
        where: { product_id: product.product_id },
        data: {
            current_price: currentPrice,
            current_highest_bidder_id: highestBidderId,
            bid_count: bidCount
        }
    });

    // 4. Create Watchlist & Denied (Parallel internal)
    const watchlistPromises = shuffledBidders.slice(0, randomInt(3, 5)).map(watcher => 
        prisma.watchlist.create({
            data: { user_id: watcher.user_id, product_id: product.product_id }
        })
    );
    await Promise.all(watchlistPromises);

    if (randomInt(1, 10) > 8) {
        await prisma.deniedBidders.create({
            data: { product_id: product.product_id, bidder_id: shuffledBidders[shuffledBidders.length - 1].user_id }
        });
    }

    return updatedProduct;
  };

  // EXECUTE ALL PRODUCT CREATIONS IN PARALLEL
  const products = await Promise.all(
    allProductsData.map((template, i) => createProductFlow(template, i))
  );

  // -------------------------------------------------------
  // 4. CREATE ORDERS (Parallel)
  // -------------------------------------------------------
  const soldProducts = products.filter(p => p.status === ProductStatus.sold);
  console.log(`Creating Orders for ${soldProducts.length} sold items...`);

  const orderPromises = soldProducts.map(async (p) => {
    if (!p.current_highest_bidder_id) return;

    const order = await prisma.order.create({
        data: {
            product_id: p.product_id,
            buyer_id: p.current_highest_bidder_id,
            seller_id: p.seller_id,
            final_price: p.current_price,
            status: OrderStatus.pending_payment, 
            shipping_address: null,             
            buyer_confirmed_receipt: false,     
            seller_review_id: null,             
            buyer_review_id: null,              
            created_at: new Date(),             
        }
    });

    // Create Chat messages in parallel
    await prisma.orderChat.createMany({
        data: [
            { order_id: order.order_id, sender_id: p.current_highest_bidder_id, message_text: "When will the item be shipped?", sent_at: new Date(p.end_time.getTime() + 100000) },
            { order_id: order.order_id, sender_id: p.seller_id, message_text: "Handed over to shipping!", sent_at: new Date(p.end_time.getTime() + 200000) },
            { order_id: order.order_id, sender_id: p.current_highest_bidder_id, message_text: "Thanks!", sent_at: new Date(p.end_time.getTime() + 300000) },
        ]
    });
  });

  await Promise.all(orderPromises);

  console.log('✅  SEEDING COMPLETED!');
  console.log(`   - Users created: ${admin ? 21 : 0}`);
  console.log(`   - Products created: ${products.length}`);
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })