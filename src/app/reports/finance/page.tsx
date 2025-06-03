'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import type { Transaction } from '@/lib/supabase'
import { saveAs } from 'file-saver'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

const donutColors = ['#22c55e', '#ef4444']

export default function FinanceReportPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    type: '',
    status: '',
    payment_method: '',
  })

  useEffect(() => {
    loadTransactions()
  }, [])

  async function loadTransactions() {
    setIsLoading(true)
    const { data } = await supabase.from('transactions').select('*').order('created_at', { ascending: false })
    if (data) setTransactions(data)
    setIsLoading(false)
  }

  const filtered = transactions.filter((t) => {
    const createdAt = new Date(t.created_at)
    const { startDate, endDate, type, status, payment_method } = filters
    return (
      (!startDate || createdAt >= startDate) &&
      (!endDate || createdAt <= endDate) &&
      (!type || t.type === type) &&
      (!status || t.status === status) &&
      (!payment_method || t.payment_method === payment_method)
    )
  })

  // Gráficos
  const saldoPorMes: { mes: string; saldo: number; date: Date }[] = []
  const receitasPorMes: { [mes: string]: { value: number; date: Date } } = {}
  const despesasPorMes: { [mes: string]: { value: number; date: Date } } = {}
  filtered.forEach((t) => {
    const d = new Date(t.created_at)
    const mes = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' })
    if (!receitasPorMes[mes]) receitasPorMes[mes] = { value: 0, date: new Date(d.getFullYear(), d.getMonth(), 1) }
    if (!despesasPorMes[mes]) despesasPorMes[mes] = { value: 0, date: new Date(d.getFullYear(), d.getMonth(), 1) }
    if (t.type === 'income' && t.status === 'completed') receitasPorMes[mes].value += t.amount
    if (t.type === 'expense' && t.status === 'completed') despesasPorMes[mes].value += t.amount
  })
  const meses = Array.from(new Set([...Object.keys(receitasPorMes), ...Object.keys(despesasPorMes)]))
    .map((mes) => ({
      mes,
      date: receitasPorMes[mes]?.date || despesasPorMes[mes]?.date,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((m) => m.mes)
  let saldoAcumulado = 0
  meses.forEach((mes) => {
    saldoAcumulado += (receitasPorMes[mes]?.value || 0) - (despesasPorMes[mes]?.value || 0)
    saldoPorMes.push({ mes, saldo: saldoAcumulado, date: receitasPorMes[mes]?.date || despesasPorMes[mes]?.date })
  })
  const totalIncome = filtered.filter((t) => t.type === 'income' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0)
  const totalExpense = filtered.filter((t) => t.type === 'expense' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0)
  const donutData = [
    { name: 'Receitas', value: totalIncome },
    { name: 'Despesas', value: totalExpense },
  ]

  function exportToCSV() {
    const header = [
      'ID', 'Valor', 'Tipo', 'Status', 'Método', 'Data', 'Observações',
    ]
    const rows = filtered.map((t) => [
      t.id,
      t.amount,
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.status,
      t.payment_method,
      new Date(t.created_at).toLocaleDateString('pt-BR'),
      t.notes || '',
    ])
    const csvContent = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, `relatorio_financeiro_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-4">Relatório Financeiro</h1>
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
              <label className="block text-xs font-medium mb-1">Tipo</label>
              <Select value={filters.type} onValueChange={(v) => setFilters((f) => ({ ...f, type: v }))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
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
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Método</label>
              <Select value={filters.payment_method} onValueChange={(v) => setFilters((f) => ({ ...f, payment_method: v }))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="transfer">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={exportToCSV} disabled={filtered.length === 0}>
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolução do Saldo</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={saldoPorMes} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                <Line type="monotone" dataKey="saldo" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Receitas vs Despesas</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {donutData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={donutColors[idx % donutColors.length]} />
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
          <CardTitle>Transações Detalhadas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma transação encontrada para o período/critério selecionado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-1 text-left">Data</th>
                    <th className="px-2 py-1 text-left">Tipo</th>
                    <th className="px-2 py-1 text-left">Valor</th>
                    <th className="px-2 py-1 text-left">Status</th>
                    <th className="px-2 py-1 text-left">Método</th>
                    <th className="px-2 py-1 text-left">Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} className="border-b hover:bg-muted/50">
                      <td className="px-2 py-1">{new Date(t.created_at).toLocaleDateString('pt-BR')}</td>
                      <td className="px-2 py-1">{t.type === 'income' ? 'Receita' : 'Despesa'}</td>
                      <td className="px-2 py-1">{t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      <td className="px-2 py-1">{t.status === 'pending' ? 'Pendente' : t.status === 'completed' ? 'Concluído' : 'Cancelado'}</td>
                      <td className="px-2 py-1">{
                        t.payment_method === 'cash' ? 'Dinheiro' :
                        t.payment_method === 'credit_card' ? 'Cartão de Crédito' :
                        t.payment_method === 'debit_card' ? 'Cartão de Débito' :
                        t.payment_method === 'pix' ? 'PIX' :
                        'Transferência'
                      }</td>
                      <td className="px-2 py-1">{t.notes}</td>
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