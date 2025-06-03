'use client'

import { Bot } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function AssistantPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center">
          <Bot className="h-10 w-10 text-primary mb-2" />
          <CardTitle>Assistente IA</CardTitle>
          <CardDescription>
            Em breve você poderá conversar com a IA para tirar dúvidas, obter sugestões e automatizar tarefas da clínica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input placeholder="Digite sua pergunta..." disabled />
            <Button disabled>Enviar</Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Funcionalidade em desenvolvimento. Aguarde novidades!
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 