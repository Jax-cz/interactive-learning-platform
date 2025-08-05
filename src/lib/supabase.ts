// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types (auto-generated from your schema)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          preferred_content_type: 'esl' | 'clil' | 'both' | null
          preferred_level: 'beginner' | 'intermediate' | 'both' | null
          preferred_language: string
          subscription_tier: 'free' | 'esl_only' | 'clil_only' | 'clil_plus'
          subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due'
          subscription_start_date: string | null
          subscription_end_date: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          timezone: string
          notifications_enabled: boolean
          email_verified: boolean
          onboarding_completed: boolean
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
          preferred_content_type?: 'esl' | 'clil' | 'both' | null
          preferred_level?: 'beginner' | 'intermediate' | 'both' | null
          preferred_language?: string
          subscription_tier?: 'free' | 'esl_only' | 'clil_only' | 'clil_plus'
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'past_due'
          subscription_start_date?: string | null
          subscription_end_date?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          timezone?: string
          notifications_enabled?: boolean
          email_verified?: boolean
          onboarding_completed?: boolean
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          preferred_content_type?: 'esl' | 'clil' | 'both' | null
          preferred_level?: 'beginner' | 'intermediate' | 'both' | null
          preferred_language?: string
          subscription_tier?: 'free' | 'esl_only' | 'clil_only' | 'clil_plus'
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'past_due'
          subscription_start_date?: string | null
          subscription_end_date?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          timezone?: string
          notifications_enabled?: boolean
          email_verified?: boolean
          onboarding_completed?: boolean
        }
      }
      lessons: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string | null
          content_type: 'esl' | 'clil'
          level: 'beginner' | 'intermediate'
          language: string
          topic_category: string | null
          week_number: number
          release_date: string
          content: any // JSONB content
          estimated_duration: number
          exercise_count: number
          difficulty_score: number
          is_published: boolean
          is_sample: boolean
          slug: string | null
          tags: string[] | null
          parent_lesson_id: string | null
          original_language: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description?: string | null
          content_type: 'esl' | 'clil'
          level: 'beginner' | 'intermediate'
          language?: string
          topic_category?: string | null
          week_number: number
          release_date: string
          content: any
          estimated_duration?: number
          exercise_count?: number
          difficulty_score?: number
          is_published?: boolean
          is_sample?: boolean
          slug?: string | null
          tags?: string[] | null
          parent_lesson_id?: string | null
          original_language?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string | null
          content_type?: 'esl' | 'clil'
          level?: 'beginner' | 'intermediate'
          language?: string
          topic_category?: string | null
          week_number?: number
          release_date?: string
          content?: any
          estimated_duration?: number
          exercise_count?: number
          difficulty_score?: number
          is_published?: boolean
          is_sample?: boolean
          slug?: string | null
          tags?: string[] | null
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