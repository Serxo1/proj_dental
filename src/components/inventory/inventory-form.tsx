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
  quantity: z.coerce.number().min(0, 'Quantidade deve ser maior ou igual a 0'),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  min_quantity: z.coerce.number().min(0, 'Quantidade mínima deve ser maior ou igual a 0'),
  price: z.coerce.number().min(0, 'Preço deve ser maior ou igual a 0'),
  supplier: z.string().optional(),
})

interface InventoryFormProps {
  onSuccess?: () => void
  initialData?: z.infer<typeof formSchema>
  itemId?: string
}

export function InventoryForm({ onSuccess, initialData, itemId }: InventoryFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      description: '',
      quantity: 0,
      min_quantity: 0,
      price: 0,
      supplier: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)

      if (itemId) {
        // Atualizar item existente
        const { error } = await supabase
          .from('inventory')
          .update({
            name: values.name,
            description: values.description || null,
            quantity: values.quantity,
            unit: values.unit,
            min_quantity: values.min_quantity,
            price: values.price,
            supplier: values.supplier || null,
          })
          .eq('id', itemId)

        if (error) throw error
      } else {
        // Criar novo item
        const { error } = await supabase.from('inventory').insert({
          name: values.name,
          description: values.description || null,
          quantity: values.quantity,
          unit: values.unit,
          min_quantity: values.min_quantity,
          price: values.price,
          supplier: values.supplier || null,
        })

        if (error) throw error
      }

      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao salvar item:', error)
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
                <Input placeholder="Nome do item" {...field} />
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
                <Input placeholder="Descrição do item" {...field} />
              </FormControl>
              <FormDescription>
                Opcional. Adicione uma descrição detalhada do item.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidade</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: un, kg, ml" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="min_quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade Mínima</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Alerta será exibido quando atingir este valor.
                </FormDescription>
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
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="supplier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fornecedor</FormLabel>
              <FormControl>
                <Input placeholder="Nome do fornecedor" {...field} />
              </FormControl>
              <FormDescription>
                Opcional. Registre o fornecedor do item.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading
            ? itemId
              ? 'Salvando...'
              : 'Cadastrando...'
            : itemId
              ? 'Salvar Alterações'
              : 'Cadastrar Item'}
        </Button>
      </form>
    </Form>
  )
} 