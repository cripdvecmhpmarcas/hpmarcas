"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, RefreshCw, Tag, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CategorySelect } from "@/components/ui/category-select";
import { useCategories } from "@/hooks/useCategories";

interface CategoryFormProps {
  categoryId?: string;
  onCancel?: () => void;
}

interface CategoryFormData {
  name: string;
  slug: string;
  parent_id: string | null;
  description: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

const DEFAULT_FORM_DATA: CategoryFormData = {
  name: "",
  slug: "",
  parent_id: null,
  description: "",
  image_url: "",
  sort_order: 0,
  is_active: true,
};

export function CategoryForm({ categoryId, onCancel }: CategoryFormProps) {
  const {
    categories,
    getCategoryById,
    createCategory,
    updateCategory,
    loading: categoriesLoading,
  } = useCategories();

  const [formData, setFormData] = useState<CategoryFormData>(DEFAULT_FORM_DATA);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const isEditing = !!categoryId;

  // Load category data for editing
  useEffect(() => {
    if (categoryId && !categoriesLoading) {
      const category = getCategoryById(categoryId);
      if (category) {
        setFormData({
          name: category.name,
          slug: category.slug,
          parent_id: category.parent_id,
          description: category.description || "",
          image_url: category.image_url || "",
          sort_order: category.sort_order || 0,
          is_active: category.is_active ?? true,
        });
      }
    }
  }, [categoryId, categoriesLoading, getCategoryById]);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
      .trim()
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-"); // Remove multiple hyphens
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      // Auto-generate slug only if not editing or if slug is empty/auto-generated
      slug:
        !isEditing || prev.slug === generateSlug(prev.name)
          ? generateSlug(name)
          : prev.slug,
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Nome é obrigatório";
    }

    if (!formData.slug.trim()) {
      errors.slug = "Slug é obrigatório";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug =
        "Slug deve conter apenas letras minúsculas, números e hífens";
    }

    if (formData.sort_order < 0) {
      errors.sort_order = "Ordem deve ser um número positivo";
    }

    // Check for duplicate slug (excluding current category if editing)
    const duplicateSlug = categories.find(
      (cat) => cat.slug === formData.slug && cat.id !== categoryId
    );
    if (duplicateSlug) {
      errors.slug = "Este slug já está em uso";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const categoryData = {
        ...formData,
        slug: formData.slug.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        image_url: formData.image_url.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (isEditing) {
        await updateCategory(categoryId, categoryData);
      } else {
        await createCategory(categoryData);
      }

      onCancel?.();
    } catch (err) {
      console.error("Erro ao salvar categoria:", err);
      setError(err instanceof Error ? err.message : "Erro ao salvar categoria");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData(DEFAULT_FORM_DATA);
    setValidationErrors({});
    setError(null);
  };

  if (categoriesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? "Editar Categoria" : "Nova Categoria"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing
                ? "Atualize as informações da categoria"
                : "Adicione uma nova categoria ao sistema"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <Button type="button" variant="outline" onClick={resetForm}>
              Limpar
            </Button>
          )}
          <Button
            type="submit"
            form="category-form"
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Salvando..." : "Salvar Categoria"}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form id="category-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              <CardTitle>Informações Básicas</CardTitle>
            </div>
            <CardDescription>Dados principais da categoria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Categoria *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Digite o nome da categoria"
                  className={validationErrors.name ? "border-destructive" : ""}
                />
                {validationErrors.name && (
                  <p className="text-sm text-destructive">
                    {validationErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="slug-da-categoria"
                  className={validationErrors.slug ? "border-destructive" : ""}
                />
                {validationErrors.slug && (
                  <p className="text-sm text-destructive">
                    {validationErrors.slug}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Usado na URL. Apenas letras minúsculas, números e hífens.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Descreva a categoria..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parent">Categoria Pai</Label>
                <CategorySelect
                  value={formData.parent_id || ""}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      parent_id: value || null,
                    }))
                  }
                  placeholder="Selecione uma categoria pai (opcional)"
                  allowClear={true}
                // Exclude current category and its children to prevent circular references
                // This would need additional logic in CategorySelect to filter options
                />
                <p className="text-xs text-muted-foreground">
                  Deixe vazio para criar uma categoria principal
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">Ordem de Exibição</Label>
                <Input
                  id="sort_order"
                  type="number"
                  min="0"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sort_order: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                  className={
                    validationErrors.sort_order ? "border-destructive" : ""
                  }
                />
                {validationErrors.sort_order && (
                  <p className="text-sm text-destructive">
                    {validationErrors.sort_order}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">URL da Imagem</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    image_url: e.target.value,
                  }))
                }
                placeholder="https://exemplo.com/imagem.jpg (opcional)"
                type="url"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_active: checked }))
                }
              />
              <Label htmlFor="is_active">Categoria ativa</Label>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
