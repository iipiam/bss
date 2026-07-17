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
- **Permissions Audit (IT-only vs permission-gated pages)**: Pages fall into three categories. (1) IT-only: cross-tenant tools that never touch a single restaurant context — IT Dashboard, Performance, IT Account Management, Business Management, ZATCA Settings, Inspection Tools, App Diagram. Backend routes are guarded with `requireITAccount` (e.g. `/api/it/inspection/*`, `/api/it/app-diagram/pdf`), the sidebar `filterMenuItems` filter hides them for any non-IT account regardless of permission flags, and the `App.tsx` `itOnlyRoutes` list redirects client accounts that try to navigate to them. (2) Permission-gated: tenant-scoped pages mapped to one of the 19 granular permissions and enforced server-side via `requirePermission`/`requireAction` plus client-side via `usePermissions`. New Marketing tools are mapped to the existing `marketing` permission (`/api/marketing/*` uses `requireRestaurant` + `requirePermission('marketing')` for reads and `requireAction('marketing','add'|'delete')` for writes; sidebar entry has `permission: 'marketing'`). (3) Public to all authenticated roles: profile, tutorial, team chat, support, password manager. When adding a new page, decide which bucket it belongs to, add the matching middleware to every new `/api/...` endpoint, and add the route to either `itOnlyRoutes` (IT-only) or the sidebar item's `permission` field (permission-gated).
- **Employee Activity Log**: Tracks sub-account actions (orders, inventory, menu, recipes, procurement) with filtering, grouping, and non-blocking logging.
- **Service Business Project Management (BizFlow Manager)**: Full project lifecycle management for design, installation, and IT services. Includes project CRUD, sub-resources (services, bills, procurements, tasks, payment schedules), CPM scheduling, quotation workflow (bilingual PDF generation), company settings (agreement templates), PDF generation (quotations, project dossier), milestone-based payment schedules, and project-level financial tracking. Per-project **Client Requirements** (CRUD list with priority/status + PDF export) and **Meetings** (scheduling, agenda/notes/summary/transcript, action items with assignee + due-date, reminder lead-time, status; single-meeting and all-meetings PDF export).
- **Bills Management**: Salary bill generation. Salary settlement flow: settling a salary can attach a transaction invoice (PDF/image, stored in uploads/shop-bill-invoices) and marks/creates a paid salary shop bill (reconciles existing pending salary bill for same employee+month to avoid duplicates). Invoice paths are never client-writable and all invoice file reads/deletes enforce a path prefix check under the upload directory.
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
- **Fake Followers Detector (Marketing)**: Manual influencer profile CRUD per tenant (table `influencer_profiles`) with scoring formulas (ER<2% +30, follow ratio>1.5 +20, 30d growth>15% +25, generic-comments>40% +15; cap 100). Color-coded fake% (<15 green / 15-30 yellow / >30 red), quality score, red-flags list, Saudi food-niche benchmarks (pie + bar charts via Recharts), bilingual EN/AR UI, CSV export (client) and Puppeteer PDF export. Gated by `marketing` permission; PATCH route uses partial Zod schema and storage strips `restaurantId` to prevent tenant reassignment.
- **Project Discount**: Service-business projects (design/installation/IT) support a percent or fixed-amount discount (discount_type/discount_value on service_projects) applied before VAT in the agreement PDF, editable via a dialog on the project detail page.
- **Equipment Supplier Management**: Service-business module (gated by `procurement` permission, `/suppliers` page) for equipment rental companies. 7 tenant-scoped tables (suppliers, equipment, payments, documents, equipment documents, rentals, equipment types with lazy Arabic seed). Features: bilingual EN/AR UI, grid/table list with completion-ring score, 4-section form with dynamic equipment/rate rows, detail tabs (profile, payment installments with overdue detection, document slots with 5MB PDF/image uploads to uploads/supplier-docs, per-equipment docs, rental agreement generation with print + history), reports (summary KPIs, performance rankings, price comparison), alerts (overdue/due-soon payments, rentals ending), equipment-type manager, CSV export. Server recomputes completion score (identity 25 / legal-bank 25 / equipment 20 / docs 20 / terms 10) on every mutation; all nested routes verify parent-child ownership before mutating; upload paths enforce a directory-prefix check.
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