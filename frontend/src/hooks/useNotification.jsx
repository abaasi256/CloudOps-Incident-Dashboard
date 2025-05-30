import React, { createContext, useContext, useState } from 'react'
import Notification from '../components/Notification'

const NotificationContext = createContext()

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const addNotification = (notification) => {
    const id = Date.now() + Math.random()
    const newNotification = { ...notification, id }
    setNotifications(prev => [...prev, newNotification])
    return id
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const showSuccess = (title, message) => {
    return addNotification({ type: 'success', title, message })
  }

  const showError = (title, message) => {
    return addNotification({ type: 'error', title, message })
  }

  const showWarning = (title, message) => {
    return addNotification({ type: 'warning', title, message })
  }

  const showInfo = (title, message) => {
    return addNotification({ type: 'info', title, message })
  }

  return (
    <NotificationContext.Provider
      value={{
        addNotification,
        removeNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
      
      {/* Render notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  )
}
