'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Activity, 
  Eye, 
  Lock, 
  FileX,
  TrendingUp,
  Clock,
  Users,
  Zap
} from 'lucide-react';
import { securityMonitor, SecurityMetrics, SecurityEvent } from '@/utils/securityMonitoring';

interface SecurityDashboardProps {
  onClose: () => void;
}

export default function SecurityDashboard({ onClose }: SecurityDashboardProps) {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'events' | 'threats'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSecurityData();
    const interval = setInterval(loadSecurityData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSecurityData = () => {
    try {
      const securityMetrics = securityMonitor.getMetrics();
      const events = securityMonitor.getRecentEvents(20);
      
      setMetrics(securityMetrics);
      setRecentEvents(events);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load security data:', error);
      setIsLoading(false);
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 80) return 'text-red-500';
    if (riskScore >= 60) return 'text-orange-500';
    if (riskScore >= 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-green-500 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'file_upload': return <FileX className="h-4 w-4" />;
      case 'api_call': return <Activity className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'suspicious_activity': return <AlertTriangle className="h-4 w-4" />;
      case 'rate_limit_exceeded': return <Zap className="h-4 w-4" />;
      case 'malware_detected': return <Shield className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300">Loading security data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Security Dashboard
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'overview', label: 'Overview', icon: <Activity className="h-4 w-4" /> },
            { id: 'events', label: 'Recent Events', icon: <Clock className="h-4 w-4" /> },
            { id: 'threats', label: 'Threats', icon: <AlertTriangle className="h-4 w-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {selectedTab === 'overview' && metrics && (
            <div className="space-y-6">
              {/* Risk Score */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Security Risk Score
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Overall security posture assessment
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${getRiskColor(metrics.riskScore)}`}>
                      {metrics.riskScore}
                    </div>
                    <div className="text-sm text-gray-500">
                      / 100
                    </div>
                  </div>
                </div>
                <div className="mt-4 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      metrics.riskScore >= 80 ? 'bg-red-500' :
                      metrics.riskScore >= 60 ? 'bg-orange-500' :
                      metrics.riskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${metrics.riskScore}%` }}
                  />
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center">
                    <Activity className="h-8 w-8 text-blue-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Events</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {metrics.totalEvents.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center">
                    <XCircle className="h-8 w-8 text-red-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Blocked Events</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {metrics.blockedEvents.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-green-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last 24h</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {metrics.last24Hours.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Top Source</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {metrics.topSources[0]?.source || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Types */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Events by Type
                </h3>
                <div className="space-y-3">
                  {Object.entries(metrics.eventsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                        {type.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'events' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Security Events
              </h3>
              <div className="space-y-2">
                {recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getEventIcon(event.type)}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {event.type.replace('_', ' ').toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {event.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}
                        >
                          {event.severity.toUpperCase()}
                        </span>
                        {event.blocked && (
                          <Lock className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    {event.details && (
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(event.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === 'threats' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Threat Analysis
              </h3>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Security Monitoring Active
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      All file uploads and API calls are being monitored for security threats.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
