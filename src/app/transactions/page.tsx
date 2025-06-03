'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Search, MoreVertical } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { supabase } from '@/lib/supabase'
import type { Transaction, Patient, Service } from '@/lib/supabase'
import { saveAs } from 'file-saver'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type PatientOption = { id: string; name: string }

function exportToCSV(transactions: Transaction[]) {
  const header = [
    'ID',
    'Paciente',
    'Serviço',
    'Valor',
    'Tipo',
    'Status',
    'Método',
    'Data',
    'Observações',
  ]
  const rows = transactions.map((t) => [
    t.id,
    (t.patients as any)?.name || '',
    (t.services as any)?.name || '',
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
  saveAs(blob, `transacoes_${new Date().toISOString().slice(0, 10)}.csv`)
}

export default function TransactionsPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [patients, setPatients] = useState<PatientOption[]>([])
  const [filters, setFilters] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    type: '',
    status: '',
    payment_method: '',
    patient_id: '',
  })
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadTransactions()
    loadPatients()
  }, [])

  async function loadTransactions() {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('transactions')
        .select(`*, patients(name), services(name)`)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setTransactions(data)
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadPatients() {
    const { data } = await supabase.from('patients').select('id, name').order('name')
    if (data) setPatients(data)
  }

  // Filtros e busca
  const filteredTransactions = transactions.filter((transaction) => {
    const patientName = (transaction.patients as Patient)?.name || ''
    const serviceName = (transaction.services as Service)?.name || ''
    const createdAt = new Date(transaction.created_at)
    const { startDate, endDate, type, status, payment_method, patient_id } = filters
    return (
      (searchQuery === '' ||
        patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        serviceName.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (!startDate || createdAt >= startDate) &&
      (!endDate || createdAt <= endDate) &&
      (!type || transaction.type === type) &&
      (!status || transaction.status === status) &&
      (!payment_method || transaction.payment_method === payment_method) &&
      (!patient_id || transaction.patient_id === patient_id)
    )
  })

  // Paginação
  const [page, setPage] = useState(1)
  const itemsPerPage = 10
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = filteredTransactions.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  // Resumo financeiro
  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income' && t.status === 'completed')
    .reduce((acc, t) => acc + t.amount, 0)
  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'expense' && t.status === 'completed')
    .reduce((acc, t) => acc + t.amount, 0)

  // Dados para o gráfico de linhas (saldo por mês)
  const saldoPorMes: { mes: string; saldo: number; date: Date }[] = []
  const receitasPorMes: { [mes: string]: { value: number; date: Date } } = {}
  const despesasPorMes: { [mes: string]: { value: number; date: Date } } = {}
  filteredTransactions.forEach((t) => {
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

  // Dados para o gráfico de donut
  const donutData = [
    { name: 'Receitas', value: totalIncome },
    { name: 'Despesas', value: totalExpense },
  ]
  const donutColors = ['#22c55e', '#ef4444']

  async function handleDeleteTransaction() {
    if (!transactionToDelete) return
    setIsDeleting(true)
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', transactionToDelete.id)
      if (error) throw error
      setDeleteDialogOpen(false)
      setTransactionToDelete(null)
      loadTransactions()
    } catch (error) {
      console.error('Erro ao excluir transação:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleMarkAsPaid(transaction: Transaction) {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transaction.id)
      if (error) throw error
      loadTransactions()
    } catch (error) {
      console.error('Erro ao marcar como pago:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">
            Controle de receitas, despesas e pagamentos
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nova Transação</DialogTitle>
              <DialogDescription>
                Preencha os dados para registrar uma nova transação
              </DialogDescription>
            </DialogHeader>
            <TransactionForm onSuccess={loadTransactions} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros avançados */}
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
            <div>
              <label className="block text-xs font-medium mb-1">Paciente</label>
              <Select value={filters.patient_id} onValueChange={(v) => setFilters((f) => ({ ...f, patient_id: v }))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
          <CardDescription>
            <span className="text-green-600 font-semibold">
              Receitas: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)}
            </span>
            <span className="mx-4 text-red-600 font-semibold">
              Despesas: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpense)}
            </span>
            <span className="ml-4 font-semibold">
              Saldo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome - totalExpense)}
            </span>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Gráficos */}
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

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente ou serviço..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 justify-end">
        <Button
          variant="outline"
          onClick={() => exportToCSV(filteredTransactions)}
          disabled={filteredTransactions.length === 0}
        >
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transações</CardTitle>
          <CardDescription>
            {filteredTransactions.length === 0
              ? 'Nenhuma transação encontrada'
              : `${filteredTransactions.length} transação(ões) encontrada(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : paginatedTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? 'Nenhuma transação encontrada para esta busca.'
                : 'Nenhuma transação registrada.'}
            </p>
          ) : (
            <div className="space-y-4">
              {paginatedTransactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {(transaction.patients as Patient)?.name || 'Paciente não informado'}
                        </p>
                        <div className="mt-1 space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Serviço: {(transaction.services as Service)?.name || 'N/A'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Valor: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Data: {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Tipo: {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Status: {
                              transaction.status === 'pending' ? 'Pendente' :
                              transaction.status === 'completed' ? 'Concluído' :
                              'Cancelado'
                            }
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Método: {
                              transaction.payment_method === 'cash' ? 'Dinheiro' :
                              transaction.payment_method === 'credit_card' ? 'Cartão de Crédito' :
                              transaction.payment_method === 'debit_card' ? 'Cartão de Débito' :
                              transaction.payment_method === 'pix' ? 'PIX' :
                              'Transferência'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          Detalhes
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTransaction(transaction)
                                setEditDialogOpen(true)
                              }}
                            >
                              Editar
                            </DropdownMenuItem>
                            {transaction.status === 'pending' && (
                              <DropdownMenuItem
                                onClick={() => handleMarkAsPaid(transaction)}
                              >
                                Marcar como Pago
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-700"
                              onClick={() => {
                                setTransactionToDelete(transaction)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {/* Controles de paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
            <DialogDescription>
              Atualize os dados da transação
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <TransactionForm
              onSuccess={() => {
                loadTransactions()
                setEditDialogOpen(false)
              }}
              initialData={{ ...selectedTransaction, notes: selectedTransaction.notes ?? undefined }}
              transactionId={selectedTransaction.id}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Excluir Transação</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteTransaction} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 