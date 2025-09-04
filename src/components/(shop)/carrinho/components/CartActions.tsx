import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { CartActionsProps } from "../types";

export function CartActions({ className = "" }: CartActionsProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <Link href="/produtos">
        <Button variant="outline" className="w-full">
          Continuar Comprando
        </Button>
      </Link>
    </div>
  );
}