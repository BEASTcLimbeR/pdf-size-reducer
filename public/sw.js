// Service Worker for comprehensive fetch error suppression
self.addEventListener('install', function(event) {
  console.log('🔧 Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('🔧 Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Intercept all fetch requests
self.addEventListener('fetch', function(event) {
  const url = event.request.url;
  console.log('🌐 Service Worker fetch intercepted:', url);
  
  event.respondWith(
    fetch(event.request).catch(error => {
      console.warn('⚠️ Service Worker fetch error suppressed:', error.message, 'for URL:', url);
      
      // Return a successful response instead of failing
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Service Worker network request failed',
        message: error.message,
        url: url,
        suppressed: true,
        context: 'service-worker'
      }), {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      });
    })
  );
});

// Handle messages from main thread
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('✅ Service Worker fetch override active');
