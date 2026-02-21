'use client'

import { useState } from 'react'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { Upload, FileSpreadsheet, Building2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const bancosCompatibles = [
  { nombre: 'BCP', formato: 'CSV', icon: '🏦' },
  { nombre: 'Interbank', formato: 'CSV', icon: '🏦' },
  { nombre: 'BBVA', formato: 'CSV/Excel', icon: '🏦' },
  { nombre: 'Scotiabank', formato: 'CSV', icon: '🏦' },
]

export default function ImportarEstadoPage() {
  const [dragActive, setDragActive] = useState(false)
  const [archivo, setArchivo] = useState<File | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) {
        setArchivo(file)
        toast.success('Archivo cargado', { description: file.name })
      } else {
        toast.error('Formato no soportado', { description: 'Solo archivos CSV o XLSX' })
      }
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setArchivo(file)
      toast.success('Archivo cargado', { description: file.name })
    }
  }

  const handleConciliar = () => {
    toast.info('Proximamente', {
      description: 'La conciliacion automatica estara disponible en la proxima version.',
    })
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
          <Upload className="h-7 w-7 text-emerald-400" />
          Importar Estado Bancario
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Carga tu estado de cuenta bancario para conciliacion automatica
        </p>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
          dragActive
            ? 'border-emerald-400 bg-emerald-500/5'
            : archivo
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : 'border-zinc-700 bg-[#111827]'
        }`}
      >
        {archivo ? (
          <div className="space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
            <div>
              <p className="text-sm font-medium text-zinc-200">{archivo.name}</p>
              <p className="text-xs text-zinc-500">
                {(archivo.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-zinc-700 text-zinc-400"
              onClick={() => setArchivo(null)}
            >
              Cambiar archivo
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <FileSpreadsheet className="h-12 w-12 text-zinc-600 mx-auto" />
            <div>
              <p className="text-sm text-zinc-300">
                Arrastra tu archivo CSV o XLSX aqui
              </p>
              <p className="text-xs text-zinc-500 mt-1">o haz clic para seleccionar</p>
            </div>
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileInput}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </div>
        )}
      </div>

      {archivo && (
        <div className="flex gap-3">
          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={handleConciliar}
          >
            <CheckCircle2 className="h-4 w-4" />
            Conciliar Automaticamente
          </Button>
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 bg-[#111827] overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-100">Vista Previa de Movimientos</h3>
        </div>
        <div className="p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">
            {archivo
              ? 'Procesando archivo... La vista previa estara disponible proximamente.'
              : 'Carga un archivo para ver los movimientos'}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100 mb-4">
          <Building2 className="h-4 w-4 text-zinc-400" />
          Bancos Compatibles
        </h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {bancosCompatibles.map((banco) => (
            <div
              key={banco.nombre}
              className="rounded-lg border border-zinc-800 p-3 text-center"
            >
              <p className="text-lg mb-1">{banco.icon}</p>
              <p className="text-sm font-medium text-zinc-300">{banco.nombre}</p>
              <p className="text-xs text-zinc-500">{banco.formato}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
