import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "danger" | "outline";

const variantClasses: Record<BadgeVariant, string> = {
  default:   "bg-blue-100 text-blue-800",
  secondary: "bg-gray-100 text-gray-800",
  success:   "bg-green-100 text-green-800",
  warning:   "bg-yellow-100 text-yellow-800",
  danger:    "bg-red-100 text-red-800",
  outline:   "border border-gray-300 text-gray-700 bg-transparent",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
