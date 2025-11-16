# BlindSpot System (BSS) - Business Management System

## Overview
BlindSpot System (BSS) is a comprehensive, ZATCA-compliant business management system designed for Saudi Arabian businesses serving both **Restaurant** and **Factory** business types. It integrates Point of Sale (POS), inventory, menu/recipe management (or product/license management for factories), multi-branch operations, order processing, kitchen/workshop display, and advanced analytics. The system aims to enhance operational efficiency, ensure regulatory compliance, optimize profitability, and support strategic decision-making through features like sales analytics, business reporting, and demand forecasting. Empowering businesses with smart management solutions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript (Vite).
- **UI**: Shadcn UI (New York style) based on Radix UI and Tailwind CSS, following Material Design principles.
- **State Management**: TanStack Query for server state; local React state for UI.
- **Form Handling**: React Hook Form with Zod validation.
- **Styling**: Tailwind CSS with custom design tokens, responsive layouts.
- **Branding**: BSS eagle logo displayed in app sidebar header, footer, login, and setup pages. Sidebar header includes logo and "Business Management System" subtitle using semantic color tokens. Footer displays "Made By Kinzhal LTD Co." across all pages. Tagline: "Empowering businesses with smart management solutions".
- **UI/UX**: Modern gradient designs, smooth animations, creative sidebar navigation, responsive hover interactions.
- **Multi-Language Support**: Comprehensive support for 10 languages (English, Arabic, Chinese, German, Hindi, Urdu, Bengali, Italian, Spanish, Tagalog) including RTL for Arabic/Urdu, with persistent settings and fully translated interface.
- **Device-Specific Responsive Design**: User-configurable device preference (Laptop, iPad, iPhone) adjusting layout, typography, and components. Includes mobile optimization toolkit, production-ready `TableList` component, and iPhone-optimized interfaces with WCAG AAA touch target compliance (h-[44px] minimum for interactive elements).

### Backend
- **Runtime**: Node.js with Express.js.
- **API Design**: RESTful API, domain-organized.
- **Data Validation**: Zod schemas (shared with frontend).
- **Authentication**: Bcrypt for hashing, session-based authentication.
- **Multi-tenant architecture**: Complete data isolation between business accounts using `restaurantId` (applies to both restaurant and factory types). Critical security mandates all API endpoints filter by `req.session.user.restaurantId`.
- **Business Type Support (Nov 2025)**: Dual business type architecture supporting Restaurant and Factory operations with type-specific features, pricing, and UI. businessType field in restaurants table with runtime Zod validation (z.enum(["restaurant", "factory"])). Factory businesses use distinct terminology (Products→Menu, WorkShop→Kitchen, Licenses feature), have unique pricing (Monthly 15000 SAR, Yearly 150000 SAR, +28800 SAR/month per branch, no weekly option), and feature-set restrictions (no Recipes, Delivery Apps, or Delivery Profitability). Signup flow validates Factory cannot select weekly plans. Permission system includes 'licenses' permission (factory-only) with automatic backfill to existing admins. Sidebar navigation uses declarative businessTypes filtering. All 18 existing admin users migrated with 'licenses' permission. E2E tested and production-ready.
- **User Management**: `setupComplete` flag prevents cross-tenant user creation post-initial setup; two-phase user creation for initial admin.
- **Real-Time Employee Notification System**: WebSocket-based system for order lifecycle events with audio alerts, toast notifications, and multi-language support.

### Data Storage
- **Database**: PostgreSQL via Neon serverless driver.
- **ORM**: Drizzle ORM for type-safe queries.
- **Schema Design**: Central `restaurants` table with `restaurantId` foreign key propagated across 22 domain tables covering multi-branch, inventory, menu, recipes, orders, transactions, procurement, users, ZATCA invoices, customers, and settings.
- **Migration Strategy**: Drizzle Kit.

### Core Features
- **Analytics & Reporting**: Dashboard with DoD, WoW, MoM, YoY metrics, daily demand forecasting, peak hours analysis.
- **ZATCA Compliance**: Bilingual PDF invoice generation (Arabic/English) with QR codes using Puppeteer, dedicated invoice management page. **PDF Download Security (Nov 2025)**: All PDF download endpoints (invoices, VAT reports) normalize stored paths by stripping leading slashes before joining with public directory, preventing path traversal vulnerabilities while correctly resolving database paths like `/invoices/file.pdf` to `public/invoices/file.pdf`.
- **Delivery App Cost Calculation**: Formula for calculating commission, banking fees, VAT, and POS fees to determine net income.
- **Management Modules**: Full CRUD for Customer, Menu Item (with discount system), Inventory (Excel import/export), and Recipe (inventory-linked costing with auto-calculated cost using useMemo). **Menu Item Validation (Nov 2025)**: Stock quantity (stockNo) is optional for all menu items. When provided, validated as positive number. Both insert and update schemas aligned. Current UI supports two workflows: (1) Recipe-based items with optional stock, (2) Non-recipe items with optional manual stock entry. Inventory-linked items (inventoryItemId) not currently supported in UI but schema allows for future implementation. **Recipe Form Fix (Nov 2025)**: Replaced useEffect-based cost calculation with useMemo to prevent infinite render loops, eliminating "Maximum update depth exceeded" errors.
- **Daily Stock Management**: Real-time stock calculation for menu items based on inventory and recipes, displayed on POS.
- **Real-Time Inventory Deduction**: Automatic inventory deduction on POS orders with validation, rollback, branch consistency, and audit trail.
- **Financial Features**: PDF export for financial statements, Excel export/import.
- **Strategic Decision-Making**: Profitability analysis covering strategic overview, pricing analysis, scaling viability, and cost management.
- **Authentication**: Subscription-based, with Commercial Registration field and password recovery, secure logout.
- **Subscription Invoice Security**: Authenticated download endpoint with multi-tenant ownership verification via restaurantId join, preventing cross-tenant data leakage. Invoices download after successful auto-login using secure authenticated endpoint.
- **Subscription Invoice Management**: Profile page displays all user subscription invoices with serial number, plan type, date, and total amount. Each invoice can be securely downloaded via authenticated endpoint with proper routing to prevent conflicts.
- **Shop & Bills Management**: Manual working hours, expense tracking for salaries and bills, integrated into financial views.
- **Tutorial System**: Interactive tutorial page with 12 step-by-step guides, screenshots, and multilingual support.
- **Subscription Pricing System**: Centralized VAT-inclusive pricing module (`shared/subscriptionPricing.ts`) with 15% Saudi VAT calculations. All displayed prices are gross (VAT-inclusive) amounts, with invoices showing proper net/VAT/gross breakdown. Supports Weekly (76.28 SAR), Monthly (228.85 SAR), and Yearly (2,288.50 SAR) plans with per-branch pricing.
- **Subscription Management**: Interactive dialog for upgrade/downgrade/cancel, dynamic pricing calculator, plan comparison, displaying current status. All prices shown include 15% VAT as mandated by Saudi law.
- **Branch Management**: Dynamic selection system with `BranchContext`, persistent `currentBranchId` in localStorage, seamless switching.
- **Ticketing System & IT Support**: Comprehensive ticket management with status, priority, real-time chat interface, and activity logging. Role-based access control and auto-refresh for messages. **IT Dashboard Account Type Isolation (Nov 2025)**: Complete separation of IT Dashboard from client accounts through dual account type system. Login flow includes account type selection (Client vs IT). Session stores accountType preference. Frontend sidebar filters IT Dashboard visibility (only shown for IT account type). Backend middleware (`requireITAccount`) protects all `/api/it/*` routes, returning 403 Forbidden for Client accounts. Multi-tenant isolation maintained - IT Dashboard still respects restaurantId filtering. E2E tested with comprehensive verification of sidebar filtering, API protection, and page access controls.
- **WhatsApp Invoice Delivery**: Automatic deep-link integration for sending ZATCA-compliant invoices via WhatsApp after POS checkout, supporting various phone number formats and bilingual templates.
- **Team Chat System**: Full-featured internal messaging with direct messages and channels. Supports branch-level and restaurant-wide conversations, unread badges, message history, real-time mark-as-read, and multi-participant messaging. Default channels (#general, #kitchen, #front-desk, #it-support) auto-created on setup. Uses participantHash for race-safe DM deduplication and conversation membership verification for security.
- **Team Chat Notification Settings**: Admin-controlled notification preferences for Team Chat stored in `settings.chatNotificationDefaults` (notificationsEnabled, soundEnabled, toneId). Settings page provides toggles and tone selector. NotificationContext respects restaurant-wide defaults with 5s refetch interval for immediate updates. All chat notifications filtered through admin settings before display/sound playback.
- **Granular Permission Enforcement System**: Comprehensive role-based access control enforcing 18 granular permissions at both backend and frontend. All permissions defined in `shared/permissions.ts` (ALL_PERMISSIONS array, PermissionSet type, DEFAULT_EMPLOYEE_PERMISSIONS, ADMIN_PERMISSIONS). Backend middleware (`requirePermission`) guards all critical routes. Frontend `usePermissions` hook and permission-aware sidebar automatically filter navigation. Admins bypass all permission checks. Employee form uses DEFAULT_EMPLOYEE_PERMISSIONS to prevent frontend/backend drift. Session management includes user permissions for real-time enforcement. **Schema Normalization (Nov 2025)**: Migrated from inline permission type to centralized PermissionSet type. Migration script (`scripts/migrate-permissions.ts`) provides idempotent data normalization with dry-run support, mapping deprecated keys (employees→users), removing legacy keys (forecasting, analysis, financial), and adding new permissions (workingHours, bills, deliveryApps). All 44 user accounts successfully normalized. Signup endpoint updated to use ADMIN_PERMISSIONS constant from shared/permissions.ts. TypeScript type safety fully enforced across schema, API, UI, and authentication layers. E2E testing verified new signups receive correct normalized permission structure.

## External Dependencies

### UI & Styling
- **Radix UI**: Unstyled, accessible component primitives.
- **Shadcn UI**: Pre-built components.
- **Lucide React**: Icon library.
- **Tailwind CSS**: Utility-first CSS framework.

### Data & Forms
- **@neondatabase/serverless**: PostgreSQL client.
- **Drizzle ORM**: Type-safe ORM.
- **Drizzle Zod**: Schema validation integration.
- **React Hook Form**: Form state management.
- **Zod**: TypeScript-first schema validation.

### Utilities & Other
- **Puppeteer**: Headless Chromium for PDF generation.
- **QRCode**: QR code generation.
- **Recharts**: Charting for analytics.
- **bcrypt**: Password hashing.
- **express-session**: Session middleware.
- **date-fns**: Date manipulation.
- **xlsx**: Excel generation and parsing.