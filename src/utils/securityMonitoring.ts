import { DEFAULT_SECURITY_CONFIG } from './securityConfig';

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'file_upload' | 'api_call' | 'error' | 'suspicious_activity' | 'rate_limit_exceeded' | 'malware_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  userId?: string;
  blocked: boolean;
}

export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: { [key: string]: number };
  eventsBySeverity: { [key: string]: number };
  blockedEvents: number;
  last24Hours: number;
  topSources: { source: string; count: number }[];
  riskScore: number;
}

export class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private config = DEFAULT_SECURITY_CONFIG.monitoring;
  private alertThresholds = this.config.alertThresholds;

  logEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    if (!this.config.enableLogging) return;

    const securityEvent: SecurityEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date()
    };

    this.events.push(securityEvent);

    // Check for alerts
    this.checkAlerts(securityEvent);

    // Clean old events (keep last 1000)
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  logFileUpload(fileName: string, fileSize: number, validationResult: any, ipAddress?: string): void {
    const severity = this.determineFileUploadSeverity(validationResult);
    
    this.logEvent({
      type: 'file_upload',
      severity,
      source: 'file_uploader',
      details: {
        fileName,
        fileSize,
        validationResult,
        riskLevel: validationResult.riskLevel,
        securityScore: validationResult.securityScore
      },
      ipAddress,
      blocked: !validationResult.isValid || severity === 'critical'
    });
  }

  logApiCall(endpoint: string, method: string, statusCode: number, responseTime: number, ipAddress?: string): void {
    const severity = this.determineApiCallSeverity(statusCode, responseTime);
    
    this.logEvent({
      type: 'api_call',
      severity,
      source: 'api',
      details: {
        endpoint,
        method,
        statusCode,
        responseTime
      },
      ipAddress,
      blocked: statusCode >= 400
    });
  }

  logError(error: Error, context: string, ipAddress?: string): void {
    const severity = this.determineErrorSeverity(error);
    
    this.logEvent({
      type: 'error',
      severity,
      source: context,
      details: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      ipAddress,
      blocked: false
    });
  }

  logSuspiciousActivity(activity: string, details: any, ipAddress?: string): void {
    this.logEvent({
      type: 'suspicious_activity',
      severity: 'high',
      source: 'security_monitor',
      details: {
        activity,
        ...details
      },
      ipAddress,
      blocked: true
    });
  }

  logRateLimitExceeded(identifier: string, ipAddress?: string): void {
    this.logEvent({
      type: 'rate_limit_exceeded',
      severity: 'medium',
      source: 'rate_limiter',
      details: {
        identifier,
        limit: this.alertThresholds.apiCalls
      },
      ipAddress,
      blocked: true
    });
  }

  logMalwareDetected(fileName: string, details: any, ipAddress?: string): void {
    this.logEvent({
      type: 'malware_detected',
      severity: 'critical',
      source: 'malware_scanner',
      details: {
        fileName,
        ...details
      },
      ipAddress,
      blocked: true
    });
  }

  getMetrics(): SecurityMetrics {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentEvents = this.events.filter(event => event.timestamp >= last24Hours);
    
    const eventsByType: { [key: string]: number } = {};
    const eventsBySeverity: { [key: string]: number } = {};
    const sources: { [key: string]: number } = {};
    
    this.events.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      sources[event.source] = (sources[event.source] || 0) + 1;
    });
    
    const topSources = Object.entries(sources)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const blockedEvents = this.events.filter(event => event.blocked).length;
    const riskScore = this.calculateRiskScore();
    
    return {
      totalEvents: this.events.length,
      eventsByType,
      eventsBySeverity,
      blockedEvents,
      last24Hours: recentEvents.length,
      topSources,
      riskScore
    };
  }

  getRecentEvents(limit: number = 50): SecurityEvent[] {
    return this.events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getEventsByType(type: string, limit: number = 50): SecurityEvent[] {
    return this.events
      .filter(event => event.type === type)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getEventsBySeverity(severity: string, limit: number = 50): SecurityEvent[] {
    return this.events
      .filter(event => event.severity === severity)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineFileUploadSeverity(validationResult: any): 'low' | 'medium' | 'high' | 'critical' {
    if (!validationResult.isValid) return 'critical';
    if (validationResult.riskLevel === 'critical') return 'critical';
    if (validationResult.riskLevel === 'high') return 'high';
    if (validationResult.riskLevel === 'medium') return 'medium';
    return 'low';
  }

  private determineApiCallSeverity(statusCode: number, responseTime: number): 'low' | 'medium' | 'high' | 'critical' {
    if (statusCode >= 500) return 'critical';
    if (statusCode >= 400) return 'high';
    if (responseTime > 5000) return 'medium';
    return 'low';
  }

  private determineErrorSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    if (error.name === 'SecurityError') return 'critical';
    if (error.name === 'ValidationError') return 'high';
    if (error.name === 'NetworkError') return 'medium';
    return 'low';
  }

  private calculateRiskScore(): number {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentEvents = this.events.filter(event => event.timestamp >= last24Hours);
    
    let riskScore = 0;
    
    // Base risk from event count
    riskScore += Math.min(recentEvents.length * 2, 50);
    
    // High severity events
    const highSeverityEvents = recentEvents.filter(event => event.severity === 'high').length;
    riskScore += highSeverityEvents * 10;
    
    // Critical events
    const criticalEvents = recentEvents.filter(event => event.severity === 'critical').length;
    riskScore += criticalEvents * 20;
    
    // Blocked events
    const blockedEvents = recentEvents.filter(event => event.blocked).length;
    riskScore += blockedEvents * 5;
    
    return Math.min(riskScore, 100);
  }

  private checkAlerts(event: SecurityEvent): void {
    if (!this.config.enableReporting) return;
    
    const metrics = this.getMetrics();
    
    // Check if we should send alerts
    if (metrics.riskScore > 80) {
      this.sendAlert('High risk score detected', {
        riskScore: metrics.riskScore,
        recentEvents: metrics.last24Hours,
        blockedEvents: metrics.blockedEvents
      });
    }
    
    if (event.severity === 'critical') {
      this.sendAlert('Critical security event', {
        type: event.type,
        source: event.source,
        details: event.details
      });
    }
    
    if (event.blocked) {
      this.sendAlert('Security event blocked', {
        type: event.type,
        source: event.source,
        details: event.details
      });
    }
  }

  private sendAlert(title: string, details: any): void {
    // In a real implementation, this would send alerts via email, Slack, etc.
    console.warn(`🚨 SECURITY ALERT: ${title}`, details);
    
    // Could also send to external monitoring services
    // await fetch('/api/security/alerts', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ title, details, timestamp: new Date() })
    // });
  }
}

// Global security monitor instance
export const securityMonitor = new SecurityMonitor();
