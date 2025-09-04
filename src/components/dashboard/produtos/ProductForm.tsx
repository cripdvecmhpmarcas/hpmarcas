'use client'

import { useState, useRef } from 'react'
import { ArrowLeft, Save, RefreshCw, Package, DollarSign, Barcode, ImageIcon, Plus, Trash2, AlertCircle, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useProductForm } from './hooks/useProductForm'
import { ImageUpload } from './ImageUpload'
import { PRODUCT_CATEGORIES, VOLUME_UNITS, ProductVolume, ProductFormData } from '@/types/products'
import { CategorySelect } from '@/components/ui/category-select'
import { formatCurrency } from '@/lib/pdv-utils'

interface ProductFormProps {
  productId?: string
  onCancel?: () => void
}

export function ProductForm({ productId, onCancel }: ProductFormProps) {
  const {
    formData,
    loading,
    saving,
    error,
    validationErrors,
    isEditing,
    setFormData,
    addVolume,
    removeVolume,
    generateNewSKU,
    saveProduct,
    resetForm,
    handleImageUpload
  } = useProductForm(productId)

  // Reference to the ImageUpload component
  const imageUploadRef = useRef<{ uploadPendingFiles: (productId: string) => Promise<string[]> }>(null)

  const [showVolumes, setShowVolumes] = useState(false)
  const [newVolume, setNewVolume] = useState<ProductVolume>({
    size: '',
    unit: 'ml',
    barcode: '',
    price_adjustment: 0
  })

  // Handle keydown to prevent barcode scanner Enter submission
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Cancelar o Enter do bipador
      e.stopPropagation();
    }
  };

  // Handle keydown for volume barcode input
  const handleVolumeBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Cancelar o Enter do bipador
      e.stopPropagation();
    }
  };

  // Handle numeric input changes without forcing 0
  const handleNumericChange = (
    field: keyof ProductFormData,
    value: string,
    parser: (val: string) => number = parseFloat
  ) => {
    const trimmedValue = value.trim();
    if (trimmedValue === '' || trimmedValue === '.') {
      // Allow empty or just decimal point for better UX
      setFormData({ [field]: 0 });
    } else {
      const numericValue = parser(trimmedValue);
      if (!isNaN(numericValue)) {
        setFormData({ [field]: numericValue });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Pass the uploadPendingFiles function to saveProduct
    const uploadPendingImages = imageUploadRef.current?.uploadPendingFiles
    await saveProduct(uploadPendingImages)
  }

  const handleAddVolume = () => {
    if (newVolume.size && newVolume.unit) {
      addVolume(newVolume)
      setNewVolume({
        size: '',
        unit: 'ml',
        barcode: '',
        price_adjustment: 0
      })
    }
  }

  const calculateMargin = (cost: number, price: number) => {
    if (cost === 0) return 0
    return ((price - cost) / cost * 100)
  }

  const formatMargin = (margin: number) => {
    return `${margin.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Editar Produto' : 'Novo Produto'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Atualize as informações do produto' : 'Adicione um novo produto ao catálogo'}
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
            form="product-form"
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Salvando...' : 'Salvar Produto'}
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

      <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <CardTitle>Informações Básicas</CardTitle>
            </div>
            <CardDescription>
              Dados principais do produto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  placeholder="Digite o nome do produto"
                  className={validationErrors.name ? 'border-destructive' : ''}
                />
                {validationErrors.name && (
                  <p className="text-sm text-destructive">{validationErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Marca *</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ brand: e.target.value })}
                  placeholder="Digite a marca"
                  className={validationErrors.brand ? 'border-destructive' : ''}
                />
                {validationErrors.brand && (
                  <p className="text-sm text-destructive">{validationErrors.brand}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ description: e.target.value })}
                placeholder="Descreva o produto..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <CategorySelect
                  value={formData.subcategory_id}
                  onValueChange={(value) => {
                    setFormData({ subcategory_id: value })
                    // Clear legacy category when subcategory is selected
                    if (value) {
                      setFormData({ category: '' })
                    }
                  }}
                  placeholder="Selecione uma categoria..."
                  className={validationErrors.category ? 'border-destructive' : ''}
                />
                {validationErrors.category && (
                  <p className="text-sm text-destructive">{validationErrors.category}</p>
                )}

                {/* Fallback to legacy category field if no subcategory selected */}
                {!formData.subcategory_id && (
                  <div className="mt-2">
                    <Label htmlFor="legacy-category" className="text-sm text-muted-foreground">
                      Categoria Legada (compatibilidade)
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ category: value as typeof PRODUCT_CATEGORIES[number] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ou selecione categoria legada" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_CATEGORIES.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ status: value as 'active' | 'inactive' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SKU and Barcode */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Barcode className="h-5 w-5" />
              <CardTitle>Identificação</CardTitle>
            </div>
            <CardDescription>
              SKU e código de barras para identificação do produto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <div className="flex gap-2">
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ sku: e.target.value })}
                    placeholder="SKU do produto"
                    className={validationErrors.sku ? 'border-destructive' : ''}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateNewSKU}
                    disabled={isEditing}
                  >
                    Gerar
                  </Button>
                </div>
                {validationErrors.sku && (
                  <p className="text-sm text-destructive">{validationErrors.sku}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">Código de Barras</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ barcode: e.target.value })}
                  onKeyDown={handleBarcodeKeyDown}
                  placeholder="Código de barras (opcional)"
                  className={validationErrors.barcode ? 'border-destructive' : ''}
                />
                {validationErrors.barcode && (
                  <p className="text-sm text-destructive">{validationErrors.barcode}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              <CardTitle>Preços e Custos</CardTitle>
            </div>
            <CardDescription>
              Definição de preços e cálculo de margem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Custo *</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost === 0 ? '' : formData.cost}
                  onChange={(e) => handleNumericChange('cost', e.target.value)}
                  placeholder="0,00"
                  className={validationErrors.cost ? 'border-destructive' : ''}
                />
                {validationErrors.cost && (
                  <p className="text-sm text-destructive">{validationErrors.cost}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="wholesale_price">Preço Atacado *</Label>
                <Input
                  id="wholesale_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.wholesale_price === 0 ? '' : formData.wholesale_price}
                  onChange={(e) => handleNumericChange('wholesale_price', e.target.value)}
                  placeholder="0,00"
                  className={validationErrors.wholesale_price ? 'border-destructive' : ''}
                />
                {validationErrors.wholesale_price && (
                  <p className="text-sm text-destructive">{validationErrors.wholesale_price}</p>
                )}
                {formData.cost > 0 && formData.wholesale_price > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Margem: {formatMargin(calculateMargin(formData.cost, formData.wholesale_price))}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="retail_price">Preço Varejo *</Label>
                <Input
                  id="retail_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.retail_price === 0 ? '' : formData.retail_price}
                  onChange={(e) => handleNumericChange('retail_price', e.target.value)}
                  placeholder="0,00"
                  className={validationErrors.retail_price ? 'border-destructive' : ''}
                />
                {validationErrors.retail_price && (
                  <p className="text-sm text-destructive">{validationErrors.retail_price}</p>
                )}
                {formData.cost > 0 && formData.retail_price > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Margem: {formatMargin(calculateMargin(formData.cost, formData.retail_price))}
                  </p>
                )}
              </div>
            </div>

            {/* Price Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Custo</p>
                <p className="text-lg font-semibold">{formatCurrency(formData.cost)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Atacado</p>
                <p className="text-lg font-semibold text-blue-600">
                  {formatCurrency(formData.wholesale_price)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Varejo</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(formData.retail_price)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock */}
        <Card>
          <CardHeader>
            <CardTitle>Estoque</CardTitle>
            <CardDescription>
              Controle de estoque e alertas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Quantidade em Estoque *</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock === 0 ? '' : formData.stock}
                  onChange={(e) => handleNumericChange('stock', e.target.value, parseInt)}
                  placeholder="0"
                  className={validationErrors.stock ? 'border-destructive' : ''}
                />
                {validationErrors.stock && (
                  <p className="text-sm text-destructive">{validationErrors.stock}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_stock">Estoque Mínimo *</Label>
                <Input
                  id="min_stock"
                  type="number"
                  min="0"
                  value={formData.min_stock === 0 ? '' : formData.min_stock}
                  onChange={(e) => handleNumericChange('min_stock', e.target.value, parseInt)}
                  placeholder="5"
                  className={validationErrors.min_stock ? 'border-destructive' : ''}
                />
                {validationErrors.min_stock && (
                  <p className="text-sm text-destructive">{validationErrors.min_stock}</p>
                )}
              </div>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              {formData.stock === 0 ? (
                <Badge variant="destructive">Sem Estoque</Badge>
              ) : formData.stock <= formData.min_stock ? (
                <Badge variant="secondary">Estoque Baixo</Badge>
              ) : (
                <Badge variant="default">Em Estoque</Badge>
              )}
              <span className="text-sm text-muted-foreground">
                Valor total: {formatCurrency(formData.stock * formData.cost)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Dimensions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              <CardTitle>Dados para Melhor Envio</CardTitle>
            </div>
            <CardDescription>
              Peso e dimensões físicas para cálculo preciso de frete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (g) *</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.shipping_data?.weight || ''}
                  onChange={(e) => {
                    const weight = parseFloat(e.target.value) || 0
                    setFormData({
                      shipping_data: {
                        ...formData.shipping_data,
                        weight,
                        length: formData.shipping_data?.length || 0,
                        width: formData.shipping_data?.width || 0,
                        height: formData.shipping_data?.height || 0
                      }
                    })
                  }}
                  placeholder="500"
                />
                <p className="text-xs text-muted-foreground">Peso em gramas</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="length">Comprimento (cm) *</Label>
                <Input
                  id="length"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.shipping_data?.length || ''}
                  onChange={(e) => {
                    const length = parseFloat(e.target.value) || 0
                    setFormData({
                      shipping_data: {
                        ...formData.shipping_data,
                        weight: formData.shipping_data?.weight || 0,
                        length,
                        width: formData.shipping_data?.width || 0,
                        height: formData.shipping_data?.height || 0
                      }
                    })
                  }}
                  placeholder="20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="width">Largura (cm) *</Label>
                <Input
                  id="width"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.shipping_data?.width || ''}
                  onChange={(e) => {
                    const width = parseFloat(e.target.value) || 0
                    setFormData({
                      shipping_data: {
                        ...formData.shipping_data,
                        weight: formData.shipping_data?.weight || 0,
                        length: formData.shipping_data?.length || 0,
                        width,
                        height: formData.shipping_data?.height || 0
                      }
                    })
                  }}
                  placeholder="15"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">Altura (cm) *</Label>
                <Input
                  id="height"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.shipping_data?.height || ''}
                  onChange={(e) => {
                    const height = parseFloat(e.target.value) || 0
                    setFormData({
                      shipping_data: {
                        ...formData.shipping_data,
                        weight: formData.shipping_data?.weight || 0,
                        length: formData.shipping_data?.length || 0,
                        width: formData.shipping_data?.width || 0,
                        height
                      }
                    })
                  }}
                  placeholder="5"
                />
              </div>
            </div>

            {/* Shipping Preview */}
            {formData.shipping_data?.weight && formData.shipping_data?.length && formData.shipping_data?.width && formData.shipping_data?.height && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
                  <Truck className="h-4 w-4" />
                  Preview dos Dados de Frete
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Peso:</span> {formData.shipping_data.weight}g
                  </div>
                  <div>
                    <span className="font-medium">Dimensões:</span> {formData.shipping_data.length} × {formData.shipping_data.width} × {formData.shipping_data.height} cm
                  </div>
                  <div>
                    <span className="font-medium">Volume:</span> {(formData.shipping_data.length * formData.shipping_data.width * formData.shipping_data.height / 1000).toFixed(2)}L
                  </div>
                  <div>
                    <span className="font-medium">Formato:</span> {formData.shipping_data.length > 0 && formData.shipping_data.width > 0 && formData.shipping_data.height > 0 ? 'Caixa' : 'N/A'}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Volumes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Volumes</CardTitle>
                <CardDescription>
                  Variações de tamanho do produto (opcional)
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowVolumes(!showVolumes)}
              >
                {showVolumes ? 'Ocultar' : 'Mostrar'} Volumes
              </Button>
            </div>
          </CardHeader>
          {showVolumes && (
            <CardContent className="space-y-4">
              {/* Add New Volume */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 p-4 border rounded-lg">
                <Input
                  placeholder="Tamanho"
                  value={newVolume.size}
                  onChange={(e) => setNewVolume({ ...newVolume, size: e.target.value })}
                />
                <Select
                  value={newVolume.unit}
                  onValueChange={(value) => setNewVolume({ ...newVolume, unit: value as typeof VOLUME_UNITS[number] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOLUME_UNITS.map(unit => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Código de barras"
                  value={newVolume.barcode}
                  onChange={(e) => setNewVolume({ ...newVolume, barcode: e.target.value })}
                  onKeyDown={handleVolumeBarcodeKeyDown}
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ajuste preço"
                  value={newVolume.price_adjustment === 0 ? '' : newVolume.price_adjustment}
                  onChange={(e) => {
                    const value = e.target.value.trim();
                    if (value === '' || value === '.') {
                      setNewVolume({ ...newVolume, price_adjustment: 0 });
                    } else {
                      const numericValue = parseFloat(value);
                      if (!isNaN(numericValue)) {
                        setNewVolume({ ...newVolume, price_adjustment: numericValue });
                      }
                    }
                  }}
                />
                <Button type="button" onClick={handleAddVolume} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Existing Volumes */}
              {formData.volumes.length > 0 && (
                <div className="space-y-2">
                  {formData.volumes.map((volume, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <Badge variant="outline">
                        {volume.size}{volume.unit}
                      </Badge>
                      {volume.barcode && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {volume.barcode}
                        </span>
                      )}
                      {(volume.price_adjustment || 0) !== 0 && (
                        <span className="text-xs text-muted-foreground">
                          {(volume.price_adjustment || 0) > 0 ? '+' : ''}{formatCurrency(volume.price_adjustment || 0)}
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVolume(index)}
                        className="ml-auto"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              <CardTitle>Imagens do Produto</CardTitle>
            </div>
            <CardDescription>
              Adicione até 10 imagens do produto. A primeira será a imagem principal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload
              ref={imageUploadRef}
              initialImages={formData.images}
              maxImages={10}
              onImagesChange={handleImageUpload}
              disabled={saving}
              showPreview={true}
              dragAndDrop={true}
            />
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
