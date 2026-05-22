# Subscription System Implementation Guide

## Overview

The subscription system has been implemented to support two user types with different access levels:

- **Buyers**: Free account with access to interactive features (like, comment, follow)
- **Business Users**: Premium subscription required for dashboard and business management features

## Key Features

### 1. ✅ User Type Selection During Signup
- Users select their account type (Buyer or Business) during registration
- Buyers get immediate free access
- Business users are redirected to pricing page after signup

### 2. ✅ Premium Subscription Plans
- **Premium Monthly**: 25,000 KES/month
- **Premium Yearly**: 250,000 KES/year (saves money!)
- Both include 30-day free trial
- Full access immediately upon signup during trial period

### 3. ✅ Payment Method System
- **Support for Multiple Payment Types**:
  - Mobile Money (M-Pesa, Airtel Money, etc.)
  - Bank Transfers
- Payment type can be toggled during checkout
- Users can add multiple payment methods
- Set default payment method

### 4. ✅ 30-Day Free Trial
- All users signing up for premium get 30 days free
- No payment required during trial
- Auto-activation of account during trial
- Automatic billing after trial ends (if auto-renew enabled)

### 5. ✅ Branch Management (Premium Feature)
- Main account can create multiple branches
- Each branch has its own Manager/Contact person
- Main branch acts as admin for all branches
- Unlimited branches per account

### 6. ✅ Auto-Account Activation
- Account automatically activated upon subscription creation
- Users can immediately access dashboard and features
- Real database integration for all premium features

## Database Schema

### Key Tables:

#### `user_profiles`
Tracks user metadata and subscription tier
```sql
- id (user_id)
- user_type ('buyer' | 'business')
- subscription_tier ('free' | 'premium_monthly' | 'premium_yearly')
- subscription_status ('inactive' | 'trial' | 'active' | 'cancelled')
```

#### `subscription_plans`
Predefined subscription tiers
```sql
- id, name, tier, price, billing_period
- trial_days (30 for all premium plans)
- features (array of included features)
```

#### `user_subscriptions`
User's subscription instances
```sql
- user_id, plan_id, status
- trial_started_at, trial_ends_at
- started_at, ends_at (for active subscriptions)
- auto_renew (boolean)
```

#### `payment_methods`
Saved payment details
```sql
- user_id, payment_type ('bank' | 'mobile_money')
- provider, account_identifier
- is_default, verified
```

#### `subscription_payments`
Payment transaction records
```sql
- user_id, subscription_id, payment_method_id
- amount, currency, status
- transaction_reference, due_date, paid_date
```

#### `user_branches`
Branch management for premium accounts
```sql
- account_id (main user), branch_name
- is_main_branch (boolean)
- manager_id (optional branch manager)
- location, contact_info, settings
```

## File Structure

### New Components:
- `src/components/SubscriptionCheckout.tsx` - Checkout flow with payment method selection
- `src/components/BranchManagement.tsx` - Branch creation and management UI
- `src/components/SubscriptionManagement.tsx` - Subscription status and management

### New Pages:
- `src/pages/PricingPage.tsx` - Premium plan selection page

### Updated Components:
- `src/components/AuthModal.tsx` - Added user type selection during signup
- `src/components/ProtectedRoute.tsx` - Added subscription validation
- `src/contexts/AuthContext.tsx` - Extended with user profile support

### New Services:
- `src/lib/subscription-service.ts` - Subscription management utilities
- `src/types/subscription.ts` - TypeScript types for subscription system

### Database:
- `supabase/migrations/20260421_001_subscription_system.sql` - Complete schema

## User Flow

### For Buyers:
```
Sign Up (Select "Buyer Account")
    ↓
Create Account
    ↓
Immediate Access to:
    - Marketplace browsing
    - Like products
    - Comment on products
    - Follow shops
```

### For Business Users:
```
Sign Up (Select "Business Account")
    ↓
Create Account
    ↓
Redirect to /pricing (Pricing Page)
    ↓
Select Plan (Monthly or Yearly)
    ↓
Add Payment Method (Choose: Mobile Money or Bank)
    ↓
Start 30-Day Free Trial
    ↓
Automatic Account Activation
    ↓
Full Dashboard Access
    ↓
Create Main Branch
    ↓
Add Additional Branches (Optional)
```

## Integration Points

### In Your Components:

#### Check User Type:
```typescript
const { userProfile } = useAuth();

if (userProfile?.user_type === 'buyer') {
  // Show buyer-only features
}

if (userProfile?.user_type === 'business') {
  // Show business features
}
```

#### Check Subscription Status:
```typescript
if (userProfile?.subscription_status === 'trial') {
  // User is in trial period
}

if (userProfile?.subscription_status === 'active') {
  // User has active subscription
}
```

#### Get Subscription Details:
```typescript
import { getCurrentSubscription } from '@/lib/subscription-service';

const subscription = await getCurrentSubscription(user.id);
```

### Add to StoreSettingsPage:
```typescript
import SubscriptionManagement from '@/components/SubscriptionManagement';
import BranchManagement from '@/components/BranchManagement';

export default function StoreSettingsPage() {
  return (
    <div>
      <SubscriptionManagement />
      <BranchManagement />
    </div>
  );
}
```

## Configuration

### Subscription Plans (Automatic):
The system creates three default plans:
1. Free (for buyers)
2. Premium Monthly - 25,000 KES
3. Premium Yearly - 250,000 KES

All premium plans include 30-day trial and same features.

### Trial Period:
Currently hardcoded to 30 days. To change:
```typescript
// In SubscriptionCheckout.tsx
const trialDays = plan.trial_days || 30; // Change 30 to desired number
```

### Payment Providers:
Add/modify supported payment providers in:
```typescript
// In SubscriptionCheckout.tsx
const PAYMENT_PROVIDERS = {
  mobile_money: ['M-Pesa', 'Airtel Money', 'Safaricom', 'Equitel'],
  bank: ['KCB', 'Equity Bank', 'Standard Chartered', 'NCBA'],
};
```

## Important Notes

### ⚠️ Payment Processing:
The current implementation:
- ✅ Stores payment method details
- ✅ Creates payment records
- ✅ Activates subscriptions
- ⚠️ **Does NOT process actual payments** (requires payment gateway integration)

To add real payment processing:
1. Integrate with Mpesa API or payment gateway
2. Implement payment verification in `SubscriptionCheckout.tsx`
3. Update `activateSubscription()` only after payment confirmation

### 📧 Email Notifications:
Add email notifications for:
- Trial ending soon (7 days before)
- Payment due reminders
- Subscription activation confirmation
- Cancellation confirmation

### 🔄 Auto-Renewal:
Current auto-renewal is tracked but not enforced. To enable:
1. Set up cron job to check expiring subscriptions
2. Call `processAutoRenewal()` from `lib/subscription-service.ts`
3. Integrate with payment gateway for automatic charging

### 📊 Analytics:
Add subscription metrics to dashboard:
- Active subscriptions count
- MRR (Monthly Recurring Revenue)
- Trial to paid conversion rate
- Churn rate

## Next Steps

1. **Integrate Payment Gateway**:
   - M-Pesa API or Stripe integration
   - Process actual payments
   - Handle payment failures and retries

2. **Add Email Templates**:
   - Trial expiration reminders
   - Payment receipts
   - Subscription confirmation

3. **Implement Admin Dashboard**:
   - View all subscriptions
   - Manual subscription management
   - Revenue analytics

4. **Add Subscription Tiers Management**:
   - Admin UI to create/edit plans
   - Feature-based access control

5. **Implement Subscription Webhooks**:
   - Payment gateway webhooks for status updates
   - Automatic subscription expiration handling
   - Auto-renewal processing

## Testing Checklist

- [ ] User can sign up as Buyer
- [ ] User can sign up as Business
- [ ] Buyer has no access to pricing page
- [ ] Business user redirected to pricing after signup
- [ ] Can select Monthly or Yearly plan
- [ ] Can toggle between Mobile Money and Bank
- [ ] Can add new payment method
- [ ] Trial subscription created successfully
- [ ] Trial has 30-day countdown
- [ ] Account immediately active during trial
- [ ] Can create main branch automatically
- [ ] Can add additional branches
- [ ] Can edit branch details
- [ ] Can delete branches (except main)
- [ ] Subscription status shows correctly
- [ ] Can cancel subscription
- [ ] Auto-renew toggle works

## Troubleshooting

### User not redirected to pricing:
- Check `user_profiles` table - `user_type` should be 'business'
- Check `subscription_status` - should be 'inactive'
- Verify `ProtectedRoute` component is checking correctly

### Payment method not saving:
- Verify `payment_methods` RLS policies
- Check user_id is being passed correctly
- Ensure payment_type is 'bank' or 'mobile_money'

### Trial not activating:
- Check `user_subscriptions` record created
- Verify trial_ends_at is 30 days from now
- Ensure user_profiles updated to 'trial' status

### Dashboard access denied:
- Check if user logged in
- Verify subscription status is 'trial' or 'active'
- Check ProtectedRoute isDashboardRoute logic

## Support

For issues or questions about the subscription system, refer to:
- `/workspaces/my-biz/src/lib/subscription-service.ts` - Service functions
- `/workspaces/my-biz/src/types/subscription.ts` - Type definitions
- Database migrations in `/workspaces/my-biz/supabase/migrations/`
