export interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  buyingPrice: number;
  quantity: number;
  stock: number;
  discountType: 'none' | 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  subtotal: number;
  profit: number;
}

export interface POSProduct {
  id: string;
  name: string;
  category: string | null;
  selling_price: number;
  buying_price: number;
  stock: number;
  description: string | null;
}

export interface SaleDiscount {
  type: 'none' | 'percentage' | 'fixed';
  value: number;
  amount: number;
}

export interface DailySummary {
  totalSales: number;
  totalProfit: number;
  totalTransactions: number;
  totalDiscounts: number;
  cashTotal: number;
  mobileMoneyTotal: number;
  bankTotal: number;
}

export interface ReceiptData {
  receiptNumber: string;
  businessName: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  totalItemDiscount: number;
  saleDiscount: number;
  finalTotal: number;
  paymentMethod: string;
  amountReceived: number;
  balanceReturned: number;
}
