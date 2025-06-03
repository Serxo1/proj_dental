'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import type { Patient } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'

const sexColors = ['#2563eb', '#ef4444', '#a3a3a3']
const ageColors = ['#22c55e', '#fbbf24', '#f87171', '#a3a3a3']

function getAge(birth: string) {
  const diff = Date.now() - new Date(birth).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

function getAgeGroup(age: number) {
  if (age < 13) return 'Criança'
  if (age < 20) return 'Adolescente'
  if (age < 60) return 'Adulto'
  return 'Idoso'
}

export default function PatientsReportPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [filters, setFilters] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    sex: '',
    ageGroup: '',
    status: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadPatients()
  }, [])

  async function loadPatients() {
    setIsLoading(true)
    const { data } = await supabase.from('patients').select('*').order('created_at', { ascending: false })
    if (data) setPatients(data)
    setIsLoading(false)
  }

  const filtered = patients.filter((p) => {
    const createdAt = new Date(p.created_at)
    const age = getAge(p.birth_date)
    const group = getAgeGroup(age)
    const { startDate, endDate, sex, ageGroup, status } = filters
    return (
      (!startDate || createdAt >= startDate) &&
      (!endDate || createdAt <= endDate) &&
      (!sex || (p as any).sex === sex) &&
      (!ageGroup || group === ageGroup) &&
      (!status || (p as any).status === status)
    )
  })

  // Novos pacientes por mês
  const pacientesPorMes: { mes: string; total: number; date: Date }[] = []
  const porMes: { [mes: string]: { value: number; date: Date } } = {}
  filtered.forEach((p) => {
    const d = new Date(p.created_at)
    const mes = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' })
    if (!porMes[mes]) porMes[mes] = { value: 0, date: new Date(d.getFullYear(), d.getMonth(), 1) }
    porMes[mes].value++
  })
  const meses = Object.keys(porMes)
    .map((mes) => ({ mes, date: porMes[mes].date }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((m) => m.mes)
  meses.forEach((mes) => {
    pacientesPorMes.push({ mes, total: porMes[mes].value, date: porMes[mes].date })
  })

  // Distribuição por sexo
  const sexData = [
    { name: 'Masculino', value: filtered.filter((p) => (p as any).sex === 'M').length },
    { name: 'Feminino', value: filtered.filter((p) => (p as any).sex === 'F').length },
    { name: 'Outro', value: filtered.filter((p) => (p as any).sex !== 'M' && (p as any).sex !== 'F').length },
  ]

  // Distribuição por faixa etária
  const ageData = [
    { name: 'Criança', value: filtered.filter((p) => getAge(p.birth_date) < 13).length },
    { name: 'Adolescente', value: filtered.filter((p) => getAge(p.birth_date) >= 13 && getAge(p.birth_date) < 20).length },
    { name: 'Adulto', value: filtered.filter((p) => getAge(p.birth_date) >= 20 && getAge(p.birth_date) < 60).length },
    { name: 'Idoso', value: filtered.filter((p) => getAge(p.birth_date) >= 60).length },
  ]

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-4">Relatório de Pacientes</h1>
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-medium mb-1">Período de Cadastro</label>
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
              <label className="block text-xs font-medium mb-1">Sexo</label>
              <Select value={filters.sex} onValueChange={(v) => setFilters((f) => ({ ...f, sex: v }))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Feminino</SelectItem>
                  <SelectItem value="O">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Faixa Etária</label>
              <Select value={filters.ageGroup} onValueChange={(v) => setFilters((f) => ({ ...f, ageGroup: v }))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="Criança">Criança</SelectItem>
                  <SelectItem value="Adolescente">Adolescente</SelectItem>
                  <SelectItem value="Adulto">Adulto</SelectItem>
                  <SelectItem value="Idoso">Idoso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Status</label>
              <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Novos Pacientes por Mês</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pacientesPorMes} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <XAxis dataKey="mes" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#2563eb" name="Pacientes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Sexo</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sexData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {sexData.map((entry, idx) => (
                    <Cell key={`cell-sex-${idx}`} fill={sexColors[idx % sexColors.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Faixa Etária</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ageData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {ageData.map((entry, idx) => (
                    <Cell key={`cell-age-${idx}`} fill={ageColors[idx % ageColors.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pacientes Detalhados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum paciente encontrado para o critério selecionado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-1 text-left">Nome</th>
                    <th className="px-2 py-1 text-left">Data Cadastro</th>
                    <th className="px-2 py-1 text-left">Sexo</th>
                    <th className="px-2 py-1 text-left">Idade</th>
                    <th className="px-2 py-1 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const age = getAge(p.birth_date)
                    return (
                      <tr key={p.id} className="border-b hover:bg-muted/50">
                        <td className="px-2 py-1">{p.name}</td>
                        <td className="px-2 py-1">{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="px-2 py-1">{(p as any).sex === 'M' ? 'Masculino' : (p as any).sex === 'F' ? 'Feminino' : 'Outro'}</td>
                        <td className="px-2 py-1">{age}</td>
                        <td className="px-2 py-1">{(p as any).status === 'active' ? 'Ativo' : 'Inativo'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 