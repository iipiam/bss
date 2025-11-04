# RestoPOS - Restaurant Management System

## Overview

RestoPOS is a comprehensive, ZATCA-compliant restaurant management system for Saudi Arabian restaurants. It integrates Point of Sale (POS), inventory, menu/recipe management, multi-branch operations, order processing, kitchen display, and advanced analytics. The system aims to enhance operational efficiency, ensure regulatory compliance, optimize profitability, and support strategic decision-making through features like sales analytics, business reporting, and demand forecasting.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript (Vite).
- **UI**: Shadcn UI (New York style) based on Radix UI and Tailwind CSS, following Material Design principles.
- **State Management**: TanStack Query for server state; local React state for UI.
- **Form Handling**: React Hook Form with Zod validation.
- **Styling**: Tailwind CSS with custom design tokens, responsive layouts.

### Backend
- **Runtime**: Node.js with Express.js.
- **API Design**: RESTful API, domain-organized.
- **Data Validation**: Zod schemas (shared with frontend).
- **Authentication**: Bcrypt for hashing, session-based authentication.

### Data Storage
- **Database**: PostgreSQL via Neon serverless driver.
- **ORM**: Drizzle ORM for type-safe queries.
- **Schema Design**: Supports multi-branch operations, inventory, menu, recipes, orders, transactions, procurement, users (role-based), ZATCA-compliant invoices, customers, and system settings.
- **Migration Strategy**: Drizzle Kit.

### Core Features & Implementations
- **Analytics & Reporting**: Dashboard with DoD, WoW, MoM, YoY performance metrics; Daily Demand Forecasting per menu item; Peak Hours Analysis with customer drill-down.
- **ZATCA Compliance**: Bilingual (Arabic/English) PDF invoice generation using Puppeteer, QR code generation, and professional HTML templates.
- **Invoice Management**: Dedicated page for ZATCA-compliant invoices with search and download.
- **Multi-Language Support**: Comprehensive support for 7 languages including RTL for Arabic/Urdu, with persistent settings.
- **UI/UX**: Modern gradient designs, smooth animations, creative sidebar navigation, and responsive hover interactions.
- **Management Modules**: Full CRUD for Customer, Menu Item (with discount system), Inventory (with Excel import/export), and Recipe (inventory-linked costing).
- **Daily Stock Management**: Real-time stock calculation for menu items based on inventory and recipes, displayed on POS.
- **Financial Features**: PDF export for financial statements, Excel export/import for various data tables.
- **Strategic Decision-Making**: Profitability analysis with tabs for Strategic Overview, Pricing Analysis (including Price Coverage Analysis by margin), Scaling Viability, and Cost Management.
- **Authentication**: Subscription-based, with Commercial Registration field and password recovery.
- **Shop & Bills Management**: Manual configuration of shop working hours; comprehensive expense tracking for employee salaries and shop bills with summary analytics and integration into financial and profitability views.
- **Tutorial System**: Visual tutorial page with 12 detailed guides and a "Getting Started" section.
- **Device-Specific Responsive Design**: User-configurable device preference (Laptop, iPad, iPhone) stored in database, adjusting layout, typography, and specific components (e.g., mobile-optimized POS).

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