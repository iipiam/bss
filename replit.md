# RestoPOS - Restaurant Management System

## Overview

RestoPOS is a comprehensive, ZATCA-compliant restaurant management system for Saudi Arabian restaurants. It integrates Point of Sale (POS), inventory, menu/recipe management, multi-branch operations, order processing, kitchen display, and advanced analytics. The system aims to enhance operational efficiency, ensure regulatory compliance, optimize profitability, and support strategic decision-making through features like sales analytics, business reporting, and demand forecasting.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### General
- **Branding**: Saudi Kinzhal eagle logo with blue ethereal design.
- **Multi-Language Support**: Comprehensive support for 7 languages including RTL for Arabic/Urdu, with persistent settings.
- **Tutorial System**: Interactive, step-by-step text guides with screenshots, detailed instructions, and pro tips covering core functionalities.

### Frontend
- **Framework**: React with TypeScript (Vite).
- **UI**: Shadcn UI (New York style) based on Radix UI and Tailwind CSS, following Material Design principles.
- **State Management**: TanStack Query for server state; local React state for UI.
- **Form Handling**: React Hook Form with Zod validation.
- **Styling**: Tailwind CSS with custom design tokens, responsive layouts.
- **UI/UX**: Modern gradient designs, smooth animations, creative sidebar navigation, and responsive hover interactions.
- **Device-Specific Responsive Design**: User-configurable device preference (Laptop, iPad, iPhone) adjusting layout, typography, and components. All interactive elements meet WCAG 2.1 Level AAA touch target requirements.

### Backend
- **Runtime**: Node.js with Express.js.
- **API Design**: RESTful API, domain-organized.
- **Data Validation**: Zod schemas (shared with frontend).
- **Authentication**: Bcrypt for hashing, session-based authentication.

### Data Storage
- **Database**: PostgreSQL via Neon serverless driver.
- **ORM**: Drizzle ORM for type-safe queries.
- **Schema Design**: Multi-tenant architecture with complete data isolation using `restaurantId` foreign keys across 22 domain tables. Exception: Support tickets can have `restaurantId = null` for IT staff internal tickets.
- **Migration Strategy**: Drizzle Kit.
- **Security**: All API endpoints MUST filter by `req.session.user.restaurantId` to prevent cross-tenant data leakage. Exception: Ticket-related endpoints branch on user role (admin vs restaurant user) to allow IT staff full access while maintaining tenant isolation for restaurant users.

### Admin/IT Staff Onboarding
IT staff users have `role = 'admin'` and `restaurantId = null`. To create an admin user:
1. Admin users must be manually created in the database during deployment
2. Example SQL: `INSERT INTO users (email, password, role, restaurant_id) VALUES ('admin@restopos.com', <bcrypt_hash>, 'admin', NULL);`
3. Default credentials for development: email="admin@restopos.com", password="admin123"
4. Admin users can access all support tickets and create internal tickets, but cannot access restaurant-specific endpoints (POS, inventory, analytics, etc.)

### Core Features & Implementations
- **Analytics & Reporting**: Dashboard with DoD, WoW, MoM, YoY performance metrics; Daily Demand Forecasting; Peak Hours Analysis.
- **ZATCA Compliance**: Bilingual (Arabic/English) PDF invoice generation with QR code and professional HTML templates.
- **Invoice Management**: Dedicated page for ZATCA-compliant invoices with search and download.
- **Delivery App Cost Formula**: Comprehensive calculation for commissions, banking fees, VAT, and POS fees to determine net income.
- **Management Modules**: Full CRUD for Customers, Menu Items (with discounts), Inventory (with Excel import/export), and Recipes (inventory-linked costing).
- **Daily Stock Management**: Real-time stock calculation for menu items based on inventory and recipes, displayed on POS.
- **Real-Time Inventory Deduction**: Automatic inventory deduction on order placement, with validation, rollback on failure, branch consistency, and audit trail.
- **Financial Features**: PDF export for financial statements, Excel export/import for data tables.
- **Strategic Decision-Making**: Profitability analysis covering Strategic Overview, Pricing Analysis, Scaling Viability, and Cost Management.
- **Authentication**: Subscription-based, with Commercial Registration field and password recovery. Secure logout.
- **Shop & Bills Management**: Manual configuration of shop working hours; comprehensive expense tracking for salaries and bills.
- **Subscription Management**: Full control for upgrade/downgrade/cancel plans, dynamic pricing calculator, and visual plan comparison.
- **Branch Management**: Dynamic branch selection system with persistence, fetching branches from API, and context-based state management for multi-branch operations.
- **Ticketing System & IT Support**: Comprehensive support ticket management with real-time chat, activity logging, and role-based access control. IT staff have restricted access to only support-related functions and data. **IT staff can create internal tickets with `restaurantId = null` for tracking internal issues.**
- **WhatsApp Invoice Delivery**: Automatic deep-link integration for sending ZATCA-compliant invoices via WhatsApp after POS checkout, with intelligent phone number formatting and bilingual message templates.
- **Real-Time Employee Notification System**: WebSocket-based notification system for order lifecycle events with audio alerts, localized toast messages, and user preferences.

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