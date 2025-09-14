// reconcile-subscriptions.js
// Run this weekly to check for users who cancelled in Stripe but are still active in database

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

// Initialize Stripe and Supabase
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getStripeActiveCustomers() {
  console.log('📊 Fetching active subscriptions from Stripe...');
  
  try {
    let allActiveCustomers = [];
    let hasMore = true;
    let startingAfter = undefined;

    // Get all active subscriptions (paginated)
    while (hasMore) {
      const params = {
        status: 'active',
        limit: 100
      };
      
      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      const subscriptions = await stripe.subscriptions.list(params);
      
      // Extract customer IDs from active subscriptions
      const customerIds = subscriptions.data.map(sub => sub.customer);
      allActiveCustomers = allActiveCustomers.concat(customerIds);
      
      hasMore = subscriptions.has_more;
      if (hasMore && subscriptions.data.length > 0) {
        startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
      }
    }

    console.log(`✅ Found ${allActiveCustomers.length} active subscriptions in Stripe`);
    return allActiveCustomers;
    
  } catch (error) {
    console.error('❌ Error fetching Stripe subscriptions:', error);
    throw error;
  }
}

async function getSupabaseActiveUsers() {
  console.log('📊 Fetching active users from Supabase...');
  
  try {
    const { data: activeUsers, error } = await supabase
      .from('users')
      .select('id, email, stripe_customer_id, subscription_tier, subscription_status, updated_at')
      .eq('subscription_status', 'active')
      .not('stripe_customer_id', 'is', null);

    if (error) {
      throw error;
    }

    console.log(`✅ Found ${activeUsers.length} active users in Supabase`);
    return activeUsers;
    
  } catch (error) {
    console.error('❌ Error fetching Supabase users:', error);
    throw error;
  }
}

async function reconcileSubscriptions() {
  console.log('🔄 Starting subscription reconciliation...\n');
  
  try {
    // Get data from both systems
    const stripeActiveCustomers = await getStripeActiveCustomers();
    const supabaseActiveUsers = await getSupabaseActiveUsers();
    
    console.log('\n📋 Analysis Results:');
    console.log('==================');
    
    // Find users who are active in Supabase but not in Stripe
    const shouldBeDeactivated = supabaseActiveUsers.filter(user => 
      !stripeActiveCustomers.includes(user.stripe_customer_id)
    );
    
    if (shouldBeDeactivated.length === 0) {
      console.log('✅ All systems in sync! No discrepancies found.');
      return [];
    }
    
    console.log(`⚠️  Found ${shouldBeDeactivated.length} users who should be deactivated:`);
    console.log('');
    
    shouldBeDeactivated.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   - Subscription Tier: ${user.subscription_tier}`);
      console.log(`   - Customer ID: ${user.stripe_customer_id}`);
      console.log(`   - Last Updated: ${user.updated_at}`);
      console.log('');
    });
    
    return shouldBeDeactivated;
    
  } catch (error) {
    console.error('❌ Error during reconciliation:', error);
    throw error;
  }
}

async function deactivateUsers(usersToDeactivate) {
  if (usersToDeactivate.length === 0) return;
  
  console.log('🔄 Deactivating users...');
  
  try {
    const userIds = usersToDeactivate.map(user => user.id);
    
    const { data, error } = await supabase
      .from('users')
      .update({
        subscription_tier: 'free',
        subscription_status: 'inactive',
        subscription_end_date: new Date().toISOString(),
        preferred_content_type: null
      })
      .in('id', userIds)
      .select('email');

    if (error) {
      throw error;
    }

    console.log(`✅ Successfully deactivated ${data.length} users:`);
    data.forEach(user => console.log(`   - ${user.email}`));
    
  } catch (error) {
    console.error('❌ Error deactivating users:', error);
    throw error;
  }
}

// Main execution function
async function main() {
  try {
    console.log('🚀 Subscription Reconciliation Tool');
    console.log('===================================\n');
    
    const usersToDeactivate = await reconcileSubscriptions();
    
    if (usersToDeactivate.length > 0) {
      console.log('\n❓ What would you like to do?');
      console.log('1. Automatically deactivate these users');
      console.log('2. Just show the report (no changes)');
      console.log('\nTo automatically deactivate, run:');
      console.log('node reconcile-subscriptions.js --auto-deactivate');
      
      // Check if auto-deactivate flag is provided
      if (process.argv.includes('--auto-deactivate')) {
        console.log('\n🤖 Auto-deactivate mode enabled');
        await deactivateUsers(usersToDeactivate);
      } else {
        console.log('\n📋 Report complete. No changes made.');
      }
    }
    
    console.log('\n✅ Reconciliation complete!');
    
  } catch (error) {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { reconcileSubscriptions, getStripeActiveCustomers, getSupabaseActiveUsers };