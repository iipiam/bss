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
- **Delivery App Cost Formula**: Commission = (Price - Subsidy) × Commission%; Banking Fees = Price × Banking%; VAT = (Commission + Subsidy + Banking Fees) × 0.15; POS Fees have no VAT. Total Cost = Commission + Subsidy + Banking Fees + VAT + POS Fees. Net Income = Item Price - Total Cost. All costs are deducted from restaurant revenue.
- **Multi-Language Support**: Comprehensive support for 7 languages including RTL for Arabic/Urdu, with persistent settings.
- **UI/UX**: Modern gradient designs, smooth animations, creative sidebar navigation, and responsive hover interactions.
- **Management Modules**: Full CRUD for Customer, Menu Item (with discount system), Inventory (with Excel import/export), and Recipe (inventory-linked costing).
- **Daily Stock Management**: Real-time stock calculation for menu items based on inventory and recipes, displayed on POS.
- **Real-Time Inventory Deduction**: Automatic inventory deduction when orders are placed through POS with validation, rollback on failure, branch consistency enforcement, and complete audit trail via inventory_transactions table. Supports both recipe-based items (deducts ingredients) and simple items (uses inventoryItemId + stockNo). Returns 409 error with detailed message if insufficient stock.
- **Financial Features**: PDF export for financial statements, Excel export/import for various data tables.
- **Strategic Decision-Making**: Profitability analysis with tabs for Strategic Overview, Pricing Analysis (including Price Coverage Analysis by margin), Scaling Viability, and Cost Management.
- **Authentication**: Subscription-based, with Commercial Registration field and password recovery. Secure logout flow prevents data loss by cancelling all pending queries/mutations and clearing cache before redirect.
- **Shop & Bills Management**: Manual configuration of shop working hours; comprehensive expense tracking for employee salaries and shop bills with summary analytics and integration into financial and profitability views.
- **Tutorial System**: Interactive tutorial page with 12 comprehensive step-by-step text guides, each featuring:
  - Practical demonstration screenshots of actual application interfaces
  - Detailed step-by-step instructions (4-8 steps per tutorial)
  - Estimated completion time (5-8 minutes per tutorial)
  - Pro tips and best practices for each step
  - Topics: POS System, Inventory Management, Menu Management, Recipe Creation, Customer Management, Order Processing, Analytics Dashboard, Sales Analytics, Profitability Analysis, Demand Forecasting, Invoice Management, Financial Reports
  - Click-to-open modal dialogs with scrollable content
  - "Getting Started" section with quick overview
  - Full multilingual support for all UI elements across all 7 languages
- **Subscription Management**: Full subscription control accessible from user account dropdown:
  - Interactive dialog with upgrade/downgrade/cancel options
  - Dynamic pricing calculator showing real-time costs based on selected plan and branches
  - Visual plan comparison with highlighting for current selection
  - Supports Weekly (39.90 SAR + 7 SAR per additional branch), Monthly (119.75 SAR + 20 SAR per additional branch), and Yearly (1,197.50 SAR + 240 SAR per additional branch with 17% savings) plans
  - Display of current subscription status, plan, and branches
  - All pricing includes 15% VAT in compliance with Saudi regulations
  - Branch count selector with minimum 1 branch (first included in base price)
- **Branch Management**: Dynamic branch selection system with BranchContext for multi-branch operations:
  - Fetches branches from `/api/branches` endpoint
  - Current branch stored in localStorage with key `currentBranchId` for persistence across sessions
  - Automatically initializes to user's default branchId or first available branch
  - BranchSelector component in header displays current branch with name and location
  - Loading state while fetching branches, empty state when no branches available
  - Seamless branch switching with context-based state management
  - Provider hierarchy: QueryClient > Theme > Language > Tooltip > Auth > Branch > Device > AppContent
- **Device-Specific Responsive Design**: User-configurable device preference (Laptop, iPad, iPhone) stored in database, adjusting layout, typography, and specific components.
  - **Mobile Optimization Toolkit**: Centralized `mobileLayout.ts` utility providing responsive classes for grid columns, text sizes, spacing, and padding across all device types.
  - **TableList Component**: Production-ready mobile list component with swipeable actions for compact data display.
  - **Comprehensive iPhone-Optimized Interfaces**: All major application pages have been systematically optimized for iPhone with:
    - Responsive grid layouts using `layout.gridCols()` that adapt from desktop (3-4 cols) to tablet (2 cols) to mobile (1 col)
    - Dynamic typography using `layout.text3Xl`, `layout.textLg` for consistent scaling
    - Smart spacing with `layout.padding`, `layout.spaceY`, `layout.gap` that adjusts based on screen size
    - Conditional layouts with `layout.isMobile` for stacking elements vertically on small screens
    - **Optimized Pages**: Dashboard, Menu, Inventory, Customers, Recipes, Branches, Orders, Delivery Apps, POS
    - **WCAG AAA Touch Target Compliance**: ALL interactive elements now explicitly set to h-[44px] minimum (no min-h usage):
      - **POS System**: Search input, tab toggles (Menu/Cart, Categories), all icon buttons (remove, +/-), payment select, table input, customer button, clear/checkout buttons
      - **Inventory**: Table edit/delete buttons, card action buttons
      - **Orders**: All status change buttons with mobile stacking
      - **Navigation**: Sidebar auto-collapses on iPhone via `defaultOpen={device !== 'iphone'}`
    - **Critical Pattern**: Use explicit `h-[44px]` and `w-[44px]` classes (NOT min-h) to properly override component defaults like `size="icon"`
    - **Form Optimization**: All dialogs, inputs, selects, tabs, and buttons meet 44px requirement
  - **Accessibility Compliance**: 100% of interactive elements meet WCAG 2.1 Level AAA touch target requirements (verified by architect review).
- **Ticketing System & IT Support**: Comprehensive support ticket management with real-time chat interface:
  - **Support Tickets** (supportTickets table): Full ticket lifecycle management with status tracking (open, in-progress, resolved, closed), priority levels (low, medium, high, urgent), and automatic ticket numbering (TKT-YYYYMMDD-XXXX format)
  - **Chat Interface** (ticketMessages table): Real-time messaging between users and IT support with message threading, read status tracking, and sender identification (name, role)
  - **Activity Logging** (employeeActivityLog table): Comprehensive audit trail tracking all employee actions (create, update, delete) across all system entities with JSON change tracking, categorization, and timestamp tracking
  - **Authorization**: Role-based access control - regular users can only view/manage their own tickets, admins can view all tickets and update status
  - **Auto-Refresh**: Ticket messages auto-refresh every 5 seconds for near real-time chat experience
  - **Status Management**: Admins can progress tickets through statuses with automatic timestamp tracking (resolvedAt, closedAt)
  - **Frontend Pages**: `/support` for ticket list/creation, `/support/:id` for individual ticket chat view
  - **API Endpoints**: Full REST API for tickets (GET/POST/PATCH), messages (GET/POST), activity logs (GET), and unread count tracking
  - **Activity Logger Utility** (server/activityLogger.ts): Helper functions for logging employee actions throughout the application
  - **Note**: Translation keys defined but need to be populated in all 7 languages

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