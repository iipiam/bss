# BlindSpot System (BSS) - Business Management System

## Overview
BlindSpot System (BSS) is a comprehensive, ZATCA-compliant business management system for Saudi Arabian **Restaurant** and **Factory** businesses. It integrates Point of Sale (POS), inventory, menu/recipe or product/license management, multi-branch operations, order processing, kitchen/workshop display, and advanced analytics. BSS aims to enhance operational efficiency, ensure regulatory compliance, optimize profitability, and support strategic decision-making through features like sales analytics, business reporting, and demand forecasting, empowering businesses with smart management solutions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX
- **Frontend Framework**: React with TypeScript (Vite).
- **UI Library**: Shadcn UI (New York style) based on Radix UI and Tailwind CSS, adhering to Material Design principles.
- **Styling**: Tailwind CSS with custom design tokens, responsive layouts, modern gradient designs, and smooth animations.
- **Branding**: BSS eagle logo prominent across the application, "Business Management System" subtitle, and "Made By Kinzhal LTD Co." in the footer. Tagline: "Empowering businesses with smart management solutions".
- **Internationalization** (Nov 23, 2025): Comprehensive multi-language support for 10 languages (English, Arabic, Hindi, Urdu, Spanish, Tagalog, French, Indonesian, Turkish, Swahili) with full RTL support for Arabic/Urdu. Implemented 100+ translation keys covering all user-facing text including form validation messages, toast notifications, export labels, and error handling. Translation system uses LanguageContext with useLanguage() hook. Language preferences persist in localStorage and sync with backend settings for authenticated users. All Zod form schemas use translation keys (restructured to component-scoped or factory functions). PaymentTest form reacts to language changes via useEffect. LanguageToLocaleCode mapping updated for all 10 languages. Known limitations: Export payload data structures (object keys in PDF/Excel exports) and some dynamic server-fed labels remain in English (acceptable as technical data).
- **Responsive Design**: Device-specific layouts (Laptop, iPad, iPhone) with WCAG AAA compliance for touch targets.

### Technical Implementation
- **Backend Runtime**: Node.js with Express.js.
- **API Design**: RESTful API, domain-organized, with shared Zod schemas for validation.
- **Authentication**: Bcrypt for hashing, session-based. Dual account types: client (restaurantId required) and IT (restaurantId=null).
- **Multi-tenant Architecture**: Complete data isolation using `restaurantId` for both restaurant and factory business types.
  - **Security**: 139 client endpoints protected with `requireRestaurant` middleware, enforcing restaurant context
  - **Data Isolation**: All new accounts start with ZERO data, no cross-tenant data leakage
  - **IT Account System** (Nov 19, 2025): Dedicated IT support accounts with null restaurantId for cross-tenant support operations
    - IT accounts use separate `/api/it/*` endpoints with `requireITAccount` middleware
    - IT accounts blocked from all client endpoints via `requireRestaurant` middleware
    - Seeded IT accounts: `it_support`, `it@saudikinzhal.org` (credentials in secure storage)
  - **Recent Security Fixes (Nov 2025)**: Patched 7 critical vulnerabilities in procurement, invoices, image uploads, and import endpoints
  - **Recent Bug Fixes (Nov 17-22, 2025)**: 
    - Fixed invoice download workflow (PDF path mismatch: changed save location to `public/invoices/`)
    - Fixed WebSocket connection spam when not authenticated (added user check before connecting)
    - Fixed transaction creation validation (validates without requiring restaurantId in body, adds from session)
    - Fixed POS mutation JSON parsing (parse Response object with `.json()` to get order data)
    - Fixed IT Dashboard NaN% display (added `openTrend` calculation comparing today's open tickets vs yesterday's)
    - Fixed IT Dashboard stuck loading state (added `enabled: !!user` auth guards to all queries preventing 401 errors and perpetual loading)
    - **Fixed IT account authentication** (Nov 18): Resolved critical bugs where IT accounts (null restaurantId) caused errors in /api/auth/me GET and PATCH endpoints. Added getUserById() and updateUserById() storage methods to handle IT accounts without restaurant context while preserving multi-tenant isolation for client accounts.
    - **Fixed menu item stock tracking** (Nov 19): Menu items using stock tracking (stockNo + inventoryItemId) now properly maintain inventory links. Both create and update mutations correctly clear stockNo and inventoryItemId together when switching to recipe mode, preventing stale data.
    - **Fixed inventory decimal precision** (Nov 19): Inventory create and update mutations now consistently use .toFixed(2) for quantity and price fields, ensuring proper decimal formatting and preventing type mismatches with backend schema.
    - **Fixed investor creation** (Nov 20): Investor mutations now convert string form values to proper decimal format before sending to backend, ensuring amountInvested and interestPercentage are correctly formatted as decimals.
    - **Fixed employee creation and updates** (Nov 20): Employee create/update mutations now properly convert numeric fields (vacationDaysTotal, vacationDaysUsed as integers; visaFees, ticketAmount, performanceRating as decimals with .toFixed(2)) before sending to backend, preventing type mismatches and validation errors.
    - **Fixed IT account auto-detection** (Nov 20): Login endpoint now auto-detects IT accounts based on `restaurantId === null` instead of relying on frontend accountType parameter. IT accounts are correctly assigned `accountType: "it"` in session, enabling access to Performance tracking and IT Dashboard features.
    - **Fixed Performance page visibility** (Nov 20): Performance page now only appears in sidebar for IT accounts. Client accounts cannot see or access the Performance page, maintaining proper access control for IT-only features.
    - **Verified IT Dashboard sidebar** (Nov 20): Confirmed via e2e testing that IT accounts correctly see IT Dashboard, Kitchen, Settings, Support, Help, and Logout in the sidebar as expected.
    - **Added Performance tracking for IT accounts** (Nov 20): New Performance tab in System section for IT accounts tracks sales **per user** across all client accounts. Shows username, full name, role, restaurant context, business type, total sales, total orders, average order value, and last activity. Includes date range filtering (7/30/60/90 days) and search by username/full name/restaurant. Backend uses `orders.createdBy` field to track which user created each order, with proper WHERE clause date filtering for accurate metrics.
    - **Fixed dashboard performance comparison rates for new accounts** (Nov 20): Updated PerformanceCard component to correctly distinguish between "no historical data" (new accounts with previous=0) and "legitimate zero change" (stable performance where current=previous). New accounts now show gray "No data" badge, while stable periods show blue "0.0%" badge. Backend calculateChange function simplified to return 0 when previous=0.
    - **Removed Kitchen from IT account sidebar** (Nov 20): IT accounts no longer see Kitchen in Operations section. IT accounts now only have access to: IT Dashboard, Performance, Settings (in System section) plus Help and Logout in Support section.
    - **Fixed "Invoice Not Found" bug for WhatsApp invoice links** (Nov 22): Updated storage.getInvoicePublic() to look up invoices by orderId first (for WhatsApp links using order.id), then fall back to invoice.id (for QR code access). This fixes the 404 error when clicking WhatsApp invoice links.
    - **Fixed QR code display on public invoice page** (Nov 22): Added QR code rendering section to public invoice HTML template. QR code now displays correctly when accessing invoices via public link.
    - **Fixed QR code data storage bug** (Nov 22): Corrected generateZATCAInvoice() to return base64 QR code data URI instead of invoice URL, ensuring proper ZATCA-compliant QR codes are stored in database and displayed on invoices.
    - **Fixed duplicate translation keys causing 500 login errors** (Nov 23): Removed duplicate `exportFailed` keys from Hindi and Urdu translations in client/src/i18n/translations.ts that were causing TypeScript compilation errors and 500 server errors during login. Duplicate keys were in Toast Messages section; proper keys retained in Export/Import section. Application now compiles cleanly without duplicate object literal property warnings.
  - **Device Preference System**: Users can select iPhone/iPad/Laptop layouts with persistent settings. Device class (`device-iphone`, `device-ipad`, `device-laptop`) applied to `document.documentElement` for CSS targeting. IT accounts access settings via IT Dashboard header (comprehensive dialog with language, device, and theme preferences).
- **Business Type Support**: Dual architecture for Restaurant and Factory operations, with type-specific features, terminology (e.g., Products for Factories), pricing, and UI restrictions (e.g., no Recipes for Factories). Includes 'licenses' permission for factories.
- **Real-Time Communication**: WebSocket-based system for employee notifications (order lifecycle) and real-time support ticket updates.
- **Data Storage**: **AWS RDS PostgreSQL** (Production) with SSL/TLS encryption and proper certificate validation, using node-postgres (pg) driver and Drizzle ORM for type-safe queries.
  - **Database Migration** (Nov 19, 2025): Successfully migrated from in-memory storage to AWS RDS PostgreSQL for persistent, production-grade data storage. All CRUD operations verified working.
  - **Security Configuration**: Production-grade SSL with AWS RDS CA bundle certificate validation (`rejectUnauthorized: true`), ensuring secure encrypted connections. No man-in-the-middle vulnerability. Robust DATABASE_URL parsing using Node.js URL API handles all edge cases including special characters in passwords.
  - **Connection Details**: Managed via Replit secrets (`DATABASE_URL`), fully externalized credentials, no hard-coded passwords in source code. All credentials securely stored in environment variables.
  - **32 Database Tables**: All schema tables successfully migrated to AWS RDS (users, restaurants, branches, menu_items, inventory_items, orders, customers, recipes, transactions, etc.). Tested: signup, login, authentication, branch creation all working.
  - **Tested Features**: User signup with restaurant creation, subscription invoice generation, authentication, session management, branch CRUD operations, multi-tenant isolation all verified working correctly.
- **Schema Design**: Central `restaurants` table with `restaurantId` foreign key across 22 domain tables.
- **Database Migrations**: Drizzle Kit with custom AWS RDS migration script (`scripts/migrate-aws-rds.ts`).

### Feature Specifications
- **Analytics & Reporting**: Dashboard with DoD, WoW, MoM, YoY metrics, daily demand forecasting, peak hours analysis.
- **ZATCA Compliance**: Bilingual PDF invoice generation (Arabic/English) with QR codes, secure PDF download endpoints preventing path traversal.
- **Financial Management**: Delivery app cost calculation, PDF export for financial statements, Excel import/export.
- **Management Modules**: CRUD for Customer, Menu Item (with discount system, optional stock), Inventory (Excel import/export), Recipe (inventory-linked costing).
- **Stock Management**: Real-time stock calculation and deduction on POS orders with validation, rollback, and audit trail.
- **Authentication & Subscriptions**: Subscription-based authentication with Commercial Registration, secure password recovery, and authenticated subscription invoice downloads with multi-tenant ownership verification. Centralized VAT-inclusive pricing module with various plans (Weekly, Monthly, Yearly, per-branch).
- **Subscription Management**: Interactive dialogs for plan changes, dynamic pricing, and plan comparison.
- **Branch Management**: Dynamic selection system with `BranchContext` and persistent `currentBranchId`.
- **Ticketing System & IT Support**: Comprehensive ticket management with status, priority, real-time chat, and activity logging. Features IT-only dashboard with cross-tenant visibility, client account tracking (online/offline status), and restricted status updates for IT accounts.
- **WhatsApp Integration**: Automatic deep-link for sending ZATCA-compliant invoices via WhatsApp.
- **Team Chat**: Internal messaging system with DMs and channels, supporting branch-level and restaurant-wide conversations, unread badges, and real-time updates. Admin-controlled notification settings.
- **Granular Permission System**: Role-based access control with 18 granular permissions enforced at backend and frontend using `requirePermission` middleware and `usePermissions` hook. Includes schema normalization for permissions.

## External Dependencies

### UI & Styling
- **Radix UI**: Unstyled, accessible component primitives.
- **Shadcn UI**: Pre-built components.
- **Lucide React**: Icon library.
- **Tailwind CSS**: Utility-first CSS framework.

### Data & Forms
- **node-postgres (pg)**: PostgreSQL client for AWS RDS connection with SSL/TLS support.
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