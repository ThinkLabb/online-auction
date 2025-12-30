import { ProductStatus, OrderStatus, UserRole } from '@prisma/client';

export interface Profile {
  role: UserRole;
  email: string;
  name: string;
  address: string | null;
  birthdate: string | null;
  created_at: string;
  plus_review: number;
  minus_review: number;
  // total_bids: number;
  // bids_this_week: number;
  // total_wins: number;
  // win_rate: number;
  // watchlist_count: number;
  // rating: number;
  // rating_label: string;
};

export interface ProductCard {
  product_id: string; 
  name: string;
  thumbnail_url: string;

  category: {
    category_id: string;
    category_name_level_1: string;
    category_name_level_2: string;
  };

  current_price: number; // giá cuối cùng đối với sản phẩm đã bán
  bid_count: number;
  end_time: string;
}

export interface UserProduct extends ProductCard {
  seller: {
    user_id: string;
    name: string;
  }
}

export interface FollowingProduct extends UserProduct {
  status: ProductStatus;
  buy_now_price: number;
  current_highest_bidder: {
    user_id: string;
    name: string;
  } | null;
  reviews_count: number;
}

export interface BiddingProduct extends FollowingProduct {
  bid_at: string;
  bid_amount: number;
}

export interface BiddingProducts {
  products: BiddingProduct[];
}

export interface WatchlistProducts {
  products: FollowingProduct[];
}

export interface WonProduct extends UserProduct {
  order: {
    order_id: string;
    final_price: number;
    status: OrderStatus;
    created_at: string;
  };
  review_needed: boolean;
  review: {
    review_id: string;
    is_positive: boolean;
    comment: string | null;
    created_at: string;
  } | null;
}

export interface WonProducts {
  products: WonProduct[];
}

export interface SellingProduct extends ProductCard {
  start_price: number;
  buy_now_price: number;

  highest_bidder: {
    user_id: string;
    name: string;
  } | null;

  created_at: string,
  auto_extend: boolean;
  editable: boolean; // True nếu chưa có ai bid
  reviews_count: number;
}

export interface SellingProducts {
  products: SellingProduct[];
}

export interface SoldProduct extends ProductCard {
  order: {
    order_id: string;
    order_status: OrderStatus;
    created_at: string;
    updated_at: string;

    buyer: {
      user_id: string;
      name: string;
    };

    my_review: {
      review_id: string;
      is_positive: boolean;
      comment: string | null;
      created_at: string;
    } | null;
  } | null;

  can_cancel: boolean;
}

export interface SoldProducts {
  products: SoldProduct[];
}

export interface Review {
  review_id: string;
  reviewer: {
    user_id: string;
    name: string;
  }
  
  product: {
    product_id: string;
    product_name: string;
    category: {
      category_id: string;
      category_name_level_1: string;
      category_name_level_2: string;
    };
    thumbnail_url: string;
  }

  is_positive: boolean;
  comment: string | null;
  created_at: string;
}

export interface Reviews {
  reviews: Review[];
}

export type SetTab = (tab: 'bidding' | 'won-products' | 'watchlist' | 'ratings') => void;
export type SetAction = (action: 'view-tabs' | 'edit-profile' | 'change-password') => void;
