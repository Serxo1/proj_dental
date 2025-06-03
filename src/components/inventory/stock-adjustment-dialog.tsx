'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import type { Inventory } from '@/lib/supabase'

const formSchema = z.object({
  adjustment: z.coerce.number().refine((val) => val !== 0, {
    message: 'O ajuste não pode ser zero',
  }),
  reason: z.string().min(1, 'Motivo é obrigatório'),
})

interface StockAdjustmentDialogProps {
  item: Inventory
  onSuccess?: () => void
}

export function StockAdjustmentDialog({ item, onSuccess }: StockAdjustmentDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      adjustment: 0,
      reason: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)

      const newQuantity = item.quantity + values.adjustment

      if (newQuantity < 0) {
        throw new Error('A quantidade não pode ficar negativa')
      }

      const { error } = await supabase
        .from('inventory')
        .update({
          quantity: newQuantity,
        })
        .eq('id', item.id)

      if (error) throw error

      // Registrar o ajuste no histórico
      const { error: historyError } = await supabase
        .from('inventory_history')
        .insert({
          item_id: item.id,
          previous_quantity: item.quantity,
          adjustment: values.adjustment,
          new_quantity: newQuantity,
          reason: values.reason,
        })

      if (historyError) throw historyError

      form.reset()
      setIsOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao ajustar estoque:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Ajustar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajustar Estoque</DialogTitle>
          <DialogDescription>
            Ajuste a quantidade do item "{item.name}"
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-4">
                  <p className="text-sm text-muted-foreground">
                    Quantidade atual: {item.quantity} {item.unit}
                  </p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="adjustment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ajuste</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 10 para adicionar, -5 para remover"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Use números positivos para adicionar e negativos para remover.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o motivo do ajuste"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Confirmar Ajuste'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 