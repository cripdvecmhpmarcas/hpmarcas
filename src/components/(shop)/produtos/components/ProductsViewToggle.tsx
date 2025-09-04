import { Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductsViewToggleProps } from "../types";

export function ProductsViewToggle({ viewMode, onViewModeChange }: ProductsViewToggleProps) {
  return (
    <div className="flex gap-1 border rounded-lg p-1">
      <Button
        variant={viewMode === "grid" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("grid")}
      >
        <Grid3X3 className="w-4 h-4" />
      </Button>
      <Button
        variant={viewMode === "list" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("list")}
      >
        <List className="w-4 h-4" />
      </Button>
    </div>
  );
}