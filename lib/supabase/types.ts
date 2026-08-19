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
      contest_stat_snapshot_rows: {
        Row: {
          final_stat: number;
          game_status: string;
          passing_touchdowns: number;
          player_name: string | null;
          provider_game_id: string;
          provider_player_id: string;
          snapshot_id: string;
        };
        Insert: {
          final_stat: number;
          game_status?: string;
          passing_touchdowns?: number;
          player_name?: string | null;
          provider_game_id: string;
          provider_player_id: string;
          snapshot_id: string;
        };
        Update: {
          final_stat?: number;
          game_status?: string;
          passing_touchdowns?: number;
          player_name?: string | null;
          provider_game_id?: string;
          provider_player_id?: string;
          snapshot_id?: string;
        };
      };
      contest_stat_snapshots: {
        Row: {
          contest_id: string;
          created_at: string;
          metadata: Json | null;
          provider_name: string;
          provider_snapshot_time: string;
          snapshot_id: string;
          status: string;
        };
        Insert: {
          contest_id: string;
          created_at?: string;
          metadata?: Json | null;
          provider_name: string;
          provider_snapshot_time: string;
          snapshot_id?: string;
          status?: string;
        };
        Update: {
          contest_id?: string;
          created_at?: string;
          metadata?: Json | null;
          provider_name?: string;
          provider_snapshot_time?: string;
          snapshot_id?: string;
          status?: string;
        };
      };
      contest_player_results: {
        Row: {
          actual_rank: number;
          actual_rank_display: string;
          actual_rank_max: number;
          actual_rank_min: number;
          contest_id: string;
          final_stat: number;
          passing_touchdowns: number;
          game_id: string;
          game_status: string;
          player_id: string;
          player_name: string;
          provider_player_id: string;
          stat_finalized_at: string;
          team_abbreviation: string;
        };
        Insert: {
          actual_rank: number;
          actual_rank_display: string;
          actual_rank_max: number;
          actual_rank_min: number;
          contest_id: string;
          final_stat: number;
          passing_touchdowns?: number;
          game_id: string;
          game_status?: string;
          player_id: string;
          player_name: string;
          provider_player_id: string;
          stat_finalized_at?: string;
          team_abbreviation: string;
        };
        Update: {
          actual_rank?: number;
          actual_rank_display?: string;
          actual_rank_max?: number;
          actual_rank_min?: number;
          contest_id?: string;
          final_stat?: number;
          passing_touchdowns?: number;
          game_id?: string;
          game_status?: string;
          player_id?: string;
          player_name?: string;
          provider_player_id?: string;
          stat_finalized_at?: string;
          team_abbreviation?: string;
        };
      };
      contest_provisional_stat_snapshot_rows: {
        Row: {
          game_status: string;
          home_away: string;
          opponent_abbreviation: string;
          passing_touchdowns: number;
          passing_yards: number;
          player_id: string;
          player_name: string;
          provisional_rank: number;
          provisional_rank_display: string;
          provisional_rank_max: number;
          provisional_rank_min: number;
          provider_game_id: string;
          provider_player_id: string;
          snapshot_id: string;
          sort_order: number;
          team_abbreviation: string;
        };
        Insert: {
          game_status: string;
          home_away: string;
          opponent_abbreviation: string;
          passing_touchdowns?: number;
          passing_yards: number;
          player_id: string;
          player_name: string;
          provisional_rank: number;
          provisional_rank_display: string;
          provisional_rank_max: number;
          provisional_rank_min: number;
          provider_game_id: string;
          provider_player_id: string;
          snapshot_id: string;
          sort_order: number;
          team_abbreviation: string;
        };
        Update: {
          game_status?: string;
          home_away?: string;
          opponent_abbreviation?: string;
          passing_touchdowns?: number;
          passing_yards?: number;
          player_id?: string;
          player_name?: string;
          provisional_rank?: number;
          provisional_rank_display?: string;
          provisional_rank_max?: number;
          provisional_rank_min?: number;
          provider_game_id?: string;
          provider_player_id?: string;
          snapshot_id?: string;
          sort_order?: number;
          team_abbreviation?: string;
        };
      };
      contest_provisional_stat_snapshots: {
        Row: {
          all_games_final: boolean;
          contest_id: string;
          created_at: string;
          games_final: number;
          games_in_progress: number;
          games_scheduled: number;
          games_total: number;
          metadata: Json | null;
          provider_key: string;
          provider_name: string;
          provider_snapshot_time: string;
          snapshot_id: string;
          status: string;
        };
        Insert: {
          all_games_final?: boolean;
          contest_id: string;
          created_at?: string;
          games_final?: number;
          games_in_progress?: number;
          games_scheduled?: number;
          games_total?: number;
          metadata?: Json | null;
          provider_key: string;
          provider_name: string;
          provider_snapshot_time: string;
          snapshot_id?: string;
          status?: string;
        };
        Update: {
          all_games_final?: boolean;
          contest_id?: string;
          created_at?: string;
          games_final?: number;
          games_in_progress?: number;
          games_scheduled?: number;
          games_total?: number;
          metadata?: Json | null;
          provider_key?: string;
          provider_name?: string;
          provider_snapshot_time?: string;
          snapshot_id?: string;
          status?: string;
        };
      };
      entries: {
        Row: {
          contest_id: string;
          created_at: string;
          id: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          contest_id: string;
          created_at?: string;
          id?: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          contest_id?: string;
          created_at?: string;
          id?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      entry_player_scores: {
        Row: {
          actual_rank_display: string;
          actual_rank_max: number;
          actual_rank_min: number;
          contest_id: string;
          created_at: string;
          distance: number;
          entry_id: string;
          entry_player_score_id: string;
          player_id: string;
          player_name: string;
          points_awarded: number;
          user_rank: number;
        };
        Insert: {
          actual_rank_display: string;
          actual_rank_max: number;
          actual_rank_min: number;
          contest_id: string;
          created_at?: string;
          distance: number;
          entry_id: string;
          entry_player_score_id?: string;
          player_id: string;
          player_name: string;
          points_awarded: number;
          user_rank: number;
        };
        Update: {
          actual_rank_display?: string;
          actual_rank_max?: number;
          actual_rank_min?: number;
          contest_id?: string;
          created_at?: string;
          distance?: number;
          entry_id?: string;
          entry_player_score_id?: string;
          player_id?: string;
          player_name?: string;
          points_awarded?: number;
          user_rank?: number;
        };
      };
      entry_scoring_results: {
        Row: {
          actual_qb1_distance: number | null;
          selected_qb1_passing_touchdowns: number | null;
          selected_qb2_passing_touchdowns: number | null;
          selected_qb3_passing_touchdowns: number | null;
          selected_qb4_passing_touchdowns: number | null;
          selected_qb5_passing_touchdowns: number | null;
          contest_id: string;
          created_at: string;
          entry_id: string;
          exact_picks: number;
          final_rank: number;
          final_rank_display: string;
          is_tied: boolean;
          one_off_or_better_picks: number;
          payout_amount: number;
          payout_status: string;
          score_finalized_at: string;
          scoring_version: string;
          tie_group_id: string | null;
          tie_group_size: number;
          total_score: number;
          user_id: string;
        };
        Insert: {
          actual_qb1_distance?: number | null;
          selected_qb1_passing_touchdowns?: number | null;
          selected_qb2_passing_touchdowns?: number | null;
          selected_qb3_passing_touchdowns?: number | null;
          selected_qb4_passing_touchdowns?: number | null;
          selected_qb5_passing_touchdowns?: number | null;
          contest_id: string;
          created_at?: string;
          entry_id: string;
          exact_picks?: number;
          final_rank: number;
          final_rank_display: string;
          is_tied?: boolean;
          one_off_or_better_picks?: number;
          payout_amount?: number;
          payout_status?: string;
          score_finalized_at?: string;
          scoring_version: string;
          tie_group_id?: string | null;
          tie_group_size?: number;
          total_score: number;
          user_id: string;
        };
        Update: {
          actual_qb1_distance?: number | null;
          selected_qb1_passing_touchdowns?: number | null;
          selected_qb2_passing_touchdowns?: number | null;
          selected_qb3_passing_touchdowns?: number | null;
          selected_qb4_passing_touchdowns?: number | null;
          selected_qb5_passing_touchdowns?: number | null;
          contest_id?: string;
          created_at?: string;
          entry_id?: string;
          exact_picks?: number;
          final_rank?: number;
          final_rank_display?: string;
          is_tied?: boolean;
          one_off_or_better_picks?: number;
          payout_amount?: number;
          payout_status?: string;
          score_finalized_at?: string;
          scoring_version?: string;
          tie_group_id?: string | null;
          tie_group_size?: number;
          total_score?: number;
          user_id?: string;
        };
      };
      entry_lineups: {
        Row: {
          created_at: string;
          entry_id: string;
          id: string;
          rank_position: number;
          slate_player_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          entry_id: string;
          id?: string;
          rank_position: number;
          slate_player_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          entry_id?: string;
          id?: string;
          rank_position?: number;
          slate_player_id?: string;
          updated_at?: string;
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
          account_status: string;
          age_confirmed: boolean;
          age_gate_status: string;
          created_at: string;
          date_of_birth: string | null;
          dob_captured_at: string | null;
          display_name: string | null;
          eligibility_checked_at: string | null;
          eligibility_status: string;
          id: string;
          jurisdiction: string | null;
          kyc_status: string;
          privacy_policy_accepted_at: string | null;
          restricted_at: string | null;
          restriction_reason: string | null;
          restriction_source: string | null;
          terms_accepted_at: string | null;
          updated_at: string;
          username: string | null;
        };
        Insert: {
          account_status?: string;
          age_confirmed?: boolean;
          age_gate_status?: string;
          created_at?: string;
          date_of_birth?: string | null;
          dob_captured_at?: string | null;
          display_name?: string | null;
          eligibility_checked_at?: string | null;
          eligibility_status?: string;
          id: string;
          jurisdiction?: string | null;
          kyc_status?: string;
          privacy_policy_accepted_at?: string | null;
          restricted_at?: string | null;
          restriction_reason?: string | null;
          restriction_source?: string | null;
          terms_accepted_at?: string | null;
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          account_status?: string;
          age_confirmed?: boolean;
          age_gate_status?: string;
          created_at?: string;
          date_of_birth?: string | null;
          dob_captured_at?: string | null;
          display_name?: string | null;
          eligibility_checked_at?: string | null;
          eligibility_status?: string;
          id?: string;
          jurisdiction?: string | null;
          kyc_status?: string;
          privacy_policy_accepted_at?: string | null;
          restricted_at?: string | null;
          restriction_reason?: string | null;
          restriction_source?: string | null;
          terms_accepted_at?: string | null;
          updated_at?: string;
          username?: string | null;
        };
      };
      jurisdiction_rules: {
        Row: {
          created_at: string;
          jurisdiction_code: string;
          kyc_required_for_entry: boolean;
          kyc_required_for_withdrawal: boolean;
          last_legal_review_at: string | null;
          minimum_age: number;
          notes: string | null;
          paid_entry_status: string;
          status: string;
          updated_at: string;
          withdrawal_status: string;
        };
        Insert: {
          created_at?: string;
          jurisdiction_code: string;
          kyc_required_for_entry?: boolean;
          kyc_required_for_withdrawal?: boolean;
          last_legal_review_at?: string | null;
          minimum_age?: number;
          notes?: string | null;
          paid_entry_status?: string;
          status?: string;
          updated_at?: string;
          withdrawal_status?: string;
        };
        Update: {
          created_at?: string;
          jurisdiction_code?: string;
          kyc_required_for_entry?: boolean;
          kyc_required_for_withdrawal?: boolean;
          last_legal_review_at?: string | null;
          minimum_age?: number;
          notes?: string | null;
          paid_entry_status?: string;
          status?: string;
          updated_at?: string;
          withdrawal_status?: string;
        };
      };
      responsible_play_statuses: {
        Row: {
          entry_restriction_status: string;
          restriction_reason: string | null;
          self_exclusion_ends_at: string | null;
          self_exclusion_started_at: string | null;
          self_exclusion_status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          entry_restriction_status?: string;
          restriction_reason?: string | null;
          self_exclusion_ends_at?: string | null;
          self_exclusion_started_at?: string | null;
          self_exclusion_status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          entry_restriction_status?: string;
          restriction_reason?: string | null;
          self_exclusion_ends_at?: string | null;
          self_exclusion_started_at?: string | null;
          self_exclusion_status?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      compliance_eligibility_events: {
        Row: {
          age_gate_status: string;
          created_at: string;
          eligibility_status: string;
          event_id: string;
          event_type: string;
          jurisdiction: string | null;
          kyc_status: string;
          metadata: Json;
          restriction_reason: string | null;
          self_exclusion_status: string;
          source: string;
          user_id: string;
        };
        Insert: {
          age_gate_status?: string;
          created_at?: string;
          eligibility_status?: string;
          event_id?: string;
          event_type: string;
          jurisdiction?: string | null;
          kyc_status?: string;
          metadata?: Json;
          restriction_reason?: string | null;
          self_exclusion_status?: string;
          source?: string;
          user_id: string;
        };
        Update: {
          age_gate_status?: string;
          created_at?: string;
          eligibility_status?: string;
          event_id?: string;
          event_type?: string;
          jurisdiction?: string | null;
          kyc_status?: string;
          metadata?: Json;
          restriction_reason?: string | null;
          self_exclusion_status?: string;
          source?: string;
          user_id?: string;
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
    Functions: {
      capture_profile_date_of_birth: {
        Args: { target_date_of_birth: string };
        Returns: {
          account_status: string;
          age_gate_status: string;
          date_of_birth: string;
          eligibility_status: string;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
