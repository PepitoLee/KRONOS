'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, MessageSquare, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'

const reclamoDetalladoSchema = z.object({
  cliente_nombre: z.string().min(1, 'Nombre del cliente es requerido'),
  cliente_ruc_dni: z.string().min(8, 'RUC/DNI debe tener al menos 8 caracteres').max(11, 'RUC/DNI no debe exceder 11 caracteres'),
  cliente_telefono: z.string().min(6, 'Teléfono es requerido'),
  cliente_email: z.string().email('Email inválido').or(z.literal('')).optional(),
  tipo: z.enum(['producto', 'servicio', 'entrega', 'facturacion']),
  motivo: z.string().min(1, 'Motivo es requerido'),
  descripcion: z.string().min(10, 'Descripción debe tener al menos 10 caracteres'),
  prioridad: z.enum(['alta', 'media', 'baja']),
  producto_servicio: z.string().optional(),
  acciones_inmediatas: z.string().optional(),
})

type ReclamoDetalladoForm = z.infer<typeof reclamoDetalladoSchema>

export default function NuevoReclamoPage() {
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ReclamoDetalladoForm>({
    resolver: zodResolver(reclamoDetalladoSchema),
    defaultValues: {
      prioridad: 'media',
      tipo: 'producto',
      cliente_email: '',
      producto_servicio: '',
      acciones_inmediatas: '',
    },
  })

  async function onSubmit(data: ReclamoDetalladoForm) {
    setSaving(true)
    try {
      const numero = `REC-${Date.now().toString().slice(-8)}`
      const { error } = await supabase.from('reclamos').insert({
        numero,
        fecha: new Date().toISOString(),
        cliente: data.cliente_nombre,
        cliente_ruc_dni: data.cliente_ruc_dni,
        cliente_telefono: data.cliente_telefono,
        cliente_email: data.cliente_email || null,
        tipo: data.tipo,
        motivo: data.motivo,
        descripcion: data.descripcion,
        prioridad: data.prioridad,
        producto_servicio: data.producto_servicio || null,
        acciones_inmediatas: data.acciones_inmediatas || null,
        estado: 'pendiente',
      })

      if (error) throw error

      toast.success('Reclamo registrado correctamente')
      router.push('/reclamos')
    } catch (error) {
      console.error('Error saving reclamo:', error)
      toast.error('Error al registrar el reclamo')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/reclamos">
          <Button variant="outline" size="icon" className="border-zinc-700 text-zinc-400 hover:bg-zinc-800">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <MessageSquare className="h-7 w-7 text-amber-400" />
            Nuevo Reclamo
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Registra un reclamo detallado con datos del cliente y acciones inmediatas
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">
        {/* Datos del Cliente */}
        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6 space-y-4">
          <h3 className="text-lg font-semibold text-zinc-100 border-b border-zinc-800 pb-3">
            Datos del Cliente
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">Nombre / Razón Social *</Label>
              <Input
                {...register('cliente_nombre')}
                placeholder="Nombre del cliente"
                className="bg-zinc-900 border-zinc-700 text-zinc-300 placeholder:text-zinc-600"
              />
              {errors.cliente_nombre && (
                <p className="text-xs text-red-400">{errors.cliente_nombre.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">RUC / DNI *</Label>
              <Input
                {...register('cliente_ruc_dni')}
                placeholder="RUC o DNI"
                className="bg-zinc-900 border-zinc-700 text-zinc-300 placeholder:text-zinc-600 font-mono"
              />
              {errors.cliente_ruc_dni && (
                <p className="text-xs text-red-400">{errors.cliente_ruc_dni.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Teléfono *</Label>
              <Input
                {...register('cliente_telefono')}
                placeholder="Número de teléfono"
                className="bg-zinc-900 border-zinc-700 text-zinc-300 placeholder:text-zinc-600 font-mono"
              />
              {errors.cliente_telefono && (
                <p className="text-xs text-red-400">{errors.cliente_telefono.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Email</Label>
              <Input
                {...register('cliente_email')}
                type="email"
                placeholder="correo@ejemplo.com"
                className="bg-zinc-900 border-zinc-700 text-zinc-300 placeholder:text-zinc-600"
              />
              {errors.cliente_email && (
                <p className="text-xs text-red-400">{errors.cliente_email.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Datos del Reclamo */}
        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6 space-y-4">
          <h3 className="text-lg font-semibold text-zinc-100 border-b border-zinc-800 pb-3">
            Datos del Reclamo
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">Tipo de Reclamo *</Label>
              <Select
                defaultValue="producto"
                onValueChange={(val) => setValue('tipo', val as ReclamoDetalladoForm['tipo'])}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="producto">Producto</SelectItem>
                  <SelectItem value="servicio">Servicio</SelectItem>
                  <SelectItem value="entrega">Entrega</SelectItem>
                  <SelectItem value="facturacion">Facturación</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Prioridad *</Label>
              <Select
                defaultValue="media"
                onValueChange={(val) => setValue('prioridad', val as ReclamoDetalladoForm['prioridad'])}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Producto / Servicio Relacionado</Label>
            <Input
              {...register('producto_servicio')}
              placeholder="Nombre del producto o servicio"
              className="bg-zinc-900 border-zinc-700 text-zinc-300 placeholder:text-zinc-600"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Motivo *</Label>
            <Input
              {...register('motivo')}
              placeholder="Motivo principal del reclamo"
              className="bg-zinc-900 border-zinc-700 text-zinc-300 placeholder:text-zinc-600"
            />
            {errors.motivo && (
              <p className="text-xs text-red-400">{errors.motivo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Descripción Detallada *</Label>
            <Textarea
              {...register('descripcion')}
              placeholder="Describa en detalle el reclamo del cliente, incluyendo circunstancias, fechas relevantes y expectativas..."
              rows={5}
              className="bg-zinc-900 border-zinc-700 text-zinc-300 placeholder:text-zinc-600"
            />
            {errors.descripcion && (
              <p className="text-xs text-red-400">{errors.descripcion.message}</p>
            )}
          </div>
        </div>

        {/* Acciones Inmediatas */}
        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6 space-y-4">
          <h3 className="text-lg font-semibold text-zinc-100 border-b border-zinc-800 pb-3">
            Acciones Inmediatas
          </h3>

          <div className="space-y-2">
            <Label className="text-zinc-300">Acciones tomadas o por tomar</Label>
            <Textarea
              {...register('acciones_inmediatas')}
              placeholder="Describa las acciones inmediatas que se tomaron o se planean tomar para atender el reclamo..."
              rows={4}
              className="bg-zinc-900 border-zinc-700 text-zinc-300 placeholder:text-zinc-600"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <Link href="/reclamos">
            <Button type="button" variant="outline" className="border-zinc-700 text-zinc-300">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="bg-amber-600 text-white hover:bg-amber-700"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar Reclamo
          </Button>
        </div>
      </form>
    </div>
  )
}
