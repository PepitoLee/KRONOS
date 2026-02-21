const allPaths = [
  '/',
  '/documentos',
  '/documentos/nuevo',
  '/documentos/facturacion-electronica',
  '/planillas',
  '/planillas/empleados',
  '/planillas/calcular',
  '/estados-financieros',
  '/estados-financieros/resultados',
  '/estados-financieros/situacion',
  '/estados-financieros/flujo-caja',
  '/estados-financieros/flujo-caja-proyectado',
  '/indicadores',
  '/indicadores/ratios',
  '/indicadores/ventas',
  '/indicadores/productividad',
  '/indicadores/rrhh',
  '/indicadores/benchmarking',
  '/impuestos',
  '/impuestos/igv',
  '/impuestos/renta',
  '/impuestos/ple',
  '/impuestos/pdt-621',
  '/impuestos/calendario',
  '/tesoreria',
  '/tesoreria/cuadre-caja',
  '/tesoreria/depositos',
  '/tesoreria/conciliaciones',
  '/tesoreria/cxc-cxp',
  '/tesoreria/importar-estado',
  '/presupuestos',
  '/proveedores',
  '/proveedores/pedidos',
  '/reclamos',
  '/reclamos/nuevo',
  '/reclamos/indicadores',
  '/calidad',
  '/calidad/satisfaccion',
  '/calidad/clima-laboral',
  '/auditoria',
  '/auditoria/documentos',
  '/auditoria/legal',
  '/reportes',
  '/ai',
  '/configuracion',
]

const gerentePaths = [
  '/',
  '/documentos',
  '/documentos/nuevo',
  '/documentos/facturacion-electronica',
  '/estados-financieros',
  '/estados-financieros/resultados',
  '/estados-financieros/situacion',
  '/estados-financieros/flujo-caja',
  '/estados-financieros/flujo-caja-proyectado',
  '/indicadores',
  '/indicadores/ratios',
  '/indicadores/ventas',
  '/indicadores/benchmarking',
  '/reportes',
  '/ai',
  '/configuracion',
]

const roleModules: Record<string, string[]> = {
  contador: allPaths,
  admin: allPaths,
  gerente: gerentePaths,
}

export function getVisibleModules(rol: string): string[] {
  return roleModules[rol] ?? allPaths
}

export function isModuleVisible(rol: string, path: string): boolean {
  const modules = getVisibleModules(rol)
  return modules.some((m) => path === m || path.startsWith(m + '/'))
}
