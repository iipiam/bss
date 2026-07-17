"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

// Radix tooltips only open on mouse hover / keyboard focus, so on touch
// devices (phones, tablets) they never appear. We detect coarse pointers and
// switch to a controlled tooltip that opens on tap and auto-dismisses.
function useIsTouchDevice() {
  const [isTouch, setIsTouch] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(hover: none), (pointer: coarse)")
    const update = () => setIsTouch(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])
  return isTouch
}

type TouchTooltipContextValue = {
  isTouch: boolean
  open: (o: boolean) => void
}

const TouchTooltipContext = React.createContext<TouchTooltipContextValue>({
  isTouch: false,
  open: () => {},
})

const TOUCH_TOOLTIP_AUTO_HIDE_MS = 1800

const Tooltip = ({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>) => {
  const isTouch = useIsTouchDevice()
  const [open, setOpen] = React.useState(false)
  const hideTimer = React.useRef<ReturnType<typeof setTimeout>>()

  const openTooltip = React.useCallback((o: boolean) => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setOpen(o)
    if (o) {
      hideTimer.current = setTimeout(() => setOpen(false), TOUCH_TOOLTIP_AUTO_HIDE_MS)
    }
  }, [])

  React.useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [])

  if (!isTouch) {
    return <TooltipPrimitive.Root {...props}>{children}</TooltipPrimitive.Root>
  }

  return (
    <TouchTooltipContext.Provider value={{ isTouch: true, open: openTooltip }}>
      <TooltipPrimitive.Root
        {...props}
        open={open}
        onOpenChange={openTooltip}
        disableHoverableContent
      >
        {children}
      </TooltipPrimitive.Root>
    </TouchTooltipContext.Provider>
  )
}

const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>(({ onClick, ...props }, ref) => {
  const { isTouch, open } = React.useContext(TouchTooltipContext)
  return (
    <TooltipPrimitive.Trigger
      ref={ref}
      {...props}
      onClick={(e) => {
        onClick?.(e)
        if (isTouch) open(true)
      }}
    />
  )
})
TooltipTrigger.displayName = TooltipPrimitive.Trigger.displayName

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-tooltip-content-transform-origin]",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
