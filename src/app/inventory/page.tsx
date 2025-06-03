'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Search, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { InventoryForm } from '@/components/inventory/inventory-form'
import { StockAdjustmentDialog } from '@/components/inventory/stock-adjustment-dialog'
import { supabase } from '@/lib/supabase'
import type { Inventory } from '@/lib/supabase'

export default function InventoryPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<Inventory[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Carregar itens ao montar o componente
  React.useEffect(() => {
    loadInventory()
  }, [])

  async function loadInventory() {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name')

      if (error) throw error
      if (data) setItems(data)
    } catch (error) {
      console.error('Erro ao carregar estoque:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.supplier?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const lowStockItems = items.filter((item) => item.quantity <= item.min_quantity)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estoque</h1>
          <p className="text-muted-foreground">
            Gerencie o inventário da clínica
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Novo Item</DialogTitle>
              <DialogDescription>
                Preencha os dados para cadastrar um novo item no estoque
              </DialogDescription>
            </DialogHeader>
            <InventoryForm onSuccess={loadInventory} />
          </DialogContent>
        </Dialog>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-sm font-medium">
                {lowStockItems.length} item(ns) com estoque baixo
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar itens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventário</CardTitle>
          <CardDescription>
            {filteredItems.length === 0
              ? 'Nenhum item encontrado'
              : `${filteredItems.length} item(ns) encontrado(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? 'Nenhum item encontrado para esta busca.'
                : 'Nenhum item cadastrado.'}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className={item.quantity <= item.min_quantity ? 'border-yellow-500' : ''}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.name}</p>
                          {item.quantity <= item.min_quantity && (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <div className="mt-1 space-y-1">
                          {item.description && (
                            <p className="text-sm text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            Quantidade: {item.quantity} {item.unit}
                            {item.min_quantity > 0 && (
                              <span className="ml-2">
                                (Mín: {item.min_quantity} {item.unit})
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Preço: {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(item.price)}
                          </p>
                          {item.supplier && (
                            <p className="text-sm text-muted-foreground">
                              Fornecedor: {item.supplier}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          Editar
                        </Button>
                        <StockAdjustmentDialog
                          item={item}
                          onSuccess={loadInventory}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
            <DialogDescription>
              Atualize os dados do item
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <InventoryForm
              itemId={selectedItem.id}
              initialData={selectedItem}
              onSuccess={() => {
                loadInventory()
                setIsEditDialogOpen(false)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 