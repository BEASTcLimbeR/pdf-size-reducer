// Security Configuration for DocNestly
export interface SecurityConfig {
  csp: ContentSecurityPolicy;
  headers: SecurityHeaders;
  fileValidation: FileSecurityConfig;
  rateLimiting: RateLimitingConfig;
  encryption: EncryptionConfig;
  monitoring: SecurityMonitoringConfig;
}

export interface ContentSecurityPolicy {
  defaultSrc: string[];
  scriptSrc: string[];
  styleSrc: string[];
  imgSrc: string[];
  connectSrc: string[];
  fontSrc: string[];
  objectSrc: string[];
  mediaSrc: string[];
  frameSrc: string[];
  workerSrc: string[];
  childSrc: string[];
  formAction: string[];
  baseUri: string[];
  manifestSrc: string[];
  upgradeInsecureRequests: boolean;
  blockAllMixedContent: boolean;
}

export interface SecurityHeaders {
  hsts: HSTSConfig;
  xFrameOptions: string;
  xContentTypeOptions: string;
  xXSSProtection: string;
  referrerPolicy: string;
  permissionsPolicy: PermissionsPolicy;
}

export interface HSTSConfig {
  maxAge: number;
  includeSubDomains: boolean;
  preload: boolean;
}

export interface PermissionsPolicy {
  camera: string[];
  microphone: string[];
  geolocation: string[];
  payment: string[];
  usb: string[];
  magnetometer: string[];
  gyroscope: string[];
  accelerometer: string[];
  ambientLightSensor: string[];
  autoplay: string[];
  battery: string[];
  bluetooth: string[];
  clipboardRead: string[];
  clipboardWrite: string[];
  displayCapture: string[];
  documentDomain: string[];
  encryptedMedia: string[];
  executionWhileNotRendered: string[];
  executionWhileOutOfViewport: string[];
  fullscreen: string[];
  gamepad: string[];
  layoutAnimations: string[];
  legacyImageFormats: string[];
  midi: string[];
  oversizedImages: string[];
  pictureInPicture: string[];
  publickeyCredentialsGet: string[];
  screenWakeLock: string[];
  syncXhr: string[];
  unoptimizedImages: string[];
  unsizedMedia: string[];
  verticalScroll: string[];
  webShare: string[];
  xrSpatialTracking: string[];
}

export interface FileSecurityConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  blockedExtensions: string[];
  scanForMalware: boolean;
  quarantineSuspiciousFiles: boolean;
  maxFilesPerUpload: number;
  virusScanTimeout: number;
  contentInspection: boolean;
}

export interface RateLimitingConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  keyGenerator: string;
  onLimitReached: string;
}

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  saltLength: number;
  iterations: number;
  hashAlgorithm: string;
  enableCompression: boolean;
  enableIntegrityCheck: boolean;
}

export interface SecurityMonitoringConfig {
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableMetrics: boolean;
  alertThresholds: AlertThresholds;
  enableBlocking: boolean;
  enableReporting: boolean;
}

export interface AlertThresholds {
  failedLogins: number;
  suspiciousActivity: number;
  fileUploads: number;
  apiCalls: number;
  errorRate: number;
}

// Default Security Configuration
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'", // Required for PDF.js
      "https://unpkg.com",
      "https://cdn.jsdelivr.net",
      "https://cdnjs.cloudflare.com"
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
      "https://cdn.jsdelivr.net"
    ],
    imgSrc: [
      "'self'",
      "data:",
      "blob:",
      "https:"
    ],
    connectSrc: [
      "'self'",
      "https://api.openai.com",
      "https://api.anthropic.com",
      "https://api.cohere.ai",
      "https://api.huggingface.co"
    ],
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com",
      "https://cdn.jsdelivr.net"
    ],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    workerSrc: [
      "'self'",
      "blob:"
    ],
    childSrc: ["'self'"],
    formAction: ["'self'"],
    baseUri: ["'self'"],
    manifestSrc: ["'self'"],
    upgradeInsecureRequests: true,
    blockAllMixedContent: true
  },
  headers: {
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    xFrameOptions: "DENY",
    xContentTypeOptions: "nosniff",
    xXSSProtection: "1; mode=block",
    referrerPolicy: "strict-origin-when-cross-origin",
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
      payment: [],
      usb: [],
      magnetometer: [],
      gyroscope: [],
      accelerometer: [],
      ambientLightSensor: [],
      autoplay: [],
      battery: [],
      bluetooth: [],
      clipboardRead: ["'self'"],
      clipboardWrite: ["'self'"],
      displayCapture: [],
      documentDomain: [],
      encryptedMedia: [],
      executionWhileNotRendered: [],
      executionWhileOutOfViewport: [],
      fullscreen: ["'self'"],
      gamepad: [],
      layoutAnimations: [],
      legacyImageFormats: [],
      midi: [],
      oversizedImages: [],
      pictureInPicture: [],
      publickeyCredentialsGet: [],
      screenWakeLock: [],
      syncXhr: [],
      unoptimizedImages: [],
      unsizedMedia: [],
      verticalScroll: [],
      webShare: [],
      xrSpatialTracking: []
    }
  },
  fileValidation: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/rtf',
      'text/csv',
      'text/html',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ],
    blockedExtensions: [
      '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
      '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl', '.sh', '.ps1',
      '.dll', '.sys', '.drv', '.ocx', '.cpl', '.msi', '.msp', '.mst'
    ],
    scanForMalware: true,
    quarantineSuspiciousFiles: true,
    maxFilesPerUpload: 10,
    virusScanTimeout: 30000,
    contentInspection: true
  },
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: 'ip',
    onLimitReached: 'block'
  },
  encryption: {
    algorithm: 'AES-256-GCM',
    keyLength: 32,
    ivLength: 12,
    saltLength: 16,
    iterations: 100000,
    hashAlgorithm: 'SHA-256',
    enableCompression: true,
    enableIntegrityCheck: true
  },
  monitoring: {
    enableLogging: true,
    logLevel: 'info',
    enableMetrics: true,
    alertThresholds: {
      failedLogins: 5,
      suspiciousActivity: 10,
      fileUploads: 50,
      apiCalls: 1000,
      errorRate: 0.1
    },
    enableBlocking: true,
    enableReporting: true
  }
};

// Security utility functions
export class SecurityUtils {
  static generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  static validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  static validateFileSize(file: File, maxSize: number): boolean {
    return file.size <= maxSize;
  }

  static validateFileExtension(fileName: string, blockedExtensions: string[]): boolean {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return !blockedExtensions.includes(extension);
  }

  static generateSecurityHash(data: string): string {
    // This would typically use a proper hashing library
    return btoa(data).replace(/[^a-zA-Z0-9]/g, '');
  }

  static isSuspiciousContent(content: string): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload/i,
      /onerror/i,
      /onclick/i,
      /eval\(/i,
      /expression\(/i,
      /url\(/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(content));
  }
}
