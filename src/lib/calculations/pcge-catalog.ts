// =============================================================================
// PCGE - Plan Contable General Empresarial (Peru)
// Catalogo de cuentas conforme a la Resolucion N 002-2019-EF/30
// del Consejo Normativo de Contabilidad
// =============================================================================

export interface PCGEAccount {
  codigo: string;
  nombre: string;
  tipo: 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto' | 'costo';
  naturaleza: 'deudora' | 'acreedora';
  nivel: 1 | 2 | 3 | 4;
}

// ---------------------------------------------------------------------------
// Catalogo completo PCGE
// ---------------------------------------------------------------------------

export const PCGE_CATALOG: PCGEAccount[] = [
  // ==========================================================================
  // CLASE 1: ACTIVO DISPONIBLE Y EXIGIBLE
  // ==========================================================================

  // --- 10 Efectivo y equivalentes de efectivo ---
  { codigo: '10', nombre: 'Efectivo y equivalentes de efectivo', tipo: 'activo', naturaleza: 'deudora', nivel: 1 },
  { codigo: '1011', nombre: 'Caja - Moneda nacional', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1012', nombre: 'Caja - Moneda extranjera', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1021', nombre: 'Cuentas corrientes - Moneda nacional', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1022', nombre: 'Cuentas corrientes - Moneda extranjera', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1031', nombre: 'Depositos a plazo - Moneda nacional', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1032', nombre: 'Depositos a plazo - Moneda extranjera', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1041', nombre: 'Cuentas corrientes operativas', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1042', nombre: 'Fondos sujetos a restriccion - Moneda extranjera', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1061', nombre: 'Fondos fijos - Caja chica', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1071', nombre: 'Fondos en transito - Moneda nacional', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },

  // --- 12 Cuentas por cobrar comerciales - Terceros ---
  { codigo: '12', nombre: 'Cuentas por cobrar comerciales - Terceros', tipo: 'activo', naturaleza: 'deudora', nivel: 1 },
  { codigo: '1211', nombre: 'Facturas por cobrar - No emitidas', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1212', nombre: 'Facturas por cobrar - Emitidas en cartera', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1213', nombre: 'Facturas por cobrar - En cobranza', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1214', nombre: 'Facturas por cobrar - En descuento', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1221', nombre: 'Boletas de venta por cobrar', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1231', nombre: 'Letras por cobrar - En cartera', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1232', nombre: 'Letras por cobrar - En cobranza', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1233', nombre: 'Letras por cobrar - En descuento', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1291', nombre: 'Provision para cuentas de cobranza dudosa - Facturas', tipo: 'activo', naturaleza: 'acreedora', nivel: 4 },

  // --- 14 Cuentas por cobrar al personal, accionistas y directores ---
  { codigo: '14', nombre: 'Cuentas por cobrar al personal, accionistas y directores', tipo: 'activo', naturaleza: 'deudora', nivel: 1 },
  { codigo: '1411', nombre: 'Prestamos al personal', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1412', nombre: 'Adelantos de remuneraciones', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1421', nombre: 'Prestamos a accionistas', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1431', nombre: 'Prestamos a directores', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },

  // --- 16 Cuentas por cobrar diversas - Terceros ---
  { codigo: '16', nombre: 'Cuentas por cobrar diversas - Terceros', tipo: 'activo', naturaleza: 'deudora', nivel: 1 },
  { codigo: '1611', nombre: 'Prestamos a terceros - Con garantia', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1612', nombre: 'Prestamos a terceros - Sin garantia', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1621', nombre: 'Reclamaciones a terceros', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1631', nombre: 'Intereses por cobrar', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1641', nombre: 'Depositos otorgados en garantia', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1681', nombre: 'Otras cuentas por cobrar diversas', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },

  // --- 18 Servicios y otros contratados por anticipado ---
  { codigo: '18', nombre: 'Servicios y otros contratados por anticipado', tipo: 'activo', naturaleza: 'deudora', nivel: 1 },
  { codigo: '1811', nombre: 'Seguros pagados por anticipado', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1821', nombre: 'Alquileres pagados por anticipado', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '1831', nombre: 'Intereses pagados por anticipado', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },

  // --- 20 Mercaderias ---
  { codigo: '20', nombre: 'Mercaderias', tipo: 'activo', naturaleza: 'deudora', nivel: 1 },
  { codigo: '2011', nombre: 'Mercaderias manufacturadas - Costo', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '2021', nombre: 'Mercaderias de extraccion - Costo', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '2031', nombre: 'Mercaderias agropecuarias - Costo', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '2081', nombre: 'Otras mercaderias - Costo', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '2091', nombre: 'Mercaderias desvalorizadas - Costo', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },

  // --- 21 Productos terminados ---
  { codigo: '21', nombre: 'Productos terminados', tipo: 'activo', naturaleza: 'deudora', nivel: 1 },
  { codigo: '2111', nombre: 'Productos manufacturados - Costo', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '2121', nombre: 'Productos de extraccion terminados - Costo', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '2131', nombre: 'Productos agropecuarios terminados - Costo', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '2151', nombre: 'Existencias de servicios terminados - Costo', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },

  // --- 23 Productos en proceso ---
  { codigo: '23', nombre: 'Productos en proceso', tipo: 'activo', naturaleza: 'deudora', nivel: 1 },
  { codigo: '2311', nombre: 'Productos en proceso de manufactura - Costo', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '2351', nombre: 'Existencias de servicios en proceso - Costo', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },

  // --- 24 Materias primas ---
  { codigo: '24', nombre: 'Materias primas', tipo: 'activo', naturaleza: 'deudora', nivel: 1 },
  { codigo: '2411', nombre: 'Materias primas para productos manufacturados', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },

  // --- 25 Materiales auxiliares, suministros y repuestos ---
  { codigo: '25', nombre: 'Materiales auxiliares, suministros y repuestos', tipo: 'activo', naturaleza: 'deudora', nivel: 1 },
  { codigo: '2511', nombre: 'Materiales auxiliares', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '2521', nombre: 'Suministros', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '2531', nombre: 'Repuestos', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },

  // --- 26 Envases y embalajes ---
  { codigo: '26', nombre: 'Envases y embalajes', tipo: 'activo', naturaleza: 'deudora', nivel: 1 },
  { codigo: '2611', nombre: 'Envases', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '2621', nombre: 'Embalajes', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },

  // --- 28 Existencias por recibir ---
  { codigo: '28', nombre: 'Existencias por recibir', tipo: 'activo', naturaleza: 'deudora', nivel: 1 },
  { codigo: '2811', nombre: 'Mercaderias por recibir', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '2841', nombre: 'Materias primas por recibir', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },

  // --- 29 Desvalorizacion de existencias ---
  { codigo: '29', nombre: 'Desvalorizacion de existencias', tipo: 'activo', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '2911', nombre: 'Desvalorizacion de mercaderias', tipo: 'activo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '2921', nombre: 'Desvalorizacion de productos terminados', tipo: 'activo', naturaleza: 'acreedora', nivel: 4 },

  // --- 33 Inmuebles, maquinaria y equipo ---
  { codigo: '33', nombre: 'Inmuebles, maquinaria y equipo', tipo: 'activo', naturaleza: 'deudora', nivel: 1 },
  { codigo: '3311', nombre: 'Terrenos - Costo', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '3312', nombre: 'Terrenos - Revaluacion', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '3321', nombre: 'Edificaciones - Costo', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '3322', nombre: 'Edificaciones - Revaluacion', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '3331', nombre: 'Maquinarias y equipos de explotacion - Costo', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '3332', nombre: 'Maquinarias y equipos de explotacion - Revaluacion', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '3341', nombre: 'Unidades de transporte - Costo', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '3342', nombre: 'Unidades de transporte - Revaluacion', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '3351', nombre: 'Muebles y enseres - Costo', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '3352', nombre: 'Muebles y enseres - Revaluacion', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '3361', nombre: 'Equipos diversos - Costo', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '3362', nombre: 'Equipos diversos - Revaluacion', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '3371', nombre: 'Herramientas y unidades de reemplazo - Costo', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '3391', nombre: 'Construcciones y obras en curso - Costo', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },

  // --- 34 Intangibles ---
  { codigo: '34', nombre: 'Intangibles', tipo: 'activo', naturaleza: 'deudora', nivel: 1 },
  { codigo: '3411', nombre: 'Concesiones, licencias y otros derechos - Costo', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '3421', nombre: 'Patentes y propiedad industrial - Costo', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '3431', nombre: 'Programas de computadora (software) - Costo', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '3441', nombre: 'Costos de exploracion y desarrollo - Costo', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '3451', nombre: 'Formulas, disenos y prototipos - Costo', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '3491', nombre: 'Otros activos intangibles - Costo', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },

  // --- 37 Activo diferido ---
  { codigo: '37', nombre: 'Activo diferido', tipo: 'activo', naturaleza: 'deudora', nivel: 1 },
  { codigo: '3711', nombre: 'Impuesto a la renta diferido - Activo', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '3721', nombre: 'Participaciones de los trabajadores diferidas', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '3731', nombre: 'Intereses diferidos', tipo: 'activo', naturaleza: 'deudora', nivel: 4 },

  // --- 39 Depreciacion, amortizacion y agotamiento acumulados ---
  { codigo: '39', nombre: 'Depreciacion, amortizacion y agotamiento acumulados', tipo: 'activo', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '3911', nombre: 'Depreciacion acumulada - Edificaciones - Costo', tipo: 'activo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '3912', nombre: 'Depreciacion acumulada - Edificaciones - Revaluacion', tipo: 'activo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '3921', nombre: 'Depreciacion acumulada - Maquinarias - Costo', tipo: 'activo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '3922', nombre: 'Depreciacion acumulada - Maquinarias - Revaluacion', tipo: 'activo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '3931', nombre: 'Depreciacion acumulada - Unidades de transporte - Costo', tipo: 'activo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '3941', nombre: 'Depreciacion acumulada - Muebles y enseres - Costo', tipo: 'activo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '3951', nombre: 'Depreciacion acumulada - Equipos diversos - Costo', tipo: 'activo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '3961', nombre: 'Amortizacion acumulada - Intangibles - Costo', tipo: 'activo', naturaleza: 'acreedora', nivel: 4 },

  // ==========================================================================
  // CLASE 4: PASIVO
  // ==========================================================================

  // --- 40 Tributos, contraprestaciones y aportes ---
  { codigo: '40', nombre: 'Tributos, contraprestaciones y aportes al sistema publico de pensiones y de salud por pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '4011', nombre: 'IGV - Cuenta propia', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4012', nombre: 'IGV - Servicios prestados por no domiciliados', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4017', nombre: 'Impuesto a la renta - Tercera categoria', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4018', nombre: 'Impuesto a la renta - Cuarta categoria por pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4019', nombre: 'Impuesto a la renta - Quinta categoria por pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4031', nombre: 'EsSalud por pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4032', nombre: 'ONP por pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4033', nombre: 'Contribucion al SENATI', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4034', nombre: 'Contribucion al SENCICO', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4051', nombre: 'SCTR por pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4071', nombre: 'AFP por pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4091', nombre: 'Otros tributos por pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },

  // --- 41 Remuneraciones y participaciones por pagar ---
  { codigo: '41', nombre: 'Remuneraciones y participaciones por pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '4111', nombre: 'Sueldos y salarios por pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4112', nombre: 'Comisiones por pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4114', nombre: 'Gratificaciones por pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4115', nombre: 'Vacaciones por pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4151', nombre: 'CTS por pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4191', nombre: 'Otras remuneraciones y participaciones por pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },

  // --- 42 Cuentas por pagar comerciales - Terceros ---
  { codigo: '42', nombre: 'Cuentas por pagar comerciales - Terceros', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '4211', nombre: 'Facturas por pagar - No emitidas', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4212', nombre: 'Facturas por pagar - Emitidas', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4221', nombre: 'Anticipos a proveedores - Moneda nacional', tipo: 'pasivo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '4222', nombre: 'Anticipos a proveedores - Moneda extranjera', tipo: 'pasivo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '4231', nombre: 'Letras por pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },

  // --- 44 Cuentas por pagar a los accionistas, directores y gerentes ---
  { codigo: '44', nombre: 'Cuentas por pagar a los accionistas, directores y gerentes', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '4411', nombre: 'Prestamos de accionistas', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4421', nombre: 'Dietas de directores por pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4431', nombre: 'Remuneraciones de gerentes por pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },

  // --- 45 Obligaciones financieras ---
  { codigo: '45', nombre: 'Obligaciones financieras', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '4511', nombre: 'Prestamos de instituciones financieras - Moneda nacional', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4512', nombre: 'Prestamos de instituciones financieras - Moneda extranjera', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4521', nombre: 'Contratos de arrendamiento financiero - Moneda nacional', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4531', nombre: 'Obligaciones emitidas - Bonos', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4551', nombre: 'Costos de financiacion por pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },

  // --- 46 Cuentas por pagar diversas - Terceros ---
  { codigo: '46', nombre: 'Cuentas por pagar diversas - Terceros', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '4611', nombre: 'Reclamaciones de terceros', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4621', nombre: 'Depositos recibidos en garantia', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4631', nombre: 'Intereses por pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4641', nombre: 'Dividendos por pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4681', nombre: 'Otras cuentas por pagar diversas', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },

  // --- 47 Cuentas por pagar diversas - Relacionadas ---
  { codigo: '47', nombre: 'Cuentas por pagar diversas - Relacionadas', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '4711', nombre: 'Prestamos de empresas relacionadas - Moneda nacional', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4712', nombre: 'Prestamos de empresas relacionadas - Moneda extranjera', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },

  // --- 48 Provisiones ---
  { codigo: '48', nombre: 'Provisiones', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '4811', nombre: 'Provision para litigios', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4821', nombre: 'Provision para desmantelamiento', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4831', nombre: 'Provision para reestructuraciones', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4841', nombre: 'Provision para proteccion y remediacion del medio ambiente', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4851', nombre: 'Provision para gastos de responsabilidad social', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },

  // --- 49 Pasivo diferido ---
  { codigo: '49', nombre: 'Pasivo diferido', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '4911', nombre: 'Impuesto a la renta diferido - Pasivo', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4921', nombre: 'Participaciones de los trabajadores diferidas - Pasivo', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4931', nombre: 'Ingresos diferidos - Subvenciones del gobierno', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '4941', nombre: 'Ingresos diferidos - Ventas anticipadas', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4 },

  // ==========================================================================
  // CLASE 5: PATRIMONIO
  // ==========================================================================

  // --- 50 Capital ---
  { codigo: '50', nombre: 'Capital', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '5011', nombre: 'Acciones - Capital social', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '5012', nombre: 'Participaciones - Capital social', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 4 },

  // --- 52 Capital adicional ---
  { codigo: '52', nombre: 'Capital adicional', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '5211', nombre: 'Primas de acciones', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '5221', nombre: 'Capitalizaciones en tramite', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 4 },

  // --- 56 Resultados no realizados ---
  { codigo: '56', nombre: 'Resultados no realizados', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '5611', nombre: 'Diferencia en cambio de inversiones permanentes', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 4 },

  // --- 57 Excedente de revaluacion ---
  { codigo: '57', nombre: 'Excedente de revaluacion', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '5711', nombre: 'Excedente de revaluacion - Inmuebles, maquinaria y equipo', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '5712', nombre: 'Excedente de revaluacion - Intangibles', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 4 },

  // --- 58 Reservas ---
  { codigo: '58', nombre: 'Reservas', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '5811', nombre: 'Reserva legal', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '5821', nombre: 'Reserva contractual', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '5831', nombre: 'Reserva estatutaria', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '5841', nombre: 'Reserva facultativa', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 4 },

  // --- 59 Resultados acumulados ---
  { codigo: '59', nombre: 'Resultados acumulados', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '5911', nombre: 'Utilidades acumuladas - Utilidades no distribuidas', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '5912', nombre: 'Utilidades acumuladas - Ingresos de anos anteriores', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '5921', nombre: 'Perdidas acumuladas - Perdidas no compensadas', tipo: 'patrimonio', naturaleza: 'deudora', nivel: 4 },
  { codigo: '5922', nombre: 'Perdidas acumuladas - Gastos de anos anteriores', tipo: 'patrimonio', naturaleza: 'deudora', nivel: 4 },

  // ==========================================================================
  // CLASE 6: GASTOS POR NATURALEZA
  // ==========================================================================

  // --- 60 Compras ---
  { codigo: '60', nombre: 'Compras', tipo: 'gasto', naturaleza: 'deudora', nivel: 1 },
  { codigo: '6011', nombre: 'Mercaderias manufacturadas', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6021', nombre: 'Materias primas', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6031', nombre: 'Materiales auxiliares', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6032', nombre: 'Suministros', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6033', nombre: 'Repuestos', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6041', nombre: 'Envases', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6042', nombre: 'Embalajes', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },

  // --- 61 Variacion de existencias ---
  { codigo: '61', nombre: 'Variacion de existencias', tipo: 'gasto', naturaleza: 'deudora', nivel: 1 },
  { codigo: '6111', nombre: 'Variacion de mercaderias manufacturadas', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6121', nombre: 'Variacion de materias primas', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6131', nombre: 'Variacion de materiales auxiliares', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6132', nombre: 'Variacion de suministros', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6133', nombre: 'Variacion de repuestos', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6141', nombre: 'Variacion de envases', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6142', nombre: 'Variacion de embalajes', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },

  // --- 62 Gastos de personal, directores y gerentes ---
  { codigo: '62', nombre: 'Gastos de personal, directores y gerentes', tipo: 'gasto', naturaleza: 'deudora', nivel: 1 },
  { codigo: '6211', nombre: 'Sueldos y salarios', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6212', nombre: 'Comisiones', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6213', nombre: 'Remuneracion en especie', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6214', nombre: 'Gratificaciones', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6215', nombre: 'Vacaciones', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6221', nombre: 'Asignacion familiar', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6231', nombre: 'Indemnizaciones al personal', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6241', nombre: 'Capacitacion del personal', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6251', nombre: 'Atencion al personal', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6261', nombre: 'Gerentes - Remuneraciones', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6271', nombre: 'Regimen de prestaciones de salud - EsSalud', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6272', nombre: 'Regimen de pensiones - ONP', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6273', nombre: 'SCTR', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6274', nombre: 'EPS', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6291', nombre: 'CTS', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },

  // --- 63 Gastos de servicios prestados por terceros ---
  { codigo: '63', nombre: 'Gastos de servicios prestados por terceros', tipo: 'gasto', naturaleza: 'deudora', nivel: 1 },
  { codigo: '6311', nombre: 'Transporte de carga', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6312', nombre: 'Transporte de pasajeros', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6321', nombre: 'Asesoria y consultoria - Administrativa', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6322', nombre: 'Asesoria y consultoria - Legal y tributaria', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6323', nombre: 'Asesoria y consultoria - Auditoria y contable', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6324', nombre: 'Asesoria y consultoria - Mercadotecnia', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6325', nombre: 'Asesoria y consultoria - Medioambiental', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6331', nombre: 'Produccion encargada a terceros', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6341', nombre: 'Mantenimiento y reparacion - Inmuebles', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6342', nombre: 'Mantenimiento y reparacion - Maquinaria y equipo', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6343', nombre: 'Mantenimiento y reparacion - Vehiculos', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6351', nombre: 'Alquileres - Terrenos', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6352', nombre: 'Alquileres - Edificaciones', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6353', nombre: 'Alquileres - Maquinaria y equipo', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6354', nombre: 'Alquileres - Equipos de computo', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6361', nombre: 'Energia electrica', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6362', nombre: 'Gas', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6363', nombre: 'Agua', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6364', nombre: 'Telefono', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6365', nombre: 'Internet', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6371', nombre: 'Publicidad', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6372', nombre: 'Publicaciones', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6373', nombre: 'Relaciones publicas', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6381', nombre: 'Contratistas', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6391', nombre: 'Gastos bancarios', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6392', nombre: 'Gastos de laboratorio', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },

  // --- 64 Gastos por tributos ---
  { codigo: '64', nombre: 'Gastos por tributos', tipo: 'gasto', naturaleza: 'deudora', nivel: 1 },
  { codigo: '6411', nombre: 'Impuesto general a las ventas - No recuperable', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6412', nombre: 'Impuesto selectivo al consumo', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6421', nombre: 'Impuesto predial', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6422', nombre: 'Arbitrios municipales', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6431', nombre: 'Derechos aduaneros', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6441', nombre: 'Contribucion al SENATI', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6442', nombre: 'Contribucion al SENCICO', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6491', nombre: 'Otros tributos', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },

  // --- 65 Otros gastos de gestion ---
  { codigo: '65', nombre: 'Otros gastos de gestion', tipo: 'gasto', naturaleza: 'deudora', nivel: 1 },
  { codigo: '6511', nombre: 'Seguros - Riesgo sobre activos', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6512', nombre: 'Seguros - Vida y accidentes', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6521', nombre: 'Regalias', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6531', nombre: 'Suscripciones', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6541', nombre: 'Licencias y derechos de vigencia', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6551', nombre: 'Costo neto de enajenacion de activos - Inmuebles', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6561', nombre: 'Suministros', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6591', nombre: 'Donaciones', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6592', nombre: 'Sanciones administrativas', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6593', nombre: 'Gastos de representacion', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6594', nombre: 'Gastos de viaje', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },

  // --- 67 Gastos financieros ---
  { codigo: '67', nombre: 'Gastos financieros', tipo: 'gasto', naturaleza: 'deudora', nivel: 1 },
  { codigo: '6711', nombre: 'Prestamos de instituciones financieras - Intereses', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6712', nombre: 'Contratos de arrendamiento financiero - Intereses', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6721', nombre: 'Documentos vendidos o descontados - Intereses', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6731', nombre: 'Intereses por prestamos de terceros', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6741', nombre: 'Diferencia de cambio - Perdida', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6751', nombre: 'Gastos por descuentos concedidos por pronto pago', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6791', nombre: 'Otros gastos financieros', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },

  // --- 68 Valuacion y deterioro de activos y provisiones ---
  { codigo: '68', nombre: 'Valuacion y deterioro de activos y provisiones', tipo: 'gasto', naturaleza: 'deudora', nivel: 1 },
  { codigo: '6811', nombre: 'Depreciacion - Edificaciones - Costo', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6812', nombre: 'Depreciacion - Edificaciones - Revaluacion', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6813', nombre: 'Depreciacion - Maquinarias y equipos - Costo', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6814', nombre: 'Depreciacion - Unidades de transporte - Costo', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6815', nombre: 'Depreciacion - Muebles y enseres - Costo', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6816', nombre: 'Depreciacion - Equipos diversos - Costo', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6821', nombre: 'Amortizacion de intangibles - Costo', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6831', nombre: 'Agotamiento de recursos naturales', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6841', nombre: 'Valuacion de activos - Desvalorizacion de existencias', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6851', nombre: 'Deterioro de valor de activos - Inmuebles', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6861', nombre: 'Provision para cobranza dudosa', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },

  // --- 69 Costo de ventas ---
  { codigo: '69', nombre: 'Costo de ventas', tipo: 'costo', naturaleza: 'deudora', nivel: 1 },
  { codigo: '6911', nombre: 'Costo de ventas - Mercaderias manufacturadas', tipo: 'costo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6921', nombre: 'Costo de ventas - Productos terminados', tipo: 'costo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6931', nombre: 'Costo de ventas - Subproductos, desechos y desperdicios', tipo: 'costo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '6941', nombre: 'Costo de ventas - Servicios', tipo: 'costo', naturaleza: 'deudora', nivel: 4 },

  // ==========================================================================
  // CLASE 7: INGRESOS
  // ==========================================================================

  // --- 70 Ventas ---
  { codigo: '70', nombre: 'Ventas', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '7011', nombre: 'Ventas de mercaderias manufacturadas - Terceros', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '7012', nombre: 'Ventas de mercaderias manufacturadas - Relacionadas', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '7021', nombre: 'Ventas de productos terminados - Terceros', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '7022', nombre: 'Ventas de productos terminados - Relacionadas', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '7031', nombre: 'Ventas de subproductos y desechos - Terceros', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '7041', nombre: 'Prestacion de servicios - Terceros', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '7042', nombre: 'Prestacion de servicios - Relacionadas', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },

  // --- 73 Descuentos, rebajas y bonificaciones obtenidos ---
  { codigo: '73', nombre: 'Descuentos, rebajas y bonificaciones obtenidos', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '7311', nombre: 'Descuentos obtenidos - Terceros', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '7312', nombre: 'Descuentos obtenidos - Relacionadas', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '7321', nombre: 'Rebajas obtenidas - Terceros', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '7331', nombre: 'Bonificaciones obtenidas - Terceros', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },

  // --- 74 Descuentos, rebajas y bonificaciones concedidos ---
  { codigo: '74', nombre: 'Descuentos, rebajas y bonificaciones concedidos', tipo: 'ingreso', naturaleza: 'deudora', nivel: 1 },
  { codigo: '7411', nombre: 'Descuentos concedidos - Terceros', tipo: 'ingreso', naturaleza: 'deudora', nivel: 4 },
  { codigo: '7421', nombre: 'Rebajas concedidas - Terceros', tipo: 'ingreso', naturaleza: 'deudora', nivel: 4 },
  { codigo: '7431', nombre: 'Bonificaciones concedidas - Terceros', tipo: 'ingreso', naturaleza: 'deudora', nivel: 4 },

  // --- 75 Otros ingresos de gestion ---
  { codigo: '75', nombre: 'Otros ingresos de gestion', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '7511', nombre: 'Regalias recibidas', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '7521', nombre: 'Alquileres y otras rentas', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '7531', nombre: 'Comisiones y corretajes', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '7541', nombre: 'Enajenacion de activos inmovilizados', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '7551', nombre: 'Recuperacion de cuentas de valuacion', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '7561', nombre: 'Devoluciones de tributos', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '7591', nombre: 'Otros ingresos de gestion', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },

  // --- 77 Ingresos financieros ---
  { codigo: '77', nombre: 'Ingresos financieros', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '7711', nombre: 'Ganancia por instrumento financiero - Valor razonable', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '7721', nombre: 'Rendimientos ganados', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '7731', nombre: 'Intereses sobre prestamos otorgados', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '7741', nombre: 'Diferencia de cambio - Ganancia', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '7751', nombre: 'Descuentos obtenidos por pronto pago', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '7761', nombre: 'Dividendos recibidos', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '7791', nombre: 'Otros ingresos financieros', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },

  // --- 79 Cargas imputables a cuentas de costos y gastos ---
  { codigo: '79', nombre: 'Cargas imputables a cuentas de costos y gastos', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '7911', nombre: 'Cargas imputables a cuentas de costos y gastos', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },

  // ==========================================================================
  // CLASE 8: SALDOS INTERMEDIARIOS DE GESTION
  // ==========================================================================

  // --- 80 Margen comercial ---
  { codigo: '80', nombre: 'Margen comercial', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '8011', nombre: 'Margen comercial', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },

  // --- 81 Produccion del ejercicio ---
  { codigo: '81', nombre: 'Produccion del ejercicio', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '8111', nombre: 'Produccion de bienes', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '8121', nombre: 'Produccion de servicios', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },

  // --- 82 Valor agregado ---
  { codigo: '82', nombre: 'Valor agregado', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '8211', nombre: 'Valor agregado', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },

  // --- 83 Excedente bruto de explotacion ---
  { codigo: '83', nombre: 'Excedente bruto (insuficiencia bruta) de explotacion', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '8311', nombre: 'Excedente bruto de explotacion', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },

  // --- 84 Resultado de explotacion ---
  { codigo: '84', nombre: 'Resultado de explotacion', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '8411', nombre: 'Resultado de explotacion', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },

  // --- 85 Resultado antes de participaciones e impuestos ---
  { codigo: '85', nombre: 'Resultado antes de participaciones e impuestos', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '8511', nombre: 'Resultado antes de participaciones e impuestos', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },

  // --- 87 Participaciones de los trabajadores ---
  { codigo: '87', nombre: 'Participaciones de los trabajadores', tipo: 'gasto', naturaleza: 'deudora', nivel: 1 },
  { codigo: '8711', nombre: 'Participacion de los trabajadores - Corriente', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '8712', nombre: 'Participacion de los trabajadores - Diferida', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },

  // --- 88 Impuesto a la renta ---
  { codigo: '88', nombre: 'Impuesto a la renta', tipo: 'gasto', naturaleza: 'deudora', nivel: 1 },
  { codigo: '8811', nombre: 'Impuesto a la renta - Corriente', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '8812', nombre: 'Impuesto a la renta - Diferido', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },

  // --- 89 Determinacion del resultado del ejercicio ---
  { codigo: '89', nombre: 'Determinacion del resultado del ejercicio', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '8911', nombre: 'Utilidad del ejercicio', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4 },
  { codigo: '8921', nombre: 'Perdida del ejercicio', tipo: 'ingreso', naturaleza: 'deudora', nivel: 4 },

  // ==========================================================================
  // CLASE 9: CONTABILIDAD ANALITICA DE EXPLOTACION (Costos)
  // ==========================================================================

  // --- 91 Costos por distribuir ---
  { codigo: '91', nombre: 'Costos por distribuir', tipo: 'costo', naturaleza: 'deudora', nivel: 1 },
  { codigo: '9111', nombre: 'Centro de costos de produccion A', tipo: 'costo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '9121', nombre: 'Centro de costos de produccion B', tipo: 'costo', naturaleza: 'deudora', nivel: 4 },

  // --- 92 Costos de produccion ---
  { codigo: '92', nombre: 'Costos de produccion', tipo: 'costo', naturaleza: 'deudora', nivel: 1 },
  { codigo: '9211', nombre: 'Materias primas consumidas', tipo: 'costo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '9221', nombre: 'Mano de obra directa', tipo: 'costo', naturaleza: 'deudora', nivel: 4 },
  { codigo: '9231', nombre: 'Costos indirectos de fabricacion', tipo: 'costo', naturaleza: 'deudora', nivel: 4 },

  // --- 94 Gastos de administracion ---
  { codigo: '94', nombre: 'Gastos de administracion', tipo: 'gasto', naturaleza: 'deudora', nivel: 1 },
  { codigo: '9411', nombre: 'Gastos de administracion - Sueldos y salarios', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '9412', nombre: 'Gastos de administracion - Cargas sociales', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '9413', nombre: 'Gastos de administracion - Servicios de terceros', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '9414', nombre: 'Gastos de administracion - Tributos', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '9415', nombre: 'Gastos de administracion - Depreciacion', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '9416', nombre: 'Gastos de administracion - Amortizacion', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '9417', nombre: 'Gastos de administracion - Provisiones', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '9419', nombre: 'Gastos de administracion - Otros', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },

  // --- 95 Gastos de ventas ---
  { codigo: '95', nombre: 'Gastos de ventas', tipo: 'gasto', naturaleza: 'deudora', nivel: 1 },
  { codigo: '9511', nombre: 'Gastos de ventas - Sueldos y salarios', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '9512', nombre: 'Gastos de ventas - Cargas sociales', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '9513', nombre: 'Gastos de ventas - Servicios de terceros', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '9514', nombre: 'Gastos de ventas - Publicidad y marketing', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '9515', nombre: 'Gastos de ventas - Comisiones', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '9516', nombre: 'Gastos de ventas - Transporte y distribucion', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '9517', nombre: 'Gastos de ventas - Depreciacion', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '9519', nombre: 'Gastos de ventas - Otros', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },

  // --- 97 Gastos financieros (analiticos) ---
  { codigo: '97', nombre: 'Gastos financieros', tipo: 'gasto', naturaleza: 'deudora', nivel: 1 },
  { codigo: '9711', nombre: 'Gastos financieros - Intereses bancarios', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '9712', nombre: 'Gastos financieros - Diferencia de cambio', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '9713', nombre: 'Gastos financieros - Comisiones bancarias', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
  { codigo: '9719', nombre: 'Gastos financieros - Otros', tipo: 'gasto', naturaleza: 'deudora', nivel: 4 },
];

// ---------------------------------------------------------------------------
// Backward-compatible exports
// ---------------------------------------------------------------------------

/**
 * Tipo compatible con la interfaz anterior CuentaPCGE.
 * Se mantiene para no romper importaciones existentes.
 */
export type CuentaPCGE = PCGEAccount;

/**
 * Diccionario indexado por codigo para acceso rapido O(1).
 * Reemplaza al anterior PCGE_CUENTAS con el catalogo completo.
 */
export const PCGE_CUENTAS: Record<string, PCGEAccount> = Object.fromEntries(
  PCGE_CATALOG.map((cuenta) => [cuenta.codigo, cuenta]),
);

/**
 * Verifica si un codigo de cuenta existe en el catalogo PCGE.
 * Mantiene compatibilidad con la firma original.
 */
export function existeCuentaPCGE(codigo: string): boolean {
  return codigo in PCGE_CUENTAS;
}

/**
 * Obtiene los datos de una cuenta PCGE por su codigo.
 * Mantiene compatibilidad con la firma original.
 */
export function obtenerCuentaPCGE(codigo: string): PCGEAccount | undefined {
  return PCGE_CUENTAS[codigo];
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Busca una cuenta contable por su codigo exacto.
 *
 * @param codigo - Codigo de la cuenta (2 o 4 digitos)
 * @returns La cuenta encontrada o undefined si no existe
 */
export function getCuentaByCode(codigo: string): PCGEAccount | undefined {
  return PCGE_CUENTAS[codigo];
}

/**
 * Filtra las cuentas del catalogo por tipo contable.
 *
 * @param tipo - Tipo de cuenta: activo, pasivo, patrimonio, ingreso, gasto, costo
 * @returns Arreglo de cuentas que coinciden con el tipo indicado
 */
export function getCuentasPorTipo(
  tipo: PCGEAccount['tipo'],
): PCGEAccount[] {
  return PCGE_CATALOG.filter((cuenta) => cuenta.tipo === tipo);
}

/**
 * Retorna unicamente las cuentas de movimiento (nivel 4),
 * que son las unicas donde se registran asientos contables.
 *
 * @returns Arreglo de cuentas con nivel 4
 */
export function getCuentasMovimiento(): PCGEAccount[] {
  return PCGE_CATALOG.filter((cuenta) => cuenta.nivel === 4);
}

/**
 * Busca cuentas cuyo codigo comience con el prefijo indicado.
 * Util para obtener todas las subcuentas de una cuenta padre.
 *
 * @param prefijo - Prefijo del codigo (ej: "10", "33", "62")
 * @returns Arreglo de cuentas cuyo codigo inicia con el prefijo
 */
export function getCuentasPorPrefijo(prefijo: string): PCGEAccount[] {
  return PCGE_CATALOG.filter((cuenta) => cuenta.codigo.startsWith(prefijo));
}

/**
 * Retorna las cuentas padre (nivel 1) que representan las
 * clases principales del plan contable.
 *
 * @returns Arreglo de cuentas de nivel 1
 */
export function getCuentasPadre(): PCGEAccount[] {
  return PCGE_CATALOG.filter((cuenta) => cuenta.nivel === 1);
}

/**
 * Valida si un codigo dado corresponde a una cuenta existente
 * en el catalogo PCGE.
 *
 * @param codigo - Codigo a validar
 * @returns true si el codigo existe en el catalogo
 */
export function isCodigoValido(codigo: string): boolean {
  return codigo in PCGE_CUENTAS;
}
