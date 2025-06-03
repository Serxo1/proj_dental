'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, FileText, History, Receipt, Stethoscope } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Patient, Appointment, Transaction } from '@/lib/supabase'

export default function PatientDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPatientData()
  }, [id])

  async function loadPatientData() {
    try {
      setIsLoading(true)

      // Carregar dados do paciente
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single()

      if (patientError) throw patientError
      setPatient(patientData)

      // Carregar consultas do paciente
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          services (
            name,
            duration,
            price
          )
        `)
        .eq('patient_id', id)
        .order('start_time', { ascending: false })

      if (appointmentsError) throw appointmentsError
      setAppointments(appointmentsData)

      // Carregar transações do paciente
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          services (
            name,
            price
          )
        `)
        .eq('patient_id', id)
        .order('created_at', { ascending: false })

      if (transactionsError) throw transactionsError
      setTransactions(transactionsData)
    } catch (error) {
      console.error('Erro ao carregar dados do paciente:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-muted-foreground">Paciente não encontrado</p>
        <Button onClick={() => router.back()}>Voltar</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{patient.name}</h1>
          <p className="text-muted-foreground">
            {patient.email && `Email: ${patient.email}`}
            {patient.phone && ` • Telefone: ${patient.phone}`}
            {patient.birth_date && ` • Nascimento: ${new Date(patient.birth_date).toLocaleDateString('pt-BR')}`}
          </p>
        </div>
      </div>

      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Consultas
          </TabsTrigger>
          <TabsTrigger value="medical" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Prontuário
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Financeiro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Consultas</CardTitle>
              <CardDescription>
                {appointments.length === 0
                  ? 'Nenhuma consulta registrada'
                  : `${appointments.length} consulta(s) encontrada(s)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Este paciente ainda não possui consultas agendadas.
                </p>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <Card key={appointment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {appointment.services?.name}
                            </p>
                            <div className="mt-1 space-y-1">
                              <p className="text-sm text-muted-foreground">
                                Data: {new Date(appointment.start_time).toLocaleDateString('pt-BR')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Horário: {new Date(appointment.start_time).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Status: {
                                  appointment.status === 'scheduled' ? 'Agendada' :
                                  appointment.status === 'completed' ? 'Concluída' :
                                  'Cancelada'
                                }
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            Detalhes
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medical">
          <Card>
            <CardHeader>
              <CardTitle>Prontuário</CardTitle>
              <CardDescription>
                Histórico médico e odontológico do paciente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
              <CardDescription>
                Documentos e anexos do paciente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle>Histórico Financeiro</CardTitle>
              <CardDescription>
                {transactions.length === 0
                  ? 'Nenhuma transação registrada'
                  : `${transactions.length} transação(ões) encontrada(s)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Este paciente ainda não possui transações registradas.
                </p>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <Card key={transaction.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {transaction.services?.name}
                            </p>
                            <div className="mt-1 space-y-1">
                              <p className="text-sm text-muted-foreground">
                                Valor: {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL'
                                }).format(transaction.amount)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Data: {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
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
                          <Button variant="ghost" size="sm">
                            Detalhes
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 