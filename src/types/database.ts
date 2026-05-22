export type AccountType =
  | "current"
  | "savings"
  | "credit_card"
  | "cash"
  | "business"
  | "other";

export type TransactionDirection = "income" | "expense" | "transfer";

export type RuleMatchField = "description" | "merchant_name" | "both";

export type RuleMatchType =
  | "contains"
  | "equals"
  | "starts_with"
  | "regex";

export type FinanceMode = "personal" | "self_employed" | "both";

export type ReceiptPaymentMethod =
  | "cash"
  | "card"
  | "contactless"
  | "unknown";

export type ReceiptSource = "manual" | "receipt_capture";

export type SpaceType = "personal" | "household" | "business";

export type SpaceMemberRole = "owner" | "admin" | "member";

export type SpaceMemberStatus = "active" | "invited";

export type SavingsGoalType =
  | "house_deposit"
  | "trip"
  | "emergency_fund"
  | "big_purchase"
  | "debt_payoff";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          default_currency: string;
          timezone: string;
          is_self_employed: boolean;
          finance_mode: FinanceMode;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          display_name?: string | null;
          default_currency?: string;
          timezone?: string;
          is_self_employed?: boolean;
          finance_mode?: FinanceMode;
        };
        Update: {
          display_name?: string | null;
          default_currency?: string;
          timezone?: string;
          is_self_employed?: boolean;
          finance_mode?: FinanceMode;
        };
      };
      spaces: {
        Relationships: [];
        Row: {
          id: string;
          name: string;
          type: SpaceType;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: SpaceType;
          owner_id: string;
        };
        Update: {
          name?: string;
          type?: SpaceType;
        };
      };
      space_members: {
        Relationships: [
          {
            foreignKeyName: "space_members_space_id_fkey";
            columns: ["space_id"];
            isOneToOne: false;
            referencedRelation: "spaces";
            referencedColumns: ["id"];
          },
        ];
        Row: {
          id: string;
          space_id: string;
          user_id: string | null;
          role: SpaceMemberRole;
          status: SpaceMemberStatus;
          invited_email: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          user_id?: string | null;
          role?: SpaceMemberRole;
          status?: SpaceMemberStatus;
          invited_email?: string | null;
        };
        Update: {
          user_id?: string | null;
          role?: SpaceMemberRole;
          status?: SpaceMemberStatus;
          invited_email?: string | null;
        };
      };
      budgets: {
        Relationships: [
          {
            foreignKeyName: "budgets_space_id_fkey";
            columns: ["space_id"];
            isOneToOne: false;
            referencedRelation: "spaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budget_items_budget_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "budget_items";
            referencedColumns: ["budget_id"];
          },
        ];
        Row: {
          id: string;
          user_id: string;
          space_id: string;
          month: number;
          year: number;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          space_id: string;
          month: number;
          year: number;
          name: string;
        };
        Update: {
          name?: string;
          month?: number;
          year?: number;
        };
      };
      budget_items: {
        Relationships: [
          {
            foreignKeyName: "budget_items_budget_id_fkey";
            columns: ["budget_id"];
            isOneToOne: false;
            referencedRelation: "budgets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budget_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
        Row: {
          id: string;
          budget_id: string;
          category_id: string;
          target_amount: number;
          warning_threshold: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          budget_id: string;
          category_id: string;
          target_amount: number;
          warning_threshold?: number | null;
        };
        Update: {
          target_amount?: number;
          warning_threshold?: number | null;
        };
      };
      savings_goal_details: {
        Relationships: [
          {
            foreignKeyName: "savings_goal_details_goal_id_fkey";
            columns: ["goal_id"];
            isOneToOne: true;
            referencedRelation: "savings_goals";
            referencedColumns: ["id"];
          },
        ];
        Row: {
          goal_id: string;
          goal_type: SavingsGoalType;
          notes: string | null;
          estimated_total_cost: number | null;
          deposit_percent: number | null;
          destination: string | null;
          people_count: number | null;
          priority: number;
          monthly_contribution_target: number | null;
          monthly_essential_expenses: number | null;
          target_months_cover: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          goal_id: string;
          goal_type: SavingsGoalType;
          notes?: string | null;
          estimated_total_cost?: number | null;
          deposit_percent?: number | null;
          destination?: string | null;
          people_count?: number | null;
          priority?: number;
          monthly_contribution_target?: number | null;
          monthly_essential_expenses?: number | null;
          target_months_cover?: number | null;
        };
        Update: {
          goal_type?: SavingsGoalType;
          notes?: string | null;
          estimated_total_cost?: number | null;
          deposit_percent?: number | null;
          destination?: string | null;
          people_count?: number | null;
          priority?: number;
          monthly_contribution_target?: number | null;
          monthly_essential_expenses?: number | null;
          target_months_cover?: number | null;
        };
      };
      savings_goals: {
        Relationships: [
          {
            foreignKeyName: "savings_goals_space_id_fkey";
            columns: ["space_id"];
            isOneToOne: false;
            referencedRelation: "spaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "savings_goals_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
        Row: {
          id: string;
          user_id: string;
          space_id: string;
          name: string;
          target_amount: number;
          current_amount: number;
          currency: string;
          target_date: string | null;
          account_id: string | null;
          is_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          space_id: string;
          name: string;
          target_amount: number;
          current_amount?: number;
          currency?: string;
          target_date?: string | null;
          account_id?: string | null;
          is_completed?: boolean;
        };
        Update: {
          name?: string;
          target_amount?: number;
          current_amount?: number;
          currency?: string;
          target_date?: string | null;
          account_id?: string | null;
          is_completed?: boolean;
          space_id?: string;
        };
      };
      accounts: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          name: string;
          account_type: AccountType;
          institution_name: string | null;
          currency: string;
          last_four_digits: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          account_type?: AccountType;
          institution_name?: string | null;
          currency?: string;
          last_four_digits?: string | null;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          account_type?: AccountType;
          institution_name?: string | null;
          currency?: string;
          last_four_digits?: string | null;
          is_active?: boolean;
        };
      };
      categories: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          name: string;
          slug: string;
          hmrc_category_id: string | null;
          parent_id: string | null;
          icon: string | null;
          color: string | null;
          is_allowable_expense: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          slug: string;
          hmrc_category_id?: string | null;
          parent_id?: string | null;
          icon?: string | null;
          color?: string | null;
          is_allowable_expense?: boolean;
          sort_order?: number;
        };
        Update: {
          name?: string;
          slug?: string;
          hmrc_category_id?: string | null;
          parent_id?: string | null;
          icon?: string | null;
          color?: string | null;
          is_allowable_expense?: boolean;
          sort_order?: number;
        };
      };
      hmrc_categories: {
        Relationships: [];
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          sa_box: string | null;
          is_allowable_expense: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: never;
        Update: never;
      };
      tax_years: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          label: string;
          start_date: string;
          end_date: string;
          is_current: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label: string;
          start_date: string;
          end_date: string;
          is_current?: boolean;
        };
        Update: {
          label?: string;
          start_date?: string;
          end_date?: string;
          is_current?: boolean;
        };
      };
      receipts: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          storage_path: string;
          original_filename: string | null;
          mime_type: string | null;
          file_size_bytes: number | null;
          merchant_name: string | null;
          receipt_date: string | null;
          total_amount: number | null;
          vat_amount: number | null;
          tax_year_id: string | null;
          notes: string | null;
          ocr_data: Record<string, unknown> | null;
          payment_method: ReceiptPaymentMethod | null;
          source: ReceiptSource;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          storage_path: string;
          original_filename?: string | null;
          mime_type?: string | null;
          file_size_bytes?: number | null;
          merchant_name?: string | null;
          receipt_date?: string | null;
          total_amount?: number | null;
          vat_amount?: number | null;
          tax_year_id?: string | null;
          notes?: string | null;
          ocr_data?: Record<string, unknown> | null;
          payment_method?: ReceiptPaymentMethod | null;
          source?: ReceiptSource;
        };
        Update: {
          storage_path?: string;
          original_filename?: string | null;
          mime_type?: string | null;
          file_size_bytes?: number | null;
          merchant_name?: string | null;
          receipt_date?: string | null;
          total_amount?: number | null;
          vat_amount?: number | null;
          tax_year_id?: string | null;
          notes?: string | null;
          ocr_data?: Record<string, unknown> | null;
          payment_method?: ReceiptPaymentMethod | null;
          source?: ReceiptSource;
        };
      };
      categorization_rules: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          name: string;
          priority: number;
          is_active: boolean;
          match_field: RuleMatchField;
          match_type: RuleMatchType;
          match_value: string;
          category_id: string | null;
          hmrc_category_id: string | null;
          is_business: boolean | null;
          times_matched: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          priority?: number;
          is_active?: boolean;
          match_field?: RuleMatchField;
          match_type?: RuleMatchType;
          match_value: string;
          category_id?: string | null;
          hmrc_category_id?: string | null;
          is_business?: boolean | null;
          times_matched?: number;
        };
        Update: {
          name?: string;
          priority?: number;
          is_active?: boolean;
          match_field?: RuleMatchField;
          match_type?: RuleMatchType;
          match_value?: string;
          category_id?: string | null;
          hmrc_category_id?: string | null;
          is_business?: boolean | null;
          times_matched?: number;
        };
      };
      transactions: {
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_hmrc_category_id_fkey";
            columns: ["hmrc_category_id"];
            isOneToOne: false;
            referencedRelation: "hmrc_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_tax_year_id_fkey";
            columns: ["tax_year_id"];
            isOneToOne: false;
            referencedRelation: "tax_years";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_receipt_id_fkey";
            columns: ["receipt_id"];
            isOneToOne: false;
            referencedRelation: "receipts";
            referencedColumns: ["id"];
          },
        ];
        Row: {
          id: string;
          user_id: string;
          account_id: string | null;
          transaction_date: string;
          description: string | null;
          merchant_name: string | null;
          amount: number;
          currency: string;
          direction: TransactionDirection;
          category_id: string | null;
          hmrc_category_id: string | null;
          is_business: boolean;
          business_use_percent: number | null;
          tax_year_id: string | null;
          receipt_id: string | null;
          raw_import_data: Record<string, unknown> | null;
          notes: string | null;
          ai_confidence: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id?: string | null;
          transaction_date: string;
          description?: string | null;
          merchant_name?: string | null;
          amount: number;
          currency?: string;
          direction: TransactionDirection;
          category_id?: string | null;
          hmrc_category_id?: string | null;
          is_business?: boolean;
          business_use_percent?: number | null;
          tax_year_id?: string | null;
          receipt_id?: string | null;
          raw_import_data?: Record<string, unknown> | null;
          notes?: string | null;
        };
        Update: {
          account_id?: string | null;
          transaction_date?: string;
          description?: string | null;
          merchant_name?: string | null;
          amount?: number;
          currency?: string;
          direction?: TransactionDirection;
          category_id?: string | null;
          hmrc_category_id?: string | null;
          is_business?: boolean;
          business_use_percent?: number | null;
          tax_year_id?: string | null;
          receipt_id?: string | null;
          raw_import_data?: Record<string, unknown> | null;
          notes?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      ensure_personal_space: {
        Args: { p_user_id: string };
        Returns: string;
      };
    };
    Enums: {
      account_type: AccountType;
      finance_mode: FinanceMode;
      savings_goal_type: SavingsGoalType;
      space_type: SpaceType;
      space_member_role: SpaceMemberRole;
      space_member_status: SpaceMemberStatus;
      transaction_direction: TransactionDirection;
      rule_match_field: RuleMatchField;
      rule_match_type: RuleMatchType;
    };
    CompositeTypes: Record<string, never>;
  };
}
