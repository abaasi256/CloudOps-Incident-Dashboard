import React from 'react'
import { Link } from 'react-router-dom'
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Plus,
  TrendingUp,
  Activity
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { useIncidents, useIncidentStats } from '../hooks/useIncidents'

const Dashboard = () => {
  const { incidents, loading: incidentsLoading } = useIncidents()
  const { stats, loading: statsLoading } = useIncidentStats()

  // Calculate recent metrics
  const activeIncidents = incidents.filter(i => i.status !== 'Resolved')
  const criticalIncidents = incidents.filter(i => i.severity === 'Critical' && i.status !== 'Resolved')
  const recentIncidents = incidents.slice(0, 5)

  // Mock data for charts (replace with real data)
  const trendData = [
    { name: 'Mon', incidents: 4, resolved: 2 },
    { name: 'Tue', incidents: 3, resolved: 5 },
    { name: 'Wed', incidents: 6, resolved: 4 },
    { name: 'Thu', incidents: 8, resolved: 6 },
    { name: 'Fri', incidents: 5, resolved: 7 },
    { name: 'Sat', incidents: 2, resolved: 3 },
    { name: 'Sun', incidents: 1, resolved: 2 },
  ]

  const severityData = stats ? [
    { name: 'Critical', value: stats.bySeverity?.Critical || 0, color: '#dc2626' },
    { name: 'High', value: stats.bySeverity?.High || 0, color: '#ea580c' },
    { name: 'Medium', value: stats.bySeverity?.Medium || 0, color: '#ca8a04' },
    { name: 'Low', value: stats.bySeverity?.Low || 0, color: '#16a34a' },
  ] : []

  if (incidentsLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Active Incidents"
          value={activeIncidents.length}
          icon={AlertTriangle}
          color="text-red-600"
          bgColor="bg-red-50"
        />
        <StatsCard
          title="Critical"
          value={criticalIncidents.length}
          icon={AlertTriangle}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
        <StatsCard
          title="Resolved Today"
          value={stats?.byStatus?.Resolved || 0}
          icon={CheckCircle}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatsCard
          title="MTTR"
          value="2.3h"
          icon={Clock}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Trends */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Incident Trends (7 days)
            </h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="incidents" fill="#ef4444" name="New Incidents" />
              <Bar dataKey="resolved" fill="#22c55e" name="Resolved" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Distribution */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Incidents by Severity
            </h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Incidents
          </h3>
          <Link
            to="/incidents/new"
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Incident</span>
          </Link>
        </div>

        {recentIncidents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No incidents found. Your systems are running smoothly! 🎉
          </div>
        ) : (
          <div className="space-y-3">
            {recentIncidents.map((incident) => (
              <IncidentRow key={incident.incidentId} incident={incident} />
            ))}
          </div>
        )}

        <div className="mt-4 text-center">
          <Link
            to="/incidents"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View all incidents →
          </Link>
        </div>
      </div>
    </div>
  )
}

const StatsCard = ({ title, value, icon: Icon, color, bgColor }) => (
  <div className="card">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${bgColor}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  </div>
)

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

  return (
    <Link
      to={`/incidents/${incident.incidentId}`}
      className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h4 className="font-medium text-gray-900">{incident.title}</h4>
            <span className={`badge ${getSeverityBadge(incident.severity)}`}>
              {incident.severity}
            </span>
            <span className={`badge ${getStatusBadge(incident.status)}`}>
              {incident.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {incident.service} • {new Date(incident.timestamp).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">
            {new Date(incident.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </Link>
  )
}

export default Dashboard
