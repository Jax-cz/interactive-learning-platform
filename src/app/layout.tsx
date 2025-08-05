import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Interactive Learning Platform',
  description: 'Master English through ESL news and CLIL science lessons with interactive exercises',
  keywords: 'English learning, ESL, CLIL, interactive lessons, language learning, education',
  authors: [{ name: 'Interactive Learning Platform' }],
  creator: 'Interactive Learning Platform',
  publisher: 'Interactive Learning Platform',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://your-domain.com',
    siteName: 'Interactive Learning Platform',
    title: 'Interactive Learning Platform - Master English Through Interactive Lessons',
    description: 'Master English through ESL news and CLIL science lessons with interactive exercises',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Interactive Learning Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Interactive Learning Platform',
    description: 'Master English through ESL news and CLIL science lessons',
    images: ['/images/og-image.png'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="background-color" content="#ffffff" />
        
        {/* Apple Mobile Web App */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LearnPlatform" />
        
        {/* Mobile Web App */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="LearnPlatform" />
        
        {/* Windows Mobile */}
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="57x57" href="/icons/icon-57x57.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/icons/icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/icons/icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/icons/icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/icons/icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        
        {/* Standard Favicons */}
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icons/icon-96x96.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS Prefetch for Supabase */}
        <link rel="dns-prefetch" href="https://your-project.supabase.co" />
        
        {/* Splash Screens for iOS */}
        <link rel="apple-touch-startup-image" href="/images/splash-640x1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/images/splash-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/images/splash-1242x2208.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/images/splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/images/splash-1536x2048.png" media="(min-device-width: 768px) and (max-device-width: 1024px) and (-webkit-min-device-pixel-ratio: 2)" />
      </head>
      <body className={inter.className}>
        {/* PWA Install Prompt Component */}
        <PWAInstallPrompt />
        
        {/* Main App Content */}
        <main className="min-h-screen">
          {children}
        </main>
        
        {/* PWA Service Worker Registration */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('SW registered: ', registration);
                  })
                  .catch(function(registrationError) {
                    console.log('SW registration failed: ', registrationError);
                  });
              });
            }
          `
        }} />
      </body>
    </html>
  )
}

// PWA Install Prompt Component
function PWAInstallPrompt() {
  return (
    <>
      <script dangerouslySetInnerHTML={{
        __html: `
          let deferredPrompt;
          let installPromptShown = false;

          window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later
            deferredPrompt = e;
            
            // Show custom install prompt after user has been on site for 30 seconds
            if (!installPromptShown) {
              setTimeout(() => {
                showInstallPrompt();
              }, 30000);
            }
          });

          function showInstallPrompt() {
            if (deferredPrompt && !installPromptShown) {
              installPromptShown = true;
              
              // Create custom install prompt
              const installBanner = document.createElement('div');
              installBanner.id = 'install-prompt';
              installBanner.style.cssText = \`
                position: fixed;
                bottom: 20px;
                left: 20px;
                right: 20px;
                background: #2563eb;
                color: white;
                padding: 16px;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-family: system-ui, -apple-system, sans-serif;
                animation: slideUp 0.3s ease-out;
              \`;
              
              installBanner.innerHTML = \`
                <div>
                  <div style="font-weight: 600; margin-bottom: 4px;">Install Learning App</div>
                  <div style="font-size: 14px; opacity: 0.9;">Get the full app experience on your device</div>
                </div>
                <div>
                  <button id="install-btn" style="background: white; color: #2563eb; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; margin-right: 8px; cursor: pointer;">Install</button>
                  <button id="dismiss-btn" style="background: transparent; color: white; border: 1px solid rgba(255,255,255,0.3); padding: 8px 12px; border-radius: 6px; cursor: pointer;">×</button>
                </div>
              \`;
              
              // Add animation styles
              const style = document.createElement('style');
              style.textContent = \`
                @keyframes slideUp {
                  from { transform: translateY(100%); opacity: 0; }
                  to { transform: translateY(0); opacity: 1; }
                }
              \`;
              document.head.appendChild(style);
              
              document.body.appendChild(installBanner);
              
              // Handle install button click
              document.getElementById('install-btn').addEventListener('click', async () => {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log('User choice:', outcome);
                deferredPrompt = null;
                installBanner.remove();
              });
              
              // Handle dismiss button click
              document.getElementById('dismiss-btn').addEventListener('click', () => {
                installBanner.remove();
              });
              
              // Auto-dismiss after 10 seconds
              setTimeout(() => {
                if (document.getElementById('install-prompt')) {
                  installBanner.remove();
                }
              }, 10000);
            }
          }

          // Handle successful app installation
          window.addEventListener('appinstalled', (evt) => {
            console.log('App was installed');
            // Track installation analytics here
          });
        `
      }} />
    </>
  )
}