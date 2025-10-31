'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IconHome, IconArrowLeft } from '@tabler/icons-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'

export default function NotFound() {
  const locale = useLocale()

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="p-8 max-w-md w-full text-center">
        <div className="text-6xl font-bold text-muted-foreground mb-4">404</div>
        <h1 className="text-2xl font-bold mb-2">Página no encontrada</h1>
        <p className="text-muted-foreground mb-6">
          La página que buscas no existe o fue movida.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={`/${locale}`}>
            <Button>
              <IconHome className="h-4 w-4 mr-2" />
              Ir al inicio
            </Button>
          </Link>
          <Button 
            onClick={() => window.history.back()} 
            variant="outline"
          >
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </Card>
    </div>
  )
}

