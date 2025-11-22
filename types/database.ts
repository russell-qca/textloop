export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          contractor_id: string
          role: 'owner' | 'admin' | 'member' | 'viewer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          contractor_id: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contractor_id?: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          created_at?: string
          updated_at?: string
        }
      }
      contractors: {
        Row: {
          id: string
          email: string
          name: string
          company_name: string | null
          phone: string | null
          city: string | null
          state: string | null
          twilio_phone_number: string | null
          subscription_status: 'active' | 'inactive' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          company_name?: string | null
          phone?: string | null
          city?: string | null
          state?: string | null
          twilio_phone_number?: string | null
          subscription_status?: 'active' | 'inactive' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          company_name?: string | null
          phone?: string | null
          city?: string | null
          state?: string | null
          twilio_phone_number?: string | null
          subscription_status?: 'active' | 'inactive' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          contractor_id: string
          client_name: string
          client_phone: string
          client_email: string | null
          client_address_street: string | null
          client_address_city: string | null
          client_address_state: string | null
          client_address_zip: string | null
          client_address_unit: string | null
          lead_date: string | null
          lead_origin: 'Direct' | 'Angis' | 'Thumbtack' | 'Referral' | null
          visit_date: string | null
          status: 'lead' | 'active' | 'archived' | 'lead/scheduled' | 'lead/quote'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contractor_id: string
          client_name: string
          client_phone: string
          client_email?: string | null
          client_address_street?: string | null
          client_address_city?: string | null
          client_address_state?: string | null
          client_address_zip?: string | null
          client_address_unit?: string | null
          lead_date?: string | null
          lead_origin?: 'Direct' | 'Angis' | 'Thumbtack' | 'Referral' | null
          visit_date?: string | null
          status?: 'lead' | 'active' | 'archived' | 'lead/scheduled' | 'lead/quote'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contractor_id?: string
          client_name?: string
          client_phone?: string
          client_email?: string | null
          client_address_street?: string | null
          client_address_city?: string | null
          client_address_state?: string | null
          client_address_zip?: string | null
          client_address_unit?: string | null
          lead_date?: string | null
          lead_origin?: 'Direct' | 'Angis' | 'Thumbtack' | 'Referral' | null
          visit_date?: string | null
          status?: 'lead' | 'active' | 'archived' | 'lead/scheduled' | 'lead/quote'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quotes: {
        Row: {
          id: string
          contractor_id: string
          client_id: string
          quote_title: string | null
          quote_summary: string | null
          quote_description: string | null
          quote_amount: number
          date_quoted: string
          valid_until: string | null
          status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'void'
          notes: string | null
          last_emailed_at: string | null
          acceptance_token: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contractor_id: string
          client_id: string
          quote_title?: string | null
          quote_summary?: string | null
          quote_description?: string | null
          quote_amount: number
          date_quoted?: string
          valid_until?: string | null
          status?: 'pending' | 'accepted' | 'rejected' | 'expired'
          notes?: string | null
          last_emailed_at?: string | null
          acceptance_token?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contractor_id?: string
          client_id?: string
          quote_title?: string | null
          quote_summary?: string | null
          quote_description?: string | null
          quote_amount?: number
          date_quoted?: string
          valid_until?: string | null
          status?: 'pending' | 'accepted' | 'rejected' | 'expired'
          notes?: string | null
          last_emailed_at?: string | null
          acceptance_token?: string
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          contractor_id: string
          client_id: string
          project_type: string
          project_description: string
          start_date: string | null
          end_date: string | null
          project_cost: number | null
          permits_required: boolean
          permit_status: 'pending' | 'approved' | 'rejected' | 'not_applicable' | 'not_submitted' | null
          status: 'planned' | 'active' | 'completed' | 'cancelled'
          project_address_street: string | null
          project_address_city: string | null
          project_address_state: string | null
          project_address_zip: string | null
          project_address_unit: string | null
          project_address_county: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contractor_id: string
          client_id: string
          project_type: string
          project_description: string
          start_date?: string | null
          end_date?: string | null
          project_cost?: number | null
          permits_required?: boolean
          permit_status?: 'pending' | 'approved' | 'rejected' | 'not_applicable' | null
          status?: 'planned' | 'active' | 'completed' | 'cancelled'
          project_address_street?: string | null
          project_address_city?: string | null
          project_address_state?: string | null
          project_address_zip?: string | null
          project_address_unit?: string | null
          project_address_county?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contractor_id?: string
          client_id?: string
          project_type?: string
          project_description?: string
          start_date?: string | null
          end_date?: string | null
          project_cost?: number | null
          permits_required?: boolean
          permit_status?: 'pending' | 'approved' | 'rejected' | 'not_applicable' | null
          status?: 'planned' | 'active' | 'completed' | 'cancelled'
          project_address_street?: string | null
          project_address_city?: string | null
          project_address_state?: string | null
          project_address_zip?: string | null
          project_address_unit?: string | null
          project_address_county?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          quote_id: string | null
          project_id: string | null
          message_text: string
          sequence_day: number
          scheduled_for: string
          sent_at: string | null
          status: 'pending' | 'sent' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quote_id?: string | null
          project_id?: string | null
          message_text: string
          sequence_day: number
          scheduled_for: string
          sent_at?: string | null
          status?: 'pending' | 'sent' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quote_id?: string | null
          project_id?: string | null
          message_text?: string
          sequence_day?: number
          scheduled_for?: string
          sent_at?: string | null
          status?: 'pending' | 'sent' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
      inspections: {
        Row: {
          id: string
          project_id: string
          inspection_type: 'footer' | 'framing' | 'electrical' | 'plumbing' | 'insulation' | 'final'
          completed: boolean
          completed_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          inspection_type: 'footer' | 'framing' | 'electrical' | 'plumbing' | 'insulation' | 'final'
          completed?: boolean
          completed_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          inspection_type?: 'footer' | 'framing' | 'electrical' | 'plumbing' | 'insulation' | 'final'
          completed?: boolean
          completed_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quote_items: {
        Row: {
          id: string
          quote_id: string
          name: string
          description: string
          quantity: number
          unit_price: number
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quote_id: string
          name: string
          description: string
          quantity?: number
          unit_price?: number
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quote_id?: string
          name?: string
          description?: string
          quantity?: number
          unit_price?: number
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
