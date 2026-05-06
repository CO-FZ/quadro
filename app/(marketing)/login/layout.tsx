import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CO-FZ | Entrar',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-4">
      {children}
    </div>
  )
}
