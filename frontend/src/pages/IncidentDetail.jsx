import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  X,
  Clock,
  User,
  Tag,
  AlertTriangle
} from 'lucide-react'
import { useIncidents } from '../hooks/useIncidents'

const IncidentDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getIncident, updateIncident, loading } = useIncidents()
  
  const [incident, setIncident] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({})
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const data = await getIncident(id)
        setIncident(data)
        setEditData(data)
      } catch (err) {
        setError(err.message)
      }
    }

    if (id) {
      fetchIncident()
    }
  }, [id, getIncident])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditData(incident)
  }

  const handleSave = async () => {
    try {
      const updatedIncident = await updateIncident(id, editData)
      setIncident(updatedIncident)
      setIsEditing(false)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditData(prev => ({
      ...prev,
      [name]: value
    }))
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

  const formatDateTime = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  const calculateDuration = (start, end) => {
    if (!end) return 'Ongoing'
    
    const duration = new Date(end) - new Date(start)
    const hours = Math.floor(duration / (1000 * 60 * 60))
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (loading && !incident) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Incident</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/incidents')} 
            className="btn btn-primary"
          >
            Back to Incidents
          </button>
        </div>
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Incident Not Found</h3>
          <p className="text-gray-600 mb-4">The incident you're looking for doesn't exist.</p>
          <button 
            onClick={() => navigate('/incidents')} 
            className="btn btn-primary"
          >
            Back to Incidents
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/incidents')}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {incident.title}
            </h1>
            <p className="text-gray-600">ID: {incident.incidentId}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="btn btn-secondary flex items-center space-x-2"
                disabled={loading}
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary flex items-center space-x-2"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Incident Details
            </h2>
            
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={editData.title || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    value={editData.description || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
                  <p className="text-gray-900">
                    {incident.description || 'No description provided'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Timeline
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Created</p>
                  <p className="text-sm text-gray-600">
                    {formatDateTime(incident.createdAt || incident.timestamp)}
                  </p>
                </div>
              </div>
              
              {incident.updatedAt && incident.updatedAt !== incident.createdAt && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Last Updated</p>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(incident.updatedAt)}
                    </p>
                  </div>
                </div>
              )}
              
              {incident.resolvedAt && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Resolved</p>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(incident.resolvedAt)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Duration: {calculateDuration(incident.timestamp, incident.resolvedAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Status & Priority
            </h2>
            
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={editData.status || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="New">New</option>
                    <option value="Acknowledged">Acknowledged</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Severity
                  </label>
                  <select
                    name="severity"
                    value={editData.severity || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Status</span>
                  <span className={`badge ${getStatusBadge(incident.status)}`}>
                    {incident.status}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Severity</span>
                  <span className={`badge ${getSeverityBadge(incident.severity)}`}>
                    {incident.severity}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Assignment & Service */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Assignment & Service
            </h2>
            
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned To
                  </label>
                  <input
                    type="email"
                    name="assignedTo"
                    value={editData.assignedTo || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service
                  </label>
                  <input
                    type="text"
                    name="service"
                    value={editData.service || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    {incident.assignedTo || 'Unassigned'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    {incident.service}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    {incident.status === 'Resolved' 
                      ? calculateDuration(incident.timestamp, incident.resolvedAt)
                      : calculateDuration(incident.timestamp, new Date().toISOString())
                    }
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          {incident.tags && incident.tags.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Tags
              </h2>
              
              <div className="flex flex-wrap gap-2">
                {incident.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default IncidentDetail
