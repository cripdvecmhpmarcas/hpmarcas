"use client";

import React, { useState, useMemo } from "react";
import { HelpCircle, MessageCircle, Mail, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LegalNavigation from "@/components/legal/LegalNavigation";
import FAQSearch from "@/components/faq/FAQSearch";
import FAQItem from "@/components/faq/FAQItem";
import { FAQ_DATA, FAQ_CATEGORIES } from "@/data/faq";

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const filteredFAQs = useMemo(() => {
    let filtered = FAQ_DATA;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  const toggleItem = (itemId: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(itemId)) {
      newOpenItems.delete(itemId);
    } else {
      newOpenItems.add(itemId);
    }
    setOpenItems(newOpenItems);
  };

  const expandAll = () => {
    setOpenItems(new Set(filteredFAQs.map((item) => item.id)));
  };

  const collapseAll = () => {
    setOpenItems(new Set());
  };

  const getCategoryName = (categoryId: string) => {
    return (
      FAQ_CATEGORIES.find((cat) => cat.id === categoryId)?.name || categoryId
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <HelpCircle className="w-8 h-8 text-yellow-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Perguntas Frequentes
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Encontre respostas rápidas para as dúvidas mais comuns sobre nossos
            produtos e serviços
          </p>
        </div>

        {/* Legal Navigation */}
        <LegalNavigation />

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="text-center hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <MessageCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">WhatsApp</h3>
              <p className="text-sm text-gray-600 mb-2">(21) 99999-9999</p>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                Conversar
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <Mail className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">E-mail</h3>
              <p className="text-sm text-gray-600 mb-2">
                suporte@hpmarcas.com.br
              </p>
              <Button size="sm" variant="outline">
                Enviar E-mail
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <Phone className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Loja Física</h3>
              <p className="text-sm text-gray-600 mb-2">Seg-Sex: 9h-18h</p>
              <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600">
                Ver Endereço
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-b">
            <CardTitle className="text-2xl text-center">
              Base de Conhecimento
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            {/* Search and Filters */}
            <div className="mb-6">
              <FAQSearch
                onSearch={setSearchQuery}
                onCategoryFilter={setSelectedCategory}
                selectedCategory={selectedCategory}
                categories={FAQ_CATEGORIES}
              />
            </div>

            {/* Results Header */}
            {filteredFAQs.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  {filteredFAQs.length} pergunta
                  {filteredFAQs.length !== 1 ? "s" : ""} encontrada
                  {filteredFAQs.length !== 1 ? "s" : ""}
                  {selectedCategory &&
                    ` em ${getCategoryName(selectedCategory)}`}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={expandAll}
                    disabled={openItems.size === filteredFAQs.length}
                  >
                    Expandir Todas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={collapseAll}
                    disabled={openItems.size === 0}
                  >
                    Recolher Todas
                  </Button>
                </div>
              </div>
            )}

            {/* FAQ Items */}
            <div className="space-y-3">
              {filteredFAQs.length === 0 ? (
                <div className="text-center py-12">
                  <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    Nenhuma pergunta encontrada
                  </h3>
                  <p className="text-gray-500">
                    Tente usar termos diferentes ou remova os filtros
                  </p>
                </div>
              ) : (
                filteredFAQs.map((item) => (
                  <FAQItem
                    key={item.id}
                    question={item.question}
                    answer={item.answer}
                    tags={item.tags}
                    isOpen={openItems.has(item.id)}
                    onToggle={() => toggleItem(item.id)}
                  />
                ))
              )}
            </div>

            {/* Help Footer */}
            <div className="mt-8 p-4 bg-yellow-50 rounded-lg text-center">
              <h3 className="font-semibold text-gray-900 mb-2">
                Não encontrou o que procurava?
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Nossa equipe está pronta para ajudar você com qualquer dúvida
              </p>
              <Button className="bg-yellow-500 hover:bg-yellow-600">
                Falar com Atendimento
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
