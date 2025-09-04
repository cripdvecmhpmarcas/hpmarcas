export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags?: string[];
}

export const FAQ_CATEGORIES = [
  { id: "pedidos", name: "Pedidos e Compras", icon: "🛒" },
  { id: "entrega", name: "Entrega e Frete", icon: "🚚" },
  { id: "pagamento", name: "Pagamento", icon: "💳" },
  { id: "produtos", name: "Produtos", icon: "🧴" },
  { id: "devolucoes", name: "Trocas e Devoluções", icon: "↩️" },
  { id: "conta", name: "Minha Conta", icon: "👤" },
  { id: "suporte", name: "Suporte", icon: "🎧" },
];

export const FAQ_DATA: FAQItem[] = [
  // Pedidos e Compras
  {
    id: "como-fazer-pedido",
    category: "pedidos",
    question: "Como faço um pedido?",
    answer:
      "Para fazer um pedido, navegue pelo nosso catálogo, adicione os produtos desejados ao carrinho, preencha seus dados de entrega e escolha a forma de pagamento. Após confirmar o pedido, você receberá um e-mail de confirmação.",
    tags: ["pedido", "compra", "carrinho"],
  },
  {
    id: "cancelar-pedido",
    category: "pedidos",
    question: "Posso cancelar meu pedido?",
    answer:
      "Sim, você pode cancelar seu pedido até 2 horas após a confirmação. Entre em contato conosco pelo WhatsApp ou e-mail. Após esse prazo, o pedido já estará sendo preparado para envio.",
    tags: ["cancelamento", "prazo"],
  },
  {
    id: "alterar-pedido",
    category: "pedidos",
    question: "Posso alterar meu pedido após a confirmação?",
    answer:
      "Alterações são possíveis apenas nas primeiras 2 horas após a confirmação e dependem da disponibilidade dos produtos. Entre em contato conosco o mais rápido possível.",
    tags: ["alteração", "modificar"],
  },

  // Entrega e Frete
  {
    id: "prazo-entrega",
    category: "entrega",
    question: "Qual o prazo de entrega?",
    answer:
      "O prazo varia conforme sua região: Rio de Janeiro (1-2 dias úteis), Região Sudeste (2-4 dias úteis), demais regiões (5-10 dias úteis). O prazo é calculado automaticamente no checkout.",
    tags: ["prazo", "região", "tempo"],
  },
  {
    id: "rastrear-pedido",
    category: "entrega",
    question: "Como rastrear meu pedido?",
    answer:
      "Após o envio, você receberá um código de rastreamento por e-mail. Use este código no site dos Correios ou da transportadora para acompanhar a entrega em tempo real.",
    tags: ["rastreamento", "código", "acompanhar"],
  },
  {
    id: "frete-gratis",
    category: "entrega",
    question: "Quando o frete é grátis?",
    answer:
      "Oferecemos frete grátis para compras acima de R$ 150,00 para todo o Brasil (exceto regiões remotas). Para o Rio de Janeiro, frete grátis a partir de R$ 80,00.",
    tags: ["frete grátis", "valor mínimo"],
  },

  // Pagamento
  {
    id: "formas-pagamento",
    category: "pagamento",
    question: "Quais formas de pagamento vocês aceitam?",
    answer:
      "Aceitamos: PIX (5% de desconto), Cartão de Crédito (até 6x sem juros), Cartão de Débito, Boleto Bancário e Mercado Pago. Todas as transações são seguras e criptografadas.",
    tags: ["pagamento", "cartão", "pix", "boleto"],
  },
  {
    id: "desconto-pix",
    category: "pagamento",
    question: "Como funciona o desconto no PIX?",
    answer:
      "Pagando via PIX, você recebe 5% de desconto automático no valor total da compra. O desconto é aplicado antes do checkout e o pagamento deve ser feito em até 30 minutos.",
    tags: ["pix", "desconto", "promoção"],
  },
  {
    id: "parcelamento",
    category: "pagamento",
    question: "Posso parcelar minha compra?",
    answer:
      "Sim! Oferecemos parcelamento em até 6x sem juros no cartão de crédito para compras acima de R$ 100,00. Para valores menores, o parcelamento pode ter juros conforme a operadora.",
    tags: ["parcelamento", "cartão", "juros"],
  },

  // Produtos
  {
    id: "produtos-originais",
    category: "produtos",
    question: "Os produtos são originais?",
    answer:
      "Sim, todos os nossos produtos são 100% originais e procedentes. Trabalhamos apenas com fornecedores autorizados e oferecemos garantia de autenticidade em todos os perfumes.",
    tags: ["originalidade", "garantia", "autenticidade"],
  },
  {
    id: "validade-produtos",
    category: "produtos",
    question: "Qual a validade dos produtos?",
    answer:
      "Nossos perfumes têm validade mínima de 2 anos a partir da data de compra. A data de fabricação e validade estão sempre indicadas na embalagem do produto.",
    tags: ["validade", "prazo", "vencimento"],
  },
  {
    id: "produto-indisponivel",
    category: "produtos",
    question: "O produto que quero está indisponível. E agora?",
    answer:
      "Cadastre-se para receber aviso quando o produto voltar ao estoque. Também podemos sugerir produtos similares ou alternativas da mesma marca.",
    tags: ["estoque", "indisponível", "aviso"],
  },

  // Trocas e Devoluções
  {
    id: "prazo-devolucao",
    category: "devolucoes",
    question: "Qual o prazo para devolução?",
    answer:
      "Você tem 7 dias corridos após o recebimento para solicitar a devolução, conforme o Código de Defesa do Consumidor. O produto deve estar lacrado e em perfeitas condições.",
    tags: ["devolução", "prazo", "cdc"],
  },
  {
    id: "como-devolver",
    category: "devolucoes",
    question: "Como faço para devolver um produto?",
    answer:
      "Entre em contato conosco informando o número do pedido e motivo da devolução. Enviaremos as instruções e, se aprovado, um código de postagem gratuito.",
    tags: ["processo", "instruções", "contato"],
  },
  {
    id: "produto-danificado",
    category: "devolucoes",
    question: "Recebi um produto danificado. O que fazer?",
    answer:
      "Entre em contato imediatamente com fotos do produto e embalagem. Faremos a troca imediata sem custo para você, incluindo o frete de retorno.",
    tags: ["danificado", "troca", "defeito"],
  },

  // Minha Conta
  {
    id: "criar-conta",
    category: "conta",
    question: "Preciso criar uma conta para comprar?",
    answer:
      "Não é obrigatório, mas recomendamos criar uma conta para acompanhar seus pedidos, salvar endereços, participar do programa de fidelidade e receber ofertas exclusivas.",
    tags: ["cadastro", "benefícios", "fidelidade"],
  },
  {
    id: "esqueci-senha",
    category: "conta",
    question: "Esqueci minha senha. Como recuperar?",
    answer:
      'Na página de login, clique em "Esqueci minha senha" e digite seu e-mail. Enviaremos um link para criar uma nova senha. Verifique também a caixa de spam.',
    tags: ["senha", "recuperar", "login"],
  },
  {
    id: "alterar-dados",
    category: "conta",
    question: "Como alterar meus dados cadastrais?",
    answer:
      'Entre na sua conta, vá em "Meu Perfil" e atualize as informações desejadas. Lembre-se de confirmar as alterações antes de sair da página.',
    tags: ["dados", "perfil", "atualizar"],
  },

  // Suporte
  {
    id: "contato-atendimento",
    category: "suporte",
    question: "Como entrar em contato com o atendimento?",
    answer:
      "Atendemos por WhatsApp (21) 99999-9999 (9h às 18h), e-mail suporte@hpmarcas.com.br (respondemos em até 24h) ou chat online no site durante horário comercial.",
    tags: ["contato", "whatsapp", "email", "chat"],
  },
  {
    id: "horario-funcionamento",
    category: "suporte",
    question: "Qual o horário de funcionamento?",
    answer:
      "Nosso atendimento funciona de segunda a sexta, das 9h às 18h, e sábados das 9h às 14h. Fora desses horários, você pode deixar mensagens que responderemos no próximo dia útil.",
    tags: ["horário", "funcionamento", "dias"],
  },
  {
    id: "loja-fisica",
    category: "suporte",
    question: "Vocês têm loja física?",
    answer:
      "Sim! Nossa loja física fica na Av. Presidente Vargas, 633 - Centro, Rio de Janeiro/RJ. Funcionamos de segunda a sexta das 9h às 18h e sábados das 9h às 14h.",
    tags: ["loja física", "endereço", "visita"],
  },
];
