# BlindSpot System (BSS) - Business Management System

## Overview
BlindSpot System (BSS) is a ZATCA-compliant business management system designed for Saudi Arabian Restaurant and Factory businesses. It offers integrated Point of Sale (POS), inventory, menu/recipe or product/license management, multi-branch operations, order processing, kitchen/workshop display, and advanced analytics. BSS aims to boost operational efficiency, ensure regulatory compliance, optimize profitability, and support strategic decision-making through features like sales analytics, business reporting, and demand forecasting.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX
- **Frontend Framework**: React with TypeScript (Vite).
- **UI Library**: Shadcn UI (New York style) based on Radix UI and Tailwind CSS, adhering to Material Design principles.
- **Styling**: Tailwind CSS with custom design tokens, responsive layouts, modern gradient designs, and smooth animations.
- **Branding**: BSS eagle logo, "Business Management System" subtitle, and "Made By Kinzhal LTD Co." in the footer. Tagline: "Empowering businesses with smart management solutions".
- **Internationalization**: Comprehensive multi-language support for 10 languages (English, Arabic, German, Chinese, Bengali, Italian, Hindi, Urdu, Spanish, Tagalog) with full RTL support for Arabic/Urdu, with fallback to English.
- **Responsive Design**: Device-specific layouts (Laptop, iPad, iPhone) with WCAG AAA compliance.

### Technical Implementation
- **Backend Runtime**: Node.js with Express.js.
- **API Design**: RESTful API, domain-organized, with shared Zod schemas for validation.
- **Authentication**: Bcrypt for hashing, session-based, supporting client (restaurantId required) and IT (restaurantId=null) account types.
- **Multi-tenant Architecture**: Complete data isolation using `restaurantId` with dedicated IT account system for cross-tenant support.
- **Device Preference System**: Users can select iPhone/iPad/Laptop layouts with persistent settings.
- **Business Type Support**: Dual architecture for Restaurant and Factory operations with type-specific features and terminology.
- **Real-Time Communication**: WebSocket-based system for employee notifications, support ticket updates, instant menu updates to POS, real-time recipe cost updates, and automatic BEP (Break Even Point) calculation updates.
- **Data Storage**: AWS RDS PostgreSQL (Production) with SSL/TLS encryption, using `node-postgres` and Drizzle ORM.
- **Schema Design**: Central `restaurants` table with `restaurantId` foreign key across 22 domain tables.
- **Database Migrations**: Drizzle Kit with custom AWS RDS migration script.

### Feature Specifications
- **Analytics & Reporting**: Dashboard with DoD, WoW, MoM, YoY metrics, daily demand forecasting, peak hours analysis, and detailed BEP calculator with sensitivity analysis.
- **ZATCA Compliance**: Bilingual PDF invoice generation (Arabic/English) with QR codes.
- **Financial Management**: Delivery app cost calculation, PDF export for financial statements, Excel import/export. Enhanced BEP calculator uses true COGS from invoice items via orders, menu items, and recipes with portion size multipliers. Includes manual delivery profitability entry with VAT and Profit tracking fields.
- **Management Modules**: CRUD for Customer, Menu Item (with discount, optional stock), Inventory (Excel import/export, expiration tracking, add-on creation), Recipe (inventory-linked costing, portion sizes).
- **Stock Management**: Real-time stock calculation and deduction on POS orders.
- **Authentication & Subscriptions**: Subscription-based authentication with Commercial Registration, secure password recovery, and authenticated subscription invoice downloads. Centralized VAT-inclusive pricing.
- **Subscription Management**: Interactive dialogs for plan changes, dynamic pricing, and plan comparison.
- **Branch Management**: Dynamic selection system.
- **Ticketing System & IT Support**: Comprehensive ticket management with real-time chat and IT-only dashboard with cross-tenant visibility.
- **IT Account Management**: IT accounts can manage all client accounts, including password changes, access control, searching, filtering, and viewing account statistics. Includes an Archive tab for cancelled accounts with reasons and refund details.
- **IT Business Management**: IT accounts can view client subscriptions, contact details, invoices, and generate ZATCA-compliant VAT statements. Features include subscription suspend/activate, company expense tracking, BSS analysis (revenue, profit, accounts breakdown), and IT company details management for invoice generation. Includes subscription cancellation with prorated refund calculation. IT BEP Analysis calculates break-even point using paid bills as fixed costs, year-scoped active clients derived from subscription invoices via user→restaurant mapping, with margin of safety and profitability indicators.
- **WhatsApp Integration**: Automatic deep-link for sending ZATCA-compliant invoices via WhatsApp.
- **Team Chat**: Internal messaging system with DMs and channels, supporting branch-level and restaurant-wide conversations.
- **Granular Permission System**: Role-based access control with 19 granular permissions (view, add, edit, delete) enforced at backend and frontend.
- **Bills Management**: Salary bill generation with month selection.
- **PDF Invoice Generation**: ZATCA-compliant invoices with proper page break handling and bilingual refund policy sections.
- **Investor Statement PDF**: Downloadable bilingual (EN/AR) investor statement showing investment details, earnings breakdown, and receivables calculation. Supports Money Investors and Recipe Owners.
- **Recipe Import**: Flexible column mapping for ingredient/step parsing.
- **License Document Upload**: Secure file upload for license documents (PDF, JPEG, PNG, GIF, WebP) with 10MB limit, authenticated access, and drag-and-drop UI.
- **License Fees**: Optional fee tracking for each license.
- **Procurement Invoice Image Upload**: Drag-and-drop upload for invoice images (JPEG, PNG, GIF, WebP) and PDFs with 10MB limit, secure storage, and authentication-based access.
- **Procurement-to-Bills Sync**: Automatic synchronization between procurement status and shop bills (creates/updates/deletes bills based on procurement status) with full tenant isolation.
- **Violations Management**: Track government authority violations (Municipality, ZATCA, Police, Ministry of Commerce) with PDF/image document uploads, status tracking (pending, paid, disputed), and automatic bill creation for violation payments. Includes statistics dashboard with counts and amounts by status.

## External Dependencies

### UI & Styling
- **Radix UI**: Unstyled, accessible component primitives.
- **Shadcn UI**: Pre-built components.
- **Lucide React**: Icon library.
- **Tailwind CSS**: Utility-first CSS framework.

### Data & Forms
- **node-postgres (pg)**: PostgreSQL client.
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