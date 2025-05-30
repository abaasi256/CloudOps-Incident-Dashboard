import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Plus, 
  User, 
  LogOut,
  Bell
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useIncidentStats } from '../hooks/useIncidents'

const Layout = ({ children }) => {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const { stats } = useIncidentStats()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
    { name: 'Create Incident', href: '/incidents/new', icon: Plus },
  ]

  const isActive = (path) => location.pathname === path

  // Get notification count (total incidents)
  const notificationCount = stats?.total || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <AlertTriangle className="w-8 h-8 text-red-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">
            CloudOps
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  isActive(item.href)
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User menu */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user?.attributes?.name || user?.username || 'User'}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.attributes?.email}
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {getPageTitle(location.pathname)}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notification bell with working count */}
            <Link 
              to="/incidents"
              className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title={`${notificationCount} total incidents`}
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </Link>
            
            {/* Status indicator */}
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>System Operational</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

const getPageTitle = (pathname) => {
  switch (pathname) {
    case '/dashboard':
      return 'Dashboard'
    case '/incidents':
      return 'Incidents'
    case '/incidents/new':
      return 'Create Incident'
    default:
      if (pathname.startsWith('/incidents/')) {
        return 'Incident Details'
      }
      return 'CloudOps Dashboard'
  }
}

export default Layout
