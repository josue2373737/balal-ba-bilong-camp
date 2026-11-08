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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      analyzed_photos: {
        Row: {
          analyzed_at: string
          photo_key: string
        }
        Insert: {
          analyzed_at?: string
          photo_key: string
        }
        Update: {
          analyzed_at?: string
          photo_key?: string
        }
        Relationships: []
      }
      app_admins: {
        Row: {
          user_id: string
        }
        Insert: {
          user_id: string
        }
        Update: {
          user_id?: string
        }
        Relationships: []
      }
      camp_memories: {
        Row: {
          approximate_year: number | null
          audio_path: string | null
          caption: string
          created_at: string
          id: string
          image_path: string
          location: string
          people: string
          story: string
          taken_on: string | null
        }
        Insert: {
          approximate_year?: number | null
          audio_path?: string | null
          caption?: string
          created_at?: string
          id?: string
          image_path: string
          location?: string
          people?: string
          story?: string
          taken_on?: string | null
        }
        Update: {
          approximate_year?: number | null
          audio_path?: string | null
          caption?: string
          created_at?: string
          id?: string
          image_path?: string
          location?: string
          people?: string
          story?: string
          taken_on?: string | null
        }
        Relationships: []
      }
      face_people: {
        Row: {
          created_at: string
          id: string
          name: string | null
          token_hash: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          token_hash: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          token_hash?: string
        }
        Relationships: []
      }
      memory_comments: {
        Row: {
          author: string
          body: string
          created_at: string
          id: string
          photo_key: string
        }
        Insert: {
          author?: string
          body: string
          created_at?: string
          id?: string
          photo_key: string
        }
        Update: {
          author?: string
          body?: string
          created_at?: string
          id?: string
          photo_key?: string
        }
        Relationships: []
      }
      memory_reactions: {
        Row: {
          created_at: string
          id: string
          kind: string
          photo_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          photo_key: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          photo_key?: string
        }
        Relationships: []
      }
      person_descriptors: {
        Row: {
          descriptor: number[]
          id: number
          person_id: string
        }
        Insert: {
          descriptor: number[]
          id?: number
          person_id: string
        }
        Update: {
          descriptor?: number[]
          id?: number
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_descriptors_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "face_people"
            referencedColumns: ["id"]
          },
        ]
      }
      person_photos: {
        Row: {
          distance: number
          face_id: number
          person_id: string
          photo_key: string
        }
        Insert: {
          distance: number
          face_id: number
          person_id: string
          photo_key: string
        }
        Update: {
          distance?: number
          face_id?: number
          person_id?: string
          photo_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_photos_face_id_fkey"
            columns: ["face_id"]
            isOneToOne: false
            referencedRelation: "photo_faces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_photos_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "face_people"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_faces: {
        Row: {
          box_h: number
          box_w: number
          box_x: number
          box_y: number
          created_at: string
          descriptor: number[]
          id: number
          photo_key: string
        }
        Insert: {
          box_h: number
          box_w: number
          box_x: number
          box_y: number
          created_at?: string
          descriptor: number[]
          id?: number
          photo_key: string
        }
        Update: {
          box_h?: number
          box_w?: number
          box_x?: number
          box_y?: number
          created_at?: string
          descriptor?: number[]
          id?: number
          photo_key?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_unanalyzed: { Args: { p_keys: string[] }; Returns: string[] }
      delete_person: {
        Args: { p_id: string; p_token?: string }
        Returns: boolean
      }
      enroll_person: {
        Args: { p_samples: Json; p_token: string }
        Returns: {
          existing: boolean
          person_id: string
        }[]
      }
      face_distance: { Args: { a: number[]; b: number[] }; Returns: number }
      face_match_threshold: { Args: never; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      list_people: {
        Args: never
        Returns: {
          cover_h: number
          cover_key: string
          cover_w: number
          cover_x: number
          cover_y: number
          id: string
          name: string
          photo_count: number
        }[]
      }
      person_photo_keys: { Args: { p_id: string }; Returns: string[] }
      rename_person: {
        Args: { p_id: string; p_name: string }
        Returns: boolean
      }
      submit_photo_faces: {
        Args: { p_faces: Json; p_key: string }
        Returns: number
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
