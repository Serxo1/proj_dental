'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'

const formSchema = z.object({
  patient_id: z.string().min(1, 'Paciente é obrigatório'),
  service_id: z.string().min(1, 'Serviço é obrigatório'),
  amount: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  type: z.enum(['income', 'expense']),
  status: z.enum(['pending', 'completed', 'cancelled']),
  payment_method: z.enum(['cash', 'credit_card', 'debit_card', 'pix', 'transfer']),
  notes: z.string().optional(),
})

interface TransactionFormProps {
  onSuccess?: () => void
  initialData?: Partial<z.infer<typeof formSchema>>
  transactionId?: string
}

type PatientOption = { id: string; name: string }
type ServiceOption = { id: string; name: string }

export function TransactionForm({ onSuccess, initialData, transactionId }: TransactionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [patients, setPatients] = useState<PatientOption[]>([])
  const [services, setServices] = useState<ServiceOption[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      type: 'income',
      status: 'pending',
      payment_method: 'cash',
    },
  })

  useEffect(() => {
    loadPatients()
    loadServices()
    // Atualiza valores do formulário ao abrir para edição
    if (initialData) {
      form.reset({ ...form.getValues(), ...initialData })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData])

  async function loadPatients() {
    const { data } = await supabase.from('patients').select('id, name').order('name')
    if (data) setPatients(data)
  }

  async function loadServices() {
    const { data } = await supabase.from('services').select('id, name').order('name')
    if (data) setServices(data)
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      if (transactionId) {
        // Atualizar transação existente
        const { error } = await supabase
          .from('transactions')
          .update({ ...values, notes: values.notes || null })
          .eq('id', transactionId)
        if (error) throw error
      } else {
        // Nova transação
        const { error } = await supabase.from('transactions').insert({
          ...values,
          notes: values.notes || null,
        })
        if (error) throw error
      }
      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao salvar transação:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="patient_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Paciente</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="service_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Serviço</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor</FormLabel>
              <FormControl>
                <Input type="number" min="0.01" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="payment_method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Método de Pagamento</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="transfer">Transferência</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Input placeholder="Adicione observações sobre a transação" {...field} />
              </FormControl>
              <FormDescription>
                Opcional. Adicione informações relevantes sobre a transação.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading
            ? transactionId
              ? 'Salvando...'
              : 'Cadastrando...'
            : transactionId
              ? 'Salvar Alterações'
              : 'Cadastrar Transação'}
        </Button>
      </form>
    </Form>
  )
} 