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

**Session Management**: Express sessions with connect-pg-simple for PostgreSQL-backed session storage.

**Design Rationale**: The monolithic Express server simplifies deployment while maintaining separation of concerns through modular route handlers. The shared schema approach between client and server ensures type safety across the entire stack and reduces duplication.

### Data Storage

**Database**: PostgreSQL accessed via Neon serverless driver (@neondatabase/serverless).

**ORM**: Drizzle ORM for type-safe database queries with schema-first approach.

**Schema Design**:
- Branches: Multi-location support with branch-specific data
- Inventory Items: Stock tracking with supplier information and branch relationships
- Menu Items: Product catalog with pricing, categories, and availability status
- Recipes: Preparation instructions linked to menu items with ingredient lists
- Orders: Customer orders with status tracking, order types (dine-in, delivery, takeout)
- Transactions: Financial records tied to orders for sales tracking
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

**Current State**: The codebase includes session infrastructure but does not implement user authentication in the visible routes. The session setup suggests future authentication capabilities.

**Design Consideration**: Multi-user access with role-based permissions would be a logical next step given the multi-branch architecture and different operational roles (cashier, kitchen staff, manager, administrator).

### API Structure

**Endpoint Organization**:
- `/api/branches` - Branch CRUD operations
- `/api/inventory` - Inventory management
- `/api/menu` - Menu item management  
- `/api/recipes` - Recipe CRUD operations
- `/api/orders` - Order processing and tracking
- `/api/transactions` - Sales transaction records
- `/api/settings` - System configuration
- `/api/analytics/*` - Dashboard and reporting data

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

### Potential Future Dependencies
- Authentication library (e.g., Passport.js, Auth.js)
- WebSocket library for real-time kitchen display updates
- Payment gateway SDKs for Saudi market (Moyasar, HyperPay)
- Reporting export libraries (Excel, CSV generation)