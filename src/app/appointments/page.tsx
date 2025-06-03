'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar as CalendarIcon, Plus } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AppointmentForm } from '@/components/appointments/appointment-form'
import type { Appointment } from '@/lib/supabase'

export default function AppointmentsPage() {
  const { user } = useAuth()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [appointments, setAppointments] = useState<Appointment[]>([])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">
            Gerencie consultas e procedimentos
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Consulta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nova Consulta</DialogTitle>
              <DialogDescription>
                Preencha os dados para agendar uma nova consulta
              </DialogDescription>
            </DialogHeader>
            <AppointmentForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <Select
          value={view}
          onValueChange={(value: 'calendar' | 'list') => setView(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione a visualização" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="calendar">Calendário</SelectItem>
            <SelectItem value="list">Lista</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {view === 'calendar' ? (
        <div className="grid gap-4 md:grid-cols-[1fr_300px]">
          <Card>
            <CardHeader>
              <CardTitle>Calendário</CardTitle>
              <CardDescription>
                Selecione uma data para ver as consultas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {date ? (
                  <>
                    Consultas para{' '}
                    {date.toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </>
                ) : (
                  'Selecione uma data'
                )}
              </CardTitle>
              <CardDescription>
                {appointments.length === 0
                  ? 'Nenhuma consulta agendada'
                  : `${appointments.length} consulta(s) agendada(s)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Não há consultas agendadas para esta data.
                </p>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <Card key={appointment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {appointment.start_time} - {appointment.end_time}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Paciente: {appointment.patient_id}
                            </p>
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
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Consultas</CardTitle>
            <CardDescription>
              Visualize todas as consultas agendadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Não há consultas agendadas.
              </p>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {new Date(appointment.start_time).toLocaleDateString(
                              'pt-BR'
                            )}{' '}
                            - {appointment.start_time} - {appointment.end_time}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Paciente: {appointment.patient_id}
                          </p>
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
      )}
    </div>
  )
} 