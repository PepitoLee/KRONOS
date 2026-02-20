-- =============================================
-- SEED DATA: Sistema Financiero ERP - Demo
-- Empresa: Peru On Ice SAC (Restaurante)
-- =============================================

-- 1. EMPRESA DE PRUEBA
INSERT INTO empresas (id, ruc, razon_social, nombre_comercial, direccion, departamento, provincia, distrito, regimen_tributario, regimen_laboral)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '20600000001',
  'PERU ON ICE SAC',
  'Peru On Ice',
  'Av. La Marina 1234, San Miguel',
  'Lima',
  'Lima',
  'San Miguel',
  'GENERAL',
  'general'
);

-- 2. PERIODO CONTABLE
INSERT INTO periodos_contables (id, empresa_id, anio, mes, estado)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 2025, 10, 'cerrado'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 2025, 11, 'cerrado'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 2025, 12, 'abierto'),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 2026, 1, 'abierto'),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 2026, 2, 'abierto');

-- 3. PLAN CONTABLE (PCGE Simplificado)
INSERT INTO cuentas_contables (id, empresa_id, codigo, nombre, tipo, nivel, es_movimiento) VALUES
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '10', 'Efectivo y Equivalentes de Efectivo', 'activo', 2, false),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '1011', 'Caja', 'activo', 4, true),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '1041', 'Cuentas Corrientes', 'activo', 4, true),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '12', 'Cuentas por Cobrar Comerciales', 'activo', 2, false),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '1212', 'Emitidas en Cartera', 'activo', 4, true),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '20', 'Mercaderias', 'activo', 2, false),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '2011', 'Mercaderias Manufacturadas', 'activo', 4, true),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '33', 'Inmuebles Maquinaria y Equipo', 'activo', 2, false),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '3311', 'Terrenos', 'activo', 4, true),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '3341', 'Vehiculos', 'activo', 4, true),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '34', 'Intangibles', 'activo', 2, false),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '39', 'Depreciacion Amortizacion y Agotamiento', 'activo', 2, false),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '40', 'Tributos por Pagar', 'pasivo', 2, false),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '4011', 'IGV - Cuenta Propia', 'pasivo', 4, true),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '4017', 'Impuesto a la Renta', 'pasivo', 4, true),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '41', 'Remuneraciones por Pagar', 'pasivo', 2, false),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '4111', 'Sueldos por Pagar', 'pasivo', 4, true),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '42', 'Cuentas por Pagar Comerciales', 'pasivo', 2, false),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '4212', 'Emitidas', 'pasivo', 4, true),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '45', 'Obligaciones Financieras', 'pasivo', 2, false),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '50', 'Capital', 'patrimonio', 2, false),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '5011', 'Acciones', 'patrimonio', 4, true),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '59', 'Resultados Acumulados', 'patrimonio', 2, false),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '5911', 'Utilidades Acumuladas', 'patrimonio', 4, true),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '60', 'Compras', 'gasto', 2, false),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '6011', 'Mercaderias', 'gasto', 4, true),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '62', 'Gastos de Personal', 'gasto', 2, false),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '63', 'Gastos de Servicios', 'gasto', 2, false),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '64', 'Gastos por Tributos', 'gasto', 2, false),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '67', 'Gastos Financieros', 'gasto', 2, false),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '69', 'Costo de Ventas', 'gasto', 2, false),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '6911', 'Mercaderias', 'gasto', 4, true),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '70', 'Ventas', 'ingreso', 2, false),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '7011', 'Mercaderias Terceros', 'ingreso', 4, true),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '7511', 'Descuentos Obtenidos', 'ingreso', 4, true);

-- 4. EMPLEADOS (5 empleados con diferentes cargos)
INSERT INTO empleados (id, empresa_id, dni, nombres, apellidos, fecha_ingreso, cargo, area, tipo_contrato, regimen_laboral, sueldo_basico, asignacion_familiar, estado) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '70123456', 'Carlos Alberto', 'Ramirez Torres', '2022-03-15', 'Administrador General', 'Administracion', 'indefinido', 'general', 5500.00, true, 'activo'),
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '70234567', 'Maria Elena', 'Gutierrez Flores', '2023-01-10', 'Contadora', 'Contabilidad', 'indefinido', 'general', 4200.00, true, 'activo'),
  ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '70345678', 'Jorge Luis', 'Mendoza Quispe', '2023-06-01', 'Chef Principal', 'Cocina', 'indefinido', 'general', 3800.00, false, 'activo'),
  ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', '70456789', 'Ana Sofia', 'Vargas Lopez', '2024-02-15', 'Mesera', 'Atencion', 'plazo_fijo', 'general', 1500.00, false, 'activo'),
  ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', '70567890', 'Pedro Miguel', 'Castillo Huaman', '2024-08-01', 'Ayudante de Cocina', 'Cocina', 'plazo_fijo', 'general', 1300.00, false, 'activo');

-- 5. PROVEEDORES (3 proveedores)
INSERT INTO proveedores (id, empresa_id, ruc, razon_social, tipo, contacto, telefono, email, direccion, condicion_pago, estado) VALUES
  ('p0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '20500000001', 'Distribuidora de Alimentos del Sur SAC', 'bienes', 'Roberto Diaz', '01-4567890', 'ventas@alimentosdelsur.pe', 'Calle Los Olivos 456, Ate', 'credito_30', 'activo'),
  ('p0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '20500000002', 'Bebidas y Licores Premium EIRL', 'bienes', 'Laura Gomez', '01-5678901', 'pedidos@bebidaslicores.pe', 'Av. Industrial 789, Callao', 'credito_15', 'activo'),
  ('p0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '20500000003', 'Servicios de Limpieza Total SAC', 'servicios', 'Carmen Ortiz', '01-6789012', 'contacto@limpiezatotal.pe', 'Jr. Huallaga 321, Lima', 'contado', 'activo');

-- 6. CUENTA BANCARIA
INSERT INTO cuentas_bancarias (id, empresa_id, banco, tipo_cuenta, numero_cuenta, moneda, saldo_actual) VALUES
  ('cb000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'BCP', 'corriente', '191-2345678-0-15', 'PEN', 45320.50),
  ('cb000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Interbank', 'ahorros', '200-3456789-012', 'PEN', 12500.00);

-- 7. DOCUMENTOS DE VENTA (30 del ultimo trimestre)
DO $$
DECLARE
  i INT;
  doc_fecha DATE;
  subtotal NUMERIC;
  igv_val NUMERIC;
  total_val NUMERIC;
  serie TEXT;
  tipo TEXT;
  nombres TEXT[] := ARRAY['Juan Perez', 'Maria Lopez', 'Carlos Quispe', 'Ana Torres', 'Pedro Gomez', 'Luisa Flores', 'Roberto Diaz', 'Carmen Huaman', 'Jorge Mendoza', 'Sofia Vargas'];
  rucs TEXT[] := ARRAY['10701234561', '10702345672', '10703456783', '10704567894', '10705678905', '10706789016', '10707890127', '10708901238', '10709012349', '10700123450'];
BEGIN
  FOR i IN 1..30 LOOP
    doc_fecha := ('2025-10-01'::DATE + (random() * 120)::INT);
    subtotal := (50 + random() * 450)::NUMERIC(10,2);
    igv_val := (subtotal * 0.18)::NUMERIC(10,2);
    total_val := subtotal + igv_val;

    IF random() < 0.6 THEN
      tipo := 'boleta';
      serie := 'B001';
    ELSE
      tipo := 'factura';
      serie := 'F001';
    END IF;

    INSERT INTO documentos (
      id, empresa_id, tipo, serie, numero, fecha_emision, fecha_vencimiento,
      tipo_operacion, ruc_tercero, nombre_tercero, moneda, subtotal, igv, total,
      estado, notas
    ) VALUES (
      gen_random_uuid(),
      'a0000000-0000-0000-0000-000000000001',
      tipo,
      serie,
      LPAD(i::TEXT, 8, '0'),
      doc_fecha,
      doc_fecha + 30,
      'venta',
      rucs[1 + (i % 10)],
      nombres[1 + (i % 10)],
      'PEN',
      subtotal,
      igv_val,
      total_val,
      CASE WHEN random() < 0.8 THEN 'pagado' ELSE 'pendiente' END,
      'Consumo en restaurante'
    );
  END LOOP;
END $$;

-- 8. DOCUMENTOS DE COMPRA (15)
DO $$
DECLARE
  i INT;
  doc_fecha DATE;
  subtotal NUMERIC;
  igv_val NUMERIC;
  total_val NUMERIC;
  prov_nombres TEXT[] := ARRAY['Distribuidora de Alimentos del Sur SAC', 'Bebidas y Licores Premium EIRL', 'Servicios de Limpieza Total SAC'];
  prov_rucs TEXT[] := ARRAY['20500000001', '20500000002', '20500000003'];
  prov_idx INT;
BEGIN
  FOR i IN 1..15 LOOP
    doc_fecha := ('2025-10-01'::DATE + (random() * 120)::INT);
    subtotal := (200 + random() * 2000)::NUMERIC(10,2);
    igv_val := (subtotal * 0.18)::NUMERIC(10,2);
    total_val := subtotal + igv_val;
    prov_idx := 1 + (i % 3);

    INSERT INTO documentos (
      id, empresa_id, tipo, serie, numero, fecha_emision, fecha_vencimiento,
      tipo_operacion, ruc_tercero, nombre_tercero, moneda, subtotal, igv, total,
      estado, notas
    ) VALUES (
      gen_random_uuid(),
      'a0000000-0000-0000-0000-000000000001',
      'factura',
      'F001',
      LPAD((100 + i)::TEXT, 8, '0'),
      doc_fecha,
      doc_fecha + 30,
      'compra',
      prov_rucs[prov_idx],
      prov_nombres[prov_idx],
      'PEN',
      subtotal,
      igv_val,
      total_val,
      CASE WHEN random() < 0.7 THEN 'pagado' ELSE 'pendiente' END,
      'Compra de insumos'
    );
  END LOOP;
END $$;

-- 9. RECLAMOS (5 en diferentes estados)
INSERT INTO reclamos (id, empresa_id, numero, fecha, cliente, tipo, motivo, descripcion, prioridad, estado) VALUES
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'REC-2025-001', '2025-11-05', 'Juan Perez', 'servicio', 'Demora en atencion', 'El cliente reporta que espero mas de 45 minutos para ser atendido en hora punta.', 'media', 'resuelto'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'REC-2025-002', '2025-11-15', 'Maria Lopez', 'producto', 'Plato frio', 'Reclamo por plato principal servido a temperatura inadecuada.', 'alta', 'resuelto'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'REC-2025-003', '2025-12-02', 'Carlos Quispe', 'facturacion', 'Error en factura', 'Se emitio factura con monto incorrecto, solicita nota de credito.', 'alta', 'en_proceso'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'REC-2025-004', '2025-12-18', 'Ana Torres', 'servicio', 'Trato inadecuado', 'Cliente indica que el personal no fue amable durante su visita.', 'media', 'pendiente'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'REC-2025-005', '2026-01-10', 'Pedro Gomez', 'entrega', 'Pedido incompleto', 'Delivery llego sin uno de los platos ordenados.', 'baja', 'pendiente');

-- 10. ENCUESTAS DE SATISFACCION (10)
INSERT INTO encuestas_satisfaccion (id, empresa_id, fecha, cliente, puntuacion, comentarios, canal) VALUES
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '2025-11-01', 'Juan Perez', 5, 'Excelente comida y servicio', 'presencial'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '2025-11-05', 'Maria Lopez', 4, 'Buena comida, un poco de espera', 'presencial'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '2025-11-10', 'Carlos Quispe', 3, 'Ambiente agradable pero el plato no estaba como esperaba', 'web'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '2025-11-15', 'Ana Torres', 5, 'El mejor restaurante peruano de la zona', 'web'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '2025-11-20', 'Pedro Gomez', 4, 'Buen menu ejecutivo', 'presencial'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '2025-12-01', 'Luisa Flores', 5, 'Increible lomo saltado', 'web'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '2025-12-05', 'Roberto Diaz', 2, 'Pedido llego frio por delivery', 'delivery'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '2025-12-10', 'Carmen Huaman', 4, 'Rica comida, buen precio', 'presencial'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '2025-12-15', 'Jorge Mendoza', 5, 'Siempre vengo con mi familia, excelente', 'presencial'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '2026-01-05', 'Sofia Vargas', 3, 'El ceviche estaba bueno pero el arroz no tanto', 'web');

-- 11. ENCUESTA DE CLIMA LABORAL
INSERT INTO encuestas_clima (id, empresa_id, titulo, fecha_inicio, fecha_fin, estado) VALUES
  ('cl000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Encuesta de Clima Laboral Q4 2025', '2025-12-01', '2025-12-15', 'cerrada');

INSERT INTO respuestas_clima (id, encuesta_id, empleado_id, pregunta, respuesta, puntuacion) VALUES
  (gen_random_uuid(), 'cl000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Satisfaccion general con el trabajo', 'Muy satisfecho, el ambiente es bueno', 5),
  (gen_random_uuid(), 'cl000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'Satisfaccion general con el trabajo', 'Buena, aunque podria mejorar la comunicacion', 4),
  (gen_random_uuid(), 'cl000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', 'Satisfaccion general con el trabajo', 'Bien, me gusta cocinar aqui', 4),
  (gen_random_uuid(), 'cl000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000004', 'Satisfaccion general con el trabajo', 'Regular, los turnos son muy largos', 3),
  (gen_random_uuid(), 'cl000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000005', 'Satisfaccion general con el trabajo', 'Estoy aprendiendo mucho', 4),
  (gen_random_uuid(), 'cl000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Relacion con el equipo', 'Excelente, somos un gran equipo', 5),
  (gen_random_uuid(), 'cl000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'Relacion con el equipo', 'Buena coordinacion entre areas', 4),
  (gen_random_uuid(), 'cl000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', 'Relacion con el equipo', 'Nos llevamos bien en cocina', 5),
  (gen_random_uuid(), 'cl000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000004', 'Relacion con el equipo', 'Bien con los companeros', 4),
  (gen_random_uuid(), 'cl000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000005', 'Relacion con el equipo', 'El chef es muy buen mentor', 5);

-- 12. AUDITORIA DOCUMENTAL (5 documentos legales, 2 por vencer)
INSERT INTO auditoria_documentos (id, empresa_id, tipo_documento, numero, descripcion, fecha_emision, fecha_vencimiento, estado_revision, observaciones) VALUES
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'licencia_funcionamiento', 'LF-2025-001', 'Licencia de funcionamiento municipal San Miguel', '2025-01-15', '2026-01-15', 'aprobado', 'Vigente hasta enero 2026'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'certificado_defensa_civil', 'DC-2025-001', 'Certificado INDECI de seguridad', '2025-03-01', '2026-03-01', 'aprobado', 'Todas las observaciones levantadas'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'carnet_sanidad', 'CS-2025-005', 'Carnets de sanidad del personal de cocina', '2025-06-01', '2026-02-28', 'observado', 'URGENTE: Vence en febrero 2026, renovar'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'registro_sanitario', 'RS-2024-001', 'Registro sanitario DIGESA', '2024-05-15', '2026-05-15', 'revisado', 'Vigente, siguiente revision mayo 2026'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'poliza_seguro', 'PS-2025-001', 'Poliza de seguro contra incendios y robos', '2025-04-01', '2026-03-15', 'pendiente', 'Por vencer en marzo 2026, solicitar cotizacion de renovacion');

-- 13. EVALUACIONES DE CALIDAD (2)
INSERT INTO evaluaciones_calidad (id, empresa_id, fecha, area, evaluador, puntuacion, observaciones, estado) VALUES
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '2025-11-15', 'Cocina', 'Carlos Ramirez', 85, 'Buena higiene general. Mejorar rotacion de insumos perecibles.', 'completada'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '2025-12-10', 'Atencion', 'Carlos Ramirez', 78, 'Protocolo de atencion cumplido en 80%. Capacitar en manejo de reclamos.', 'completada');

-- 14. TRANSACCIONES DE VENTA (3 meses para KPIs)
DO $$
DECLARE
  i INT;
  tx_fecha DATE;
  tx_monto NUMERIC;
  tx_metodo TEXT;
  metodos TEXT[] := ARRAY['efectivo', 'tarjeta', 'yape', 'plin', 'transferencia'];
BEGIN
  FOR i IN 1..90 LOOP
    tx_fecha := ('2025-11-01'::DATE + (i - 1));
    IF tx_fecha > CURRENT_DATE THEN EXIT; END IF;

    -- 3-8 transacciones por dia
    FOR j IN 1..(3 + (random() * 5)::INT) LOOP
      tx_monto := (25 + random() * 200)::NUMERIC(10,2);
      tx_metodo := metodos[1 + (random() * 4)::INT];

      INSERT INTO transacciones_venta (
        id, empresa_id, fecha, monto, metodo_pago, mesa, items, estado
      ) VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        tx_fecha,
        tx_monto,
        tx_metodo,
        (1 + (random() * 15)::INT)::TEXT,
        (1 + (random() * 5)::INT),
        'completada'
      );
    END LOOP;
  END LOOP;
END $$;

-- 15. REGISTRO DE VISITANTES (3 meses)
DO $$
DECLARE
  v_fecha DATE;
  i INT;
BEGIN
  FOR i IN 0..89 LOOP
    v_fecha := ('2025-11-01'::DATE + i);
    IF v_fecha > CURRENT_DATE THEN EXIT; END IF;

    -- Solo dias de semana tienen mas visitantes
    INSERT INTO registro_visitantes (
      id, empresa_id, fecha, cantidad, observaciones
    ) VALUES (
      gen_random_uuid(),
      'a0000000-0000-0000-0000-000000000001',
      v_fecha,
      CASE
        WHEN EXTRACT(DOW FROM v_fecha) IN (0, 6) THEN (40 + (random() * 60)::INT) -- Fin de semana
        WHEN EXTRACT(DOW FROM v_fecha) IN (5) THEN (30 + (random() * 50)::INT) -- Viernes
        ELSE (15 + (random() * 35)::INT) -- Entre semana
      END,
      NULL
    );
  END LOOP;
END $$;

-- 16. ASISTENCIAS (2 meses para todos los empleados)
DO $$
DECLARE
  emp_id UUID;
  a_fecha DATE;
  emp_ids UUID[] := ARRAY[
    'e0000000-0000-0000-0000-000000000001'::UUID,
    'e0000000-0000-0000-0000-000000000002'::UUID,
    'e0000000-0000-0000-0000-000000000003'::UUID,
    'e0000000-0000-0000-0000-000000000004'::UUID,
    'e0000000-0000-0000-0000-000000000005'::UUID
  ];
  i INT;
  d INT;
BEGIN
  FOR i IN 1..5 LOOP
    emp_id := emp_ids[i];
    FOR d IN 0..59 LOOP
      a_fecha := ('2025-12-01'::DATE + d);
      IF a_fecha > CURRENT_DATE THEN EXIT; END IF;
      IF EXTRACT(DOW FROM a_fecha) IN (0) THEN CONTINUE; END IF; -- Domingo libre

      INSERT INTO asistencias (
        id, empresa_id, empleado_id, fecha, hora_entrada, hora_salida, estado
      ) VALUES (
        gen_random_uuid(),
        'a0000000-0000-0000-0000-000000000001',
        emp_id,
        a_fecha,
        ('08:00:00'::TIME + ((random() * 30)::INT || ' minutes')::INTERVAL),
        ('17:00:00'::TIME + ((random() * 60)::INT || ' minutes')::INTERVAL),
        CASE
          WHEN random() < 0.85 THEN 'presente'
          WHEN random() < 0.95 THEN 'tardanza'
          ELSE 'falta'
        END
      );
    END LOOP;
  END LOOP;
END $$;
