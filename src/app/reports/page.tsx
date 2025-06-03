'use client'

import { BarChart2, Users, DollarSign, Package } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Link from 'next/link'

const reports = [
  {
    title: 'Financeiro',
    description: 'Receitas, despesas e saldo por período',
    icon: <DollarSign className="h-8 w-8 text-primary" />,
    href: '/reports/finance',
  },
  {
    title: 'Produção',
    description: 'Atendimentos, serviços realizados, produtividade',
    icon: <BarChart2 className="h-8 w-8 text-primary" />,
    href: '/reports/production',
  },
  {
    title: 'Pacientes',
    description: 'Novos pacientes, aniversariantes, frequência',
    icon: <Users className="h-8 w-8 text-primary" />,
    href: '/reports/patients',
  },
  {
    title: 'Estoque',
    description: 'Consumo, itens mais usados, alertas',
    icon: <Package className="h-8 w-8 text-primary" />,
    href: '/reports/inventory',
  },
]

export default function ReportsPage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Relatórios</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <Link href={report.href} key={report.title}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4">
                {report.icon}
                <div>
                  <CardTitle>{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
} 