"use client"

import React, { useState, useEffect } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Bell,
  LogOut,
  AlertTriangle,
  CheckCircle,
  Package,
  ChevronDown,
  Loader2,
} from 'lucide-react'
import { useLowStockAlert } from '@/components/dashboard/estoque/hooks/useLowStockAlert'
import { useNotificationStatus } from '@/hooks/useNotificationStatus'
import { useNotifications } from './NotificationProvider'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface DashboardHeaderProps {
  title: string
  subtitle?: string
  user?: {
    name: string
    email: string
    avatar?: string
  }
  sidebarWidth?: number
}

export function DashboardHeader({ title, subtitle, user, sidebarWidth = 256 }: DashboardHeaderProps) {
  const { notificationProducts, totalAlert, dismissNotification } = useLowStockAlert()
  const { markAsRead, markAllAsRead, isRead } = useNotificationStatus()
  const { hasNewNotifications, refreshNotifications } = useNotifications()
  const { signOut } = useAdminAuth()

  // Use framer-motion's useScroll for better performance
  const { scrollY } = useScroll()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Transform values for smooth animations
  const headerHeight = useTransform(scrollY, [0, 100], [96, 64])
  const headerPadding = useTransform(scrollY, [0, 100], [24, 16])
  const titleSize = useTransform(scrollY, [0, 100], [24, 20])
  const headerShadow = useTransform(scrollY, [0, 100], [0, 0.15])

  // Responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Update scroll state
  useEffect(() => {
    const unsubscribe = scrollY.on('change', latest => {
      const newIsScrolled = latest > 50
      if (newIsScrolled !== isScrolled) {
        setIsScrolled(newIsScrolled)
      }
    })

    return () => unsubscribe()
  }, [scrollY, isScrolled])

  // Handle logout with loading state
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // O signOut já trata o redirecionamento e limpeza
    } finally {
      setIsLoggingOut(false)
    }
  }

  const allNotifications = [
    ...notificationProducts.outOfStock.map(p => ({
      ...p,
      id: `${p.id}_out_of_stock`,
      productId: p.id,
      priority: 'critical' as const,
      type: 'out_of_stock' as const
    })),
    ...notificationProducts.critical.map(p => ({
      ...p,
      id: `${p.id}_critical`,
      productId: p.id,
      priority: 'high' as const,
      type: 'critical' as const
    })),
    ...notificationProducts.lowStock.slice(0, 5).map(p => ({
      ...p,
      id: `${p.id}_low_stock`,
      productId: p.id,
      priority: 'medium' as const,
      type: 'low_stock' as const
    }))
  ]

  const unreadNotifications = allNotifications.filter(n => !isRead(n.id))

  // Refresh notifications when component mounts or data changes
  useEffect(() => {
    refreshNotifications()
  }, [totalAlert, refreshNotifications])

  const handleMarkAsRead = (id: string) => {
    markAsRead(id)
    // Extrair productId do id da notificação
    const notification = allNotifications.find(n => n.id === id)
    if (notification) {
      dismissNotification(notification.productId)
    }
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead(allNotifications.map(n => n.id))
    // Dismissar todas as notificações
    allNotifications.forEach(n => dismissNotification(n.productId))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-red-500 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getNotificationMessage = (notification: typeof allNotifications[0]) => {
    switch (notification.type) {
      case 'out_of_stock':
        return `Produto ${notification.name} está sem estoque`
      case 'critical':
        return `Produto ${notification.name} com estoque crítico (${notification.current_stock} un.)`
      case 'low_stock':
        return `Produto ${notification.name} com estoque baixo (${notification.current_stock} un.)`
      default:
        return 'Alerta de estoque'
    }
  }

  return (
    <motion.div
      className={cn(
        "border-0 bg-white/95 backdrop-blur-sm fixed top-0 z-50 transition-all duration-300",
        "md:border-b md:border-gray-200/50",
        "hover:bg-white/98 hover:backdrop-blur-md"
      )}
      style={{
        height: headerHeight,
        left: isMobile ? 0 : sidebarWidth,
        right: 0,
        boxShadow: useTransform(headerShadow, value => `0 2px ${value * 10}px rgba(0,0,0,${value})`),
        willChange: 'height, box-shadow, left'
      }}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      whileHover={{
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        transition: { duration: 0.2 }
      }}
    >
      <motion.div
        className="flex items-center justify-between h-full"
        style={{
          paddingLeft: headerPadding,
          paddingRight: headerPadding
        }}
      >
        {/* Left section - Title and subtitle */}
        <motion.div
          className="flex-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <motion.h1
            className="font-bold text-gray-900 leading-tight"
            style={{ fontSize: titleSize }}
            layout
          >
            {title}
          </motion.h1>
          <AnimatePresence mode="wait">
            {subtitle && !isScrolled && (
              <motion.p
                className="text-sm text-gray-600 mt-1"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {subtitle}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right section - Actions and user menu */}
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {/* Stock notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative p-2 hover:bg-gray-100"
              >
                <motion.div
                  animate={{
                    scale: hasNewNotifications ? [1, 1.1, 1] : 1,
                    color: hasNewNotifications ? '#ef4444' : '#4b5563'
                  }}
                  transition={{
                    duration: hasNewNotifications ? 0.6 : 0.2,
                    repeat: hasNewNotifications ? Infinity : 0,
                    repeatType: 'loop'
                  }}
                >
                  <Bell className="h-5 w-5" />
                </motion.div>
                <AnimatePresence>
                  {unreadNotifications.length > 0 && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: hasNewNotifications ? [1, 1.2, 1] : 1,
                        opacity: 1
                      }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{
                        duration: hasNewNotifications ? 0.5 : 0.2,
                        repeat: hasNewNotifications ? Infinity : 0,
                        repeatType: 'loop'
                      }}
                      className="absolute -top-1 -right-1"
                    >
                      <Badge
                        variant="destructive"
                        className="h-5 w-5 flex items-center justify-center text-xs p-0"
                      >
                        {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Alertas de Estoque</h3>
                  {unreadNotifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="text-xs h-auto p-1"
                    >
                      Marcar como lido
                    </Button>
                  )}
                </div>
                {totalAlert > 0 && (
                  <p className="text-xs text-gray-600 mt-1">
                    {totalAlert} produtos precisam de atenção
                  </p>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {allNotifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-900 mb-1">Estoque em dia!</p>
                    <p className="text-xs text-gray-600">Todos os produtos estão com estoque adequado</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {allNotifications.map((notification) => {
                      const notificationRead = isRead(notification.id)
                      return (
                        <div
                          key={notification.id}
                          className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${!notificationRead ? 'bg-blue-50' : ''
                            }`}
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-1 rounded border ${getPriorityColor(notification.priority)}`}>
                              {notification.type === 'out_of_stock' && <Package className="h-3 w-3" />}
                              {notification.type !== 'out_of_stock' && <AlertTriangle className="h-3 w-3" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${!notificationRead ? 'font-medium' : ''}`}>
                                {getNotificationMessage(notification)}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">
                                  {notification.sku} • Min: {notification.min_stock} un.
                                </span>
                                {!notificationRead && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                Necessário: +{notification.units_needed} un. • {formatCurrency(notification.retail_price)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {totalAlert > 0 && (
                <div className="p-3 border-t bg-gray-50">
                  <Button size="sm" className="w-full" variant="outline" onClick={() => window.location.href = '/dashboard/estoque?tab=alerts'}>
                    Ver todos os alertas ({totalAlert})
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* User menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-3 py-2 h-auto hover:bg-gray-100 rounded-lg"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-xs">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuItem
                  className="text-red-600 cursor-pointer"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4 mr-2" />
                  )}
                  {isLoggingOut ? 'Saindo...' : 'Sair'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
