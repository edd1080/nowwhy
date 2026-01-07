// Database types for Supabase
// These can be generated with: npx supabase gen types typescript --local > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          domain: string;
          public_key: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          domain: string;
          public_key?: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          domain?: string;
          public_key?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      visitors: {
        Row: {
          id: string;
          project_id: string;
          first_seen: string;
          last_seen: string;
          country: string | null;
          city: string | null;
          device: string;
        };
        Insert: {
          id: string;
          project_id: string;
          first_seen?: string;
          last_seen?: string;
          country?: string | null;
          city?: string | null;
          device: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          first_seen?: string;
          last_seen?: string;
          country?: string | null;
          city?: string | null;
          device?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          visitor_id: string;
          project_id: string;
          started_at: string;
          last_activity_at: string;
          referrer: string | null;
          referrer_category: string;
          is_returning: boolean;
          page_count: number;
          status: string;
        };
        Insert: {
          id: string;
          visitor_id: string;
          project_id: string;
          started_at?: string;
          last_activity_at?: string;
          referrer?: string | null;
          referrer_category?: string;
          is_returning?: boolean;
          page_count?: number;
          status?: string;
        };
        Update: {
          id?: string;
          visitor_id?: string;
          project_id?: string;
          started_at?: string;
          last_activity_at?: string;
          referrer?: string | null;
          referrer_category?: string;
          is_returning?: boolean;
          page_count?: number;
          status?: string;
        };
      };
      events: {
        Row: {
          id: string;
          session_id: string;
          project_id: string;
          type: string;
          path: string;
          timestamp: string;
          time_on_page: number | null;
          title: string | null;
          viewport_width: number | null;
          viewport_height: number | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          project_id: string;
          type: string;
          path: string;
          timestamp?: string;
          time_on_page?: number | null;
          title?: string | null;
          viewport_width?: number | null;
          viewport_height?: number | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          project_id?: string;
          type?: string;
          path?: string;
          timestamp?: string;
          time_on_page?: number | null;
          title?: string | null;
          viewport_width?: number | null;
          viewport_height?: number | null;
        };
      };
      insights: {
        Row: {
          id: string;
          session_id: string;
          intent_label: string;
          intent_confidence: number;
          intent_reason: string;
          friction_flag: boolean;
          friction_type: string;
          friction_reason: string | null;
          generated_at: string;
          ai_used: boolean;
        };
        Insert: {
          id?: string;
          session_id: string;
          intent_label: string;
          intent_confidence: number;
          intent_reason: string;
          friction_flag?: boolean;
          friction_type?: string;
          friction_reason?: string | null;
          generated_at?: string;
          ai_used?: boolean;
        };
        Update: {
          id?: string;
          session_id?: string;
          intent_label?: string;
          intent_confidence?: number;
          intent_reason?: string;
          friction_flag?: boolean;
          friction_type?: string;
          friction_reason?: string | null;
          generated_at?: string;
          ai_used?: boolean;
        };
      };
      alert_configs: {
        Row: {
          id: string;
          project_id: string;
          alert_type: string;
          enabled: boolean;
          delivery_mode: string;
          threshold: number | null;
          slack_webhook_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          alert_type: string;
          enabled?: boolean;
          delivery_mode?: string;
          threshold?: number | null;
          slack_webhook_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          alert_type?: string;
          enabled?: boolean;
          delivery_mode?: string;
          threshold?: number | null;
          slack_webhook_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_visits: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          last_checked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id: string;
          last_checked_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string;
          last_checked_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};
