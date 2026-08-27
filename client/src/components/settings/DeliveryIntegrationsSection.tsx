import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Activity, Clipboard, Copy, Plug, Save } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type Provider = { name: string; credentialFields: string[] };
type Integration = {
  id: string; provider: string; enabled: boolean; connectionStatus: Status; connectionMessage?: string;
  credentials: Record<string, string | undefined>; webhookUrl: string; config: IntegrationConfig;
  lastReceivedAt?: string; lastSuccessAt?: string; lastError?: string;
};
type Status = "not connected" | "connected" | "error" | "unavailable" | "untested";
type IntegrationConfig = Record<string, any>;
type Form = { enabled: boolean; apiKey: string; apiSecret: string; webhookSecret: string; merchantId: string; config: IntegrationConfig };

const defaultMapping = {
  eventId: "eventId", eventType: "eventType", orderId: "order.id", status: "order.status",
  items: "order.items", itemId: "id", itemName: "name", itemQuantity: "quantity", itemUnitPrice: "unitPrice",
  subtotal: "order.subtotal", vat: "order.vat", total: "order.total", customerName: "order.customer.name",
  customerPhone: "order.customer.phone", address: "order.customer.address", fee: "order.fee",
  commission: "order.commission", net: "order.net",
};
const defaultConfig = (): IntegrationConfig => ({
  apiKeyHeader: "authorization", apiKeyPrefix: "Bearer ",
  apiSecretHeader: "x-api-secret", merchantIdHeader: "x-merchant-id",
  signatureHeader: "x-delivery-signature", eventIdHeader: "x-delivery-event-id", signatureEncoding: "hex",
  signaturePrefix: "", silentAfterMinutes: 120, mapping: defaultMapping,
});
const labels: Record<string, { label: string; help: string; type?: string }> = {
  apiKey: { label: "API key", help: "Ask the platform for the production API access key." },
  apiSecret: { label: "API secret", help: "Ask the platform for the API secret paired with your key." },
  webhookSecret: { label: "Webhook signing secret", help: "Ask for the webhook HMAC/signing secret (at least 16 characters)." },
  merchantId: { label: "Merchant / store ID", help: "Ask for your merchant, branch, or store identifier." },
};
const statusStyle: Record<string, string> = {
  connected: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  error: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  unavailable: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  untested: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  "not connected": "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
};

function formFor(integration?: Integration): Form {
  return {
    enabled: integration?.enabled ?? false, apiKey: "", apiSecret: "", webhookSecret: "", merchantId: "",
    config: { ...defaultConfig(), ...(integration?.config || {}), mapping: { ...defaultMapping, ...(integration?.config?.mapping || {}) } },
  };
}

export function DeliveryIntegrationsSection() {
  const { toast } = useToast();
  const { data: providers = {}, isLoading } = useQuery<Record<string, Provider>>({ queryKey: ["/api/delivery-integrations/providers"] });
  const { data: integrations = [] } = useQuery<Integration[]>({ queryKey: ["/api/delivery-integrations"] });
  const { data: health = [] } = useQuery<any[]>({ queryKey: ["/api/delivery-integrations/health"] });
  const { data: events = [] } = useQuery<any[]>({ queryKey: ["/api/delivery-integrations/events"] });
  const { data: alerts = [] } = useQuery<any[]>({ queryKey: ["/api/delivery-integrations/alerts"] });
  const { data: reconciliation = [] } = useQuery<any[]>({ queryKey: ["/api/delivery-integrations/reconciliation"] });
  const [forms, setForms] = useState<Record<string, Form>>({});
  const [mappingText, setMappingText] = useState<Record<string, string>>({});

  useEffect(() => {
    setForms(Object.fromEntries(Object.keys(providers).map(provider => [provider, formFor(integrations.find(i => i.provider === provider))])));
    setMappingText(Object.fromEntries(Object.keys(providers).map(provider => {
      const integration = integrations.find(i => i.provider === provider);
      return [provider, JSON.stringify(integration?.config?.mapping || defaultMapping, null, 2)];
    })));
  }, [providers, integrations]);

  const refresh = () => ["/api/delivery-integrations", "/api/delivery-integrations/health", "/api/delivery-integrations/events", "/api/delivery-integrations/alerts", "/api/delivery-integrations/reconciliation"]
    .forEach(queryKey => queryClient.invalidateQueries({ queryKey: [queryKey] }));
  const save = useMutation({
    mutationFn: async ({ provider, form }: { provider: string; form: Form }) => {
      const changedCredentials = Object.values({ apiKey: form.apiKey, apiSecret: form.apiSecret, webhookSecret: form.webhookSecret, merchantId: form.merchantId }).some(Boolean);
      let mapping: Record<string, string>;
      try { mapping = JSON.parse(mappingText[provider] || "{}"); } catch { throw new Error("Payload mapping must be valid JSON."); }
      if (changedCredentials && ![form.apiKey, form.apiSecret, form.webhookSecret, form.merchantId].every(Boolean)) {
        throw new Error("For security, replace all four credentials together; saved credentials cannot be read back.");
      }
      await apiRequest("PUT", `/api/delivery-integrations/${provider}`, {
        enabled: form.enabled, ...(changedCredentials ? { credentials: Object.fromEntries(Object.entries({ apiKey: form.apiKey, apiSecret: form.apiSecret, webhookSecret: form.webhookSecret, merchantId: form.merchantId }).filter(([, value]) => value)) } : {}),
        config: { ...form.config, mapping },
      });
    },
    onSuccess: () => { refresh(); toast({ title: "Integration saved", description: "Credentials remain masked after saving." }); },
    onError: (error: Error) => toast({ title: "Could not save integration", description: error.message, variant: "destructive" }),
  });
  const test = useMutation({
    mutationFn: (provider: string) => apiRequest("POST", `/api/delivery-integrations/${provider}/test`),
    onSuccess: () => { refresh(); toast({ title: "Connection test completed" }); },
    onError: (error: Error) => { refresh(); toast({ title: "Connection test failed", description: error.message, variant: "destructive" }); },
  });
  const update = (provider: string, patch: Partial<Form>) => setForms(old => ({ ...old, [provider]: { ...old[provider], ...patch } }));
  const copy = async (url: string) => {
    try { await navigator.clipboard.writeText(url); toast({ title: "Webhook URL copied" }); }
    catch { toast({ title: "Copy failed", description: "Select and copy the URL manually.", variant: "destructive" }); }
  };

  if (isLoading) return null;
  return <section className="space-y-4" dir="auto">
    <div><h2 className="text-xl font-semibold">Delivery Integrations</h2><p className="text-sm text-muted-foreground">Connect delivery platforms without exposing credentials or mixing delivery failures with invoicing.</p></div>
    {Object.entries(providers).map(([provider, metadata]) => {
      const integration = integrations.find(item => item.provider === provider);
      const form = forms[provider] || formFor(integration);
      const currentStatus: Status = integration?.connectionStatus || "not connected";
      const providerHealth = health.find(item => item.provider === provider);
      const providerEvents = events.filter(item => item.provider === provider).slice(0, 5);
      const providerAlerts = alerts.filter(item => item.integrationId === integration?.id);
      const totals = reconciliation.find(item => item.provider === provider);
      return <Card key={provider} data-testid={`delivery-integration-${provider}`}>
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><CardTitle>{metadata.name}</CardTitle><CardDescription>Direct order webhook and optional outbound status sync.</CardDescription></div>
            <Badge className={statusStyle[currentStatus]}>{currentStatus}</Badge>
          </div>
          {integration?.connectionMessage && <p className="text-xs text-muted-foreground">{integration.connectionMessage}</p>}
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-md border p-3"><div><Label htmlFor={`${provider}-enabled`}>Enable {metadata.name}</Label><p className="text-xs text-muted-foreground">Only enabled integrations accept webhook orders.</p></div><Switch id={`${provider}-enabled`} checked={form.enabled} onCheckedChange={enabled => update(provider, { enabled })} /></div>
          <div className="grid gap-4 md:grid-cols-2">
            {metadata.credentialFields.map(field => <div className="space-y-1.5" key={field}><Label htmlFor={`${provider}-${field}`}>{labels[field]?.label || field}</Label><Input id={`${provider}-${field}`} type="password" autoComplete="new-password" value={(form as any)[field]} placeholder={integration?.credentials?.[field] ? `${integration.credentials[field]} — enter to replace` : `Enter ${labels[field]?.label || field}`} onChange={e => update(provider, { [field]: e.target.value } as Partial<Form>)} /><p className="text-xs text-muted-foreground">{labels[field]?.help}</p></div>)}
          </div>
          <p className="text-xs text-muted-foreground">Saved values are masked and never returned in full. Leave replacement fields blank to keep saved credentials; if changing them, obtain a fresh signing secret from the platform.</p>
          <div className="rounded-md bg-muted/50 p-3 text-sm"><strong>Platform request checklist:</strong> Ask {metadata.name} support for production API credentials, your merchant/store ID, the webhook HMAC signing secret, and their webhook event schema. Ask them to send order-created and order-status events to the URL below, with a unique event ID header. Confirm the signature header and encoding before enabling.</div>
          {integration?.webhookUrl && <div className="space-y-1.5"><Label>Generated webhook URL</Label><div className="flex gap-2"><Input readOnly value={integration.webhookUrl} dir="ltr" /><Button type="button" variant="outline" size="icon" onClick={() => copy(integration.webhookUrl)} aria-label="Copy webhook URL"><Copy className="h-4 w-4" /></Button></div></div>}
          <Collapsible><CollapsibleTrigger asChild><Button type="button" variant="outline" size="sm"><Clipboard className="mr-2 h-4 w-4" />Advanced provider configuration & payload mapping</Button></CollapsibleTrigger><CollapsibleContent className="mt-4 space-y-4 rounded-md border p-4">
            <p className="text-xs text-muted-foreground">Vendor endpoints and payload names vary. These fields are intentionally explicit; no undocumented provider endpoint is assumed.</p>
            <div className="grid gap-3 md:grid-cols-2">{["apiBaseUrl", "testPath", "statusPathTemplate", "apiKeyHeader", "apiKeyPrefix", "apiSecretHeader", "merchantIdHeader", "signatureHeader", "eventIdHeader", "signaturePrefix", "silentAfterMinutes"].map(key => <div className="space-y-1" key={key}><Label htmlFor={`${provider}-${key}`}>{key}</Label><Input id={`${provider}-${key}`} value={form.config[key] ?? ""} placeholder={key === "signatureHeader" ? "x-delivery-signature" : undefined} onChange={e => update(provider, { config: { ...form.config, [key]: key === "silentAfterMinutes" ? Number(e.target.value || 120) : e.target.value } })} /></div>)}</div>
            <div className="space-y-1"><Label htmlFor={`${provider}-mapping`}>Payload mapping (JSON)</Label><Textarea id={`${provider}-mapping`} className="min-h-52 font-mono text-xs" value={mappingText[provider] || ""} onChange={e => setMappingText(old => ({ ...old, [provider]: e.target.value }))} /><p className="text-xs text-muted-foreground">Defaults match the backend’s generic event/order mapping. Replace paths only using the platform’s documented payload.</p></div>
          </CollapsibleContent></Collapsible>
          <div className="flex flex-wrap gap-2"><Button type="button" onClick={() => save.mutate({ provider, form })} disabled={save.isPending}><Save className="mr-2 h-4 w-4" />Save</Button><Button type="button" variant="outline" onClick={() => test.mutate(provider)} disabled={!integration || test.isPending}><Plug className="mr-2 h-4 w-4" />Test connection</Button></div>
          <div className="grid gap-3 border-t pt-4 md:grid-cols-4"><div><p className="flex items-center gap-1 text-sm font-medium"><Activity className="h-4 w-4" />Webhook health</p><p className="text-xs text-muted-foreground">{providerHealth ? (providerHealth.healthy ? `Healthy; last received ${providerHealth.lastReceivedAt ? new Date(providerHealth.lastReceivedAt).toLocaleString() : "—"}` : providerHealth.alert) : "Enable and save to monitor webhook health."}</p></div><div><p className="text-sm font-medium">Active alerts</p><div className="max-h-20 overflow-auto text-xs text-destructive">{providerAlerts.length ? providerAlerts.map(alert => <p key={alert.id}>{alert.message}</p>) : "No active alerts."}</div></div><div><p className="text-sm font-medium">Gross / net reconciliation</p><p className="text-xs text-muted-foreground">{totals ? `${totals.orders} orders · Gross ${totals.gross} · Fees ${totals.fee} · Net ${totals.net}` : "No captured delivery fees yet."}</p></div><div><p className="text-sm font-medium">Recent sanitized events</p><div className="max-h-20 overflow-auto text-xs text-muted-foreground">{providerEvents.length ? providerEvents.map(event => <p key={event.id}>{event.status} · {event.providerEventId} {event.error ? `— ${event.error}` : ""}</p>) : "No events yet."}</div></div></div>
        </CardContent>
      </Card>;
    })}
  </section>;
}