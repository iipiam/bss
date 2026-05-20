export interface DiagramDef {
  id: string;
  title: string;
  description: string;
  svg: string;
}

const BOX = (x: number, y: number, w: number, h: number, fill: string, stroke: string, label: string, sub?: string) => `
  <g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" ry="8" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
    <text x="${x + w / 2}" y="${y + h / 2 + (sub ? -6 : 4)}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="600" fill="#0f172a">${label}</text>
    ${sub ? `<text x="${x + w / 2}" y="${y + h / 2 + 14}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" fill="#475569">${sub}</text>` : ""}
  </g>
`;

const ARROW = (x1: number, y1: number, x2: number, y2: number, label?: string, color = "#64748b") => {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return `
    <g>
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" marker-end="url(#arrowhead)"/>
      ${label ? `<rect x="${mx - 40}" y="${my - 10}" width="80" height="18" rx="3" fill="white" stroke="${color}" stroke-width="0.5"/><text x="${mx}" y="${my + 3}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="10" fill="#334155">${label}</text>` : ""}
    </g>
  `;
};

const DEFS = `
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#64748b"/>
    </marker>
  </defs>
`;

const archSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="100%">
  ${DEFS}
  <text x="400" y="30" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" fill="#0f172a">BSS High-Level Architecture</text>

  ${BOX(40, 70, 200, 70, "#dbeafe", "#3b82f6", "Browser Client", "React + Vite + Shadcn UI")}
  ${BOX(300, 70, 200, 70, "#dbeafe", "#3b82f6", "i18n Layer", "10 languages, RTL support")}
  ${BOX(560, 70, 200, 70, "#dbeafe", "#3b82f6", "TanStack Query", "Cache + mutations")}

  ${BOX(40, 200, 720, 80, "#fef3c7", "#f59e0b", "Express.js Server", "Auth (bcrypt + sessions) · REST API · WebSocket Server · Zod validation")}

  ${BOX(40, 340, 220, 80, "#dcfce7", "#16a34a", "AWS RDS PostgreSQL", "Drizzle ORM · SSL/TLS")}
  ${BOX(290, 340, 220, 80, "#fce7f3", "#db2777", "ZATCA Phase 2 API", "CSID · Clearance · Reporting")}
  ${BOX(540, 340, 220, 80, "#ede9fe", "#7c3aed", "Geidea Payment Gateway", "Tokenization · Callbacks")}

  ${BOX(290, 450, 220, 50, "#fee2e2", "#dc2626", "Resend Email", "Transactional mail")}

  ${ARROW(140, 140, 140, 200, "HTTPS")}
  ${ARROW(400, 140, 400, 200, "HTTPS")}
  ${ARROW(660, 140, 660, 200, "WebSocket")}

  ${ARROW(150, 280, 150, 340, "node-pg")}
  ${ARROW(400, 280, 400, 340, "TLS")}
  ${ARROW(650, 280, 650, 340, "HTTPS")}
  ${ARROW(400, 420, 400, 450, "SMTP API")}
</svg>
`;

const flowSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="100%">
  ${DEFS}
  <text x="400" y="30" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" fill="#0f172a">Request / Data Flow</text>

  ${BOX(40, 70, 160, 70, "#dbeafe", "#3b82f6", "User Action", "Click / submit form")}
  ${BOX(240, 70, 160, 70, "#dbeafe", "#3b82f6", "React Query", "useQuery / useMutation")}
  ${BOX(440, 70, 160, 70, "#dbeafe", "#3b82f6", "apiRequest", "fetch + credentials")}
  ${BOX(640, 70, 130, 70, "#fef3c7", "#f59e0b", "Express Route", "/api/...")}

  ${BOX(640, 200, 130, 70, "#fef3c7", "#f59e0b", "requireAuth", "Session check")}
  ${BOX(440, 200, 160, 70, "#fef3c7", "#f59e0b", "Zod Schema", "Validate payload")}
  ${BOX(240, 200, 160, 70, "#fef3c7", "#f59e0b", "Storage Layer", "IStorage methods")}
  ${BOX(40, 200, 160, 70, "#fef3c7", "#f59e0b", "Permission Check", "RBAC + tenant")}

  ${BOX(40, 330, 160, 70, "#dcfce7", "#16a34a", "Drizzle ORM", "Type-safe queries")}
  ${BOX(240, 330, 160, 70, "#dcfce7", "#16a34a", "PostgreSQL", "Multi-tenant rows")}
  ${BOX(440, 330, 160, 70, "#dcfce7", "#16a34a", "Activity Log", "Audit trail")}
  ${BOX(640, 330, 130, 70, "#dcfce7", "#16a34a", "WebSocket", "Broadcast event")}

  ${BOX(240, 440, 320, 60, "#dbeafe", "#3b82f6", "Client Cache Invalidation", "queryClient.invalidateQueries → UI update")}

  ${ARROW(200, 105, 240, 105)}
  ${ARROW(400, 105, 440, 105)}
  ${ARROW(600, 105, 640, 105)}
  ${ARROW(705, 140, 705, 200)}
  ${ARROW(640, 235, 600, 235)}
  ${ARROW(440, 235, 400, 235)}
  ${ARROW(240, 235, 200, 235)}
  ${ARROW(120, 270, 120, 330)}
  ${ARROW(200, 365, 240, 365)}
  ${ARROW(400, 365, 440, 365)}
  ${ARROW(600, 365, 640, 365)}
  ${ARROW(400, 400, 400, 440, "response")}
</svg>
`;

const zatcaSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 540" width="100%">
  ${DEFS}
  <text x="400" y="30" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" fill="#0f172a">ZATCA + Geidea Payment Flow</text>

  <text x="200" y="60" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="700" fill="#7c3aed">Geidea Signup / Subscription</text>
  ${BOX(40, 80, 320, 55, "#ede9fe", "#7c3aed", "1. Customer enters card details", "Geidea hosted tokenization")}
  ${BOX(40, 155, 320, 55, "#ede9fe", "#7c3aed", "2. Server-to-server verify", "POST /api/payments/verify")}
  ${BOX(40, 230, 320, 55, "#ede9fe", "#7c3aed", "3. Create restaurant + subscription", "Drizzle insert · status = active")}
  ${BOX(40, 305, 320, 55, "#ede9fe", "#7c3aed", "4. Callback / receipt", "Email + redirect to dashboard")}

  <text x="600" y="60" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="700" fill="#db2777">ZATCA Phase 2 E-Invoicing</text>
  ${BOX(440, 80, 320, 55, "#fce7f3", "#db2777", "1. Generate CSR", "PKCS#10 · ECDSA P-256")}
  ${BOX(440, 155, 320, 55, "#fce7f3", "#db2777", "2. Compliance CSID + OTP", "Sandbox onboarding")}
  ${BOX(440, 230, 320, 55, "#fce7f3", "#db2777", "3. Production CSID", "Live signing certificate")}
  ${BOX(440, 305, 320, 55, "#fce7f3", "#db2777", "4. Build UBL 2.1 XML", "Invoice + line items + VAT")}
  ${BOX(440, 380, 320, 55, "#fce7f3", "#db2777", "5. XAdES-T sign + 9-tag QR", "ECDSA signature embedded")}
  ${BOX(440, 455, 320, 55, "#fce7f3", "#db2777", "6. Submit clearance / reporting", "Status tracked per invoice")}

  ${ARROW(200, 135, 200, 155)}
  ${ARROW(200, 210, 200, 230)}
  ${ARROW(200, 285, 200, 305)}

  ${ARROW(600, 135, 600, 155)}
  ${ARROW(600, 210, 600, 230)}
  ${ARROW(600, 285, 600, 305)}
  ${ARROW(600, 360, 600, 380)}
  ${ARROW(600, 435, 600, 455)}

  ${ARROW(360, 332, 440, 332, "POS sale")}
</svg>
`;

export const APP_DIAGRAMS: DiagramDef[] = [
  {
    id: "architecture",
    title: "High-Level Architecture",
    description: "Top-level modules: frontend, backend, database, and external services.",
    svg: archSvg,
  },
  {
    id: "data-flow",
    title: "Request / Data Flow",
    description: "How a user action travels from React through Express, validation, storage, and back.",
    svg: flowSvg,
  },
  {
    id: "zatca-geidea",
    title: "ZATCA + Geidea Payment Flow",
    description: "Signup payment via Geidea and ZATCA Phase 2 e-invoicing lifecycle.",
    svg: zatcaSvg,
  },
];

export function renderAppDiagramHtml(): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>BSS App Diagram</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Inter', Arial, sans-serif; color: #0f172a; margin: 0; }
  .page { page-break-after: always; padding: 4mm; }
  .page:last-child { page-break-after: auto; }
  h1 { font-size: 22pt; margin: 0 0 4mm; }
  p.desc { color: #475569; font-size: 11pt; margin: 0 0 6mm; }
  .diagram { width: 100%; }
  .footer { font-size: 9pt; color: #94a3b8; margin-top: 4mm; }
</style>
</head>
<body>
${APP_DIAGRAMS.map(
  (d, i) => `
  <div class="page">
    <h1>${i + 1}. ${d.title}</h1>
    <p class="desc">${d.description}</p>
    <div class="diagram">${d.svg}</div>
    <div class="footer">BSS — BlindSpot System · Generated ${new Date().toISOString().slice(0, 10)}</div>
  </div>`,
).join("")}
</body>
</html>`;
}
