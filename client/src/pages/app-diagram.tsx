import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { InfoTip } from "@/components/ui/info-tip";
import { Badge } from "@/components/ui/badge";
import { Download, Network, Loader2, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  type AppGraph,
  type AppNode,
  type AppEdge,
  type Domain,
  type NodeKind,
  DOMAIN_COLORS,
  KIND_LABELS,
  layoutAppGraph,
} from "@shared/appGraph";

const LANE_TITLES = ["Pages", "API Routes", "Storage", "DB Tables", "External"];

export default function AppDiagram() {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [selected, setSelected] = useState<AppNode | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 0.65 });
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const { data: graph, isLoading, isError, error, refetch } = useQuery<AppGraph>({
    queryKey: ["/api/it/app-diagram/graph"],
  });

  const layout = useMemo(() => (graph ? layoutAppGraph(graph) : null), [graph]);

  // Set of node ids connected to hovered/selected (for highlight)
  const focusId = selected?.id || hovered;
  const connected = useMemo(() => {
    if (!focusId || !graph) return new Set<string>();
    const s = new Set<string>([focusId]);
    for (const e of graph.edges) {
      if (e.from === focusId) s.add(e.to);
      if (e.to === focusId) s.add(e.from);
    }
    return s;
  }, [focusId, graph]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/it/app-diagram/pdf", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bss-app-diagram-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast({ title: "Download failed", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setTransform((t) => {
      const newK = Math.min(2, Math.max(0.2, t.k + delta));
      return { ...t, k: newK };
    });
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox: transform.x, oy: transform.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setTransform((t) => ({ ...t, x: dragRef.current!.ox + dx, y: dragRef.current!.oy + dy }));
  };
  const handleMouseUp = () => { dragRef.current = null; };

  const fitToView = () => {
    if (!layout || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const k = Math.min(rect.width / layout.width, rect.height / layout.height) * 0.95;
    setTransform({ x: (rect.width - layout.width * k) / 2, y: (rect.height - layout.height * k) / 2, k });
  };

  useEffect(() => { if (layout) fitToView(); /* eslint-disable-next-line */ }, [layout]);

  // Non-passive wheel handler so preventDefault works without React warnings
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      setTransform((t) => ({ ...t, k: Math.min(2, Math.max(0.2, t.k + delta)) }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const edgeColor = (k: AppEdge["kind"]) =>
    k === "writes" ? "#dc2626" : k === "reads" ? "#0891b2" : k === "uses" ? "#7c3aed" : "#64748b";

  return (
    <TooltipProvider delayDuration={150}>
    <div className="container mx-auto p-6 space-y-4" data-testid="page-app-diagram">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Network className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">App Diagram</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Real BSS structure: pages → API routes → storage methods → database tables → external services
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Zoom in" onClick={() => setTransform((t) => ({ ...t, k: Math.min(2, t.k + 0.15) }))} data-testid="button-zoom-in">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom in</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Zoom out" onClick={() => setTransform((t) => ({ ...t, k: Math.max(0.2, t.k - 0.15) }))} data-testid="button-zoom-out">
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom out</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Fit to view" onClick={fitToView} data-testid="button-fit">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fit to view</TooltipContent>
          </Tooltip>
          <Button onClick={handleDownload} disabled={downloading} data-testid="button-download-pdf">
            {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Download PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-base">Architecture Graph<InfoTip>Interactive map of pages, API routes, storage, tables, and external services.</InfoTip></CardTitle>
          {graph && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap" data-testid="text-graph-stats">
              <span>{graph.nodes.length} nodes</span>
              <span>·</span>
              <span>{graph.edges.length} edges</span>
              {graph.routeCount ? (<><span>·</span><span data-testid="text-live-routes">{graph.routeCount} live routes</span></>) : null}
              {graph.staleCuratedRoutes && graph.staleCuratedRoutes.length > 0 && (
                <Badge variant="outline" className="text-xs" style={{ color: "#dc2626", borderColor: "#fecaca" }} data-testid="badge-stale-routes">
                  {graph.staleCuratedRoutes.length} stale
                </Badge>
              )}
              {graph.uncuratedLiveRoutes ? (
                <Badge variant="outline" className="text-xs" data-testid="badge-uncurated-routes">
                  {graph.uncuratedLiveRoutes} uncurated
                </Badge>
              ) : null}
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-wrap gap-2 px-4 py-2 border-b">
            {(Object.keys(DOMAIN_COLORS) as Domain[]).map((d) => {
              const c = DOMAIN_COLORS[d];
              return (
                <Badge key={d} variant="outline" style={{ background: c.fill, borderColor: c.stroke, color: c.text }} data-testid={`badge-domain-${d}`}>
                  {d}
                </Badge>
              );
            })}
            <span className="text-xs text-muted-foreground ml-auto">
              <span style={{ color: "#dc2626" }}>writes</span> · <span style={{ color: "#0891b2" }}>reads</span> · <span style={{ color: "#7c3aed" }}>uses</span> · <span style={{ color: "#64748b" }}>calls</span>
            </span>
          </div>

          <div className="relative bg-white dark:bg-neutral-50" style={{ height: 640 }}>
            {isError ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3" data-testid="state-graph-error">
                <div className="text-sm">Failed to load graph: {(error as any)?.message || "unknown error"}</div>
                <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-retry-graph">Retry</Button>
              </div>
            ) : isLoading || !layout ? (
              <div className="flex items-center justify-center h-full text-muted-foreground" data-testid="state-graph-loading">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading graph…
              </div>
            ) : (
              <svg
                ref={svgRef}
                width="100%"
                height="100%"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: dragRef.current ? "grabbing" : "grab" }}
                data-testid="svg-app-graph"
              >
                <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
                  {LANE_TITLES.map((t, i) => (
                    <text
                      key={t}
                      x={80 + i * (240 + 60) + 120}
                      y={50}
                      textAnchor="middle"
                      fontSize="14"
                      fontWeight={700}
                      fill="#475569"
                    >
                      {t}
                    </text>
                  ))}

                  {/* Edges */}
                  {graph!.edges.map((e, i) => {
                    const a = layout.nodes.find((n) => n.id === e.from);
                    const b = layout.nodes.find((n) => n.id === e.to);
                    if (!a || !b) return null;
                    const x1 = a.x + a.w, y1 = a.y + a.h / 2;
                    const x2 = b.x,        y2 = b.y + b.h / 2;
                    const cx = (x1 + x2) / 2;
                    const isFocus = !focusId || connected.has(a.id) && connected.has(b.id);
                    return (
                      <path
                        key={i}
                        d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                        stroke={edgeColor(e.kind)}
                        strokeWidth={isFocus ? 1.5 : 0.8}
                        fill="none"
                        opacity={focusId ? (isFocus ? 0.9 : 0.08) : 0.35}
                      />
                    );
                  })}

                  {/* Nodes */}
                  {layout.nodes.map((n) => {
                    const c = DOMAIN_COLORS[n.domain];
                    const sub = n.meta?.path || n.meta?.table || n.meta?.permission || "";
                    const isFocus = !focusId || connected.has(n.id);
                    const isSelected = selected?.id === n.id;
                    return (
                      <g
                        key={n.id}
                        onClick={(e) => { e.stopPropagation(); setSelected(n); }}
                        onMouseEnter={() => setHovered(n.id)}
                        onMouseLeave={() => setHovered(null)}
                        style={{ cursor: "pointer" }}
                        opacity={isFocus ? 1 : 0.25}
                        data-testid={`node-${n.id}`}
                      >
                        <rect
                          x={n.x} y={n.y} width={n.w} height={n.h}
                          rx={6}
                          fill={c.fill}
                          stroke={isSelected ? "#0f172a" : c.stroke}
                          strokeWidth={isSelected ? 2.5 : 1.2}
                        />
                        <text x={n.x + 10} y={n.y + 18} fontSize="11" fontWeight={600} fill={c.text}>
                          {n.label.length > 28 ? n.label.slice(0, 27) + "…" : n.label}
                        </text>
                        {sub && (
                          <text x={n.x + 10} y={n.y + 34} fontSize="9" fill={c.text} opacity={0.75}>
                            {sub.length > 36 ? sub.slice(0, 35) + "…" : sub}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              </svg>
            )}
          </div>
        </CardContent>
      </Card>

      {selected && (
        <Card data-testid="card-node-details">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge style={{ background: DOMAIN_COLORS[selected.domain].fill, borderColor: DOMAIN_COLORS[selected.domain].stroke, color: DOMAIN_COLORS[selected.domain].text }}>
                {selected.domain}
              </Badge>
              <Badge variant="outline">{KIND_LABELS[selected.kind]}</Badge>
              <CardTitle className="text-base">{selected.label}</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)} data-testid="button-close-details">Close</Button>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {selected.meta?.path && <div><span className="text-muted-foreground">Path:</span> <code className="text-xs">{selected.meta.path}</code></div>}
            {selected.meta?.table && <div><span className="text-muted-foreground">Table:</span> <code className="text-xs">{selected.meta.table}</code></div>}
            {selected.meta?.permission && <div><span className="text-muted-foreground">Permission:</span> <code className="text-xs">{selected.meta.permission}</code></div>}
            {selected.meta?.file && <div><span className="text-muted-foreground">File:</span> <code className="text-xs">{selected.meta.file}</code></div>}
            {graph && (
              <div className="pt-2">
                <div className="text-muted-foreground text-xs mb-1">Connections:</div>
                <div className="flex flex-wrap gap-1">
                  {graph.edges.filter((e) => e.from === selected.id || e.to === selected.id).map((e, i) => {
                    const otherId = e.from === selected.id ? e.to : e.from;
                    const other = graph.nodes.find((n) => n.id === otherId);
                    if (!other) return null;
                    const arrow = e.from === selected.id ? "→" : "←";
                    return (
                      <Badge key={i} variant="outline" className="text-xs cursor-pointer" onClick={() => setSelected(other)} data-testid={`badge-conn-${otherId}`}>
                        {arrow} {other.label} <span className="text-muted-foreground ml-1">({e.kind})</span>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
    </TooltipProvider>
  );
}
