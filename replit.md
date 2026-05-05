# BlindSpot System (BSS) - Business Management System

## Overview
BlindSpot System (BSS) is a ZATCA-compliant business management system for Saudi Arabian Restaurant and Factory businesses. It integrates POS, inventory, menu/product management, multi-branch operations, order processing, and advanced analytics. BSS aims to enhance operational efficiency, ensure regulatory compliance, optimize profitability, and support strategic decision-making through features like sales analytics, business reporting, and demand forecasting. It offers comprehensive management solutions to empower businesses.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX
- **Frontend**: React with TypeScript (Vite), utilizing Shadcn UI (New York style) based on Radix UI and Tailwind CSS, adhering to Material Design principles.
- **Styling**: Tailwind CSS, responsive layouts, modern gradients, and animations.
- **Branding**: BSS eagle logo, "Business Management System" subtitle, "Made By Kinzhal LTD Co." footer, tagline: "Empowering businesses with smart management solutions".
- **Internationalization**: Full multi-language support for 10 languages (English, Arabic, German, Chinese, Bengali, Italian, Hindi, Urdu, Spanish, Tagalog) with RTL support for Arabic/Urdu, with English fallback.
- **Responsive Design**: WCAG AAA compliant, device-specific layouts (Laptop, iPad, iPhone) with a persistent device selector.

### Technical Implementation
- **Backend**: Node.js with Express.js, RESTful API with Zod schemas for validation.
- **Authentication**: Bcrypt for hashing, session-based, supporting client and IT account types.
- **Multi-tenant Architecture**: Data isolation using `restaurantId`; dedicated IT account system for cross-tenant support.
- **Business Type Support**: Dual architecture for Restaurant and Factory operations with type-specific features.
- **Real-Time Communication**: WebSocket-based system for notifications, instant updates (menu, recipes, inventory), and automatic BEP calculations.
- **Data Storage**: AWS RDS PostgreSQL (Production) with SSL/TLS encryption, `node-postgres`, and Drizzle ORM.
- **Schema Design**: Central `restaurants` table with `restaurantId` foreign key across domain tables.
- **Database Migrations**: Drizzle Kit with custom AWS RDS migration script.
- **Performance Optimizations**: Database indexes, code splitting with React.lazy and Suspense, and React Query tuning.

### Feature Specifications
- **Analytics & Reporting**: Dashboard with key metrics (DoD, WoW, MoM, YoY), daily demand forecasting, peak hours analysis, detailed BEP calculator with sensitivity analysis, and Menu Profitability Analysis.
- **ZATCA Compliance**: Complete ZATCA Phase 2 e-invoicing integration including UBL 2.1 XML generation, ECDSA digital signing (XAdES-T), 9-Tag QR Codes, API integration for CSID, clearance, and reporting. Features IT settings page, manual credential entry, invoice status tracking, and bilingual PDF invoices. Certificate handling normalizes ZATCA's `base64(base64(DER))` CSID to proper PEM via `normalizeCertificateToPem`/`extractCertificateBase64Body` so all hashing, embedding, and X.509 parsing paths receive correct DER bytes.
- **Financial Management**: Delivery app cost calculation, PDF export for financial statements, Excel import/export, enhanced BEP calculator, manual delivery profitability entry, and automatic bill proration.
- **Management Modules**: CRUD for Customer, Menu Item (with configurable display sizes), Inventory (Excel import/export, expiration tracking, add-ons), Recipe (inventory-linked costing, portion sizes).
- **Stock Management**: Real-time stock calculation and deduction on POS orders.
- **Authentication & Subscriptions**: Subscription-based authentication with Commercial Registration, secure password recovery, authenticated invoice downloads, and centralized VAT-inclusive pricing.
- **Geidea Payment Integration**: Full payment gateway integration for signup and subscription management, including secure tokenization, server-to-server verification, and callback handling.
- **Subscription Management**: Interactive dialogs for plan changes, dynamic pricing, and comparison.
- **Branch Management**: Dynamic selection system.
- **Multi-Shift Support**: Optional second shift configuration with multilingual translations.
- **Ticketing System & IT Support**: Comprehensive ticket management with real-time chat and IT-only dashboard.
- **IT Account Management**: IT accounts can manage all client accounts, including password changes, access control, and account archiving.
- **IT Business Management**: IT accounts can view client subscriptions, generate ZATCA-compliant VAT statements, manage company expenses, and perform BSS analysis with IT BEP analysis and subscription cancellation with prorated refunds.
- **WhatsApp Integration**: Automatic deep-link for sending ZATCA-compliant invoices.
- **Team Chat**: Internal messaging system with DMs and channels.
- **Granular Permission System**: Role-based access control with 19 granular permissions enforced at backend and frontend.
- **Employee Activity Log**: Tracks sub-account actions (orders, inventory, menu, recipes, procurement) with filtering, grouping, and non-blocking logging.
- **Service Business Project Management (BizFlow Manager)**: Full project lifecycle management for design, installation, and IT services. Includes project CRUD, sub-resources (services, bills, procurements, tasks, payment schedules), CPM scheduling, quotation workflow (bilingual PDF generation), company settings (agreement templates), PDF generation (quotations, project dossier), milestone-based payment schedules, and project-level financial tracking.
- **Bills Management**: Salary bill generation.
- **PDF Invoice Generation**: ZATCA-compliant invoices with page break handling and bilingual refund policies.
- **Investor Statement PDF**: Downloadable bilingual investor statement for Money Investors and Recipe Owners.
- **Recipe Import**: Flexible column mapping for ingredient/step parsing.
- **License Document Upload**: Secure file upload (PDF, JPEG, PNG, GIF, WebP) with 10MB limit, authenticated access, and drag-and-drop UI.
- **License Fees**: Optional fee tracking for each license.
- **Procurement Invoice Image Upload**: Drag-and-drop upload for invoice images (JPEG, PNG, GIF, WebP) and PDFs with 10MB limit, secure storage, and authentication.
- **Procurement-to-Bills Sync**: Automatic synchronization between procurement status and shop bills with tenant isolation.
- **Procurement-to-Inventory Sync**: Automatic inventory item creation from "inventory" type procurements when completed.
- **Procurement Reorder**: One-click reorder for completed/received inventory procurements, adding quantity to existing inventory items.
- **Violations Management**: Track government violations with document uploads, status tracking, automatic bill creation, statistics dashboard, and a reference document feature for regulations.
- **Printer Configuration**: Multi-tenant printer settings with support for thermal receipt printers (Epson, Star Micronics, Brother, Zebra, BIXOLON), IP-based network printers with QZ Tray integration, and per-branch default printer selection.
- **Meal Subscription Management**: Restaurant-only feature for managing recurring meal plans (daily/weekly/monthly). Includes subscriber management (name, phone, email, delivery address, dietary notes), meal selections linked to menu items, schedule days configuration, meal time (breakfast/lunch/dinner), payment status tracking (paid/pending/partial), subscription lifecycle (active/paused/expired/cancelled), summary dashboard (active count, monthly revenue, today's deliveries), and full multi-language support.

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