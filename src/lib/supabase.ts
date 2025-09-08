// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Configure Supabase client with proper session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use localStorage for persistent sessions (instead of sessionStorage)
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Keep sessions alive
    persistSession: true,
    // Automatically detect sessions from URL (for email confirmations, etc.)
    detectSessionInUrl: true,
    // Set longer session refresh threshold
    autoRefreshToken: true,
  },
  // Optional: Configure longer timeout
  global: {
    headers: {
      'X-Client-Info': 'interactive-learning-platform'
    }
  }
})

// Database Types - Updated to match your actual schema
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          // Core fields
          id: string
          email: string
          created_at: string
          updated_at: string
          
          // User preferences
          preferred_content_type: 'esl' | 'clil' | 'both' | null
          preferred_level: 'beginner' | 'intermediate' | 'both' | null
          language_support: string  // FIXED: Now uses language_support
          
          // Subscription fields - UPDATED to 3 tiers only
          subscription_tier: 'free' | 'esl_only' | 'clil_plus' | 'complete_plan'
          subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due'
          subscription_start_date: string | null
          subscription_end_date: string | null
          
          // Stripe integration
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          
          // User settings
          timezone: string
          notifications_enabled: boolean
          email_verified: boolean
          onboarding_completed: boolean
          
          // Level change tracking
          last_level_change: string | null
          level_change_count: number
          
          // Promo code system
          promo_code_used: string | null
          free_trial_days: number
          trial_expires_at: string | null
          promo_content_restriction: string | null
          promo_level_restriction: string | null
          promo_language_restriction: string | null
        }
        Insert: {
          // Core fields
          id?: string
          email: string
          created_at?: string
          updated_at?: string
          
          // User preferences
          preferred_content_type?: 'esl' | 'clil' | 'both' | null
          preferred_level?: 'beginner' | 'intermediate' | 'both' | null
          language_support?: string
          
          // Subscription fields
          subscription_tier?: 'free' | 'esl_only' | 'clil_plus' | 'complete_plan'
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'past_due'
          subscription_start_date?: string | null
          subscription_end_date?: string | null
          
          // Stripe integration
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          
          // User settings
          timezone?: string
          notifications_enabled?: boolean
          email_verified?: boolean
          onboarding_completed?: boolean
          
          // Level change tracking
          last_level_change?: string | null
          level_change_count?: number
          
          // Promo code system
          promo_code_used?: string | null
          free_trial_days?: number
          trial_expires_at?: string | null
          promo_content_restriction?: string | null
          promo_level_restriction?: string | null
          promo_language_restriction?: string | null
        }
        Update: {
          // Core fields
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          
          // User preferences
          preferred_content_type?: 'esl' | 'clil' | 'both' | null
          preferred_level?: 'beginner' | 'intermediate' | 'both' | null
          language_support?: string
          
          // Subscription fields
          subscription_tier?: 'free' | 'esl_only' | 'clil_plus' | 'complete_plan'
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'past_due'
          subscription_start_date?: string | null
          subscription_end_date?: string | null
          
          // Stripe integration
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          
          // User settings
          timezone?: string
          notifications_enabled?: boolean
          email_verified?: boolean
          onboarding_completed?: boolean
          
          // Level change tracking
          last_level_change?: string | null
          level_change_count?: number
          
          // Promo code system
          promo_code_used?: string | null
          free_trial_days?: number
          trial_expires_at?: string | null
          promo_content_restriction?: string | null
          promo_level_restriction?: string | null
          promo_language_restriction?: string | null
        }
      }
      lessons: {
        Row: {
          // Core lesson fields
          id: string
          created_at: string
          updated_at: string
          
          // Lesson content
          title: string
          description: string | null
          content_type: 'esl' | 'clil'
          level: 'beginner' | 'intermediate'
          language_support: string  // FIXED: Now uses language_support consistently
          topic_category: string | null
          
          // Publishing system
          week_number: number
          release_date: string
          published: boolean  // Admin uploaded to database
          is_published: boolean  // Released to students
          is_sample: boolean
          
          // Lesson data
          content: any // JSONB content
          estimated_duration: number
          exercise_count: number
          difficulty_score: number
          
          // SEO and organization
          slug: string | null
          tags: string[] | null
          image_filename: string | null
          
          // Multi-language support
          parent_lesson_id: string | null
          original_language: string
        }
        Insert: {
          // Core lesson fields
          id?: string
          created_at?: string
          updated_at?: string
          
          // Lesson content
          title: string
          description?: string | null
          content_type: 'esl' | 'clil'
          level: 'beginner' | 'intermediate'
          language_support?: string
          topic_category?: string | null
          
          // Publishing system
          week_number: number
          release_date?: string
          published?: boolean
          is_published?: boolean
          is_sample?: boolean
          
          // Lesson data
          content: any
          estimated_duration?: number
          exercise_count?: number
          difficulty_score?: number
          
          // SEO and organization
          slug?: string | null
          tags?: string[] | null
          image_filename?: string | null
          
          // Multi-language support
          parent_lesson_id?: string | null
          original_language?: string
        }
        Update: {
          // Core lesson fields
          id?: string
          created_at?: string
          updated_at?: string
          
          // Lesson content
          title?: string
          description?: string | null
          content_type?: 'esl' | 'clil'
          level?: 'beginner' | 'intermediate'
          language_support?: string
          topic_category?: string | null
          
          // Publishing system
          week_number?: number
          release_date?: string
          published?: boolean
          is_published?: boolean
          is_sample?: boolean
          
          // Lesson data
          content?: any
          estimated_duration?: number
          exercise_count?: number
          difficulty_score?: number
          
          // SEO and organization
          slug?: string | null
          tags?: string[] | null
          image_filename?: string | null
          
          // Multi-language support
          parent_lesson_id?: string | null
          original_language?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          started_at: string
          completed_at: string | null
          last_accessed_at: string
          total_score: number
          max_possible_score: number
          percentage_score: number
          time_spent_seconds: number
          exercise_results: any // JSONB
          is_completed: boolean
          completion_percentage: number
          attempts_count: number
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          started_at?: string
          completed_at?: string | null
          last_accessed_at?: string
          total_score?: number
          max_possible_score?: number
          percentage_score?: number
          time_spent_seconds?: number
          exercise_results?: any
          is_completed?: boolean
          completion_percentage?: number
          attempts_count?: number
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string
          started_at?: string
          completed_at?: string | null
          last_accessed_at?: string
          total_score?: number
          max_possible_score?: number
          percentage_score?: number
          time_spent_seconds?: number
          exercise_results?: any
          is_completed?: boolean
          completion_percentage?: number
          attempts_count?: number
        }
      }
    }
  }
}