import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface CTAButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  label: string;
  subtext?: string;
  showArrow?: boolean;
  size?: "sm" | "default" | "lg";
  fullWidth?: boolean;
}

const CTAButton = React.forwardRef<HTMLButtonElement, CTAButtonProps>(
  ({ 
    className, 
    variant = "primary", 
    label, 
    subtext, 
    showArrow = false,
    size = "default",
    fullWidth = false,
    ...props 
  }, ref) => {
    const baseStyles = "relative overflow-hidden font-bold rounded-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    
    const sizeStyles = {
      sm: "px-4 py-2",
      default: "px-6 py-3",
      lg: "px-8 py-4",
    };

    const variantStyles = {
      primary: cn(
        "bg-gradient-to-r from-[hsl(48,100%,55%)] via-[hsl(48,100%,65%)] to-[hsl(45,100%,55%)]",
        "text-[hsl(260,80%,10%)]",
        "shadow-[0_4px_20px_hsl(48_100%_60%/0.4),inset_0_1px_0_hsl(48_100%_80%/0.5)]",
        "hover:shadow-[0_8px_30px_hsl(48_100%_60%/0.5),inset_0_1px_0_hsl(48_100%_80%/0.5)]",
        "hover:-translate-y-0.5",
        "active:translate-y-0"
      ),
      secondary: cn(
        "bg-[hsl(263,78%,35%)]",
        "text-foreground",
        "border-2 border-[hsl(48,100%,60%)]",
        "shadow-[0_4px_15px_hsl(263_78%_40%/0.3)]",
        "hover:bg-[hsl(263,78%,40%)]",
        "hover:shadow-[0_6px_20px_hsl(263_78%_40%/0.4)]",
        "hover:-translate-y-0.5",
        "active:translate-y-0"
      ),
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        <div className="flex flex-col items-center justify-center gap-0.5">
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-bold",
              size === "lg" ? "text-lg" : size === "sm" ? "text-sm" : "text-base"
            )}>
              {label}
            </span>
            {showArrow && (
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            )}
          </div>
          {subtext && (
            <span className={cn(
              "font-normal opacity-80",
              size === "lg" ? "text-xs" : size === "sm" ? "text-[9px]" : "text-[11px]",
              variant === "primary" ? "text-[hsl(260,80%,20%)]" : "text-muted-foreground"
            )}>
              {subtext}
            </span>
          )}
        </div>
      </button>
    );
  }
);

CTAButton.displayName = "CTAButton";

export { CTAButton };
