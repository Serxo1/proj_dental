'use client'

import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Users, Package, DollarSign, MessageSquare } from 'lucide-react'
import Link from 'next/link'

const features = [
  {
    title: 'Agenda',
    description: 'Gerencie consultas e procedimentos',
    icon: Calendar,
    href: '/appointments',
  },
  {
    title: 'Pacientes',
    description: 'Cadastro e histórico de pacientes',
    icon: Users,
    href: '/patients',
  },
  {
    title: 'Estoque',
    description: 'Controle de materiais e medicamentos',
    icon: Package,
    href: '/inventory',
  },
  {
    title: 'Financeiro',
    description: 'Gestão de pagamentos e despesas',
    icon: DollarSign,
    href: '/transactions',
  },
  {
    title: 'Assistente IA',
    description: 'Suporte inteligente para sua clínica',
    icon: MessageSquare,
    href: '/assistant',
  },
]

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bem-vindo, {user?.full_name || 'Usuário'}
        </h1>
        <p className="text-muted-foreground">
          Acesse rapidamente as principais funcionalidades do sistema
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Link key={feature.href} href={feature.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <feature.icon className="h-5 w-5" />
                  <CardTitle>{feature.title}</CardTitle>
                </div>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Próximas Consultas</CardTitle>
            <CardDescription>
              Visualize as consultas agendadas para hoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nenhuma consulta agendada para hoje.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estoque Baixo</CardTitle>
            <CardDescription>
              Itens que precisam de reposição
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nenhum item com estoque baixo.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
