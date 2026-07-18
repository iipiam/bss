CREATE TABLE IF NOT EXISTS "addons" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "category" text NOT NULL,
  "price" numeric(10,2) NOT NULL,
  "base_price" numeric(10,2) NOT NULL,
  "vat_amount" numeric(10,2) NOT NULL,
  "available" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0,
  "menu_item_ids" varchar[],
  "restaurant_id" varchar,
  "inventory_item_id" text,
  PRIMARY KEY ("id")
);
ALTER TABLE "addons" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "addons" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "addons" ADD COLUMN IF NOT EXISTS "category" text;
ALTER TABLE "addons" ADD COLUMN IF NOT EXISTS "price" numeric(10,2);
ALTER TABLE "addons" ADD COLUMN IF NOT EXISTS "base_price" numeric(10,2);
ALTER TABLE "addons" ADD COLUMN IF NOT EXISTS "vat_amount" numeric(10,2);
ALTER TABLE "addons" ADD COLUMN IF NOT EXISTS "available" boolean DEFAULT true NOT NULL;
ALTER TABLE "addons" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0;
ALTER TABLE "addons" ADD COLUMN IF NOT EXISTS "menu_item_ids" varchar[];
ALTER TABLE "addons" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "addons" ADD COLUMN IF NOT EXISTS "inventory_item_id" text;
CREATE TABLE IF NOT EXISTS "assignment_history" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "assignee_type" text NOT NULL,
  "assignee_id" varchar(255) NOT NULL,
  "project_id" varchar(255) NOT NULL,
  "task_id" varchar(255),
  "phase" integer DEFAULT 1 NOT NULL,
  "role" text NOT NULL,
  "action" text NOT NULL,
  "task_name" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "assignment_history" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "assignment_history" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "assignment_history" ADD COLUMN IF NOT EXISTS "assignee_type" text;
ALTER TABLE "assignment_history" ADD COLUMN IF NOT EXISTS "assignee_id" varchar(255);
ALTER TABLE "assignment_history" ADD COLUMN IF NOT EXISTS "project_id" varchar(255);
ALTER TABLE "assignment_history" ADD COLUMN IF NOT EXISTS "task_id" varchar(255);
ALTER TABLE "assignment_history" ADD COLUMN IF NOT EXISTS "phase" integer DEFAULT 1 NOT NULL;
ALTER TABLE "assignment_history" ADD COLUMN IF NOT EXISTS "role" text;
ALTER TABLE "assignment_history" ADD COLUMN IF NOT EXISTS "action" text;
ALTER TABLE "assignment_history" ADD COLUMN IF NOT EXISTS "task_name" text;
ALTER TABLE "assignment_history" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "blogger_commission_settlements" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "blogger_id" varchar NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "scans_covered" integer NOT NULL,
  "bill_id" varchar,
  "paid_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "blogger_commission_settlements" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "blogger_commission_settlements" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "blogger_commission_settlements" ADD COLUMN IF NOT EXISTS "blogger_id" varchar;
ALTER TABLE "blogger_commission_settlements" ADD COLUMN IF NOT EXISTS "amount" numeric(12,2);
ALTER TABLE "blogger_commission_settlements" ADD COLUMN IF NOT EXISTS "scans_covered" integer;
ALTER TABLE "blogger_commission_settlements" ADD COLUMN IF NOT EXISTS "bill_id" varchar;
ALTER TABLE "blogger_commission_settlements" ADD COLUMN IF NOT EXISTS "paid_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "blogger_commission_tiers" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "blogger_id" varchar NOT NULL,
  "from_scans" integer NOT NULL,
  "to_scans" integer,
  "rate_per_scan" numeric(12,2) NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "blogger_commission_tiers" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "blogger_commission_tiers" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "blogger_commission_tiers" ADD COLUMN IF NOT EXISTS "blogger_id" varchar;
ALTER TABLE "blogger_commission_tiers" ADD COLUMN IF NOT EXISTS "from_scans" integer;
ALTER TABLE "blogger_commission_tiers" ADD COLUMN IF NOT EXISTS "to_scans" integer;
ALTER TABLE "blogger_commission_tiers" ADD COLUMN IF NOT EXISTS "rate_per_scan" numeric(12,2);
ALTER TABLE "blogger_commission_tiers" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0 NOT NULL;
CREATE TABLE IF NOT EXISTS "blogger_profiles" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "name" text NOT NULL,
  "handle" text DEFAULT ''::text NOT NULL,
  "niche" text DEFAULT 'Food'::text NOT NULL,
  "platform" text DEFAULT 'Instagram'::text NOT NULL,
  "contact_email" text DEFAULT ''::text NOT NULL,
  "contact_phone" text DEFAULT ''::text NOT NULL,
  "city" text DEFAULT ''::text NOT NULL,
  "notes" text DEFAULT ''::text NOT NULL,
  "followers" integer DEFAULT 0 NOT NULL,
  "likes" integer DEFAULT 0 NOT NULL,
  "comments" integer DEFAULT 0 NOT NULL,
  "shares" integer DEFAULT 0 NOT NULL,
  "saves" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "blogger_profiles" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "blogger_profiles" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "blogger_profiles" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "blogger_profiles" ADD COLUMN IF NOT EXISTS "handle" text DEFAULT ''::text NOT NULL;
ALTER TABLE "blogger_profiles" ADD COLUMN IF NOT EXISTS "niche" text DEFAULT 'Food'::text NOT NULL;
ALTER TABLE "blogger_profiles" ADD COLUMN IF NOT EXISTS "platform" text DEFAULT 'Instagram'::text NOT NULL;
ALTER TABLE "blogger_profiles" ADD COLUMN IF NOT EXISTS "contact_email" text DEFAULT ''::text NOT NULL;
ALTER TABLE "blogger_profiles" ADD COLUMN IF NOT EXISTS "contact_phone" text DEFAULT ''::text NOT NULL;
ALTER TABLE "blogger_profiles" ADD COLUMN IF NOT EXISTS "city" text DEFAULT ''::text NOT NULL;
ALTER TABLE "blogger_profiles" ADD COLUMN IF NOT EXISTS "notes" text DEFAULT ''::text NOT NULL;
ALTER TABLE "blogger_profiles" ADD COLUMN IF NOT EXISTS "followers" integer DEFAULT 0 NOT NULL;
ALTER TABLE "blogger_profiles" ADD COLUMN IF NOT EXISTS "likes" integer DEFAULT 0 NOT NULL;
ALTER TABLE "blogger_profiles" ADD COLUMN IF NOT EXISTS "comments" integer DEFAULT 0 NOT NULL;
ALTER TABLE "blogger_profiles" ADD COLUMN IF NOT EXISTS "shares" integer DEFAULT 0 NOT NULL;
ALTER TABLE "blogger_profiles" ADD COLUMN IF NOT EXISTS "saves" integer DEFAULT 0 NOT NULL;
ALTER TABLE "blogger_profiles" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "bootstrap_reset_tokens" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "token_hash" text NOT NULL,
  "consumed" boolean DEFAULT false NOT NULL,
  "consumed_at" timestamp without time zone,
  "consumed_by" text,
  "ip_address" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp without time zone NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "bootstrap_reset_tokens" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "bootstrap_reset_tokens" ADD COLUMN IF NOT EXISTS "token_hash" text;
ALTER TABLE "bootstrap_reset_tokens" ADD COLUMN IF NOT EXISTS "consumed" boolean DEFAULT false NOT NULL;
ALTER TABLE "bootstrap_reset_tokens" ADD COLUMN IF NOT EXISTS "consumed_at" timestamp without time zone;
ALTER TABLE "bootstrap_reset_tokens" ADD COLUMN IF NOT EXISTS "consumed_by" text;
ALTER TABLE "bootstrap_reset_tokens" ADD COLUMN IF NOT EXISTS "ip_address" text;
ALTER TABLE "bootstrap_reset_tokens" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "bootstrap_reset_tokens" ADD COLUMN IF NOT EXISTS "expires_at" timestamp without time zone;
CREATE TABLE IF NOT EXISTS "branches" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "location" text NOT NULL,
  "phone" text NOT NULL,
  "manager" text NOT NULL,
  "staff" integer DEFAULT 0 NOT NULL,
  "status" text DEFAULT 'Active'::text NOT NULL,
  "restaurant_id" varchar,
  PRIMARY KEY ("id")
);
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "location" text;
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "manager" text;
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "staff" integer DEFAULT 0 NOT NULL;
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'Active'::text NOT NULL;
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
CREATE TABLE IF NOT EXISTS "business_info" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "company_name_en" text DEFAULT 'BlindSpot System (BSS)'::text NOT NULL,
  "company_name_ar" text DEFAULT 'نظام بلايند سبوت'::text NOT NULL,
  "vat_number" text DEFAULT ''::text NOT NULL,
  "cr_number" text DEFAULT ''::text NOT NULL,
  "national_id" text DEFAULT ''::text NOT NULL,
  "email" text DEFAULT 'IT@kinbss.org'::text NOT NULL,
  "phone" text DEFAULT ''::text NOT NULL,
  "website" text DEFAULT ''::text NOT NULL,
  "address_en" text DEFAULT 'Saudi Arabia'::text NOT NULL,
  "address_ar" text DEFAULT 'المملكة العربية السعودية'::text NOT NULL,
  "city" text DEFAULT ''::text NOT NULL,
  "postal_code" text DEFAULT ''::text NOT NULL,
  "bank_name" text DEFAULT ''::text NOT NULL,
  "bank_account_name" text DEFAULT ''::text NOT NULL,
  "bank_account_number" text DEFAULT ''::text NOT NULL,
  "bank_iban" text DEFAULT ''::text NOT NULL,
  "logo_url" text,
  "updated_by" varchar,
  "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "business_info" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "business_info" ADD COLUMN IF NOT EXISTS "company_name_en" text DEFAULT 'BlindSpot System (BSS)'::text NOT NULL;
ALTER TABLE "business_info" ADD COLUMN IF NOT EXISTS "company_name_ar" text DEFAULT 'نظام بلايند سبوت'::text NOT NULL;
ALTER TABLE "business_info" ADD COLUMN IF NOT EXISTS "vat_number" text DEFAULT ''::text NOT NULL;
ALTER TABLE "business_info" ADD COLUMN IF NOT EXISTS "cr_number" text DEFAULT ''::text NOT NULL;
ALTER TABLE "business_info" ADD COLUMN IF NOT EXISTS "national_id" text DEFAULT ''::text NOT NULL;
ALTER TABLE "business_info" ADD COLUMN IF NOT EXISTS "email" text DEFAULT 'IT@kinbss.org'::text NOT NULL;
ALTER TABLE "business_info" ADD COLUMN IF NOT EXISTS "phone" text DEFAULT ''::text NOT NULL;
ALTER TABLE "business_info" ADD COLUMN IF NOT EXISTS "website" text DEFAULT ''::text NOT NULL;
ALTER TABLE "business_info" ADD COLUMN IF NOT EXISTS "address_en" text DEFAULT 'Saudi Arabia'::text NOT NULL;
ALTER TABLE "business_info" ADD COLUMN IF NOT EXISTS "address_ar" text DEFAULT 'المملكة العربية السعودية'::text NOT NULL;
ALTER TABLE "business_info" ADD COLUMN IF NOT EXISTS "city" text DEFAULT ''::text NOT NULL;
ALTER TABLE "business_info" ADD COLUMN IF NOT EXISTS "postal_code" text DEFAULT ''::text NOT NULL;
ALTER TABLE "business_info" ADD COLUMN IF NOT EXISTS "bank_name" text DEFAULT ''::text NOT NULL;
ALTER TABLE "business_info" ADD COLUMN IF NOT EXISTS "bank_account_name" text DEFAULT ''::text NOT NULL;
ALTER TABLE "business_info" ADD COLUMN IF NOT EXISTS "bank_account_number" text DEFAULT ''::text NOT NULL;
ALTER TABLE "business_info" ADD COLUMN IF NOT EXISTS "bank_iban" text DEFAULT ''::text NOT NULL;
ALTER TABLE "business_info" ADD COLUMN IF NOT EXISTS "logo_url" text;
ALTER TABLE "business_info" ADD COLUMN IF NOT EXISTS "updated_by" varchar;
ALTER TABLE "business_info" ADD COLUMN IF NOT EXISTS "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;
CREATE TABLE IF NOT EXISTS "catering_contract_templates" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "name" text NOT NULL,
  "content" text DEFAULT ''::text NOT NULL,
  "is_default" boolean DEFAULT false NOT NULL,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp without time zone DEFAULT now() NOT NULL,
  "custom_placeholders" jsonb DEFAULT '[]'::jsonb NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "catering_contract_templates" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "catering_contract_templates" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "catering_contract_templates" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "catering_contract_templates" ADD COLUMN IF NOT EXISTS "content" text DEFAULT ''::text NOT NULL;
ALTER TABLE "catering_contract_templates" ADD COLUMN IF NOT EXISTS "is_default" boolean DEFAULT false NOT NULL;
ALTER TABLE "catering_contract_templates" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "catering_contract_templates" ADD COLUMN IF NOT EXISTS "updated_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "catering_contract_templates" ADD COLUMN IF NOT EXISTS "custom_placeholders" jsonb DEFAULT '[]'::jsonb NOT NULL;
CREATE TABLE IF NOT EXISTS "catering_contracts" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "contract_number" text NOT NULL,
  "client_name" text NOT NULL,
  "client_phone" text NOT NULL,
  "client_email" text,
  "delivery_location" text,
  "meal_selections" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "meals_per_day" integer DEFAULT 1 NOT NULL,
  "delivery_days" text[] DEFAULT '{}'::text[] NOT NULL,
  "delivery_time" text,
  "start_date" timestamp without time zone NOT NULL,
  "end_date" timestamp without time zone NOT NULL,
  "total_value" numeric(12,2) DEFAULT 0 NOT NULL,
  "discount_percent" numeric(5,2) DEFAULT 0 NOT NULL,
  "final_value" numeric(12,2) DEFAULT 0 NOT NULL,
  "payment_installments" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "notes" text,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "share_token" text,
  PRIMARY KEY ("id")
);
ALTER TABLE "catering_contracts" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "catering_contracts" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "catering_contracts" ADD COLUMN IF NOT EXISTS "contract_number" text;
ALTER TABLE "catering_contracts" ADD COLUMN IF NOT EXISTS "client_name" text;
ALTER TABLE "catering_contracts" ADD COLUMN IF NOT EXISTS "client_phone" text;
ALTER TABLE "catering_contracts" ADD COLUMN IF NOT EXISTS "client_email" text;
ALTER TABLE "catering_contracts" ADD COLUMN IF NOT EXISTS "delivery_location" text;
ALTER TABLE "catering_contracts" ADD COLUMN IF NOT EXISTS "meal_selections" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "catering_contracts" ADD COLUMN IF NOT EXISTS "meals_per_day" integer DEFAULT 1 NOT NULL;
ALTER TABLE "catering_contracts" ADD COLUMN IF NOT EXISTS "delivery_days" text[] DEFAULT '{}'::text[] NOT NULL;
ALTER TABLE "catering_contracts" ADD COLUMN IF NOT EXISTS "delivery_time" text;
ALTER TABLE "catering_contracts" ADD COLUMN IF NOT EXISTS "start_date" timestamp without time zone;
ALTER TABLE "catering_contracts" ADD COLUMN IF NOT EXISTS "end_date" timestamp without time zone;
ALTER TABLE "catering_contracts" ADD COLUMN IF NOT EXISTS "total_value" numeric(12,2) DEFAULT 0 NOT NULL;
ALTER TABLE "catering_contracts" ADD COLUMN IF NOT EXISTS "discount_percent" numeric(5,2) DEFAULT 0 NOT NULL;
ALTER TABLE "catering_contracts" ADD COLUMN IF NOT EXISTS "final_value" numeric(12,2) DEFAULT 0 NOT NULL;
ALTER TABLE "catering_contracts" ADD COLUMN IF NOT EXISTS "payment_installments" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "catering_contracts" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "catering_contracts" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active'::text NOT NULL;
ALTER TABLE "catering_contracts" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "catering_contracts" ADD COLUMN IF NOT EXISTS "share_token" text;
CREATE TABLE IF NOT EXISTS "chart_of_accounts" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "name_ar" text,
  "type" text NOT NULL,
  "parent_id" varchar(255),
  "is_active" boolean DEFAULT true NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "chart_of_accounts" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "chart_of_accounts" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "chart_of_accounts" ADD COLUMN IF NOT EXISTS "code" text;
ALTER TABLE "chart_of_accounts" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "chart_of_accounts" ADD COLUMN IF NOT EXISTS "name_ar" text;
ALTER TABLE "chart_of_accounts" ADD COLUMN IF NOT EXISTS "type" text;
ALTER TABLE "chart_of_accounts" ADD COLUMN IF NOT EXISTS "parent_id" varchar(255);
ALTER TABLE "chart_of_accounts" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;
CREATE TABLE IF NOT EXISTS "chat_conversation_preferences" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "user_id" varchar NOT NULL,
  "conversation_id" varchar NOT NULL,
  "is_muted" boolean DEFAULT false NOT NULL,
  "priority" text DEFAULT 'normal'::text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "chat_conversation_preferences" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "chat_conversation_preferences" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "chat_conversation_preferences" ADD COLUMN IF NOT EXISTS "user_id" varchar;
ALTER TABLE "chat_conversation_preferences" ADD COLUMN IF NOT EXISTS "conversation_id" varchar;
ALTER TABLE "chat_conversation_preferences" ADD COLUMN IF NOT EXISTS "is_muted" boolean DEFAULT false NOT NULL;
ALTER TABLE "chat_conversation_preferences" ADD COLUMN IF NOT EXISTS "priority" text DEFAULT 'normal'::text;
ALTER TABLE "chat_conversation_preferences" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "chat_conversation_preferences" ADD COLUMN IF NOT EXISTS "updated_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "conversation_id" varchar NOT NULL,
  "sender_id" varchar,
  "sender_name" text NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "conversation_id" varchar;
ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "sender_id" varchar;
ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "sender_name" text;
ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "content" text;
ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "company_bills" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "bill_type" text NOT NULL,
  "vendor" text NOT NULL,
  "amount" numeric(10,2) NOT NULL,
  "vat_amount" numeric(10,2) DEFAULT 0 NOT NULL,
  "total_amount" numeric(10,2) NOT NULL,
  "bill_date" timestamp without time zone NOT NULL,
  "due_date" timestamp without time zone,
  "paid_date" timestamp without time zone,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "payment_period" text DEFAULT 'monthly'::text NOT NULL,
  "description" text,
  "reference_number" text,
  "attachment_path" text,
  "created_by" varchar NOT NULL,
  "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "company_bills" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "company_bills" ADD COLUMN IF NOT EXISTS "bill_type" text;
ALTER TABLE "company_bills" ADD COLUMN IF NOT EXISTS "vendor" text;
ALTER TABLE "company_bills" ADD COLUMN IF NOT EXISTS "amount" numeric(10,2);
ALTER TABLE "company_bills" ADD COLUMN IF NOT EXISTS "vat_amount" numeric(10,2) DEFAULT 0 NOT NULL;
ALTER TABLE "company_bills" ADD COLUMN IF NOT EXISTS "total_amount" numeric(10,2);
ALTER TABLE "company_bills" ADD COLUMN IF NOT EXISTS "bill_date" timestamp without time zone;
ALTER TABLE "company_bills" ADD COLUMN IF NOT EXISTS "due_date" timestamp without time zone;
ALTER TABLE "company_bills" ADD COLUMN IF NOT EXISTS "paid_date" timestamp without time zone;
ALTER TABLE "company_bills" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text NOT NULL;
ALTER TABLE "company_bills" ADD COLUMN IF NOT EXISTS "payment_period" text DEFAULT 'monthly'::text NOT NULL;
ALTER TABLE "company_bills" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "company_bills" ADD COLUMN IF NOT EXISTS "reference_number" text;
ALTER TABLE "company_bills" ADD COLUMN IF NOT EXISTS "attachment_path" text;
ALTER TABLE "company_bills" ADD COLUMN IF NOT EXISTS "created_by" varchar;
ALTER TABLE "company_bills" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE "company_bills" ADD COLUMN IF NOT EXISTS "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;
CREATE TABLE IF NOT EXISTS "company_files" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "file_type" text NOT NULL,
  "file_name" text NOT NULL,
  "file_path" text NOT NULL,
  "file_size" integer,
  "mime_type" text,
  "description" text,
  "uploaded_by" varchar,
  "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "company_files" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "company_files" ADD COLUMN IF NOT EXISTS "file_type" text;
ALTER TABLE "company_files" ADD COLUMN IF NOT EXISTS "file_name" text;
ALTER TABLE "company_files" ADD COLUMN IF NOT EXISTS "file_path" text;
ALTER TABLE "company_files" ADD COLUMN IF NOT EXISTS "file_size" integer;
ALTER TABLE "company_files" ADD COLUMN IF NOT EXISTS "mime_type" text;
ALTER TABLE "company_files" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "company_files" ADD COLUMN IF NOT EXISTS "uploaded_by" varchar;
ALTER TABLE "company_files" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE "company_files" ADD COLUMN IF NOT EXISTS "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;
CREATE TABLE IF NOT EXISTS "company_profiles" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "template" text DEFAULT 'modern'::text NOT NULL,
  "primary_color" text DEFAULT '#2563eb'::text NOT NULL,
  "secondary_color" text DEFAULT '#0f172a'::text NOT NULL,
  "accent_color" text DEFAULT '#f59e0b'::text NOT NULL,
  "company_name" text DEFAULT ''::text NOT NULL,
  "company_name_ar" text,
  "tagline" text,
  "tagline_ar" text,
  "about" text,
  "about_ar" text,
  "vision" text,
  "vision_ar" text,
  "mission" text,
  "mission_ar" text,
  "logo_data_url" text,
  "cover_data_url" text,
  "contact_email" text,
  "contact_phone" text,
  "contact_address" text,
  "contact_website" text,
  "social_linkedin" text,
  "social_instagram" text,
  "social_twitter" text,
  "core_values" jsonb DEFAULT '[]'::jsonb,
  "services" jsonb DEFAULT '[]'::jsonb,
  "achievements" jsonb DEFAULT '[]'::jsonb,
  "testimonials" jsonb DEFAULT '[]'::jsonb,
  "gallery_images" jsonb DEFAULT '[]'::jsonb,
  "language" text DEFAULT 'en'::text NOT NULL,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp without time zone DEFAULT now() NOT NULL,
  "font_family" text DEFAULT 'inter'::text NOT NULL,
  "header_style" text DEFAULT 'gradient'::text NOT NULL,
  "partners" jsonb DEFAULT '[]'::jsonb,
  "business_card" jsonb DEFAULT '{}'::jsonb,
  PRIMARY KEY ("id")
);
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "template" text DEFAULT 'modern'::text NOT NULL;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "primary_color" text DEFAULT '#2563eb'::text NOT NULL;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "secondary_color" text DEFAULT '#0f172a'::text NOT NULL;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "accent_color" text DEFAULT '#f59e0b'::text NOT NULL;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "company_name" text DEFAULT ''::text NOT NULL;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "company_name_ar" text;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "tagline" text;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "tagline_ar" text;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "about" text;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "about_ar" text;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "vision" text;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "vision_ar" text;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "mission" text;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "mission_ar" text;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "logo_data_url" text;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "cover_data_url" text;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "contact_email" text;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "contact_phone" text;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "contact_address" text;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "contact_website" text;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "social_linkedin" text;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "social_instagram" text;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "social_twitter" text;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "core_values" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "services" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "achievements" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "testimonials" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "gallery_images" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "language" text DEFAULT 'en'::text NOT NULL;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "updated_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "font_family" text DEFAULT 'inter'::text NOT NULL;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "header_style" text DEFAULT 'gradient'::text NOT NULL;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "partners" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "business_card" jsonb DEFAULT '{}'::jsonb;
CREATE TABLE IF NOT EXISTS "company_settings" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "company_name" text,
  "company_email" text,
  "company_phone" text,
  "company_address" text,
  "company_logo" text,
  "agreement_template" text,
  "agreement_placeholders" jsonb,
  "terms_and_conditions" text,
  "updated_at" timestamp without time zone DEFAULT now() NOT NULL,
  "company_documents" jsonb DEFAULT '[]'::jsonb,
  PRIMARY KEY ("id")
);
ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "company_name" text;
ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "company_email" text;
ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "company_phone" text;
ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "company_address" text;
ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "company_logo" text;
ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "agreement_template" text;
ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "agreement_placeholders" jsonb;
ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "terms_and_conditions" text;
ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "updated_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "company_documents" jsonb DEFAULT '[]'::jsonb;
CREATE TABLE IF NOT EXISTS "contractor_settlements" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "assignee_type" text NOT NULL,
  "assignee_id" varchar(255) NOT NULL,
  "project_id" varchar(255),
  "fee" numeric(12,2) NOT NULL,
  "vat_included" boolean DEFAULT false NOT NULL,
  "vat_amount" numeric(12,2) DEFAULT 0 NOT NULL,
  "total_amount" numeric(12,2) NOT NULL,
  "payment_method" text DEFAULT 'cash'::text NOT NULL,
  "notes" text,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "sent_at" timestamp without time zone,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "contractor_settlements" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "contractor_settlements" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "contractor_settlements" ADD COLUMN IF NOT EXISTS "assignee_type" text;
ALTER TABLE "contractor_settlements" ADD COLUMN IF NOT EXISTS "assignee_id" varchar(255);
ALTER TABLE "contractor_settlements" ADD COLUMN IF NOT EXISTS "project_id" varchar(255);
ALTER TABLE "contractor_settlements" ADD COLUMN IF NOT EXISTS "fee" numeric(12,2);
ALTER TABLE "contractor_settlements" ADD COLUMN IF NOT EXISTS "vat_included" boolean DEFAULT false NOT NULL;
ALTER TABLE "contractor_settlements" ADD COLUMN IF NOT EXISTS "vat_amount" numeric(12,2) DEFAULT 0 NOT NULL;
ALTER TABLE "contractor_settlements" ADD COLUMN IF NOT EXISTS "total_amount" numeric(12,2);
ALTER TABLE "contractor_settlements" ADD COLUMN IF NOT EXISTS "payment_method" text DEFAULT 'cash'::text NOT NULL;
ALTER TABLE "contractor_settlements" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "contractor_settlements" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'draft'::text NOT NULL;
ALTER TABLE "contractor_settlements" ADD COLUMN IF NOT EXISTS "sent_at" timestamp without time zone;
ALTER TABLE "contractor_settlements" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "contractors" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "name" text NOT NULL,
  "company" text,
  "phone" text,
  "email" text,
  "specialization" text,
  "license_number" text,
  "rating" numeric(3,1),
  "status" text DEFAULT 'active'::text NOT NULL,
  "notes" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "contractors" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "contractors" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "contractors" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "contractors" ADD COLUMN IF NOT EXISTS "company" text;
ALTER TABLE "contractors" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "contractors" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "contractors" ADD COLUMN IF NOT EXISTS "specialization" text;
ALTER TABLE "contractors" ADD COLUMN IF NOT EXISTS "license_number" text;
ALTER TABLE "contractors" ADD COLUMN IF NOT EXISTS "rating" numeric(3,1);
ALTER TABLE "contractors" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active'::text NOT NULL;
ALTER TABLE "contractors" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "contractors" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "contracts" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "contract_number" text NOT NULL,
  "property_id" varchar,
  "property_name" text NOT NULL,
  "client_name" text NOT NULL,
  "client_phone" text,
  "client_email" text,
  "contract_type" text NOT NULL,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "start_date" timestamp without time zone,
  "end_date" timestamp without time zone,
  "value" numeric(12,2) NOT NULL,
  "commission" numeric(10,2),
  "commission_rate" numeric(5,2),
  "notes" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "contract_number" text;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "property_id" varchar;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "property_name" text;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "client_name" text;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "client_phone" text;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "client_email" text;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "contract_type" text;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'draft'::text NOT NULL;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "start_date" timestamp without time zone;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "end_date" timestamp without time zone;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "value" numeric(12,2);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "commission" numeric(10,2);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "commission_rate" numeric(5,2);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "conversation_members" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "conversation_id" varchar NOT NULL,
  "user_id" varchar NOT NULL,
  "joined_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "conversation_members" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "conversation_members" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "conversation_members" ADD COLUMN IF NOT EXISTS "conversation_id" varchar;
ALTER TABLE "conversation_members" ADD COLUMN IF NOT EXISTS "user_id" varchar;
ALTER TABLE "conversation_members" ADD COLUMN IF NOT EXISTS "joined_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "conversations" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "type" text NOT NULL,
  "name" text,
  "scope" text NOT NULL,
  "branch_id" varchar,
  "created_by" varchar,
  "last_message_at" timestamp without time zone,
  "last_message_preview" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "participant_hash" text,
  PRIMARY KEY ("id")
);
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "type" text;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "scope" text;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "branch_id" varchar;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "created_by" varchar;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "last_message_at" timestamp without time zone;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "last_message_preview" text;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "participant_hash" text;
CREATE TABLE IF NOT EXISTS "customer_documents" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "customer_id" varchar(255) NOT NULL,
  "project_id" varchar(255),
  "kind" text DEFAULT 'other'::text NOT NULL,
  "file_name" text NOT NULL,
  "mime_type" text DEFAULT 'application/pdf'::text NOT NULL,
  "content_base64" text NOT NULL,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "customer_documents" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "customer_documents" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "customer_documents" ADD COLUMN IF NOT EXISTS "customer_id" varchar(255);
ALTER TABLE "customer_documents" ADD COLUMN IF NOT EXISTS "project_id" varchar(255);
ALTER TABLE "customer_documents" ADD COLUMN IF NOT EXISTS "kind" text DEFAULT 'other'::text NOT NULL;
ALTER TABLE "customer_documents" ADD COLUMN IF NOT EXISTS "file_name" text;
ALTER TABLE "customer_documents" ADD COLUMN IF NOT EXISTS "mime_type" text DEFAULT 'application/pdf'::text NOT NULL;
ALTER TABLE "customer_documents" ADD COLUMN IF NOT EXISTS "content_base64" text;
ALTER TABLE "customer_documents" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "customers" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "phone" text NOT NULL,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "restaurant_id" varchar,
  PRIMARY KEY ("id")
);
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
CREATE TABLE IF NOT EXISTS "delivery_apps" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "commission" numeric(5,2) NOT NULL,
  "banking_fees" numeric(5,2) NOT NULL,
  "pos_fees" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "subsidy_tiers" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "restaurant_id" varchar,
  "mark_up" numeric(5,2) DEFAULT 0 NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "delivery_apps" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "delivery_apps" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "delivery_apps" ADD COLUMN IF NOT EXISTS "commission" numeric(5,2);
ALTER TABLE "delivery_apps" ADD COLUMN IF NOT EXISTS "banking_fees" numeric(5,2);
ALTER TABLE "delivery_apps" ADD COLUMN IF NOT EXISTS "pos_fees" numeric(10,2) DEFAULT '0'::numeric NOT NULL;
ALTER TABLE "delivery_apps" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true NOT NULL;
ALTER TABLE "delivery_apps" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0;
ALTER TABLE "delivery_apps" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "delivery_apps" ADD COLUMN IF NOT EXISTS "subsidy_tiers" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "delivery_apps" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "delivery_apps" ADD COLUMN IF NOT EXISTS "mark_up" numeric(5,2) DEFAULT 0 NOT NULL;
CREATE TABLE IF NOT EXISTS "delivery_profitability" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "delivery_app_id" varchar NOT NULL,
  "year" integer NOT NULL,
  "month" integer NOT NULL,
  "period_type" text DEFAULT 'monthly'::text NOT NULL,
  "start_date" date,
  "end_date" date,
  "orders" integer DEFAULT 0 NOT NULL,
  "sales" numeric(12,2) DEFAULT 0 NOT NULL,
  "revenue" numeric(12,2) DEFAULT 0 NOT NULL,
  "commission" numeric(12,2) DEFAULT 0 NOT NULL,
  "banking" numeric(12,2) DEFAULT 0 NOT NULL,
  "subsidy" numeric(12,2) DEFAULT 0 NOT NULL,
  "vat" numeric(12,2) DEFAULT 0 NOT NULL,
  "pos_fees" numeric(12,2) DEFAULT 0 NOT NULL,
  "profit" numeric(12,2) DEFAULT 0 NOT NULL,
  "net_earnings" numeric(12,2) DEFAULT 0 NOT NULL,
  "notes" text,
  "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "delivery_profitability" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "delivery_profitability" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "delivery_profitability" ADD COLUMN IF NOT EXISTS "delivery_app_id" varchar;
ALTER TABLE "delivery_profitability" ADD COLUMN IF NOT EXISTS "year" integer;
ALTER TABLE "delivery_profitability" ADD COLUMN IF NOT EXISTS "month" integer;
ALTER TABLE "delivery_profitability" ADD COLUMN IF NOT EXISTS "period_type" text DEFAULT 'monthly'::text NOT NULL;
ALTER TABLE "delivery_profitability" ADD COLUMN IF NOT EXISTS "start_date" date;
ALTER TABLE "delivery_profitability" ADD COLUMN IF NOT EXISTS "end_date" date;
ALTER TABLE "delivery_profitability" ADD COLUMN IF NOT EXISTS "orders" integer DEFAULT 0 NOT NULL;
ALTER TABLE "delivery_profitability" ADD COLUMN IF NOT EXISTS "sales" numeric(12,2) DEFAULT 0 NOT NULL;
ALTER TABLE "delivery_profitability" ADD COLUMN IF NOT EXISTS "revenue" numeric(12,2) DEFAULT 0 NOT NULL;
ALTER TABLE "delivery_profitability" ADD COLUMN IF NOT EXISTS "commission" numeric(12,2) DEFAULT 0 NOT NULL;
ALTER TABLE "delivery_profitability" ADD COLUMN IF NOT EXISTS "banking" numeric(12,2) DEFAULT 0 NOT NULL;
ALTER TABLE "delivery_profitability" ADD COLUMN IF NOT EXISTS "subsidy" numeric(12,2) DEFAULT 0 NOT NULL;
ALTER TABLE "delivery_profitability" ADD COLUMN IF NOT EXISTS "vat" numeric(12,2) DEFAULT 0 NOT NULL;
ALTER TABLE "delivery_profitability" ADD COLUMN IF NOT EXISTS "pos_fees" numeric(12,2) DEFAULT 0 NOT NULL;
ALTER TABLE "delivery_profitability" ADD COLUMN IF NOT EXISTS "profit" numeric(12,2) DEFAULT 0 NOT NULL;
ALTER TABLE "delivery_profitability" ADD COLUMN IF NOT EXISTS "net_earnings" numeric(12,2) DEFAULT 0 NOT NULL;
ALTER TABLE "delivery_profitability" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "delivery_profitability" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE "delivery_profitability" ADD COLUMN IF NOT EXISTS "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;
CREATE TABLE IF NOT EXISTS "device_serial_numbers" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "branch_id" varchar(255),
  "branch_number" integer NOT NULL,
  "serial_number" text NOT NULL,
  "solution_name" text DEFAULT 'BSS-POS'::text NOT NULL,
  "model" text DEFAULT 'Standard'::text NOT NULL,
  "version" text DEFAULT '1.0'::text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "device_serial_numbers" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "device_serial_numbers" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "device_serial_numbers" ADD COLUMN IF NOT EXISTS "branch_id" varchar(255);
ALTER TABLE "device_serial_numbers" ADD COLUMN IF NOT EXISTS "branch_number" integer;
ALTER TABLE "device_serial_numbers" ADD COLUMN IF NOT EXISTS "serial_number" text;
ALTER TABLE "device_serial_numbers" ADD COLUMN IF NOT EXISTS "solution_name" text DEFAULT 'BSS-POS'::text NOT NULL;
ALTER TABLE "device_serial_numbers" ADD COLUMN IF NOT EXISTS "model" text DEFAULT 'Standard'::text NOT NULL;
ALTER TABLE "device_serial_numbers" ADD COLUMN IF NOT EXISTS "version" text DEFAULT '1.0'::text NOT NULL;
ALTER TABLE "device_serial_numbers" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;
ALTER TABLE "device_serial_numbers" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "employee_activity_log" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "employee_id" varchar NOT NULL,
  "employee_name" text NOT NULL,
  "action" text NOT NULL,
  "action_category" text NOT NULL,
  "description" text NOT NULL,
  "entity_type" text,
  "entity_id" text,
  "previous_data" jsonb,
  "new_data" jsonb,
  "ip_address" text,
  "branch_id" varchar,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "restaurant_id" varchar,
  PRIMARY KEY ("id")
);
ALTER TABLE "employee_activity_log" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "employee_activity_log" ADD COLUMN IF NOT EXISTS "employee_id" varchar;
ALTER TABLE "employee_activity_log" ADD COLUMN IF NOT EXISTS "employee_name" text;
ALTER TABLE "employee_activity_log" ADD COLUMN IF NOT EXISTS "action" text;
ALTER TABLE "employee_activity_log" ADD COLUMN IF NOT EXISTS "action_category" text;
ALTER TABLE "employee_activity_log" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "employee_activity_log" ADD COLUMN IF NOT EXISTS "entity_type" text;
ALTER TABLE "employee_activity_log" ADD COLUMN IF NOT EXISTS "entity_id" text;
ALTER TABLE "employee_activity_log" ADD COLUMN IF NOT EXISTS "previous_data" jsonb;
ALTER TABLE "employee_activity_log" ADD COLUMN IF NOT EXISTS "new_data" jsonb;
ALTER TABLE "employee_activity_log" ADD COLUMN IF NOT EXISTS "ip_address" text;
ALTER TABLE "employee_activity_log" ADD COLUMN IF NOT EXISTS "branch_id" varchar;
ALTER TABLE "employee_activity_log" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "employee_activity_log" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
CREATE TABLE IF NOT EXISTS "equipment_suppliers" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "company_name" text NOT NULL,
  "contact_name" text NOT NULL,
  "phone" text NOT NULL,
  "whatsapp" text,
  "email" text,
  "website" text,
  "city" text NOT NULL,
  "coverage" text,
  "cr_number" text NOT NULL,
  "cr_expiry" timestamp without time zone,
  "vat_number" text NOT NULL,
  "bank_name" text NOT NULL,
  "bank_account_name" text NOT NULL,
  "iban" text NOT NULL,
  "payment_method" text,
  "payment_terms" text,
  "tax_invoice" text,
  "fuel" text,
  "breakdown" text,
  "min_rental" text,
  "notice" text,
  "cancellation" text,
  "insurance" text,
  "notes" text,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "completion_score" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "company_name" text;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "contact_name" text;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "whatsapp" text;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "website" text;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "city" text;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "coverage" text;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "cr_number" text;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "cr_expiry" timestamp without time zone;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "vat_number" text;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "bank_name" text;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "bank_account_name" text;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "iban" text;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "payment_method" text;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "payment_terms" text;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "tax_invoice" text;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "fuel" text;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "breakdown" text;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "min_rental" text;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "notice" text;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "cancellation" text;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "insurance" text;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'draft'::text NOT NULL;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "completion_score" integer DEFAULT 0 NOT NULL;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "equipment_suppliers" ADD COLUMN IF NOT EXISTS "updated_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "equipment_types" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "name" text NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "equipment_types" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "equipment_types" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "equipment_types" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "equipment_types" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0 NOT NULL;
ALTER TABLE "equipment_types" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "factory_products" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "name" text NOT NULL,
  "category" text NOT NULL,
  "weight" text,
  "length" text,
  "product_type" text,
  "colour" text,
  "quantity" numeric(10,2) DEFAULT 0 NOT NULL,
  "thickness" text,
  "price" numeric(10,2) NOT NULL,
  "base_price" numeric(10,2) NOT NULL,
  "vat_amount" numeric(10,2) NOT NULL,
  "description" text,
  "available" boolean DEFAULT true NOT NULL,
  "image_url" text,
  PRIMARY KEY ("id")
);
ALTER TABLE "factory_products" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "factory_products" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "factory_products" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "factory_products" ADD COLUMN IF NOT EXISTS "category" text;
ALTER TABLE "factory_products" ADD COLUMN IF NOT EXISTS "weight" text;
ALTER TABLE "factory_products" ADD COLUMN IF NOT EXISTS "length" text;
ALTER TABLE "factory_products" ADD COLUMN IF NOT EXISTS "product_type" text;
ALTER TABLE "factory_products" ADD COLUMN IF NOT EXISTS "colour" text;
ALTER TABLE "factory_products" ADD COLUMN IF NOT EXISTS "quantity" numeric(10,2) DEFAULT 0 NOT NULL;
ALTER TABLE "factory_products" ADD COLUMN IF NOT EXISTS "thickness" text;
ALTER TABLE "factory_products" ADD COLUMN IF NOT EXISTS "price" numeric(10,2);
ALTER TABLE "factory_products" ADD COLUMN IF NOT EXISTS "base_price" numeric(10,2);
ALTER TABLE "factory_products" ADD COLUMN IF NOT EXISTS "vat_amount" numeric(10,2);
ALTER TABLE "factory_products" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "factory_products" ADD COLUMN IF NOT EXISTS "available" boolean DEFAULT true NOT NULL;
ALTER TABLE "factory_products" ADD COLUMN IF NOT EXISTS "image_url" text;
CREATE TABLE IF NOT EXISTS "influencer_profiles" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "username" text NOT NULL,
  "platform" text DEFAULT 'Instagram'::text NOT NULL,
  "followers" integer DEFAULT 0 NOT NULL,
  "following" integer DEFAULT 0 NOT NULL,
  "avg_likes" integer DEFAULT 0 NOT NULL,
  "avg_comments" integer DEFAULT 0 NOT NULL,
  "posts" integer DEFAULT 0 NOT NULL,
  "growth_30d" integer DEFAULT 0 NOT NULL,
  "generic_comments_pct" numeric(5,2) DEFAULT 0 NOT NULL,
  "fake_pct" numeric(5,2) DEFAULT 0 NOT NULL,
  "quality_score" integer DEFAULT 0 NOT NULL,
  "status" text DEFAULT 'review'::text NOT NULL,
  "notes" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "influencer_profiles" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "influencer_profiles" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "influencer_profiles" ADD COLUMN IF NOT EXISTS "username" text;
ALTER TABLE "influencer_profiles" ADD COLUMN IF NOT EXISTS "platform" text DEFAULT 'Instagram'::text NOT NULL;
ALTER TABLE "influencer_profiles" ADD COLUMN IF NOT EXISTS "followers" integer DEFAULT 0 NOT NULL;
ALTER TABLE "influencer_profiles" ADD COLUMN IF NOT EXISTS "following" integer DEFAULT 0 NOT NULL;
ALTER TABLE "influencer_profiles" ADD COLUMN IF NOT EXISTS "avg_likes" integer DEFAULT 0 NOT NULL;
ALTER TABLE "influencer_profiles" ADD COLUMN IF NOT EXISTS "avg_comments" integer DEFAULT 0 NOT NULL;
ALTER TABLE "influencer_profiles" ADD COLUMN IF NOT EXISTS "posts" integer DEFAULT 0 NOT NULL;
ALTER TABLE "influencer_profiles" ADD COLUMN IF NOT EXISTS "growth_30d" integer DEFAULT 0 NOT NULL;
ALTER TABLE "influencer_profiles" ADD COLUMN IF NOT EXISTS "generic_comments_pct" numeric(5,2) DEFAULT 0 NOT NULL;
ALTER TABLE "influencer_profiles" ADD COLUMN IF NOT EXISTS "fake_pct" numeric(5,2) DEFAULT 0 NOT NULL;
ALTER TABLE "influencer_profiles" ADD COLUMN IF NOT EXISTS "quality_score" integer DEFAULT 0 NOT NULL;
ALTER TABLE "influencer_profiles" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'review'::text NOT NULL;
ALTER TABLE "influencer_profiles" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "influencer_profiles" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "inventory_items" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "category" text NOT NULL,
  "quantity" numeric(10,2) NOT NULL,
  "unit" text NOT NULL,
  "supplier" text NOT NULL,
  "status" text DEFAULT 'In Stock'::text NOT NULL,
  "branch_id" varchar,
  "price" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
  "sort_order" integer DEFAULT 0,
  "restaurant_id" varchar,
  "reference_quantity" numeric(10,2) DEFAULT '1'::numeric,
  "unit_price" numeric(10,2) DEFAULT '0'::numeric,
  "expiration_days" integer,
  "purchase_date" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "category" text;
ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "quantity" numeric(10,2);
ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "unit" text;
ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "supplier" text;
ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'In Stock'::text NOT NULL;
ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "branch_id" varchar;
ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "price" numeric(10,2) DEFAULT '0'::numeric NOT NULL;
ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0;
ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "reference_quantity" numeric(10,2) DEFAULT '1'::numeric;
ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "unit_price" numeric(10,2) DEFAULT '0'::numeric;
ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "expiration_days" integer;
ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "purchase_date" timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
CREATE TABLE IF NOT EXISTS "inventory_transactions" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "inventory_item_id" varchar NOT NULL,
  "order_id" varchar,
  "type" text NOT NULL,
  "quantity_change" numeric(10,2) NOT NULL,
  "quantity_before" numeric(10,2) NOT NULL,
  "quantity_after" numeric(10,2) NOT NULL,
  "notes" text,
  "branch_id" varchar,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "restaurant_id" varchar,
  PRIMARY KEY ("id")
);
ALTER TABLE "inventory_transactions" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "inventory_transactions" ADD COLUMN IF NOT EXISTS "inventory_item_id" varchar;
ALTER TABLE "inventory_transactions" ADD COLUMN IF NOT EXISTS "order_id" varchar;
ALTER TABLE "inventory_transactions" ADD COLUMN IF NOT EXISTS "type" text;
ALTER TABLE "inventory_transactions" ADD COLUMN IF NOT EXISTS "quantity_change" numeric(10,2);
ALTER TABLE "inventory_transactions" ADD COLUMN IF NOT EXISTS "quantity_before" numeric(10,2);
ALTER TABLE "inventory_transactions" ADD COLUMN IF NOT EXISTS "quantity_after" numeric(10,2);
ALTER TABLE "inventory_transactions" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "inventory_transactions" ADD COLUMN IF NOT EXISTS "branch_id" varchar;
ALTER TABLE "inventory_transactions" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "inventory_transactions" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
CREATE TABLE IF NOT EXISTS "investment_agreement_templates" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "name" text NOT NULL,
  "content" text DEFAULT ''::text NOT NULL,
  "is_default" boolean DEFAULT false NOT NULL,
  "custom_placeholders" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "investment_agreement_templates" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "investment_agreement_templates" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "investment_agreement_templates" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "investment_agreement_templates" ADD COLUMN IF NOT EXISTS "content" text DEFAULT ''::text NOT NULL;
ALTER TABLE "investment_agreement_templates" ADD COLUMN IF NOT EXISTS "is_default" boolean DEFAULT false NOT NULL;
ALTER TABLE "investment_agreement_templates" ADD COLUMN IF NOT EXISTS "custom_placeholders" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "investment_agreement_templates" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "investment_agreement_templates" ADD COLUMN IF NOT EXISTS "updated_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "investors" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "amount_invested" numeric(12,2) NOT NULL,
  "interest_percentage" numeric(5,2) NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "notes" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "restaurant_id" varchar,
  "national_id" text,
  "contact_number" text,
  "investor_type" text DEFAULT 'money'::text,
  "recipe_id" varchar(255),
  "document_path" text,
  "document_content" text,
  "document_filename" text,
  "iban" text,
  "bank_name" text,
  "iban_certificate_content" text,
  "iban_certificate_filename" text,
  "agreement_content" text,
  "agreement_filename" text,
  "agreement_generated_at" timestamp without time zone,
  "signed_agreement_content" text,
  "signed_agreement_filename" text,
  "signed_agreement_uploaded_at" timestamp without time zone,
  PRIMARY KEY ("id")
);
ALTER TABLE "investors" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "investors" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "investors" ADD COLUMN IF NOT EXISTS "amount_invested" numeric(12,2);
ALTER TABLE "investors" ADD COLUMN IF NOT EXISTS "interest_percentage" numeric(5,2);
ALTER TABLE "investors" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true NOT NULL;
ALTER TABLE "investors" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "investors" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "investors" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "investors" ADD COLUMN IF NOT EXISTS "national_id" text;
ALTER TABLE "investors" ADD COLUMN IF NOT EXISTS "contact_number" text;
ALTER TABLE "investors" ADD COLUMN IF NOT EXISTS "investor_type" text DEFAULT 'money'::text;
ALTER TABLE "investors" ADD COLUMN IF NOT EXISTS "recipe_id" varchar(255);
ALTER TABLE "investors" ADD COLUMN IF NOT EXISTS "document_path" text;
ALTER TABLE "investors" ADD COLUMN IF NOT EXISTS "document_content" text;
ALTER TABLE "investors" ADD COLUMN IF NOT EXISTS "document_filename" text;
ALTER TABLE "investors" ADD COLUMN IF NOT EXISTS "iban" text;
ALTER TABLE "investors" ADD COLUMN IF NOT EXISTS "bank_name" text;
ALTER TABLE "investors" ADD COLUMN IF NOT EXISTS "iban_certificate_content" text;
ALTER TABLE "investors" ADD COLUMN IF NOT EXISTS "iban_certificate_filename" text;
ALTER TABLE "investors" ADD COLUMN IF NOT EXISTS "agreement_content" text;
ALTER TABLE "investors" ADD COLUMN IF NOT EXISTS "agreement_filename" text;
ALTER TABLE "investors" ADD COLUMN IF NOT EXISTS "agreement_generated_at" timestamp without time zone;
ALTER TABLE "investors" ADD COLUMN IF NOT EXISTS "signed_agreement_content" text;
ALTER TABLE "investors" ADD COLUMN IF NOT EXISTS "signed_agreement_filename" text;
ALTER TABLE "investors" ADD COLUMN IF NOT EXISTS "signed_agreement_uploaded_at" timestamp without time zone;
CREATE TABLE IF NOT EXISTS "invoice_zatca_status" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "invoice_id" varchar NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "invoice_type" text NOT NULL,
  "invoice_sub_type" text NOT NULL,
  "uuid" text NOT NULL,
  "invoice_hash" text NOT NULL,
  "invoice_counter" integer NOT NULL,
  "submission_type" text NOT NULL,
  "submission_status" text DEFAULT 'pending'::text NOT NULL,
  "zatca_request_id" text,
  "zatca_response_code" text,
  "zatca_response_message" text,
  "zatca_warnings" jsonb,
  "zatca_errors" jsonb,
  "signed_xml" text,
  "qr_code" text,
  "submitted_at" timestamp without time zone,
  "cleared_at" timestamp without time zone,
  "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "invoice_zatca_status_invoice_idx" text,
  "invoice_zatca_status_restaurant_idx" text,
  "invoice_zatca_status_status_idx" text,
  PRIMARY KEY ("id")
);
ALTER TABLE "invoice_zatca_status" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "invoice_zatca_status" ADD COLUMN IF NOT EXISTS "invoice_id" varchar;
ALTER TABLE "invoice_zatca_status" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "invoice_zatca_status" ADD COLUMN IF NOT EXISTS "invoice_type" text;
ALTER TABLE "invoice_zatca_status" ADD COLUMN IF NOT EXISTS "invoice_sub_type" text;
ALTER TABLE "invoice_zatca_status" ADD COLUMN IF NOT EXISTS "uuid" text;
ALTER TABLE "invoice_zatca_status" ADD COLUMN IF NOT EXISTS "invoice_hash" text;
ALTER TABLE "invoice_zatca_status" ADD COLUMN IF NOT EXISTS "invoice_counter" integer;
ALTER TABLE "invoice_zatca_status" ADD COLUMN IF NOT EXISTS "submission_type" text;
ALTER TABLE "invoice_zatca_status" ADD COLUMN IF NOT EXISTS "submission_status" text DEFAULT 'pending'::text NOT NULL;
ALTER TABLE "invoice_zatca_status" ADD COLUMN IF NOT EXISTS "zatca_request_id" text;
ALTER TABLE "invoice_zatca_status" ADD COLUMN IF NOT EXISTS "zatca_response_code" text;
ALTER TABLE "invoice_zatca_status" ADD COLUMN IF NOT EXISTS "zatca_response_message" text;
ALTER TABLE "invoice_zatca_status" ADD COLUMN IF NOT EXISTS "zatca_warnings" jsonb;
ALTER TABLE "invoice_zatca_status" ADD COLUMN IF NOT EXISTS "zatca_errors" jsonb;
ALTER TABLE "invoice_zatca_status" ADD COLUMN IF NOT EXISTS "signed_xml" text;
ALTER TABLE "invoice_zatca_status" ADD COLUMN IF NOT EXISTS "qr_code" text;
ALTER TABLE "invoice_zatca_status" ADD COLUMN IF NOT EXISTS "submitted_at" timestamp without time zone;
ALTER TABLE "invoice_zatca_status" ADD COLUMN IF NOT EXISTS "cleared_at" timestamp without time zone;
ALTER TABLE "invoice_zatca_status" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE "invoice_zatca_status" ADD COLUMN IF NOT EXISTS "invoice_zatca_status_invoice_idx" text;
ALTER TABLE "invoice_zatca_status" ADD COLUMN IF NOT EXISTS "invoice_zatca_status_restaurant_idx" text;
ALTER TABLE "invoice_zatca_status" ADD COLUMN IF NOT EXISTS "invoice_zatca_status_status_idx" text;
CREATE TABLE IF NOT EXISTS "invoices" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "invoice_number" text NOT NULL,
  "transaction_id" varchar,
  "order_id" varchar,
  "branch_id" varchar,
  "customer_name" text,
  "items" jsonb NOT NULL,
  "subtotal" numeric(10,2) NOT NULL,
  "vat_amount" numeric(10,2) NOT NULL,
  "total" numeric(10,2) NOT NULL,
  "qr_code" text,
  "pdf_path" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "restaurant_id" varchar,
  "document_type" text DEFAULT 'invoice'::text,
  "referenced_invoice_id" varchar(255),
  "adjustment_reason" text,
  "invoice_type" text DEFAULT 'simplified'::text NOT NULL,
  "procurement_id" varchar,
  "customer_vat_number" text,
  PRIMARY KEY ("id")
);
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "invoice_number" text;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "transaction_id" varchar;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "order_id" varchar;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "branch_id" varchar;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "customer_name" text;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "items" jsonb;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "subtotal" numeric(10,2);
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "vat_amount" numeric(10,2);
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "total" numeric(10,2);
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "qr_code" text;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "pdf_path" text;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "document_type" text DEFAULT 'invoice'::text;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "referenced_invoice_id" varchar(255);
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "adjustment_reason" text;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "invoice_type" text DEFAULT 'simplified'::text NOT NULL;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "procurement_id" varchar;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "customer_vat_number" text;
CREATE TABLE IF NOT EXISTS "journal_entries" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "entry_number" text NOT NULL,
  "entry_date" date DEFAULT CURRENT_DATE NOT NULL,
  "description" text,
  "reference_type" text,
  "reference_id" varchar(255),
  "created_by_user_id" varchar(255),
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "journal_entries" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "journal_entries" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "journal_entries" ADD COLUMN IF NOT EXISTS "entry_number" text;
ALTER TABLE "journal_entries" ADD COLUMN IF NOT EXISTS "entry_date" date DEFAULT CURRENT_DATE NOT NULL;
ALTER TABLE "journal_entries" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "journal_entries" ADD COLUMN IF NOT EXISTS "reference_type" text;
ALTER TABLE "journal_entries" ADD COLUMN IF NOT EXISTS "reference_id" varchar(255);
ALTER TABLE "journal_entries" ADD COLUMN IF NOT EXISTS "created_by_user_id" varchar(255);
ALTER TABLE "journal_entries" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "journal_lines" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "journal_entry_id" varchar(255) NOT NULL,
  "account_code" text NOT NULL,
  "account_name" text NOT NULL,
  "debit" integer DEFAULT 0 NOT NULL,
  "credit" integer DEFAULT 0 NOT NULL,
  "notes" text,
  PRIMARY KEY ("id")
);
ALTER TABLE "journal_lines" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "journal_lines" ADD COLUMN IF NOT EXISTS "journal_entry_id" varchar(255);
ALTER TABLE "journal_lines" ADD COLUMN IF NOT EXISTS "account_code" text;
ALTER TABLE "journal_lines" ADD COLUMN IF NOT EXISTS "account_name" text;
ALTER TABLE "journal_lines" ADD COLUMN IF NOT EXISTS "debit" integer DEFAULT 0 NOT NULL;
ALTER TABLE "journal_lines" ADD COLUMN IF NOT EXISTS "credit" integer DEFAULT 0 NOT NULL;
ALTER TABLE "journal_lines" ADD COLUMN IF NOT EXISTS "notes" text;
CREATE TABLE IF NOT EXISTS "licenses" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "license_type" text NOT NULL,
  "license_number" text NOT NULL,
  "license_name" text NOT NULL,
  "issuing_authority" text NOT NULL,
  "issue_date" timestamp without time zone NOT NULL,
  "expiry_date" timestamp without time zone NOT NULL,
  "status" text DEFAULT 'active'::text,
  "renewal_reminder_days" integer DEFAULT 30,
  "fee" numeric(10,2),
  "document_url" text,
  "notes" text,
  "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "created_by" varchar,
  "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_by" varchar,
  PRIMARY KEY ("id")
);
ALTER TABLE "licenses" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "licenses" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "licenses" ADD COLUMN IF NOT EXISTS "license_type" text;
ALTER TABLE "licenses" ADD COLUMN IF NOT EXISTS "license_number" text;
ALTER TABLE "licenses" ADD COLUMN IF NOT EXISTS "license_name" text;
ALTER TABLE "licenses" ADD COLUMN IF NOT EXISTS "issuing_authority" text;
ALTER TABLE "licenses" ADD COLUMN IF NOT EXISTS "issue_date" timestamp without time zone;
ALTER TABLE "licenses" ADD COLUMN IF NOT EXISTS "expiry_date" timestamp without time zone;
ALTER TABLE "licenses" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active'::text;
ALTER TABLE "licenses" ADD COLUMN IF NOT EXISTS "renewal_reminder_days" integer DEFAULT 30;
ALTER TABLE "licenses" ADD COLUMN IF NOT EXISTS "fee" numeric(10,2);
ALTER TABLE "licenses" ADD COLUMN IF NOT EXISTS "document_url" text;
ALTER TABLE "licenses" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "licenses" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE "licenses" ADD COLUMN IF NOT EXISTS "created_by" varchar;
ALTER TABLE "licenses" ADD COLUMN IF NOT EXISTS "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE "licenses" ADD COLUMN IF NOT EXISTS "updated_by" varchar;
CREATE TABLE IF NOT EXISTS "maintenance_requests" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "property_id" varchar(255) NOT NULL,
  "unit_id" varchar(255),
  "tenant_id" varchar(255),
  "title" text NOT NULL,
  "description" text,
  "category" text,
  "priority" text DEFAULT 'medium'::text NOT NULL,
  "status" text DEFAULT 'open'::text NOT NULL,
  "reported_date" date DEFAULT CURRENT_DATE NOT NULL,
  "scheduled_date" date,
  "completed_date" date,
  "assigned_to_user_id" varchar(255),
  "vendor_name" text,
  "vendor_contact" text,
  "estimated_cost" integer DEFAULT 0,
  "actual_cost" integer DEFAULT 0,
  "before_images" jsonb DEFAULT '[]'::jsonb,
  "after_images" jsonb DEFAULT '[]'::jsonb,
  "notes" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "maintenance_requests" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "maintenance_requests" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "maintenance_requests" ADD COLUMN IF NOT EXISTS "property_id" varchar(255);
ALTER TABLE "maintenance_requests" ADD COLUMN IF NOT EXISTS "unit_id" varchar(255);
ALTER TABLE "maintenance_requests" ADD COLUMN IF NOT EXISTS "tenant_id" varchar(255);
ALTER TABLE "maintenance_requests" ADD COLUMN IF NOT EXISTS "title" text;
ALTER TABLE "maintenance_requests" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "maintenance_requests" ADD COLUMN IF NOT EXISTS "category" text;
ALTER TABLE "maintenance_requests" ADD COLUMN IF NOT EXISTS "priority" text DEFAULT 'medium'::text NOT NULL;
ALTER TABLE "maintenance_requests" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'open'::text NOT NULL;
ALTER TABLE "maintenance_requests" ADD COLUMN IF NOT EXISTS "reported_date" date DEFAULT CURRENT_DATE NOT NULL;
ALTER TABLE "maintenance_requests" ADD COLUMN IF NOT EXISTS "scheduled_date" date;
ALTER TABLE "maintenance_requests" ADD COLUMN IF NOT EXISTS "completed_date" date;
ALTER TABLE "maintenance_requests" ADD COLUMN IF NOT EXISTS "assigned_to_user_id" varchar(255);
ALTER TABLE "maintenance_requests" ADD COLUMN IF NOT EXISTS "vendor_name" text;
ALTER TABLE "maintenance_requests" ADD COLUMN IF NOT EXISTS "vendor_contact" text;
ALTER TABLE "maintenance_requests" ADD COLUMN IF NOT EXISTS "estimated_cost" integer DEFAULT 0;
ALTER TABLE "maintenance_requests" ADD COLUMN IF NOT EXISTS "actual_cost" integer DEFAULT 0;
ALTER TABLE "maintenance_requests" ADD COLUMN IF NOT EXISTS "before_images" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "maintenance_requests" ADD COLUMN IF NOT EXISTS "after_images" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "maintenance_requests" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "maintenance_requests" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "marketing_broadcast_templates" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "name" text NOT NULL,
  "segment" text DEFAULT 'all'::text NOT NULL,
  "message" text NOT NULL,
  "menu_pdf_url" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "marketing_broadcast_templates" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "marketing_broadcast_templates" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "marketing_broadcast_templates" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "marketing_broadcast_templates" ADD COLUMN IF NOT EXISTS "segment" text DEFAULT 'all'::text NOT NULL;
ALTER TABLE "marketing_broadcast_templates" ADD COLUMN IF NOT EXISTS "message" text;
ALTER TABLE "marketing_broadcast_templates" ADD COLUMN IF NOT EXISTS "menu_pdf_url" text;
ALTER TABLE "marketing_broadcast_templates" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "marketing_discount_codes" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "code" text NOT NULL,
  "discount_type" text NOT NULL,
  "discount_value" numeric(12,2) NOT NULL,
  "expires_at" timestamp without time zone,
  "usage_cap" integer,
  "usage_count" integer DEFAULT 0 NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "notes" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "marketing_discount_codes" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "marketing_discount_codes" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "marketing_discount_codes" ADD COLUMN IF NOT EXISTS "code" text;
ALTER TABLE "marketing_discount_codes" ADD COLUMN IF NOT EXISTS "discount_type" text;
ALTER TABLE "marketing_discount_codes" ADD COLUMN IF NOT EXISTS "discount_value" numeric(12,2);
ALTER TABLE "marketing_discount_codes" ADD COLUMN IF NOT EXISTS "expires_at" timestamp without time zone;
ALTER TABLE "marketing_discount_codes" ADD COLUMN IF NOT EXISTS "usage_cap" integer;
ALTER TABLE "marketing_discount_codes" ADD COLUMN IF NOT EXISTS "usage_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "marketing_discount_codes" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true NOT NULL;
ALTER TABLE "marketing_discount_codes" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "marketing_discount_codes" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "marketing_fin_scenarios" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "name" text NOT NULL,
  "data" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "marketing_fin_scenarios" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "marketing_fin_scenarios" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "marketing_fin_scenarios" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "marketing_fin_scenarios" ADD COLUMN IF NOT EXISTS "data" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "marketing_fin_scenarios" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "marketing_fin_settings" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "min_margin_pct" numeric(5,2) DEFAULT 20 NOT NULL,
  "max_break_even_units" numeric(12,2) DEFAULT 1000 NOT NULL,
  "alerts_enabled" boolean DEFAULT true NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "marketing_fin_settings" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "marketing_fin_settings" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "marketing_fin_settings" ADD COLUMN IF NOT EXISTS "min_margin_pct" numeric(5,2) DEFAULT 20 NOT NULL;
ALTER TABLE "marketing_fin_settings" ADD COLUMN IF NOT EXISTS "max_break_even_units" numeric(12,2) DEFAULT 1000 NOT NULL;
ALTER TABLE "marketing_fin_settings" ADD COLUMN IF NOT EXISTS "alerts_enabled" boolean DEFAULT true NOT NULL;
CREATE TABLE IF NOT EXISTS "marketing_fin_snapshots" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "product_name" text NOT NULL,
  "gross_margin_pct" numeric(8,2) DEFAULT 0 NOT NULL,
  "break_even_units" numeric(12,2) DEFAULT 0 NOT NULL,
  "break_even_revenue" numeric(14,2) DEFAULT 0 NOT NULL,
  "monthly_profit" numeric(14,2) DEFAULT 0 NOT NULL,
  "roi_pct" numeric(10,2) DEFAULT 0 NOT NULL,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "marketing_fin_snapshots" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "marketing_fin_snapshots" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "marketing_fin_snapshots" ADD COLUMN IF NOT EXISTS "product_name" text;
ALTER TABLE "marketing_fin_snapshots" ADD COLUMN IF NOT EXISTS "gross_margin_pct" numeric(8,2) DEFAULT 0 NOT NULL;
ALTER TABLE "marketing_fin_snapshots" ADD COLUMN IF NOT EXISTS "break_even_units" numeric(12,2) DEFAULT 0 NOT NULL;
ALTER TABLE "marketing_fin_snapshots" ADD COLUMN IF NOT EXISTS "break_even_revenue" numeric(14,2) DEFAULT 0 NOT NULL;
ALTER TABLE "marketing_fin_snapshots" ADD COLUMN IF NOT EXISTS "monthly_profit" numeric(14,2) DEFAULT 0 NOT NULL;
ALTER TABLE "marketing_fin_snapshots" ADD COLUMN IF NOT EXISTS "roi_pct" numeric(10,2) DEFAULT 0 NOT NULL;
ALTER TABLE "marketing_fin_snapshots" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "marketing_qr_scans" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "target_type" text NOT NULL,
  "target_id" varchar NOT NULL,
  "source" text DEFAULT 'camera'::text NOT NULL,
  "order_id" varchar,
  "scanned_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "marketing_qr_scans" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "marketing_qr_scans" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "marketing_qr_scans" ADD COLUMN IF NOT EXISTS "target_type" text;
ALTER TABLE "marketing_qr_scans" ADD COLUMN IF NOT EXISTS "target_id" varchar;
ALTER TABLE "marketing_qr_scans" ADD COLUMN IF NOT EXISTS "source" text DEFAULT 'camera'::text NOT NULL;
ALTER TABLE "marketing_qr_scans" ADD COLUMN IF NOT EXISTS "order_id" varchar;
ALTER TABLE "marketing_qr_scans" ADD COLUMN IF NOT EXISTS "scanned_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "meal_subscriptions" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "subscriber_name" text NOT NULL,
  "subscriber_phone" text NOT NULL,
  "subscriber_email" text,
  "delivery_address" text,
  "dietary_notes" text,
  "meal_selections" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "plan_type" text DEFAULT 'daily'::text NOT NULL,
  "schedule_days" text[] DEFAULT '{}'::text[] NOT NULL,
  "meal_time" text DEFAULT 'lunch'::text NOT NULL,
  "start_date" timestamp without time zone NOT NULL,
  "end_date" timestamp without time zone,
  "amount" numeric(10,2) DEFAULT 0 NOT NULL,
  "payment_status" text DEFAULT 'pending'::text NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "notes" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "delivery_log" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "delivery_hours" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "credit_balance" numeric(10,2) DEFAULT 0 NOT NULL,
  "number_of_days" integer,
  "discount_type" text DEFAULT 'percent'::text NOT NULL,
  "discount_value" numeric(10,2) DEFAULT 0 NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "meal_subscriptions" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "meal_subscriptions" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "meal_subscriptions" ADD COLUMN IF NOT EXISTS "subscriber_name" text;
ALTER TABLE "meal_subscriptions" ADD COLUMN IF NOT EXISTS "subscriber_phone" text;
ALTER TABLE "meal_subscriptions" ADD COLUMN IF NOT EXISTS "subscriber_email" text;
ALTER TABLE "meal_subscriptions" ADD COLUMN IF NOT EXISTS "delivery_address" text;
ALTER TABLE "meal_subscriptions" ADD COLUMN IF NOT EXISTS "dietary_notes" text;
ALTER TABLE "meal_subscriptions" ADD COLUMN IF NOT EXISTS "meal_selections" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "meal_subscriptions" ADD COLUMN IF NOT EXISTS "plan_type" text DEFAULT 'daily'::text NOT NULL;
ALTER TABLE "meal_subscriptions" ADD COLUMN IF NOT EXISTS "schedule_days" text[] DEFAULT '{}'::text[] NOT NULL;
ALTER TABLE "meal_subscriptions" ADD COLUMN IF NOT EXISTS "meal_time" text DEFAULT 'lunch'::text NOT NULL;
ALTER TABLE "meal_subscriptions" ADD COLUMN IF NOT EXISTS "start_date" timestamp without time zone;
ALTER TABLE "meal_subscriptions" ADD COLUMN IF NOT EXISTS "end_date" timestamp without time zone;
ALTER TABLE "meal_subscriptions" ADD COLUMN IF NOT EXISTS "amount" numeric(10,2) DEFAULT 0 NOT NULL;
ALTER TABLE "meal_subscriptions" ADD COLUMN IF NOT EXISTS "payment_status" text DEFAULT 'pending'::text NOT NULL;
ALTER TABLE "meal_subscriptions" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active'::text NOT NULL;
ALTER TABLE "meal_subscriptions" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "meal_subscriptions" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "meal_subscriptions" ADD COLUMN IF NOT EXISTS "delivery_log" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "meal_subscriptions" ADD COLUMN IF NOT EXISTS "delivery_hours" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "meal_subscriptions" ADD COLUMN IF NOT EXISTS "credit_balance" numeric(10,2) DEFAULT 0 NOT NULL;
ALTER TABLE "meal_subscriptions" ADD COLUMN IF NOT EXISTS "number_of_days" integer;
ALTER TABLE "meal_subscriptions" ADD COLUMN IF NOT EXISTS "discount_type" text DEFAULT 'percent'::text NOT NULL;
ALTER TABLE "meal_subscriptions" ADD COLUMN IF NOT EXISTS "discount_value" numeric(10,2) DEFAULT 0 NOT NULL;
CREATE TABLE IF NOT EXISTS "menu_categories" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "name" text NOT NULL,
  "sort_order" integer DEFAULT 0,
  PRIMARY KEY ("id")
);
ALTER TABLE "menu_categories" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "menu_categories" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "menu_categories" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "menu_categories" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0;
CREATE TABLE IF NOT EXISTS "menu_items" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "category" text NOT NULL,
  "price" numeric(10,2) NOT NULL,
  "base_price" numeric(10,2) NOT NULL,
  "vat_amount" numeric(10,2) NOT NULL,
  "description" text,
  "available" boolean DEFAULT true NOT NULL,
  "image_url" text,
  "discount" numeric(5,2) DEFAULT '0'::numeric NOT NULL,
  "recipe_id" varchar,
  "stock_no" numeric(10,2),
  "portion_size" numeric(5,2) DEFAULT 1.00,
  "inventory_item_id" varchar,
  "restaurant_id" varchar,
  "display_size" text DEFAULT 'medium'::text,
  PRIMARY KEY ("id")
);
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "category" text;
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "price" numeric(10,2);
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "base_price" numeric(10,2);
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "vat_amount" numeric(10,2);
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "available" boolean DEFAULT true NOT NULL;
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "image_url" text;
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "discount" numeric(5,2) DEFAULT '0'::numeric NOT NULL;
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "recipe_id" varchar;
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "stock_no" numeric(10,2);
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "portion_size" numeric(5,2) DEFAULT 1.00;
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "inventory_item_id" varchar;
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "display_size" text DEFAULT 'medium'::text;
CREATE TABLE IF NOT EXISTS "message_reads" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "conversation_id" varchar NOT NULL,
  "user_id" varchar NOT NULL,
  "last_read_message_id" varchar,
  "last_read_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "message_reads" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "message_reads" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "message_reads" ADD COLUMN IF NOT EXISTS "conversation_id" varchar;
ALTER TABLE "message_reads" ADD COLUMN IF NOT EXISTS "user_id" varchar;
ALTER TABLE "message_reads" ADD COLUMN IF NOT EXISTS "last_read_message_id" varchar;
ALTER TABLE "message_reads" ADD COLUMN IF NOT EXISTS "last_read_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "monthly_vat_reports" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "report_month" integer NOT NULL,
  "report_year" integer NOT NULL,
  "serial_number" text NOT NULL,
  "total_sales" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
  "total_sales_base_amount" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
  "total_sales_vat" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
  "total_purchases" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
  "total_purchases_base_amount" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
  "total_purchases_vat" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
  "net_vat_payable" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
  "generated_at" timestamp without time zone DEFAULT now() NOT NULL,
  "pdf_path" text,
  "qr_code" text,
  PRIMARY KEY ("id")
);
ALTER TABLE "monthly_vat_reports" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "monthly_vat_reports" ADD COLUMN IF NOT EXISTS "user_id" varchar;
ALTER TABLE "monthly_vat_reports" ADD COLUMN IF NOT EXISTS "report_month" integer;
ALTER TABLE "monthly_vat_reports" ADD COLUMN IF NOT EXISTS "report_year" integer;
ALTER TABLE "monthly_vat_reports" ADD COLUMN IF NOT EXISTS "serial_number" text;
ALTER TABLE "monthly_vat_reports" ADD COLUMN IF NOT EXISTS "total_sales" numeric(12,2) DEFAULT '0'::numeric NOT NULL;
ALTER TABLE "monthly_vat_reports" ADD COLUMN IF NOT EXISTS "total_sales_base_amount" numeric(12,2) DEFAULT '0'::numeric NOT NULL;
ALTER TABLE "monthly_vat_reports" ADD COLUMN IF NOT EXISTS "total_sales_vat" numeric(12,2) DEFAULT '0'::numeric NOT NULL;
ALTER TABLE "monthly_vat_reports" ADD COLUMN IF NOT EXISTS "total_purchases" numeric(12,2) DEFAULT '0'::numeric NOT NULL;
ALTER TABLE "monthly_vat_reports" ADD COLUMN IF NOT EXISTS "total_purchases_base_amount" numeric(12,2) DEFAULT '0'::numeric NOT NULL;
ALTER TABLE "monthly_vat_reports" ADD COLUMN IF NOT EXISTS "total_purchases_vat" numeric(12,2) DEFAULT '0'::numeric NOT NULL;
ALTER TABLE "monthly_vat_reports" ADD COLUMN IF NOT EXISTS "net_vat_payable" numeric(12,2) DEFAULT '0'::numeric NOT NULL;
ALTER TABLE "monthly_vat_reports" ADD COLUMN IF NOT EXISTS "generated_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "monthly_vat_reports" ADD COLUMN IF NOT EXISTS "pdf_path" text;
ALTER TABLE "monthly_vat_reports" ADD COLUMN IF NOT EXISTS "qr_code" text;
CREATE TABLE IF NOT EXISTS "moyasar_payments" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "moyasar_id" text NOT NULL,
  "order_id" varchar,
  "transaction_id" varchar,
  "amount" numeric(10,2) NOT NULL,
  "amount_halalas" integer NOT NULL,
  "currency" text DEFAULT 'SAR'::text NOT NULL,
  "status" text NOT NULL,
  "payment_method" text,
  "card_brand" text,
  "card_last4" text,
  "fee" numeric(10,2),
  "refunded_amount" numeric(10,2) DEFAULT '0'::numeric,
  "description" text,
  "customer_name" text,
  "customer_email" text,
  "customer_phone" text,
  "callback_url" text,
  "metadata" jsonb,
  "error_message" text,
  "branch_id" varchar,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp without time zone DEFAULT now() NOT NULL,
  "restaurant_id" varchar,
  PRIMARY KEY ("id")
);
ALTER TABLE "moyasar_payments" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "moyasar_payments" ADD COLUMN IF NOT EXISTS "moyasar_id" text;
ALTER TABLE "moyasar_payments" ADD COLUMN IF NOT EXISTS "order_id" varchar;
ALTER TABLE "moyasar_payments" ADD COLUMN IF NOT EXISTS "transaction_id" varchar;
ALTER TABLE "moyasar_payments" ADD COLUMN IF NOT EXISTS "amount" numeric(10,2);
ALTER TABLE "moyasar_payments" ADD COLUMN IF NOT EXISTS "amount_halalas" integer;
ALTER TABLE "moyasar_payments" ADD COLUMN IF NOT EXISTS "currency" text DEFAULT 'SAR'::text NOT NULL;
ALTER TABLE "moyasar_payments" ADD COLUMN IF NOT EXISTS "status" text;
ALTER TABLE "moyasar_payments" ADD COLUMN IF NOT EXISTS "payment_method" text;
ALTER TABLE "moyasar_payments" ADD COLUMN IF NOT EXISTS "card_brand" text;
ALTER TABLE "moyasar_payments" ADD COLUMN IF NOT EXISTS "card_last4" text;
ALTER TABLE "moyasar_payments" ADD COLUMN IF NOT EXISTS "fee" numeric(10,2);
ALTER TABLE "moyasar_payments" ADD COLUMN IF NOT EXISTS "refunded_amount" numeric(10,2) DEFAULT '0'::numeric;
ALTER TABLE "moyasar_payments" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "moyasar_payments" ADD COLUMN IF NOT EXISTS "customer_name" text;
ALTER TABLE "moyasar_payments" ADD COLUMN IF NOT EXISTS "customer_email" text;
ALTER TABLE "moyasar_payments" ADD COLUMN IF NOT EXISTS "customer_phone" text;
ALTER TABLE "moyasar_payments" ADD COLUMN IF NOT EXISTS "callback_url" text;
ALTER TABLE "moyasar_payments" ADD COLUMN IF NOT EXISTS "metadata" jsonb;
ALTER TABLE "moyasar_payments" ADD COLUMN IF NOT EXISTS "error_message" text;
ALTER TABLE "moyasar_payments" ADD COLUMN IF NOT EXISTS "branch_id" varchar;
ALTER TABLE "moyasar_payments" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "moyasar_payments" ADD COLUMN IF NOT EXISTS "updated_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "moyasar_payments" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
CREATE TABLE IF NOT EXISTS "orders" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "order_number" text NOT NULL,
  "branch_id" varchar,
  "customer_name" text,
  "order_type" text NOT NULL,
  "table" text,
  "address" text,
  "items" jsonb NOT NULL,
  "subtotal" numeric(10,2) NOT NULL,
  "tax" numeric(10,2) NOT NULL,
  "total" numeric(10,2) NOT NULL,
  "status" text DEFAULT 'Pending'::text NOT NULL,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "customer_id" varchar,
  "customer_phone" text,
  "payment_method" text DEFAULT 'Cash'::text NOT NULL,
  "delivery_app_id" varchar,
  "earnings_decrease_applied" boolean DEFAULT false NOT NULL,
  "payment_status" text DEFAULT 'Unpaid'::text,
  "moyasar_payment_id" text,
  "restaurant_id" varchar,
  "created_by" text,
  "discount_code" text,
  "discount_amount" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "order_number" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "branch_id" varchar;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_name" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "order_type" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "table" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "address" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "items" jsonb;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "subtotal" numeric(10,2);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tax" numeric(10,2);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "total" numeric(10,2);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'Pending'::text NOT NULL;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_id" varchar;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_phone" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_method" text DEFAULT 'Cash'::text NOT NULL;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "delivery_app_id" varchar;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "earnings_decrease_applied" boolean DEFAULT false NOT NULL;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_status" text DEFAULT 'Unpaid'::text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "moyasar_payment_id" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "created_by" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "discount_code" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "discount_amount" numeric(10,2) DEFAULT '0'::numeric NOT NULL;
CREATE TABLE IF NOT EXISTS "payment_schedules" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "project_id" varchar NOT NULL,
  "milestone_name" text NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "due_date" timestamp without time zone,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "paid_date" timestamp without time zone,
  "notes" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "invoice_id" varchar(255),
  "transaction_id" varchar(255),
  "phase" integer DEFAULT 1 NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "payment_schedules" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "payment_schedules" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "payment_schedules" ADD COLUMN IF NOT EXISTS "project_id" varchar;
ALTER TABLE "payment_schedules" ADD COLUMN IF NOT EXISTS "milestone_name" text;
ALTER TABLE "payment_schedules" ADD COLUMN IF NOT EXISTS "amount" numeric(12,2);
ALTER TABLE "payment_schedules" ADD COLUMN IF NOT EXISTS "due_date" timestamp without time zone;
ALTER TABLE "payment_schedules" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text NOT NULL;
ALTER TABLE "payment_schedules" ADD COLUMN IF NOT EXISTS "paid_date" timestamp without time zone;
ALTER TABLE "payment_schedules" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "payment_schedules" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "payment_schedules" ADD COLUMN IF NOT EXISTS "invoice_id" varchar(255);
ALTER TABLE "payment_schedules" ADD COLUMN IF NOT EXISTS "transaction_id" varchar(255);
ALTER TABLE "payment_schedules" ADD COLUMN IF NOT EXISTS "phase" integer DEFAULT 1 NOT NULL;
CREATE TABLE IF NOT EXISTS "pending_signups" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "geidea_session_id" text NOT NULL,
  "merchant_reference_id" text NOT NULL,
  "username" text NOT NULL,
  "password_hash" text NOT NULL,
  "full_name" text NOT NULL,
  "email" text NOT NULL,
  "restaurant_name" text NOT NULL,
  "national_id" text NOT NULL,
  "has_vat_registration" boolean DEFAULT true NOT NULL,
  "tax_number" text,
  "commercial_registration" text NOT NULL,
  "business_type" text NOT NULL,
  "restaurant_type" text NOT NULL,
  "subscription_plan" text NOT NULL,
  "branches_count" integer NOT NULL,
  "amount" numeric(10,2) NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "uploaded_files" jsonb,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp without time zone NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "pending_signups" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "pending_signups" ADD COLUMN IF NOT EXISTS "geidea_session_id" text;
ALTER TABLE "pending_signups" ADD COLUMN IF NOT EXISTS "merchant_reference_id" text;
ALTER TABLE "pending_signups" ADD COLUMN IF NOT EXISTS "username" text;
ALTER TABLE "pending_signups" ADD COLUMN IF NOT EXISTS "password_hash" text;
ALTER TABLE "pending_signups" ADD COLUMN IF NOT EXISTS "full_name" text;
ALTER TABLE "pending_signups" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "pending_signups" ADD COLUMN IF NOT EXISTS "restaurant_name" text;
ALTER TABLE "pending_signups" ADD COLUMN IF NOT EXISTS "national_id" text;
ALTER TABLE "pending_signups" ADD COLUMN IF NOT EXISTS "has_vat_registration" boolean DEFAULT true NOT NULL;
ALTER TABLE "pending_signups" ADD COLUMN IF NOT EXISTS "tax_number" text;
ALTER TABLE "pending_signups" ADD COLUMN IF NOT EXISTS "commercial_registration" text;
ALTER TABLE "pending_signups" ADD COLUMN IF NOT EXISTS "business_type" text;
ALTER TABLE "pending_signups" ADD COLUMN IF NOT EXISTS "restaurant_type" text;
ALTER TABLE "pending_signups" ADD COLUMN IF NOT EXISTS "subscription_plan" text;
ALTER TABLE "pending_signups" ADD COLUMN IF NOT EXISTS "branches_count" integer;
ALTER TABLE "pending_signups" ADD COLUMN IF NOT EXISTS "amount" numeric(10,2);
ALTER TABLE "pending_signups" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text NOT NULL;
ALTER TABLE "pending_signups" ADD COLUMN IF NOT EXISTS "uploaded_files" jsonb;
ALTER TABLE "pending_signups" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "pending_signups" ADD COLUMN IF NOT EXISTS "expires_at" timestamp without time zone;
CREATE TABLE IF NOT EXISTS "printers" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "branch_id" varchar,
  "name" text NOT NULL,
  "printer_type" text NOT NULL,
  "connection_type" text NOT NULL,
  "ip_address" text,
  "port" integer DEFAULT 9100,
  "device_name" text,
  "brand" text,
  "model" text,
  "paper_width" integer DEFAULT 80,
  "is_default" boolean DEFAULT false NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "printers" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "printers" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "printers" ADD COLUMN IF NOT EXISTS "branch_id" varchar;
ALTER TABLE "printers" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "printers" ADD COLUMN IF NOT EXISTS "printer_type" text;
ALTER TABLE "printers" ADD COLUMN IF NOT EXISTS "connection_type" text;
ALTER TABLE "printers" ADD COLUMN IF NOT EXISTS "ip_address" text;
ALTER TABLE "printers" ADD COLUMN IF NOT EXISTS "port" integer DEFAULT 9100;
ALTER TABLE "printers" ADD COLUMN IF NOT EXISTS "device_name" text;
ALTER TABLE "printers" ADD COLUMN IF NOT EXISTS "brand" text;
ALTER TABLE "printers" ADD COLUMN IF NOT EXISTS "model" text;
ALTER TABLE "printers" ADD COLUMN IF NOT EXISTS "paper_width" integer DEFAULT 80;
ALTER TABLE "printers" ADD COLUMN IF NOT EXISTS "is_default" boolean DEFAULT false NOT NULL;
ALTER TABLE "printers" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;
ALTER TABLE "printers" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE "printers" ADD COLUMN IF NOT EXISTS "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;
CREATE TABLE IF NOT EXISTS "procurement" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "supplier" text,
  "category" text,
  "quantity" integer,
  "unit_price" text,
  "total_cost" text NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "priority" text DEFAULT 'medium'::text NOT NULL,
  "requested_by" text,
  "approved_by" text,
  "branch_id" varchar,
  "order_date" timestamp without time zone,
  "expected_delivery" timestamp without time zone,
  "actual_delivery" timestamp without time zone,
  "notes" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp without time zone DEFAULT now() NOT NULL,
  "restaurant_id" varchar,
  "inventory_item_id" varchar(255),
  "original_procurement_id" varchar(255),
  "unit" text,
  "invoice_image" text,
  "bill_id" varchar,
  PRIMARY KEY ("id")
);
ALTER TABLE "procurement" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "procurement" ADD COLUMN IF NOT EXISTS "type" text;
ALTER TABLE "procurement" ADD COLUMN IF NOT EXISTS "title" text;
ALTER TABLE "procurement" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "procurement" ADD COLUMN IF NOT EXISTS "supplier" text;
ALTER TABLE "procurement" ADD COLUMN IF NOT EXISTS "category" text;
ALTER TABLE "procurement" ADD COLUMN IF NOT EXISTS "quantity" integer;
ALTER TABLE "procurement" ADD COLUMN IF NOT EXISTS "unit_price" text;
ALTER TABLE "procurement" ADD COLUMN IF NOT EXISTS "total_cost" text;
ALTER TABLE "procurement" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text NOT NULL;
ALTER TABLE "procurement" ADD COLUMN IF NOT EXISTS "priority" text DEFAULT 'medium'::text NOT NULL;
ALTER TABLE "procurement" ADD COLUMN IF NOT EXISTS "requested_by" text;
ALTER TABLE "procurement" ADD COLUMN IF NOT EXISTS "approved_by" text;
ALTER TABLE "procurement" ADD COLUMN IF NOT EXISTS "branch_id" varchar;
ALTER TABLE "procurement" ADD COLUMN IF NOT EXISTS "order_date" timestamp without time zone;
ALTER TABLE "procurement" ADD COLUMN IF NOT EXISTS "expected_delivery" timestamp without time zone;
ALTER TABLE "procurement" ADD COLUMN IF NOT EXISTS "actual_delivery" timestamp without time zone;
ALTER TABLE "procurement" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "procurement" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "procurement" ADD COLUMN IF NOT EXISTS "updated_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "procurement" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "procurement" ADD COLUMN IF NOT EXISTS "inventory_item_id" varchar(255);
ALTER TABLE "procurement" ADD COLUMN IF NOT EXISTS "original_procurement_id" varchar(255);
ALTER TABLE "procurement" ADD COLUMN IF NOT EXISTS "unit" text;
ALTER TABLE "procurement" ADD COLUMN IF NOT EXISTS "invoice_image" text;
ALTER TABLE "procurement" ADD COLUMN IF NOT EXISTS "bill_id" varchar;
CREATE TABLE IF NOT EXISTS "product_client_requirements" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "product_id" varchar(255) NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "priority" text DEFAULT 'medium'::text NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "product_client_requirements" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "product_client_requirements" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "product_client_requirements" ADD COLUMN IF NOT EXISTS "product_id" varchar(255);
ALTER TABLE "product_client_requirements" ADD COLUMN IF NOT EXISTS "title" text;
ALTER TABLE "product_client_requirements" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "product_client_requirements" ADD COLUMN IF NOT EXISTS "priority" text DEFAULT 'medium'::text NOT NULL;
ALTER TABLE "product_client_requirements" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text NOT NULL;
ALTER TABLE "product_client_requirements" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0 NOT NULL;
ALTER TABLE "product_client_requirements" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "product_items" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "product_id" varchar NOT NULL,
  "name" text NOT NULL,
  "cost" numeric(12,2) DEFAULT 0 NOT NULL,
  "percentage" numeric(6,2) DEFAULT 0 NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "selling_price" numeric(12,2) DEFAULT 0 NOT NULL,
  "phase" integer DEFAULT 1 NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "product_items" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "product_items" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "product_items" ADD COLUMN IF NOT EXISTS "product_id" varchar;
ALTER TABLE "product_items" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "product_items" ADD COLUMN IF NOT EXISTS "cost" numeric(12,2) DEFAULT 0 NOT NULL;
ALTER TABLE "product_items" ADD COLUMN IF NOT EXISTS "percentage" numeric(6,2) DEFAULT 0 NOT NULL;
ALTER TABLE "product_items" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0 NOT NULL;
ALTER TABLE "product_items" ADD COLUMN IF NOT EXISTS "selling_price" numeric(12,2) DEFAULT 0 NOT NULL;
ALTER TABLE "product_items" ADD COLUMN IF NOT EXISTS "phase" integer DEFAULT 1 NOT NULL;
CREATE TABLE IF NOT EXISTS "product_meetings" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "product_id" varchar(255) NOT NULL,
  "title" text NOT NULL,
  "scheduled_at" timestamp without time zone NOT NULL,
  "duration_minutes" integer DEFAULT 30 NOT NULL,
  "attendees" text,
  "meeting_link" text,
  "location" text,
  "reminder_minutes_before" integer DEFAULT 15 NOT NULL,
  "status" text DEFAULT 'scheduled'::text NOT NULL,
  "agenda" text,
  "notes" text,
  "summary" text,
  "transcript" text,
  "action_items" jsonb DEFAULT '[]'::jsonb,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "product_meetings" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "product_meetings" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "product_meetings" ADD COLUMN IF NOT EXISTS "product_id" varchar(255);
ALTER TABLE "product_meetings" ADD COLUMN IF NOT EXISTS "title" text;
ALTER TABLE "product_meetings" ADD COLUMN IF NOT EXISTS "scheduled_at" timestamp without time zone;
ALTER TABLE "product_meetings" ADD COLUMN IF NOT EXISTS "duration_minutes" integer DEFAULT 30 NOT NULL;
ALTER TABLE "product_meetings" ADD COLUMN IF NOT EXISTS "attendees" text;
ALTER TABLE "product_meetings" ADD COLUMN IF NOT EXISTS "meeting_link" text;
ALTER TABLE "product_meetings" ADD COLUMN IF NOT EXISTS "location" text;
ALTER TABLE "product_meetings" ADD COLUMN IF NOT EXISTS "reminder_minutes_before" integer DEFAULT 15 NOT NULL;
ALTER TABLE "product_meetings" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'scheduled'::text NOT NULL;
ALTER TABLE "product_meetings" ADD COLUMN IF NOT EXISTS "agenda" text;
ALTER TABLE "product_meetings" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "product_meetings" ADD COLUMN IF NOT EXISTS "summary" text;
ALTER TABLE "product_meetings" ADD COLUMN IF NOT EXISTS "transcript" text;
ALTER TABLE "product_meetings" ADD COLUMN IF NOT EXISTS "action_items" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "product_meetings" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "product_service_links" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "product_id" varchar NOT NULL,
  "service_catalog_id" varchar,
  "quantity" numeric(12,2) DEFAULT 1 NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "name" text,
  "unit_price" numeric(12,2),
  "phase" integer DEFAULT 1 NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "product_service_links" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "product_service_links" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "product_service_links" ADD COLUMN IF NOT EXISTS "product_id" varchar;
ALTER TABLE "product_service_links" ADD COLUMN IF NOT EXISTS "service_catalog_id" varchar;
ALTER TABLE "product_service_links" ADD COLUMN IF NOT EXISTS "quantity" numeric(12,2) DEFAULT 1 NOT NULL;
ALTER TABLE "product_service_links" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0 NOT NULL;
ALTER TABLE "product_service_links" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "product_service_links" ADD COLUMN IF NOT EXISTS "unit_price" numeric(12,2);
ALTER TABLE "product_service_links" ADD COLUMN IF NOT EXISTS "phase" integer DEFAULT 1 NOT NULL;
CREATE TABLE IF NOT EXISTS "product_tasks" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "product_id" varchar NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "duration" integer DEFAULT 1 NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "phase" integer DEFAULT 1 NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "product_tasks" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "product_tasks" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "product_tasks" ADD COLUMN IF NOT EXISTS "product_id" varchar;
ALTER TABLE "product_tasks" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "product_tasks" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "product_tasks" ADD COLUMN IF NOT EXISTS "duration" integer DEFAULT 1 NOT NULL;
ALTER TABLE "product_tasks" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0 NOT NULL;
ALTER TABLE "product_tasks" ADD COLUMN IF NOT EXISTS "phase" integer DEFAULT 1 NOT NULL;
CREATE TABLE IF NOT EXISTS "project_bills" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "project_id" varchar NOT NULL,
  "description" text NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "category" text,
  "vendor" text,
  "bill_date" timestamp without time zone DEFAULT now() NOT NULL,
  "due_date" timestamp without time zone,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "paid_date" timestamp without time zone,
  "notes" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "project_bills" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "project_bills" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "project_bills" ADD COLUMN IF NOT EXISTS "project_id" varchar;
ALTER TABLE "project_bills" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "project_bills" ADD COLUMN IF NOT EXISTS "amount" numeric(12,2);
ALTER TABLE "project_bills" ADD COLUMN IF NOT EXISTS "category" text;
ALTER TABLE "project_bills" ADD COLUMN IF NOT EXISTS "vendor" text;
ALTER TABLE "project_bills" ADD COLUMN IF NOT EXISTS "bill_date" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "project_bills" ADD COLUMN IF NOT EXISTS "due_date" timestamp without time zone;
ALTER TABLE "project_bills" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text NOT NULL;
ALTER TABLE "project_bills" ADD COLUMN IF NOT EXISTS "paid_date" timestamp without time zone;
ALTER TABLE "project_bills" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "project_bills" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "project_client_requirements" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "project_id" varchar(255) NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "priority" text DEFAULT 'medium'::text NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "project_client_requirements" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "project_client_requirements" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "project_client_requirements" ADD COLUMN IF NOT EXISTS "project_id" varchar(255);
ALTER TABLE "project_client_requirements" ADD COLUMN IF NOT EXISTS "title" text;
ALTER TABLE "project_client_requirements" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "project_client_requirements" ADD COLUMN IF NOT EXISTS "priority" text DEFAULT 'medium'::text NOT NULL;
ALTER TABLE "project_client_requirements" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text NOT NULL;
ALTER TABLE "project_client_requirements" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0 NOT NULL;
ALTER TABLE "project_client_requirements" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "project_equipment" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "project_id" varchar NOT NULL,
  "name" text NOT NULL,
  "supplier_id" varchar,
  "supplier_name" text,
  "rate_unit" text DEFAULT 'daily'::text NOT NULL,
  "rate" numeric(12,2) DEFAULT 0 NOT NULL,
  "quantity" numeric(12,2) DEFAULT 1 NOT NULL,
  "total_cost" numeric(12,2) DEFAULT 0 NOT NULL,
  "start_date" timestamp without time zone,
  "end_date" timestamp without time zone,
  "status" text DEFAULT 'assigned'::text NOT NULL,
  "phase" integer DEFAULT 1 NOT NULL,
  "notes" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "task_id" varchar,
  PRIMARY KEY ("id")
);
ALTER TABLE "project_equipment" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "project_equipment" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "project_equipment" ADD COLUMN IF NOT EXISTS "project_id" varchar;
ALTER TABLE "project_equipment" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "project_equipment" ADD COLUMN IF NOT EXISTS "supplier_id" varchar;
ALTER TABLE "project_equipment" ADD COLUMN IF NOT EXISTS "supplier_name" text;
ALTER TABLE "project_equipment" ADD COLUMN IF NOT EXISTS "rate_unit" text DEFAULT 'daily'::text NOT NULL;
ALTER TABLE "project_equipment" ADD COLUMN IF NOT EXISTS "rate" numeric(12,2) DEFAULT 0 NOT NULL;
ALTER TABLE "project_equipment" ADD COLUMN IF NOT EXISTS "quantity" numeric(12,2) DEFAULT 1 NOT NULL;
ALTER TABLE "project_equipment" ADD COLUMN IF NOT EXISTS "total_cost" numeric(12,2) DEFAULT 0 NOT NULL;
ALTER TABLE "project_equipment" ADD COLUMN IF NOT EXISTS "start_date" timestamp without time zone;
ALTER TABLE "project_equipment" ADD COLUMN IF NOT EXISTS "end_date" timestamp without time zone;
ALTER TABLE "project_equipment" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'assigned'::text NOT NULL;
ALTER TABLE "project_equipment" ADD COLUMN IF NOT EXISTS "phase" integer DEFAULT 1 NOT NULL;
ALTER TABLE "project_equipment" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "project_equipment" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "project_equipment" ADD COLUMN IF NOT EXISTS "task_id" varchar;
CREATE TABLE IF NOT EXISTS "project_items" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "project_id" varchar NOT NULL,
  "source_product_id" varchar,
  "name" text NOT NULL,
  "cost" numeric(12,2) DEFAULT 0 NOT NULL,
  "percentage" numeric(6,2) DEFAULT 0 NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "selling_price" numeric(12,2) DEFAULT 0 NOT NULL,
  "phase" integer DEFAULT 1 NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "project_items" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "project_items" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "project_items" ADD COLUMN IF NOT EXISTS "project_id" varchar;
ALTER TABLE "project_items" ADD COLUMN IF NOT EXISTS "source_product_id" varchar;
ALTER TABLE "project_items" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "project_items" ADD COLUMN IF NOT EXISTS "cost" numeric(12,2) DEFAULT 0 NOT NULL;
ALTER TABLE "project_items" ADD COLUMN IF NOT EXISTS "percentage" numeric(6,2) DEFAULT 0 NOT NULL;
ALTER TABLE "project_items" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0 NOT NULL;
ALTER TABLE "project_items" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "project_items" ADD COLUMN IF NOT EXISTS "selling_price" numeric(12,2) DEFAULT 0 NOT NULL;
ALTER TABLE "project_items" ADD COLUMN IF NOT EXISTS "phase" integer DEFAULT 1 NOT NULL;
CREATE TABLE IF NOT EXISTS "project_meetings" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "project_id" varchar(255) NOT NULL,
  "title" text NOT NULL,
  "scheduled_at" timestamp without time zone NOT NULL,
  "duration_minutes" integer DEFAULT 30 NOT NULL,
  "attendees" text,
  "meeting_link" text,
  "location" text,
  "reminder_minutes_before" integer DEFAULT 15 NOT NULL,
  "status" text DEFAULT 'scheduled'::text NOT NULL,
  "agenda" text,
  "notes" text,
  "summary" text,
  "transcript" text,
  "action_items" jsonb DEFAULT '[]'::jsonb,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "project_meetings" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "project_meetings" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "project_meetings" ADD COLUMN IF NOT EXISTS "project_id" varchar(255);
ALTER TABLE "project_meetings" ADD COLUMN IF NOT EXISTS "title" text;
ALTER TABLE "project_meetings" ADD COLUMN IF NOT EXISTS "scheduled_at" timestamp without time zone;
ALTER TABLE "project_meetings" ADD COLUMN IF NOT EXISTS "duration_minutes" integer DEFAULT 30 NOT NULL;
ALTER TABLE "project_meetings" ADD COLUMN IF NOT EXISTS "attendees" text;
ALTER TABLE "project_meetings" ADD COLUMN IF NOT EXISTS "meeting_link" text;
ALTER TABLE "project_meetings" ADD COLUMN IF NOT EXISTS "location" text;
ALTER TABLE "project_meetings" ADD COLUMN IF NOT EXISTS "reminder_minutes_before" integer DEFAULT 15 NOT NULL;
ALTER TABLE "project_meetings" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'scheduled'::text NOT NULL;
ALTER TABLE "project_meetings" ADD COLUMN IF NOT EXISTS "agenda" text;
ALTER TABLE "project_meetings" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "project_meetings" ADD COLUMN IF NOT EXISTS "summary" text;
ALTER TABLE "project_meetings" ADD COLUMN IF NOT EXISTS "transcript" text;
ALTER TABLE "project_meetings" ADD COLUMN IF NOT EXISTS "action_items" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "project_meetings" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "project_procurements" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "project_id" varchar NOT NULL,
  "item_name" text NOT NULL,
  "description" text,
  "quantity" numeric(12,2) DEFAULT 1 NOT NULL,
  "unit_price" numeric(12,2) NOT NULL,
  "total_price" numeric(12,2) NOT NULL,
  "vendor" text,
  "purchase_date" timestamp without time zone DEFAULT now() NOT NULL,
  "delivery_date" timestamp without time zone,
  "status" text DEFAULT 'ordered'::text NOT NULL,
  "notes" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "phase" integer DEFAULT 1 NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "project_procurements" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "project_procurements" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "project_procurements" ADD COLUMN IF NOT EXISTS "project_id" varchar;
ALTER TABLE "project_procurements" ADD COLUMN IF NOT EXISTS "item_name" text;
ALTER TABLE "project_procurements" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "project_procurements" ADD COLUMN IF NOT EXISTS "quantity" numeric(12,2) DEFAULT 1 NOT NULL;
ALTER TABLE "project_procurements" ADD COLUMN IF NOT EXISTS "unit_price" numeric(12,2);
ALTER TABLE "project_procurements" ADD COLUMN IF NOT EXISTS "total_price" numeric(12,2);
ALTER TABLE "project_procurements" ADD COLUMN IF NOT EXISTS "vendor" text;
ALTER TABLE "project_procurements" ADD COLUMN IF NOT EXISTS "purchase_date" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "project_procurements" ADD COLUMN IF NOT EXISTS "delivery_date" timestamp without time zone;
ALTER TABLE "project_procurements" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'ordered'::text NOT NULL;
ALTER TABLE "project_procurements" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "project_procurements" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "project_procurements" ADD COLUMN IF NOT EXISTS "phase" integer DEFAULT 1 NOT NULL;
CREATE TABLE IF NOT EXISTS "project_services" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "project_id" varchar NOT NULL,
  "service_catalog_id" varchar,
  "name" text NOT NULL,
  "description" text,
  "pricing_method" text DEFAULT 'lump_sum'::text NOT NULL,
  "unit_price" numeric(12,2) NOT NULL,
  "quantity" numeric(12,2) DEFAULT 1 NOT NULL,
  "unit" text,
  "total_price" numeric(12,2) NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "notes" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "source_product_id" varchar,
  "phase" integer DEFAULT 1 NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "project_services" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "project_services" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "project_services" ADD COLUMN IF NOT EXISTS "project_id" varchar;
ALTER TABLE "project_services" ADD COLUMN IF NOT EXISTS "service_catalog_id" varchar;
ALTER TABLE "project_services" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "project_services" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "project_services" ADD COLUMN IF NOT EXISTS "pricing_method" text DEFAULT 'lump_sum'::text NOT NULL;
ALTER TABLE "project_services" ADD COLUMN IF NOT EXISTS "unit_price" numeric(12,2);
ALTER TABLE "project_services" ADD COLUMN IF NOT EXISTS "quantity" numeric(12,2) DEFAULT 1 NOT NULL;
ALTER TABLE "project_services" ADD COLUMN IF NOT EXISTS "unit" text;
ALTER TABLE "project_services" ADD COLUMN IF NOT EXISTS "total_price" numeric(12,2);
ALTER TABLE "project_services" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text NOT NULL;
ALTER TABLE "project_services" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "project_services" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "project_services" ADD COLUMN IF NOT EXISTS "source_product_id" varchar;
ALTER TABLE "project_services" ADD COLUMN IF NOT EXISTS "phase" integer DEFAULT 1 NOT NULL;
CREATE TABLE IF NOT EXISTS "project_tasks" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "project_id" varchar NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "duration" integer DEFAULT 1 NOT NULL,
  "start_date" timestamp without time zone,
  "end_date" timestamp without time zone,
  "dependencies" text[],
  "status" text DEFAULT 'pending'::text NOT NULL,
  "is_critical" boolean DEFAULT false,
  "early_start" integer,
  "early_finish" integer,
  "late_start" integer,
  "late_finish" integer,
  "slack" integer,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "source_product_id" varchar,
  "phase" integer DEFAULT 1 NOT NULL,
  "assignee_type" text,
  "assignee_id" varchar(255),
  PRIMARY KEY ("id")
);
ALTER TABLE "project_tasks" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "project_tasks" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "project_tasks" ADD COLUMN IF NOT EXISTS "project_id" varchar;
ALTER TABLE "project_tasks" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "project_tasks" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "project_tasks" ADD COLUMN IF NOT EXISTS "duration" integer DEFAULT 1 NOT NULL;
ALTER TABLE "project_tasks" ADD COLUMN IF NOT EXISTS "start_date" timestamp without time zone;
ALTER TABLE "project_tasks" ADD COLUMN IF NOT EXISTS "end_date" timestamp without time zone;
ALTER TABLE "project_tasks" ADD COLUMN IF NOT EXISTS "dependencies" text[];
ALTER TABLE "project_tasks" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text NOT NULL;
ALTER TABLE "project_tasks" ADD COLUMN IF NOT EXISTS "is_critical" boolean DEFAULT false;
ALTER TABLE "project_tasks" ADD COLUMN IF NOT EXISTS "early_start" integer;
ALTER TABLE "project_tasks" ADD COLUMN IF NOT EXISTS "early_finish" integer;
ALTER TABLE "project_tasks" ADD COLUMN IF NOT EXISTS "late_start" integer;
ALTER TABLE "project_tasks" ADD COLUMN IF NOT EXISTS "late_finish" integer;
ALTER TABLE "project_tasks" ADD COLUMN IF NOT EXISTS "slack" integer;
ALTER TABLE "project_tasks" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0 NOT NULL;
ALTER TABLE "project_tasks" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "project_tasks" ADD COLUMN IF NOT EXISTS "source_product_id" varchar;
ALTER TABLE "project_tasks" ADD COLUMN IF NOT EXISTS "phase" integer DEFAULT 1 NOT NULL;
ALTER TABLE "project_tasks" ADD COLUMN IF NOT EXISTS "assignee_type" text;
ALTER TABLE "project_tasks" ADD COLUMN IF NOT EXISTS "assignee_id" varchar(255);
CREATE TABLE IF NOT EXISTS "properties" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "name" text NOT NULL,
  "type" text NOT NULL,
  "address" text,
  "city" text,
  "district" text,
  "latitude" numeric(10,7),
  "longitude" numeric(10,7),
  "area_sqm" numeric(12,2),
  "floors" integer,
  "year_built" integer,
  "purchase_price" integer DEFAULT 0,
  "current_value" integer DEFAULT 0,
  "status" text DEFAULT 'available'::text NOT NULL,
  "owner_name" text,
  "notes" text,
  "documents" jsonb DEFAULT '[]'::jsonb,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "type" text;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "address" text;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "city" text;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "district" text;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "latitude" numeric(10,7);
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "longitude" numeric(10,7);
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "area_sqm" numeric(12,2);
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "floors" integer;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "year_built" integer;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "purchase_price" integer DEFAULT 0;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "current_value" integer DEFAULT 0;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'available'::text NOT NULL;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "owner_name" text;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "documents" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "updated_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "property_expenses" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "property_id" varchar(255),
  "unit_id" varchar(255),
  "category" text NOT NULL,
  "description" text NOT NULL,
  "amount" integer NOT NULL,
  "tax_amount" integer DEFAULT 0 NOT NULL,
  "vendor_name" text,
  "vendor_contact" text,
  "expense_date" date NOT NULL,
  "due_date" date,
  "paid_date" date,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "receipt_url" text,
  "notes" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "property_expenses" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "property_expenses" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "property_expenses" ADD COLUMN IF NOT EXISTS "property_id" varchar(255);
ALTER TABLE "property_expenses" ADD COLUMN IF NOT EXISTS "unit_id" varchar(255);
ALTER TABLE "property_expenses" ADD COLUMN IF NOT EXISTS "category" text;
ALTER TABLE "property_expenses" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "property_expenses" ADD COLUMN IF NOT EXISTS "amount" integer;
ALTER TABLE "property_expenses" ADD COLUMN IF NOT EXISTS "tax_amount" integer DEFAULT 0 NOT NULL;
ALTER TABLE "property_expenses" ADD COLUMN IF NOT EXISTS "vendor_name" text;
ALTER TABLE "property_expenses" ADD COLUMN IF NOT EXISTS "vendor_contact" text;
ALTER TABLE "property_expenses" ADD COLUMN IF NOT EXISTS "expense_date" date;
ALTER TABLE "property_expenses" ADD COLUMN IF NOT EXISTS "due_date" date;
ALTER TABLE "property_expenses" ADD COLUMN IF NOT EXISTS "paid_date" date;
ALTER TABLE "property_expenses" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text NOT NULL;
ALTER TABLE "property_expenses" ADD COLUMN IF NOT EXISTS "receipt_url" text;
ALTER TABLE "property_expenses" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "property_expenses" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "property_notifications" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "user_id" varchar(255),
  "type" text NOT NULL,
  "title" text NOT NULL,
  "message" text,
  "related_type" text,
  "related_id" varchar(255),
  "is_read" boolean DEFAULT false NOT NULL,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "property_notifications" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "property_notifications" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "property_notifications" ADD COLUMN IF NOT EXISTS "user_id" varchar(255);
ALTER TABLE "property_notifications" ADD COLUMN IF NOT EXISTS "type" text;
ALTER TABLE "property_notifications" ADD COLUMN IF NOT EXISTS "title" text;
ALTER TABLE "property_notifications" ADD COLUMN IF NOT EXISTS "message" text;
ALTER TABLE "property_notifications" ADD COLUMN IF NOT EXISTS "related_type" text;
ALTER TABLE "property_notifications" ADD COLUMN IF NOT EXISTS "related_id" varchar(255);
ALTER TABLE "property_notifications" ADD COLUMN IF NOT EXISTS "is_read" boolean DEFAULT false NOT NULL;
ALTER TABLE "property_notifications" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "property_tenants" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "full_name" text NOT NULL,
  "id_number" text,
  "id_type" text,
  "phone" text,
  "email" text,
  "nationality" text,
  "emergency_contact" jsonb,
  "company_name" text,
  "cr_number" text,
  "documents" jsonb DEFAULT '[]'::jsonb,
  "notes" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "property_tenants" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "property_tenants" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "property_tenants" ADD COLUMN IF NOT EXISTS "full_name" text;
ALTER TABLE "property_tenants" ADD COLUMN IF NOT EXISTS "id_number" text;
ALTER TABLE "property_tenants" ADD COLUMN IF NOT EXISTS "id_type" text;
ALTER TABLE "property_tenants" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "property_tenants" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "property_tenants" ADD COLUMN IF NOT EXISTS "nationality" text;
ALTER TABLE "property_tenants" ADD COLUMN IF NOT EXISTS "emergency_contact" jsonb;
ALTER TABLE "property_tenants" ADD COLUMN IF NOT EXISTS "company_name" text;
ALTER TABLE "property_tenants" ADD COLUMN IF NOT EXISTS "cr_number" text;
ALTER TABLE "property_tenants" ADD COLUMN IF NOT EXISTS "documents" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "property_tenants" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "property_tenants" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "property_units" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "property_id" varchar(255) NOT NULL,
  "unit_number" text NOT NULL,
  "type" text,
  "floor" integer,
  "area_sqm" numeric(12,2),
  "bedrooms" integer,
  "bathrooms" integer,
  "parking_spaces" integer,
  "monthly_rent" integer DEFAULT 0 NOT NULL,
  "status" text DEFAULT 'available'::text NOT NULL,
  "amenities" jsonb DEFAULT '[]'::jsonb,
  "images" jsonb DEFAULT '[]'::jsonb,
  "notes" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "property_units" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "property_units" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "property_units" ADD COLUMN IF NOT EXISTS "property_id" varchar(255);
ALTER TABLE "property_units" ADD COLUMN IF NOT EXISTS "unit_number" text;
ALTER TABLE "property_units" ADD COLUMN IF NOT EXISTS "type" text;
ALTER TABLE "property_units" ADD COLUMN IF NOT EXISTS "floor" integer;
ALTER TABLE "property_units" ADD COLUMN IF NOT EXISTS "area_sqm" numeric(12,2);
ALTER TABLE "property_units" ADD COLUMN IF NOT EXISTS "bedrooms" integer;
ALTER TABLE "property_units" ADD COLUMN IF NOT EXISTS "bathrooms" integer;
ALTER TABLE "property_units" ADD COLUMN IF NOT EXISTS "parking_spaces" integer;
ALTER TABLE "property_units" ADD COLUMN IF NOT EXISTS "monthly_rent" integer DEFAULT 0 NOT NULL;
ALTER TABLE "property_units" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'available'::text NOT NULL;
ALTER TABLE "property_units" ADD COLUMN IF NOT EXISTS "amenities" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "property_units" ADD COLUMN IF NOT EXISTS "images" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "property_units" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "property_units" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "quotation_decisions" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "quotation_id" varchar NOT NULL,
  "decision" text NOT NULL,
  "reason" text,
  "decided_by" text,
  "decided_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "quotation_decisions" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "quotation_decisions" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "quotation_decisions" ADD COLUMN IF NOT EXISTS "quotation_id" varchar;
ALTER TABLE "quotation_decisions" ADD COLUMN IF NOT EXISTS "decision" text;
ALTER TABLE "quotation_decisions" ADD COLUMN IF NOT EXISTS "reason" text;
ALTER TABLE "quotation_decisions" ADD COLUMN IF NOT EXISTS "decided_by" text;
ALTER TABLE "quotation_decisions" ADD COLUMN IF NOT EXISTS "decided_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "quotations" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "quotation_number" text NOT NULL,
  "project_id" varchar,
  "client_name" text NOT NULL,
  "client_phone" text,
  "client_email" text,
  "description" text,
  "items" jsonb DEFAULT '[]'::jsonb,
  "subtotal" numeric(12,2) NOT NULL,
  "vat_rate" numeric(5,2) DEFAULT 15,
  "vat_amount" numeric(12,2) NOT NULL,
  "total_amount" numeric(12,2) NOT NULL,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "valid_until" timestamp without time zone,
  "notes" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "decline_reason" text,
  PRIMARY KEY ("id")
);
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "quotation_number" text;
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "project_id" varchar;
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "client_name" text;
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "client_phone" text;
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "client_email" text;
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "items" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "subtotal" numeric(12,2);
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "vat_rate" numeric(5,2) DEFAULT 15;
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "vat_amount" numeric(12,2);
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "total_amount" numeric(12,2);
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'draft'::text NOT NULL;
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "valid_until" timestamp without time zone;
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "decline_reason" text;
CREATE TABLE IF NOT EXISTS "recipes" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "prep_time" text NOT NULL,
  "cook_time" text NOT NULL,
  "servings" integer NOT NULL,
  "cost" numeric(10,2) NOT NULL,
  "ingredients" jsonb NOT NULL,
  "steps" jsonb NOT NULL,
  "sort_order" integer DEFAULT 0,
  "restaurant_id" varchar,
  PRIMARY KEY ("id")
);
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "prep_time" text;
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "cook_time" text;
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "servings" integer;
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "cost" numeric(10,2);
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "ingredients" jsonb;
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "steps" jsonb;
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0;
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
CREATE TABLE IF NOT EXISTS "refund_invoices" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "serial_number" text NOT NULL,
  "client_name" text NOT NULL,
  "client_email" text NOT NULL,
  "restaurant_name" text NOT NULL,
  "subscription_plan" text NOT NULL,
  "subscription_start_date" timestamp without time zone NOT NULL,
  "cancellation_date" timestamp without time zone NOT NULL,
  "months_used" integer NOT NULL,
  "original_price" numeric(10,2) NOT NULL,
  "monthly_rate" numeric(10,2) NOT NULL,
  "charged_amount" numeric(10,2) NOT NULL,
  "refund_amount" numeric(10,2) NOT NULL,
  "pdf_data" text,
  "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "refund_invoices" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "refund_invoices" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "refund_invoices" ADD COLUMN IF NOT EXISTS "serial_number" text;
ALTER TABLE "refund_invoices" ADD COLUMN IF NOT EXISTS "client_name" text;
ALTER TABLE "refund_invoices" ADD COLUMN IF NOT EXISTS "client_email" text;
ALTER TABLE "refund_invoices" ADD COLUMN IF NOT EXISTS "restaurant_name" text;
ALTER TABLE "refund_invoices" ADD COLUMN IF NOT EXISTS "subscription_plan" text;
ALTER TABLE "refund_invoices" ADD COLUMN IF NOT EXISTS "subscription_start_date" timestamp without time zone;
ALTER TABLE "refund_invoices" ADD COLUMN IF NOT EXISTS "cancellation_date" timestamp without time zone;
ALTER TABLE "refund_invoices" ADD COLUMN IF NOT EXISTS "months_used" integer;
ALTER TABLE "refund_invoices" ADD COLUMN IF NOT EXISTS "original_price" numeric(10,2);
ALTER TABLE "refund_invoices" ADD COLUMN IF NOT EXISTS "monthly_rate" numeric(10,2);
ALTER TABLE "refund_invoices" ADD COLUMN IF NOT EXISTS "charged_amount" numeric(10,2);
ALTER TABLE "refund_invoices" ADD COLUMN IF NOT EXISTS "refund_amount" numeric(10,2);
ALTER TABLE "refund_invoices" ADD COLUMN IF NOT EXISTS "pdf_data" text;
ALTER TABLE "refund_invoices" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;
CREATE TABLE IF NOT EXISTS "rental_contracts" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "unit_id" varchar(255) NOT NULL,
  "tenant_id" varchar(255) NOT NULL,
  "contract_number" text,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "duration_months" integer NOT NULL,
  "monthly_rent" integer NOT NULL,
  "total_value" integer NOT NULL,
  "security_deposit" integer DEFAULT 0 NOT NULL,
  "payment_frequency" text DEFAULT 'monthly'::text NOT NULL,
  "payment_day" integer DEFAULT 1 NOT NULL,
  "vat_rate" integer DEFAULT 15 NOT NULL,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "auto_renew" boolean DEFAULT false NOT NULL,
  "renewal_notice_days" integer DEFAULT 60 NOT NULL,
  "terms" text,
  "documents" jsonb DEFAULT '[]'::jsonb,
  "signed_date" date,
  "terminated_date" date,
  "termination_reason" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "rental_contracts" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "rental_contracts" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "rental_contracts" ADD COLUMN IF NOT EXISTS "unit_id" varchar(255);
ALTER TABLE "rental_contracts" ADD COLUMN IF NOT EXISTS "tenant_id" varchar(255);
ALTER TABLE "rental_contracts" ADD COLUMN IF NOT EXISTS "contract_number" text;
ALTER TABLE "rental_contracts" ADD COLUMN IF NOT EXISTS "start_date" date;
ALTER TABLE "rental_contracts" ADD COLUMN IF NOT EXISTS "end_date" date;
ALTER TABLE "rental_contracts" ADD COLUMN IF NOT EXISTS "duration_months" integer;
ALTER TABLE "rental_contracts" ADD COLUMN IF NOT EXISTS "monthly_rent" integer;
ALTER TABLE "rental_contracts" ADD COLUMN IF NOT EXISTS "total_value" integer;
ALTER TABLE "rental_contracts" ADD COLUMN IF NOT EXISTS "security_deposit" integer DEFAULT 0 NOT NULL;
ALTER TABLE "rental_contracts" ADD COLUMN IF NOT EXISTS "payment_frequency" text DEFAULT 'monthly'::text NOT NULL;
ALTER TABLE "rental_contracts" ADD COLUMN IF NOT EXISTS "payment_day" integer DEFAULT 1 NOT NULL;
ALTER TABLE "rental_contracts" ADD COLUMN IF NOT EXISTS "vat_rate" integer DEFAULT 15 NOT NULL;
ALTER TABLE "rental_contracts" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'draft'::text NOT NULL;
ALTER TABLE "rental_contracts" ADD COLUMN IF NOT EXISTS "auto_renew" boolean DEFAULT false NOT NULL;
ALTER TABLE "rental_contracts" ADD COLUMN IF NOT EXISTS "renewal_notice_days" integer DEFAULT 60 NOT NULL;
ALTER TABLE "rental_contracts" ADD COLUMN IF NOT EXISTS "terms" text;
ALTER TABLE "rental_contracts" ADD COLUMN IF NOT EXISTS "documents" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "rental_contracts" ADD COLUMN IF NOT EXISTS "signed_date" date;
ALTER TABLE "rental_contracts" ADD COLUMN IF NOT EXISTS "terminated_date" date;
ALTER TABLE "rental_contracts" ADD COLUMN IF NOT EXISTS "termination_reason" text;
ALTER TABLE "rental_contracts" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "rental_invoices" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "contract_id" varchar(255) NOT NULL,
  "unit_id" varchar(255) NOT NULL,
  "tenant_id" varchar(255) NOT NULL,
  "invoice_number" text NOT NULL,
  "type" text DEFAULT 'rent'::text NOT NULL,
  "amount" integer NOT NULL,
  "tax_amount" integer DEFAULT 0 NOT NULL,
  "total_amount" integer NOT NULL,
  "amount_paid" integer DEFAULT 0 NOT NULL,
  "due_date" date NOT NULL,
  "issue_date" date NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "notes" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "rental_invoices" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "rental_invoices" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "rental_invoices" ADD COLUMN IF NOT EXISTS "contract_id" varchar(255);
ALTER TABLE "rental_invoices" ADD COLUMN IF NOT EXISTS "unit_id" varchar(255);
ALTER TABLE "rental_invoices" ADD COLUMN IF NOT EXISTS "tenant_id" varchar(255);
ALTER TABLE "rental_invoices" ADD COLUMN IF NOT EXISTS "invoice_number" text;
ALTER TABLE "rental_invoices" ADD COLUMN IF NOT EXISTS "type" text DEFAULT 'rent'::text NOT NULL;
ALTER TABLE "rental_invoices" ADD COLUMN IF NOT EXISTS "amount" integer;
ALTER TABLE "rental_invoices" ADD COLUMN IF NOT EXISTS "tax_amount" integer DEFAULT 0 NOT NULL;
ALTER TABLE "rental_invoices" ADD COLUMN IF NOT EXISTS "total_amount" integer;
ALTER TABLE "rental_invoices" ADD COLUMN IF NOT EXISTS "amount_paid" integer DEFAULT 0 NOT NULL;
ALTER TABLE "rental_invoices" ADD COLUMN IF NOT EXISTS "due_date" date;
ALTER TABLE "rental_invoices" ADD COLUMN IF NOT EXISTS "issue_date" date;
ALTER TABLE "rental_invoices" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text NOT NULL;
ALTER TABLE "rental_invoices" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "rental_invoices" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "rental_payments" (
  "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar(255) NOT NULL,
  "invoice_id" varchar(255) NOT NULL,
  "contract_id" varchar(255) NOT NULL,
  "tenant_id" varchar(255) NOT NULL,
  "amount_paid" integer NOT NULL,
  "payment_date" date NOT NULL,
  "method" text DEFAULT 'cash'::text NOT NULL,
  "reference_number" text,
  "bank_name" text,
  "received_by_user_id" varchar(255),
  "notes" text,
  "receipt_url" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "rental_payments" ADD COLUMN IF NOT EXISTS "id" varchar(255) DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "rental_payments" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar(255);
ALTER TABLE "rental_payments" ADD COLUMN IF NOT EXISTS "invoice_id" varchar(255);
ALTER TABLE "rental_payments" ADD COLUMN IF NOT EXISTS "contract_id" varchar(255);
ALTER TABLE "rental_payments" ADD COLUMN IF NOT EXISTS "tenant_id" varchar(255);
ALTER TABLE "rental_payments" ADD COLUMN IF NOT EXISTS "amount_paid" integer;
ALTER TABLE "rental_payments" ADD COLUMN IF NOT EXISTS "payment_date" date;
ALTER TABLE "rental_payments" ADD COLUMN IF NOT EXISTS "method" text DEFAULT 'cash'::text NOT NULL;
ALTER TABLE "rental_payments" ADD COLUMN IF NOT EXISTS "reference_number" text;
ALTER TABLE "rental_payments" ADD COLUMN IF NOT EXISTS "bank_name" text;
ALTER TABLE "rental_payments" ADD COLUMN IF NOT EXISTS "received_by_user_id" varchar(255);
ALTER TABLE "rental_payments" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "rental_payments" ADD COLUMN IF NOT EXISTS "receipt_url" text;
ALTER TABLE "rental_payments" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "restaurants" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "national_id" text NOT NULL,
  "tax_number" text,
  "commercial_registration" text NOT NULL,
  "type" text NOT NULL,
  "subscription_plan" text NOT NULL,
  "branches_count" integer DEFAULT 1 NOT NULL,
  "subscription_status" text DEFAULT 'inactive'::text NOT NULL,
  "subscription_start_date" timestamp without time zone,
  "subscription_end_date" timestamp without time zone,
  "subscription_cancelled_at" timestamp without time zone,
  "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "setup_complete" boolean DEFAULT false NOT NULL,
  "business_type" text DEFAULT 'restaurant'::text NOT NULL,
  "has_vat_registration" boolean DEFAULT false NOT NULL,
  "cancellation_reason" text,
  "refund_amount" numeric(10,2),
  "cancelled_at" timestamp without time zone,
  "vat_number" text,
  "city" text,
  "address" text,
  "phone" text,
  "email" text,
  "opening_time" text,
  "closing_time" text,
  "opening_time2" text,
  "closing_time2" text,
  "business_card" jsonb,
  PRIMARY KEY ("id")
);
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "national_id" text;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "tax_number" text;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "commercial_registration" text;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "type" text;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "subscription_plan" text;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "branches_count" integer DEFAULT 1 NOT NULL;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "subscription_status" text DEFAULT 'inactive'::text NOT NULL;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "subscription_start_date" timestamp without time zone;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "subscription_end_date" timestamp without time zone;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "subscription_cancelled_at" timestamp without time zone;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "setup_complete" boolean DEFAULT false NOT NULL;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "business_type" text DEFAULT 'restaurant'::text NOT NULL;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "has_vat_registration" boolean DEFAULT false NOT NULL;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "cancellation_reason" text;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "refund_amount" numeric(10,2);
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp without time zone;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "vat_number" text;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "city" text;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "address" text;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "opening_time" text;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "closing_time" text;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "opening_time2" text;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "closing_time2" text;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "business_card" jsonb;
CREATE TABLE IF NOT EXISTS "salaries" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "employee_name" text NOT NULL,
  "position" text NOT NULL,
  "amount" numeric(10,2) NOT NULL,
  "payment_date" timestamp without time zone NOT NULL,
  "branch_id" varchar,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "notes" text,
  "restaurant_id" varchar,
  "invoice_image" text,
  "bill_id" varchar(255),
  PRIMARY KEY ("id")
);
ALTER TABLE "salaries" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "salaries" ADD COLUMN IF NOT EXISTS "employee_name" text;
ALTER TABLE "salaries" ADD COLUMN IF NOT EXISTS "position" text;
ALTER TABLE "salaries" ADD COLUMN IF NOT EXISTS "amount" numeric(10,2);
ALTER TABLE "salaries" ADD COLUMN IF NOT EXISTS "payment_date" timestamp without time zone;
ALTER TABLE "salaries" ADD COLUMN IF NOT EXISTS "branch_id" varchar;
ALTER TABLE "salaries" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "salaries" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text NOT NULL;
ALTER TABLE "salaries" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "salaries" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "salaries" ADD COLUMN IF NOT EXISTS "invoice_image" text;
ALTER TABLE "salaries" ADD COLUMN IF NOT EXISTS "bill_id" varchar(255);
CREATE TABLE IF NOT EXISTS "service_catalog" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "category" text,
  "pricing_method" text DEFAULT 'lump_sum'::text NOT NULL,
  "unit_price" numeric(12,2) NOT NULL,
  "unit" text,
  "estimated_duration" text,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "service_catalog" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "service_catalog" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "service_catalog" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "service_catalog" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "service_catalog" ADD COLUMN IF NOT EXISTS "category" text;
ALTER TABLE "service_catalog" ADD COLUMN IF NOT EXISTS "pricing_method" text DEFAULT 'lump_sum'::text NOT NULL;
ALTER TABLE "service_catalog" ADD COLUMN IF NOT EXISTS "unit_price" numeric(12,2);
ALTER TABLE "service_catalog" ADD COLUMN IF NOT EXISTS "unit" text;
ALTER TABLE "service_catalog" ADD COLUMN IF NOT EXISTS "estimated_duration" text;
ALTER TABLE "service_catalog" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active'::text NOT NULL;
ALTER TABLE "service_catalog" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "service_products" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "category" text,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "service_products" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "service_products" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "service_products" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "service_products" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "service_products" ADD COLUMN IF NOT EXISTS "category" text;
ALTER TABLE "service_products" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active'::text NOT NULL;
ALTER TABLE "service_products" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "service_projects" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "project_number" text NOT NULL,
  "name" text NOT NULL,
  "client_name" text NOT NULL,
  "client_phone" text,
  "client_email" text,
  "description" text,
  "location" text,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "priority" text DEFAULT 'medium'::text NOT NULL,
  "start_date" timestamp without time zone,
  "end_date" timestamp without time zone,
  "estimated_budget" numeric(12,2),
  "actual_cost" numeric(12,2),
  "contractor_id" varchar,
  "notes" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "client_cr_number" text,
  "client_vat_number" text,
  "client_address" text,
  "client_legal_representative" text,
  "approval_status" text DEFAULT 'pending'::text NOT NULL,
  "lifecycle_status" text DEFAULT 'not_started'::text NOT NULL,
  "approved_at" timestamp without time zone,
  "approved_by" varchar(255),
  "decline_reason" text,
  "customer_id" varchar(255),
  "phase_leads" jsonb DEFAULT '{}'::jsonb,
  "phase_metadata" jsonb DEFAULT '{}'::jsonb,
  "discount_type" text,
  "discount_value" numeric(12,2),
  PRIMARY KEY ("id")
);
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "project_number" text;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "client_name" text;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "client_phone" text;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "client_email" text;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "location" text;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'draft'::text NOT NULL;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "priority" text DEFAULT 'medium'::text NOT NULL;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "start_date" timestamp without time zone;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "end_date" timestamp without time zone;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "estimated_budget" numeric(12,2);
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "actual_cost" numeric(12,2);
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "contractor_id" varchar;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "client_cr_number" text;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "client_vat_number" text;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "client_address" text;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "client_legal_representative" text;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "approval_status" text DEFAULT 'pending'::text NOT NULL;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "lifecycle_status" text DEFAULT 'not_started'::text NOT NULL;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "approved_at" timestamp without time zone;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "approved_by" varchar(255);
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "decline_reason" text;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "customer_id" varchar(255);
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "phase_leads" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "phase_metadata" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "discount_type" text;
ALTER TABLE "service_projects" ADD COLUMN IF NOT EXISTS "discount_value" numeric(12,2);
CREATE TABLE IF NOT EXISTS "settings" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_name" text NOT NULL,
  "vat_number" text NOT NULL,
  "address" text NOT NULL,
  "email" text NOT NULL,
  "phone" text NOT NULL,
  "language" text DEFAULT 'English'::text NOT NULL,
  "opening_time" text,
  "closing_time" text,
  "notification_tone" text DEFAULT 'tone1'::text NOT NULL,
  "restaurant_id" varchar,
  "chat_notification_defaults" jsonb,
  "weekly_schedule" jsonb,
  "logo_path" text,
  "b2b_invoice_sequence" integer DEFAULT 0 NOT NULL,
  "opening_time_2" text,
  "closing_time_2" text,
  PRIMARY KEY ("id")
);
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "restaurant_name" text;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "vat_number" text;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "address" text;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "language" text DEFAULT 'English'::text NOT NULL;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "opening_time" text;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "closing_time" text;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "notification_tone" text DEFAULT 'tone1'::text NOT NULL;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "chat_notification_defaults" jsonb;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "weekly_schedule" jsonb;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "logo_path" text;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "b2b_invoice_sequence" integer DEFAULT 0 NOT NULL;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "opening_time_2" text;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "closing_time_2" text;
CREATE TABLE IF NOT EXISTS "shop_bills" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "bill_type" text NOT NULL,
  "amount" numeric(10,2) NOT NULL,
  "payment_date" timestamp without time zone NOT NULL,
  "description" text,
  "branch_id" varchar,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "payment_period" text DEFAULT 'monthly'::text NOT NULL,
  "archived" boolean DEFAULT false NOT NULL,
  "restaurant_id" varchar,
  "employee_id" text,
  "employee_name" text,
  "payment_month" text,
  "invoice_image" text,
  PRIMARY KEY ("id")
);
ALTER TABLE "shop_bills" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "shop_bills" ADD COLUMN IF NOT EXISTS "bill_type" text;
ALTER TABLE "shop_bills" ADD COLUMN IF NOT EXISTS "amount" numeric(10,2);
ALTER TABLE "shop_bills" ADD COLUMN IF NOT EXISTS "payment_date" timestamp without time zone;
ALTER TABLE "shop_bills" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "shop_bills" ADD COLUMN IF NOT EXISTS "branch_id" varchar;
ALTER TABLE "shop_bills" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "shop_bills" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text NOT NULL;
ALTER TABLE "shop_bills" ADD COLUMN IF NOT EXISTS "payment_period" text DEFAULT 'monthly'::text NOT NULL;
ALTER TABLE "shop_bills" ADD COLUMN IF NOT EXISTS "archived" boolean DEFAULT false NOT NULL;
ALTER TABLE "shop_bills" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "shop_bills" ADD COLUMN IF NOT EXISTS "employee_id" text;
ALTER TABLE "shop_bills" ADD COLUMN IF NOT EXISTS "employee_name" text;
ALTER TABLE "shop_bills" ADD COLUMN IF NOT EXISTS "payment_month" text;
ALTER TABLE "shop_bills" ADD COLUMN IF NOT EXISTS "invoice_image" text;
CREATE TABLE IF NOT EXISTS "shop_files" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "file_type" text NOT NULL,
  "file_name" text NOT NULL,
  "file_path" text NOT NULL,
  "file_size" integer,
  "mime_type" text,
  "uploaded_by" varchar,
  "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "shop_files_restaurant_idx" text,
  "shop_files_type_idx" text,
  PRIMARY KEY ("id")
);
ALTER TABLE "shop_files" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "shop_files" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "shop_files" ADD COLUMN IF NOT EXISTS "file_type" text;
ALTER TABLE "shop_files" ADD COLUMN IF NOT EXISTS "file_name" text;
ALTER TABLE "shop_files" ADD COLUMN IF NOT EXISTS "file_path" text;
ALTER TABLE "shop_files" ADD COLUMN IF NOT EXISTS "file_size" integer;
ALTER TABLE "shop_files" ADD COLUMN IF NOT EXISTS "mime_type" text;
ALTER TABLE "shop_files" ADD COLUMN IF NOT EXISTS "uploaded_by" varchar;
ALTER TABLE "shop_files" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE "shop_files" ADD COLUMN IF NOT EXISTS "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE "shop_files" ADD COLUMN IF NOT EXISTS "shop_files_restaurant_idx" text;
ALTER TABLE "shop_files" ADD COLUMN IF NOT EXISTS "shop_files_type_idx" text;
CREATE TABLE IF NOT EXISTS "subscription_invoices" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "serial_number" text NOT NULL,
  "subscription_plan" text NOT NULL,
  "branches_count" integer NOT NULL,
  "base_plan_price" numeric(10,2) NOT NULL,
  "additional_branches_price" numeric(10,2) NOT NULL,
  "subtotal" numeric(10,2) NOT NULL,
  "vat_amount" numeric(10,2) NOT NULL,
  "total" numeric(10,2) NOT NULL,
  "invoice_date" timestamp without time zone DEFAULT now() NOT NULL,
  "pdf_path" text,
  "qr_code" text,
  PRIMARY KEY ("id")
);
ALTER TABLE "subscription_invoices" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "subscription_invoices" ADD COLUMN IF NOT EXISTS "user_id" varchar;
ALTER TABLE "subscription_invoices" ADD COLUMN IF NOT EXISTS "serial_number" text;
ALTER TABLE "subscription_invoices" ADD COLUMN IF NOT EXISTS "subscription_plan" text;
ALTER TABLE "subscription_invoices" ADD COLUMN IF NOT EXISTS "branches_count" integer;
ALTER TABLE "subscription_invoices" ADD COLUMN IF NOT EXISTS "base_plan_price" numeric(10,2);
ALTER TABLE "subscription_invoices" ADD COLUMN IF NOT EXISTS "additional_branches_price" numeric(10,2);
ALTER TABLE "subscription_invoices" ADD COLUMN IF NOT EXISTS "subtotal" numeric(10,2);
ALTER TABLE "subscription_invoices" ADD COLUMN IF NOT EXISTS "vat_amount" numeric(10,2);
ALTER TABLE "subscription_invoices" ADD COLUMN IF NOT EXISTS "total" numeric(10,2);
ALTER TABLE "subscription_invoices" ADD COLUMN IF NOT EXISTS "invoice_date" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "subscription_invoices" ADD COLUMN IF NOT EXISTS "pdf_path" text;
ALTER TABLE "subscription_invoices" ADD COLUMN IF NOT EXISTS "qr_code" text;
CREATE TABLE IF NOT EXISTS "supplier_documents" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "supplier_id" varchar NOT NULL,
  "doc_key" text NOT NULL,
  "file_name" text NOT NULL,
  "file_type" text NOT NULL,
  "file_size" integer,
  "storage_path" text NOT NULL,
  "uploaded_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "supplier_documents" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "supplier_documents" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "supplier_documents" ADD COLUMN IF NOT EXISTS "supplier_id" varchar;
ALTER TABLE "supplier_documents" ADD COLUMN IF NOT EXISTS "doc_key" text;
ALTER TABLE "supplier_documents" ADD COLUMN IF NOT EXISTS "file_name" text;
ALTER TABLE "supplier_documents" ADD COLUMN IF NOT EXISTS "file_type" text;
ALTER TABLE "supplier_documents" ADD COLUMN IF NOT EXISTS "file_size" integer;
ALTER TABLE "supplier_documents" ADD COLUMN IF NOT EXISTS "storage_path" text;
ALTER TABLE "supplier_documents" ADD COLUMN IF NOT EXISTS "uploaded_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "supplier_equipment" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "supplier_id" varchar NOT NULL,
  "name" text NOT NULL,
  "available" boolean DEFAULT true NOT NULL,
  "hourly_rate" numeric(10,2),
  "daily_rate" numeric(10,2),
  "weekly_rate" numeric(10,2),
  "has_driver" boolean DEFAULT false NOT NULL,
  "condition" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "supplier_equipment" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "supplier_equipment" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "supplier_equipment" ADD COLUMN IF NOT EXISTS "supplier_id" varchar;
ALTER TABLE "supplier_equipment" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "supplier_equipment" ADD COLUMN IF NOT EXISTS "available" boolean DEFAULT true NOT NULL;
ALTER TABLE "supplier_equipment" ADD COLUMN IF NOT EXISTS "hourly_rate" numeric(10,2);
ALTER TABLE "supplier_equipment" ADD COLUMN IF NOT EXISTS "daily_rate" numeric(10,2);
ALTER TABLE "supplier_equipment" ADD COLUMN IF NOT EXISTS "weekly_rate" numeric(10,2);
ALTER TABLE "supplier_equipment" ADD COLUMN IF NOT EXISTS "has_driver" boolean DEFAULT false NOT NULL;
ALTER TABLE "supplier_equipment" ADD COLUMN IF NOT EXISTS "condition" text;
ALTER TABLE "supplier_equipment" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0 NOT NULL;
CREATE TABLE IF NOT EXISTS "supplier_equipment_documents" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "supplier_id" varchar NOT NULL,
  "equipment_id" varchar NOT NULL,
  "doc_key" text NOT NULL,
  "file_name" text NOT NULL,
  "file_type" text NOT NULL,
  "file_size" integer,
  "storage_path" text NOT NULL,
  "uploaded_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "supplier_equipment_documents" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "supplier_equipment_documents" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "supplier_equipment_documents" ADD COLUMN IF NOT EXISTS "supplier_id" varchar;
ALTER TABLE "supplier_equipment_documents" ADD COLUMN IF NOT EXISTS "equipment_id" varchar;
ALTER TABLE "supplier_equipment_documents" ADD COLUMN IF NOT EXISTS "doc_key" text;
ALTER TABLE "supplier_equipment_documents" ADD COLUMN IF NOT EXISTS "file_name" text;
ALTER TABLE "supplier_equipment_documents" ADD COLUMN IF NOT EXISTS "file_type" text;
ALTER TABLE "supplier_equipment_documents" ADD COLUMN IF NOT EXISTS "file_size" integer;
ALTER TABLE "supplier_equipment_documents" ADD COLUMN IF NOT EXISTS "storage_path" text;
ALTER TABLE "supplier_equipment_documents" ADD COLUMN IF NOT EXISTS "uploaded_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "supplier_payments" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "supplier_id" varchar NOT NULL,
  "label" text NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "due_date" timestamp without time zone NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "paid_date" timestamp without time zone,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "supplier_payments" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "supplier_payments" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "supplier_payments" ADD COLUMN IF NOT EXISTS "supplier_id" varchar;
ALTER TABLE "supplier_payments" ADD COLUMN IF NOT EXISTS "label" text;
ALTER TABLE "supplier_payments" ADD COLUMN IF NOT EXISTS "amount" numeric(12,2);
ALTER TABLE "supplier_payments" ADD COLUMN IF NOT EXISTS "due_date" timestamp without time zone;
ALTER TABLE "supplier_payments" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text NOT NULL;
ALTER TABLE "supplier_payments" ADD COLUMN IF NOT EXISTS "paid_date" timestamp without time zone;
ALTER TABLE "supplier_payments" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "supplier_rentals" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "supplier_id" varchar NOT NULL,
  "equipment_name" text NOT NULL,
  "start_date" timestamp without time zone NOT NULL,
  "end_date" timestamp without time zone NOT NULL,
  "location" text,
  "reference_number" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "renter_name" text,
  "renter_email" text,
  "renter_whatsapp" text,
  "rate_unit" text,
  PRIMARY KEY ("id")
);
ALTER TABLE "supplier_rentals" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "supplier_rentals" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "supplier_rentals" ADD COLUMN IF NOT EXISTS "supplier_id" varchar;
ALTER TABLE "supplier_rentals" ADD COLUMN IF NOT EXISTS "equipment_name" text;
ALTER TABLE "supplier_rentals" ADD COLUMN IF NOT EXISTS "start_date" timestamp without time zone;
ALTER TABLE "supplier_rentals" ADD COLUMN IF NOT EXISTS "end_date" timestamp without time zone;
ALTER TABLE "supplier_rentals" ADD COLUMN IF NOT EXISTS "location" text;
ALTER TABLE "supplier_rentals" ADD COLUMN IF NOT EXISTS "reference_number" text;
ALTER TABLE "supplier_rentals" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "supplier_rentals" ADD COLUMN IF NOT EXISTS "renter_name" text;
ALTER TABLE "supplier_rentals" ADD COLUMN IF NOT EXISTS "renter_email" text;
ALTER TABLE "supplier_rentals" ADD COLUMN IF NOT EXISTS "renter_whatsapp" text;
ALTER TABLE "supplier_rentals" ADD COLUMN IF NOT EXISTS "rate_unit" text;
CREATE TABLE IF NOT EXISTS "support_tickets" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "ticket_number" text NOT NULL,
  "subject" text NOT NULL,
  "category" text NOT NULL,
  "priority" text DEFAULT 'medium'::text NOT NULL,
  "status" text DEFAULT 'open'::text NOT NULL,
  "description" text NOT NULL,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp without time zone DEFAULT now() NOT NULL,
  "resolved_at" timestamp without time zone,
  "closed_at" timestamp without time zone,
  "assigned_to_it" boolean DEFAULT true NOT NULL,
  "restaurant_id" varchar,
  "assigned_to" varchar,
  "assigned_by" varchar,
  "assigned_at" timestamp without time zone,
  "support_tickets_restaurant_status_idx" text,
  PRIMARY KEY ("id")
);
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "user_id" varchar;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "ticket_number" text;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "subject" text;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "category" text;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "priority" text DEFAULT 'medium'::text NOT NULL;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'open'::text NOT NULL;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "updated_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "resolved_at" timestamp without time zone;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "closed_at" timestamp without time zone;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "assigned_to_it" boolean DEFAULT true NOT NULL;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "assigned_to" varchar;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "assigned_by" varchar;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "assigned_at" timestamp without time zone;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "support_tickets_restaurant_status_idx" text;
CREATE TABLE IF NOT EXISTS "ticket_messages" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "ticket_id" varchar NOT NULL,
  "sender_id" varchar NOT NULL,
  "sender_name" text NOT NULL,
  "sender_role" text NOT NULL,
  "message" text NOT NULL,
  "attachment_url" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "is_read" boolean DEFAULT false NOT NULL,
  "restaurant_id" varchar,
  PRIMARY KEY ("id")
);
ALTER TABLE "ticket_messages" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "ticket_messages" ADD COLUMN IF NOT EXISTS "ticket_id" varchar;
ALTER TABLE "ticket_messages" ADD COLUMN IF NOT EXISTS "sender_id" varchar;
ALTER TABLE "ticket_messages" ADD COLUMN IF NOT EXISTS "sender_name" text;
ALTER TABLE "ticket_messages" ADD COLUMN IF NOT EXISTS "sender_role" text;
ALTER TABLE "ticket_messages" ADD COLUMN IF NOT EXISTS "message" text;
ALTER TABLE "ticket_messages" ADD COLUMN IF NOT EXISTS "attachment_url" text;
ALTER TABLE "ticket_messages" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "ticket_messages" ADD COLUMN IF NOT EXISTS "is_read" boolean DEFAULT false NOT NULL;
ALTER TABLE "ticket_messages" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
CREATE TABLE IF NOT EXISTS "transactions" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "transaction_id" text NOT NULL,
  "order_id" varchar,
  "branch_id" varchar,
  "item_count" integer NOT NULL,
  "subtotal" numeric(10,2) NOT NULL,
  "tax" numeric(10,2) NOT NULL,
  "total" numeric(10,2) NOT NULL,
  "payment_method" text NOT NULL,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "restaurant_id" varchar,
  PRIMARY KEY ("id")
);
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "transaction_id" text;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "order_id" varchar;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "branch_id" varchar;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "item_count" integer;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "subtotal" numeric(10,2);
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "tax" numeric(10,2);
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "total" numeric(10,2);
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "payment_method" text;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
CREATE TABLE IF NOT EXISTS "users" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "username" text NOT NULL,
  "password" text NOT NULL,
  "role" text DEFAULT 'employee'::text NOT NULL,
  "permissions" jsonb NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "commercial_registration" text,
  "subscription_plan" text,
  "subscription_status" text DEFAULT 'inactive'::text,
  "subscription_start_date" timestamp without time zone,
  "subscription_end_date" timestamp without time zone,
  "password_reset_token" text,
  "password_reset_expiry" timestamp without time zone,
  "device_preference" text DEFAULT 'laptop'::text,
  "subscription_cancelled_at" timestamp without time zone,
  "branches_count" integer DEFAULT 1 NOT NULL,
  "full_name" text NOT NULL,
  "email" text,
  "phone" text,
  "branch_id" varchar,
  "employee_number" text,
  "hire_date" timestamp without time zone,
  "recruitment_source" text,
  "probation_end_date" timestamp without time zone,
  "contract_type" text,
  "vacation_days_total" integer DEFAULT 0,
  "vacation_days_used" integer DEFAULT 0,
  "visa_number" text,
  "visa_fees" numeric(10,2),
  "visa_expiry_date" timestamp without time zone,
  "visa_status" text,
  "ticket_amount" numeric(10,2),
  "ticket_destination" text,
  "ticket_date" timestamp without time zone,
  "ticket_status" text,
  "performance_rating" numeric(3,2),
  "last_review_date" timestamp without time zone,
  "performance_notes" text,
  "documents" jsonb,
  "certifications" text[],
  "training_completed" text[],
  "restaurant_name" text,
  "national_id" text,
  "tax_number" text,
  "restaurant_type" text,
  "restaurant_id" varchar,
  "chat_notification_settings" jsonb,
  "last_activity_at" timestamp without time zone,
  "last_login_at" timestamp without time zone,
  "salary" numeric(10,2),
  "position" text,
  "language" text DEFAULT 'English'::text,
  "account_type" text,
  "weekly_schedule" jsonb,
  PRIMARY KEY ("id")
);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'employee'::text NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "permissions" jsonb;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "commercial_registration" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_plan" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_status" text DEFAULT 'inactive'::text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_start_date" timestamp without time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_end_date" timestamp without time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_reset_token" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_reset_expiry" timestamp without time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "device_preference" text DEFAULT 'laptop'::text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_cancelled_at" timestamp without time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "branches_count" integer DEFAULT 1 NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "full_name" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "branch_id" varchar;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "employee_number" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "hire_date" timestamp without time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "recruitment_source" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "probation_end_date" timestamp without time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "contract_type" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "vacation_days_total" integer DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "vacation_days_used" integer DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "visa_number" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "visa_fees" numeric(10,2);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "visa_expiry_date" timestamp without time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "visa_status" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ticket_amount" numeric(10,2);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ticket_destination" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ticket_date" timestamp without time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ticket_status" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "performance_rating" numeric(3,2);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_review_date" timestamp without time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "performance_notes" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "documents" jsonb;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "certifications" text[];
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "training_completed" text[];
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "restaurant_name" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "national_id" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tax_number" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "restaurant_type" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "chat_notification_settings" jsonb;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_activity_at" timestamp without time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" timestamp without time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "salary" numeric(10,2);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "position" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "language" text DEFAULT 'English'::text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "account_type" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "weekly_schedule" jsonb;
CREATE TABLE IF NOT EXISTS "valuations" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "property_id" varchar,
  "property_name" text NOT NULL,
  "property_type" text NOT NULL,
  "location" text NOT NULL,
  "area" numeric(10,2),
  "area_unit" text DEFAULT 'sqm'::text,
  "estimated_value" numeric(12,2) NOT NULL,
  "market_value" numeric(12,2),
  "assessment_date" timestamp without time zone DEFAULT now() NOT NULL,
  "valuation_type" text DEFAULT 'market'::text NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "notes" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "valuations" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "valuations" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "valuations" ADD COLUMN IF NOT EXISTS "property_id" varchar;
ALTER TABLE "valuations" ADD COLUMN IF NOT EXISTS "property_name" text;
ALTER TABLE "valuations" ADD COLUMN IF NOT EXISTS "property_type" text;
ALTER TABLE "valuations" ADD COLUMN IF NOT EXISTS "location" text;
ALTER TABLE "valuations" ADD COLUMN IF NOT EXISTS "area" numeric(10,2);
ALTER TABLE "valuations" ADD COLUMN IF NOT EXISTS "area_unit" text DEFAULT 'sqm'::text;
ALTER TABLE "valuations" ADD COLUMN IF NOT EXISTS "estimated_value" numeric(12,2);
ALTER TABLE "valuations" ADD COLUMN IF NOT EXISTS "market_value" numeric(12,2);
ALTER TABLE "valuations" ADD COLUMN IF NOT EXISTS "assessment_date" timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE "valuations" ADD COLUMN IF NOT EXISTS "valuation_type" text DEFAULT 'market'::text NOT NULL;
ALTER TABLE "valuations" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text NOT NULL;
ALTER TABLE "valuations" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "valuations" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT now() NOT NULL;
CREATE TABLE IF NOT EXISTS "violation_references" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "authority" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "document_path" text NOT NULL,
  "uploaded_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "violation_references" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "violation_references" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "violation_references" ADD COLUMN IF NOT EXISTS "authority" text;
ALTER TABLE "violation_references" ADD COLUMN IF NOT EXISTS "title" text;
ALTER TABLE "violation_references" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "violation_references" ADD COLUMN IF NOT EXISTS "document_path" text;
ALTER TABLE "violation_references" ADD COLUMN IF NOT EXISTS "uploaded_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;
CREATE TABLE IF NOT EXISTS "violations" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "branch_id" varchar,
  "title" text NOT NULL,
  "description" text,
  "authority" text NOT NULL,
  "fee_amount" numeric(10,2) NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "violation_date" timestamp without time zone NOT NULL,
  "resolved_date" timestamp without time zone,
  "document_path" text,
  "linked_bill_id" varchar,
  "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY ("id")
);
ALTER TABLE "violations" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "violations" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "violations" ADD COLUMN IF NOT EXISTS "branch_id" varchar;
ALTER TABLE "violations" ADD COLUMN IF NOT EXISTS "title" text;
ALTER TABLE "violations" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "violations" ADD COLUMN IF NOT EXISTS "authority" text;
ALTER TABLE "violations" ADD COLUMN IF NOT EXISTS "fee_amount" numeric(10,2);
ALTER TABLE "violations" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text NOT NULL;
ALTER TABLE "violations" ADD COLUMN IF NOT EXISTS "violation_date" timestamp without time zone;
ALTER TABLE "violations" ADD COLUMN IF NOT EXISTS "resolved_date" timestamp without time zone;
ALTER TABLE "violations" ADD COLUMN IF NOT EXISTS "document_path" text;
ALTER TABLE "violations" ADD COLUMN IF NOT EXISTS "linked_bill_id" varchar;
ALTER TABLE "violations" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE "violations" ADD COLUMN IF NOT EXISTS "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;
CREATE TABLE IF NOT EXISTS "zatca_settings" (
  "id" varchar DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" varchar NOT NULL,
  "environment" text DEFAULT 'sandbox'::text NOT NULL,
  "is_enabled" boolean DEFAULT false NOT NULL,
  "csr_common_name" text,
  "csr_serial_number" text,
  "csr_organization_identifier" text,
  "csr_organization_unit_name" text,
  "csr_organization_name" text,
  "csr_country_name" text DEFAULT 'SA'::text,
  "csr_invoice_type" text DEFAULT '1100'::text,
  "csr_location_address" text,
  "csr_industry_business_category" text,
  "seller_street_name" text,
  "seller_building_number" text,
  "seller_city_subdivision" text,
  "seller_city" text,
  "seller_postal_zone" text,
  "seller_cr_number" text,
  "private_key" text,
  "csr" text,
  "compliance_csid" text,
  "compliance_csid_secret" text,
  "production_csid" text,
  "production_csid_secret" text,
  "csid_expires_at" timestamp without time zone,
  "onboarding_status" text DEFAULT 'not_started'::text,
  "certificate" text,
  "last_invoice_counter" integer DEFAULT 0 NOT NULL,
  "last_invoice_hash" text,
  "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "compliance_request_id" text,
  "compliance_csid_received_at" timestamp without time zone,
  PRIMARY KEY ("id")
);
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "restaurant_id" varchar;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "environment" text DEFAULT 'sandbox'::text NOT NULL;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "is_enabled" boolean DEFAULT false NOT NULL;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "csr_common_name" text;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "csr_serial_number" text;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "csr_organization_identifier" text;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "csr_organization_unit_name" text;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "csr_organization_name" text;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "csr_country_name" text DEFAULT 'SA'::text;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "csr_invoice_type" text DEFAULT '1100'::text;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "csr_location_address" text;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "csr_industry_business_category" text;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "seller_street_name" text;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "seller_building_number" text;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "seller_city_subdivision" text;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "seller_city" text;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "seller_postal_zone" text;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "seller_cr_number" text;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "private_key" text;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "csr" text;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "compliance_csid" text;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "compliance_csid_secret" text;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "production_csid" text;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "production_csid_secret" text;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "csid_expires_at" timestamp without time zone;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "onboarding_status" text DEFAULT 'not_started'::text;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "certificate" text;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "last_invoice_counter" integer DEFAULT 0 NOT NULL;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "last_invoice_hash" text;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "compliance_request_id" text;
ALTER TABLE "zatca_settings" ADD COLUMN IF NOT EXISTS "compliance_csid_received_at" timestamp without time zone;
