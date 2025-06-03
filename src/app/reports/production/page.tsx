'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import type { Appointment, Service, Profile } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function ProductionReportPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [professionals, setProfessionals] = useState<Profile[]>([])
  const [filters, setFilters] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    professional: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    const [{ data: appts }, { data: servs }, { data: profs }] = await Promise.all([
      supabase.from('appointments').select('*').order('start_time', { ascending: false }),
      supabase.from('services').select('id, name, description, duration, price, created_at, updated_at'),
      supabase.from('profiles').select('id, full_name, avatar_url, role, created_at, updated_at').order('full_name'),
    ])
    if (appts) setAppointments(appts)
    if (servs) setServices(servs)
    if (profs) setProfessionals(profs.filter((p) => p.role === 'dentist' || p.role === 'assistant'))
    setIsLoading(false)
  }

  const filtered = appointments.filter((a) => {
    const d = new Date(a.start_time)
    const { startDate, endDate, professional } = filters
    return (
      (!startDate || d >= startDate) &&
      (!endDate || d <= endDate) &&
      (!professional || a.created_by === professional)
    )
  })

  // Gráfico de atendimentos por serviço
  const atendimentosPorServico = services.map((s) => ({
    name: s.name,
    total: filtered.filter((a) => a.service_id === s.id && a.status === 'completed').length,
  })).filter((s) => s.total > 0)

  // Gráfico de produtividade por profissional
  const produtividadePorProfissional = professionals.map((p) => ({
    name: p.full_name,
    total: filtered.filter((a) => a.created_by === p.id && a.status === 'completed').length,
  })).filter((p) => p.total > 0)

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-4">Relatório de Produção</h1>
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
            <CardTitle>Atendimentos por Serviço</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={atendimentosPorServico} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#2563eb" name="Atendimentos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Produtividade por Profissional</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={produtividadePorProfissional} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#22c55e" name="Atendimentos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atendimentos Detalhados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum atendimento encontrado para o período/critério selecionado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-1 text-left">Data</th>
                    <th className="px-2 py-1 text-left">Serviço</th>
                    <th className="px-2 py-1 text-left">Profissional</th>
                    <th className="px-2 py-1 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id} className="border-b hover:bg-muted/50">
                      <td className="px-2 py-1">{new Date(a.start_time).toLocaleDateString('pt-BR')}</td>
                      <td className="px-2 py-1">{services.find((s) => s.id === a.service_id)?.name || '-'}</td>
                      <td className="px-2 py-1">{professionals.find((p) => p.id === a.created_by)?.full_name || '-'}</td>
                      <td className="px-2 py-1">{a.status === 'scheduled' ? 'Agendada' : a.status === 'completed' ? 'Concluída' : 'Cancelada'}</td>
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