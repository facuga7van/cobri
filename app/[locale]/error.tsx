'use client'

import { useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IconAlertTriangle, IconHome } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  const locale = useLocale()

  useEffect(() => {
    // Log error to console (or error reporting service like Sentry)
    console.error('Error page:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="p-8 max-w-md w-full">
        <div className="text-center">
          <IconAlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Algo salió mal</h1>
          <p className="text-muted-foreground mb-6">
            Ocurrió un error al cargar esta página. No te preocupes, tus datos están seguros.
          </p>
          
          {error.digest && (
            <p className="text-xs text-muted-foreground mb-4">
              Código de error: {error.digest}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={reset} variant="default">
              Intentar de nuevo
            </Button>
            <Button 
              onClick={() => router.push(`/${locale}`)} 
              variant="outline"
            >
              <IconHome className="h-4 w-4 mr-2" />
              Ir al inicio
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                Detalles técnicos (solo en desarrollo)
              </summary>
              <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-40">
                {error.message}
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </Card>
    </div>
  )
}

