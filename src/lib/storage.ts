import { toast } from "sonner";
import { createAdminClient } from "./supabase";

export const STORAGE_CONFIG = {
  BUCKETS: {
    PRODUCT_IMAGES: "product-images",
  },
  POLICIES: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    MAX_IMAGES_PER_PRODUCT: 10,
  },
};

// Initialize storage - check if bucket exists and is accessible
export async function initializeStorage() {
  try {
    const supabase = createAdminClient();
    // First, try to access the bucket directly (most reliable test)
    const { error: testError } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKETS.PRODUCT_IMAGES)
      .list("", { limit: 1 });

    if (testError) {
      if (testError.message.includes("Bucket not found")) {
        console.warn(`
Bucket '${STORAGE_CONFIG.BUCKETS.PRODUCT_IMAGES}' não encontrado!

Para configurar o storage, siga os passos em STORAGE_SETUP.md:
1. Crie o bucket manualmente no Dashboard do Supabase
2. Configure as políticas RLS conforme documentado

O upload de imagens não funcionará até que o bucket seja criado.
        `);
        return { success: false, error: "Bucket not found" };
      }

      // Other errors might indicate permission issues but bucket exists
      console.warn(
        "Storage bucket exists but access may be limited:",
        testError.message
      );
      return { success: true, warning: "Limited access due to RLS policies" };
    }

    // If we reach here, bucket exists and is accessible
    // Only log success in development mode
    if (process.env.NODE_ENV === "development") {
      // console.log('Storage configurado corretamente - bucket acessível')
    }

    return { success: true };
  } catch (error) {
    console.error("Error initializing storage:", error);
    return { success: false, error: "Unknown error" };
  }
}

// Test storage configuration and permissions
export async function testStorageSetup() {
  // console.log('Testing storage setup...')

  const init = await initializeStorage();

  if (!init.success) {
    // console.error('Storage initialization failed:', init.error)
    return false;
  }

  if (init.warning) {
    console.warn("Storage warning:", init.warning);
  }

  // Test upload permissions by creating a test file
  try {
    const supabase = createAdminClient();
    const testFile = new File(["test"], "test.txt", { type: "text/plain" });
    const testPath = "test/setup-test.txt";

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKETS.PRODUCT_IMAGES)
      .upload(testPath, testFile, { upsert: true });

    if (uploadError) {
      console.warn(
        "Upload test failed (this is expected if RLS is configured):",
        uploadError.message
      );
      return true; // This is actually expected with RLS
    }

    // Clean up test file
    await supabase.storage
      .from(STORAGE_CONFIG.BUCKETS.PRODUCT_IMAGES)
      .remove([testPath]);

    // console.log('Storage setup test completed successfully')
    return true;
  } catch (error) {
    console.error("Storage test failed:", error);
    return false;
  }
}

// Setup storage policies for secure access (Note: apply these manually in Supabase Dashboard)
export function getStoragePolicyQueries() {
  return {
    // Policy for public read access to product images
    publicReadPolicy: `
      CREATE POLICY "Public read access for product images" ON storage.objects
      FOR SELECT USING (bucket_id = '${STORAGE_CONFIG.BUCKETS.PRODUCT_IMAGES}');
    `,

    // Policy for authenticated users to upload images
    authenticatedUploadPolicy: `
      CREATE POLICY "Authenticated users can upload product images" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = '${STORAGE_CONFIG.BUCKETS.PRODUCT_IMAGES}'
        AND auth.role() = 'authenticated'
      );
    `,

    // Policy for authenticated users to update their uploads
    authenticatedUpdatePolicy: `
      CREATE POLICY "Authenticated users can update product images" ON storage.objects
      FOR UPDATE USING (
        bucket_id = '${STORAGE_CONFIG.BUCKETS.PRODUCT_IMAGES}'
        AND auth.role() = 'authenticated'
      );
    `,

    // Policy for authenticated users to delete their uploads
    authenticatedDeletePolicy: `
      CREATE POLICY "Authenticated users can delete product images" ON storage.objects
      FOR DELETE USING (
        bucket_id = '${STORAGE_CONFIG.BUCKETS.PRODUCT_IMAGES}'
        AND auth.role() = 'authenticated'
      );
    `,
  };
}

// Helper function to generate image URL
export function getProductImageUrl(path: string): string {
  try {
    const supabase = createAdminClient();
    const { data } = supabase.storage
      .from(STORAGE_CONFIG.BUCKETS.PRODUCT_IMAGES)
      .getPublicUrl(path);

    if (!data.publicUrl) {
      console.error("Failed to generate public URL for path:", path);
      return "";
    }

    return data.publicUrl;
  } catch (error) {
    console.error("Error generating public URL:", error);
    return "";
  }
}

// Helper function to generate optimized image URL (with transformations)
export function getOptimizedImageUrl(
  path: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
  }
): string {
  try {
    const supabase = createAdminClient();
    const { data } = supabase.storage
      .from(STORAGE_CONFIG.BUCKETS.PRODUCT_IMAGES)
      .getPublicUrl(path, {
        transform: {
          width: options?.width,
          height: options?.height,
          quality: options?.quality || 80,
        },
      });

    return data.publicUrl || getProductImageUrl(path);
  } catch (error) {
    console.error("Error generating optimized URL:", error);
    return getProductImageUrl(path);
  }
}

// Helper function to delete image
export async function deleteProductImage(path: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKETS.PRODUCT_IMAGES)
      .remove([path]);

    if (error) {
      console.error("Error deleting image:", error.message);
      return false;
    }

    return true;
  } catch (_error) {
    console.error("Error deleting image:", _error);
    return false;
  }
}

// Helper function to upload image with progress tracking
export async function uploadProductImage(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Validate file
    if (!STORAGE_CONFIG.POLICIES.ALLOWED_TYPES.includes(file.type)) {
      return {
        success: false,
        error: "Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.",
      };
    }

    if (file.size > STORAGE_CONFIG.POLICIES.MAX_FILE_SIZE) {
      const sizeMB = Math.round((file.size / (1024 * 1024)) * 100) / 100;
      return {
        success: false,
        error: `Arquivo muito grande (${sizeMB}MB). Tamanho máximo: 5MB.`,
      };
    }

    // Start progress tracking
    onProgress?.(0);

    // Simulate progressive upload for better UX
    const progressInterval = setInterval(() => {
      // Simulate progress up to 90% before actual completion
      const currentProgress = Math.min(90, Math.random() * 30 + 10);
      onProgress?.(currentProgress);
    }, 200);

    try {
      const supabase = createAdminClient();
      // Upload file with upsert to handle duplicates
      const { data, error } = await supabase.storage
        .from(STORAGE_CONFIG.BUCKETS.PRODUCT_IMAGES)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: true, // Allow overwriting existing files
          contentType: file.type,
        });

      clearInterval(progressInterval);

      if (error) {
        console.error("Supabase upload error:", error);

        // Handle specific error types
        if (error.message.includes("Bucket not found")) {
          return {
            success: false,
            error:
              "Bucket de imagens não encontrado. Verifique a configuração do storage.",
          };
        }

        if (error.message.includes("new row violates row-level security")) {
          return {
            success: false,
            error: "Sem permissão para upload. Faça login novamente.",
          };
        }

        return {
          success: false,
          error: error.message || "Erro ao fazer upload",
        };
      }

      if (!data?.path) {
        return {
          success: false,
          error: "Erro: dados de upload inválidos",
        };
      }

      // Complete progress
      onProgress?.(100);

      // Get public URL
      const url = getProductImageUrl(data.path);

      // Verify URL is accessible (basic check)
      if (!url) {
        return {
          success: false,
          error: "Erro ao gerar URL da imagem",
        };
      }

      // console.log('Image uploaded successfully:', { path: data.path, url })
      toast.success("Imagem enviada com sucesso!", {
        description: "A imagem foi enviada e está disponível.",
      });

      return {
        success: true,
        url,
      };
    } catch (uploadError) {
      clearInterval(progressInterval);
      throw uploadError;
    }
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro desconhecido no upload",
    };
  }
}
