'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/currency'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Loader2,
  FileText,
  Save,
  Calculator,
  Search,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const detalleSchema = z.object({
  descripcion: z.string().min(1, 'La descripcion es requerida'),
  cantidad: z.coerce.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  precio_unitario: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
})

const documentoSchema = z.object({
  tipo: z.enum([
    'factura',
    'boleta',
    'nota_credito',
    'nota_debito',
    'recibo_honorarios',
    'ticket',
  ], { error: 'Seleccione un tipo de documento' }),
  tipo_operacion: z.enum(['compra', 'venta'], {
    error: 'Seleccione el tipo de operacion',
  }),
  serie: z
    .string()
    .min(1, 'La serie es requerida')
    .max(10, 'Maximo 10 caracteres'),
  numero: z
    .string()
    .min(1, 'El numero es requerido')
    .max(20, 'Maximo 20 caracteres'),
  fecha_emision: z.string().min(1, 'La fecha de emision es requerida'),
  fecha_vencimiento: z.string().optional(),
  ruc_dni_tercero: z
    .string()
    .min(1, 'El RUC/DNI es requerido')
    .max(11, 'Maximo 11 digitos')
    .regex(/^\d+$/, 'Solo se permiten digitos'),
  nombre_tercero: z.string().min(1, 'El nombre del tercero es requerido'),
  moneda: z.enum(['PEN', 'USD']),
  tipo_cambio: z.coerce.number().optional(),
  detalles: z
    .array(detalleSchema)
    .min(1, 'Debe agregar al menos un item de detalle'),
  notas: z.string().optional(),
})

type DocumentoFormValues = z.infer<typeof documentoSchema>

const TIPO_DOCUMENTO_LABELS: Record<string, string> = {
  factura: 'Factura',
  boleta: 'Boleta de Venta',
  nota_credito: 'Nota de Credito',
  nota_debito: 'Nota de Debito',
  recibo_honorarios: 'Recibo por Honorarios',
  ticket: 'Ticket',
}

export default function DocumentForm() {
  const router = useRouter()
  const supabase = createClient()
  const [submitting, setSubmitting] = useState(false)
  const [validatingRuc, setValidatingRuc] = useState(false)
  const [fetchingTipoCambio, setFetchingTipoCambio] = useState(false)

  const form = useForm<DocumentoFormValues>({
    resolver: zodResolver(documentoSchema) as any,
    defaultValues: {
      tipo: 'factura',
      tipo_operacion: 'venta',
      serie: '',
      numero: '',
      fecha_emision: new Date().toISOString().split('T')[0],
      fecha_vencimiento: '',
      ruc_dni_tercero: '',
      nombre_tercero: '',
      moneda: 'PEN',
      tipo_cambio: 1,
      detalles: [{ descripcion: '', cantidad: 1, precio_unitario: 0 }],
      notas: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'detalles',
  })

  const watchMoneda = form.watch('moneda')
  const watchDetalles = form.watch('detalles')

  // Auto-fill tipo de cambio cuando moneda es USD
  const fetchTipoCambio = useCallback(async () => {
    setFetchingTipoCambio(true)
    try {
      const res = await fetch('/api/tipo-cambio')
      if (res.ok) {
        const data = await res.json()
        if (data.venta) {
          form.setValue('tipo_cambio', data.venta)
        }
      }
    } catch {
      // Silently fail - user can input manually
    } finally {
      setFetchingTipoCambio(false)
    }
  }, [form])

  useEffect(() => {
    if (watchMoneda === 'USD') {
      fetchTipoCambio()
    }
  }, [watchMoneda, fetchTipoCambio])

  // Validar RUC y auto-fill nombre del tercero
  const handleValidarRuc = async () => {
    const ruc = form.getValues('ruc_dni_tercero')
    if (!ruc || ruc.length !== 11) {
      toast.error('RUC invalido', { description: 'El RUC debe tener 11 digitos.' })
      return
    }
    setValidatingRuc(true)
    try {
      const res = await fetch(`/api/ruc?ruc=${ruc}`)
      if (res.ok) {
        const data = await res.json()
        if (data.razon_social) {
          form.setValue('nombre_tercero', data.razon_social)
          toast.success('RUC validado', { description: data.razon_social })
        } else if (data.valid) {
          toast.info('RUC valido', { description: 'No se encontro razon social automaticamente.' })
        } else {
          toast.error('RUC invalido', { description: data.error || 'El RUC no paso la validacion.' })
        }
      }
    } catch {
      toast.error('Error al validar', { description: 'No se pudo conectar al servicio de validacion.' })
    } finally {
      setValidatingRuc(false)
    }
  }

  const calcItemSubtotal = (cantidad: number, precio: number) => {
    return cantidad * precio
  }

  const calcItemIgv = (cantidad: number, precio: number) => {
    return cantidad * precio * 0.18
  }

  const calcItemTotal = (cantidad: number, precio: number) => {
    const sub = cantidad * precio
    return sub + sub * 0.18
  }

  const subtotalGeneral = watchDetalles.reduce(
    (acc, item) => acc + calcItemSubtotal(item.cantidad || 0, item.precio_unitario || 0),
    0
  )

  const igvGeneral = subtotalGeneral * 0.18
  const totalGeneral = subtotalGeneral + igvGeneral

  const onSubmit = async (data: DocumentoFormValues) => {
    setSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Error de autenticacion', {
          description: 'Debe iniciar sesion para registrar documentos.',
        })
        setSubmitting(false)
        return
      }

      const subtotal = data.detalles.reduce(
        (acc, item) => acc + item.cantidad * item.precio_unitario,
        0
      )
      const igv = subtotal * 0.18
      const total = subtotal + igv

      const { data: documento, error: docError } = await supabase
        .from('documentos')
        .insert({
          tipo: data.tipo,
          tipo_operacion: data.tipo_operacion,
          serie: data.serie,
          numero: data.numero,
          fecha_emision: data.fecha_emision,
          fecha_vencimiento: data.fecha_vencimiento || null,
          ruc_dni_tercero: data.ruc_dni_tercero,
          nombre_tercero: data.nombre_tercero,
          moneda: data.moneda,
          tipo_cambio: data.moneda === 'USD' ? data.tipo_cambio : null,
          subtotal,
          igv,
          total,
          notas: data.notas || null,
          user_id: user.id,
        })
        .select('id')
        .single()

      if (docError) {
        toast.error('Error al registrar documento', {
          description: docError.message,
        })
        setSubmitting(false)
        return
      }

      const detallesRows = data.detalles.map((item, index) => {
        const itemSubtotal = item.cantidad * item.precio_unitario
        const itemIgv = itemSubtotal * 0.18
        const itemTotal = itemSubtotal + itemIgv

        return {
          documento_id: documento.id,
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: itemSubtotal,
          igv: itemIgv,
          total: itemTotal,
          orden: index + 1,
        }
      })

      const { error: detError } = await supabase
        .from('documento_detalles')
        .insert(detallesRows)

      if (detError) {
        toast.error('Error al registrar detalles', {
          description: detError.message,
        })
        setSubmitting(false)
        return
      }

      // Obtener empresa_id del usuario
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('id', user.id)
        .single()

      const empresaId = usuario?.empresa_id
      if (!empresaId) {
        toast.error('Error de configuracion', {
          description: 'No se encontro la empresa asociada al usuario.',
        })
        setSubmitting(false)
        return
      }

      // Obtener periodo contable abierto
      const fechaEmision = new Date(data.fecha_emision)
      const { data: periodo } = await supabase
        .from('periodos_contables')
        .select('id')
        .eq('empresa_id', empresaId)
        .eq('anio', fechaEmision.getFullYear())
        .eq('mes', fechaEmision.getMonth() + 1)
        .eq('estado', 'abierto')
        .single()

      if (!periodo) {
        toast.error('Periodo no disponible', {
          description: 'No existe un periodo contable abierto para la fecha seleccionada.',
        })
        setSubmitting(false)
        return
      }

      // Obtener ultimo numero de asiento
      const { data: lastAsiento } = await supabase
        .from('asientos_contables')
        .select('numero')
        .eq('empresa_id', empresaId)
        .eq('periodo_id', periodo.id)
        .order('numero', { ascending: false })
        .limit(1)
        .single()

      const nextNumero = (lastAsiento?.numero ?? 0) + 1

      // Crear asiento contable (header)
      const glosa = data.tipo_operacion === 'venta'
        ? `Venta ${TIPO_DOCUMENTO_LABELS[data.tipo]} ${data.serie}-${data.numero}`
        : `Compra ${TIPO_DOCUMENTO_LABELS[data.tipo]} ${data.serie}-${data.numero}`

      const { data: asiento, error: asientoError } = await supabase
        .from('asientos_contables')
        .insert({
          empresa_id: empresaId,
          periodo_id: periodo.id,
          numero: nextNumero,
          fecha: data.fecha_emision,
          glosa,
          tipo: 'operacion',
          documento_id: documento.id,
          estado: 'registrado',
        })
        .select('id')
        .single()

      if (asientoError) {
        toast.error('Error al generar asiento contable', {
          description: asientoError.message,
        })
        setSubmitting(false)
        return
      }

      // Resolver cuenta_contable_id por codigo
      const codigosNeeded = data.tipo_operacion === 'venta'
        ? ['12', '70', '40']
        : ['60', '40', '42']

      const { data: cuentas } = await supabase
        .from('cuentas_contables')
        .select('id, codigo')
        .eq('empresa_id', empresaId)
        .in('codigo', codigosNeeded)

      const cuentaMap = new Map(cuentas?.map(c => [c.codigo, c.id]) ?? [])

      // Crear movimientos contables (detalle)
      let movimientos: {
        asiento_id: string
        cuenta_contable_id: string
        debe: number
        haber: number
        glosa: string
      }[] = []

      if (data.tipo_operacion === 'venta') {
        movimientos = [
          {
            asiento_id: asiento.id,
            cuenta_contable_id: cuentaMap.get('12') ?? '',
            debe: total,
            haber: 0,
            glosa: 'Cuentas por cobrar comerciales',
          },
          {
            asiento_id: asiento.id,
            cuenta_contable_id: cuentaMap.get('70') ?? '',
            debe: 0,
            haber: subtotal,
            glosa: 'Ventas',
          },
          {
            asiento_id: asiento.id,
            cuenta_contable_id: cuentaMap.get('40') ?? '',
            debe: 0,
            haber: igv,
            glosa: 'Tributos por pagar - IGV',
          },
        ]
      } else {
        movimientos = [
          {
            asiento_id: asiento.id,
            cuenta_contable_id: cuentaMap.get('60') ?? '',
            debe: subtotal,
            haber: 0,
            glosa: 'Compras',
          },
          {
            asiento_id: asiento.id,
            cuenta_contable_id: cuentaMap.get('40') ?? '',
            debe: igv,
            haber: 0,
            glosa: 'Tributos por pagar - IGV',
          },
          {
            asiento_id: asiento.id,
            cuenta_contable_id: cuentaMap.get('42') ?? '',
            debe: 0,
            haber: total,
            glosa: 'Cuentas por pagar comerciales',
          },
        ]
      }

      const { error: movError } = await supabase
        .from('movimientos_contables')
        .insert(movimientos)

      if (movError) {
        toast.error('Error al generar movimientos contables', {
          description: movError.message,
        })
        setSubmitting(false)
        return
      }

      toast.success('Documento registrado correctamente', {
        description: `${TIPO_DOCUMENTO_LABELS[data.tipo]} ${data.serie}-${data.numero} guardado con asientos contables.`,
      })

      router.push('/documentos')
      router.refresh()
    } catch (err) {
      toast.error('Error inesperado', {
        description: 'Ocurrio un error al procesar el documento.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
          <FileText className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-100">
            Registrar Documento
          </h2>
          <p className="text-sm text-zinc-500">
            Complete los datos del comprobante de pago
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Datos generales */}
          <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Datos del Documento
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Tipo de documento */}
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">
                      Tipo de Documento
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-zinc-100">
                          <SelectValue placeholder="Seleccione tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="factura">Factura</SelectItem>
                        <SelectItem value="boleta">Boleta de Venta</SelectItem>
                        <SelectItem value="nota_credito">
                          Nota de Credito
                        </SelectItem>
                        <SelectItem value="nota_debito">
                          Nota de Debito
                        </SelectItem>
                        <SelectItem value="recibo_honorarios">
                          Recibo por Honorarios
                        </SelectItem>
                        <SelectItem value="ticket">Ticket</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tipo de operacion */}
              <FormField
                control={form.control}
                name="tipo_operacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">
                      Tipo de Operacion
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-zinc-100">
                          <SelectValue placeholder="Seleccione operacion" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="compra">Compra</SelectItem>
                        <SelectItem value="venta">Venta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Serie */}
              <FormField
                control={form.control}
                name="serie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Serie</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        maxLength={10}
                        placeholder="F001"
                        className="bg-zinc-900 border-zinc-800 text-zinc-100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Numero */}
              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Numero</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        maxLength={20}
                        placeholder="00000001"
                        className="bg-zinc-900 border-zinc-800 text-zinc-100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fecha emision */}
              <FormField
                control={form.control}
                name="fecha_emision"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">
                      Fecha de Emision
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        className="bg-zinc-900 border-zinc-800 text-zinc-100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fecha vencimiento */}
              <FormField
                control={form.control}
                name="fecha_vencimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">
                      Fecha de Vencimiento
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        className="bg-zinc-900 border-zinc-800 text-zinc-100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* Datos del tercero */}
          <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Datos del Tercero
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* RUC / DNI */}
              <FormField
                control={form.control}
                name="ruc_dni_tercero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">RUC / DNI</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          {...field}
                          maxLength={11}
                          placeholder="20123456789"
                          className="bg-zinc-900 border-zinc-800 text-zinc-100"
                          onKeyDown={(e) => {
                            if (
                              !/[0-9]/.test(e.key) &&
                              e.key !== 'Backspace' &&
                              e.key !== 'Delete' &&
                              e.key !== 'Tab' &&
                              e.key !== 'ArrowLeft' &&
                              e.key !== 'ArrowRight' &&
                              !e.ctrlKey &&
                              !e.metaKey
                            ) {
                              e.preventDefault()
                            }
                          }}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0 border-zinc-700 text-zinc-400 hover:text-emerald-400 hover:border-emerald-700"
                        onClick={handleValidarRuc}
                        disabled={validatingRuc}
                        title="Validar RUC"
                      >
                        {validatingRuc ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nombre tercero */}
              <FormField
                control={form.control}
                name="nombre_tercero"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-zinc-300">
                      Razon Social / Nombre
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Nombre o razon social del tercero"
                        className="bg-zinc-900 border-zinc-800 text-zinc-100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Moneda */}
              <FormField
                control={form.control}
                name="moneda"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Moneda</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-zinc-100">
                          <SelectValue placeholder="Seleccione moneda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="PEN">PEN - Soles</SelectItem>
                        <SelectItem value="USD">USD - Dolares</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tipo de cambio (solo si USD) */}
              {watchMoneda === 'USD' && (
                <FormField
                  control={form.control}
                  name="tipo_cambio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">
                        Tipo de Cambio
                        {fetchingTipoCambio && (
                          <Loader2 className="ml-1 inline h-3 w-3 animate-spin text-emerald-400" />
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.001"
                          min="0"
                          placeholder="3.750"
                          className="bg-zinc-900 border-zinc-800 text-zinc-100"
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </section>

          {/* Detalle de items */}
          <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Detalle de Items
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-emerald-800 text-emerald-400 hover:bg-emerald-950 hover:text-emerald-300"
                onClick={() =>
                  append({ descripcion: '', cantidad: 1, precio_unitario: 0 })
                }
              >
                <Plus className="h-4 w-4" />
                Agregar Item
              </Button>
            </div>

            {/* Header de la tabla */}
            <div className="mb-2 hidden grid-cols-12 gap-2 px-1 text-xs font-medium uppercase tracking-wider text-zinc-500 lg:grid">
              <div className="col-span-4">Descripcion</div>
              <div className="col-span-1 text-right">Cant.</div>
              <div className="col-span-2 text-right">P. Unitario</div>
              <div className="col-span-1 text-right">Subtotal</div>
              <div className="col-span-1 text-right">IGV (18%)</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-1" />
            </div>

            <div className="space-y-3">
              {fields.map((fieldItem, index) => {
                const cantidad = watchDetalles[index]?.cantidad || 0
                const precio = watchDetalles[index]?.precio_unitario || 0
                const itemSubtotal = calcItemSubtotal(cantidad, precio)
                const itemIgv = calcItemIgv(cantidad, precio)
                const itemTotal = calcItemTotal(cantidad, precio)

                return (
                  <div
                    key={fieldItem.id}
                    className="grid grid-cols-1 items-start gap-2 rounded-md border border-zinc-800 p-3 lg:grid-cols-12 lg:border-0 lg:p-0"
                  >
                    {/* Descripcion */}
                    <div className="lg:col-span-4">
                      <FormField
                        control={form.control}
                        name={`detalles.${index}.descripcion`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-400 lg:hidden">
                              Descripcion
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Descripcion del producto o servicio"
                                className="bg-zinc-900 border-zinc-800 text-zinc-100"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Cantidad */}
                    <div className="lg:col-span-1">
                      <FormField
                        control={form.control}
                        name={`detalles.${index}.cantidad`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-400 lg:hidden">
                              Cantidad
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                step="0.01"
                                min="0.01"
                                className="bg-zinc-900 border-zinc-800 text-right text-zinc-100"
                                onChange={(e) =>
                                  field.onChange(
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Precio unitario */}
                    <div className="lg:col-span-2">
                      <FormField
                        control={form.control}
                        name={`detalles.${index}.precio_unitario`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-400 lg:hidden">
                              Precio Unitario
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                step="0.01"
                                min="0"
                                className="bg-zinc-900 border-zinc-800 text-right text-zinc-100"
                                onChange={(e) =>
                                  field.onChange(
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Subtotal (readonly) */}
                    <div className="flex items-center justify-between lg:col-span-1 lg:justify-end">
                      <span className="text-xs text-zinc-500 lg:hidden">
                        Subtotal:
                      </span>
                      <span className="mt-2 text-sm text-zinc-300">
                        {formatCurrency(
                          itemSubtotal,
                          watchMoneda as 'PEN' | 'USD'
                        )}
                      </span>
                    </div>

                    {/* IGV (readonly) */}
                    <div className="flex items-center justify-between lg:col-span-1 lg:justify-end">
                      <span className="text-xs text-zinc-500 lg:hidden">
                        IGV:
                      </span>
                      <span className="mt-2 text-sm text-zinc-400">
                        {formatCurrency(
                          itemIgv,
                          watchMoneda as 'PEN' | 'USD'
                        )}
                      </span>
                    </div>

                    {/* Total (readonly) */}
                    <div className="flex items-center justify-between lg:col-span-2 lg:justify-end">
                      <span className="text-xs text-zinc-500 lg:hidden">
                        Total:
                      </span>
                      <span className="mt-2 text-sm font-medium text-emerald-400">
                        {formatCurrency(
                          itemTotal,
                          watchMoneda as 'PEN' | 'USD'
                        )}
                      </span>
                    </div>

                    {/* Eliminar */}
                    <div className="flex items-center justify-end lg:col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="mt-1 text-zinc-500 hover:text-red-400"
                        disabled={fields.length <= 1}
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            {form.formState.errors.detalles?.root && (
              <p className="mt-2 text-sm text-red-500">
                {form.formState.errors.detalles.root.message}
              </p>
            )}
          </section>

          {/* Totales */}
          <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-4 w-4 text-zinc-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Resumen de Totales
              </h3>
            </div>

            <div className="flex flex-col items-end space-y-2">
              <div className="flex w-full max-w-xs items-center justify-between">
                <span className="text-sm text-zinc-400">Subtotal:</span>
                <span className="text-sm font-medium text-zinc-200">
                  {formatCurrency(
                    subtotalGeneral,
                    watchMoneda as 'PEN' | 'USD'
                  )}
                </span>
              </div>
              <div className="flex w-full max-w-xs items-center justify-between">
                <span className="text-sm text-zinc-400">IGV (18%):</span>
                <span className="text-sm font-medium text-zinc-200">
                  {formatCurrency(igvGeneral, watchMoneda as 'PEN' | 'USD')}
                </span>
              </div>
              <div className="w-full max-w-xs border-t border-zinc-700 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-zinc-200">
                    Total:
                  </span>
                  <span className="text-lg font-bold text-emerald-400">
                    {formatCurrency(
                      totalGeneral,
                      watchMoneda as 'PEN' | 'USD'
                    )}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Notas */}
          <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Notas Adicionales
            </h3>

            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Observaciones o notas adicionales (opcional)"
                      className="bg-zinc-900 border-zinc-800 text-zinc-100 resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* Boton de envio */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              onClick={() => router.push('/documentos')}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar Documento
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
