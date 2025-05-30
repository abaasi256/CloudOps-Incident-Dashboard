import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Amplify } from 'aws-amplify'
import App from './App.jsx'
import './index.css'

// Clear any cached Amplify configuration
if (typeof window !== 'undefined') {
  localStorage.clear()
  sessionStorage.clear()
}

// AWS Amplify configuration with current values
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-east-1_K1VC4bGwq',
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '2jsetm0uofvvfnb6bvqcsta0af',
      loginWith: {
        email: true,
        username: false,
      },
      signUpVerificationMethod: 'code',
      userAttributes: {
        email: {
          required: true,
        },
        name: {
          required: true,
        },
      },
      allowGuestAccess: false,
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
  API: {
    REST: {
      CloudOpsAPI: {
        endpoint: import.meta.env.VITE_API_GATEWAY_URL || 'https://n92jex9gx7.execute-api.us-east-1.amazonaws.com/v1',
        region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
        service: 'execute-api',
        // Add authentication configuration for the API
        custom_header: async () => {
          // This will automatically add the Authorization header with Cognito JWT token
          return {}
        }
      },
    },
  },
}

// Initialize Amplify with force reconfiguration
try {
  Amplify.configure(amplifyConfig)
  console.log('✅ Amplify configured successfully')
  console.log('API Endpoint:', amplifyConfig.API.REST.CloudOpsAPI.endpoint)
  console.log('User Pool ID:', amplifyConfig.Auth.Cognito.userPoolId)
} catch (error) {
  console.error('❌ Amplify configuration error:', error)
  // Force reconfigure
  Amplify.configure(amplifyConfig)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
