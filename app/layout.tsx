import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CoverageKit',
  description: 'Find GitHub coverage gaps and generate video assets for your YouTube channel.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
