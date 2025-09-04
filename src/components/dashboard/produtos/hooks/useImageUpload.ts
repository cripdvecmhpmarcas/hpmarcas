import { useState, useCallback } from "react";
import { useSupabaseAdmin } from "@/hooks/useSupabaseAdmin";
import { STORAGE_CONFIG, uploadProductImage } from "@/lib/storage";
import { toast } from "sonner";

export interface UploadedImage {
  file?: File; // Optional for existing images
  url: string; // Preview URL (blob: for new files, actual URL for existing)
  publicUrl?: string; // Final uploaded URL
  loading: boolean;
  progress?: number;
  error?: string;
  isExisting?: boolean; // True for images that already exist in the database
}

export interface UseImageUploadReturn {
  images: UploadedImage[];
  uploading: boolean;
  uploadProgress: number;
  uploadStatus: string;
  error: string | null;
  addFiles: (files: FileList | File[]) => void;
  removeImage: (index: number) => void;
  removeImageByUrl: (url: string) => void;
  clearImages: () => void;
  reorderImages: (fromIndex: number, toIndex: number) => void;
  getImageUrls: () => string[];
  uploadPendingFiles: (productId: string) => Promise<string[]>;
  getPendingFiles: () => File[];
  validateImageFile: (file: File) => { valid: boolean; error?: string };
}

const BUCKET_NAME = STORAGE_CONFIG.BUCKETS.PRODUCT_IMAGES;
const MAX_FILE_SIZE = STORAGE_CONFIG.POLICIES.MAX_FILE_SIZE;
const ALLOWED_TYPES = STORAGE_CONFIG.POLICIES.ALLOWED_TYPES;
const MAX_IMAGES = STORAGE_CONFIG.POLICIES.MAX_IMAGES_PER_PRODUCT;

export function useImageUpload(
  initialImages: string[] = []
): UseImageUploadReturn {
  const [images, setImages] = useState<UploadedImage[]>(() =>
    initialImages.map((url) => ({
      url,
      publicUrl: url,
      loading: false,
      isExisting: true,
    }))
  );
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Cliente Supabase
  const supabase = useSupabaseAdmin();

  // Check if bucket exists (don't auto-create due to RLS restrictions)
  const ensureBucket = useCallback(async () => {
    try {
      // Just try to list the bucket to check if it exists
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .list("", { limit: 1 });

      if (error && error.message.includes("Bucket not found")) {
        throw new Error(
          `Bucket '${BUCKET_NAME}' não encontrado. Configure o storage seguindo o STORAGE_SETUP.md`
        );
      }
    } catch (err) {
      console.error("Error checking bucket:", err);
      // Re-throw so upload fails with proper error message
      if (err instanceof Error) {
        throw err;
      }
      throw new Error("Erro ao verificar bucket de storage");
    }
  }, [supabase]);

  // Validate image file
  const validateImageFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return {
          valid: false,
          error: "Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.",
        };
      }

      if (file.size > MAX_FILE_SIZE) {
        return {
          valid: false,
          error: "Arquivo muito grande. O tamanho máximo é 5MB.",
        };
      }

      return { valid: true };
    },
    []
  );

  // Generate unique filename
  const generateFileName = useCallback((file: File): string => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split(".").pop();
    return `product_${timestamp}_${randomString}.${extension}`;
  }, []);

  // Upload single image
  const uploadSingleImage = useCallback(
    async (
      file: File,
      onProgress?: (progress: number) => void
    ): Promise<string> => {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const fileName = generateFileName(file);
      const filePath = `products/${fileName}`;

      const result = await uploadProductImage(file, filePath, onProgress);

      if (!result.success) {
        throw new Error(result.error || "Erro ao fazer upload");
      }

      return result.url!;
    },
    [validateImageFile, generateFileName]
  );

  // Add files for preview (don't upload yet)
  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      // Check total images limit
      if (images.length + fileArray.length > MAX_IMAGES) {
        const error = `Máximo de ${MAX_IMAGES} imagens permitidas`;
        setError(error);
        throw new Error(error);
      }

      setError(null);

      // Create preview images
      const newImages: UploadedImage[] = fileArray.map((file) => {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          return {
            file,
            url: URL.createObjectURL(file),
            loading: false,
            error: validation.error,
            isExisting: false,
          };
        }

        return {
          file,
          url: URL.createObjectURL(file), // Local preview URL
          loading: false,
          isExisting: false,
        };
      });

      // Add preview images to state
      setImages((prev) => [...prev, ...newImages]);
    },
    [images.length, validateImageFile]
  );

  // Get files that haven't been uploaded yet
  const getPendingFiles = useCallback((): File[] => {
    return images
      .filter(
        (img) => img.file && !img.isExisting && !img.publicUrl && !img.error
      )
      .map((img) => img.file!);
  }, [images]);

  // Upload all pending files when saving the product
  const uploadPendingFiles = useCallback(
    async (): Promise<string[]> => {
      const pendingFiles = getPendingFiles();

      if (pendingFiles.length === 0) {
        // Return only existing uploaded URLs
        return images
          .filter((img) => img.publicUrl && !img.error)
          .map((img) => img.publicUrl!);
      }

      setUploading(true);
      setError(null);
      setUploadProgress(0);
      setUploadStatus("Iniciando upload das imagens...");

      const uploadedUrls: string[] = [];

      try {
        // Ensure bucket exists before starting uploads
        await ensureBucket();

        // Get existing uploaded URLs first
        const existingUrls = images
          .filter((img) => img.publicUrl && !img.error)
          .map((img) => img.publicUrl!);

        uploadedUrls.push(...existingUrls);

        // Upload pending files one by one
        for (let i = 0; i < pendingFiles.length; i++) {
          const file = pendingFiles[i];
          const baseProgress = (i / pendingFiles.length) * 100;

          // Update progress at start of each file
          setUploadProgress(baseProgress);
          setUploadStatus(
            `Enviando ${file.name} (${i + 1}/${pendingFiles.length})...`
          );

          try {
            const publicUrl = await uploadSingleImage(file, (fileProgress) => {
              // Calculate overall progress
              const fileProgressContribution =
                fileProgress / pendingFiles.length;
              const totalProgress = baseProgress + fileProgressContribution;
              setUploadProgress(Math.min(100, totalProgress));

              // Update individual image progress
              setImages((prev) =>
                prev.map((img) => {
                  if (img.file === file && !img.isExisting) {
                    return {
                      ...img,
                      progress: fileProgress,
                      loading: true,
                    };
                  }
                  return img;
                })
              );
            });

            uploadedUrls.push(publicUrl);

            // Update the specific image with the result
            setImages((prev) =>
              prev.map((img) => {
                if (img.file === file && !img.isExisting) {
                  return {
                    ...img,
                    publicUrl,
                    loading: false,
                    progress: 100,
                    isExisting: true,
                  };
                }
                return img;
              })
            );

            // console.log(`Upload ${i + 1}/${pendingFiles.length} completed: ${file.name}`)
          } catch (err) {
            const errorMessage =
              err instanceof Error ? err.message : "Erro desconhecido";

            // Update the specific image with error
            setImages((prev) =>
              prev.map((img) => {
                if (img.file === file && !img.isExisting) {
                  return {
                    ...img,
                    loading: false,
                    error: errorMessage,
                    progress: 0,
                  };
                }
                return img;
              })
            );

            toast.error(`Error uploading file ${file.name}: ${errorMessage}`);
            // Continue with other files instead of stopping
          }
        }

        // Final progress update
        setUploadProgress(100);
        setUploadStatus("Upload concluído!");

        return uploadedUrls;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erro ao fazer upload das imagens";
        setError(errorMessage);
        throw err;
      } finally {
        // Reset uploading state with a small delay to show completion
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
          setUploadStatus("");
        }, 1000);
      }
    },
    [images, getPendingFiles, ensureBucket, uploadSingleImage]
  );

  // Remove image by index
  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const imageToRemove = prev[index];

      // Cleanup object URL if it's a local preview
      if (imageToRemove?.url.startsWith("blob:")) {
        URL.revokeObjectURL(imageToRemove.url);
      }

      // If image has a public URL, we could also delete it from storage
      // But for now, we'll just remove it from the local state
      // TODO: Implement deleteProductImage if needed

      return prev.filter((_, i) => i !== index);
    });

    // Clear any errors when removing images
    setError(null);
  }, []);

  // Remove image by URL
  const removeImageByUrl = useCallback((url: string) => {
    setImages((prev) => {
      const index = prev.findIndex(
        (img) => img.publicUrl === url || img.url === url
      );
      if (index >= 0) {
        const imageToRemove = prev[index];

        // Cleanup object URL if it's a local preview
        if (imageToRemove?.url.startsWith("blob:")) {
          URL.revokeObjectURL(imageToRemove.url);
        }

        return prev.filter((_, i) => i !== index);
      }
      return prev;
    });
  }, []);

  // Clear all images
  const clearImages = useCallback(() => {
    // Cleanup all object URLs
    images.forEach((img) => {
      if (img.url.startsWith("blob:")) {
        URL.revokeObjectURL(img.url);
      }
    });

    setImages([]);
    setError(null);
  }, [images]);

  // Reorder images
  const reorderImages = useCallback((fromIndex: number, toIndex: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      const [removed] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, removed);
      return newImages;
    });
  }, []);

  // Get image URLs (only successful uploads and existing images)
  const getImageUrls = useCallback((): string[] => {
    return images
      .filter(
        (img) => (img.publicUrl || img.isExisting) && !img.loading && !img.error
      )
      .map((img) => img.publicUrl || img.url)
      .filter((url): url is string => !!url);
  }, [images]);

  return {
    images,
    uploading,
    uploadProgress,
    uploadStatus,
    error,
    addFiles,
    removeImage,
    removeImageByUrl,
    clearImages,
    reorderImages,
    getImageUrls,
    uploadPendingFiles,
    getPendingFiles,
    validateImageFile,
  };
}
