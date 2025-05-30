import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Plus, 
  RefreshCw,
  AlertTriangle,
  Clock,
  User
} from 'lucide-react'
import { useIncidents } from '../hooks/useIncidents'

const IncidentList = () => {
  const { incidents, loading, error, fetchIncidents } = useIncidents()
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    search: ''
  })
  const [filteredIncidents, setFilteredIncidents] = useState([])

  useEffect(() => {
    let filtered = incidents

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(incident => incident.status === filters.status)
    }

    // Filter by severity
    if (filters.severity) {
      filtered = filtered.filter(incident => incident.severity === filters.severity)
    }

    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(incident =>
        incident.title.toLowerCase().includes(searchTerm) ||
        incident.description.toLowerCase().includes(searchTerm) ||
        incident.service.toLowerCase().includes(searchTerm)
      )
    }

    setFilteredIncidents(filtered)
  }, [incidents, filters])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleRefresh = () => {
    fetchIncidents()
  }

  const getSeverityBadge = (severity) => {
    const badges = {
      Critical: 'badge-critical',
      High: 'badge-high',
      Medium: 'badge-medium',
      Low: 'badge-low',
    }
    return badges[severity] || 'badge-medium'
  }

  const getStatusBadge = (status) => {
    const badges = {
      New: 'badge-new',
      Acknowledged: 'badge-acknowledged',
      InProgress: 'badge-in-progress',
      Resolved: 'badge-resolved',
    }
    return badges[status] || 'badge-new'
  }

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now - time) / (1000 * 60))

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Incidents</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={handleRefresh} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Incidents</h2>
          <p className="text-gray-600 mt-1">
            {filteredIncidents.length} of {incidents.length} incidents
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="btn btn-secondary flex items-center space-x-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link to="/incidents/new" className="btn btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Create Incident</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search incidents..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="InProgress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          {/* Severity Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.severity}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => setFilters({ status: '', severity: '', search: '' })}
            className="btn btn-secondary flex items-center justify-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      {/* Incidents List */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No incidents found</h3>
            <p className="text-gray-600">
              {incidents.length === 0 
                ? "No incidents have been created yet." 
                : "No incidents match your current filters."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIncidents.map((incident) => (
              <IncidentRow key={incident.incidentId} incident={incident} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const IncidentRow = ({ incident }) => {
  const getSeverityBadge = (severity) => {
    const badges = {
      Critical: 'badge-critical',
      High: 'badge-high',
      Medium: 'badge-medium',
      Low: 'badge-low',
    }
    return badges[severity] || 'badge-medium'
  }

  const getStatusBadge = (status) => {
    const badges = {
      New: 'badge-new',
      Acknowledged: 'badge-acknowledged',
      InProgress: 'badge-in-progress',
      Resolved: 'badge-resolved',
    }
    return badges[status] || 'badge-new'
  }

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now - time) / (1000 * 60))

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  return (
    <Link
      to={`/incidents/${incident.incidentId}`}
      className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors fade-in"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="font-medium text-gray-900">{incident.title}</h3>
            <span className={`badge ${getSeverityBadge(incident.severity)}`}>
              {incident.severity}
            </span>
            <span className={`badge ${getStatusBadge(incident.status)}`}>
              {incident.status}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {incident.description}
          </p>
          
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span className="flex items-center space-x-1">
              <span>Service:</span>
              <span className="font-medium">{incident.service}</span>
            </span>
            
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{formatTimeAgo(incident.timestamp)}</span>
            </span>
            
            {incident.assignedTo && (
              <span className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>{incident.assignedTo}</span>
              </span>
            )}
          </div>
        </div>
        
        <div className="ml-4 text-right">
          <p className="text-xs text-gray-500">
            ID: {incident.incidentId}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(incident.timestamp).toLocaleDateString()}
          </p>
        </div>
      </div>
    </Link>
  )
}

export default IncidentList
