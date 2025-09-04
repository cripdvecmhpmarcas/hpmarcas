import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Variáveis de ambiente do Supabase não configuradas");
}

// Instância única global - a chave para resolver o problema
let globalAdminClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;
let globalCustomerClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;
let globalPublicClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;

// Flags de inicialização
let adminInitialized = false;
let customerInitialized = false;
let publicInitialized = false;
let isCreatingAdminClient = false;
let isCreatingCustomerClient = false;
let isCreatingPublicClient = false;

// Detectar e prevenir múltiplas instâncias do GoTrueClient
if (typeof window !== "undefined") {
  const globalWindow = window as unknown as {
    __supabaseInstances?: string[];
  };
  const existingInstances = globalWindow.__supabaseInstances || [];
  if (existingInstances.length > 2) { // Permitir admin + customer
    console.warn(
      `[Supabase] Detectadas ${existingInstances.length} instâncias do GoTrueClient. Limitando a 2 instâncias (admin + customer).`
    );
  }
  globalWindow.__supabaseInstances = existingInstances;
}

// Função para destruir e recriar instâncias (útil para debugging)
export const resetSupabaseInstances = () => {
  if (typeof window !== "undefined") {
    console.log("[Supabase] Resetando instâncias...");
    const globalWindow = window as unknown as {
      __supabaseInstances?: string[];
    };
    globalWindow.__supabaseInstances = [];
  }
  globalAdminClient = null;
  globalCustomerClient = null;
  globalPublicClient = null;
  adminInitialized = false;
  customerInitialized = false;
  publicInitialized = false;
  isCreatingAdminClient = false;
  isCreatingCustomerClient = false;
  isCreatingPublicClient = false;
};

// Cliente para administração - singleton para evitar múltiplas instâncias
export const createAdminClient = () => {
  // Se já existe instância, retornar imediatamente
  if (globalAdminClient && adminInitialized) {
    return globalAdminClient;
  }

  // Evitar criação concorrente
  if (isCreatingAdminClient) {
    console.warn("[Supabase] Admin client já sendo criado, aguardando...");
    // Tentar retornar instância existente ou criar uma temporária
    return globalAdminClient || createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  isCreatingAdminClient = true;

  if (typeof window === "undefined") {
    // No servidor, tentar usar service role se disponível
    isCreatingAdminClient = false;
    const keyToUse = supabaseServiceRoleKey || supabaseAnonKey;
    return createSupabaseClient<Database>(supabaseUrl, keyToUse, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        flowType: "pkce",
      },
      db: {
        schema: "public",
      },
      global: {
        headers: {
          "x-client-info": "supabase-js-admin-server",
        },
      },
    });
  }

  try {
    console.log("[Supabase] Criando admin client...");

    // No cliente, usar anon key (service role não é exposta)
    globalAdminClient = createSupabaseClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: false, // Admin não precisa de sessão persistente
          autoRefreshToken: false,
          detectSessionInUrl: false,
          flowType: "pkce",
        },
        db: {
          schema: "public",
        },
        global: {
          headers: {
            "x-client-info": "supabase-js-admin-web",
            "x-instance-type": "admin",
          },
        },
      }
    );

    adminInitialized = true;

    const globalWindow = window as unknown as {
      __supabaseInstances?: string[];
    };
    const instances = globalWindow.__supabaseInstances || [];
    if (!instances.includes("admin")) {
      instances.push("admin");
      globalWindow.__supabaseInstances = instances;
    }

    console.log("[Supabase] Admin client inicializado com sucesso");
  } finally {
    isCreatingAdminClient = false;
  }

  return globalAdminClient!;
};

// Cliente para clientes/e-commerce - singleton separado
export const createCustomerClient = () => {
  // Se já existe instância, retornar imediatamente
  if (globalCustomerClient && customerInitialized) {
    return globalCustomerClient;
  }

  // Evitar criação concorrente
  if (isCreatingCustomerClient) {
    console.warn("[Supabase] Customer client já sendo criado, aguardando...");
    // Tentar retornar instância existente ou criar uma temporária
    return globalCustomerClient || createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  isCreatingCustomerClient = true;

  if (typeof window === "undefined") {
    // No servidor, sempre criar nova instância
    isCreatingCustomerClient = false;
    return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        flowType: "pkce",
      },
      db: {
        schema: "public",
      },
      global: {
        headers: {
          "x-client-info": "supabase-js-customer-server",
        },
      },
    });
  }

  try {
    console.log("[Supabase] Criando customer client...");

    globalCustomerClient = createSupabaseClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true, // Customer pode usar URL detection
          storage: window?.localStorage,
          flowType: "pkce",
          storageKey: "supabase.auth.token.customer", // Chave específica para customer
          debug: false, // Reduzir logs
        },
        db: {
          schema: "public",
        },
        global: {
          headers: {
            "x-client-info": "supabase-js-customer-web",
            "x-instance-type": "customer",
          },
        },
      }
    );

    customerInitialized = true;

    const globalWindow = window as unknown as {
      __supabaseInstances?: string[];
    };
    const instances = globalWindow.__supabaseInstances || [];
    if (!instances.includes("customer")) {
      instances.push("customer");
      globalWindow.__supabaseInstances = instances;
    }

    console.log("[Supabase] Customer client inicializado com sucesso");
  } finally {
    isCreatingCustomerClient = false;
  }

  return globalCustomerClient!;
};

// Cliente público para operações de leitura (e-commerce) - singleton
export const createPublicClient = () => {
  // Se já existe instância, retornar imediatamente
  if (globalPublicClient && publicInitialized) {
    return globalPublicClient;
  }

  // Evitar criação concorrente
  if (isCreatingPublicClient) {
    console.warn("[Supabase] Public client já sendo criado, aguardando...");
    // Tentar retornar instância existente ou criar uma temporária
    return globalPublicClient || createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  isCreatingPublicClient = true;

  try {
    console.log("[Supabase] Criando public client...");

    globalPublicClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        flowType: "pkce",
      },
      db: {
        schema: "public",
      },
      global: {
        headers: {
          "x-client-info": "supabase-js-public",
        },
      },
    });

    publicInitialized = true;
    console.log("[Supabase] Public client inicializado com sucesso");

    return globalPublicClient;
  } catch (error) {
    console.error("[Supabase] Erro ao criar public client:", error);
    // Em caso de erro, tentar retornar uma instância básica
    return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);
  } finally {
    isCreatingPublicClient = false;
  }
};

// Cliente padrão para compatibilidade (usa admin por padrão)
export const createClient = createAdminClient;

// Função única para obter a instância singleton admin
export const supabase = () => createAdminClient();

// Função para obter instância admin de forma singleton (para uso em libs)
export const getSupabaseAdmin = () => createAdminClient();

// Função para obter instância customer de forma singleton (para uso em libs)
export const getSupabaseCustomer = () => createCustomerClient();

// REMOVIDO: Cliente admin direto que criava múltiplas instâncias
// Use createAdminClient() ou useSupabaseAdmin() hook em componentes React

// Função utilitária para verificar se o usuário está autenticado
export const getUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase().auth.getUser();
    if (error) {
      console.error("Error getting user:", error);
      return null;
    }
    return user;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
};

// Função utilitária para logout
export const signOut = async () => {
  try {
    // Usar singleton existente ao invés de criar nova instância
    const client = supabase();
    const { error } = await client.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      // Não throw para permitir cleanup local mesmo com erro
    }
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

// Função utilitária para verificar sessão
export const getSession = async () => {
  try {
    const client = supabase();
    const {
      data: { session },
      error,
    } = await client.auth.getSession();
    if (error) {
      console.error("Error getting session:", error);
      return null;
    }
    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
};

// Função utilitária para refresh da sessão
export const refreshSession = async () => {
  try {
    const client = supabase();
    const {
      data: { session },
      error,
    } = await client.auth.refreshSession();
    if (error) {
      console.error("Error refreshing session:", error);
      return null;
    }
    return session;
  } catch (error) {
    console.error("Error refreshing session:", error);
    return null;
  }
};

// Função para limpar toda a sessão (incluindo localStorage)
export const clearSession = async () => {
  try {
    const client = supabase();
    await client.auth.signOut();
    if (typeof window !== "undefined") {
      localStorage.removeItem("supabase.auth.token");
      sessionStorage.clear();
    }
  } catch (error) {
    console.error("Error clearing session:", error);
  }
};
