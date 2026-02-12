CREATE TABLE "addons" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"vat_amount" numeric(10, 2) NOT NULL,
	"menu_item_ids" varchar[],
	"available" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"inventory_item_id" varchar
);
--> statement-breakpoint
CREATE TABLE "bootstrap_reset_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"consumed" boolean DEFAULT false NOT NULL,
	"consumed_at" timestamp,
	"consumed_by" text,
	"ip_address" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"name" text NOT NULL,
	"location" text NOT NULL,
	"phone" text NOT NULL,
	"manager" text NOT NULL,
	"staff" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_info" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name_en" text DEFAULT 'BlindSpot System (BSS)' NOT NULL,
	"company_name_ar" text DEFAULT 'نظام بلايند سبوت' NOT NULL,
	"vat_number" text DEFAULT '' NOT NULL,
	"cr_number" text DEFAULT '' NOT NULL,
	"national_id" text DEFAULT '' NOT NULL,
	"email" text DEFAULT 'IT@kinbss.com' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"website" text DEFAULT '' NOT NULL,
	"address_en" text DEFAULT 'Saudi Arabia' NOT NULL,
	"address_ar" text DEFAULT 'المملكة العربية السعودية' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"postal_code" text DEFAULT '' NOT NULL,
	"bank_name" text DEFAULT '' NOT NULL,
	"bank_account_name" text DEFAULT '' NOT NULL,
	"bank_account_number" text DEFAULT '' NOT NULL,
	"bank_iban" text DEFAULT '' NOT NULL,
	"logo_url" text,
	"updated_by" varchar,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_conversation_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"conversation_id" varchar NOT NULL,
	"is_muted" boolean DEFAULT false NOT NULL,
	"priority" text DEFAULT 'normal',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"conversation_id" varchar NOT NULL,
	"sender_id" varchar,
	"sender_name" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_bills" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bill_type" text NOT NULL,
	"vendor" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"vat_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"bill_date" timestamp NOT NULL,
	"due_date" timestamp,
	"paid_date" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_period" text DEFAULT 'monthly' NOT NULL,
	"description" text,
	"reference_number" text,
	"attachment_path" text,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_files" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_type" text NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"description" text,
	"uploaded_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"conversation_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"type" text NOT NULL,
	"name" text,
	"scope" text NOT NULL,
	"branch_id" varchar,
	"created_by" varchar,
	"participant_hash" text,
	"last_message_at" timestamp,
	"last_message_preview" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_apps" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"name" text NOT NULL,
	"commission" numeric(5, 2) NOT NULL,
	"banking_fees" numeric(5, 2) NOT NULL,
	"mark_up" numeric(5, 2) DEFAULT '0' NOT NULL,
	"subsidy_tiers" jsonb DEFAULT '[]' NOT NULL,
	"pos_fees" numeric(10, 2) DEFAULT '0' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_profitability" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"delivery_app_id" varchar NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"period_type" text DEFAULT 'monthly' NOT NULL,
	"start_date" date,
	"end_date" date,
	"orders" integer DEFAULT 0 NOT NULL,
	"sales" numeric(12, 2) DEFAULT '0' NOT NULL,
	"revenue" numeric(12, 2) DEFAULT '0' NOT NULL,
	"commission" numeric(12, 2) DEFAULT '0' NOT NULL,
	"banking" numeric(12, 2) DEFAULT '0' NOT NULL,
	"subsidy" numeric(12, 2) DEFAULT '0' NOT NULL,
	"vat" numeric(12, 2) DEFAULT '0' NOT NULL,
	"pos_fees" numeric(12, 2) DEFAULT '0' NOT NULL,
	"profit" numeric(12, 2) DEFAULT '0' NOT NULL,
	"net_earnings" numeric(12, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device_serial_numbers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"branch_id" varchar,
	"branch_number" integer NOT NULL,
	"serial_number" text NOT NULL,
	"solution_name" text DEFAULT 'BSS-POS' NOT NULL,
	"model" text DEFAULT 'Standard' NOT NULL,
	"version" text DEFAULT '1.0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "device_serial_numbers_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE "employee_activity_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
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
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "factory_products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"weight" text,
	"length" text,
	"product_type" text,
	"colour" text,
	"quantity" numeric(10, 2) DEFAULT '0' NOT NULL,
	"thickness" text,
	"price" numeric(10, 2) NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"vat_amount" numeric(10, 2) NOT NULL,
	"description" text,
	"available" boolean DEFAULT true NOT NULL,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit" text NOT NULL,
	"reference_quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"unit_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"supplier" text NOT NULL,
	"status" text DEFAULT 'In Stock' NOT NULL,
	"branch_id" varchar,
	"sort_order" integer DEFAULT 0,
	"expiration_days" integer,
	"purchase_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"inventory_item_id" varchar NOT NULL,
	"order_id" varchar,
	"type" text NOT NULL,
	"quantity_change" numeric(10, 2) NOT NULL,
	"quantity_before" numeric(10, 2) NOT NULL,
	"quantity_after" numeric(10, 2) NOT NULL,
	"notes" text,
	"branch_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investors" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"name" text NOT NULL,
	"national_id" text,
	"contact_number" text,
	"investor_type" text DEFAULT 'money' NOT NULL,
	"recipe_id" varchar,
	"amount_invested" numeric(12, 2) NOT NULL,
	"interest_percentage" numeric(5, 2) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"document_path" text,
	"document_content" text,
	"document_filename" text,
	"iban" text,
	"bank_name" text,
	"iban_certificate_content" text,
	"iban_certificate_filename" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_zatca_status" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" varchar NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"invoice_type" text NOT NULL,
	"invoice_sub_type" text NOT NULL,
	"uuid" text NOT NULL,
	"invoice_hash" text NOT NULL,
	"invoice_counter" integer NOT NULL,
	"submission_type" text NOT NULL,
	"submission_status" text DEFAULT 'pending' NOT NULL,
	"zatca_request_id" text,
	"zatca_response_code" text,
	"zatca_response_message" text,
	"zatca_warnings" jsonb,
	"zatca_errors" jsonb,
	"signed_xml" text,
	"qr_code" text,
	"submitted_at" timestamp,
	"cleared_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"invoice_number" text NOT NULL,
	"invoice_type" text DEFAULT 'simplified' NOT NULL,
	"document_type" text DEFAULT 'invoice' NOT NULL,
	"referenced_invoice_id" varchar,
	"adjustment_reason" text,
	"transaction_id" varchar,
	"order_id" varchar,
	"procurement_id" varchar,
	"branch_id" varchar,
	"customer_name" text,
	"customer_vat_number" text,
	"items" jsonb NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"vat_amount" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"qr_code" text,
	"pdf_path" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "licenses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"license_type" text NOT NULL,
	"license_number" text NOT NULL,
	"license_name" text NOT NULL,
	"issuing_authority" text NOT NULL,
	"issue_date" timestamp NOT NULL,
	"expiry_date" timestamp NOT NULL,
	"status" text DEFAULT 'active',
	"renewal_reminder_days" integer DEFAULT 30,
	"fee" numeric(10, 2),
	"document_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" varchar
);
--> statement-breakpoint
CREATE TABLE "menu_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"recipe_id" varchar,
	"inventory_item_id" varchar,
	"portion_size" numeric(5, 2) DEFAULT '1.00',
	"stock_no" numeric(10, 2),
	"price" numeric(10, 2) NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"vat_amount" numeric(10, 2) NOT NULL,
	"discount" numeric(5, 2) DEFAULT '0' NOT NULL,
	"description" text,
	"available" boolean DEFAULT true NOT NULL,
	"image_url" text,
	"display_size" text DEFAULT 'medium' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_reads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"conversation_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"last_read_message_id" varchar,
	"last_read_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_vat_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"report_month" integer NOT NULL,
	"report_year" integer NOT NULL,
	"serial_number" text NOT NULL,
	"total_sales" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_sales_base_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_sales_vat" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_purchases" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_purchases_base_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_purchases_vat" numeric(12, 2) DEFAULT '0' NOT NULL,
	"net_vat_payable" numeric(12, 2) DEFAULT '0' NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"pdf_path" text,
	"qr_code" text,
	CONSTRAINT "monthly_vat_reports_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE "moyasar_payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"moyasar_id" text NOT NULL,
	"order_id" varchar,
	"transaction_id" varchar,
	"amount" numeric(10, 2) NOT NULL,
	"amount_halalas" integer NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"status" text NOT NULL,
	"payment_method" text,
	"card_brand" text,
	"card_last4" text,
	"fee" numeric(10, 2),
	"refunded_amount" numeric(10, 2) DEFAULT '0',
	"description" text,
	"customer_name" text,
	"customer_email" text,
	"customer_phone" text,
	"callback_url" text,
	"metadata" jsonb,
	"error_message" text,
	"branch_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "moyasar_payments_moyasar_id_unique" UNIQUE("moyasar_id")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"order_number" text NOT NULL,
	"branch_id" varchar,
	"customer_id" varchar,
	"customer_name" text,
	"customer_phone" text,
	"order_type" text NOT NULL,
	"table" text,
	"address" text,
	"delivery_app_id" varchar,
	"earnings_decrease_applied" boolean DEFAULT false NOT NULL,
	"items" jsonb NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"payment_method" text DEFAULT 'Cash' NOT NULL,
	"payment_status" text DEFAULT 'Unpaid',
	"moyasar_payment_id" text,
	"status" text DEFAULT 'Pending' NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "pending_signups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
	"amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"uploaded_files" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "pending_signups_geidea_session_id_unique" UNIQUE("geidea_session_id")
);
--> statement-breakpoint
CREATE TABLE "printers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "procurement" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"supplier" text,
	"category" text,
	"quantity" integer,
	"unit_price" text,
	"total_cost" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"requested_by" text,
	"approved_by" text,
	"branch_id" varchar,
	"order_date" timestamp,
	"expected_delivery" timestamp,
	"actual_delivery" timestamp,
	"notes" text,
	"invoice_image" text,
	"bill_id" varchar,
	"inventory_item_id" varchar,
	"original_procurement_id" varchar,
	"unit" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"name" text NOT NULL,
	"prep_time" text NOT NULL,
	"cook_time" text NOT NULL,
	"servings" integer NOT NULL,
	"cost" numeric(10, 2) NOT NULL,
	"ingredients" jsonb NOT NULL,
	"steps" jsonb NOT NULL,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "refund_invoices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"serial_number" text NOT NULL,
	"client_name" text NOT NULL,
	"client_email" text NOT NULL,
	"restaurant_name" text NOT NULL,
	"subscription_plan" text NOT NULL,
	"subscription_start_date" timestamp NOT NULL,
	"cancellation_date" timestamp NOT NULL,
	"months_used" integer NOT NULL,
	"original_price" numeric(10, 2) NOT NULL,
	"monthly_rate" numeric(10, 2) NOT NULL,
	"charged_amount" numeric(10, 2) NOT NULL,
	"refund_amount" numeric(10, 2) NOT NULL,
	"pdf_data" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "refund_invoices_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"national_id" text NOT NULL,
	"has_vat_registration" boolean DEFAULT true NOT NULL,
	"tax_number" text,
	"commercial_registration" text NOT NULL,
	"business_type" text DEFAULT 'restaurant' NOT NULL,
	"type" text NOT NULL,
	"subscription_plan" text NOT NULL,
	"branches_count" integer DEFAULT 1 NOT NULL,
	"subscription_status" text DEFAULT 'inactive' NOT NULL,
	"subscription_start_date" timestamp,
	"subscription_end_date" timestamp,
	"subscription_cancelled_at" timestamp,
	"cancellation_reason" text,
	"setup_complete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salaries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"employee_name" text NOT NULL,
	"position" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_date" timestamp NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"branch_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"restaurant_name" text NOT NULL,
	"vat_number" text NOT NULL,
	"address" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"language" text DEFAULT 'English' NOT NULL,
	"opening_time" text,
	"closing_time" text,
	"logo_path" text,
	"notification_tone" text DEFAULT 'tone1' NOT NULL,
	"weekly_schedule" jsonb,
	"chat_notification_defaults" jsonb,
	"b2b_invoice_sequence" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "settings_restaurant_id_unique" UNIQUE("restaurant_id")
);
--> statement-breakpoint
CREATE TABLE "shop_bills" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"bill_type" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_date" timestamp NOT NULL,
	"payment_period" text DEFAULT 'monthly' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"description" text,
	"employee_id" varchar,
	"employee_name" text,
	"payment_month" text,
	"archived" boolean DEFAULT false NOT NULL,
	"invoice_image" text,
	"branch_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_files" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"file_type" text NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"uploaded_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_invoices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"serial_number" text NOT NULL,
	"subscription_plan" text NOT NULL,
	"branches_count" integer NOT NULL,
	"base_plan_price" numeric(10, 2) NOT NULL,
	"additional_branches_price" numeric(10, 2) NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"vat_amount" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"invoice_date" timestamp DEFAULT now() NOT NULL,
	"pdf_path" text,
	"qr_code" text,
	CONSTRAINT "subscription_invoices_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"ticket_number" text NOT NULL,
	"subject" text NOT NULL,
	"category" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"closed_at" timestamp,
	"assigned_to_it" boolean DEFAULT true NOT NULL,
	"assigned_to" varchar,
	"assigned_by" varchar,
	"assigned_at" timestamp,
	CONSTRAINT "support_tickets_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
CREATE TABLE "ticket_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"ticket_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"sender_name" text NOT NULL,
	"sender_role" text NOT NULL,
	"message" text NOT NULL,
	"attachment_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"transaction_id" text NOT NULL,
	"order_id" varchar,
	"branch_id" varchar,
	"item_count" integer NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"payment_method" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text,
	"phone" text,
	"role" text DEFAULT 'employee' NOT NULL,
	"permissions" jsonb NOT NULL,
	"branch_id" varchar,
	"password_reset_token" text,
	"password_reset_expiry" timestamp,
	"device_preference" text DEFAULT 'laptop',
	"active" boolean DEFAULT true NOT NULL,
	"employee_number" text,
	"hire_date" timestamp,
	"recruitment_source" text,
	"probation_end_date" timestamp,
	"contract_type" text,
	"vacation_days_total" integer DEFAULT 0,
	"vacation_days_used" integer DEFAULT 0,
	"visa_number" text,
	"visa_fees" numeric(10, 2),
	"visa_expiry_date" timestamp,
	"visa_status" text,
	"ticket_amount" numeric(10, 2),
	"ticket_destination" text,
	"ticket_date" timestamp,
	"ticket_status" text,
	"performance_rating" numeric(3, 2),
	"last_review_date" timestamp,
	"performance_notes" text,
	"salary" numeric(10, 2),
	"position" text,
	"documents" jsonb,
	"certifications" text[],
	"training_completed" text[],
	"weekly_schedule" jsonb,
	"chat_notification_settings" jsonb,
	"last_activity_at" timestamp,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "violation_references" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"authority" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"document_path" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "violations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"branch_id" varchar,
	"title" text NOT NULL,
	"description" text,
	"authority" text NOT NULL,
	"fee_amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"violation_date" timestamp NOT NULL,
	"resolved_date" timestamp,
	"document_path" text,
	"linked_bill_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zatca_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"environment" text DEFAULT 'sandbox' NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"csr_common_name" text,
	"csr_serial_number" text,
	"csr_organization_identifier" text,
	"csr_organization_unit_name" text,
	"csr_organization_name" text,
	"csr_country_name" text DEFAULT 'SA',
	"csr_invoice_type" text DEFAULT '1100',
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
	"csid_expires_at" timestamp,
	"onboarding_status" text DEFAULT 'not_started',
	"certificate" text,
	"last_invoice_counter" integer DEFAULT 0 NOT NULL,
	"last_invoice_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "zatca_settings_restaurant_id_unique" UNIQUE("restaurant_id")
);
--> statement-breakpoint
ALTER TABLE "addons" ADD CONSTRAINT "addons_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addons" ADD CONSTRAINT "addons_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_info" ADD CONSTRAINT "business_info_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversation_preferences" ADD CONSTRAINT "chat_conversation_preferences_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversation_preferences" ADD CONSTRAINT "chat_conversation_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversation_preferences" ADD CONSTRAINT "chat_conversation_preferences_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_bills" ADD CONSTRAINT "company_bills_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_files" ADD CONSTRAINT "company_files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_apps" ADD CONSTRAINT "delivery_apps_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_profitability" ADD CONSTRAINT "delivery_profitability_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_profitability" ADD CONSTRAINT "delivery_profitability_delivery_app_id_delivery_apps_id_fk" FOREIGN KEY ("delivery_app_id") REFERENCES "public"."delivery_apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_serial_numbers" ADD CONSTRAINT "device_serial_numbers_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_serial_numbers" ADD CONSTRAINT "device_serial_numbers_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_activity_log" ADD CONSTRAINT "employee_activity_log_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_activity_log" ADD CONSTRAINT "employee_activity_log_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_activity_log" ADD CONSTRAINT "employee_activity_log_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factory_products" ADD CONSTRAINT "factory_products_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investors" ADD CONSTRAINT "investors_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investors" ADD CONSTRAINT "investors_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_zatca_status" ADD CONSTRAINT "invoice_zatca_status_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_zatca_status" ADD CONSTRAINT "invoice_zatca_status_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_last_read_message_id_chat_messages_id_fk" FOREIGN KEY ("last_read_message_id") REFERENCES "public"."chat_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_vat_reports" ADD CONSTRAINT "monthly_vat_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moyasar_payments" ADD CONSTRAINT "moyasar_payments_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moyasar_payments" ADD CONSTRAINT "moyasar_payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moyasar_payments" ADD CONSTRAINT "moyasar_payments_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moyasar_payments" ADD CONSTRAINT "moyasar_payments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_app_id_delivery_apps_id_fk" FOREIGN KEY ("delivery_app_id") REFERENCES "public"."delivery_apps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printers" ADD CONSTRAINT "printers_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printers" ADD CONSTRAINT "printers_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procurement" ADD CONSTRAINT "procurement_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_invoices" ADD CONSTRAINT "refund_invoices_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salaries" ADD CONSTRAINT "salaries_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salaries" ADD CONSTRAINT "salaries_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_bills" ADD CONSTRAINT "shop_bills_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_bills" ADD CONSTRAINT "shop_bills_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_bills" ADD CONSTRAINT "shop_bills_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_files" ADD CONSTRAINT "shop_files_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_files" ADD CONSTRAINT "shop_files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_invoices" ADD CONSTRAINT "subscription_invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violation_references" ADD CONSTRAINT "violation_references_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violations" ADD CONSTRAINT "violations_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violations" ADD CONSTRAINT "violations_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violations" ADD CONSTRAINT "violations_linked_bill_id_shop_bills_id_fk" FOREIGN KEY ("linked_bill_id") REFERENCES "public"."shop_bills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zatca_settings" ADD CONSTRAINT "zatca_settings_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "delivery_profitability_restaurant_app_idx" ON "delivery_profitability" USING btree ("restaurant_id","delivery_app_id");--> statement-breakpoint
CREATE INDEX "inventory_items_restaurant_idx" ON "inventory_items" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "inv_trans_restaurant_inventory_idx" ON "inventory_transactions" USING btree ("restaurant_id","inventory_item_id");--> statement-breakpoint
CREATE INDEX "inv_trans_restaurant_created_at_idx" ON "inventory_transactions" USING btree ("restaurant_id","created_at");--> statement-breakpoint
CREATE INDEX "invoice_zatca_status_invoice_idx" ON "invoice_zatca_status" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_zatca_status_restaurant_idx" ON "invoice_zatca_status" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "invoice_zatca_status_status_idx" ON "invoice_zatca_status" USING btree ("submission_status");--> statement-breakpoint
CREATE INDEX "invoices_restaurant_created_at_idx" ON "invoices" USING btree ("restaurant_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_restaurant_created_at_idx" ON "orders" USING btree ("restaurant_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_restaurant_status_idx" ON "orders" USING btree ("restaurant_id","status");--> statement-breakpoint
CREATE INDEX "shop_bills_restaurant_status_idx" ON "shop_bills" USING btree ("restaurant_id","status");--> statement-breakpoint
CREATE INDEX "shop_files_restaurant_idx" ON "shop_files" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "shop_files_type_idx" ON "shop_files" USING btree ("file_type");--> statement-breakpoint
CREATE INDEX "support_tickets_restaurant_status_idx" ON "support_tickets" USING btree ("restaurant_id","status");--> statement-breakpoint
CREATE INDEX "transactions_restaurant_created_at_idx" ON "transactions" USING btree ("restaurant_id","created_at");--> statement-breakpoint
CREATE INDEX "transactions_restaurant_order_idx" ON "transactions" USING btree ("restaurant_id","order_id");