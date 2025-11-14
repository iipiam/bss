# Design Guidelines: Business Management System

## Design Approach

**Selected Approach:** Design System - Material Design inspired, customized for enterprise business management

**Rationale:** This is a complex, data-intensive application requiring consistency, efficiency, and clarity across multiple modules. Drawing inspiration from modern SaaS platforms like Linear, Notion, and enterprise POS systems while maintaining Material Design principles for familiar patterns and strong visual feedback.

**Key Design Principles:**
- Information clarity over visual flourish
- Consistent patterns across all modules
- Efficiency-first interactions
- Clear visual hierarchy for data-dense interfaces
- Responsive layouts that work on tablets for POS use

---

## Typography System

**Font Families:**
- Primary: Inter (via Google Fonts) - body text, UI elements
- Monospace: JetBrains Mono - for numbers, invoices, receipt data, order IDs

**Type Scale:**
- Page Headers: text-3xl (30px) font-bold
- Section Headers: text-2xl (24px) font-semibold
- Card/Module Headers: text-xl (20px) font-semibold
- Subheadings: text-lg (18px) font-medium
- Body Text: text-base (16px) font-normal
- Secondary Text: text-sm (14px) font-normal
- Captions/Labels: text-xs (12px) font-medium uppercase tracking-wide
- Numbers/Data: text-base to text-lg with font-mono

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16 consistently
- Component padding: p-4 or p-6
- Section spacing: space-y-6 or space-y-8
- Card gaps: gap-4 or gap-6
- Page margins: p-6 on mobile, p-8 on desktop

**Grid System:**
- Dashboard: 3-4 column grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Tables: Full-width with horizontal scroll on mobile
- Forms: 2-column on desktop (grid-cols-1 md:grid-cols-2), single column on mobile
- POS: 2-column split (60/40) - item selection left, cart right

**Container Strategy:**
- Max width: max-w-7xl for main content areas
- Sidebar: Fixed width 240px on desktop, collapsible on mobile
- Full-width: Tables and data grids can use w-full

---

## Navigation Structure

**Primary Navigation - Sidebar:**
- Fixed left sidebar (240px wide) with module icons and labels
- Collapsible on mobile (hamburger menu)
- Active state: Emphasized with subtle shift in treatment
- Grouped sections: Operations (POS, Orders, Kitchen), Management (Inventory, Menu, Recipes), Analytics (Sales, Reports, Forecasting, Analysis), Settings (Branches)

**Top Bar:**
- Branch selector dropdown (left side)
- User profile and notifications (right side)
- Breadcrumb navigation for sub-pages
- Height: h-16

**Tab Navigation:**
- Secondary navigation within modules (e.g., Reports: Sales/Inventory/Performance tabs)
- Border-bottom style with sliding indicator
- Spacing: px-6 py-3 per tab

---

## Component Library

### Dashboard Cards
- Metric cards: Rounded corners (rounded-lg), padding p-6
- Layout: Icon top-left, metric center-large (text-3xl font-bold), label below (text-sm), trend indicator bottom-right
- Height: Consistent h-32 for metric cards
- Hoverable with subtle elevation increase

### Data Tables
- Header row: Sticky (sticky top-0), uppercase labels (text-xs uppercase tracking-wide)
- Row height: h-12 for standard rows
- Alternating row treatment for readability
- Action buttons: Right-aligned, icon-only with tooltips
- Pagination: Bottom-center with page numbers and prev/next
- Search/Filter: Top-left above table

### Forms & Input Fields
- Label placement: Above input with mb-2
- Input height: h-12 for text inputs
- Border radius: rounded-md
- Focus states: Ring treatment (focus:ring-2)
- Required fields: Asterisk (*) in label
- Input groups: Related fields grouped with space-y-4
- Validation: Inline error messages below input (text-sm)

### Buttons
- Primary: Solid, rounded-md, px-6 py-3, font-medium
- Secondary: Outline style, same sizing
- Icon buttons: Square (w-10 h-10), rounded-md
- Destructive actions: Distinct treatment for delete/remove
- Button groups: Space-x-3 for horizontal, space-y-2 for vertical

### Modal Dialogs
- Max width: max-w-2xl for standard, max-w-4xl for complex forms
- Padding: p-6
- Header: pb-4 border-b
- Footer: pt-4 border-t with action buttons right-aligned
- Backdrop: Semi-transparent overlay

### Charts & Visualizations
- Card container: p-6, rounded-lg
- Aspect ratio: Maintain 16:9 for charts
- Legend: Bottom or right side
- Tooltips: On hover for data points
- Use chart libraries: Chart.js or Recharts

---

## Module-Specific Layouts

### Dashboard
- 4-column metric cards grid at top (Sales, Orders, Items Low Stock, Active Tables)
- 2-column second row: Recent Orders (left 60%) + Quick Actions (right 40%)
- Full-width row: Sales Chart
- 2-column bottom: Top Selling Items + Inventory Alerts

### Inventory Management
- Top: Search bar (left) + Add Item button (right) + Filter dropdowns
- Main area: Data table with columns (Image thumbnail, Item Name, Category, Quantity, Unit, Supplier, Actions)
- Side panel: Edit form slides in from right (w-96)

### Menu Management
- Card grid layout (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Each card: Image top (aspect-ratio-square), title, description (truncated), price (text-xl font-bold), availability toggle, edit icon
- Add Menu Item: Floating action button (fixed bottom-right)

### POS Interface
- Left section (60%): Category tabs + item grid (grid-cols-3 gap-4)
- Right section (40%): Cart items list + totals + payment methods + checkout button
- Large touch targets: Minimum h-20 for item buttons
- Calculator-style number pad for quantity input

### Kitchen Guidance
- Kanban-style columns: Pending, In Progress, Ready
- Order cards: Order number (large, font-mono), items list, preparation time, special instructions
- Drag-and-drop between columns

### Invoice (PDF & Screen)
- A4 aspect ratio layout
- Header: Business logo + name, invoice number, date
- Bilingual fields: English left, Arabic right
- QR code: Bottom-left corner (128x128)
- Table: Items, quantities, prices, VAT breakdown
- Footer: VAT number, total in both languages

---

## Responsive Breakpoints

- Mobile: Default (< 768px) - Single column, stacked layouts, collapsible sidebar
- Tablet: md (768px+) - 2-column grids, sidebar visible
- Desktop: lg (1024px+) - Full multi-column layouts, fixed sidebar
- Large: xl (1280px+) - Max-width containers, optimal spacing

---

## Interaction Patterns

- Loading states: Skeleton screens for tables/cards, spinner for actions
- Empty states: Icon + message + action button, centered
- Confirmation dialogs: For destructive actions (delete items, void orders)
- Toast notifications: Top-right corner for success/error messages
- Keyboard shortcuts: Display hints for power users (Ctrl+K for search, etc.)

---

## Accessibility

- Minimum touch target: 44x44px for all interactive elements
- Focus indicators: Clear ring on all focusable elements
- ARIA labels: For icon-only buttons
- Semantic HTML: Proper heading hierarchy
- Form labels: Associated with inputs via htmlFor/id
- Consistent tab order: Logical flow through interface

---

## Data Visualization Principles

- Use bar charts for comparisons (sales by branch, top items)
- Line charts for trends over time (daily sales, forecasting)
- Pie charts sparingly, only for clear proportions (payment methods breakdown)
- Data tables for detailed records with sorting/filtering
- Highlight key metrics with large numbers and trend indicators (↑ 12%)

This design system prioritizes efficiency, clarity, and consistency across all modules while maintaining professional aesthetics suitable for a commercial restaurant management application.