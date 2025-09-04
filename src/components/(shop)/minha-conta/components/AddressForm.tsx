"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tables } from "@/types/database";
import { Loader2, Save, X, MapPin } from "lucide-react";
import { toast } from "sonner";

type CustomerAddress = Tables<"customer_addresses">;

interface AddressFormProps {
  address?: CustomerAddress;
  onSubmit: (data: AddressFormData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

interface AddressFormData {
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
}

const STATES = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

const ADDRESS_LABELS = [
  { value: "Casa", label: "Casa" },
  { value: "Trabalho", label: "Trabalho" },
  { value: "Favorito", label: "Favorito" },
  { value: "Outro", label: "Outro" },
];

export function AddressForm({ address, onSubmit, onCancel, loading }: AddressFormProps) {
  const [formData, setFormData] = useState<AddressFormData>({
    name: "",
    label: "Casa",
    zip_code: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    is_default: false,
  });

  const [errors, setErrors] = useState<Partial<AddressFormData>>({});
  const [cepLoading, setCepLoading] = useState(false);

  useEffect(() => {
    if (address) {
      setFormData({
        name: address.name || "",
        label: address.label || "Casa",
        zip_code: address.zip_code || "",
        street: address.street || "",
        number: address.number || "",
        complement: address.complement || "",
        neighborhood: address.neighborhood || "",
        city: address.city || "",
        state: address.state || "",
        is_default: address.is_default || false,
      });
    }
  }, [address]);

  const validateForm = (): boolean => {
    const newErrors: Partial<AddressFormData> = {};

    if (!formData.name.trim()) newErrors.name = "Nome é obrigatório";
    if (!formData.label.trim()) newErrors.label = "Etiqueta é obrigatória";
    if (!formData.zip_code.trim()) newErrors.zip_code = "CEP é obrigatório";
    if (!formData.street.trim()) newErrors.street = "Rua é obrigatória";
    if (!formData.number.trim()) newErrors.number = "Número é obrigatório";
    if (!formData.neighborhood.trim()) newErrors.neighborhood = "Bairro é obrigatório";
    if (!formData.city.trim()) newErrors.city = "Cidade é obrigatória";
    if (!formData.state.trim()) newErrors.state = "Estado é obrigatório";

    // Validar CEP
    const cepRegex = /^\d{5}-?\d{3}$/;
    if (formData.zip_code && !cepRegex.test(formData.zip_code)) {
      newErrors.zip_code = "CEP deve ter o formato 00000-000";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof AddressFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{5})(\d{3})/, "$1-$2");
  };

  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    
    if (cleanCep.length !== 8) return;

    try {
      setCepLoading(true);
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }

      setFormData(prev => ({
        ...prev,
        street: data.logradouro || "",
        neighborhood: data.bairro || "",
        city: data.localidade || "",
        state: data.uf || "",
      }));

      toast.success("Endereço encontrado!");
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast.error("Erro ao buscar CEP");
    } finally {
      setCepLoading(false);
    }
  };

  const handleCepChange = (value: string) => {
    const formattedCep = formatCep(value);
    handleInputChange("zip_code", formattedCep);
    
    const cleanCep = value.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      fetchAddressByCep(cleanCep);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Erro ao salvar endereço:", error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          {address ? "Editar Endereço" : "Novo Endereço"}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Destinatário *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Nome completo"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Etiqueta *</Label>
            <Select
              value={formData.label}
              onValueChange={(value) => handleInputChange("label", value)}
            >
              <SelectTrigger className={errors.label ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecione uma etiqueta" />
              </SelectTrigger>
              <SelectContent>
                {ADDRESS_LABELS.map((label) => (
                  <SelectItem key={label.value} value={label.value}>
                    {label.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.label && <p className="text-sm text-red-600">{errors.label}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="zip_code">CEP *</Label>
            <div className="relative">
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => handleCepChange(e.target.value)}
                placeholder="00000-000"
                className={errors.zip_code ? "border-red-500" : ""}
                maxLength={9}
              />
              {cepLoading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin" />
              )}
            </div>
            {errors.zip_code && <p className="text-sm text-red-600">{errors.zip_code}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="street">Rua *</Label>
            <Input
              id="street"
              value={formData.street}
              onChange={(e) => handleInputChange("street", e.target.value)}
              placeholder="Nome da rua"
              className={errors.street ? "border-red-500" : ""}
            />
            {errors.street && <p className="text-sm text-red-600">{errors.street}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="number">Número *</Label>
            <Input
              id="number"
              value={formData.number}
              onChange={(e) => handleInputChange("number", e.target.value)}
              placeholder="123"
              className={errors.number ? "border-red-500" : ""}
            />
            {errors.number && <p className="text-sm text-red-600">{errors.number}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="complement">Complemento</Label>
            <Input
              id="complement"
              value={formData.complement}
              onChange={(e) => handleInputChange("complement", e.target.value)}
              placeholder="Apartamento, casa, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="neighborhood">Bairro *</Label>
            <Input
              id="neighborhood"
              value={formData.neighborhood}
              onChange={(e) => handleInputChange("neighborhood", e.target.value)}
              placeholder="Nome do bairro"
              className={errors.neighborhood ? "border-red-500" : ""}
            />
            {errors.neighborhood && <p className="text-sm text-red-600">{errors.neighborhood}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Cidade *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
              placeholder="Nome da cidade"
              className={errors.city ? "border-red-500" : ""}
            />
            {errors.city && <p className="text-sm text-red-600">{errors.city}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">Estado *</Label>
            <Select
              value={formData.state}
              onValueChange={(value) => handleInputChange("state", value)}
            >
              <SelectTrigger className={errors.state ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                {STATES.map((state) => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.state && <p className="text-sm text-red-600">{errors.state}</p>}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_default"
            checked={formData.is_default}
            onCheckedChange={(checked) => handleInputChange("is_default", checked)}
          />
          <Label htmlFor="is_default">Definir como endereço padrão</Label>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {loading ? "Salvando..." : "Salvar Endereço"}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}