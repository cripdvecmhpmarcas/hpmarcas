"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ShoppingCart,
  Package,
  Archive,
  Users,
  ShoppingBag,
  Settings,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/logo";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  children?: SidebarSubItem[];
}

interface SidebarSubItem {
  id: string;
  label: string;
  href: string;
  badge?: string;
}

interface SidebarProps {
  userName?: string;
  userEmail?: string;
  userRole?: string;
  userAvatar?: string;
  className?: string;
  onWidthChange?: (width: number) => void;
}

const SIDEBAR_COLLAPSED_WIDTH = 72;
const SIDEBAR_EXPANDED_WIDTH = 256;

const Sidebar: React.FC<SidebarProps> = ({
  userName = "Administrador",
  userEmail = "admin@hpmarcas.com",
  userRole = "admin",
  userAvatar,
  className,
  onWidthChange,
}) => {
  const pathname = usePathname();
  // Delay para expand/collapse
  const [expanded, setExpanded] = React.useState(true); // padrão expanded
  const [expandedSubmenus, setExpandedSubmenus] = React.useState<Set<string>>(new Set());
  const expandTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const [autoCollapse, setAutoCollapse] = React.useState(true);
  const hasUserInteracted = React.useRef(false);

  // Reportar mudanças na largura
  React.useEffect(() => {
    const currentWidth = expanded
      ? SIDEBAR_EXPANDED_WIDTH
      : SIDEBAR_COLLAPSED_WIDTH;
    onWidthChange?.(currentWidth);
  }, [expanded, onWidthChange]);

  // Carregar preferências do localStorage apenas no mount
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const storedExpanded = localStorage.getItem("sidebar_expanded");
    const storedAutoCollapse = localStorage.getItem("sidebar_autoCollapse");
    const storedExpandedSubmenus = localStorage.getItem("sidebar_expandedSubmenus");

    if (storedExpanded !== null) setExpanded(storedExpanded === "true");
    if (storedAutoCollapse !== null) setAutoCollapse(storedAutoCollapse === "true");
    if (storedExpandedSubmenus !== null) {
      try {
        const parsed = JSON.parse(storedExpandedSubmenus);
        setExpandedSubmenus(new Set(parsed));
      } catch {
        // Ignore parsing errors
      }
    }
  }, []);

  // Funções para controlar o delay do hover
  const handleMouseEnter = () => {
    if (!autoCollapse) return;
    if (expandTimeout.current) clearTimeout(expandTimeout.current);
    expandTimeout.current = setTimeout(() => setExpanded(true), 120);
  };
  const handleMouseLeave = () => {
    if (!autoCollapse) return;
    if (expandTimeout.current) clearTimeout(expandTimeout.current);
    expandTimeout.current = setTimeout(() => setExpanded(false), 120);
  };

  React.useEffect(() => {
    return () => {
      if (expandTimeout.current) clearTimeout(expandTimeout.current);
    };
  }, []);

  // Salvar no localStorage apenas após interação do usuário
  const handleExpandCollapseClick = () => {
    setAutoCollapse(false);
    setExpanded((prev) => {
      const next = !prev;
      if (hasUserInteracted.current) {
        localStorage.setItem("sidebar_expanded", String(next));
      }
      return next;
    });
    hasUserInteracted.current = true;
  };

  const handleAutoCollapseClick = () => {
    setAutoCollapse((prev) => {
      const next = !prev;
      if (hasUserInteracted.current) {
        localStorage.setItem("sidebar_autoCollapse", String(next));
      }
      return next;
    });
    hasUserInteracted.current = true;
  };

  const toggleSubmenu = (itemId: string) => {
    setExpandedSubmenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }

      // Salvar no localStorage
      if (hasUserInteracted.current) {
        localStorage.setItem("sidebar_expandedSubmenus", JSON.stringify([...newSet]));
      }
      hasUserInteracted.current = true;

      return newSet;
    });
  };

  const menuItems: SidebarItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      id: "pdv",
      label: "PDV",
      href: "/dashboard/pdv",
      icon: ShoppingCart,
      badge: "Exclusivo",
    },
    {
      id: "produtos",
      label: "Produtos",
      href: "/dashboard/produtos",
      icon: Package,
      children: [
        {
          id: "produtos-importar",
          label: "Importar Produtos",
          href: "/dashboard/produtos/import",
          badge: "Premium"
        }
      ]
    },
    {
      id: "categorias",
      label: "Categorias",
      href: "/dashboard/categorias",
      icon: Tag,
      badge: "Novo",
    },
    {
      id: "estoque",
      label: "Estoque",
      href: "/dashboard/estoque",
      icon: Archive,
    },
    {
      id: "clientes",
      label: "Clientes",
      href: "/dashboard/clientes",
      icon: Users,
    },
    {
      id: "vendas",
      label: "Vendas",
      href: "/dashboard/vendas",
      icon: ShoppingBag,
      badge: "Novo",
    }
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const isSubItemActive = (href: string) => {
    return pathname === href;
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      admin: "Administrador",
      cashier: "Operador de Caixa",
      stockist: "Estoquista",
    };
    return roles[role] || "Usuário";
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <motion.div
      className={cn(
        "flex flex-col h-full bg-sidebar border-r border-sidebar-border",
        className
      )}
      role="navigation"
      aria-label="Menu principal de navegação"
      initial={{ width: SIDEBAR_COLLAPSED_WIDTH }}
      animate={{
        width: expanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        minWidth: 0,
        overflow: "hidden",
        willChange: "width",
        backfaceVisibility: "hidden",
        transform: "translateZ(0)",
      }}
    >
      {/* Botão de expand/collapse manual */}
      <div
        className={cn(
          "flex items-center px-2 pt-2 transition-all duration-200",
          expanded ? "justify-end" : "justify-center"
        )}
        style={{ minHeight: 40 }}
      >
        <div
          className={cn(
            "flex gap-1",
            !expanded && "flex-col items-center gap-0"
          )}
        >
          <Button
            size="icon"
            variant="ghost"
            className={cn("rounded-full", !expanded && "mb-1")}
            aria-label={expanded ? "Colapsar sidebar" : "Expandir sidebar"}
            onClick={handleExpandCollapseClick}
          >
            {expanded ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </Button>
          <Button
            size="icon"
            variant={autoCollapse ? "default" : "outline"}
            className={cn("rounded-full", !expanded && "mb-1")}
            aria-label={
              autoCollapse
                ? "Desativar colapso automático"
                : "Ativar colapso automático"
            }
            onClick={handleAutoCollapseClick}
          >
            <span className="text-xs">{autoCollapse ? "A" : "M"}</span>
          </Button>
        </div>
      </div>
      {/* Header */}
      <div className="flex items-center p-6 border-b border-sidebar-border h-20">
        {/* Logo, título e descrição só aparecem quando expandido */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              key="logo-header"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-3"
              style={{ width: "100%" }}
            >
              <Logo className="h-12 w-12" aria-hidden="true" />
              <div className="flex flex-col">
                <span className="font-semibold text-sidebar-foreground text-lg">
                  HP Marcas
                </span>
                <span className="text-xs text-muted-foreground">
                  Sistema de Gestão
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1" role="menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const hasChildren = item.children && item.children.length > 0;
          const isSubmenuExpanded = expandedSubmenus.has(item.id);

          // Adiciona hidden nos menus solicitados
          const hidden = ["relatorios", "configuracoes"].includes(item.id);

          return (
            <div key={item.id} hidden={hidden}>
              {/* Item Principal */}
              {hasChildren ? (
                <div
                  className={cn(
                    "w-full h-11 rounded-md transition-all duration-200 group",
                    active && "bg-primary hp-shadow-gold",
                    !active && "hover:bg-sidebar-accent"
                  )}
                >
                  <div className="flex items-center h-full">
                    {/* Área clicável do link principal */}
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 flex-1 rounded-l-md transition-colors",
                        active && "text-primary-foreground",
                        !active && "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Icon
                        size={18}
                        className={
                          active ? "text-primary-foreground" : "text-muted-foreground"
                        }
                        aria-hidden="true"
                      />
                      <motion.span
                        initial={false}
                        animate={{
                          opacity: expanded ? 1 : 0,
                          width: expanded ? "auto" : 0,
                          marginLeft: expanded ? 12 : 0,
                        }}
                        transition={{ duration: 0.15 }}
                        className="flex-1 text-left overflow-hidden font-medium"
                        style={{ display: "inline-block" }}
                      >
                        {item.label}
                      </motion.span>
                      {item.badge && (
                        <motion.div
                          initial={false}
                          animate={{
                            opacity: expanded ? 1 : 0,
                            width: expanded ? "auto" : 0,
                          }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs px-2",
                              active
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-gold-100 text-gold-700 border-gold-200"
                            )}
                            aria-label={`${item.badge} - notificação`}
                          >
                            {item.badge}
                          </Badge>
                        </motion.div>
                      )}
                    </Link>

                    {/* Botão do submenu */}
                    {expanded && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "px-2 py-2 h-full rounded-l-none rounded-r-md border-l border-sidebar-border/50",
                          active && "text-primary-foreground hover:bg-primary-foreground/10",
                          !active && "text-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
                        )}
                        onClick={() => toggleSubmenu(item.id)}
                        aria-label={`${isSubmenuExpanded ? 'Fechar' : 'Abrir'} submenu de ${item.label}`}
                      >
                        <motion.div
                          animate={{ rotate: isSubmenuExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </motion.div>
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <Button
                  variant={active ? "gold" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-11 px-3 font-medium transition-all duration-200 hp-focus-ring",
                    active && "hp-shadow-gold",
                    !active &&
                    "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  asChild
                  role="menuitem"
                  aria-current={active ? "page" : undefined}
                >
                  <Link href={item.href}>
                    <Icon
                      size={18}
                      className={
                        active ? "text-primary-foreground" : "text-muted-foreground"
                      }
                      aria-hidden="true"
                    />
                    <motion.span
                      initial={false}
                      animate={{
                        opacity: expanded ? 1 : 0,
                        width: expanded ? "auto" : 0,
                        marginLeft: expanded ? 12 : 0,
                      }}
                      transition={{ duration: 0.15 }}
                      className="flex-1 text-left overflow-hidden"
                      style={{ display: "inline-block" }}
                    >
                      {item.label}
                    </motion.span>
                    {item.badge && (
                      <motion.div
                        initial={false}
                        animate={{
                          opacity: expanded ? 1 : 0,
                          width: expanded ? "auto" : 0,
                        }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <Badge
                          variant="secondary"
                          className={cn(
                            "ml-auto text-xs px-2",
                            active
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-gold-100 text-gold-700 border-gold-200"
                          )}
                          aria-label={`${item.badge} - notificação`}
                        >
                          {item.badge}
                        </Badge>
                      </motion.div>
                    )}
                  </Link>
                </Button>
              )}

              {/* Submenu */}
              <AnimatePresence>
                {hasChildren && isSubmenuExpanded && expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden ml-6 mt-1 space-y-1"
                  >
                    {item.children?.map((subItem) => {
                      const subActive = isSubItemActive(subItem.href);
                      return (
                        <Button
                          key={subItem.id}
                          variant={subActive ? "gold" : "ghost"}
                          size="sm"
                          className={cn(
                            "w-full justify-between gap-2 h-9 px-3 font-medium transition-all duration-200 hp-focus-ring",
                            subActive && "hp-shadow-gold",
                            !subActive &&
                            "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                          asChild
                          role="menuitem"
                          aria-current={subActive ? "page" : undefined}
                        >
                          <Link href={subItem.href} className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="w-2 h-2 rounded-full bg-current opacity-50 flex-shrink-0" />
                              <span className="text-sm truncate">
                                {subItem.label}
                              </span>
                            </div>
                            {subItem.badge && (
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-xs px-1.5 py-0.5 ml-2 flex-shrink-0",
                                  subActive
                                    ? "bg-primary-foreground/20 text-primary-foreground"
                                    : "bg-purple-100 text-purple-700 border-purple-200"
                                )}
                                aria-label={`${subItem.badge} - notificação`}
                              >
                                {subItem.badge}
                              </Badge>
                            )}
                          </Link>
                        </Button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* User Profile */}
      <motion.div
        className="p-3 border-t border-sidebar-border"
        hidden
        initial={false}
        animate={{ opacity: expanded ? 1 : 0, height: expanded ? "auto" : 0 }}
        transition={{ duration: 0.2 }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 p-3 h-auto hover:bg-sidebar-accent transition-colors hp-focus-ring"
              aria-label={`Menu do usuário ${userName}`}
            >
              <div className="flex items-center">
                <Avatar
                  className="h-9 w-9 ring-2 ring-gold-200 flex-shrink-0"
                  style={{ minWidth: 36, minHeight: 36 }}
                >
                  <AvatarImage
                    src={userAvatar}
                    alt={`Avatar de ${userName}`}
                    className="object-cover h-full w-full"
                  />
                  <AvatarFallback className="hp-gradient text-primary-foreground text-sm font-semibold">
                    {getUserInitials(userName)}
                  </AvatarFallback>
                </Avatar>
                {expanded && (
                  <div className="flex flex-col items-start flex-1 text-left ml-3">
                    <span className="text-sm font-medium text-sidebar-foreground">
                      {userName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getRoleLabel(userRole)}
                    </span>
                  </div>
                )}
                {expanded && (
                  <ChevronDown
                    className="h-4 w-4 text-muted-foreground ml-2"
                    aria-hidden="true"
                  />
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56"
            aria-label="Menu de opções do usuário"
          >
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {userName}
                </p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/perfil"
                className="flex items-center gap-3 cursor-pointer hp-focus-ring"
              >
                <div
                  className="w-4 h-4 rounded-full bg-gold-500"
                  aria-hidden="true"
                />
                Meu Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/configuracoes"
                className="flex items-center gap-3 cursor-pointer hp-focus-ring"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer hp-focus-ring"
              role="button"
              aria-label="Sair do sistema"
            >
              <LogOut className="h-4 w-4 mr-3" aria-hidden="true" />
              <Button onClick={() => { }} variant="outline">
                Sair do Sistema
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    </motion.div>
  );
};

export default Sidebar;
