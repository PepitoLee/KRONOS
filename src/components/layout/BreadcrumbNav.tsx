'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Fragment } from 'react'

const labelMap: Record<string, string> = {
  documentos: 'Documentos',
  nuevo: 'Nuevo',
  planillas: 'Planillas',
  empleados: 'Empleados',
  calcular: 'Cálculo',
  'estados-financieros': 'Estados Financieros',
  resultados: 'Estado de Resultados',
  situacion: 'Situación Financiera',
  'flujo-caja': 'Flujo de Caja',
  indicadores: 'Indicadores',
  ratios: 'Ratios Financieros',
  ventas: 'Evolutivo Ventas',
  productividad: 'Productividad',
  rrhh: 'RRHH',
  impuestos: 'Impuestos',
  igv: 'IGV',
  renta: 'Renta',
  tesoreria: 'Tesorería',
  'cuadre-caja': 'Cuadre de Caja',
  depositos: 'Depósitos',
  conciliaciones: 'Conciliaciones',
  presupuestos: 'Presupuestos',
  proveedores: 'Proveedores',
  pedidos: 'Pedidos',
  reclamos: 'Reclamos',
  calidad: 'Calidad',
  satisfaccion: 'Satisfacción Cliente',
  'clima-laboral': 'Clima Laboral',
  auditoria: 'Auditoría',
  legal: 'Control Legal',
  configuracion: 'Configuración',
  'cxc-cxp': 'Cuentas por Cobrar/Pagar',
  'flujo-caja-proyectado': 'Flujo de Caja Proyectado',
  ple: 'Libros Electrónicos PLE',
  'pdt-621': 'PDT 621',
  calendario: 'Calendario Tributario',
  benchmarking: 'Benchmarking',
  reportes: 'Reportes',
  ai: 'KRONOS AI',
  'facturacion-electronica': 'Facturación Electrónica',
  'importar-estado': 'Importar Estado Bancario',
}

export function BreadcrumbNav() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) return null

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment, index) => {
          const href = '/' + segments.slice(0, index + 1).join('/')
          const isLast = index === segments.length - 1
          const label = labelMap[segment] || segment

          return (
            <Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
