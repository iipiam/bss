import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Printer, ChevronDown, Wifi, Monitor, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { printService } from "@/lib/printService";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Printer as PrinterType } from "@shared/schema";

interface PrintButtonProps {
  onPrint: (printer?: PrinterType) => Promise<void> | void;
  content?: string;
  pdfUrl?: string;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
  className?: string;
  showDropdown?: boolean;
}

export function PrintButton({
  onPrint,
  content,
  pdfUrl,
  label,
  variant = "outline",
  size = "default",
  disabled = false,
  className,
  showDropdown = true,
}: PrintButtonProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isPrinting, setIsPrinting] = useState(false);
  const [qzAvailable, setQzAvailable] = useState(false);

  // Fetch configured printers from API
  const { data: configuredPrinters = [] } = useQuery<PrinterType[]>({
    queryKey: ["/api/printers"],
    enabled: showDropdown,
  });

  // Initialize QZ Tray connection
  useEffect(() => {
    const initQz = async () => {
      const available = await printService.init();
      setQzAvailable(available);
    };
    initQz();
  }, []);

  // Get the default printer
  const defaultPrinter = configuredPrinters.find(p => p.isDefault);

  const handlePrint = async (printer?: PrinterType) => {
    setIsPrinting(true);
    try {
      await onPrint(printer);
    } catch (error) {
      console.error('[PrintButton] Print failed:', error);
      toast({
        title: t.error || "Error",
        description: "Failed to print. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleQuickPrint = () => {
    // Use default printer or fallback to browser print
    handlePrint(defaultPrinter);
  };

  const handleBrowserPrint = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    } else if (content) {
      printService.browserPrint(content);
    } else {
      handlePrint();
    }
  };

  // Simple button without dropdown
  if (!showDropdown || configuredPrinters.length === 0) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleBrowserPrint}
        disabled={disabled || isPrinting}
        className={className}
        data-testid="button-print"
      >
        <Printer className="h-4 w-4 mr-2" />
        {isPrinting ? (t.loading || "Printing...") : (label || t.printTestPage || "Print")}
      </Button>
    );
  }

  // Dropdown with printer selection
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isPrinting}
          className={className}
          data-testid="button-print-dropdown"
        >
          <Printer className="h-4 w-4 mr-2" />
          {isPrinting ? (t.loading || "Printing...") : (label || t.printTestPage || "Print")}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          {t.printers || "Printers"}
          {qzAvailable && (
            <span className="ml-auto text-xs text-green-600 flex items-center gap-1">
              <Check className="h-3 w-3" />
              QZ
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {configuredPrinters.map((printer) => (
          <DropdownMenuItem
            key={printer.id}
            onClick={() => handlePrint(printer)}
            className="flex items-center gap-2"
            data-testid={`menu-printer-${printer.id}`}
          >
            {printer.connectionType === 'network' ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <Monitor className="h-4 w-4" />
            )}
            <span className="flex-1">{printer.name}</span>
            {printer.isDefault && (
              <span className="text-xs text-muted-foreground">(Default)</span>
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleBrowserPrint}
          className="flex items-center gap-2"
          data-testid="menu-browser-print"
        >
          <Monitor className="h-4 w-4" />
          <span>{t.browserPrint || "Browser Print"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Quick print button that uses the default printer
export function QuickPrintButton({
  onPrint,
  label,
  variant = "ghost",
  size = "icon",
  disabled = false,
  className,
}: Omit<PrintButtonProps, 'showDropdown' | 'content' | 'pdfUrl'>) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isPrinting, setIsPrinting] = useState(false);

  // Fetch default printer
  const { data: printers = [] } = useQuery<PrinterType[]>({
    queryKey: ["/api/printers"],
  });

  const defaultPrinter = printers.find(p => p.isDefault);

  const handleQuickPrint = async () => {
    setIsPrinting(true);
    try {
      await onPrint(defaultPrinter);
    } catch (error) {
      console.error('[QuickPrintButton] Print failed:', error);
      toast({
        title: t.error || "Error",
        description: "Failed to print",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  if (size === "icon") {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleQuickPrint}
        disabled={disabled || isPrinting}
        className={className}
        title={label || t.printTestPage || "Print"}
        data-testid="button-quick-print"
      >
        <Printer className={`h-4 w-4 ${isPrinting ? 'animate-pulse' : ''}`} />
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleQuickPrint}
      disabled={disabled || isPrinting}
      className={className}
      data-testid="button-quick-print"
    >
      <Printer className={`h-4 w-4 mr-2 ${isPrinting ? 'animate-pulse' : ''}`} />
      {label || t.printTestPage || "Print"}
    </Button>
  );
}
