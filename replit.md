# RestoPOS - Restaurant Management System

## Overview

RestoPOS is a comprehensive restaurant management system tailored for Saudi Arabian restaurants, ensuring ZATCA-compliant invoicing. It offers a complete suite of features including Point of Sale (POS), inventory, menu and recipe management, multi-branch operations, order processing, kitchen display, sales analytics, business reporting, demand forecasting, and strategic decision-making tools for profitability optimization. The system focuses on data clarity, operational efficiency, and adherence to Saudi regulatory requirements to streamline restaurant operations.

## Recent Changes (November 2, 2025)

### Inventory Management CRUD & Enhanced Exports
Added complete inventory management and expanded export capabilities:
- **Inventory CRUD**: Full create/edit/delete operations for inventory items with smart numeric validation
- **Form Validation**: Quantity field uses numeric validation (z.coerce.number().positive()) with proper type conversion
- **Error Handling**: All mutations include onError callbacks with descriptive toast messages
- **Profitability Export**: Export profitability analysis data to Excel (filtered by time period)
- **Financial Export**: Export financial statements to Excel (monthly or yearly, filtered by year)
- **Smart Dialog Management**: Dialog state properly manages create/edit modes with form reset

### Menu Item Edit & Delete Functionality
Added full CRUD operations for menu items:
- **Edit Menu Items**: Click edit button to modify name, description, category, and base price
- **Delete Menu Items**: Click delete button with confirmation dialog before removal
- **Smart Dialog Management**: Dialog automatically switches between create/edit modes with proper state cleanup
- **Visual Feedback**: Success toasts for create, update, and delete operations
- **Cache Invalidation**: Automatic UI refresh after mutations to show latest data

### Excel Export/Import Functionality
Added comprehensive data export and import capabilities:
- **Export to Excel**: All major data tables (inventory, menu, recipes, orders, transactions, procurement, branches) can be exported to Excel format
- **Import from Excel**: Bulk data import for inventory, menu, recipes, and branches via Excel file upload
- **UI Integration**: Export/Import buttons added to Inventory and Menu pages with file upload handling
- **Backend Routes**: Complete API endpoints for export (GET /api/export/*) and import (POST /api/import/*)
- **File Processing**: Using xlsx library for Excel generation and multer for file uploads

### Subscription-Based Authentication & Password Recovery
Added comprehensive authentication enhancements for Saudi Arabian market:
- **Subscription Plans**: Two-tier pricing structure (Monthly: 119.75 SAR, Yearly: 1,197.50 SAR with 17% discount)
- **Commercial Registration**: Mandatory field for all new signups (Saudi business requirement)
- **Password Recovery**: Complete forgot password flow with token-based reset (1-hour expiry)
- **Security**: Time-limited reset tokens, secure password hashing, email validation

### Strategic Decision-Making Tabs in Profitability Analysis
Added four comprehensive tabs to help restaurant owners make data-driven strategic decisions:
- **Strategic Overview**: Total revenue, profit, margins, costs with detailed breakdown by item and category
- **Pricing Analysis**: Margin categorization (below cost, low, healthy, premium), price coverage analysis, and recommended pricing adjustments to achieve 30% margins
- **Scaling Viability**: Unit economics (avg profit/unit, break-even analysis), maximum customer acquisition cost calculations, and investment capacity recommendations
- **Cost Management**: Cost reduction impact analysis, priority targets for cost optimization, and three reduction strategies (supplier negotiation, ingredient substitution, portion control)

All calculations use basePrice (pre-VAT) for accurate profit margin analysis.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite.
- **Routing**: Wouter.
- **UI Component System**: Shadcn UI (New York style) built on Radix UI and Tailwind CSS, adhering to Material Design principles.
- **State Management**: TanStack Query for server state; local React state for UI.
- **Styling**: Tailwind CSS with custom design tokens, CSS variables for theming, responsive layouts for desktop and tablet.
- **Form Handling**: React Hook Form with Zod for validation.
- **Design Rationale**: Single-page application with modular features for fast navigation and maintainability.

### Backend Architecture
- **Runtime**: Node.js with Express.js.
- **API Design**: RESTful API organized by domain.
- **Data Validation**: Zod schemas shared between frontend and backend.
- **Development Setup**: Vite dev server middleware, single server process for API and static files.
- **Session Management**: Express sessions with in-memory storage (MemoryStore), secure cookies.
- **Authentication**: Bcrypt for password hashing (10 salt rounds), session-based authentication.
- **Design Rationale**: Monolithic Express server for simplified deployment and separation of concerns; shared schemas for type safety.

### Data Storage
- **Database**: PostgreSQL via Neon serverless driver.
- **ORM**: Drizzle ORM for type-safe queries.
- **Schema Design**: Supports multi-branch operations, inventory, menu (with VAT-inclusive pricing), recipes, orders, transactions, procurement, users (role-based permissions), ZATCA-compliant invoices, and system settings.
- **Migration Strategy**: Drizzle Kit.
- **Design Rationale**: PostgreSQL for ACID compliance and complex queries; Drizzle ORM for TypeScript integration.

### PDF Invoice Generation
- **Library**: jsPDF for ZATCA-compliant invoices.
- **QR Code Generation**: QRCode library for TLV-encoded QR codes containing seller name, VAT number, timestamp, total amount, and VAT amount.
- **Design Rationale**: Ensures compliance with Saudi Arabian electronic invoicing regulations.

### Authentication & Authorization
- **Implementation**: Session-based system with user roles (admin/employee), bcrypt hashing, Express-session middleware, and granular feature permissions.
- **Security**: In-memory session storage (dev), secure cookies, no plaintext password storage.

### API Structure
- **Endpoint Organization**: Resource-based endpoints for branches, inventory, menu, recipes, orders, transactions, procurement, settings, analytics (dashboard, sales, financial), invoices, and authentication/user management.
- **Response Format**: JSON with consistent error handling.
- **Design Rationale**: RESTful conventions for predictability and ease of consumption; separated analytics for complex aggregations.

## External Dependencies

### UI Component Library
- **Radix UI**: Unstyled, accessible component primitives.
- **Shadcn UI**: Pre-built components.
- **Lucide React**: Icon library.

### Data Visualization
- **Recharts**: Charting for analytics.

### Database & ORM
- **@neondatabase/serverless**: PostgreSQL client.
- **Drizzle ORM**: Type-safe ORM.
- **Drizzle Zod**: Schema validation integration.

### Styling
- **Tailwind CSS**: Utility-first CSS framework.
- **class-variance-authority**: Type-safe variant styling.
- **tailwind-merge**: Intelligent Tailwind class merging.

### Forms & Validation
- **React Hook Form**: Form state management.
- **Zod**: TypeScript-first schema validation.

### Utilities
- **date-fns**: Date manipulation.
- **cmdk**: Command palette component.
- **nanoid**: Unique ID generation.

### Security & Authentication
- **bcrypt**: Password hashing.
- **express-session**: Session middleware.
- **memorystore**: In-memory session storage (development).