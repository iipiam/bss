# BlindSpot System (BSS) - Business Management System

## Overview
BlindSpot System (BSS) is a ZATCA-compliant business management system tailored for Saudi Arabian Restaurant and Factory businesses. It integrates Point of Sale (POS), inventory, menu/recipe or product/license management, multi-branch operations, order processing, kitchen/workshop display, and advanced analytics. BSS aims to enhance operational efficiency, ensure regulatory compliance, optimize profitability, and support strategic decision-making through features like sales analytics, business reporting, and demand forecasting.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX
- **Frontend Framework**: React with TypeScript (Vite).
- **UI Library**: Shadcn UI (New York style) based on Radix UI and Tailwind CSS, adhering to Material Design principles.
- **Styling**: Tailwind CSS with custom design tokens, responsive layouts, modern gradient designs, and smooth animations.
- **Branding**: BSS eagle logo, "Business Management System" subtitle, and "Made By Kinzhal LTD Co." in the footer. Tagline: "Empowering businesses with smart management solutions".
- **Internationalization**: Comprehensive multi-language support for 10 languages (English, Arabic, German, Chinese, Bengali, Italian, Hindi, Urdu, Spanish, Tagalog) with full RTL support for Arabic/Urdu. Translation system uses `LanguageContext` and persists preferences. Language validation ensures fallback to English for invalid stored languages. **Updated Nov 25, 2025**: Added German, Chinese, Bengali, Italian languages.
- **Responsive Design**: Device-specific layouts (Laptop, iPad, iPhone) with WCAG AAA compliance.

### Technical Implementation
- **Backend Runtime**: Node.js with Express.js.
- **API Design**: RESTful API, domain-organized, with shared Zod schemas for validation.
- **Authentication**: Bcrypt for hashing, session-based. Supports dual account types: client (restaurantId required) and IT (restaurantId=null).
- **Multi-tenant Architecture**: Complete data isolation using `restaurantId`. Includes dedicated IT account system for cross-tenant support.
- **Device Preference System**: Users can select iPhone/iPad/Laptop layouts with persistent settings.
- **Business Type Support**: Dual architecture for Restaurant and Factory operations with type-specific features and terminology.
- **Real-Time Communication**: WebSocket-based system for employee notifications and real-time support ticket updates.
- **Data Storage**: AWS RDS PostgreSQL (Production) with SSL/TLS encryption, using `node-postgres` and Drizzle ORM.
- **Schema Design**: Central `restaurants` table with `restaurantId` foreign key across 22 domain tables.
- **Database Migrations**: Drizzle Kit with custom AWS RDS migration script.

### Feature Specifications
- **Analytics & Reporting**: Dashboard with DoD, WoW, MoM, YoY metrics, daily demand forecasting, peak hours analysis.
- **ZATCA Compliance**: Bilingual PDF invoice generation (Arabic/English) with QR codes.
- **Financial Management**: Delivery app cost calculation, PDF export for financial statements, Excel import/export.
- **Management Modules**: CRUD for Customer, Menu Item (with discount, optional stock), Inventory (Excel import/export), Recipe (inventory-linked costing).
- **Stock Management**: Real-time stock calculation and deduction on POS orders.
- **Authentication & Subscriptions**: Subscription-based authentication with Commercial Registration, secure password recovery, and authenticated subscription invoice downloads. Centralized VAT-inclusive pricing module.
- **Subscription Management**: Interactive dialogs for plan changes, dynamic pricing, and plan comparison.
- **Branch Management**: Dynamic selection system with `BranchContext`.
- **Ticketing System & IT Support**: Comprehensive ticket management with status, priority, real-time chat, activity logging, and IT-only dashboard with cross-tenant visibility.
- **IT Account Management**: IT accounts can manage all client accounts - change passwords (with visibility toggle), enable/disable account access, search/filter accounts, and view account statistics. Access via `/it-account-management` route. **Updated Nov 25, 2025**.
- **WhatsApp Integration**: Automatic deep-link for sending ZATCA-compliant invoices via WhatsApp.
- **Team Chat**: Internal messaging system with DMs and channels, supporting branch-level and restaurant-wide conversations.
- **Granular Permission System**: Role-based access control with 18 granular permissions enforced at backend and frontend.

## External Dependencies

### UI & Styling
- **Radix UI**: Unstyled, accessible component primitives.
- **Shadcn UI**: Pre-built components.
- **Lucide React**: Icon library.
- **Tailwind CSS**: Utility-first CSS framework.

### Data & Forms
- **node-postgres (pg)**: PostgreSQL client for AWS RDS connection.
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