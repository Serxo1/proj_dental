'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'

const defaultSettings = {
  clinic_name: '',
  address: '',
  phone: '',
  email: '',
  logo_url: '',
  language: 'pt-BR',
  currency: 'BRL',
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings)
  const [isLoading, setIsLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setIsLoading(true)
    const { data } = await supabase.from('settings').select('*').single()
    if (data) setSettings(data)
    setIsLoading(false)
  }

  async function handleLogoUpload(file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `logo.${fileExt}`
    const { data, error } = await supabase.storage.from('public').upload(fileName, file, { upsert: true })
    if (error) throw error
    const { publicUrl } = supabase.storage.from('public').getPublicUrl(fileName).data
    return publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    let logo_url = settings.logo_url
    try {
      if (logoFile) {
        logo_url = await handleLogoUpload(logoFile)
      }
      const { error } = await supabase.from('settings').upsert({ ...settings, logo_url })
      if (error) throw error
      setSettings((s) => ({ ...s, logo_url }))
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Preferências Gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1">Nome da clínica</label>
              <Input
                value={settings.clinic_name}
                onChange={(e) => setSettings((s) => ({ ...s, clinic_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Endereço</label>
              <Input
                value={settings.address}
                onChange={(e) => setSettings((s) => ({ ...s, address: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Telefone</label>
                <Input
                  value={settings.phone}
                  onChange={(e) => setSettings((s) => ({ ...s, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">E-mail</label>
                <Input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings((s) => ({ ...s, email: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Logo</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              />
              {settings.logo_url && (
                <img src={settings.logo_url} alt="Logo" className="h-16 mt-2" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Idioma</label>
                <Select
                  value={settings.language}
                  onValueChange={(v) => setSettings((s) => ({ ...s, language: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en-US">Inglês (EUA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Moeda</label>
                <Select
                  value={settings.currency}
                  onValueChange={(v) => setSettings((s) => ({ ...s, currency: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">Real (BRL)</SelectItem>
                    <SelectItem value="USD">Dólar (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Preferências'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 