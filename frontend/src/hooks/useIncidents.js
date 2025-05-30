import { useState, useEffect } from 'react'
import { get, post, put } from 'aws-amplify/api'

const API_NAME = 'CloudOpsAPI'

export const useIncidents = () => {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchIncidents = async (filters = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const queryParams = new URLSearchParams()
      if (filters.status) queryParams.append('status', filters.status)
      if (filters.severity) queryParams.append('severity', filters.severity)
      if (filters.limit) queryParams.append('limit', filters.limit.toString())

      console.log('🔍 Fetching incidents from API...')
      
      // Use test endpoints for now to ensure API connectivity works
      const response = await get({
        apiName: API_NAME,
        path: `/test-incidents${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      }).response

      const data = await response.body.json()
      console.log('✅ Incidents API response:', data)
      setIncidents(data.data?.incidents || [])
      
      if (data.data?.incidents) {
        console.log(`📊 Found ${data.data.incidents.length} incidents`)
      }
    } catch (err) {
      console.error('❌ Error fetching incidents:', err)
      let errorMessage = 'A network error has occurred.'
      
      if (err.response) {
        try {
          const errorData = await err.response.body.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (parseError) {
          console.error('Error parsing response:', parseError)
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const createIncident = async (incidentData) => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🚀 Creating incident:', incidentData)
      
      // Use test endpoint for now to ensure API connectivity works
      const response = await post({
        apiName: API_NAME,
        path: '/test-incidents',
        options: {
          body: incidentData,
        },
      }).response

      const data = await response.body.json()
      console.log('✅ Create incident response:', data)
      
      // Refresh the list after creating
      await fetchIncidents()
      
      return { 
        success: true, 
        data: data.data, 
        message: 'Incident created successfully!' 
      }
    } catch (err) {
      console.error('❌ Error creating incident:', err)
      let errorMessage = 'Failed to create incident'
      
      if (err.response) {
        try {
          const errorData = await err.response.body.json()
          errorMessage = errorData.error || errorData.message || errorMessage
          console.log('Error response data:', errorData)
        } catch (parseError) {
          console.error('Error parsing response:', parseError)
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const updateIncident = async (incidentId, updates) => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔄 Updating incident:', incidentId, updates)
      
      // Use test endpoint for now
      const response = await put({
        apiName: API_NAME,
        path: `/test-incidents/${incidentId}`,
        options: {
          body: updates,
        },
      }).response

      const data = await response.body.json()
      console.log('✅ Update incident response:', data)
      
      await fetchIncidents() // Refresh the list
      return { 
        success: true, 
        data: data.data, 
        message: 'Incident updated successfully!' 
      }
    } catch (err) {
      console.error('❌ Error updating incident:', err)
      let errorMessage = 'Failed to update incident'
      
      if (err.response) {
        try {
          const errorData = await err.response.body.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (parseError) {
          console.error('Error parsing response:', parseError)
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const getIncident = async (incidentId) => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔍 Getting incident:', incidentId)
      
      // Use test endpoint for now
      const response = await get({
        apiName: API_NAME,
        path: `/test-incidents/${incidentId}`,
      }).response

      const data = await response.body.json()
      console.log('✅ Get incident response:', data)
      return data.data
    } catch (err) {
      console.error('❌ Error fetching incident:', err)
      let errorMessage = 'Failed to fetch incident'
      
      if (err.response) {
        try {
          const errorData = await err.response.body.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (parseError) {
          console.error('Error parsing response:', parseError)
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIncidents()
  }, [])

  return {
    incidents,
    loading,
    error,
    fetchIncidents,
    createIncident,
    updateIncident,
    getIncident,
  }
}

export const useIncidentStats = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('📊 Fetching incident stats...')
      
      // Use test endpoint for now
      const response = await get({
        apiName: API_NAME,
        path: '/test-incidents/stats',
      }).response

      const data = await response.body.json()
      console.log('✅ Stats response:', data)
      setStats(data.data)
    } catch (err) {
      console.error('❌ Error fetching stats:', err)
      let errorMessage = 'Failed to fetch incident statistics'
      
      if (err.response) {
        try {
          const errorData = await err.response.body.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (parseError) {
          console.error('Error parsing response:', parseError)
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    stats,
    loading,
    error,
    refreshStats: fetchStats,
  }
}
