"use client";

import { useState } from "react";
import { useCustomerAuth } from "@/components/auth/CustomerAuthProvider";
import { ProfileHeader } from "@/components/(shop)/minha-conta/components/ProfileHeader";
import { ProfileForm } from "@/components/(shop)/minha-conta/components/ProfileForm";
import { AddressCard } from "@/components/(shop)/minha-conta/components/AddressCard";
import { AddressForm } from "@/components/(shop)/minha-conta/components/AddressForm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useCustomerAddresses } from "@/components/(shop)/minha-conta/hooks/useCustomerAddresses";
import { Tables } from "@/types/database";

type CustomerAddress = Tables<"customer_addresses">;

export default function PerfilPage() {
  const { user, loading: authLoading } = useCustomerAuth();
  const { addresses, loading: addressesLoading, createAddress, updateAddress, deleteAddress, setDefaultAddress } = useCustomerAddresses();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso restrito</h1>
          <p className="text-gray-600">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    );
  }

  const handleAddressSubmit = async (addressData: {
    name: string;
    label: string;
    zip_code: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    is_default: boolean;
  }) => {
    try {
      if (editingAddress) {
        await updateAddress(editingAddress, addressData);
      } else {
        await createAddress(addressData);
      }
      setShowAddressForm(false);
      setEditingAddress(null);
    } catch (error) {
      console.error("Erro ao salvar endereço:", error);
    }
  };

  const handleEditAddress = (addressId: string) => {
    setEditingAddress(addressId);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      await deleteAddress(addressId);
    } catch (error) {
      console.error("Erro ao deletar endereço:", error);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      await setDefaultAddress(addressId);
    } catch (error) {
      console.error("Erro ao definir endereço padrão:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProfileHeader user={user} />

        <Tabs defaultValue="dados" className="mt-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="enderecos">Endereços</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <ProfileForm user={user} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enderecos" className="mt-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Meus Endereços</h2>
                <Button
                  onClick={() => setShowAddressForm(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Endereço
                </Button>
              </div>

              {showAddressForm && (
                <Card>
                  <CardContent className="p-6">
                    <AddressForm
                      address={editingAddress ? addresses.find((addr: CustomerAddress) => addr.id === editingAddress) : undefined}
                      onSubmit={handleAddressSubmit}
                      onCancel={() => {
                        setShowAddressForm(false);
                        setEditingAddress(null);
                      }}
                      loading={false}
                    />
                  </CardContent>
                </Card>
              )}

              {addressesLoading ? (
                <div className="text-center py-8">
                  <div className="text-gray-600">Carregando endereços...</div>
                </div>
              ) : addresses.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-600 mb-4">Você ainda não possui endereços cadastrados.</p>
                    <Button onClick={() => setShowAddressForm(true)} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Adicionar Primeiro Endereço
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {addresses.map((address: CustomerAddress) => (
                    <AddressCard
                      key={address.id}
                      address={address}
                      onEdit={() => handleEditAddress(address.id)}
                      onDelete={() => handleDeleteAddress(address.id)}
                      onSetDefault={() => handleSetDefaultAddress(address.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
