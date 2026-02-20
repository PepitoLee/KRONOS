'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, FileText, File } from 'lucide-react'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ExportButtonProps {
  data: Record<string, unknown>[]
  filename: string
  formats?: ('xlsx' | 'pdf' | 'csv')[]
  columns?: { header: string; key: string }[]
  title?: string
}

export function ExportButton({
  data,
  filename,
  formats = ['xlsx', 'pdf', 'csv'],
  columns,
  title,
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  const getHeaders = () => {
    if (columns) return columns
    if (data.length === 0) return []
    return Object.keys(data[0]).map((key) => ({ header: key, key }))
  }

  const exportExcel = () => {
    setExporting(true)
    try {
      const headers = getHeaders()
      const wsData = data.map((row) =>
        headers.reduce(
          (acc, col) => {
            acc[col.header] = row[col.key]
            return acc
          },
          {} as Record<string, unknown>
        )
      )
      const ws = XLSX.utils.json_to_sheet(wsData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Datos')
      XLSX.writeFile(wb, `${filename}.xlsx`)
    } finally {
      setExporting(false)
    }
  }

  const exportPDF = () => {
    setExporting(true)
    try {
      const doc = new jsPDF()
      const headers = getHeaders()

      if (title) {
        doc.setFontSize(16)
        doc.text(title, 14, 20)
        doc.setFontSize(10)
        doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, 14, 28)
      }

      autoTable(doc, {
        startY: title ? 35 : 20,
        head: [headers.map((h) => h.header)],
        body: data.map((row) => headers.map((h) => String(row[h.key] ?? ''))),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [16, 185, 129] },
      })

      doc.save(`${filename}.pdf`)
    } finally {
      setExporting(false)
    }
  }

  const exportCSV = () => {
    setExporting(true)
    try {
      const headers = getHeaders()
      const csvContent = [
        headers.map((h) => h.header).join(','),
        ...data.map((row) =>
          headers.map((h) => {
            const val = String(row[h.key] ?? '')
            return val.includes(',') ? `"${val}"` : val
          }).join(',')
        ),
      ].join('\n')

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const formatActions: Record<string, { label: string; icon: React.ElementType; action: () => void }> = {
    xlsx: { label: 'Excel (.xlsx)', icon: FileSpreadsheet, action: exportExcel },
    pdf: { label: 'PDF (.pdf)', icon: FileText, action: exportPDF },
    csv: { label: 'CSV (.csv)', icon: File, action: exportCSV },
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting} className="border-zinc-700">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {formats.map((fmt) => {
          const { label, icon: Icon, action } = formatActions[fmt]
          return (
            <DropdownMenuItem key={fmt} onClick={action}>
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
