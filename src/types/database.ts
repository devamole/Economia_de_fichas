export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      families: {
        Row: {
          created_at: string
          created_by: string | null
          family_code: string
          id: string
          name: string
          timezone: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          family_code: string
          id?: string
          name: string
          timezone?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          family_code?: string
          id?: string
          name?: string
          timezone?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_streak: number
          display_name: string
          emoji: string | null
          family_id: string
          id: string
          last_activity_date: string | null
          locale: string
          longest_streak: number
          points_balance: number
          role: string
          streak_shield_used_at: string | null
          total_points_earned: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_streak?: number
          display_name: string
          emoji?: string | null
          family_id: string
          id: string
          last_activity_date?: string | null
          locale?: string
          longest_streak?: number
          points_balance?: number
          role: string
          streak_shield_used_at?: string | null
          total_points_earned?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_streak?: number
          display_name?: string
          emoji?: string | null
          family_id?: string
          id?: string
          last_activity_date?: string | null
          locale?: string
          longest_streak?: number
          points_balance?: number
          role?: string
          streak_shield_used_at?: string | null
          total_points_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh: string
          profile_id: string
          user_agent: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh: string
          profile_id: string
          user_agent?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh?: string
          profile_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_log: {
        Row: {
          id: string
          profile_id: string
          sent_at: string
          sent_for_date: string
          task_id: string
        }
        Insert: {
          id?: string
          profile_id: string
          sent_at?: string
          sent_for_date: string
          task_id: string
        }
        Update: {
          id?: string
          profile_id?: string
          sent_at?: string
          sent_for_date?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_redemptions: {
        Row: {
          cost_points_at_redemption: number
          id: string
          redeemed_by: string
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          reward_id: string
          status: string
        }
        Insert: {
          cost_points_at_redemption: number
          id?: string
          redeemed_by: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reward_id: string
          status?: string
        }
        Update: {
          cost_points_at_redemption?: number
          id?: string
          redeemed_by?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reward_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_redeemed_by_fkey"
            columns: ["redeemed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          active: boolean
          cost_points: number
          created_at: string
          description: string | null
          emoji: string | null
          family_id: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          cost_points: number
          created_at?: string
          description?: string | null
          emoji?: string | null
          family_id: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          cost_points?: number
          created_at?: string
          description?: string | null
          emoji?: string | null
          family_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      task_completions: {
        Row: {
          boost_type: string | null
          completed_by: string
          completion_date: string
          created_at: string
          id: string
          note: string | null
          points_awarded: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          task_id: string
        }
        Insert: {
          boost_type?: string | null
          completed_by: string
          completion_date: string
          created_at?: string
          id?: string
          note?: string | null
          points_awarded?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          task_id: string
        }
        Update: {
          boost_type?: string | null
          completed_by?: string
          completion_date?: string
          created_at?: string
          id?: string
          note?: string | null
          points_awarded?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_completions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          active: boolean
          assigned_to: string
          created_at: string
          created_by: string
          description: string | null
          due_time: string | null
          emoji: string | null
          end_date: string | null
          family_id: string
          id: string
          points: number
          recurrence_days: number[] | null
          recurrence_type: string
          requires_approval: boolean
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          assigned_to: string
          created_at?: string
          created_by: string
          description?: string | null
          due_time?: string | null
          emoji?: string | null
          end_date?: string | null
          family_id: string
          id?: string
          points: number
          recurrence_days?: number[] | null
          recurrence_type: string
          requires_approval?: boolean
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          assigned_to?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_time?: string | null
          emoji?: string | null
          end_date?: string | null
          family_id?: string
          id?: string
          points?: number
          recurrence_days?: number[] | null
          recurrence_type?: string
          requires_approval?: boolean
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          badge_key: string
          id: string
          profile_id: string
          unlocked_at: string
        }
        Insert: {
          badge_key: string
          id?: string
          profile_id: string
          unlocked_at?: string
        }
        Update: {
          badge_key?: string
          id?: string
          profile_id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_streak_shield: {
        Args: { p_date: string; p_profile_id: string }
        Returns: Json
      }
      approve_completion: {
        Args: { p_completion_id: string; p_reviewer_id: string }
        Returns: undefined
      }
      approve_redemption: {
        Args: { p_redemption_id: string; p_reviewer_id: string }
        Returns: undefined
      }
      complete_task: {
        Args: {
          p_completed_by: string
          p_completion_date: string
          p_task_id: string
        }
        Returns: Json
      }
      create_family_with_parent: {
        Args: {
          p_display_name: string
          p_family_name: string
          p_locale?: string
          p_user_id: string
        }
        Returns: string
      }
      current_user_family_id: { Args: never; Returns: string }
      current_user_role: { Args: never; Returns: string }
      lookup_family_by_code: { Args: { p_code: string }; Returns: Json }
      redeem_reward: {
        Args: { p_redeemed_by: string; p_reward_id: string }
        Returns: Json
      }
      reject_completion: {
        Args: {
          p_completion_id: string
          p_note?: string
          p_reviewer_id: string
        }
        Returns: undefined
      }
      reject_redemption: {
        Args: { p_redemption_id: string; p_reviewer_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
