import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity, Database, Server, Network, RefreshCw, CheckCircle2,
  XCircle, AlertTriangle, Cpu, HardDrive, Clock, Search, Play, FileWarning,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { InfoTip } from "@/components/ui/info-tip";

interface Health {
  uptime: number;
  nodeVersion: string;
  platform: string;
  memory: { rssMB: number; heapUsedMB: number; heapTotalMB: number; externalMB: number };
  database: { status: string; latencyMs: number; version: string };
  responseTimeMs: number;
  timestamp: string;
}
interface SchemaTable { table: string; columns: number; rows: number }
interface SchemaResp { tables: SchemaTable[]; totalTables: number }
interface SessionsResp { total: number; active: number; expired: number }
interface RoutesResp { total: number; routes: { path: string; methods: string[] }[] }
interface TestResp { status: number; ok: boolean; latencyMs: number; bodyPreview?: string; contentType?: string; error?: string }

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
}

export default function InspectionTools() {
  const [routeFilter, setRouteFilter] = useState("");
  const [tableFilter, setTableFilter] = useState("");
  const [testMethod, setTestMethod] = useState("GET");
  const [testPath, setTestPath] = useState("/api/auth/me");
  const [testResult, setTestResult] = useState<TestResp | null>(null);
  const [consoleErrors, setConsoleErrors] = useState<{ time: string; message: string }[]>([]);

  const { data: health, isFetching: healthLoading, refetch: refetchHealth } =
    useQuery<Health>({ queryKey: ["/api/it/inspection/health"], refetchInterval: 5000 });
  const { data: schema, isFetching: schemaLoading, refetch: refetchSchema } =
    useQuery<SchemaResp>({ queryKey: ["/api/it/inspection/schema"] });
  const { data: sessions, refetch: refetchSessions } =
    useQuery<SessionsResp>({ queryKey: ["/api/it/inspection/sessions"], refetchInterval: 10000 });
  const { data: routes } =
    useQuery<RoutesResp>({ queryKey: ["/api/it/inspection/routes"] });

  const testMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/it/inspection/test-endpoint", { method: testMethod, path: testPath });
      return r.json() as Promise<TestResp>;
    },
    onSuccess: (data) => setTestResult(data),
  });

  // Browser-side console error capture
  if (typeof window !== "undefined" && !(window as any).__inspectionHooked) {
    (window as any).__inspectionHooked = true;
    const origError = console.error.bind(console);
    console.error = (...args: any[]) => {
      const msg = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ").slice(0, 500);
      setConsoleErrors((prev) => [{ time: new Date().toLocaleTimeString(), message: msg }, ...prev].slice(0, 50));
      origError(...args);
    };
    window.addEventListener("error", (e) => {
      setConsoleErrors((prev) => [{ time: new Date().toLocaleTimeString(), message: `Uncaught: ${e.message} @ ${e.filename}:${e.lineno}` }, ...prev].slice(0, 50));
    });
    window.addEventListener("unhandledrejection", (e) => {
      setConsoleErrors((prev) => [{ time: new Date().toLocaleTimeString(), message: `Unhandled rejection: ${String(e.reason)}` }, ...prev].slice(0, 50));
    });
  }

  const memPct = health ? Math.round((health.memory.heapUsedMB / health.memory.heapTotalMB) * 100) : 0;
  const filteredTables = (schema?.tables || []).filter((t) =>
    t.table.toLowerCase().includes(tableFilter.toLowerCase())
  );
  const filteredRoutes = (routes?.routes || []).filter((r) =>
    r.path.toLowerCase().includes(routeFilter.toLowerCase())
  );

  return (
    <TooltipProvider delayDuration={150}>
    <div className="container mx-auto p-6 space-y-6" data-testid="page-inspection-tools">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Inspection Tools</h1>
          <p className="text-muted-foreground mt-1">
            Diagnose bugs and errors across the entire application
          </p>
        </div>
        <Button
          onClick={() => { refetchHealth(); refetchSchema(); refetchSessions(); }}
          variant="outline"
          data-testid="button-refresh-all"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${healthLoading ? "animate-spin" : ""}`} />
          Refresh All
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview"><Activity className="h-4 w-4 mr-2" />Overview</TabsTrigger>
          <TabsTrigger value="database" data-testid="tab-database"><Database className="h-4 w-4 mr-2" />Database</TabsTrigger>
          <TabsTrigger value="api" data-testid="tab-api"><Network className="h-4 w-4 mr-2" />API Tester</TabsTrigger>
          <TabsTrigger value="errors" data-testid="tab-errors"><FileWarning className="h-4 w-4 mr-2" />Browser Errors</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Server Status<InfoTip>Indicates whether the backend server is reachable and healthy.</InfoTip></CardTitle>
                {health?.database.status === "ok" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-destructive" />}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-server-status">
                  {health ? "Online" : "Checking..."}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Response: {health?.responseTimeMs ?? "-"}ms</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Uptime<InfoTip>How long the server has been running since its last restart.</InfoTip></CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-uptime">
                  {health ? formatUptime(health.uptime) : "-"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{health?.platform} · {health?.nodeVersion}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Memory<InfoTip>Current Node.js heap memory usage on the server.</InfoTip></CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-memory">
                  {health?.memory.heapUsedMB ?? "-"} MB
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {memPct}% of {health?.memory.heapTotalMB ?? "-"} MB heap · RSS {health?.memory.rssMB ?? "-"} MB
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Database<InfoTip>Round-trip latency for a ping query to the database.</InfoTip></CardTitle>
                {health?.database.status === "ok" ? <Database className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-destructive" />}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-db-latency">
                  {health?.database.latencyMs ?? "-"}ms
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">{health?.database.version || health?.database.status}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Server className="h-5 w-5" />Active Sessions</CardTitle>
              <CardDescription>Logged-in users on the server right now</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-3xl font-bold" data-testid="text-sessions-active">{sessions?.active ?? "-"}</div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-muted-foreground" data-testid="text-sessions-expired">{sessions?.expired ?? "-"}</div>
                  <div className="text-sm text-muted-foreground">Expired</div>
                </div>
                <div>
                  <div className="text-3xl font-bold" data-testid="text-sessions-total">{sessions?.total ?? "-"}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DATABASE */}
        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Schema Inspector</CardTitle>
              <CardDescription>{schema?.totalTables ?? 0} tables in the database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter tables..."
                  value={tableFilter}
                  onChange={(e) => setTableFilter(e.target.value)}
                  className="pl-9"
                  data-testid="input-filter-tables"
                />
              </div>
              <ScrollArea className="h-[400px] border rounded-md">
                <div className="p-2 space-y-1">
                  {schemaLoading && <div className="text-sm text-muted-foreground p-4">Loading schema...</div>}
                  {filteredTables.map((t) => (
                    <div key={t.table} className="flex items-center justify-between py-2 px-3 rounded hover-elevate" data-testid={`row-table-${t.table}`}>
                      <div className="font-mono text-sm">{t.table}</div>
                      <div className="flex gap-2">
                        <Badge variant="secondary">{t.columns} cols</Badge>
                        <Badge variant={t.rows < 0 ? "destructive" : "outline"}>{t.rows < 0 ? "n/a" : `${t.rows.toLocaleString()} rows`}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API TESTER */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Network className="h-5 w-5" />API Endpoint Tester</CardTitle>
              <CardDescription>Send a request to any internal endpoint with your current session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Select value={testMethod} onValueChange={setTestMethod}>
                  <SelectTrigger className="w-32" data-testid="select-test-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={testPath}
                  onChange={(e) => setTestPath(e.target.value)}
                  placeholder="/api/..."
                  className="flex-1 font-mono"
                  data-testid="input-test-path"
                />
                <Button onClick={() => testMutation.mutate()} disabled={testMutation.isPending} data-testid="button-test-send">
                  <Play className="h-4 w-4 mr-2" />Send
                </Button>
              </div>

              {testResult && (
                <div className="border rounded-md p-4 space-y-2" data-testid="result-test">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={testResult.ok ? "default" : "destructive"}>
                      Status {testResult.status}
                    </Badge>
                    <Badge variant="outline">{testResult.latencyMs}ms</Badge>
                    {testResult.contentType && <Badge variant="secondary">{testResult.contentType}</Badge>}
                  </div>
                  {testResult.error && <div className="text-sm text-destructive">{testResult.error}</div>}
                  {testResult.bodyPreview && (
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto whitespace-pre-wrap font-mono">{testResult.bodyPreview}</pre>
                  )}
                </div>
              )}

              <div>
                <div className="text-sm font-medium mb-2">All Registered Routes ({routes?.total ?? 0})</div>
                <div className="relative mb-2">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Filter routes..."
                    value={routeFilter}
                    onChange={(e) => setRouteFilter(e.target.value)}
                    className="pl-9"
                    data-testid="input-filter-routes"
                  />
                </div>
                <ScrollArea className="h-[300px] border rounded-md">
                  <div className="p-2 space-y-1">
                    {filteredRoutes.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => { setTestMethod(r.methods[0] || "GET"); setTestPath(r.path); }}
                        className="w-full text-left flex items-center gap-2 py-1.5 px-3 rounded hover-elevate"
                        data-testid={`row-route-${i}`}
                      >
                        <div className="flex gap-1 flex-shrink-0">
                          {r.methods.map((m) => (
                            <Badge key={m} variant="outline" className="text-xs">{m}</Badge>
                          ))}
                        </div>
                        <div className="font-mono text-xs truncate">{r.path}</div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BROWSER ERRORS */}
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileWarning className="h-5 w-5" />Browser Console Errors</CardTitle>
              <CardDescription>Errors captured since this page was opened ({consoleErrors.length})</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] border rounded-md">
                <div className="p-2 space-y-1">
                  {consoleErrors.length === 0 && (
                    <div className="text-sm text-muted-foreground p-4 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      No errors captured. Browse the app in other tabs — errors will appear here.
                    </div>
                  )}
                  {consoleErrors.map((e, i) => (
                    <div key={i} className="border rounded p-3" data-testid={`row-error-${i}`}>
                      <div className="text-xs text-muted-foreground mb-1">{e.time}</div>
                      <div className="text-sm font-mono text-destructive whitespace-pre-wrap break-words">{e.message}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </TooltipProvider>
  );
}
