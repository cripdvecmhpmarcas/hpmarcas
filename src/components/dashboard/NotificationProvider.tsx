"use client"

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { useLowStockAlert } from './estoque/hooks/useLowStockAlert'
import { useNotificationStatus } from '@/hooks/useNotificationStatus'

interface NotificationContextType {
  totalUnread: number
  totalAlerts: number
  hasNewNotifications: boolean
  lastNotificationTime: number
  refreshNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { notificationProducts, totalAlert } = useLowStockAlert()
  const { isRead } = useNotificationStatus()
  const [lastNotificationTime, setLastNotificationTime] = useState(0)
  const [hasNewNotifications, setHasNewNotifications] = useState(false)
  const [lastAlertCount, setLastAlertCount] = useState(0)

  const allNotifications = useMemo(() => [
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
    ...notificationProducts.lowStock.map(p => ({
      ...p,
      id: `${p.id}_low_stock`,
      productId: p.id,
      priority: 'medium' as const,
      type: 'low_stock' as const
    }))
  ], [notificationProducts])

  const totalUnread = allNotifications.filter(n => !isRead(n.id)).length
  // Total de alertas, incluindo lidos (para sumários)
  const totalAlerts = allNotifications.length

  const refreshNotifications = useCallback(() => {
    const currentTime = Date.now()
    setLastNotificationTime(currentTime)

    const unreadCount = allNotifications.filter(n => !isRead(n.id)).length

    // Só mostra animação se:
    // 1. Há notificações não lidas
    // 2. E o número total de alertas aumentou (novos alertas)
    if (unreadCount > 0 && totalAlert > lastAlertCount) {
      setHasNewNotifications(true)
      setLastAlertCount(totalAlert)
      // Remove a animação após 3 segundos
      setTimeout(() => setHasNewNotifications(false), 3000)
    } else if (totalAlert !== lastAlertCount) {
      setLastAlertCount(totalAlert)
      setHasNewNotifications(false)
    }
  }, [allNotifications, isRead, totalAlert, lastAlertCount])

  useEffect(() => {
    // Atualiza notificações quando há mudanças
    refreshNotifications()
  }, [refreshNotifications])

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'stock_notifications_read') {
        refreshNotifications()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [refreshNotifications])

  useEffect(() => {
    const interval = setInterval(() => {
      refreshNotifications()
    }, 120000) // 2 minutes

    return () => clearInterval(interval)
  }, [refreshNotifications])

  return (
    <NotificationContext.Provider value={{
      totalUnread,
      totalAlerts,
      hasNewNotifications,
      lastNotificationTime,
      refreshNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
