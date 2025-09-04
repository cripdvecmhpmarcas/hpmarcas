"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Tag } from "lucide-react";
import { CategoriesTable } from "@/components/dashboard/categorias/CategoriesTable";
import { CategoryForm } from "@/components/dashboard/categorias/CategoryForm";
import { useCategories } from "@/hooks/useCategories";

export default function CategoriasPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<
    string | undefined
  >();

  const { categories, mainCategories } = useCategories();

  // Calculate statistics
  const totalCategories = categories.length;
  const totalMainCategories = mainCategories.length;
  const totalSubcategories = categories.filter((cat) => cat.parent_id).length;

  const handleCreateCategory = () => {
    setEditingCategoryId(undefined);
    setShowForm(true);
  };

  const handleEditCategory = (id: string) => {
    setEditingCategoryId(id);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCategoryId(undefined);
  };

  if (showForm) {
    return (
      <CategoryForm categoryId={editingCategoryId} onCancel={handleFormClose} />
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categorias</h1>
          <p className="text-muted-foreground">
            Gerencie as categorias e subcategorias dos produtos
          </p>
        </div>
        <Button onClick={handleCreateCategory} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Categorias
            </CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCategories}</div>
            <p className="text-xs text-muted-foreground">
              Incluindo subcategorias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Categorias Principais
            </CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMainCategories}</div>
            <p className="text-xs text-muted-foreground">Categorias sem pai</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subcategorias</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubcategories}</div>
            <p className="text-xs text-muted-foreground">Categorias com pai</p>
          </CardContent>
        </Card>
      </div>

      {/* Categories Table */}
      <CategoriesTable
        onEditCategory={handleEditCategory}
        onCreateCategory={handleCreateCategory}
      />
    </div>
  );
}
