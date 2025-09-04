'use client'

import { useRef, useState, forwardRef, useImperativeHandle } from 'react'
import Image from 'next/image'
import {
  Upload,
  X,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  Move,
  Plus,
  RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useImageUpload, UploadedImage } from './hooks/useImageUpload'

interface ImageUploadProps {
  initialImages?: string[]
  maxImages?: number
  onImagesChange?: (imageUrls: string[]) => void
  className?: string
  disabled?: boolean
  showPreview?: boolean
  dragAndDrop?: boolean
}

export interface ImageUploadRef {
  uploadPendingFiles: (productId: string) => Promise<string[]>
}

export const ImageUpload = forwardRef<ImageUploadRef, ImageUploadProps>(({
  initialImages = [],
  maxImages = 10,
  onImagesChange,
  className = '',
  disabled = false,
  showPreview = true,
  dragAndDrop = true
}, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const {
    images,
    uploading,
    uploadProgress,
    error,
    addFiles,
    removeImage,
    clearImages,
    reorderImages,
    getImageUrls,
    uploadPendingFiles
  } = useImageUpload(initialImages)

  // Expose uploadPendingFiles via ref
  useImperativeHandle(ref, () => ({
    uploadPendingFiles
  }), [uploadPendingFiles])

  // Handle file selection
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return

    try {
      addFiles(files)
      onImagesChange?.(getImageUrls())
    } catch (err) {
      console.error('Add files error:', err)
    }
  }

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files)
    // Reset input value to allow re-uploading the same file
    event.target.value = ''
  }

  // Handle drag and drop
  const handleDragOver = (event: React.DragEvent) => {
    if (!dragAndDrop || disabled) return

    event.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    if (!dragAndDrop || disabled) return

    event.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (event: React.DragEvent) => {
    if (!dragAndDrop || disabled) return

    event.preventDefault()
    setDragOver(false)

    const files = event.dataTransfer.files
    handleFileSelect(files)
  }

  // Handle image removal
  const handleRemoveImage = (index: number) => {
    removeImage(index)
    onImagesChange?.(getImageUrls())
  }

  // Handle image reorder
  const handleImageDragStart = (event: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    event.dataTransfer.effectAllowed = 'move'
  }

  const handleImageDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  const handleImageDrop = (event: React.DragEvent, dropIndex: number) => {
    event.preventDefault()

    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      reorderImages(draggedIndex, dropIndex)
      onImagesChange?.(getImageUrls())
    }

    setDraggedIndex(null)
  }

  // Render image preview
  const renderImagePreview = (image: UploadedImage, index: number) => {
    const isLoading = image.loading
    const hasError = !!image.error
    const imageUrl = image.publicUrl || image.url // Use publicUrl if available, fallback to local URL
    const progress = image.progress || 0

    return (
      <div
        key={index}
        className={`relative group rounded-lg border-2 border-dashed border-muted transition-all ${
          draggedIndex === index ? 'opacity-50' : ''
        }`}
        draggable={!disabled && !isLoading}
        onDragStart={(e) => handleImageDragStart(e, index)}
        onDragOver={handleImageDragOver}
        onDrop={(e) => handleImageDrop(e, index)}
      >
        <div className="aspect-square relative overflow-hidden rounded-lg">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full bg-muted/50">
              {/* Skeleton background with preview */}
              {image.url && (
                <div className="absolute inset-0">
                  <Image
                    src={image.url}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover opacity-30"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              )}

              {/* Loading overlay */}
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white mb-2" />
                <div className="text-xs text-white font-medium mb-1">Enviando...</div>
                {progress > 0 && (
                  <div className="w-20 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : hasError ? (
            <div className="flex flex-col items-center justify-center h-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p className="text-xs text-center px-2 mb-2">{image.error}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleRemoveImage(index)
                }}
              >
                Remover
              </Button>
            </div>
          ) : (
            <>
              <Image
                src={imageUrl}
                alt={`Produto ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={() => {
                  console.error('Error loading image:', imageUrl)
                }}
              />

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleRemoveImage(index)
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>

                {!disabled && (
                  <div className="cursor-move p-1 bg-secondary rounded">
                    <Move className="h-4 w-4" />
                  </div>
                )}
              </div>

              {/* Primary image badge */}
              {index === 0 && (
                <Badge
                  variant="default"
                  className="absolute top-2 left-2 text-xs"
                >
                  Principal
                </Badge>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  const canAddMore = images.length < maxImages && !disabled
  const hasImages = images.length > 0

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {canAddMore && (
        <Card
          className={`transition-all ${dragOver ? 'border-primary bg-primary/10' : ''
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={(e) => {
            if (!disabled && !e.defaultPrevented) {
              fileInputRef.current?.click()
            }
          }}
        >
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className={`p-4 rounded-full ${dragOver ? 'bg-primary/20' : 'bg-muted'}`}>
                <Upload className={`h-8 w-8 ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">
                  {dragAndDrop ? 'Arraste as imagens aqui ou clique para selecionar' : 'Clique para selecionar imagens'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  PNG, JPG, WebP até 5MB • Máximo {maxImages} imagens
                </p>
                {hasImages && (
                  <p className="text-xs text-muted-foreground">
                    {images.length} de {maxImages} imagens
                  </p>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Selecionar Arquivos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Fazendo upload...</span>
            <span className="text-muted-foreground">{Math.round(uploadProgress)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-300 ease-in-out"
              style={{
                width: `${Math.min(100, Math.max(0, uploadProgress))}%`
              }}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            {images.filter(img => img.loading).length} imagens sendo enviadas
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Image Previews */}
      {showPreview && hasImages && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Imagens do Produto</h4>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {images.filter(img => !img.loading && !img.error).length} imagens
              </span>
              {hasImages && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    clearImages()
                    onImagesChange?.([])
                  }}
                  disabled={disabled}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Limpar Tudo
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((image, index) => renderImagePreview(image, index))}
          </div>

          {images.length > 1 && (
            <p className="text-xs text-muted-foreground">
              💡 Dica: Arraste as imagens para reordenar. A primeira imagem será a principal.
            </p>
          )}
        </div>
      )}

      {/* No Images State */}
      {!hasImages && !canAddMore && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma imagem adicionada</p>
        </div>
      )}
    </div>
  )
})

ImageUpload.displayName = 'ImageUpload'
