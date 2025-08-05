// Simple service worker for PWA
self.addEventListener('install', function(event) {
  console.log('Service Worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker activating');
});

self.addEventListener('fetch', function(event) {
  // Let browser handle requests
  return;
});