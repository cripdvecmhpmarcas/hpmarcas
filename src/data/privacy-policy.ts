export interface PolicySection {
  id: string;
  title: string;
  content: string | string[];
  subsections?: {
    title: string;
    items: string[];
  }[];
}

export const PRIVACY_POLICY_DATA: PolicySection[] = [
  {
    id: "info-gerais",
    title: "1. Informações Gerais",
    content:
      "A HP Marcas Perfumes está comprometida em proteger sua privacidade. Esta política explica como coletamos, usamos e protegemos suas informações pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD).",
  },
  {
    id: "info-coletamos",
    title: "2. Informações que Coletamos",
    content: "",
    subsections: [
      {
        title: "Dados Pessoais:",
        items: [
          "Nome completo",
          "CPF",
          "E-mail",
          "Telefone",
          "Data de nascimento",
          "Endereço completo",
        ],
      },
      {
        title: "Dados de Navegação:",
        items: [
          "Endereço IP",
          "Tipo de navegador",
          "Páginas visitadas",
          "Tempo de permanência",
          "Cookies e tecnologias similares",
        ],
      },
    ],
  },
  {
    id: "como-utilizamos",
    title: "3. Como Utilizamos suas Informações",
    content: [
      "**Processamento de pedidos:** Para confirmar, processar e entregar suas compras",
      "**Comunicação:** Para enviar confirmações, atualizações de pedidos e suporte ao cliente",
      "**Marketing:** Para enviar ofertas e novidades (apenas com seu consentimento)",
      "**Melhoria do serviço:** Para análise e aprimoramento da experiência do usuário",
      "**Segurança:** Para prevenir fraudes e proteger nossos sistemas",
    ],
  },
  {
    id: "base-legal",
    title: "4. Base Legal para Tratamento",
    content: [
      "**Execução de contrato:** Para cumprimento de obrigações contratuais",
      "**Consentimento:** Para comunicações de marketing e cookies não essenciais",
      "**Interesse legítimo:** Para segurança e melhoria dos serviços",
      "**Obrigação legal:** Para cumprimento de exigências fiscais e regulatórias",
    ],
  },
  {
    id: "compartilhamento",
    title: "5. Compartilhamento de Informações",
    content: [
      "Suas informações podem ser compartilhadas apenas nas seguintes situações:",
      "**Prestadores de serviço:** Transportadoras, processadores de pagamento (sob contrato de confidencialidade)",
      "**Exigências legais:** Quando requerido por autoridades competentes",
      "**Proteção de direitos:** Para proteger nossos direitos legais e de terceiros",
    ],
  },
  {
    id: "cookies",
    title: "6. Cookies e Tecnologias Similares",
    content: [
      "**Cookies essenciais:** Necessários para funcionamento do site",
      "**Cookies de desempenho:** Para análise e melhoria da performance",
      "**Cookies de marketing:** Para personalização de ofertas (com seu consentimento)",
      "Você pode gerenciar suas preferências de cookies nas configurações do navegador.",
    ],
  },
  {
    id: "seguranca",
    title: "7. Segurança dos Dados",
    content: [
      "Criptografia SSL para transmissão de dados",
      "Acesso restrito a funcionários autorizados",
      "Sistemas de backup e recuperação",
      "Monitoramento contínuo de segurança",
      "Treinamento regular da equipe sobre proteção de dados",
    ],
  },
  {
    id: "retencao",
    title: "8. Retenção de Dados",
    content: [
      "**Dados de clientes ativos:** Enquanto a conta estiver ativa",
      "**Dados de transações:** 5 anos (exigência fiscal)",
      "**Dados de marketing:** Até a retirada do consentimento",
      "**Cookies:** Conforme configuração definida",
    ],
  },
  {
    id: "direitos-lgpd",
    title: "9. Seus Direitos (LGPD)",
    content: [
      "**Acesso:** Saber quais dados pessoais tratamos sobre você",
      "**Correção:** Solicitar correção de dados incompletos ou inexatos",
      "**Exclusão:** Solicitar eliminação de dados desnecessários",
      "**Portabilidade:** Receber seus dados em formato estruturado",
      "**Oposição:** Opor-se ao tratamento baseado em interesse legítimo",
      "**Revogação:** Retirar consentimento para marketing",
    ],
  },
  {
    id: "menores",
    title: "10. Menores de Idade",
    content:
      "Nossos serviços são destinados a maiores de 18 anos. Não coletamos intencionalmente dados de menores. Se identificarmos dados de menor, excluiremos imediatamente.",
  },
  {
    id: "alteracoes",
    title: "11. Alterações nesta Política",
    content:
      "Esta política pode ser atualizada periodicamente. Alterações significativas serão comunicadas por e-mail ou aviso no site com 30 dias de antecedência.",
  },
  {
    id: "dpo",
    title: "12. Encarregado de Proteção de Dados (DPO)",
    content: [
      "Para exercer seus direitos ou esclarecer dúvidas sobre proteção de dados:",
      "**HP Marcas Perfumes - DPO**",
      "Av Presidente Vargas 633, Sala 314",
      "Centro - Rio de Janeiro/RJ",
      "E-mail: privacidade@hpmarcas.com.br",
    ],
  },
  {
    id: "anpd",
    title: "13. Autoridade Nacional de Proteção de Dados (ANPD)",
    content:
      "Caso não fique satisfeito com nossas respostas, você pode contatar a ANPD através do site: [www.gov.br/anpd](https://www.gov.br/anpd)",
  },
];

export const POLICY_METADATA = {
  title: "Política de Privacidade",
  lastUpdate: "Dezembro de 2024",
  version: "1.0",
  footerText:
    "Ao usar nossos serviços, você confirma que leu e compreendeu esta Política de Privacidade.",
};
