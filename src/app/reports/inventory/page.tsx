'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import type { Inventory, InventoryHistory } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

const statusColors = ['#ef4444', '#22c55e']
const catColors = ['#2563eb', '#fbbf24', '#a3a3a3', '#f87171', '#22c55e']

export default function InventoryReportPage() {
  const [items, setItems] = useState<Inventory[]>([])
  const [history, setHistory] = useState<InventoryHistory[]>([])
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    const [{ data: inv }, { data: hist }] = await Promise.all([
      supabase.from('inventory').select('*').order('name'),
      supabase.from('inventory_history').select('*').order('created_at', { ascending: false }),
    ])
    if (inv) setItems(inv)
    if (hist) setHistory(hist)
    setIsLoading(false)
  }

  // Filtros
  const filtered = items.filter((item) => {
    const { category, status } = filters
    const isLow = item.quantity <= item.min_quantity
    return (
      (!category || (item as any).category === category) &&
      (!status || (status === 'low' ? isLow : !isLow))
    )
  })

  // Gráfico: Itens com baixo estoque
  const lowStock = items.filter((item) => item.quantity <= item.min_quantity)
  const lowStockData = lowStock.map((item) => ({ name: item.name, value: item.quantity }))

  // Gráfico: Distribuição por categoria
  const categories = Array.from(new Set(items.map((i) => (i as any).category || 'Sem Categoria')))
  const catData = categories.map((cat) => ({
    name: cat,
    value: items.filter((i) => ((i as any).category || 'Sem Categoria') === cat).length,
  }))

  // Gráfico: Evolução de movimentação
  const movPorMes: { mes: string; total: number; date: Date }[] = []
  const porMes: { [mes: string]: { value: number; date: Date } } = {}
  history.forEach((h) => {
    const d = new Date(h.created_at)
    const mes = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' })
    if (!porMes[mes]) porMes[mes] = { value: 0, date: new Date(d.getFullYear(), d.getMonth(), 1) }
    porMes[mes].value++
  })
  const meses = Object.keys(porMes)
    .map((mes) => ({ mes, date: porMes[mes].date }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((m) => m.mes)
  meses.forEach((mes) => {
    movPorMes.push({ mes, total: porMes[mes].value, date: porMes[mes].date })
  })

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-4">Relatório de Estoque</h1>
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-medium mb-1">Categoria</label>
              <Select value={filters.category} onValueChange={(v) => setFilters((f) => ({ ...f, category: v }))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
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
                  <SelectItem value="low">Baixo Estoque</SelectItem>
                  <SelectItem value="ok">Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Período de Movimentação</label>
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
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Itens com Baixo Estoque</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lowStockData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#ef4444" name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={catData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {catData.map((entry, idx) => (
                    <Cell key={`cell-cat-${idx}`} fill={catColors[idx % catColors.length]} />
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
            <CardTitle>Evolução de Movimentação</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={movPorMes} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <XAxis dataKey="mes" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="Movimentações" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Itens Detalhados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum item encontrado para o critério selecionado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-1 text-left">Nome</th>
                    <th className="px-2 py-1 text-left">Quantidade</th>
                    <th className="px-2 py-1 text-left">Mínimo</th>
                    <th className="px-2 py-1 text-left">Status</th>
                    <th className="px-2 py-1 text-left">Última Movimentação</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const lastMove = history.find((h) => h.item_id === item.id)
                    const isLow = item.quantity <= item.min_quantity
                    return (
                      <tr key={item.id} className="border-b hover:bg-muted/50">
                        <td className="px-2 py-1">{item.name}</td>
                        <td className="px-2 py-1">{item.quantity}</td>
                        <td className="px-2 py-1">{item.min_quantity}</td>
                        <td className="px-2 py-1">{isLow ? 'Baixo Estoque' : 'Normal'}</td>
                        <td className="px-2 py-1">{lastMove ? new Date(lastMove.created_at).toLocaleDateString('pt-BR') : '-'}</td>
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