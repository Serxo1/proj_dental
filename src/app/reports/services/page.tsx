'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import type { Appointment, Service, Profile, Patient } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'

const serviceColors = ['#2563eb', '#22c55e', '#fbbf24', '#ef4444', '#a3a3a3']

export default function ServicesReportPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [professionals, setProfessionals] = useState<Profile[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [filters, setFilters] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    service: '',
    professional: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    const [{ data: appts }, { data: servs }, { data: profs }, { data: pats }] = await Promise.all([
      supabase.from('appointments').select('*').order('start_time', { ascending: false }),
      supabase.from('services').select('id, name, price, description, duration, created_at, updated_at'),
      supabase.from('profiles').select('id, full_name, avatar_url, role, created_at, updated_at').order('full_name'),
      supabase.from('patients').select('id, name, email, phone, birth_date, address, notes, created_at, updated_at'),
    ])
    if (appts) setAppointments(appts)
    if (servs) setServices(servs)
    if (profs) setProfessionals(profs.filter((p) => p.role === 'dentist' || p.role === 'assistant'))
    if (pats) setPatients(pats)
    setIsLoading(false)
  }

  const filtered = appointments.filter((a) => {
    const d = new Date(a.start_time)
    const { startDate, endDate, service, professional } = filters
    return (
      (!startDate || d >= startDate) &&
      (!endDate || d <= endDate) &&
      (!service || a.service_id === service) &&
      (!professional || a.created_by === professional) &&
      a.status === 'completed'
    )
  })

  // Gráfico: Procedimentos mais realizados
  const realizadosData = services.map((s) => ({
    name: s.name,
    total: filtered.filter((a) => a.service_id === s.id).length,
  })).filter((s) => s.total > 0)

  // Gráfico: Faturamento por serviço
  const faturamentoData = services.map((s) => ({
    name: s.name,
    value: filtered.filter((a) => a.service_id === s.id).reduce((acc, a) => acc + (s.price || 0), 0),
  })).filter((s) => s.value > 0)

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-4">Relatório de Serviços/Procedimentos</h1>
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-medium mb-1">Período</label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      {filters.startDate ? filters.startDate.toLocaleDateString('pt-BR') : 'Início'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="p-0">
                    <Calendar
                      mode="single"
                      selected={filters.startDate}
                      onSelect={(date) => setFilters((f) => ({ ...f, startDate: date || undefined }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      {filters.endDate ? filters.endDate.toLocaleDateString('pt-BR') : 'Fim'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="p-0">
                    <Calendar
                      mode="single"
                      selected={filters.endDate}
                      onSelect={(date) => setFilters((f) => ({ ...f, endDate: date || undefined }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Serviço</label>
              <Select value={filters.service} onValueChange={(v) => setFilters((f) => ({ ...f, service: v }))}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Profissional</label>
              <Select value={filters.professional} onValueChange={(v) => setFilters((f) => ({ ...f, professional: v }))}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {professionals.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Procedimentos Mais Realizados</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={realizadosData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#2563eb" name="Realizados" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Faturamento por Serviço</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={faturamentoData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {faturamentoData.map((entry, idx) => (
                    <Cell key={`cell-service-${idx}`} fill={serviceColors[idx % serviceColors.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip formatter={(v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Procedimentos Detalhados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum procedimento encontrado para o critério selecionado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-1 text-left">Data</th>
                    <th className="px-2 py-1 text-left">Paciente</th>
                    <th className="px-2 py-1 text-left">Serviço</th>
                    <th className="px-2 py-1 text-left">Profissional</th>
                    <th className="px-2 py-1 text-left">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id} className="border-b hover:bg-muted/50">
                      <td className="px-2 py-1">{new Date(a.start_time).toLocaleDateString('pt-BR')}</td>
                      <td className="px-2 py-1">{patients.find((p) => p.id === a.patient_id)?.name || '-'}</td>
                      <td className="px-2 py-1">{services.find((s) => s.id === a.service_id)?.name || '-'}</td>
                      <td className="px-2 py-1">{professionals.find((p) => p.id === a.created_by)?.full_name || '-'}</td>
                      <td className="px-2 py-1">{services.find((s) => s.id === a.service_id)?.price?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 