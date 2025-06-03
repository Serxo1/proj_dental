'use client'

import * as React from 'react'
import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PatientForm } from '@/components/patients/patient-form'
import { supabase } from '@/lib/supabase'
import type { Patient } from '@/lib/supabase'

export default function PatientsPage() {
  const { user } = useAuth()
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Carregar pacientes ao montar o componente
  React.useEffect(() => {
    loadPatients()
  }, [])

  async function loadPatients() {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('name')

      if (error) throw error
      if (data) setPatients(data)
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone?.includes(searchQuery)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground">
            Gerencie o cadastro de pacientes
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Novo Paciente</DialogTitle>
              <DialogDescription>
                Preencha os dados para cadastrar um novo paciente
              </DialogDescription>
            </DialogHeader>
            <PatientForm onSuccess={loadPatients} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pacientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pacientes</CardTitle>
          <CardDescription>
            {filteredPatients.length === 0
              ? 'Nenhum paciente encontrado'
              : `${filteredPatients.length} paciente(s) encontrado(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : filteredPatients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? 'Nenhum paciente encontrado para esta busca.'
                : 'Nenhum paciente cadastrado.'}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredPatients.map((patient) => (
                <Card key={patient.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{patient.name}</p>
                        <div className="mt-1 space-y-1">
                          {patient.email && (
                            <p className="text-sm text-muted-foreground">
                              Email: {patient.email}
                            </p>
                          )}
                          {patient.phone && (
                            <p className="text-sm text-muted-foreground">
                              Telefone: {patient.phone}
                            </p>
                          )}
                          {patient.birth_date && (
                            <p className="text-sm text-muted-foreground">
                              Data de Nascimento:{' '}
                              {new Date(patient.birth_date).toLocaleDateString(
                                'pt-BR'
                              )}
                            </p>
                          )}
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
    </div>
  )
} 