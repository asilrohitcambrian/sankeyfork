import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sankey Diagram Builder',
  description: 'Create beautiful Sankey diagrams',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
} 