import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import IncidentList from './pages/IncidentList'
import IncidentDetail from './pages/IncidentDetail'
import CreateIncident from './pages/CreateIncident'
import { AuthProvider } from './hooks/useAuth.jsx'
import { NotificationProvider } from './hooks/useNotification.jsx'

const customFormFields = {
  signIn: {
    username: {
      placeholder: 'Enter your email address',
    },
  },
  signUp: {
    email: {
      placeholder: 'Enter your email address',
      isRequired: true,
    },
    name: {
      placeholder: 'Enter your full name',
      isRequired: true,
    },
    password: {
      placeholder: 'Enter your password',
    },
    confirm_password: {
      placeholder: 'Confirm your password',
    },
  },
}

function App() {
  // Add version for cache busting
  const appVersion = import.meta.env.VITE_VERSION || '1.0.0'
  const buildTime = import.meta.env.VITE_BUILD_TIME || new Date().toISOString()
  
  // Log environment info for debugging
  console.log('CloudOps Dashboard v' + appVersion)
  console.log('Build time:', buildTime)
  console.log('API URL:', import.meta.env.VITE_API_GATEWAY_URL)
  console.log('Slack webhook configured:', !!import.meta.env.VITE_SLACK_WEBHOOK_URL)

  return (
    <NotificationProvider>
      <Authenticator formFields={customFormFields} hideSignUp={false}>
        {({ signOut, user }) => (
          <AuthProvider user={user} signOut={signOut}>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/incidents" element={<IncidentList />} />
                <Route path="/incidents/new" element={<CreateIncident />} />
                <Route path="/incidents/:id" element={<IncidentDetail />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
              
              {/* Version indicator for cache debugging */}
              <div className="fixed bottom-2 right-2 text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded opacity-50">
                v{appVersion} - {new Date(buildTime).toLocaleTimeString()}
              </div>
            </Layout>
          </AuthProvider>
        )}
      </Authenticator>
    </NotificationProvider>
  )
}

export default App
