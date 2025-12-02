export type ProfileData = {
  name: string;
  email: string;
  address: string;
  birthdate: Date;
  role: string;
  created_at: string;
  total_bids: number;
  bids_this_week: number;
  total_wins: number;
  win_rate: number;
  watchlist_count: number;
  rating: number;
  rating_label: string;
  bidding_products: any,
  won_products: any,
  watchlist: any,
  ratings: any
}

export type SetTab = (tab: "bidding" | "won-products" | "watchlist" | "ratings") => void;
export type SetAction = (action: "view-tabs" | "edit-profile" | "change-password") => void;
