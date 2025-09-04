'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  RefreshCw,
  Tag
} from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { formatDate } from '@/lib/utils'

interface CategoriesTableProps {
  onEditCategory?: (id: string) => void
  onCreateCategory?: () => void
}

export function CategoriesTable({
  onEditCategory,
  onCreateCategory
}: CategoriesTableProps) {
  const {
    categoryHierarchy,
    loading,
    error,
    deleteCategory,
    refetch
  } = useCategories()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteClick = (categoryId: string) => {
    setCategoryToDelete(categoryId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return

    try {
      setDeleting(true)
      await deleteCategory(categoryToDelete)
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    } catch (error) {
      console.error('Erro ao excluir categoria:', error)
    } finally {
      setDeleting(false)
    }
  }

  const renderCategoryRow = (category: any, level = 0) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const indent = level * 24 // 24px por nível

    return (
      <>
        <TableRow key={category.id} className={level > 0 ? 'bg-muted/50' : ''}>
          <TableCell>
            <div className="flex items-center" style={{ paddingLeft: `${indent}px` }}>
              {level > 0 && (
                <div className="w-4 h-4 mr-2 text-muted-foreground">
                  →
                </div>
              )}
              <div>
                <div className="font-medium">{category.name}</div>
                {category.description && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {category.description}
                  </div>
                )}
              </div>
            </div>
          </TableCell>
          <TableCell>
            <code className="text-sm">{category.slug}</code>
          </TableCell>
          <TableCell>
            {level === 0 ? (
              <Badge variant="default">Principal</Badge>
            ) : (
              <Badge variant="secondary">Subcategoria</Badge>
            )}
          </TableCell>
          <TableCell>
            <Badge variant={category.is_active ? 'default' : 'secondary'}>
              {category.is_active ? 'Ativo' : 'Inativo'}
            </Badge>
          </TableCell>
          <TableCell className="text-center">
            {category.subcategories?.length || 0}
          </TableCell>
          <TableCell>
            {category.sort_order}
          </TableCell>
          <TableCell className="text-sm text-muted-foreground">
            {formatDate(category.created_at)}
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEditCategory?.(category.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDeleteClick(category.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
        
        {/* Render subcategories */}
        {category.subcategories?.map((sub: any) => renderCategoryRow(sub, level + 1))} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
      </>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando categorias...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={refetch} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Categorias
              </CardTitle>
              <CardDescription>
                Gerencie a hierarquia de categorias dos produtos
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={refetch} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button onClick={onCreateCategory} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Subcategorias</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead>Criado</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryHierarchy.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <Tag className="h-8 w-8 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma categoria encontrada</p>
                      <Button onClick={onCreateCategory} variant="outline" className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Criar primeira categoria
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                categoryHierarchy.map(category => renderCategoryRow(category))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
              Produtos associados a esta categoria precisarão ter suas categorias atualizadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}