/**
 * Hand-crafted Database type covering the tables and RPCs used by the
 * application. Keep in sync with supabase/migrations/. Will be replaced
 * by `pnpm db:types` output once a local Supabase instance is available
 * in CI.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type ContentStatus = 'pending' | 'approved' | 'rejected';
type UserRole = 'user' | 'moderator' | 'admin';
type MediaType = 'photo' | 'embed';
type EmbedProvider = 'instagram' | 'tiktok';
type PieceCategory =
  | 'top'
  | 'bottom'
  | 'dress'
  | 'outerwear'
  | 'shoes'
  | 'bag'
  | 'accessory'
  | 'jewelry'
  | 'headwear';
type VoteTarget = 'piece' | 'outfit';

type CityRow = {
  id: string;
  slug: string;
  name_i18n: Json;
  country_code: string;
  official_languages: string[];
  default_language: string;
  timezone: string;
  lat: number | null;
  lng: number | null;
  active: boolean;
  created_at: string;
};

type UserRow = {
  id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
  home_city_id: string | null;
  trust_score: number;
  role: UserRole;
  created_at: string;
  deleted_at: string | null;
};

type PieceRow = {
  id: string;
  author_id: string | null;
  title: string;
  description: string | null;
  category: PieceCategory;
  city_id: string;
  media_type: MediaType;
  photo_url: string | null;
  embed_url: string | null;
  embed_provider: EmbedProvider | null;
  affiliate_url: string | null;
  status: ContentStatus;
  rejected_reason: string | null;
  upvotes: number;
  downvotes: number;
  created_at: string;
  approved_at: string | null;
};

type OutfitRow = {
  id: string;
  author_id: string | null;
  title: string;
  description: string | null;
  city_id: string;
  photo_url: string;
  status: ContentStatus;
  rejected_reason: string | null;
  upvotes: number;
  downvotes: number;
  created_at: string;
  approved_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      cities: {
        Row: CityRow;
        Insert: Partial<CityRow> &
          Pick<CityRow, 'slug' | 'country_code' | 'default_language' | 'timezone'>;
        Update: Partial<CityRow>;
        Relationships: [];
      };
      users: {
        Row: UserRow;
        Insert: Partial<UserRow> & Pick<UserRow, 'id'>;
        Update: Partial<UserRow>;
        Relationships: [
          {
            foreignKeyName: 'users_home_city_id_fkey';
            columns: ['home_city_id'];
            referencedRelation: 'cities';
            referencedColumns: ['id'];
          },
        ];
      };
      pieces: {
        Row: PieceRow;
        Insert: Partial<PieceRow> &
          Pick<PieceRow, 'title' | 'category' | 'city_id' | 'media_type'>;
        Update: Partial<PieceRow>;
        Relationships: [
          {
            foreignKeyName: 'pieces_city_id_fkey';
            columns: ['city_id'];
            referencedRelation: 'cities';
            referencedColumns: ['id'];
          },
        ];
      };
      outfits: {
        Row: OutfitRow;
        Insert: Partial<OutfitRow> &
          Pick<OutfitRow, 'title' | 'city_id' | 'photo_url'>;
        Update: Partial<OutfitRow>;
        Relationships: [
          {
            foreignKeyName: 'outfits_city_id_fkey';
            columns: ['city_id'];
            referencedRelation: 'cities';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      ranked_pieces: {
        Args: { p_city_slug: string | null; p_limit: number };
        Returns: PieceRow[];
      };
      ranked_outfits: {
        Args: { p_city_slug: string | null; p_limit: number };
        Returns: OutfitRow[];
      };
      fresh_pieces: {
        Args: { p_city_slug: string | null; p_limit: number };
        Returns: PieceRow[];
      };
      fresh_outfits: {
        Args: { p_city_slug: string | null; p_limit: number };
        Returns: OutfitRow[];
      };
      vote: {
        Args: {
          p_target_type: VoteTarget;
          p_target_id: string;
          p_value: number;
        };
        Returns: void;
      };
    };
    Enums: {
      content_status: ContentStatus;
      user_role: UserRole;
      piece_category: PieceCategory;
      media_type: MediaType;
      embed_provider: EmbedProvider;
      vote_target: VoteTarget;
    };
  };
};
