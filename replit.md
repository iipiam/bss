# RestoPOS - Restaurant Management System

## Overview

RestoPOS is a comprehensive, ZATCA-compliant restaurant management system designed for Saudi Arabian restaurants. It integrates Point of Sale (POS), inventory, menu and recipe management, multi-branch operations, order processing, kitchen display, and advanced analytics. The system focuses on data clarity, operational efficiency, and adherence to Saudi regulatory requirements for streamlined operations, profitability optimization, and strategic decision-making. Key capabilities include sales analytics, business reporting, demand forecasting, and tools for financial performance and cost management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript (Vite).
- **UI**: Shadcn UI (New York style) built on Radix UI and Tailwind CSS, adhering to Material Design principles.
- **State Management**: TanStack Query for server state; local React state for UI.
- **Form Handling**: React Hook Form with Zod validation.
- **Styling**: Tailwind CSS with custom design tokens, responsive layouts.
- **Design Rationale**: Single-page application, modular features, fast navigation.

### Backend Architecture
- **Runtime**: Node.js with Express.js.
- **API Design**: RESTful API organized by domain.
- **Data Validation**: Zod schemas shared between frontend and backend.
- **Authentication**: Bcrypt for password hashing, session-based authentication.
- **Design Rationale**: Monolithic Express server for simplified deployment and separation of concerns; shared schemas for type safety.

### Data Storage
- **Database**: PostgreSQL via Neon serverless driver.
- **ORM**: Drizzle ORM for type-safe queries.
- **Schema Design**: Supports multi-branch operations, inventory (with unit pricing for cost tracking), menu (with VAT-inclusive pricing), recipes, orders, transactions, procurement, users (role-based permissions), ZATCA-compliant invoices, customers, and system settings.
- **Migration Strategy**: Drizzle Kit.
- **Design Rationale**: PostgreSQL for ACID compliance; Drizzle ORM for TypeScript integration.

### Core Features & Implementations
- **ZATCA Compliance**: Bilingual invoicing (Arabic/English) using Puppeteer-based PDF generation with headless Chromium, QR code generation for public invoice viewer, and PDF export for invoices meeting Saudi e-invoicing regulations. Invoice PDFs feature professional HTML templates with proper RTL/LTR support, Google Fonts (Inter for English, Noto Naskh Arabic for Arabic), and ZATCA-compliant bilingual layout. Invoices optimized to fit on single A4 page with compact spacing and reduced font sizes.
- **Invoice Management**: Dedicated invoices page displaying all saved ZATCA-compliant invoices with search functionality (by invoice number or customer name) and PDF download capabilities. Invoices are automatically saved during POS checkout with secure HTML escaping and shared browser instance for optimal performance.
- **Multi-Language Support**: Comprehensive support for 7 languages (English, Arabic, Chinese, German, Hindi, Urdu, Bengali) with RTL support for Arabic/Urdu, persistent language settings, and a dedicated language selector.
- **Creative UI/UX**: Modern gradient designs on tabs with smooth animations (fade-in, hover effects, active state glow), creative sidebar navigation with unique gradient colors per menu item, and responsive hover interactions throughout the interface. Help/Support section integrated into sidebar with modal dialog displaying contact information including email (int@mwcdtr.org) and WhatsApp link (+966 50 000 0000).
- **Customer Management**: Full CRUD operations for customer data, customer order history display, and integration into POS with search and selection.
- **Menu Item Management**: Full CRUD operations for menu items, including a discount system with correct pricing flow (discount applied before VAT) and real-time price previews.
- **Inventory Management**: Complete CRUD operations for inventory items with price tracking per unit (SAR), smart numeric validation, error handling, and Excel template download/import/export functionality for bulk data management.
- **Recipe Management**: Complete CRUD operations with inventory-linked ingredients for accurate cost calculation. Ingredients must be selected from existing inventory items, and recipe costs are automatically calculated based on ingredient quantities and unit prices.
- **Financial Features**: PDF export for financial statements, Excel export/import functionality for various data tables (inventory, menu, recipes, orders, etc.).
- **Strategic Decision-Making**: Profitability analysis with dedicated tabs for Strategic Overview, Pricing Analysis, Scaling Viability, and Cost Management.
- **Authentication**: Subscription-based authentication with Commercial Registration field, password recovery (token-based), and secure password hashing.

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
- **Puppeteer**: Headless Chromium for PDF generation (ZATCA invoices with bilingual support).
- **QRCode**: QR code generation.
- **Recharts**: Charting for analytics.
- **bcrypt**: Password hashing.
- **express-session**: Session middleware.
- **date-fns**: Date manipulation.
- **xlsx**: Excel generation and parsing.

### System Dependencies (for Puppeteer)
- **Chromium**: Headless browser for PDF rendering.
- **Graphics Libraries**: libxkbcommon, glib, gtk3, nss, freetype, harfbuzz, fontconfig.
- **X11 Libraries**: xorg.libX11, xorg.libXcomposite, xorg.libxcb, xorg.libXdamage, xorg.libXext, xorg.libXfixes, xorg.libXrandr.
- **Other**: mesa, cairo, cups, dbus, gdk-pixbuf, pango, alsa-lib, at-spi2-atk, at-spi2-core, atk, cacert.