# RestoPOS - Restaurant Management System

## Overview

RestoPOS is a comprehensive restaurant management system designed for Saudi Arabian restaurants with ZATCA-compliant invoicing. The application provides a complete suite of features including Point of Sale (POS), inventory management, menu management, recipe tracking, multi-branch operations, order processing, kitchen display system, sales analytics, business reporting, demand forecasting, and system settings.

The system is built to handle the complexity of modern restaurant operations with a focus on data clarity, operational efficiency, and regulatory compliance for the Saudi market.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool.

**Routing**: Wouter for client-side routing, providing a lightweight alternative to React Router.

**UI Component System**: Shadcn UI (New York style) built on Radix UI primitives with Tailwind CSS for styling. The design system follows Material Design principles customized for enterprise restaurant management, emphasizing information clarity over visual flourish.

**State Management**: 
- TanStack Query (React Query) for server state management with automatic caching, refetching, and synchronization
- Local React state for component-level UI state
- No global state management library; relies on React Query's cache as the source of truth for server data

**Styling Approach**:
- Tailwind CSS with custom design tokens for colors, spacing, and typography
- CSS variables for theme support (light/dark modes)
- Custom font stack: Inter for UI, JetBrains Mono for numerical data and receipts
- Responsive layouts optimized for both desktop management and tablet POS use

**Form Handling**: React Hook Form with Zod for validation via @hookform/resolvers.

**Design Rationale**: The frontend is structured as a single-page application with multiple feature modules (Dashboard, Inventory, Menu, POS, etc.). This architecture allows for fast navigation and maintains state across views while keeping the codebase modular and maintainable.

### Backend Architecture

**Runtime**: Node.js with Express.js server framework.

**API Design**: RESTful API with resource-based endpoints organized by domain (branches, inventory, menu, orders, transactions, settings).

**Data Validation**: Zod schemas shared between frontend and backend for type safety and runtime validation.

**Development Setup**: 
- Vite dev server in middleware mode for hot module replacement during development
- Single server process handles both API routes and static file serving in production
- TypeScript compilation with ESM module format

**Session Management**: Express sessions configured with express-session middleware using in-memory storage (MemoryStore). Sessions store userId and role for authenticated users with secure cookie settings and 24-hour expiration.

**Authentication**: Bcrypt password hashing with 10 salt rounds for secure password storage. Session-based authentication chosen for simplicity and built-in security features.

**Design Rationale**: The monolithic Express server simplifies deployment while maintaining separation of concerns through modular route handlers. The shared schema approach between client and server ensures type safety across the entire stack and reduces duplication.

### Data Storage

**Database**: PostgreSQL accessed via Neon serverless driver (@neondatabase/serverless).

**ORM**: Drizzle ORM for type-safe database queries with schema-first approach.

**Schema Design**:
- Branches: Multi-location support with branch-specific data
- Inventory Items: Stock tracking with supplier information and branch relationships
- Menu Items: Product catalog with VAT-inclusive pricing (basePrice, vatAmount, price fields for 15% Saudi VAT), categories, and availability status
- Recipes: Preparation instructions linked to menu items with ingredient lists
- Orders: Customer orders with status tracking, order types (dine-in, delivery, takeout)
- Transactions: Financial records tied to orders for sales tracking with VAT breakdown
- Procurement: Unified tracking for inventory purchases, maintenance work orders, installations, and equipment procurement with status workflow, priority levels, and cost management
- Users: Employee and admin accounts with role-based permissions (admin/employee roles, granular feature permissions), bcrypt-hashed passwords
- Invoices: ZATCA-compliant invoice records with line items, VAT calculations, QR codes, and PDF generation support
- Settings: System-wide configuration for company details and ZATCA compliance

**Migration Strategy**: Drizzle Kit for schema migrations with PostgreSQL dialect.

**Design Rationale**: PostgreSQL provides ACID compliance for financial transactions and complex querying capabilities for reporting. Drizzle ORM offers excellent TypeScript integration while maintaining direct SQL access when needed. The schema supports multi-branch operations while keeping data normalized to prevent inconsistencies.

### PDF Invoice Generation

**Library**: jsPDF for creating ZATCA-compliant PDF invoices.

**QR Code Generation**: QRCode library for generating TLV-encoded (Tag-Length-Value) QR codes containing:
- Seller name
- VAT registration number
- Timestamp
- Total amount with VAT
- VAT amount

**Design Rationale**: ZATCA (Zakat, Tax and Customs Authority) compliance is mandatory for Saudi Arabian businesses. The TLV encoding format ensures invoices meet regulatory requirements for electronic invoicing.

### Authentication & Authorization

**Implementation**: Full session-based authentication system with:
- User schema supporting admin and employee roles with granular permission flags
- Bcrypt password hashing (10 salt rounds) for secure credential storage
- Express-session middleware with secure cookies (httpOnly, 24-hour expiration)
- Authentication API routes: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- User management API for admin users to create and manage employees
- Permission system with boolean flags for each feature (dashboard, inventory, menu, POS, orders, kitchen, sales, reports, financial, employees, etc.)

**Security**: Sessions stored in-memory (production would use Redis or PostgreSQL), secure cookies enabled in production mode, passwords never stored in plaintext.

**Current State**: Backend authentication is complete and functional. Frontend login page and employee management UI are pending implementation. Route protection based on permissions needs to be added to both frontend and backend routes.

### API Structure

**Endpoint Organization**:
- `/api/branches` - Branch CRUD operations
- `/api/inventory` - Inventory management
- `/api/menu` - Menu item management with VAT-inclusive pricing
- `/api/recipes` - Recipe CRUD operations
- `/api/orders` - Order processing and tracking
- `/api/transactions` - Sales transaction records with VAT breakdown
- `/api/procurement` - Procurement management with filtering by type (inventory, maintenance, installation, equipment) and status
- `/api/settings` - System configuration
- `/api/analytics/dashboard` - Dashboard metrics and KPIs
- `/api/analytics/sales` - Sales charts and trends
- `/api/analytics/financial` - Financial statements (monthly/yearly revenue, VAT collection, transaction counts)
- `/api/invoices` - ZATCA-compliant invoice retrieval and management
- `/api/auth/login` - User authentication (POST)
- `/api/auth/logout` - Session termination (POST)
- `/api/auth/me` - Current user session info (GET)
- `/api/users` - User CRUD operations (admin only)

**Response Format**: JSON with consistent error handling patterns.

**Design Rationale**: Resource-based endpoints follow REST conventions making the API predictable and easy to consume. The analytics endpoints are separated to support complex aggregations without cluttering the main CRUD operations.

## External Dependencies

### UI Component Library
- **Radix UI**: Unstyled, accessible component primitives (dialogs, dropdowns, popovers, etc.)
- **Shadcn UI**: Pre-built component compositions using Radix UI
- **Lucide React**: Icon library for consistent iconography

### Data Visualization
- **Recharts**: Chart library for sales graphs, forecasting visualizations, and analytics dashboards

### Database & ORM
- **@neondatabase/serverless**: PostgreSQL client optimized for serverless environments
- **Drizzle ORM**: Type-safe ORM with schema migrations
- **Drizzle Zod**: Schema validation integration

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant styling
- **tailwind-merge**: Intelligent Tailwind class merging

### Forms & Validation
- **React Hook Form**: Performant form state management
- **Zod**: TypeScript-first schema validation

### Utilities
- **date-fns**: Date manipulation and formatting
- **cmdk**: Command palette component (keyboard-driven search/navigation)
- **nanoid**: Unique ID generation

### Development Tools
- **Vite**: Build tool and dev server
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler for production builds

### Replit-Specific Plugins
- Runtime error overlay for development debugging
- Cartographer for code navigation
- Development banner for Replit environment

### Security & Authentication
- **bcrypt**: Password hashing and verification
- **express-session**: Session middleware for authentication
- **memorystore**: In-memory session storage for development

### Potential Future Dependencies
- WebSocket library for real-time kitchen display updates
- Payment gateway SDKs for Saudi market (Moyasar, HyperPay)
- Reporting export libraries (Excel, CSV generation)

## Recent Changes (November 2025)

### ZATCA Invoice System (COMPLETE - PRODUCTION READY)
- **Invoice Generation**: ZATCA-compliant PDF invoices with TLV-encoded QR codes containing seller name, VAT number, timestamp, total amount, and VAT amount
- **PDF Persistence**: Invoice PDFs saved to `/invoices` directory with static file serving for retrieval
- **QR Code Storage**: Base64-encoded QR codes stored in invoice database records for compliance tracking
- **POS Integration**: Automatic invoice creation and PDF generation on order checkout
- **Invoice API**: Full CRUD operations for invoice management with `/api/invoices` endpoints
- **Database Records**: Complete invoice metadata including line items, VAT breakdown, customer info, and PDF URLs
- Technical Implementation:
  - Modified `generateZATCAInvoice()` to return both `pdfBuffer` and `qrCode`
  - Added filesystem operations to persist PDFs at `/invoices/{invoiceNumber}.pdf`
  - Configured Express static file middleware for `/invoices` route
  - Invoice records store QR codes for ZATCA verification and compliance auditing

### User Management & Authentication (COMPLETE)
- **Frontend**: Login page with username/password authentication
- **Frontend**: First-run setup wizard for initial admin account creation
- **Frontend**: Employee management UI with role assignment and permission controls
- **Backend**: Session-based authentication with bcrypt password hashing (10 salt rounds)
- **Backend**: User CRUD API with role-based access control (admin-only)
- **Security**: Fixed double password hashing bug, secure cookie configuration, 24-hour sessions
- **Testing**: End-to-end authentication flow verified via automated playwright tests
- Granular permission system with boolean flags for each feature (dashboard, inventory, menu, POS, orders, kitchen, sales, reports, financial, employees)
- **Pending**: Route protection based on user permissions

### Financial Statements Feature (COMPLETE)
- Added `/api/analytics/financial` endpoint providing monthly and yearly revenue analytics with VAT breakdown
- Created Financial Statements page with interactive charts showing revenue trends over time
- Implemented invoice list view with ZATCA-compliant invoice records
- Added monthly revenue cards displaying current month metrics with year-over-year comparisons
- Financial data aggregates transactions by month and year for comprehensive reporting

### VAT-Inclusive Pricing System (COMPLETE)
- Updated menu schema to include `basePrice`, `vatAmount`, and `price` fields (15% Saudi VAT)
- Menu management page now displays complete VAT breakdown for transparency
- All menu items automatically calculate VAT based on base price
- Compliant with Saudi Arabian tax regulations requiring VAT visibility

### Security Improvements
- Removed plaintext admin password from seed data
- Configured secure session cookies (httpOnly, secure in production)
- Implemented proper password hashing for all user account creation
- Fixed authentication bug: removed double password hashing (both route and storage were hashing)
- Session-based authentication prevents CSRF attacks and simplifies client implementation

### Design Compliance
- Removed emoji placeholders from UI components
- Replaced visual placeholders with Lucide React icons per design guidelines
- Maintained consistent design system across all new features