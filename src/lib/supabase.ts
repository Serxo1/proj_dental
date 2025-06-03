import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para as tabelas do banco de dados
export type Profile = {
  id: string
  full_name: string
  avatar_url: string | null
  role: 'admin' | 'dentist' | 'assistant'
  created_at: string
  updated_at: string
}

export type Patient = {
  id: string
  name: string
  email: string | null
  phone: string
  birth_date: string
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type Service = {
  id: string
  name: string
  description: string | null
  duration: number // em minutos
  price: number
  created_at: string
  updated_at: string
}

export type Appointment = {
  id: string
  patient_id: string
  service_id: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'completed' | 'cancelled'
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
  services?: Service
}

export type Inventory = {
  id: string
  name: string
  description: string | undefined
  quantity: number
  unit: string
  min_quantity: number
  price: number
  supplier: string | undefined
  created_at: string
  updated_at: string
}

export type InventoryHistory = {
  id: string
  item_id: string
  previous_quantity: number
  adjustment: number
  new_quantity: number
  reason: string
  created_by: string
  created_at: string
}

export type Transaction = {
  id: string
  patient_id: string
  service_id: string
  amount: number
  type: 'income' | 'expense'
  status: 'pending' | 'completed' | 'cancelled'
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'transfer'
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
  patients?: { name: string }
  services?: { name: string }
} 