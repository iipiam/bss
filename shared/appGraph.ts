// Real BSS app structure as a graph.
// Curated map of pages -> API routes -> storage methods -> database tables.
// Kept in source so it's reviewable; rendered identically in the web UI and the PDF export.

export type Domain =
  | "operations"
  | "management"
  | "analytics"
  | "system"
  | "it"
  | "marketing"
  | "external";

export type NodeKind = "page" | "route" | "storage" | "table" | "external";

export interface AppNode {
  id: string;
  kind: NodeKind;
  label: string;
  domain: Domain;
  meta?: {
    path?: string;        // URL path or file path
    permission?: string;  // RBAC permission flag, or "it-only", or "public"
    file?: string;        // source file location
    table?: string;       // db table name
  };
}

export interface AppEdge {
  from: string;
  to: string;
  kind: "calls" | "reads" | "writes" | "uses";
}

export const DOMAIN_COLORS: Record<Domain, { fill: string; stroke: string; text: string }> = {
  operations:  { fill: "#dbeafe", stroke: "#2563eb", text: "#1e3a8a" },
  management:  { fill: "#dcfce7", stroke: "#16a34a", text: "#14532d" },
  analytics:   { fill: "#fef3c7", stroke: "#d97706", text: "#78350f" },
  marketing:   { fill: "#fae8ff", stroke: "#a21caf", text: "#581c87" },
  system:      { fill: "#e2e8f0", stroke: "#475569", text: "#0f172a" },
  it:          { fill: "#fce7f3", stroke: "#db2777", text: "#831843" },
  external:    { fill: "#ede9fe", stroke: "#7c3aed", text: "#4c1d95" },
};

export const KIND_LABELS: Record<NodeKind, string> = {
  page: "Page",
  route: "API Route",
  storage: "Storage",
  table: "DB Table",
  external: "External",
};

// Helper to keep the definition concise
const p = (id: string, label: string, domain: Domain, path: string, permission: string): AppNode =>
  ({ id, kind: "page", label, domain, meta: { path, permission } });
const r = (id: string, label: string, domain: Domain, path: string, permission: string): AppNode =>
  ({ id, kind: "route", label, domain, meta: { path, permission } });
const s = (id: string, label: string, domain: Domain, file = "server/storage.ts"): AppNode =>
  ({ id, kind: "storage", label, domain, meta: { file } });
const t = (id: string, table: string, domain: Domain): AppNode =>
  ({ id, kind: "table", label: table, domain, meta: { table, file: "shared/schema.ts" } });
const x = (id: string, label: string): AppNode =>
  ({ id, kind: "external", label, domain: "external" });

export const APP_NODES: AppNode[] = [
  // ===== OPERATIONS =====
  p("pg.pos", "POS", "operations", "/pos", "pos"),
  p("pg.orders", "Orders", "operations", "/orders", "orders"),
  p("pg.kitchen", "Kitchen", "operations", "/kitchen", "kitchen"),
  p("pg.delivery", "Delivery Apps", "operations", "/delivery-apps", "deliveryApps"),
  p("pg.mealsubs", "Meal Subscriptions", "operations", "/meal-subscriptions", "mealSubscriptions"),
  p("pg.catering", "Catering Contracts", "operations", "/catering-contracts", "catering"),

  r("rt.orders", "/api/orders", "operations", "GET|POST|PATCH /api/orders", "orders"),
  r("rt.mealsubs", "/api/meal-subscriptions", "operations", "GET|POST /api/meal-subscriptions", "mealSubscriptions"),
  r("rt.catering", "/api/catering-contracts", "operations", "GET|POST /api/catering-contracts", "catering"),
  r("rt.delivery", "/api/delivery-apps", "operations", "GET|POST /api/delivery-apps", "deliveryApps"),

  s("st.orders", "createOrder / getOrders", "operations"),
  s("st.mealsubs", "Meal subscription CRUD", "operations"),
  s("st.catering", "Catering contract CRUD", "operations"),

  t("tb.orders", "orders", "operations"),
  t("tb.orderItems", "order_items", "operations"),
  t("tb.mealsubs", "meal_subscriptions", "operations"),
  t("tb.catering", "catering_contracts", "operations"),

  // ===== MANAGEMENT =====
  p("pg.dashboard", "Dashboard", "management", "/", "dashboard"),
  p("pg.inventory", "Inventory", "management", "/inventory", "inventory"),
  p("pg.menu", "Menu / Products", "management", "/menu", "menu"),
  p("pg.recipes", "Recipes", "management", "/recipes", "recipes"),
  p("pg.licenses", "Licenses", "management", "/licenses", "licenses"),
  p("pg.customers", "Customers", "management", "/customers", "customers"),
  p("pg.investors", "Investors", "management", "/investors", "reports"),
  p("pg.branches", "Branches", "management", "/branches", "branches"),
  p("pg.procurement", "Procurement", "management", "/procurement", "procurement"),

  r("rt.inventory", "/api/inventory", "management", "GET|POST|PATCH|DELETE /api/inventory", "inventory"),
  r("rt.menu", "/api/menu", "management", "GET|POST|PATCH|DELETE /api/menu-items", "menu"),
  r("rt.recipes", "/api/recipes", "management", "GET|POST|PATCH /api/recipes", "recipes"),
  r("rt.customers", "/api/customers", "management", "GET|POST|PATCH /api/customers", "customers"),
  r("rt.branches", "/api/branches", "management", "GET|POST|PATCH /api/branches", "branches"),
  r("rt.procurement", "/api/procurement", "management", "GET|POST|PATCH /api/procurement", "procurement"),
  r("rt.licenses", "/api/licenses", "management", "GET|POST /api/licenses", "licenses"),

  s("st.inventory", "Inventory CRUD + sync", "management"),
  s("st.menu", "Menu items CRUD", "management"),
  s("st.recipes", "Recipes + costing", "management"),
  s("st.customers", "Customers CRUD", "management"),
  s("st.branches", "Branches CRUD", "management"),
  s("st.procurement", "Procurement + bills sync", "management"),

  t("tb.inventory", "inventory_items", "management"),
  t("tb.menu", "menu_items", "management"),
  t("tb.recipes", "recipes", "management"),
  t("tb.customers", "customers", "management"),
  t("tb.branches", "branches", "management"),
  t("tb.procurement", "procurement", "management"),
  t("tb.licenses", "licenses", "management"),

  // ===== ANALYTICS / FINANCE =====
  p("pg.sales", "Sales", "analytics", "/sales", "sales"),
  p("pg.financial", "Financial", "analytics", "/financial", "reports"),
  p("pg.profitability", "Profitability + BEP", "analytics", "/profitability", "reports"),
  p("pg.invoices", "Invoices (ZATCA)", "analytics", "/invoices", "reports"),
  p("pg.vat", "VAT Reports", "analytics", "/vat-reports", "reports"),
  p("pg.bills", "Bills", "analytics", "/bills", "bills"),
  p("pg.violations", "Violations", "analytics", "/violations", "bills"),
  p("pg.company", "Company Profile", "analytics", "/company-profile", "reports"),

  r("rt.sales", "/api/sales", "analytics", "GET /api/sales", "sales"),
  r("rt.financial", "/api/financial", "analytics", "GET /api/financial", "reports"),
  r("rt.invoices", "/api/invoices", "analytics", "GET|POST /api/invoices", "reports"),
  r("rt.bills", "/api/bills", "analytics", "GET|POST|PATCH /api/bills", "bills"),
  r("rt.dashboard", "/api/dashboard", "analytics", "GET /api/dashboard", "dashboard"),
  r("rt.company", "/api/company-profile", "analytics", "GET|POST /api/company-profile", "reports"),

  s("st.bills", "Shop bills CRUD", "analytics"),
  s("st.invoices", "Invoice CRUD + ZATCA", "analytics"),
  s("st.company", "Company profile CRUD", "analytics"),

  t("tb.bills", "shop_bills", "analytics"),
  t("tb.invoices", "invoices", "analytics"),
  t("tb.company", "company_profiles", "analytics"),
  t("tb.violations", "violations", "analytics"),

  // ===== MARKETING =====
  p("pg.marketing", "Marketing Tools", "marketing", "/marketing", "marketing"),

  r("rt.discounts", "/api/marketing/discount-codes", "marketing", "GET|POST|DELETE", "marketing"),
  r("rt.broadcast", "/api/marketing/broadcast-templates", "marketing", "GET|POST|DELETE", "marketing"),
  r("rt.poster", "/api/marketing/poster-pdf", "marketing", "POST /api/marketing/poster-pdf", "marketing"),

  s("st.marketing", "Discount + broadcast CRUD", "marketing"),

  t("tb.discounts", "marketing_discount_codes", "marketing"),
  t("tb.broadcast", "marketing_broadcast_templates", "marketing"),

  // ===== SYSTEM =====
  p("pg.settings", "Settings", "system", "/settings", "settings"),
  p("pg.printers", "Printers", "system", "/printer-settings", "settings"),
  p("pg.employees", "Employees", "system", "/employees", "users"),
  p("pg.activity", "Activity Log", "system", "/activity-log", "users"),
  p("pg.chat", "Team Chat", "system", "/chat", "public"),
  p("pg.support", "Support Tickets", "system", "/support", "public"),

  r("rt.settings", "/api/settings", "system", "GET|PATCH /api/settings", "settings"),
  r("rt.users", "/api/users", "system", "GET|POST|PATCH /api/users", "users"),
  r("rt.activity", "/api/activity-log", "system", "GET /api/activity-log", "users"),
  r("rt.chat", "/api/chat", "system", "GET|POST /api/chat", "public"),
  r("rt.support", "/api/support-tickets", "system", "GET|POST|PATCH /api/support-tickets", "public"),
  r("rt.auth", "/api/auth", "system", "POST /api/auth/login,signup,logout", "public"),

  s("st.settings", "Settings CRUD", "system"),
  s("st.users", "Sub-account CRUD + permissions", "system"),
  s("st.activity", "Activity log writer", "system"),
  s("st.chat", "Chat + DMs", "system"),
  s("st.support", "Tickets + messages", "system"),

  t("tb.restaurants", "restaurants", "system"),
  t("tb.users", "users (sub-accounts)", "system"),
  t("tb.settings", "settings", "system"),
  t("tb.activity", "activity_log", "system"),
  t("tb.chat", "chat_messages / channels", "system"),
  t("tb.tickets", "support_tickets", "system"),
  t("tb.sessions", "session (pg)", "system"),

  // ===== IT (cross-tenant) =====
  p("pg.itdash", "IT Dashboard", "it", "/it-dashboard", "it-only"),
  p("pg.perf", "Performance", "it", "/performance", "it-only"),
  p("pg.itaccts", "IT Account Mgmt", "it", "/it-account-management", "it-only"),
  p("pg.bizmgmt", "Business Mgmt", "it", "/business-management", "it-only"),
  p("pg.zatca", "ZATCA Settings", "it", "/zatca-settings", "it-only"),
  p("pg.inspect", "Inspection Tools", "it", "/inspection-tools", "it-only"),
  p("pg.diagram", "App Diagram (this page)", "it", "/app-diagram", "it-only"),

  r("rt.itdash", "/api/it/dashboard", "it", "GET /api/it/*", "it-only"),
  r("rt.inspect", "/api/it/inspection/*", "it", "health|schema|sessions|routes|test-endpoint", "it-only"),
  r("rt.diagram", "/api/it/app-diagram/*", "it", "graph + pdf", "it-only"),
  r("rt.zatca", "/api/it/zatca/*", "it", "CSID + clearance + reporting", "it-only"),

  // ===== EXTERNAL =====
  x("ex.pg", "AWS RDS PostgreSQL"),
  x("ex.zatca", "ZATCA Phase 2 API"),
  x("ex.geidea", "Geidea Payments"),
  x("ex.resend", "Resend Email"),
  x("ex.wa", "WhatsApp (wa.me)"),
  x("ex.puppeteer", "Puppeteer (PDF)"),
];

const E = (from: string, to: string, kind: AppEdge["kind"] = "calls"): AppEdge => ({ from, to, kind });

export const APP_EDGES: AppEdge[] = [
  // Operations
  E("pg.pos", "rt.orders"), E("pg.orders", "rt.orders"), E("pg.kitchen", "rt.orders"),
  E("rt.orders", "st.orders", "uses"), E("st.orders", "tb.orders", "writes"), E("st.orders", "tb.orderItems", "writes"),
  E("st.orders", "tb.menu", "reads"), E("st.orders", "tb.inventory", "writes"),
  E("pg.mealsubs", "rt.mealsubs"), E("rt.mealsubs", "st.mealsubs", "uses"), E("st.mealsubs", "tb.mealsubs", "writes"),
  E("pg.catering", "rt.catering"), E("rt.catering", "st.catering", "uses"), E("st.catering", "tb.catering", "writes"),
  E("pg.delivery", "rt.delivery"),

  // Management
  E("pg.inventory", "rt.inventory"), E("rt.inventory", "st.inventory", "uses"), E("st.inventory", "tb.inventory", "writes"),
  E("pg.menu", "rt.menu"), E("rt.menu", "st.menu", "uses"), E("st.menu", "tb.menu", "writes"),
  E("pg.recipes", "rt.recipes"), E("rt.recipes", "st.recipes", "uses"), E("st.recipes", "tb.recipes", "writes"),
  E("st.recipes", "tb.inventory", "reads"),
  E("pg.customers", "rt.customers"), E("rt.customers", "st.customers", "uses"), E("st.customers", "tb.customers", "writes"),
  E("pg.branches", "rt.branches"), E("rt.branches", "st.branches", "uses"), E("st.branches", "tb.branches", "writes"),
  E("pg.procurement", "rt.procurement"), E("rt.procurement", "st.procurement", "uses"),
  E("st.procurement", "tb.procurement", "writes"), E("st.procurement", "tb.bills", "writes"),
  E("st.procurement", "tb.inventory", "writes"),
  E("pg.licenses", "rt.licenses"), E("rt.licenses", "tb.licenses", "writes"),

  // Analytics
  E("pg.dashboard", "rt.dashboard"), E("rt.dashboard", "tb.orders", "reads"), E("rt.dashboard", "tb.bills", "reads"),
  E("pg.sales", "rt.sales"), E("rt.sales", "tb.orders", "reads"),
  E("pg.financial", "rt.financial"), E("rt.financial", "tb.orders", "reads"), E("rt.financial", "tb.bills", "reads"),
  E("pg.invoices", "rt.invoices"), E("rt.invoices", "st.invoices", "uses"), E("st.invoices", "tb.invoices", "writes"),
  E("pg.bills", "rt.bills"), E("rt.bills", "st.bills", "uses"), E("st.bills", "tb.bills", "writes"),
  E("pg.violations", "rt.bills"), E("rt.bills", "tb.violations", "writes"),
  E("pg.company", "rt.company"), E("rt.company", "st.company", "uses"), E("st.company", "tb.company", "writes"),
  E("pg.profitability", "rt.financial"),
  E("pg.vat", "rt.invoices"),

  // Marketing
  E("pg.marketing", "rt.discounts"), E("pg.marketing", "rt.broadcast"), E("pg.marketing", "rt.poster"),
  E("rt.discounts", "st.marketing", "uses"), E("rt.broadcast", "st.marketing", "uses"),
  E("st.marketing", "tb.discounts", "writes"), E("st.marketing", "tb.broadcast", "writes"),
  E("rt.poster", "ex.puppeteer", "uses"),

  // System
  E("pg.settings", "rt.settings"), E("rt.settings", "st.settings", "uses"), E("st.settings", "tb.settings", "writes"),
  E("pg.printers", "rt.settings"),
  E("pg.employees", "rt.users"), E("rt.users", "st.users", "uses"), E("st.users", "tb.users", "writes"),
  E("pg.activity", "rt.activity"), E("rt.activity", "tb.activity", "reads"),
  E("pg.chat", "rt.chat"), E("rt.chat", "st.chat", "uses"), E("st.chat", "tb.chat", "writes"),
  E("pg.support", "rt.support"), E("rt.support", "st.support", "uses"), E("st.support", "tb.tickets", "writes"),
  E("rt.auth", "tb.users", "reads"), E("rt.auth", "tb.restaurants", "reads"), E("rt.auth", "tb.sessions", "writes"),

  // IT
  E("pg.itdash", "rt.itdash"), E("pg.perf", "rt.itdash"), E("pg.itaccts", "rt.itdash"),
  E("pg.bizmgmt", "rt.itdash"), E("pg.inspect", "rt.inspect"), E("pg.diagram", "rt.diagram"),
  E("pg.zatca", "rt.zatca"),
  E("rt.itdash", "tb.restaurants", "reads"), E("rt.itdash", "tb.users", "reads"),
  E("rt.inspect", "tb.sessions", "reads"),
  E("rt.zatca", "ex.zatca", "calls"),

  // External infrastructure
  E("tb.orders", "ex.pg", "uses"), E("tb.menu", "ex.pg", "uses"), E("tb.inventory", "ex.pg", "uses"),
  E("tb.restaurants", "ex.pg", "uses"), E("tb.invoices", "ex.pg", "uses"),
  E("st.invoices", "ex.zatca", "calls"), E("st.invoices", "ex.puppeteer", "uses"),
  E("rt.auth", "ex.geidea", "calls"), E("rt.invoices", "ex.resend", "calls"),
  E("rt.catering", "ex.wa", "uses"), E("rt.invoices", "ex.wa", "uses"),
];

export interface LiveRoute {
  method: string;
  path: string;
}

export interface AppGraph {
  nodes: AppNode[];
  edges: AppEdge[];
  generatedAt: string;
  routeCount?: number;
  liveRoutes?: LiveRoute[];
  staleCuratedRoutes?: string[]; // curated route ids whose path was not found in live routes
  uncuratedLiveRoutes?: number;  // count of live routes not represented in the curated graph
}

// Normalize a route path for matching: lowercase, strip trailing slash, collapse :params to *.
function normalizePath(p: string): string {
  return (p || "").toLowerCase().replace(/\/+$/, "").replace(/:[^/]+/g, "*");
}

// Build the graph. When liveRoutes is supplied, route nodes are augmented with
// live data: methods detected on the same path are attached to the node's
// meta.path label, stale curated routes are flagged, and live routes with no
// curated counterpart are synthesized as extra nodes in the "system" domain
// so the diagram reflects the real codebase.
export function buildAppGraph(routeCount?: number, liveRoutes?: LiveRoute[]): AppGraph {
  const nodes: AppNode[] = APP_NODES.map((n) => ({ ...n, meta: { ...n.meta } }));
  const edges: AppEdge[] = [...APP_EDGES];

  let staleCuratedRoutes: string[] = [];
  let uncuratedLiveRoutes = 0;

  if (liveRoutes && liveRoutes.length) {
    // Index live routes by normalized path prefix for fuzzy matching.
    const liveByPath = new Map<string, Set<string>>(); // normPath -> methods
    for (const r of liveRoutes) {
      const np = normalizePath(r.path);
      if (!liveByPath.has(np)) liveByPath.set(np, new Set());
      liveByPath.get(np)!.add(r.method.toUpperCase());
    }

    // Build a set of all curated route prefixes for "is this live route covered?" check.
    const curatedPrefixes: { id: string; prefix: string }[] = [];
    for (const n of nodes) {
      if (n.kind !== "route") continue;
      const raw = n.meta?.path || n.label;
      // Curated path often looks like "/api/foo" or "GET|POST /api/foo" or "/api/foo/*"
      const m = String(raw).match(/\/api\/[a-z0-9/*_-]+/i);
      const prefix = m ? normalizePath(m[0].replace(/\/\*$/, "")) : normalizePath(n.label);
      curatedPrefixes.push({ id: n.id, prefix });
    }

    // Mark curated routes with matching live methods (or flag stale).
    for (const cp of curatedPrefixes) {
      let matchedMethods = new Set<string>();
      for (const [np, methods] of liveByPath) {
        if (np === cp.prefix || np.startsWith(cp.prefix + "/")) {
          methods.forEach((m) => matchedMethods.add(m));
        }
      }
      const node = nodes.find((n) => n.id === cp.id)!;
      if (matchedMethods.size === 0) {
        staleCuratedRoutes.push(cp.id);
        node.meta = { ...node.meta, permission: (node.meta?.permission || "") + " [STALE]" };
      } else {
        const methodsStr = Array.from(matchedMethods).sort().join("|");
        node.meta = { ...node.meta, path: `${methodsStr} ${cp.prefix}` };
      }
    }

    // Count live routes that don't fall under any curated prefix.
    for (const [np] of liveByPath) {
      const covered = curatedPrefixes.some((cp) => np === cp.prefix || np.startsWith(cp.prefix + "/"));
      if (!covered) uncuratedLiveRoutes += 1;
    }
  }

  return {
    nodes,
    edges,
    generatedAt: new Date().toISOString(),
    routeCount,
    liveRoutes,
    staleCuratedRoutes,
    uncuratedLiveRoutes,
  };
}

// ===== Layered layout for SVG rendering =====
// Lanes: pages | routes | storage | tables | external
// Within each lane, group by domain order.

const KIND_LANE: Record<NodeKind, number> = {
  page: 0,
  route: 1,
  storage: 2,
  table: 3,
  external: 4,
};

const DOMAIN_ORDER: Domain[] = ["operations", "management", "analytics", "marketing", "system", "it", "external"];

export interface LaidOutNode extends AppNode {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LayoutResult {
  nodes: LaidOutNode[];
  width: number;
  height: number;
}

export function layoutAppGraph(graph: AppGraph): LayoutResult {
  const LANE_W = 240;
  const LANE_GAP = 60;
  const NODE_W = 200;
  const NODE_H = 44;
  const ROW_GAP = 12;
  const DOMAIN_GAP = 28;
  const PAD = 80;

  // Group nodes by lane then by domain
  const byLane = new Map<number, AppNode[]>();
  for (const n of graph.nodes) {
    const lane = KIND_LANE[n.kind];
    if (!byLane.has(lane)) byLane.set(lane, []);
    byLane.get(lane)!.push(n);
  }

  const laid: LaidOutNode[] = [];
  let maxY = 0;
  for (const [lane, nodes] of byLane) {
    nodes.sort((a, b) => {
      const da = DOMAIN_ORDER.indexOf(a.domain);
      const db = DOMAIN_ORDER.indexOf(b.domain);
      return da - db || a.label.localeCompare(b.label);
    });
    let y = PAD;
    let prevDomain: Domain | null = null;
    const x = PAD + lane * (LANE_W + LANE_GAP);
    for (const n of nodes) {
      if (prevDomain !== null && prevDomain !== n.domain) y += DOMAIN_GAP;
      laid.push({ ...n, x, y, w: NODE_W, h: NODE_H });
      y += NODE_H + ROW_GAP;
      prevDomain = n.domain;
    }
    if (y > maxY) maxY = y;
  }

  const width = PAD * 2 + 5 * LANE_W + 4 * LANE_GAP;
  const height = maxY + PAD;
  return { nodes: laid, width, height };
}

// Render a static SVG version of the graph (used for PDF export).
export function renderGraphSvg(graph: AppGraph): string {
  const layout = layoutAppGraph(graph);
  const byId = new Map(layout.nodes.map((n) => [n.id, n]));

  const laneTitles = ["Pages", "API Routes", "Storage", "DB Tables", "External"];
  const lanesSvg = laneTitles
    .map((title, i) => {
      const x = 80 + i * (240 + 60);
      return `<text x="${x + 120}" y="48" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="13" font-weight="700" fill="#475569">${title}</text>`;
    })
    .join("");

  const edgeColor = (k: AppEdge["kind"]) =>
    k === "writes" ? "#dc2626" : k === "reads" ? "#0891b2" : k === "uses" ? "#7c3aed" : "#64748b";

  const edges = graph.edges
    .map((e) => {
      const a = byId.get(e.from);
      const b = byId.get(e.to);
      if (!a || !b) return "";
      const x1 = a.x + a.w;
      const y1 = a.y + a.h / 2;
      const x2 = b.x;
      const y2 = b.y + b.h / 2;
      const cx = (x1 + x2) / 2;
      return `<path d="M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}" stroke="${edgeColor(e.kind)}" stroke-width="1" fill="none" opacity="0.45"/>`;
    })
    .join("");

  const nodes = layout.nodes
    .map((n) => {
      const c = DOMAIN_COLORS[n.domain];
      const sub = n.meta?.path || n.meta?.table || n.meta?.permission || "";
      const subText = sub
        ? `<text x="${n.x + 10}" y="${n.y + 34}" font-family="Inter,Arial,sans-serif" font-size="9" fill="${c.text}" opacity="0.75">${escapeXml(sub).slice(0, 36)}</text>`
        : "";
      return `<g>
        <rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="6" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.2"/>
        <text x="${n.x + 10}" y="${n.y + 18}" font-family="Inter,Arial,sans-serif" font-size="11" font-weight="600" fill="${c.text}">${escapeXml(n.label).slice(0, 28)}</text>
        ${subText}
      </g>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.width} ${layout.height}" width="100%">
    <rect width="100%" height="100%" fill="#ffffff"/>
    ${lanesSvg}
    ${edges}
    ${nodes}
  </svg>`;
}

function escapeXml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]!));
}

export function renderAppDiagramHtml(graph: AppGraph): string {
  const svg = renderGraphSvg(graph);
  const legend = DOMAIN_ORDER.map((d) => {
    const c = DOMAIN_COLORS[d];
    return `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:14px;font-size:9pt"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${c.fill};border:1px solid ${c.stroke}"></span>${d}</span>`;
  }).join("");
  const stats = `${graph.nodes.length} nodes · ${graph.edges.length} edges${graph.routeCount ? ` · ${graph.routeCount} live routes` : ""}`;
  return `<!doctype html><html><head><meta charset="utf-8"/><title>BSS App Diagram</title>
<style>
@page { size: A3 landscape; margin: 10mm; }
body { font-family: Inter, Arial, sans-serif; color: #0f172a; margin: 0; padding: 8mm; }
h1 { font-size: 18pt; margin: 0 0 2mm; }
.meta { color: #475569; font-size: 10pt; margin-bottom: 4mm; }
.legend { margin-bottom: 4mm; }
.diagram { width: 100%; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
.footer { color: #94a3b8; font-size: 8pt; margin-top: 4mm; }
</style></head><body>
<h1>BSS — Real Application Diagram</h1>
<div class="meta">${stats} · Generated ${graph.generatedAt.slice(0, 10)}</div>
<div class="legend">${legend}</div>
<div class="diagram">${svg}</div>
<div class="footer">Pages → API Routes → Storage → Database Tables → External services. Edge colors: red = writes · cyan = reads · purple = uses · grey = calls.</div>
</body></html>`;
}
