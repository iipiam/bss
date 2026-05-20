import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Network, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { APP_DIAGRAMS } from "@shared/appDiagrams";

export default function AppDiagram() {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

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

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="page-app-diagram">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Network className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">App Diagram</h1>
            <p className="text-muted-foreground mt-1">
              Visual reference for BSS architecture, data flow, and payment/invoicing lifecycle
            </p>
          </div>
        </div>
        <Button onClick={handleDownload} disabled={downloading} data-testid="button-download-pdf">
          {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          Download PDF
        </Button>
      </div>

      <div className="space-y-6">
        {APP_DIAGRAMS.map((d, i) => (
          <Card key={d.id} data-testid={`card-diagram-${d.id}`}>
            <CardHeader>
              <CardTitle data-testid={`title-diagram-${d.id}`}>{i + 1}. {d.title}</CardTitle>
              <CardDescription>{d.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="w-full overflow-x-auto rounded-md border bg-white p-3"
                dangerouslySetInnerHTML={{ __html: d.svg }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
