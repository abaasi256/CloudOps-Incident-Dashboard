import React from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

const Notification = ({ type = 'info', title, message, onClose, autoClose = true }) => {
  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose()
      }, 5000) // Auto-close after 5 seconds
      
      return () => clearTimeout(timer)
    }
  }, [autoClose, onClose])

  const getNotificationStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 border border-green-200 text-green-800',
          icon: <CheckCircle className="w-5 h-5 text-green-400" />,
          title: 'text-green-800',
          message: 'text-green-700'
        }
      case 'error':
        return {
          container: 'bg-red-50 border border-red-200 text-red-800',
          icon: <XCircle className="w-5 h-5 text-red-400" />,
          title: 'text-red-800',
          message: 'text-red-700'
        }
      case 'warning':
        return {
          container: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
          icon: <AlertCircle className="w-5 h-5 text-yellow-400" />,
          title: 'text-yellow-800',
          message: 'text-yellow-700'
        }
      default:
        return {
          container: 'bg-blue-50 border border-blue-200 text-blue-800',
          icon: <AlertCircle className="w-5 h-5 text-blue-400" />,
          title: 'text-blue-800',
          message: 'text-blue-700'
        }
    }
  }

  const styles = getNotificationStyles()

  return (
    <div className={`fixed top-4 right-4 max-w-md w-full rounded-lg p-4 shadow-lg z-50 transition-all duration-300 ${styles.container}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {styles.icon}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${styles.title}`}>
              {title}
            </h3>
          )}
          {message && (
            <p className={`text-sm ${title ? 'mt-1' : ''} ${styles.message}`}>
              {message}
            </p>
          )}
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              onClick={onClose}
              className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.title}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Notification
