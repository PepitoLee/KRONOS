'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Upload, FileSpreadsheet, Check, AlertTriangle, Loader2, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface ColumnMapping {
  source: string
  target: string
}

interface ImportWizardProps {
  table: string
  columns: { key: string; label: string; required?: boolean }[]
  onComplete?: (count: number) => void
  children?: React.ReactNode
}

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete'

export function ImportWizard({ table, columns, onComplete, children }: ImportWizardProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [rawData, setRawData] = useState<Record<string, unknown>[]>([])
  const [sourceColumns, setSourceColumns] = useState<string[]>([])
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const [importedCount, setImportedCount] = useState(0)
  const supabase = createClient()

  const reset = () => {
    setStep('upload')
    setFile(null)
    setRawData([])
    setSourceColumns([])
    setMappings([])
    setErrors([])
    setProgress(0)
    setImportedCount(0)
  }

  const handleFile = useCallback((selectedFile: File) => {
    setFile(selectedFile)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

        if (jsonData.length === 0) {
          toast.error('El archivo no contiene datos')
          return
        }

        setRawData(jsonData)
        const srcCols = Object.keys(jsonData[0])
        setSourceColumns(srcCols)

        // Auto-map columns by similar names
        const autoMappings: ColumnMapping[] = columns.map((col) => {
          const match = srcCols.find(
            (src) =>
              src.toLowerCase().replace(/[_\s-]/g, '') ===
              col.key.toLowerCase().replace(/[_\s-]/g, '') ||
              src.toLowerCase().includes(col.key.toLowerCase()) ||
              col.label.toLowerCase().includes(src.toLowerCase())
          )
          return { source: match ?? '', target: col.key }
        })
        setMappings(autoMappings)
        setStep('mapping')
      } catch {
        toast.error('Error al leer el archivo')
      }
    }
    reader.readAsBinaryString(selectedFile)
  }, [columns])

  const validateAndPreview = () => {
    const errs: string[] = []

    // Check required fields are mapped
    columns.forEach((col) => {
      if (col.required) {
        const mapping = mappings.find((m) => m.target === col.key)
        if (!mapping?.source) {
          errs.push(`Campo requerido sin mapear: ${col.label}`)
        }
      }
    })

    if (errs.length > 0) {
      setErrors(errs)
      return
    }

    setErrors([])
    setStep('preview')
  }

  const getMappedData = (): Record<string, unknown>[] => {
    return rawData.map((row) => {
      const mapped: Record<string, unknown> = {}
      mappings.forEach((m) => {
        if (m.source && m.target) {
          mapped[m.target] = row[m.source]
        }
      })
      return mapped
    })
  }

  const doImport = async () => {
    setStep('importing')
    const mappedData = getMappedData()
    const batchSize = 50
    let imported = 0
    const importErrors: string[] = []

    for (let i = 0; i < mappedData.length; i += batchSize) {
      const batch = mappedData.slice(i, i + batchSize)

      // Add empresa_id
      const userRes = await supabase.auth.getUser()
      if (userRes.data.user) {
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('empresa_id')
          .eq('id', userRes.data.user.id)
          .single()

        if (usuario?.empresa_id) {
          batch.forEach((row) => {
            row.empresa_id = usuario.empresa_id
          })
        }
      }

      const { error } = await supabase.from(table).insert(batch)

      if (error) {
        importErrors.push(`Lote ${Math.floor(i / batchSize) + 1}: ${error.message}`)
      } else {
        imported += batch.length
      }

      setProgress(Math.round(((i + batch.length) / mappedData.length) * 100))
    }

    setImportedCount(imported)
    setErrors(importErrors)
    setStep('complete')

    if (importErrors.length === 0) {
      toast.success(`${imported} registros importados exitosamente`)
      onComplete?.(imported)
    } else {
      toast.warning(`${imported} importados, ${importErrors.length} errores`)
    }
  }

  const updateMapping = (targetKey: string, sourceCol: string) => {
    setMappings((prev) =>
      prev.map((m) => (m.target === targetKey ? { ...m, source: sourceCol } : m))
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) reset()
      }}
    >
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline" className="border-zinc-700">
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
            Importar Datos
          </DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center justify-between mb-4">
          {(['upload', 'mapping', 'preview', 'complete'] as const).map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  step === s || (step === 'importing' && s === 'preview')
                    ? 'bg-emerald-500 text-white'
                    : ['upload', 'mapping', 'preview', 'complete'].indexOf(step === 'importing' ? 'preview' : step) > i
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {['upload', 'mapping', 'preview', 'complete'].indexOf(step === 'importing' ? 'preview' : step) > i ? (
                  <Check className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 3 && <div className="w-12 h-px bg-zinc-700 mx-1" />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 p-10 cursor-pointer hover:border-zinc-600 transition-colors"
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = '.xlsx,.xls,.csv'
                input.onchange = (e) => {
                  const f = (e.target as HTMLInputElement).files?.[0]
                  if (f) handleFile(f)
                }
                input.click()
              }}
            >
              <Upload className="h-10 w-10 text-zinc-500 mb-3" />
              <p className="text-sm text-zinc-400">
                Arrastra un archivo o <span className="text-emerald-400">haz clic</span>
              </p>
              <p className="text-xs text-zinc-600 mt-1">Formatos: .xlsx, .xls, .csv</p>
            </div>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 'mapping' && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              Archivo: <span className="text-zinc-200 font-medium">{file?.name}</span> ({rawData.length} filas)
            </p>

            <div className="space-y-3">
              {columns.map((col) => {
                const mapping = mappings.find((m) => m.target === col.key)
                return (
                  <div key={col.key} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div>
                      <Label className="text-xs text-zinc-500">
                        Campo destino {col.required && <span className="text-red-400">*</span>}
                      </Label>
                      <p className="text-sm text-zinc-200">{col.label}</p>
                    </div>
                    <span className="text-zinc-600">→</span>
                    <Select
                      value={mapping?.source ?? ''}
                      onValueChange={(v) => updateMapping(col.key, v)}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-sm">
                        <SelectValue placeholder="Seleccionar columna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-- No mapear --</SelectItem>
                        {sourceColumns.map((src) => (
                          <SelectItem key={src} value={src}>
                            {src}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              })}
            </div>

            {errors.length > 0 && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                {errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {err}
                  </p>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" className="border-zinc-700" onClick={() => setStep('upload')}>
                Atrás
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={validateAndPreview}>
                Previsualizar
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              Se importarán <span className="text-emerald-400 font-bold">{rawData.length}</span> registros a la tabla{' '}
              <span className="font-mono text-zinc-200">{table}</span>
            </p>

            <div className="max-h-60 overflow-auto rounded-lg border border-zinc-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-zinc-800/50">
                    {mappings
                      .filter((m) => m.source)
                      .map((m) => (
                        <th key={m.target} className="px-3 py-2 text-left font-medium text-zinc-400">
                          {columns.find((c) => c.key === m.target)?.label ?? m.target}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {rawData.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t border-zinc-800/50">
                      {mappings
                        .filter((m) => m.source)
                        .map((m) => (
                          <td key={m.target} className="px-3 py-2 text-zinc-300">
                            {String(row[m.source] ?? '')}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rawData.length > 5 && (
              <p className="text-xs text-zinc-600 text-center">
                Mostrando 5 de {rawData.length} registros
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" className="border-zinc-700" onClick={() => setStep('mapping')}>
                Atrás
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={doImport}>
                Importar {rawData.length} registros
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Importing */}
        {step === 'importing' && (
          <div className="space-y-4 py-6">
            <div className="flex flex-col items-center">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-400 mb-3" />
              <p className="text-sm text-zinc-300">Importando datos...</p>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-zinc-500 text-center">{progress}% completado</p>
          </div>
        )}

        {/* Step 5: Complete */}
        {step === 'complete' && (
          <div className="space-y-4 py-6">
            <div className="flex flex-col items-center">
              {errors.length === 0 ? (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 mb-3">
                    <Check className="h-7 w-7 text-emerald-400" />
                  </div>
                  <p className="text-lg font-semibold text-zinc-100">Importación completada</p>
                  <p className="text-sm text-zinc-400">
                    {importedCount} registros importados exitosamente
                  </p>
                </>
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20 mb-3">
                    <AlertTriangle className="h-7 w-7 text-amber-400" />
                  </div>
                  <p className="text-lg font-semibold text-zinc-100">Importación parcial</p>
                  <p className="text-sm text-zinc-400">
                    {importedCount} importados, {errors.length} errores
                  </p>
                  <div className="mt-2 max-h-32 overflow-auto rounded-lg border border-red-500/20 bg-red-500/5 p-3 w-full">
                    {errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-400">{err}</p>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-center">
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  setOpen(false)
                  reset()
                }}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
