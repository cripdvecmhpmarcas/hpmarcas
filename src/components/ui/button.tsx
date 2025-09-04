import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Variante padrão usando o primary (dourado) do sistema
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hp-shadow-gold",

        // Variante específica HP Marcas - dourado vibrante principal
        gold: "bg-gold-400 text-foreground shadow-xs hover:bg-gold-500 focus-visible:ring-gold-400/50 hp-shadow-gold border border-gold-500/20",

        // Variante dourada mais escura para ações importantes
        "gold-dark":
          "bg-gold-600 text-white shadow-xs hover:bg-gold-700 focus-visible:ring-gold-600/50 hp-shadow-gold",

        // Variante dourada suave para ações secundárias
        "gold-soft":
          "hp-bg-gold-soft text-gold-700 shadow-xs hover:bg-gold-100 border hp-border-gold focus-visible:ring-gold-400/30",

        // Variante com gradiente dourado
        "gold-gradient":
          "hp-gradient text-foreground shadow-lg hover:opacity-90 focus-visible:ring-gold-400/50 border border-gold-500/20",

        // Variante destructiva
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",

        // Variante outline com tema HP Marcas
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",

        // Variante outline dourada
        "outline-gold":
          "border-gold-400 text-gold-600 bg-transparent shadow-xs hover:bg-gold-50 hover:text-gold-700 focus-visible:ring-gold-400/30 dark:border-gold-500 dark:text-gold-400 dark:hover:bg-gold-950/20",

        // Variante secundária
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",

        // Variante ghost
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",

        // Variante ghost dourada
        "ghost-gold":
          "text-gold-600 hover:bg-gold-50 hover:text-gold-700 dark:text-gold-400 dark:hover:bg-gold-950/20",

        // Variante link
        link: "text-primary underline-offset-4 hover:underline",

        // Variante link dourada
        "link-gold":
          "text-gold-600 underline-offset-4 hover:underline hover:text-gold-700 dark:text-gold-400 dark:hover:text-gold-300",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4 text-base",
        xl: "h-12 rounded-lg px-8 has-[>svg]:px-6 text-lg font-semibold",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
        "icon-xl": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
