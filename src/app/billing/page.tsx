'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getUserProfile, type UserProfile } from '@/lib/auth';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CreditCard, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Pause,
  X,
  Settings
} from 'lucide-react';

export default function BillingPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { user: currentUser, error: userError } = await getCurrentUser();
      
      if (userError || !currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);

      const { profile: userProfile, error: profileError } = await getUserProfile(currentUser.id);
      
      if (profileError || !userProfile) {
        router.push('/dashboard');
        return;
      }

      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading user data:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleBillingPortal = async () => {
    if (!user?.id) {
      alert('User not found. Please refresh and try again.');
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch('/api/create-billing-portal-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        }),
      });

      const { url, error } = await response.json();

      if (error) {
        alert('Error accessing billing portal: ' + error);
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Billing portal error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user?.id) {
      alert('User not found. Please refresh and try again.');
      return;
    }

    const confirmCancel = confirm(
      'Are you sure you want to cancel your subscription? You will lose access to paid content at the end of your current billing period.'
    );
    
    if (!confirmCancel) return;

    setProcessing(true);

    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        }),
      });

      const { success, error } = await response.json();

      if (error) {
        alert('Error canceling subscription: ' + error);
        return;
      }

      if (success) {
        alert('Subscription cancelled successfully. You will retain access until the end of your current billing period.');
        await loadUserData(); // Refresh the data
      }
    } catch (error) {
      console.error('Cancel subscription error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getSubscriptionDetails = () => {
    if (!profile) return { name: 'Loading...', color: 'gray', price: '' };
    
    switch (profile.subscription_tier) {
      case 'free':
        return { name: 'Free Plan', color: 'gray', price: '$0/month' };
      case 'esl_only':
        return { name: 'ESL Plan', color: 'orange', price: '$6/month' };
      case 'clil_plus':
        return { name: 'CLIL + Language Support', color: 'purple', price: '$6/month' };
      case 'complete_plan':
        return { name: 'Complete Plan', color: 'green', price: '$9/month' };
      default:
        return { name: 'Free Plan', color: 'gray', price: '$0/month' };
    }
  };

  const getStatusBadge = () => {
    if (!profile) return { text: 'Loading...', color: 'gray' };
    
    switch (profile.subscription_status) {
      case 'active':
        return { text: 'Active', color: 'green' };
      case 'past_due':
        return { text: 'Past Due', color: 'red' };
      case 'cancelled':
        return { text: 'Cancelled', color: 'yellow' };
      case 'inactive':
      default:
        return { text: 'Inactive', color: 'gray' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  const subscriptionDetails = getSubscriptionDetails();
  const statusBadge = getStatusBadge();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Billing & Account
          </h1>
          <p className="text-gray-600">
            Manage your subscription and billing information
          </p>
        </div>

        {/* Current Subscription Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Current Subscription</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              statusBadge.color === 'green' ? 'bg-green-100 text-green-800' :
              statusBadge.color === 'red' ? 'bg-red-100 text-red-800' :
              statusBadge.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {statusBadge.text}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  subscriptionDetails.color === 'green' ? 'bg-green-100' :
                  subscriptionDetails.color === 'purple' ? 'bg-purple-100' :
                  subscriptionDetails.color === 'orange' ? 'bg-orange-100' :
                  'bg-gray-100'
                }`}>
                  <CreditCard className={`h-6 w-6 ${
                    subscriptionDetails.color === 'green' ? 'text-green-600' :
                    subscriptionDetails.color === 'purple' ? 'text-purple-600' :
                    subscriptionDetails.color === 'orange' ? 'text-orange-600' :
                    'text-gray-600'
                  }`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {subscriptionDetails.name}
                  </h3>
                  <p className="text-gray-600">{subscriptionDetails.price}</p>
                </div>
              </div>

              {/* Plan Features */}
              {profile?.subscription_tier === 'free' && (
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Access to sample lessons only</p>
                  <p>• Limited progress tracking</p>
                </div>
              )}

              {profile?.subscription_tier === 'esl_only' && (
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• All ESL news lessons</p>
                  <p>• Full progress tracking</p>
                  <p>• Weekly new content</p>
                </div>
              )}

              {profile?.subscription_tier === 'clil_plus' && (
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• All CLIL science lessons</p>
                  <p>• Multi-language support ({profile?.language_support})</p>
                  <p>• Full progress tracking</p>
                  <p>• Weekly new content</p>
                </div>
              )}

              {profile?.subscription_tier === 'complete_plan' && (
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• All ESL + CLIL lessons</p>
                  <p>• Multi-language support ({profile?.language_support})</p>
                  <p>• Full progress tracking</p>
                  <p>• Weekly new content</p>
                  <p>• Best value plan</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {profile?.subscription_tier !== 'free' && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Billing Information</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {profile?.subscription_status === 'active' 
                      ? 'Your subscription renews automatically'
                      : 'Subscription status: ' + profile?.subscription_status
                    }
                  </p>
                </div>
              )}

              {/* Change Plan for Free Users */}
              {profile?.subscription_tier === 'free' && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Ready to Upgrade?</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Get access to our complete learning system with weekly new content.
                  </p>
                  <Link 
                    href="/subscribe"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Choose Plan
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          
          {/* Manage Billing */}
          {profile?.subscription_tier !== 'free' && (
            <button
              onClick={handleBillingPortal}
              disabled={processing}
              className="flex items-center justify-center space-x-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span>{processing ? 'Loading...' : 'Change Plan/Cancel Subscription'}</span>
            </button>
          )}

          {/* Change Plan */}
          
        </div>

        {/* Danger Zone - Only for Active Subscriptions */}
          {/* TEMPORARILY DISABLED - Use Stripe billing portal for all subscription management
        {profile?.subscription_tier !== 'free' && profile?.subscription_status === 'active' && (
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-semibold text-red-900">Cancel Subscription</h3>
            </div>
            
            <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                You'll keep access until the end of your current billing period.
              </p>
              
              <button
                onClick={handleCancelSubscription}
                disabled={processing}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <X className="h-4 w-4" />
                <span>{processing ? 'Processing...' : 'Proceed with Cancellation'}</span>
              </button>
            </div>
            */

            /* Future: Pause Subscription 
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Pause Subscription</h4>
              <p className="text-sm text-gray-600 mb-3">
                Temporarily pause your subscription for up to 3 months.
              </p>
              <button
                disabled
                className="flex items-center space-x-2 px-4 py-2 bg-gray-300 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed"
              >
                <Pause className="h-4 w-4" />
                <span>Coming Soon</span>
              </button>
            </div>
          </div>
        )}
          */}
        

        {/* Help Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
          
          <div className="space-y-3 text-sm text-gray-600">
            <p>• <strong>Billing questions:</strong> All billing is handled securely through Stripe</p>
            <p>• <strong>Plan changes:</strong> Upgrades take effect immediately, downgrades at next billing cycle</p>
            <p>• <strong>Cancellations:</strong> You keep access until your current period ends</p>
            <p>• <strong>Support:</strong> Contact us at support@easylanguagelearning.net</p>
          </div>
        </div>
      </div>
    </div>
  );
}