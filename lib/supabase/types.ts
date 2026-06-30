export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      contest_state_events: {
        Row: {
          contest_id: string;
          created_at: string;
          event_id: string;
          from_status: string | null;
          metadata: Json | null;
          to_status: string;
          trigger: string;
        };
        Insert: {
          contest_id: string;
          created_at?: string;
          event_id?: string;
          from_status?: string | null;
          metadata?: Json | null;
          to_status: string;
          trigger: string;
        };
        Update: {
          contest_id?: string;
          created_at?: string;
          event_id?: string;
          from_status?: string | null;
          metadata?: Json | null;
          to_status?: string;
          trigger?: string;
        };
      };
      contest_slate_players: {
        Row: {
          active_status: string | null;
          contest_id: string;
          created_at: string;
          display_name: string | null;
          display_order: number;
          game_start_time: string | null;
          home_away: string | null;
          id: string;
          opponent_abbreviation: string;
          opponent_context: string;
          player_external_id: string | null;
          player_id: string | null;
          player_name: string;
          position: string | null;
          provider_game_id: string | null;
          provider_player_id: string | null;
          sort_order_internal: number | null;
          team_abbreviation: string;
        };
        Insert: {
          active_status?: string | null;
          contest_id: string;
          created_at?: string;
          display_name?: string | null;
          display_order: number;
          game_start_time?: string | null;
          home_away?: string | null;
          id?: string;
          opponent_abbreviation: string;
          opponent_context: string;
          player_external_id?: string | null;
          player_id?: string | null;
          player_name: string;
          position?: string | null;
          provider_game_id?: string | null;
          provider_player_id?: string | null;
          sort_order_internal?: number | null;
          team_abbreviation: string;
        };
        Update: {
          active_status?: string | null;
          contest_id?: string;
          created_at?: string;
          display_name?: string | null;
          display_order?: number;
          game_start_time?: string | null;
          home_away?: string | null;
          id?: string;
          opponent_abbreviation?: string;
          opponent_context?: string;
          player_external_id?: string | null;
          player_id?: string | null;
          player_name?: string;
          position?: string | null;
          provider_game_id?: string | null;
          provider_player_id?: string | null;
          sort_order_internal?: number | null;
          team_abbreviation?: string;
        };
      };
      contest_validation_results: {
        Row: {
          contest_id: string;
          errors: string[];
          validated_at: string;
          validated_by_admin_id: string | null;
          validation_id: string;
          warnings: string[];
          status: string;
        };
        Insert: {
          contest_id: string;
          errors?: string[];
          validated_at?: string;
          validated_by_admin_id?: string | null;
          validation_id?: string;
          warnings?: string[];
          status: string;
        };
        Update: {
          contest_id?: string;
          errors?: string[];
          validated_at?: string;
          validated_by_admin_id?: string | null;
          validation_id?: string;
          warnings?: string[];
          status?: string;
        };
      };
      contests: {
        Row: {
          contest_type: string;
          created_at: string;
          created_by_admin_id: string | null;
          description: string;
          entry_fee_cents: number;
          entry_count: number;
          entry_open_time: string | null;
          display_order: number | null;
          id: string;
          is_featured: boolean;
          lineup_players: string[];
          lock_time: string;
          min_entries_to_run: number;
          paid_entries_count: number;
          published_at: string | null;
          published_by_admin_id: string | null;
          season: number;
          slate_size: number;
          slug: string;
          stat_type: string;
          status: string;
          title: string;
          updated_at: string;
          visibility_status: string;
          week: number | null;
        };
        Insert: {
          contest_type?: string;
          created_at?: string;
          created_by_admin_id?: string | null;
          description?: string;
          entry_fee_cents?: number;
          entry_count?: number;
          entry_open_time?: string | null;
          display_order?: number | null;
          id?: string;
          is_featured?: boolean;
          lineup_players?: string[];
          lock_time: string;
          min_entries_to_run?: number;
          paid_entries_count?: number;
          published_at?: string | null;
          published_by_admin_id?: string | null;
          season?: number;
          slate_size?: number;
          slug: string;
          stat_type?: string;
          status?: string;
          title: string;
          updated_at?: string;
          visibility_status?: string;
          week?: number | null;
        };
        Update: {
          contest_type?: string;
          created_at?: string;
          created_by_admin_id?: string | null;
          description?: string;
          entry_fee_cents?: number;
          entry_count?: number;
          entry_open_time?: string | null;
          display_order?: number | null;
          id?: string;
          is_featured?: boolean;
          lineup_players?: string[];
          lock_time?: string;
          min_entries_to_run?: number;
          paid_entries_count?: number;
          published_at?: string | null;
          published_by_admin_id?: string | null;
          season?: number;
          slate_size?: number;
          slug?: string;
          stat_type?: string;
          status?: string;
          title?: string;
          updated_at?: string;
          visibility_status?: string;
          week?: number | null;
        };
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
          username: string | null;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
          username?: string | null;
        };
      };
      roles: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
        };
      };
      pending_user_roles: {
        Row: {
          assigned_by_user_id: string | null;
          created_at: string;
          email: string;
          id: string;
          role_id: string;
        };
        Insert: {
          assigned_by_user_id?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          role_id: string;
        };
        Update: {
          assigned_by_user_id?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          role_id?: string;
        };
      };
      user_roles: {
        Row: {
          assigned_at: string;
          assigned_by_user_id: string | null;
          id: string;
          role_id: string;
          user_id: string;
        };
        Insert: {
          assigned_at?: string;
          assigned_by_user_id?: string | null;
          id?: string;
          role_id: string;
          user_id: string;
        };
        Update: {
          assigned_at?: string;
          assigned_by_user_id?: string | null;
          id?: string;
          role_id?: string;
          user_id?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
