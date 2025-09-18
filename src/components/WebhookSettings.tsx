'use client';

import { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Edit, Check, X, Globe, Key, Clock, AlertCircle } from 'lucide-react';

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  active: boolean;
  createdAt: string;
  lastUsed?: string;
  deliveryCount: number;
  failureCount: number;
}

interface WebhookSettingsProps {
  onReset: () => void;
}

const AVAILABLE_EVENTS = [
  { id: 'pdf.compressed', name: 'PDF Compression Complete', description: 'When PDF compression finishes' },
  { id: 'pdf.merged', name: 'PDF Merge Complete', description: 'When PDF merge operation finishes' },
  { id: 'pdf.split', name: 'PDF Split Complete', description: 'When PDF split operation finishes' },
  { id: 'pdf.converted', name: 'PDF Conversion Complete', description: 'When PDF conversion finishes' },
  { id: 'pdf.protected', name: 'PDF Protection Complete', description: 'When PDF password protection is applied' },
  { id: 'pdf.unlocked', name: 'PDF Unlock Complete', description: 'When PDF password is removed' },
  { id: 'pdf.signed', name: 'PDF Signing Complete', description: 'When PDF digital signature is applied' },
  { id: 'pdf.watermarked', name: 'PDF Watermark Complete', description: 'When watermark is added to PDF' },
  { id: 'pdf.ocr', name: 'PDF OCR Complete', description: 'When OCR processing finishes' },
  { id: 'pdf.error', name: 'Processing Error', description: 'When any operation fails' },
  { id: 'batch.complete', name: 'Batch Processing Complete', description: 'When batch operation finishes' },
  { id: 'batch.progress', name: 'Batch Progress Update', description: 'Progress updates during batch processing' }
];

export default function WebhookSettings({ onReset }: WebhookSettingsProps) {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    secret: '',
    events: [] as string[]
  });

  // Load webhooks from localStorage
  useEffect(() => {
    const savedWebhooks = localStorage.getItem('docnestly_webhooks');
    if (savedWebhooks) {
      setWebhooks(JSON.parse(savedWebhooks));
    }
  }, []);

  // Save webhooks to localStorage
  const saveWebhooks = (updatedWebhooks: WebhookEndpoint[]) => {
    setWebhooks(updatedWebhooks);
    localStorage.setItem('docnestly_webhooks', JSON.stringify(updatedWebhooks));
  };

  const handleAddWebhook = () => {
    if (!formData.name || !formData.url || formData.events.length === 0) return;

    const newWebhook: WebhookEndpoint = {
      id: Date.now().toString(),
      name: formData.name,
      url: formData.url,
      secret: formData.secret || undefined,
      events: formData.events,
      active: true,
      createdAt: new Date().toISOString(),
      deliveryCount: 0,
      failureCount: 0
    };

    saveWebhooks([...webhooks, newWebhook]);
    setFormData({ name: '', url: '', secret: '', events: [] });
    setShowAddForm(false);
  };

  const handleDeleteWebhook = (id: string) => {
    saveWebhooks(webhooks.filter(w => w.id !== id));
  };

  const handleToggleWebhook = (id: string) => {
    saveWebhooks(webhooks.map(w => 
      w.id === id ? { ...w, active: !w.active } : w
    ));
  };

  const handleTestWebhook = async (webhook: WebhookEndpoint) => {
    setTestingWebhook(webhook.id);
    
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from DocNestly',
        webhook_id: webhook.id,
        webhook_name: webhook.name
      }
    };

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DocNestly-Webhook/1.0',
          ...(webhook.secret && { 'X-DocNestly-Signature': `sha256=${webhook.secret}` })
        },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        // Update success count
        saveWebhooks(webhooks.map(w => 
          w.id === webhook.id 
            ? { ...w, deliveryCount: w.deliveryCount + 1, lastUsed: new Date().toISOString() }
            : w
        ));
        alert('Webhook test successful!');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      // Update failure count
      saveWebhooks(webhooks.map(w => 
        w.id === webhook.id 
          ? { ...w, failureCount: w.failureCount + 1 }
          : w
      ));
      alert(`Webhook test failed: ${error}`);
    }

    setTestingWebhook(null);
  };

  const handleEventToggle = (eventId: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Bell className="h-8 w-8 mr-3 text-blue-600" />
              Webhook Notifications
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Get real-time notifications when your PDF processing operations complete
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Webhook
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <Globe className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-900 dark:text-blue-100">Real-time Updates</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Get instant notifications when operations complete
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <Key className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium text-green-900 dark:text-green-100">Secure Delivery</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Optional webhook secrets for verified delivery
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-purple-600 mr-2" />
              <span className="font-medium text-purple-900 dark:text-purple-100">Event Filtering</span>
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
              Choose exactly which events to receive
            </p>
          </div>
        </div>
      </div>

      {/* Add Webhook Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Webhook</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Webhook Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., My Application Webhook"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Webhook URL
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="https://your-app.com/webhooks/docnestly"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Secret (Optional)
              </label>
              <input
                type="password"
                value={formData.secret}
                onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Optional secret for webhook verification"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Events to Subscribe
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                {AVAILABLE_EVENTS.map(event => (
                  <label key={event.id} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.events.includes(event.id)}
                      onChange={() => handleEventToggle(event.id)}
                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{event.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{event.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddWebhook}
              disabled={!formData.name || !formData.url || formData.events.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              Add Webhook
            </button>
          </div>
        </div>
      )}

      {/* Webhooks List */}
      <div className="space-y-4">
        {webhooks.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Webhooks Configured</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Add your first webhook to start receiving real-time notifications
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Add Your First Webhook
            </button>
          </div>
        ) : (
          webhooks.map(webhook => (
            <div key={webhook.id} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{webhook.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      webhook.active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {webhook.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Globe className="h-4 w-4 mr-1" />
                        {webhook.url}
                      </span>
                      {webhook.secret && (
                        <span className="flex items-center">
                          <Key className="h-4 w-4 mr-1" />
                          Secured
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span>Events: {webhook.events.length}</span>
                    <span>Delivered: {webhook.deliveryCount}</span>
                    {webhook.failureCount > 0 && (
                      <span className="text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Failures: {webhook.failureCount}
                      </span>
                    )}
                    {webhook.lastUsed && (
                      <span>Last used: {new Date(webhook.lastUsed).toLocaleDateString()}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {webhook.events.map(eventId => {
                      const event = AVAILABLE_EVENTS.find(e => e.id === eventId);
                      return event ? (
                        <span key={eventId} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded">
                          {event.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleTestWebhook(webhook)}
                    disabled={testingWebhook === webhook.id}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Test webhook"
                  >
                    {testingWebhook === webhook.id ? (
                      <Clock className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleToggleWebhook(webhook.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      webhook.active
                        ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                        : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                    }`}
                    title={webhook.active ? 'Disable webhook' : 'Enable webhook'}
                  >
                    {webhook.active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  </button>
                  
                  <button
                    onClick={() => handleDeleteWebhook(webhook.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete webhook"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Documentation */}
      <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Webhook Documentation</h3>
        
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Payload Format</h4>
            <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto">
{`{
  "event": "pdf.compressed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "operation_id": "op_123456",
    "original_filename": "document.pdf",
    "original_size": 2048576,
    "compressed_size": 1024288,
    "reduction_percentage": 50,
    "download_url": "https://docnestly.com/download/abc123",
    "expires_at": "2024-01-16T10:30:00Z"
  }
}`}
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Security</h4>
            <p>
              If you provide a secret, DocNestly will include an <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">X-DocNestly-Signature</code> header 
              with a SHA-256 HMAC of the payload for verification.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Retry Policy</h4>
            <p>
              Failed webhook deliveries will be retried up to 3 times with exponential backoff (1s, 5s, 25s delays).
            </p>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="mt-8 flex justify-start">
        <button
          onClick={onReset}
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to All Tools
        </button>
      </div>
    </div>
  );
}
