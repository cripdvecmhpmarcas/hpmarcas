import { User } from "@supabase/supabase-js";

// Enum para roles administrativos
export enum AdminRole {
  ADMIN = "admin",
  CASHIER = "cashier",
  STOCKIST = "stockist"
}

// Enum para status do profile
export enum ProfileStatus {
  ACTIVE = "active",
  INACTIVE = "inactive"
}

// Interface do profile administrativo
export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: ProfileStatus;
  created_at: string;
  updated_at: string;
}

// Interface para dados de login admin
export interface AdminLoginData {
  email: string;
  password: string;
}

// Interface para resposta de autenticação
export interface AuthResponse {
  error: string | null;
  user?: User;
  profile?: AdminProfile;
}

// Interface para contexto de autenticação admin
export interface AdminAuthContextType {
  user: User | null;
  profile: AdminProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  signInWithEmail: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<AdminProfile | null>;
}

// Interface para permissões (preparação para futuras expansões)
export interface AdminPermissions {
  canAccessDashboard: boolean;
  canManageProducts: boolean;
  canManageStock: boolean;
  canManageCustomers: boolean;
  canViewSales: boolean;
  canManageSales: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
  canAccessPOS: boolean;
}

// Função para obter permissões baseado no role
export const getPermissionsByRole = (role: AdminRole): AdminPermissions => {
  switch (role) {
    case AdminRole.ADMIN:
      return {
        canAccessDashboard: true,
        canManageProducts: true,
        canManageStock: true,
        canManageCustomers: true,
        canViewSales: true,
        canManageSales: true,
        canViewReports: true,
        canManageSettings: true,
        canAccessPOS: true,
      };

    case AdminRole.CASHIER:
      return {
        canAccessDashboard: true,
        canManageProducts: false,
        canManageStock: false,
        canManageCustomers: true,
        canViewSales: true,
        canManageSales: true,
        canViewReports: false,
        canManageSettings: false,
        canAccessPOS: true,
      };

    case AdminRole.STOCKIST:
      return {
        canAccessDashboard: true,
        canManageProducts: true,
        canManageStock: true,
        canManageCustomers: false,
        canViewSales: false,
        canManageSales: false,
        canViewReports: false,
        canManageSettings: false,
        canAccessPOS: false,
      };

    default:
      return {
        canAccessDashboard: false,
        canManageProducts: false,
        canManageStock: false,
        canManageCustomers: false,
        canViewSales: false,
        canManageSales: false,
        canViewReports: false,
        canManageSettings: false,
        canAccessPOS: false,
      };
  }
};

// Função para verificar se role é válido
export const isValidAdminRole = (role: string): role is AdminRole => {
  return Object.values(AdminRole).includes(role as AdminRole);
};

// Função para obter label do role
export const getRoleLabel = (role: AdminRole): string => {
  const labels = {
    [AdminRole.ADMIN]: "Administrador",
    [AdminRole.CASHIER]: "Operador de Caixa",
    [AdminRole.STOCKIST]: "Estoquista"
  };

  return labels[role] || "Usuário";
};

// Função para obter cor do role (para badges)
export const getRoleColor = (role: AdminRole): string => {
  const colors = {
    [AdminRole.ADMIN]: "bg-red-100 text-red-800",
    [AdminRole.CASHIER]: "bg-blue-100 text-blue-800",
    [AdminRole.STOCKIST]: "bg-green-100 text-green-800"
  };

  return colors[role] || "bg-gray-100 text-gray-800";
};
