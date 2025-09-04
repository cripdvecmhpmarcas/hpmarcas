"use client";

import { useState, useCallback, useMemo } from "react";
import type { UseProductGalleryReturn } from "../types";

export const useProductGallery = (productImages: string[] | null): UseProductGalleryReturn => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const images = useMemo(() => {
    return productImages && productImages.length > 0 
      ? productImages 
      : [];
  }, [productImages]);

  const hasMultipleImages = useMemo(() => {
    return images.length > 1;
  }, [images]);

  const nextImage = useCallback(() => {
    setSelectedIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  }, [images.length]);

  const prevImage = useCallback(() => {
    setSelectedIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  }, [images.length]);

  const handleSetSelectedIndex = useCallback((index: number) => {
    if (index >= 0 && index < images.length) {
      setSelectedIndex(index);
    }
  }, [images.length]);

  return {
    images,
    selectedIndex,
    setSelectedIndex: handleSetSelectedIndex,
    nextImage,
    prevImage,
    hasMultipleImages,
  };
};