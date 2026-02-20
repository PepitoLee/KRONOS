'use client'

import { useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import { Upload, X, FileText, Image, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'

interface FileUploaderProps {
  bucket: string
  path?: string
  accept?: string
  maxSize?: number // MB
  multiple?: boolean
  onUpload?: (urls: string[]) => void
  className?: string
}

interface UploadedFile {
  name: string
  size: number
  type: string
  url?: string
  progress: number
  error?: string
}

const fileIcons: Record<string, React.ElementType> = {
  'application/pdf': FileText,
  'image/': Image,
}

function getFileIcon(type: string) {
  for (const [key, Icon] of Object.entries(fileIcons)) {
    if (type.startsWith(key)) return Icon
  }
  return File
}

export function FileUploader({
  bucket,
  path = '',
  accept = '*',
  maxSize = 10,
  multiple = false,
  onUpload,
  className,
}: FileUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const supabase = createClient()

  const uploadFile = async (file: globalThis.File) => {
    const fileEntry: UploadedFile = {
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
    }

    if (file.size > maxSize * 1024 * 1024) {
      fileEntry.error = `Archivo excede ${maxSize}MB`
      setFiles((prev) => [...prev, fileEntry])
      return
    }

    setFiles((prev) => [...prev, fileEntry])

    const filePath = `${path}/${Date.now()}-${file.name}`.replace(/\/+/g, '/')

    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file)

    if (error) {
      setFiles((prev) =>
        prev.map((f) => (f.name === file.name ? { ...f, error: error.message, progress: 0 } : f))
      )
      return
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path)

    setFiles((prev) =>
      prev.map((f) =>
        f.name === file.name ? { ...f, url: publicUrl, progress: 100 } : f
      )
    )

    return publicUrl
  }

  const handleFiles = async (fileList: FileList) => {
    const filesToUpload = multiple ? Array.from(fileList) : [fileList[0]]
    const urls: string[] = []

    for (const file of filesToUpload) {
      const url = await uploadFile(file)
      if (url) urls.push(url)
    }

    if (urls.length > 0) onUpload?.(urls)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bucket, path]
  )

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name))
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer',
          dragOver
            ? 'border-emerald-500 bg-emerald-500/5'
            : 'border-zinc-700 hover:border-zinc-600'
        )}
        onClick={() => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = accept
          input.multiple = multiple
          input.onchange = (e) => {
            const target = e.target as HTMLInputElement
            if (target.files) handleFiles(target.files)
          }
          input.click()
        }}
      >
        <Upload className="h-8 w-8 text-zinc-500 mb-2" />
        <p className="text-sm text-zinc-400">
          Arrastra archivos aquí o <span className="text-emerald-400">haz clic</span>
        </p>
        <p className="text-xs text-zinc-600 mt-1">Máximo {maxSize}MB</p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => {
            const Icon = getFileIcon(file.type)
            return (
              <div
                key={file.name}
                className="flex items-center gap-3 rounded-lg border border-zinc-800 p-3"
              >
                <Icon className="h-5 w-5 text-zinc-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300 truncate">{file.name}</p>
                  {file.error ? (
                    <p className="text-xs text-red-400">{file.error}</p>
                  ) : file.progress < 100 ? (
                    <Progress value={file.progress} className="h-1 mt-1" />
                  ) : (
                    <p className="text-xs text-emerald-400">Subido</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => removeFile(file.name)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
