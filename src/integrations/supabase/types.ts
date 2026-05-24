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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      leaderboard_entries: {
        Row: {
          best_money_won: number
          category: Database["public"]["Enums"]["question_category"] | null
          id: string
          last_updated: string
          period: Database["public"]["Enums"]["leaderboard_period"]
          previous_rank: number | null
          user_id: string
        }
        Insert: {
          best_money_won?: number
          category?: Database["public"]["Enums"]["question_category"] | null
          id?: string
          last_updated?: string
          period: Database["public"]["Enums"]["leaderboard_period"]
          previous_rank?: number | null
          user_id: string
        }
        Update: {
          best_money_won?: number
          category?: Database["public"]["Enums"]["question_category"] | null
          id?: string
          last_updated?: string
          period?: Database["public"]["Enums"]["leaderboard_period"]
          previous_rank?: number | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          access_tier: Database["public"]["Enums"]["access_tier"]
          avatar_url: string | null
          country_code: string | null
          country_detected_at: string | null
          country_name: string | null
          country_source: string | null
          created_at: string
          email: string
          free_plays_remaining: number
          id: string
          last_reset_date: string
          name: string
          premium_purchased_at: string | null
          standard_purchased_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_tier?: Database["public"]["Enums"]["access_tier"]
          avatar_url?: string | null
          country_code?: string | null
          country_detected_at?: string | null
          country_name?: string | null
          country_source?: string | null
          created_at?: string
          email: string
          free_plays_remaining?: number
          id?: string
          last_reset_date?: string
          name?: string
          premium_purchased_at?: string | null
          standard_purchased_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_tier?: Database["public"]["Enums"]["access_tier"]
          avatar_url?: string | null
          country_code?: string | null
          country_detected_at?: string | null
          country_name?: string | null
          country_source?: string | null
          created_at?: string
          email?: string
          free_plays_remaining?: number
          id?: string
          last_reset_date?: string
          name?: string
          premium_purchased_at?: string | null
          standard_purchased_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      question_pack_items: {
        Row: {
          pack_id: string
          question_id: string
        }
        Insert: {
          pack_id: string
          question_id: string
        }
        Update: {
          pack_id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_pack_items_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "question_packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_pack_items_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_pack_items_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      question_packs: {
        Row: {
          active: boolean
          category: string
          created_at: string
          difficulty_max: number
          difficulty_min: number
          ends_at: string
          id: string
          is_premium: boolean
          pack_type: string
          starts_at: string
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          difficulty_max?: number
          difficulty_min?: number
          ends_at: string
          id?: string
          is_premium?: boolean
          pack_type: string
          starts_at: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          difficulty_max?: number
          difficulty_min?: number
          ends_at?: string
          id?: string
          is_premium?: boolean
          pack_type?: string
          starts_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          category: Database["public"]["Enums"]["question_category"]
          correct_option: string
          created_at: string
          difficulty_level: number
          explanation: string | null
          id: string
          is_active: boolean
          is_premium: boolean
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          stem: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["question_category"]
          correct_option: string
          created_at?: string
          difficulty_level: number
          explanation?: string | null
          id?: string
          is_active?: boolean
          is_premium?: boolean
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          stem: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["question_category"]
          correct_option?: string
          created_at?: string
          difficulty_level?: number
          explanation?: string | null
          id?: string
          is_active?: boolean
          is_premium?: boolean
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          stem?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      quiz_runs: {
        Row: {
          answers: Json
          chosen_category:
            | Database["public"]["Enums"]["question_category"]
            | null
          completed_at: string | null
          created_at: string
          current_question_index: number
          guaranteed_money_won: number
          id: string
          lifelines_used: Json
          mode: Database["public"]["Enums"]["quiz_mode"]
          money_won: number
          outcome: Database["public"]["Enums"]["quiz_outcome"] | null
          started_at: string
          streak_at_end: number
          streak_at_start: number
          user_id: string
        }
        Insert: {
          answers?: Json
          chosen_category?:
            | Database["public"]["Enums"]["question_category"]
            | null
          completed_at?: string | null
          created_at?: string
          current_question_index?: number
          guaranteed_money_won?: number
          id?: string
          lifelines_used?: Json
          mode: Database["public"]["Enums"]["quiz_mode"]
          money_won?: number
          outcome?: Database["public"]["Enums"]["quiz_outcome"] | null
          started_at?: string
          streak_at_end?: number
          streak_at_start?: number
          user_id: string
        }
        Update: {
          answers?: Json
          chosen_category?:
            | Database["public"]["Enums"]["question_category"]
            | null
          completed_at?: string | null
          created_at?: string
          current_question_index?: number
          guaranteed_money_won?: number
          id?: string
          lifelines_used?: Json
          mode?: Database["public"]["Enums"]["quiz_mode"]
          money_won?: number
          outcome?: Database["public"]["Enums"]["quiz_outcome"] | null
          started_at?: string
          streak_at_end?: number
          streak_at_start?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_seen_questions: {
        Row: {
          category: string
          id: string
          question_id: string
          seen_at: string
          user_id: string
        }
        Insert: {
          category: string
          id?: string
          question_id: string
          seen_at?: string
          user_id: string
        }
        Update: {
          category?: string
          id?: string
          question_id?: string
          seen_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_seen_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_seen_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      all_time_hof_view: {
        Row: {
          country_code: string | null
          country_name: string | null
          display_name: string | null
          money_won: number | null
          rank: number | null
          user_id: string | null
        }
        Relationships: []
      }
      leaderboard_profiles: {
        Row: {
          avatar_url: string | null
          country_code: string | null
          name: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          country_code?: string | null
          name?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          country_code?: string | null
          name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      masters_hof_view: {
        Row: {
          category: Database["public"]["Enums"]["question_category"] | null
          country_code: string | null
          country_name: string | null
          display_name: string | null
          money_won: number | null
          rank: number | null
          user_id: string | null
        }
        Relationships: []
      }
      monthly_hof_view: {
        Row: {
          country_code: string | null
          country_name: string | null
          display_name: string | null
          money_won: number | null
          rank: number | null
          user_id: string | null
        }
        Relationships: []
      }
      question_inventory: {
        Row: {
          category: string | null
          difficulty_level: number | null
          question_count: number | null
        }
        Relationships: []
      }
      quiz_questions_public: {
        Row: {
          category: Database["public"]["Enums"]["question_category"] | null
          created_at: string | null
          difficulty_level: number | null
          id: string | null
          is_active: boolean | null
          option_a: string | null
          option_b: string | null
          option_c: string | null
          option_d: string | null
          stem: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["question_category"] | null
          created_at?: string | null
          difficulty_level?: number | null
          id?: string | null
          is_active?: boolean | null
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          stem?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["question_category"] | null
          created_at?: string | null
          difficulty_level?: number | null
          id?: string | null
          is_active?: boolean | null
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          stem?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      coalesce_category: {
        Args: { cat: Database["public"]["Enums"]["question_category"] }
        Returns: string
      }
      get_player_retention_stats: { Args: never; Returns: Json }
      get_quiz_session_questions: {
        Args: {
          p_category?: string
          p_is_premium?: boolean
          p_user_id?: string
        }
        Returns: {
          category: string
          difficulty_level: number
          id: string
          is_premium: boolean
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          pack_label: string
          round_number: number
          stem: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      refresh_leaderboards: { Args: never; Returns: undefined }
      refresh_user_leaderboard: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      verify_quiz_answer: {
        Args: { question_id: string; user_answer: string }
        Returns: {
          correct_option: string
          explanation: string
          is_correct: boolean
        }[]
      }
    }
    Enums: {
      access_tier: "free" | "standard" | "premium"
      app_role: "user" | "admin"
      leaderboard_period: "all_time" | "monthly" | "weekly"
      question_category:
        | "biology"
        | "chemistry"
        | "microbiology"
        | "data_science"
        | "medicine"
        | "gmat"
        | "gre"
        | "a_level"
        | "gcse"
        | "general_knowledge"
        | "physics"
        | "mathematics"
        | "sports"
        | "fifa_regulations"
        | "player_transfers"
        | "agent_ethics"
        | "representation_conflicts"
      quiz_mode: "category" | "wwtbam" | "fifa_exam"
      quiz_outcome: "completed" | "failed" | "quit" | "timeout"
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
    Enums: {
      access_tier: ["free", "standard", "premium"],
      app_role: ["user", "admin"],
      leaderboard_period: ["all_time", "monthly", "weekly"],
      question_category: [
        "biology",
        "chemistry",
        "microbiology",
        "data_science",
        "medicine",
        "gmat",
        "gre",
        "a_level",
        "gcse",
        "general_knowledge",
        "physics",
        "mathematics",
        "sports",
        "fifa_regulations",
        "player_transfers",
        "agent_ethics",
        "representation_conflicts",
      ],
      quiz_mode: ["category", "wwtbam", "fifa_exam"],
      quiz_outcome: ["completed", "failed", "quit", "timeout"],
    },
  },
} as const
