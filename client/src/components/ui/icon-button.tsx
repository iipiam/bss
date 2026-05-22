import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface IconButtonProps extends Omit<ButtonProps, "size"> {
  tooltip: React.ReactNode;
  size?: "icon" | "sm" | "default";
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ tooltip, children, size = "icon", "aria-label": ariaLabel, ...props }, ref) => {
    const label =
      ariaLabel ?? (typeof tooltip === "string" ? tooltip : undefined);
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button ref={ref} size={size} aria-label={label} {...props}>
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="text-xs">{tooltip}</TooltipContent>
      </Tooltip>
    );
  }
);
IconButton.displayName = "IconButton";
