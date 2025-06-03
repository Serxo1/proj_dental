'use client'

import { useState } from 'react'
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
import { supabase } from '@/lib/supabase'

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  duration: z.coerce.number().min(1, 'Duração deve ser maior que zero'),
  price: z.coerce.number().min(0, 'Preço deve ser maior ou igual a zero'),
})

interface ServiceFormProps {
  onSuccess?: () => void
  initialData?: Partial<z.infer<typeof formSchema>>
  serviceId?: string
}

export function ServiceForm({ onSuccess, initialData, serviceId }: ServiceFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      description: '',
      duration: 30,
      price: 0,
    },
  })

  // Atualiza valores do formulário ao abrir para edição
  if (initialData) {
    form.reset({ ...form.getValues(), ...initialData })
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      if (serviceId) {
        // Atualizar serviço existente
        const { error } = await supabase
          .from('services')
          .update({ ...values, description: values.description || null })
          .eq('id', serviceId)
        if (error) throw error
      } else {
        // Novo serviço
        const { error } = await supabase.from('services').insert({
          ...values,
          description: values.description || null,
        })
        if (error) throw error
      }
      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao salvar serviço:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome do serviço" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Descrição do serviço" {...field} />
              </FormControl>
              <FormDescription>
                Opcional. Adicione uma descrição detalhada do serviço.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duração (min)</FormLabel>
                <FormControl>
                  <Input type="number" min="1" step="1" placeholder="30" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading
            ? serviceId
              ? 'Salvando...'
              : 'Cadastrando...'
            : serviceId
              ? 'Salvar Alterações'
              : 'Cadastrar Serviço'}
        </Button>
      </form>
    </Form>
  )
} 