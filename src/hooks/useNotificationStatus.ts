import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'stock_notifications_read'

export function useNotificationStatus() {
  const [readNotifications, setReadNotifications] = useState<string[]>([])

  // Load read notifications from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          setReadNotifications(JSON.parse(stored))
        }
      } catch (error) {
        console.error('Error loading notification status:', error)
      }
    }
  }, [])

  // Save to localStorage whenever read notifications change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(readNotifications))
      } catch (error) {
        console.error('Error saving notification status:', error)
      }
    }
  }, [readNotifications])

  const markAsRead = useCallback((notificationId: string) => {
    setReadNotifications(prev => {
      if (!prev.includes(notificationId)) {
        return [...prev, notificationId]
      }
      return prev
    })
  }, [])

  const markAsUnread = useCallback((notificationId: string) => {
    setReadNotifications(prev => prev.filter(id => id !== notificationId))
  }, [])

  const markAllAsRead = useCallback((notificationIds: string[]) => {
    setReadNotifications(prev => {
      const newRead = [...prev]
      notificationIds.forEach(id => {
        if (!newRead.includes(id)) {
          newRead.push(id)
        }
      })
      return newRead
    })
  }, [])

  const isRead = useCallback((notificationId: string) => {
    return readNotifications.includes(notificationId)
  }, [readNotifications])

  const clearAll = useCallback(() => {
    setReadNotifications([])
  }, [])

  return {
    readNotifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    isRead,
    clearAll
  }
}