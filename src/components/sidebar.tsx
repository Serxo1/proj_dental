"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Users,
  Package,
  DollarSign,
  MessageSquare,
  LogOut,
  Settings,
} from "lucide-react"

const routes = [
  {
    title: "Agenda",
    href: "/appointments",
    icon: Calendar,
  },
  {
    title: "Pacientes",
    href: "/patients",
    icon: Users,
  },
  {
    title: "Estoque",
    href: "/inventory",
    icon: Package,
  },
  {
    title: "Financeiro",
    href: "/transactions",
    icon: DollarSign,
  },
  {
    title: "Assistente IA",
    href: "/assistant",
    icon: MessageSquare,
  },
  {
    title: "Configurações",
    href: "/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { signOut } = useAuth()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <MessageSquare className="h-6 w-6" />
          <span>Dental Clinic</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === route.href
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            <route.icon className="h-4 w-4" />
            {route.title}
          </Link>
        ))}
      </nav>
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  )
} 