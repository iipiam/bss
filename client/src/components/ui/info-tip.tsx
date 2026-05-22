import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function InfoTip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info
          className={
            "h-3.5 w-3.5 text-muted-foreground inline-block ms-1 cursor-help " +
            (className ?? "")
          }
        />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{children}</TooltipContent>
    </Tooltip>
  );
}
