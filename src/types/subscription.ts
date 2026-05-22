export type UserType = 'buyer' | 'business';
export type SubscriptionTier = 'free' | 'premium_monthly' | 'premium_yearly';
export type SubscriptionStatus = 'inactive' | 'trial' | 'active' | 'expired' | 'cancelled';
export type PaymentType = 'bank' | 'mobile_money';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type BillingPeriod = 'monthly' | 'yearly' | 'free';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price: number;
  billing_period: BillingPeriod;
  trial_days: number;
  description: string;
  features: string[];
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_type: UserType;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  subscription_tier: SubscriptionTier;
  status: SubscriptionStatus;
  started_at: string;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  ends_at: string | null;
  auto_renew: boolean;
  payment_method_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  payment_type: PaymentType;
  provider: string;
  account_identifier: string;
  is_default: boolean;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPayment {
  id: string;
  user_id: string;
  subscription_id: string;
  payment_method_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  transaction_reference: string | null;
  payment_date: string | null;
  due_date: string;
  paid_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserBranch {
  id: string;
  account_id: string;
  branch_name: string;
  is_main_branch: boolean;
  manager_id: string | null;
  location: string | null;
  contact_info: Record<string, any>;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}
