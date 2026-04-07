'use client'

import './globals.css'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>No Limit — Personal Dashboard</title>
        <meta name="description" content="Personal life operating system" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-space-black text-text-primary min-h-screen">
        <div className="flex min-h-screen">
          {/* Sidebar — desktop only */}
          <Sidebar />

          {/* Main content */}
          <main className="flex-1 md:ml-[220px] pb-20 md:pb-0 min-h-screen">
            <div className="max-w-6xl mx-auto p-4 md:p-6">
              {children}
            </div>
          </main>
        </div>

        {/* Bottom nav — mobile only */}
        <BottomNav />
      </body>
    </html>
  )
}
