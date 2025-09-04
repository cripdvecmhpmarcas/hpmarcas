import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSupabaseAdmin } from "@/hooks/useSupabaseAdmin";
import {
  ProductFormData,
  ProductVolume,
  PRODUCT_CATEGORIES,
  DEFAULT_SHIPPING_DIMENSIONS,
} from "@/types/products";
import { generateSKU, validateBarcode, validatePrice } from "@/lib/pdv-utils";

export interface UseProductFormReturn {
  formData: ProductFormData;
  loading: boolean;
  saving: boolean;
  error: string | null;
  validationErrors: Record<string, string>;
  isEditing: boolean;
  setFormData: (data: Partial<ProductFormData>) => void;
  addVolume: (volume: ProductVolume) => void;
  removeVolume: (index: number) => void;
  updateVolume: (index: number, volume: ProductVolume) => void;
  cleanEmptyVolumes: () => void;
  generateNewSKU: () => void;
  validateForm: () => boolean;
  saveProduct: (
    uploadPendingImages?: (productId: string) => Promise<string[]>
  ) => Promise<boolean>;
  loadProduct: (id: string) => Promise<void>;
  resetForm: () => void;
  handleImageUpload: (images: string[]) => void;
}

const DEFAULT_FORM_DATA: ProductFormData = {
  name: "",
  description: "",
  brand: "",
  category: "",
  subcategory_id: "",
  sku: "",
  barcode: "",
  cost: 0,
  wholesale_price: 0,
  retail_price: 0,
  stock: 0,
  min_stock: 5,
  status: "active",
  images: [],
  volumes: [],
  // Shipping dimensions using ShippingData structure
  shipping_data: {
    weight: DEFAULT_SHIPPING_DIMENSIONS.weight,
    length: DEFAULT_SHIPPING_DIMENSIONS.length,
    width: DEFAULT_SHIPPING_DIMENSIONS.width,
    height: DEFAULT_SHIPPING_DIMENSIONS.height,
  },
};

interface ValidationRule {
  required: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

const VALIDATION_RULES: Record<string, ValidationRule> = {
  name: { required: true, minLength: 2, maxLength: 200 },
  brand: { required: true, minLength: 2, maxLength: 100 },
  sku: { required: true, minLength: 3, maxLength: 50 },
  barcode: { required: false, minLength: 8, maxLength: 20 },
  cost: { required: true, min: 0, max: 999999.99 },
  wholesale_price: { required: true, min: 0, max: 999999.99 },
  retail_price: { required: true, min: 0, max: 999999.99 },
  stock: { required: true, min: 0, max: 999999 },
  min_stock: { required: true, min: 0, max: 999999 },
};

export function useProductForm(productId?: string): UseProductFormReturn {
  const router = useRouter();
  const [formData, setFormDataState] =
    useState<ProductFormData>(DEFAULT_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const isEditing = Boolean(productId);

  // Supabase client
  const supabase = useSupabaseAdmin();

  // Toast helper function
  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      if (type === "success") {
        toast.success(message);
      } else {
        toast.error(message);
      }
    },
    []
  );

  const setFormData = useCallback((data: Partial<ProductFormData>) => {
    setFormDataState((prev) => ({ ...prev, ...data }));
    // Clear validation errors for updated fields
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(data).forEach((key) => {
        delete newErrors[key];
      });
      return newErrors;
    });
  }, []);

  const addVolume = useCallback(
    (volume: ProductVolume) => {
      // Only add volume if it has at least size and unit
      if (volume.size && volume.unit) {
        setFormData({ volumes: [...formData.volumes, volume] });
      }
    },
    [formData.volumes, setFormData]
  );

  const removeVolume = useCallback(
    (index: number) => {
      const newVolumes = formData.volumes.filter((_, i) => i !== index);
      setFormData({ volumes: newVolumes });
    },
    [formData.volumes, setFormData]
  );

  const updateVolume = useCallback(
    (index: number, volume: ProductVolume) => {
      const newVolumes = [...formData.volumes];
      newVolumes[index] = volume;
      setFormData({ volumes: newVolumes });
    },
    [formData.volumes, setFormData]
  );

  const cleanEmptyVolumes = useCallback(() => {
    const cleanVolumes = formData.volumes.filter((volume) => {
      const isEmpty =
        !volume.size &&
        !volume.unit &&
        !volume.barcode &&
        (!volume.price_adjustment || volume.price_adjustment === 0);
      return !isEmpty;
    });
    if (cleanVolumes.length !== formData.volumes.length) {
      setFormData({ volumes: cleanVolumes });
    }
  }, [formData.volumes, setFormData]);

  const generateNewSKU = useCallback(() => {
    const newSKU = generateSKU("PROD");
    setFormData({ sku: newSKU });
  }, [setFormData]);

  const validateForm = useCallback(
    (skipEmptyVolumes = false): boolean => {
      // console.log('Validando formulário completo...', formData)
      const errors: Record<string, string> = {};

      // Validate required fields
      Object.entries(VALIDATION_RULES).forEach(([field, rules]) => {
        const value = formData[field as keyof ProductFormData];
        // console.log(`Campo ${field}:`, value, 'regras:', rules)

        if (rules.required && (!value || value === "")) {
          errors[field] = `${
            field === "name"
              ? "Nome"
              : field === "brand"
              ? "Marca"
              : field === "sku"
              ? "SKU"
              : field === "cost"
              ? "Custo"
              : field === "wholesale_price"
              ? "Preço atacado"
              : field === "retail_price"
              ? "Preço varejo"
              : field === "stock"
              ? "Estoque"
              : field === "min_stock"
              ? "Estoque mínimo"
              : field
          } é obrigatório`;
          return;
        }

        if (typeof value === "string" && value) {
          if (rules.minLength && value.length < rules.minLength) {
            errors[field] = `Deve ter pelo menos ${rules.minLength} caracteres`;
          }
          if (rules.maxLength && value.length > rules.maxLength) {
            errors[field] = `Deve ter no máximo ${rules.maxLength} caracteres`;
          }
        }

        if (typeof value === "number") {
          if (rules.min !== undefined && value < rules.min) {
            errors[field] = `Valor mínimo é ${rules.min}`;
          }
          if (rules.max !== undefined && value > rules.max) {
            errors[field] = `Valor máximo é ${rules.max}`;
          }
        }
      });

      // Validate barcode if provided
      if (formData.barcode) {
        const barcodeValidation = validateBarcode(formData.barcode);
        if (!barcodeValidation.valid) {
          errors.barcode = barcodeValidation.message;
        }
      }

      // Validate prices
      const costValidation = validatePrice(formData.cost);
      if (!costValidation.valid) {
        errors.cost = costValidation.message;
      }

      const wholesaleValidation = validatePrice(formData.wholesale_price);
      if (!wholesaleValidation.valid) {
        errors.wholesale_price = wholesaleValidation.message;
      }

      const retailValidation = validatePrice(formData.retail_price);
      if (!retailValidation.valid) {
        errors.retail_price = retailValidation.message;
      }

      // Business logic validations
      if (formData.wholesale_price > formData.retail_price) {
        errors.wholesale_price =
          "Preço atacado não pode ser maior que o preço varejo";
      }

      if (formData.cost > formData.wholesale_price) {
        errors.cost = "Custo não pode ser maior que o preço atacado";
      }

      // Validate category - either subcategory_id OR legacy category must be provided
      if (!formData.subcategory_id && !formData.category) {
        errors.category = "Categoria é obrigatória";
      } else if (formData.category && !formData.subcategory_id) {
        // Only validate legacy category if it's being used (no subcategory selected)
        if (
          !PRODUCT_CATEGORIES.includes(
            formData.category as (typeof PRODUCT_CATEGORIES)[number]
          )
        ) {
          errors.category = "Categoria inválida";
        }
      }

      // Validate volumes (only validate non-empty volumes or skip if requested)
      if (!skipEmptyVolumes) {
        formData.volumes.forEach((volume, index) => {
          // Skip validation for completely empty volumes
          const isEmpty =
            !volume.size &&
            !volume.unit &&
            !volume.barcode &&
            (!volume.price_adjustment || volume.price_adjustment === 0);

          if (!isEmpty) {
            if (!volume.size || !volume.unit) {
              errors[`volume_${index}`] = "Tamanho e unidade são obrigatórios";
            }
            if (volume.barcode && !validateBarcode(volume.barcode).valid) {
              errors[`volume_${index}_barcode`] = "Código de barras inválido";
            }
          }
        });
      }

      setValidationErrors(errors);
      // console.log('Resultado da validação:', { errors, isValid: Object.keys(errors).length === 0 })
      return Object.keys(errors).length === 0;
    },
    [formData]
  );

  const checkSKUExists = useCallback(
    async (sku: string, excludeId?: string): Promise<boolean> => {
      let query = supabase.from("products").select("id").eq("sku", sku);
      if (excludeId) {
        query = query.neq("id", excludeId);
      }
      const { data } = await query;
      return (data?.length || 0) > 0;
    },
    [supabase]
  );

  const checkBarcodeExists = useCallback(
    async (barcode: string, excludeId?: string): Promise<boolean> => {
      if (!barcode) return false;
      let query = supabase.from("products").select("id").eq("barcode", barcode);
      if (excludeId) {
        query = query.neq("id", excludeId);
      }
      const { data } = await query;
      return (data?.length || 0) > 0;
    },
    [supabase]
  );

  const saveProduct = useCallback(
    async (
      uploadPendingImages?: (productId: string) => Promise<string[]>
    ): Promise<boolean> => {
      // console.log('Iniciando salvamento do produto...', { formData, isEditing, productId })

      try {
        setSaving(true);
        setError(null);

        // Clean up volumes - remove empty ones
        const cleanVolumes = formData.volumes.filter((volume) => {
          const isEmpty =
            !volume.size &&
            !volume.unit &&
            !volume.barcode &&
            (!volume.price_adjustment || volume.price_adjustment === 0);
          return !isEmpty;
        });

        // Validate form (skip empty volumes validation since we're cleaning them)
        // console.log('Validando formulário...')
        if (!validateForm(true)) {
          // console.log('Validação falhou:', validationErrors)
          showToast("Por favor, corrija os erros no formulário", "error");
          return false;
        }
        // console.log('Formulário válido')

        // Check for duplicate SKU
        // console.log('Verificando SKU duplicado...')
        const skuExists = await checkSKUExists(formData.sku, productId);
        if (skuExists) {
          // console.log('SKU já existe:', formData.sku)
          setValidationErrors({ sku: "SKU já existe" });
          showToast("SKU já existe no sistema", "error");
          return false;
        }

        // Check for duplicate barcode
        if (formData.barcode) {
          // console.log('Verificando código de barras duplicado...')
          const barcodeExists = await checkBarcodeExists(
            formData.barcode,
            productId
          );
          if (barcodeExists) {
            toast.info(`Código de barras já existe: ${formData.barcode}`);
            setValidationErrors({ barcode: "Código de barras já existe" });
            showToast("Código de barras já existe no sistema", "error");
            return false;
          }
        }

        // First, save the product to get an ID for image uploads
        const baseData = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          brand: formData.brand.trim(),
          category: formData.category,
          subcategory_id: formData.subcategory_id || null,
          sku: formData.sku.trim().toUpperCase(),
          cost: formData.cost,
          wholesale_price: formData.wholesale_price,
          retail_price: formData.retail_price,
          stock: formData.stock,
          min_stock: formData.min_stock,
          status: formData.status,
          // Shipping dimensions using ShippingData structure
          weight: formData.shipping_data?.weight || null,
          length: formData.shipping_data?.length || null,
          width: formData.shipping_data?.width || null,
          height: formData.shipping_data?.height || null,
          updated_at: new Date().toISOString(),
        };

        const productDataWithoutImages = {
          ...baseData,
          ...(formData.barcode.trim() && { barcode: formData.barcode.trim() }),
          ...(cleanVolumes.length > 0 && {
            volumes: JSON.stringify(cleanVolumes),
          }),
        };

        let savedProductId = productId;
        let result;

        if (isEditing && productId) {
          // Remove updated_at for updates - let Supabase handle it
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { updated_at, ...updateData } = productDataWithoutImages;

          result = await supabase
            .from("products")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .update(updateData as any)
            .eq("id", productId)
            .select("id")
            .single();
        } else {
          // For inserts - remove updated_at, let Supabase handle timestamps
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { updated_at, ...insertData } = productDataWithoutImages;

          result = await supabase
            .from("products")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .insert(insertData as any)
            .select("id")
            .single();
        }

        if (result.error) {
          // console.log('Erro do Supabase:', result.error)
          throw result.error;
        }

        // Get the product ID (for new products)
        if (!isEditing && result.data?.id) {
          savedProductId = result.data.id;
          // console.log('Produto criado com ID:', savedProductId)
        }

        // Now upload pending images if there are any
        let finalImageUrls: string[] = formData.images;

        if (uploadPendingImages && savedProductId) {
          // console.log('Fazendo upload das imagens pendentes...')
          try {
            finalImageUrls = await uploadPendingImages(savedProductId);
            // console.log('Upload de imagens concluído. URLs finais:', finalImageUrls)
            toast.success("Imagens carregadas com sucesso!");
          } catch {
            // console.error('Erro no upload das imagens')
            // Continue mesmo se o upload de imagens falhar
            showToast(
              "Produto salvo, mas houve erro no upload de algumas imagens",
              "error"
            );
          }
        }

        // Update product with image URLs if we have any
        if (finalImageUrls.length > 0 && savedProductId) {
          // console.log('Atualizando produto com URLs das imagens...')
          const { error: updateImageError } = await supabase
            .from("products")
            .update({ images: finalImageUrls })
            .eq("id", savedProductId);

          if (updateImageError) {
            // console.error('Erro ao atualizar URLs das imagens:', updateImageError)
            showToast(
              "Produto salvo, mas houve erro ao salvar as imagens",
              "error"
            );
          } else {
            // console.log('URLs das imagens salvas no produto')
          }
        }

        toast.success("Produto salvo com sucesso!");
        showToast(
          `Produto ${isEditing ? "atualizado" : "criado"} com sucesso!`,
          "success"
        );

        // Redirect to products list
        // console.log('Redirecionando para lista de produtos...')
        router.push("/dashboard/produtos");
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao salvar produto";
        setError(message);
        showToast(message, "error");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [
      formData,
      isEditing,
      productId,
      validateForm,
      checkSKUExists,
      showToast,
      router,
      checkBarcodeExists,
      supabase,
    ]
  );

  const loadProduct = useCallback(
    async (id: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Produto não encontrado");

        // Process volumes
        let volumes: ProductVolume[] = [];
        if (data.volumes) {
          try {
            volumes = Array.isArray(data.volumes)
              ? data.volumes
              : JSON.parse(data.volumes as string);
          } catch (e) {
            console.warn("Error parsing volumes:", e);
            volumes = [];
          }
        }

        const productData: ProductFormData = {
          name: data.name || "",
          description: data.description || "",
          brand: data.brand || "",
          category: data.category || "",
          subcategory_id: data.subcategory_id || "",
          sku: data.sku || "",
          barcode: data.barcode || "",
          cost: data.cost || 0,
          wholesale_price: data.wholesale_price || 0,
          retail_price: data.retail_price || 0,
          stock: data.stock || 0,
          min_stock: data.min_stock || 5,
          status: (data.status as "active" | "inactive") || "active",
          images: Array.isArray(data.images) ? data.images : [],
          volumes,
          // Shipping dimensions using ShippingData structure with fallback to defaults
          shipping_data: {
            weight: data.weight ?? DEFAULT_SHIPPING_DIMENSIONS.weight,
            length: data.length ?? DEFAULT_SHIPPING_DIMENSIONS.length,
            width: data.width ?? DEFAULT_SHIPPING_DIMENSIONS.width,
            height: data.height ?? DEFAULT_SHIPPING_DIMENSIONS.height,
          },
        };

        setFormDataState(productData);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao carregar produto";
        setError(message);
        showToast(message, "error");
      } finally {
        setLoading(false);
      }
    },
    [showToast, supabase]
  );

  const resetForm = useCallback(() => {
    setFormDataState(DEFAULT_FORM_DATA);
    setValidationErrors({});
    setError(null);
  }, []);

  const handleImageUpload = useCallback(
    (images: string[]) => {
      // console.log('handleImageUpload chamado com:', images)
      // Note: This now only handles existing image URLs
      // New files are handled by the ImageUpload component internally
      setFormData({ images });
      // console.log('FormData.images após setFormData:', images)
    },
    [setFormData]
  );

  // Load product if editing
  useEffect(() => {
    if (productId) {
      loadProduct(productId);
    }
  }, [productId, loadProduct]);

  // Generate SKU for new products
  useEffect(() => {
    if (!isEditing && !formData.sku) {
      generateNewSKU();
    }
  }, [isEditing, formData.sku, generateNewSKU]);

  return {
    formData,
    loading,
    saving,
    error,
    validationErrors,
    isEditing,
    setFormData,
    addVolume,
    removeVolume,
    updateVolume,
    cleanEmptyVolumes,
    generateNewSKU,
    validateForm,
    saveProduct,
    loadProduct,
    resetForm,
    handleImageUpload,
  };
}
