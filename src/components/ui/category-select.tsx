'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './command'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { useCategories } from '@/hooks/useCategories'

interface CategorySelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  allowClear?: boolean
  showSubcategoriesOnly?: boolean
  parentCategoryId?: string
}

export function CategorySelect({
  value,
  onValueChange,
  placeholder = "Selecione uma categoria...",
  className,
  disabled = false,
  allowClear = true,
  showSubcategoriesOnly = false,
  parentCategoryId
}: CategorySelectProps) {
  const [open, setOpen] = useState(false)
  const { categoryHierarchy, getCategoryPath, loading } = useCategories()

  // Filter categories based on props
  const filteredCategories = categoryHierarchy.filter(mainCat => {
    if (parentCategoryId) {
      return mainCat.id === parentCategoryId
    }
    return true
  })

  const selectedCategory = value ? getCategoryPath(value) : ''

  const handleSelect = (categoryId: string) => {
    onValueChange?.(categoryId)
    setOpen(false)
  }

  const handleClear = () => {
    onValueChange?.('')
    setOpen(false)
  }

  if (loading) {
    return (
      <Button
        variant="outline"
        className={cn("w-full justify-between", className)}
        disabled
      >
        Carregando...
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedCategory || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar categoria..." />
          <CommandList>
            <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
            
            {allowClear && value && (
              <CommandGroup>
                <CommandItem onSelect={handleClear}>
                  <div className="text-muted-foreground">
                    Limpar seleção
                  </div>
                </CommandItem>
              </CommandGroup>
            )}

            {filteredCategories.map((mainCategory) => (
              <CommandGroup 
                key={mainCategory.id} 
                heading={showSubcategoriesOnly ? undefined : mainCategory.name}
              >
                {!showSubcategoriesOnly && (
                  <CommandItem
                    value={mainCategory.name}
                    onSelect={() => handleSelect(mainCategory.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === mainCategory.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {mainCategory.name}
                  </CommandItem>
                )}

                {mainCategory.subcategories?.map((subcategory) => (
                  <CommandItem
                    key={subcategory.id}
                    value={`${mainCategory.name} ${subcategory.name}`}
                    onSelect={() => handleSelect(subcategory.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === subcategory.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="ml-4">→ {subcategory.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}