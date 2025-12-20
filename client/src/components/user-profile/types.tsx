import { ProductStatus, OrderStatus } from '@prisma/client';

type BiddingProduct = {
  product_id: number;
  name: string;
  image_url: string;
  status: ProductStatus;
  max_bid: number;
  buy_now_price?: number;
  current_price: number;
  bid_count: number;
  end_time: string;

  seller_name: string;
  category_name: string;
  current_highest_bidder_name?: string;
};

type WonProduct = {
  product_id: number;
  name: string;
  image_url: string;
  final_price: number;
  won_at: string;
  order_status: OrderStatus;
  seller_name: string;
  category_name: string;
  can_review: boolean;
  order_id: number;
};

type WatchlistItem = {
  product_id: number;
  name: string;
  image_url: string;
  current_highest_bidder_name: string | null;
  current_price: number;
  buy_now_price?: number;
  bid_count: number;
  end_time: string;
  seller_name: string;
  category_name: string;
};

type ReviewReceived = {
  review_id: number;
  reviewer_name: string;
  is_positive: boolean;
  comment: string | null;
  created_at: string;
  product_name: string;
  product_id: number;
};

export type ProductItem = {
  product_id: string;
  product_name: string;
  image_url: string;
  category_name: string;

  start_price: number;
  current_price: number;
  buy_now_price?: number;

  bid_count: number;
  created_at: string;
  end_time: string;

  highest_bidder_name?: string;
};

export type ProfileData = {
  name: string;
  email: string;
  address: string;
  birthdate: string;
  role: string;
  created_at: string;
  total_bids: number;
  bids_this_week: number;
  total_wins: number;
  win_rate: number;
  watchlist_count: number;
  rating: number;
  rating_label: string;
  bidding_products: Array<BiddingProduct>;
  won_products: Array<WonProduct>;
  watchlist: Array<WatchlistItem>;
  ratings: Array<ReviewReceived>;
};

export type SetTab = (tab: 'bidding' | 'won-products' | 'watchlist' | 'ratings') => void;
export type SetAction = (action: 'view-tabs' | 'edit-profile' | 'change-password') => void;
