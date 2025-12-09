// types.ts

export interface ProductSeller {
  name: string;
  rating: number;
  reviews: number;
}

export interface DescriptionItem {
  text: string;
  date: string;
}

export interface ProductQA {
  question: string;
  asker: string;
  answer: string | null;
  responder: string | null;
  time: string;
}

export interface ProductDetails {
  brand: string;
  year?: string;
  condition?: string;
  engine: string;
  frameMaterial?: string;
  color?: string;
  performance?: string;
  exhaust?: string;
}

export interface Product {
  id: string;
  title: string;
  postedDate: string;
  endsIn: string;
  currentBid: number;
  bidsPlaced: number;
  buyNowPrice: number;
  minBidStep: number;
  images: string[];
  details: ProductDetails;
  description: DescriptionItem[];
  conditionText: string;
  seller: ProductSeller;
  topBidder: ProductSeller;
  qa: ProductQA[];
  isSeller: boolean;
}

// Used in the BidHistory component
export interface BidHistoryItem {
  id: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  time: string;
}