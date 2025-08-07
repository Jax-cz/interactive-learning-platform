'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface PromoCode {
  id: string;
  code: string;
  free_days: number;
  max_uses: number;
  current_uses: number;
  expires_at: string | null;
  active: boolean;
  description: string | null;
  content_type_restriction: string | null;
  level_restriction: string | null;
  language_restriction: string | null;
  created_at: string;
}

export default function AdminPromoCodesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCode, setNewCode] = useState({
    code: '',
    free_days: 30,
    max_uses: 100,
    expires_at: '',
    description: '',
    content_type_restriction: '',
    level_restriction: '',
    language_restriction: ''
  });

  // Password Authentication
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Loiza') {
      setIsAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPromoCodes();
    }
  }, [isAuthenticated]);

  const fetchPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select(`
          *,
          content_type_restriction,
          level_restriction,
          language_restriction
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const codeData = {
        code: newCode.code.toUpperCase(),
        free_days: newCode.free_days,
        max_uses: newCode.max_uses,
        expires_at: newCode.expires_at || null,
        description: newCode.description || null,
        content_type_restriction: newCode.content_type_restriction || null,
        level_restriction: newCode.level_restriction || null,
        language_restriction: newCode.language_restriction || null,
        active: true
      };

      const { error } = await supabase
        .from('promo_codes')
        .insert([codeData]);

      if (error) throw error;

      // Reset form and refresh list
      setNewCode({
        code: '',
        free_days: 30,
        max_uses: 100,
        expires_at: '',
        description: '',
        content_type_restriction: '',
        level_restriction: '',
        language_restriction: ''
      });
      setShowCreateForm(false);
      fetchPromoCodes();

    } catch (error) {
      console.error('Error creating promo code:', error);
      alert('Error creating promo code');
    }
  };

  const toggleCodeStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchPromoCodes();
    } catch (error) {
      console.error('Error updating promo code:', error);
    }
  };

  const getRestrictionBadges = (code: PromoCode) => {
    const badges = [];
    
    if (code.content_type_restriction) {
      badges.push(
        <span key="content" className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
          {code.content_type_restriction.toUpperCase()}
        </span>
      );
    }
    
    if (code.level_restriction) {
      badges.push(
        <span key="level" className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
          {code.level_restriction}
        </span>
      );
    }
    
    if (code.language_restriction) {
      badges.push(
        <span key="language" className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
          {code.language_restriction}
        </span>
      );
    }
    
    if (badges.length === 0) {
      badges.push(
        <span key="all" className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
          All Content
        </span>
      );
    }
    
    return badges;
  };

  if (loading && isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading promo codes...</p>
        </div>
      </div>
    );
  }

  // Password Protection Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">
                Admin Access Required
              </h1>
              <p className="text-gray-600 mb-6">
                Please enter the admin password to access the promo code management system.
              </p>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                {passwordError && (
                  <p className="text-red-600 text-sm">{passwordError}</p>
                )}
                
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Access Promo Code Management
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin/upload" className="text-blue-600 hover:text-blue-800">
                ← Back to Admin
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                🎟️ Promo Code Management
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                {showCreateForm ? 'Cancel' : 'Create New Code'}
              </button>
              <button
                onClick={() => setIsAuthenticated(false)}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Promo Code</h2>
            
            <form onSubmit={createPromoCode} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Promo Code *
                  </label>
                  <input
                    type="text"
                    value={newCode.code}
                    onChange={(e) => setNewCode({...newCode, code: e.target.value})}
                    placeholder="e.g., POLISH90"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Free Days *
                  </label>
                  <select
                    value={newCode.free_days}
                    onChange={(e) => setNewCode({...newCode, free_days: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={30}>30 Days</option>
                    <option value={60}>60 Days</option>
                    <option value={90}>90 Days</option>
                    <option value={180}>180 Days</option>
                    <option value={360}>360 Days (1 Year)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Uses *
                  </label>
                  <input
                    type="number"
                    value={newCode.max_uses}
                    onChange={(e) => setNewCode({...newCode, max_uses: parseInt(e.target.value)})}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expires At (Optional)
                  </label>
                  <input
                    type="date"
                    value={newCode.expires_at}
                    onChange={(e) => setNewCode({...newCode, expires_at: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Restriction Settings */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Access Restrictions (Optional)</h3>
                <p className="text-sm text-gray-600 mb-4">Leave blank for full access to all content</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content Type
                    </label>
                    <select
                      value={newCode.content_type_restriction}
                      onChange={(e) => setNewCode({...newCode, content_type_restriction: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Content Types</option>
                      <option value="esl">ESL Only</option>
                      <option value="clil">CLIL Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Level
                    </label>
                    <select
                      value={newCode.level_restriction}
                      onChange={(e) => setNewCode({...newCode, level_restriction: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Levels</option>
                      <option value="beginner">Beginner Only</option>
                      <option value="intermediate">Intermediate Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language Support
                    </label>
                    <select
                      value={newCode.language_restriction}
                      onChange={(e) => setNewCode({...newCode, language_restriction: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Languages</option>
                      <option value="english">English Only</option>
                      <option value="czech">Czech Support</option>
                      <option value="german">German Support</option>
                      <option value="french">French Support</option>
                      <option value="spanish">Spanish Support</option>
                      <option value="polish">Polish Support</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={newCode.description}
                  onChange={(e) => setNewCode({...newCode, description: e.target.value})}
                  placeholder="e.g., Polish teachers campaign"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium"
              >
                Create Promo Code
              </button>
            </form>
          </div>
        )}

        {/* Promo Codes List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">
              Existing Promo Codes ({promoCodes.length})
            </h2>
          </div>

          {promoCodes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎟️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No promo codes yet</h3>
              <p className="text-gray-600">Create your first promo code to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Code</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Free Days</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Usage</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Restrictions</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {promoCodes.map((code) => (
                    <tr key={code.id}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-mono font-bold text-blue-600">
                            {code.code}
                          </div>
                          {code.description && (
                            <div className="text-xs text-gray-500 mt-1">
                              {code.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {code.free_days} days
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {code.current_uses} / {code.max_uses}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {getRestrictionBadges(code)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          code.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {code.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => toggleCodeStatus(code.id, code.active)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            code.active 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {code.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Enhanced Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-4">
            📖 Category-Specific Promo Codes
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Example Marketing Codes:</h4>
              <ul className="space-y-1 text-blue-800">
                <li>• <code>POLISH90</code> - 90 days CLIL Polish only</li>
                <li>• <code>ESL30</code> - 30 days ESL content only</li>
                <li>• <code>BEGINNER45</code> - 45 days beginner level only</li>
                <li>• <code>TEACHER-CZ</code> - Czech teachers special access</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Restriction Benefits:</h4>
              <ul className="space-y-1 text-blue-800">
                <li>• Targeted marketing campaigns</li>
                <li>• Cost-effective promotions</li>
                <li>• Better conversion tracking</li>
                <li>• Proofreader-specific access</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}