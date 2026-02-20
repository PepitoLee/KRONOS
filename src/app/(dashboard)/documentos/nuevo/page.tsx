'use client'

import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import DocumentForm from '@/components/forms/DocumentForm'

export default function NuevoDocumentoPage() {
  return (
    <div className="space-y-6">
      <BreadcrumbNav />
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Nuevo Documento</h2>
        <p className="text-sm text-zinc-500">Registrar documento comercial</p>
      </div>
      <DocumentForm />
    </div>
  )
}
