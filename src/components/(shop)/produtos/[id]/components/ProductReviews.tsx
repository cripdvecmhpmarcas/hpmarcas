"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

interface ProductReviewsProps {
  productId: string;
}

export const ProductReviews = ({ }: ProductReviewsProps) => {
  // TODO: Implementar sistema de avaliações quando necessário
  // Por enquanto, mantém o placeholder da página original

  return (
    <section className="mb-16">
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="w-6 h-6 text-gold-500" />
            <Star className="w-6 h-6 text-gold-500" />
            <Star className="w-6 h-6 text-gold-500" />
            <Star className="w-6 h-6 text-gold-500" />
            <Star className="w-6 h-6 text-gold-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Avaliações dos Clientes
          </h3>
          <p className="text-gray-600 mb-4">
            Em breve nossos clientes poderão avaliar este produto
          </p>
          <Button variant="outline">Seja o primeiro a avaliar</Button>
        </CardContent>
      </Card>
    </section>
  );
};
