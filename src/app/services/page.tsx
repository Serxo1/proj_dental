'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, MoreVertical, Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ServiceForm } from '@/components/services/service-form'
import { supabase } from '@/lib/supabase'
import type { Service } from '@/lib/supabase'

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadServices()
  }, [])

  async function loadServices() {
    setIsLoading(true)
    const { data, error } = await supabase.from('services').select('*').order('name')
    if (!error && data) setServices(data)
    setIsLoading(false)
  }

  async function handleDeleteService() {
    if (!serviceToDelete) return
    setIsDeleting(true)
    try {
      const { error } = await supabase.from('services').delete().eq('id', serviceToDelete.id)
      if (error) throw error
      setDeleteDialogOpen(false)
      setServiceToDelete(null)
      loadServices()
    } catch (error) {
      console.error('Erro ao excluir serviço:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
          <p className="text-muted-foreground">Gerencie os procedimentos oferecidos pela clínica</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Novo Serviço</DialogTitle>
              <DialogDescription>Preencha os dados para cadastrar um novo serviço</DialogDescription>
            </DialogHeader>
            <ServiceForm onSuccess={loadServices} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar serviços..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Serviços</CardTitle>
          <CardDescription>
            {filteredServices.length === 0
              ? 'Nenhum serviço encontrado'
              : `${filteredServices.length} serviço(s) encontrado(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : filteredServices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? 'Nenhum serviço encontrado para esta busca.'
                : 'Nenhum serviço cadastrado.'}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredServices.map((service) => (
                <Card key={service.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <div className="mt-1 space-y-1">
                          {service.description && (
                            <p className="text-sm text-muted-foreground">{service.description}</p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            Duração: {service.duration} min
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Preço: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedService(service)
                              setEditDialogOpen(true)
                            }}
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-700"
                            onClick={() => {
                              setServiceToDelete(service)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Serviço</DialogTitle>
            <DialogDescription>Atualize os dados do serviço</DialogDescription>
          </DialogHeader>
          {selectedService && (
            <ServiceForm
              onSuccess={() => {
                loadServices()
                setEditDialogOpen(false)
              }}
              initialData={selectedService}
              serviceId={selectedService.id}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Excluir Serviço</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteService} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 