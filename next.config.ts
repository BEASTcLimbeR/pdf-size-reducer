import type { NextConfig } from "next";
import { DEFAULT_SECURITY_CONFIG } from "./src/utils/securityConfig";

const nextConfig: NextConfig = {
  // Security headers configuration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              `default-src ${DEFAULT_SECURITY_CONFIG.csp.defaultSrc.join(' ')}`,
              `script-src ${DEFAULT_SECURITY_CONFIG.csp.scriptSrc.join(' ')}`,
              `style-src ${DEFAULT_SECURITY_CONFIG.csp.styleSrc.join(' ')}`,
              `img-src ${DEFAULT_SECURITY_CONFIG.csp.imgSrc.join(' ')}`,
              `connect-src ${DEFAULT_SECURITY_CONFIG.csp.connectSrc.join(' ')}`,
              `font-src ${DEFAULT_SECURITY_CONFIG.csp.fontSrc.join(' ')}`,
              `object-src ${DEFAULT_SECURITY_CONFIG.csp.objectSrc.join(' ')}`,
              `media-src ${DEFAULT_SECURITY_CONFIG.csp.mediaSrc.join(' ')}`,
              `frame-src ${DEFAULT_SECURITY_CONFIG.csp.frameSrc.join(' ')}`,
              `worker-src ${DEFAULT_SECURITY_CONFIG.csp.workerSrc.join(' ')}`,
              `child-src ${DEFAULT_SECURITY_CONFIG.csp.childSrc.join(' ')}`,
              `form-action ${DEFAULT_SECURITY_CONFIG.csp.formAction.join(' ')}`,
              `base-uri ${DEFAULT_SECURITY_CONFIG.csp.baseUri.join(' ')}`,
              `manifest-src ${DEFAULT_SECURITY_CONFIG.csp.manifestSrc.join(' ')}`,
              DEFAULT_SECURITY_CONFIG.csp.upgradeInsecureRequests ? 'upgrade-insecure-requests' : '',
              DEFAULT_SECURITY_CONFIG.csp.blockAllMixedContent ? 'block-all-mixed-content' : ''
            ].filter(Boolean).join('; ')
          },
          // HTTP Strict Transport Security
          {
            key: 'Strict-Transport-Security',
            value: `max-age=${DEFAULT_SECURITY_CONFIG.headers.hsts.maxAge}; includeSubDomains; preload`
          },
          // X-Frame-Options
          {
            key: 'X-Frame-Options',
            value: DEFAULT_SECURITY_CONFIG.headers.xFrameOptions
          },
          // X-Content-Type-Options
          {
            key: 'X-Content-Type-Options',
            value: DEFAULT_SECURITY_CONFIG.headers.xContentTypeOptions
          },
          // X-XSS-Protection
          {
            key: 'X-XSS-Protection',
            value: DEFAULT_SECURITY_CONFIG.headers.xXSSProtection
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: DEFAULT_SECURITY_CONFIG.headers.referrerPolicy
          },
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: [
              `camera=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.camera.join(' ')})`,
              `microphone=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.microphone.join(' ')})`,
              `geolocation=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.geolocation.join(' ')})`,
              `payment=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.payment.join(' ')})`,
              `usb=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.usb.join(' ')})`,
              `magnetometer=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.magnetometer.join(' ')})`,
              `gyroscope=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.gyroscope.join(' ')})`,
              `accelerometer=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.accelerometer.join(' ')})`,
              `ambient-light-sensor=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.ambientLightSensor.join(' ')})`,
              `autoplay=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.autoplay.join(' ')})`,
              `battery=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.battery.join(' ')})`,
              `bluetooth=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.bluetooth.join(' ')})`,
              `clipboard-read=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.clipboardRead.join(' ')})`,
              `clipboard-write=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.clipboardWrite.join(' ')})`,
              `display-capture=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.displayCapture.join(' ')})`,
              `document-domain=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.documentDomain.join(' ')})`,
              `encrypted-media=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.encryptedMedia.join(' ')})`,
              `execution-while-not-rendered=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.executionWhileNotRendered.join(' ')})`,
              `execution-while-out-of-viewport=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.executionWhileOutOfViewport.join(' ')})`,
              `fullscreen=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.fullscreen.join(' ')})`,
              `gamepad=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.gamepad.join(' ')})`,
              `layout-animations=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.layoutAnimations.join(' ')})`,
              `legacy-image-formats=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.legacyImageFormats.join(' ')})`,
              `midi=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.midi.join(' ')})`,
              `oversized-images=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.oversizedImages.join(' ')})`,
              `picture-in-picture=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.pictureInPicture.join(' ')})`,
              `publickey-credentials-get=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.publickeyCredentialsGet.join(' ')})`,
              `screen-wake-lock=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.screenWakeLock.join(' ')})`,
              `sync-xhr=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.syncXhr.join(' ')})`,
              `unoptimized-images=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.unoptimizedImages.join(' ')})`,
              `unsized-media=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.unsizedMedia.join(' ')})`,
              `vertical-scroll=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.verticalScroll.join(' ')})`,
              `web-share=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.webShare.join(' ')})`,
              `xr-spatial-tracking=(${DEFAULT_SECURITY_CONFIG.headers.permissionsPolicy.xrSpatialTracking.join(' ')})`
            ].join(', ')
          },
          // Additional security headers
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin'
          }
        ]
      }
    ];
  },
  
  // Security redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/404',
        permanent: false
      },
      {
        source: '/wp-admin',
        destination: '/404',
        permanent: false
      },
      {
        source: '/.env',
        destination: '/404',
        permanent: false
      },
      {
        source: '/config',
        destination: '/404',
        permanent: false
      }
    ];
  },

  // External packages for security
  serverExternalPackages: ['pdfjs-dist', 'mammoth', 'xlsx'],

  // Webpack configuration for security
  webpack: (config, { isServer }) => {
    // Add security-focused webpack plugins
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false
      };
    }
    
    return config;
  },

  // Output configuration
  output: 'standalone',
  
  // Compression
  compress: true,
  
  // PoweredByHeader
  poweredByHeader: false,
  
  // Generate ETags
  generateEtags: true
};

export default nextConfig;
