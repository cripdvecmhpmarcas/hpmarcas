'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react'
import type { CustomerAddress, AddressFormData } from '@/types/checkout'
import { useAddresses } from './hooks/useAddresses'
import { toast } from 'sonner'
import { useAnonymousAuth } from '@/components/auth/AnonymousAuthProvider'
import { CustomerLoginModal } from '@/components/auth/CustomerLoginModal'

const STATES = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' }
]

interface AddressSelectorProps {
  selectedAddress?: CustomerAddress | null
  onAddressSelect: (address: CustomerAddress) => void
  className?: string
}

export function AddressSelector({ selectedAddress, onAddressSelect, className }: AddressSelectorProps) {
  const { addresses, loading, createAddress, updateAddress, deleteAddress } = useAddresses()
  const { customer } = useAnonymousAuth()
  const [showDialog, setShowDialog] = useState(false)
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null)

  const [formData, setFormData] = useState<AddressFormData>({
    name: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    label: 'Casa',
    is_default: false,
  })

  const resetForm = () => {
    setFormData({
      name: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zip_code: '',
      label: 'Casa',
      is_default: false,
    })
    setEditingAddress(null)
  }

  const handleOpenDialog = (address?: CustomerAddress) => {
    if (address) {
      setEditingAddress(address)
      setFormData({
        name: address.name,
        street: address.street,
        number: address.number,
        complement: address.complement || '',
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        zip_code: address.zip_code,
        label: address.label,
        is_default: address.is_default,
      })
    } else {
      resetForm()
    }
    setShowDialog(true)
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.street || !formData.number || !formData.neighborhood || !formData.city || !formData.state || !formData.zip_code) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    const cleanZip = formData.zip_code.replace(/\D/g, '')
    if (cleanZip.length !== 8) {
      toast.error('CEP deve ter 8 dígitos')
      return
    }

    const addressData = {
      ...formData,
      zip_code: cleanZip.replace(/(\d{5})(\d{3})/, '$1-$2'),
    }

    try {
      if (editingAddress) {
        const success = await updateAddress(editingAddress.id, addressData)
        if (success) {
          handleCloseDialog()
        }
      } else {
        const newAddress = await createAddress(addressData)
        if (newAddress) {
          onAddressSelect(newAddress)
          handleCloseDialog()
        }
      }
    } catch (error) {
      console.error('Error saving address:', error)
    }
  }

  const handleDelete = async (addressId: string) => {
    if (confirm('Tem certeza que deseja excluir este endereço?')) {
      await deleteAddress(addressId)
    }
  }

  const formatAddress = (address: CustomerAddress) => {
    return `${address.street}, ${address.number}${address.complement ? `, ${address.complement}` : ''} - ${address.neighborhood}, ${address.city}/${address.state} - ${address.zip_code}`
  }

  // Show login message for non-authenticated users
  if (!customer?.id) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Endereço de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Faça login para gerenciar seus endereços de entrega
            </p>
            <CustomerLoginModal
              trigger={
                <Button>
                  Fazer Login
                </Button>
              }
              onSuccess={() => {
                toast.success('Login realizado com sucesso!')
                // O hook useAddresses carregará automaticamente os endereços
              }}
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Endereço de Entrega
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {addresses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Você ainda não possui endereços cadastrados</p>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Endereço
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingAddress ? 'Editar Endereço' : 'Novo Endereço'}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="name">Nome do destinatário *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="col-span-1">
                      <Label htmlFor="zip_code">CEP *</Label>
                      <Input
                        id="zip_code"
                        placeholder="00000-000"
                        value={formData.zip_code}
                        onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="col-span-1">
                      <Label htmlFor="state">Estado *</Label>
                      <Select value={formData.state} onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATES.map(state => (
                            <SelectItem key={state.code} value={state.code}>
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="neighborhood">Bairro *</Label>
                      <Input
                        id="neighborhood"
                        value={formData.neighborhood}
                        onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="col-span-1">
                      <Label htmlFor="street">Rua *</Label>
                      <Input
                        id="street"
                        value={formData.street}
                        onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="col-span-1">
                      <Label htmlFor="number">Número *</Label>
                      <Input
                        id="number"
                        value={formData.number}
                        onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        placeholder="Apto, casa, etc."
                        value={formData.complement}
                        onChange={(e) => setFormData(prev => ({ ...prev, complement: e.target.value }))}
                      />
                    </div>

                    <div className="col-span-1">
                      <Label htmlFor="label">Identificação</Label>
                      <Select value={formData.label} onValueChange={(value) => setFormData(prev => ({ ...prev, label: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Casa">Casa</SelectItem>
                          <SelectItem value="Trabalho">Trabalho</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-1 flex items-end">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_default"
                          checked={formData.is_default}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: !!checked }))}
                        />
                        <Label htmlFor="is_default" className="text-sm">Endereço padrão</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleCloseDialog} className="flex-1">
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1">
                      {editingAddress ? 'Atualizar' : 'Cadastrar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <>
            <RadioGroup
              value={selectedAddress?.id || ''}
              onValueChange={(value) => {
                const address = addresses.find(addr => addr.id === value)
                if (address) {
                  onAddressSelect(address)
                }
              }}
            >
              {addresses.map((address) => (
                <div key={address.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={address.id} className="cursor-pointer">
                      <div className="font-medium flex items-center gap-2">
                        {address.label}
                        {address.is_default && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            Padrão
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <div>{address.name}</div>
                        <div>{formatAddress(address)}</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenDialog(address)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(address.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </RadioGroup>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Endereço
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingAddress ? 'Editar Endereço' : 'Novo Endereço'}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="name">Nome do destinatário *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="col-span-1">
                      <Label htmlFor="zip_code">CEP *</Label>
                      <Input
                        id="zip_code"
                        placeholder="00000-000"
                        value={formData.zip_code}
                        onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="col-span-1">
                      <Label htmlFor="state">Estado *</Label>
                      <Select value={formData.state} onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATES.map(state => (
                            <SelectItem key={state.code} value={state.code}>
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="neighborhood">Bairro *</Label>
                      <Input
                        id="neighborhood"
                        value={formData.neighborhood}
                        onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="col-span-1">
                      <Label htmlFor="street">Rua *</Label>
                      <Input
                        id="street"
                        value={formData.street}
                        onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="col-span-1">
                      <Label htmlFor="number">Número *</Label>
                      <Input
                        id="number"
                        value={formData.number}
                        onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        placeholder="Apto, casa, etc."
                        value={formData.complement}
                        onChange={(e) => setFormData(prev => ({ ...prev, complement: e.target.value }))}
                      />
                    </div>

                    <div className="col-span-1">
                      <Label htmlFor="label">Identificação</Label>
                      <Select value={formData.label} onValueChange={(value) => setFormData(prev => ({ ...prev, label: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Casa">Casa</SelectItem>
                          <SelectItem value="Trabalho">Trabalho</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-1 flex items-end">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_default"
                          checked={formData.is_default}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: !!checked }))}
                        />
                        <Label htmlFor="is_default" className="text-sm">Endereço padrão</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleCloseDialog} className="flex-1">
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1">
                      {editingAddress ? 'Atualizar' : 'Cadastrar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </>
        )}
      </CardContent>
    </Card>
  )
}
