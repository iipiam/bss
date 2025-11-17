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
- **Internationalization**: Comprehensive multi-language support (10 languages including RTL), with persistent settings.
- **Responsive Design**: Device-specific layouts (Laptop, iPad, iPhone) with WCAG AAA compliance for touch targets.

### Technical Implementation
- **Backend Runtime**: Node.js with Express.js.
- **API Design**: RESTful API, domain-organized, with shared Zod schemas for validation.
- **Authentication**: Bcrypt for hashing, session-based.
- **Multi-tenant Architecture**: Complete data isolation using `restaurantId` for both restaurant and factory business types.
  - **Security**: 148 authenticated endpoints with 134 restaurantId extractions (~91% coverage)
  - **Data Isolation**: All new accounts start with ZERO data, no cross-tenant data leakage
  - **Recent Security Fixes (Nov 2025)**: Patched 7 critical vulnerabilities in procurement, invoices, image uploads, and import endpoints
- **Business Type Support**: Dual architecture for Restaurant and Factory operations, with type-specific features, terminology (e.g., Products for Factories), pricing, and UI restrictions (e.g., no Recipes for Factories). Includes 'licenses' permission for factories.
- **Real-Time Communication**: WebSocket-based system for employee notifications (order lifecycle) and real-time support ticket updates.
- **Data Storage**: PostgreSQL via Neon serverless driver, Drizzle ORM for type-safe queries.
- **Schema Design**: Central `restaurants` table with `restaurantId` foreign key across 22 domain tables.
- **Database Migrations**: Drizzle Kit.

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