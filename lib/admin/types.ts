export type OrderStatus = "New" | "Packed" | "Delivered" | "Cancelled";

export type PayMethod = "UPI" | "Card" | "NetBanking" | "Wallet" | "Other";

export type PaymentStatus = "pending" | "captured" | "refunded" | "partial_refund";

export interface AdminProduct {
  id: string;
  name: string;
  sku: string;
  /** Whole INR. null while the product is still a draft without a price. */
  price: number | null;
  /** Optional "was" price (MRP), whole INR. Shown struck through on the shop when higher than `price`. */
  originalPrice: number | null;
  stock: number;
  packSize: string;
  tag: string;
  description: string;
  /** 12-digit code, auto-assigned. Empty for drafts that were never given one. */
  barcode: string;
  visible: boolean;
  /** Compressed JPEG data URLs, max 5. */
  images: string[];
  /** Tile colour used when there is no photo. */
  color: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  packSize: string;
  qty: number;
  price: number;
}

export interface TimelineEvent {
  label: string;
  at: string;
  note?: string;
}

export interface OrderPayment {
  /** Full Razorpay-style payment id, e.g. pay_Nx41h3Lm8c9Q. Masked in the UI. */
  id: string;
  status: PaymentStatus;
  refunded: number;
}

export interface Order {
  number: number;
  placedAt: string;
  customerId: string;
  items: OrderItem[];
  shipping: number;
  method: PayMethod;
  status: OrderStatus;
  address: string;
  timeline: TimelineEvent[];
  payment: OrderPayment;
  /** Contact + delivery details captured at checkout (empty for older orders). */
  email: string;
  shipName: string;
  shipPhone: string;
  location: { city: string; state: string; pincode: string };
  deliveredAt: string | null;
}

export interface Refund {
  id: string;
  orderNumber: number;
  amount: number;
  reason: string;
  note: string;
  at: string;
}

export interface CustomerNote {
  id: string;
  text: string;
  at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  area?: string;
  city: string;
  state: string;
  since: string;
  notes: CustomerNote[];
  /** True for the owner, invited admins and invitees — hidden from the Customers tab. */
  team?: boolean;
}

export interface StockLogEntry {
  id: string;
  at: string;
  text: string;
  delta: number;
}

export interface Member {
  userId: string;
  email: string;
  name: string | null;
  role: "owner" | "admin";
  createdAt: string;
}

export interface Invite {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  expiresAt: string;
  status: "pending" | "accepted" | "revoked" | "expired";
}

export interface Me {
  userId: string;
  email: string;
  name: string | null;
  role: "owner" | "admin";
}

export interface NotificationPrefs {
  newOrder: boolean;
  lowStock: boolean;
  orderEmail: boolean;
  whatsapp: boolean;
}

export interface Settings {
  store: {
    name: string;
    owner: string;
    address: string;
    phone: string;
    email: string;
    gstin: string;
    udyam: string;
  };
  razorpay: {
    mode: "Live" | "Test";
    upi: boolean;
    cards: boolean;
    netbanking: boolean;
    cod: boolean;
    payoutAccount: string;
  };
  notifications: NotificationPrefs;
  invoice: {
    footer: string;
    numberFormat: string;
    logo: string | null;
  };
}

export interface Review {
  id: string;
  orderNumber: number;
  customerName: string;
  rating: number;
  message: string;
  createdAt: string;
  /** "Idli Podi ×2, Country Sugar ×1" */
  products: string;
}

export interface AdminData {
  reviews: Review[];
  me: Me;
  members: Member[];
  invites: Invite[];
  products: AdminProduct[];
  orders: Order[];
  customers: Customer[];
  refunds: Refund[];
  stockLog: StockLogEntry[];
  settings: Settings;
}
