export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accounts_payable: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          due_date: string
          id: string
          status: string
          tenant_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          due_date: string
          id?: string
          status?: string
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          due_date?: string
          id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_payable_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_customers: {
        Row: {
          asaas_customer_id: string
          billing_type: string | null
          contract_id: string | null
          created_at: string | null
          id: string
          tenant_id: string
        }
        Insert: {
          asaas_customer_id: string
          billing_type?: string | null
          contract_id?: string | null
          created_at?: string | null
          id?: string
          tenant_id: string
        }
        Update: {
          asaas_customer_id?: string
          billing_type?: string | null
          contract_id?: string | null
          created_at?: string | null
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asaas_customers_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: string | null
          id: string
          tenant_id: string
          user_email: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: string | null
          id?: string
          tenant_id: string
          user_email?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: string | null
          id?: string
          tenant_id?: string
          user_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      benefit_partners: {
        Row: {
          address: string | null
          category: string
          city: string | null
          created_at: string | null
          discount_description: string
          id: string
          name: string
          phone: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          address?: string | null
          category?: string
          city?: string | null
          created_at?: string | null
          discount_description: string
          id?: string
          name: string
          phone?: string | null
          status?: string
          tenant_id?: string
        }
        Update: {
          address?: string | null
          category?: string
          city?: string | null
          created_at?: string | null
          discount_description?: string
          id?: string
          name?: string
          phone?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      benefits_partners: {
        Row: {
          category: string
          contact_info: string | null
          created_at: string | null
          discount_percentage: number | null
          id: string
          partner_name: string
          tenant_id: string | null
        }
        Insert: {
          category?: string
          contact_info?: string | null
          created_at?: string | null
          discount_percentage?: number | null
          id?: string
          partner_name: string
          tenant_id?: string | null
        }
        Update: {
          category?: string
          contact_info?: string | null
          created_at?: string | null
          discount_percentage?: number | null
          id?: string
          partner_name?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "benefits_partners_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      burial_records: {
        Row: {
          burial_date: string
          burial_type: string
          cemetery_name: string
          cemetery_plot: string
          concession_type: string
          contract_id: string | null
          created_at: string | null
          deceased_name: string
          dispatch_id: string | null
          exhumation_eligible_date: string | null
          id: string
          observations: string | null
          room_id: string | null
          status: string
          tenant_id: string
          wake_end: string
          wake_start: string
        }
        Insert: {
          burial_date: string
          burial_type?: string
          cemetery_name: string
          cemetery_plot: string
          concession_type?: string
          contract_id?: string | null
          created_at?: string | null
          deceased_name: string
          dispatch_id?: string | null
          exhumation_eligible_date?: string | null
          id?: string
          observations?: string | null
          room_id?: string | null
          status?: string
          tenant_id?: string
          wake_end: string
          wake_start: string
        }
        Update: {
          burial_date?: string
          burial_type?: string
          cemetery_name?: string
          cemetery_plot?: string
          concession_type?: string
          contract_id?: string | null
          created_at?: string | null
          deceased_name?: string
          dispatch_id?: string | null
          exhumation_eligible_date?: string | null
          id?: string
          observations?: string | null
          room_id?: string | null
          status?: string
          tenant_id?: string
          wake_end?: string
          wake_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "burial_records_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "wake_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chapel_bookings: {
        Row: {
          chapel_name: string
          created_at: string | null
          deceased_name: string
          end_time: string
          family_contact: string | null
          id: string
          start_time: string
          status: string | null
          tenant_id: string | null
        }
        Insert: {
          chapel_name: string
          created_at?: string | null
          deceased_name: string
          end_time: string
          family_contact?: string | null
          id?: string
          start_time: string
          status?: string | null
          tenant_id?: string | null
        }
        Update: {
          chapel_name?: string
          created_at?: string | null
          deceased_name?: string
          end_time?: string
          family_contact?: string | null
          id?: string
          start_time?: string
          status?: string | null
          tenant_id?: string | null
        }
        Relationships: []
      }
      chapel_burials: {
        Row: {
          burial_date: string
          cemetery_location: string | null
          contract_id: string | null
          created_at: string | null
          deceased_name: string
          id: string
          latitude: number | null
          longitude: number | null
          status: string
          tenant_id: string | null
        }
        Insert: {
          burial_date?: string
          cemetery_location?: string | null
          contract_id?: string | null
          created_at?: string | null
          deceased_name: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          status?: string
          tenant_id?: string | null
        }
        Update: {
          burial_date?: string
          cemetery_location?: string | null
          contract_id?: string | null
          created_at?: string | null
          deceased_name?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          status?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chapel_burials_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapel_burials_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_receipts: {
        Row: {
          amount_collected: number
          collector_name: string
          contract_id: string | null
          created_at: string | null
          holder_name: string
          id: string
          notes: string | null
          payment_method: string
          received_at: string | null
          route_id: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          amount_collected: number
          collector_name: string
          contract_id?: string | null
          created_at?: string | null
          holder_name: string
          id?: string
          notes?: string | null
          payment_method?: string
          received_at?: string | null
          route_id?: string | null
          status?: string
          tenant_id?: string
        }
        Update: {
          amount_collected?: number
          collector_name?: string
          contract_id?: string | null
          created_at?: string | null
          holder_name?: string
          id?: string
          notes?: string | null
          payment_method?: string
          received_at?: string | null
          route_id?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_receipts_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "collection_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_routes: {
        Row: {
          collector_name: string
          collector_phone: string | null
          created_at: string | null
          id: string
          name: string
          neighborhoods: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          collector_name: string
          collector_phone?: string | null
          created_at?: string | null
          id?: string
          name: string
          neighborhoods?: string | null
          status?: string
          tenant_id?: string
        }
        Update: {
          collector_name?: string
          collector_phone?: string | null
          created_at?: string | null
          id?: string
          name?: string
          neighborhoods?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      collector_routes: {
        Row: {
          collector_name: string
          created_at: string | null
          id: string
          status: string | null
          tenant_id: string | null
          total_receipts: number | null
          zone: string
        }
        Insert: {
          collector_name: string
          created_at?: string | null
          id?: string
          status?: string | null
          tenant_id?: string | null
          total_receipts?: number | null
          zone: string
        }
        Update: {
          collector_name?: string
          created_at?: string | null
          id?: string
          status?: string | null
          tenant_id?: string | null
          total_receipts?: number | null
          zone?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          amount: number
          contract_id: string | null
          created_at: string | null
          id: string
          seller_name: string
          status: string
          tenant_id: string
        }
        Insert: {
          amount: number
          contract_id?: string | null
          created_at?: string | null
          id?: string
          seller_name: string
          status?: string
          tenant_id: string
        }
        Update: {
          amount?: number
          contract_id?: string | null
          created_at?: string | null
          id?: string
          seller_name?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          created_at: string | null
          holder_id: string
          id: string
          plan_id: string
          seller_id: string | null
          seller_name: string | null
          start_date: string
          status: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          holder_id: string
          id?: string
          plan_id: string
          seller_id?: string | null
          seller_name?: string | null
          start_date?: string
          status?: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          holder_id?: string
          id?: string
          plan_id?: string
          seller_id?: string | null
          seller_name?: string | null
          start_date?: string
          status?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_holder_id_fkey"
            columns: ["holder_id"]
            isOneToOne: false
            referencedRelation: "holders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      convalescence_items: {
        Row: {
          category: string
          code: string
          condition: string
          created_at: string | null
          id: string
          name: string
          notes: string | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          code: string
          condition?: string
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          code?: string
          condition?: string
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      convalescence_loans: {
        Row: {
          actual_return_date: string | null
          beneficiary_name: string | null
          cleaning_fee: number | null
          contract_id: string | null
          created_at: string | null
          deposit_amount: number | null
          expected_return_date: string
          holder_cpf: string | null
          holder_name: string
          holder_phone: string | null
          id: string
          item_id: string | null
          loan_date: string
          observations: string | null
          return_condition: string | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          actual_return_date?: string | null
          beneficiary_name?: string | null
          cleaning_fee?: number | null
          contract_id?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          expected_return_date: string
          holder_cpf?: string | null
          holder_name: string
          holder_phone?: string | null
          id?: string
          item_id?: string | null
          loan_date?: string
          observations?: string | null
          return_condition?: string | null
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          actual_return_date?: string | null
          beneficiary_name?: string | null
          cleaning_fee?: number | null
          contract_id?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          expected_return_date?: string
          holder_cpf?: string | null
          holder_name?: string
          holder_phone?: string | null
          id?: string
          item_id?: string | null
          loan_date?: string
          observations?: string | null
          return_condition?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "convalescence_loans_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "convalescence_items"
            referencedColumns: ["id"]
          },
        ]
      }
      dependents: {
        Row: {
          birth_date: string | null
          cpf: string | null
          created_at: string | null
          full_name: string
          holder_id: string
          id: string
          relation: string
          tenant_id: string | null
        }
        Insert: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          full_name: string
          holder_id: string
          id?: string
          relation: string
          tenant_id?: string | null
        }
        Update: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          full_name?: string
          holder_id?: string
          id?: string
          relation?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dependents_holder_id_fkey"
            columns: ["holder_id"]
            isOneToOne: false
            referencedRelation: "holders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dependents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_audit_logs: {
        Row: {
          action: string
          actor_name: string
          actor_role: string
          created_at: string | null
          details: Json | null
          dispatch_id: string
          driver_name: string | null
          id: string
          tenant_id: string
          vehicle_plate: string | null
        }
        Insert: {
          action: string
          actor_name: string
          actor_role?: string
          created_at?: string | null
          details?: Json | null
          dispatch_id: string
          driver_name?: string | null
          id?: string
          tenant_id: string
          vehicle_plate?: string | null
        }
        Update: {
          action?: string
          actor_name?: string
          actor_role?: string
          created_at?: string | null
          details?: Json | null
          dispatch_id?: string
          driver_name?: string | null
          id?: string
          tenant_id?: string
          vehicle_plate?: string | null
        }
        Relationships: []
      }
      dispatches: {
        Row: {
          closed_at: string | null
          closure_notes: string | null
          created_at: string | null
          driver_agent: string | null
          fuel_cost: number | null
          fuel_liters_added: number | null
          id: string
          km_traveled: number | null
          odometer_end: number | null
          odometer_start: number | null
          status: string
          tenant_id: string
          vehicle_id: string | null
          vehicle_plate: string | null
        }
        Insert: {
          closed_at?: string | null
          closure_notes?: string | null
          created_at?: string | null
          driver_agent?: string | null
          fuel_cost?: number | null
          fuel_liters_added?: number | null
          id?: string
          km_traveled?: number | null
          odometer_end?: number | null
          odometer_start?: number | null
          status?: string
          tenant_id: string
          vehicle_id?: string | null
          vehicle_plate?: string | null
        }
        Update: {
          closed_at?: string | null
          closure_notes?: string | null
          created_at?: string | null
          driver_agent?: string | null
          fuel_cost?: number | null
          fuel_liters_added?: number | null
          id?: string
          km_traveled?: number | null
          odometer_end?: number | null
          odometer_start?: number | null
          status?: string
          tenant_id?: string
          vehicle_id?: string | null
          vehicle_plate?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatches_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      duty_services: {
        Row: {
          casket_model: string | null
          contract_id: number | null
          created_at: string | null
          death_location: string | null
          deceased_name: string
          holder_name: string | null
          id: number
          notes: string | null
          status: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          casket_model?: string | null
          contract_id?: number | null
          created_at?: string | null
          death_location?: string | null
          deceased_name: string
          holder_name?: string | null
          id?: number
          notes?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          casket_model?: string | null
          contract_id?: number | null
          created_at?: string | null
          death_location?: string | null
          deceased_name?: string
          holder_name?: string | null
          id?: number
          notes?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      emergency_dispatches: {
        Row: {
          address: string | null
          caller_phone: string | null
          completed_at: string | null
          created_at: string
          death_location: string | null
          deceased_name: string
          driver_agent: string | null
          family_contact: string | null
          family_contact_name: string | null
          family_contact_phone: string | null
          holder_name: string | null
          id: string
          location: string | null
          observations: string | null
          plan_name: string | null
          protocol: string
          source: string
          status: string | null
          tenant_id: string | null
          urn_model: string | null
          vehicle_desc: string | null
          vehicle_id: string | null
        }
        Insert: {
          address?: string | null
          caller_phone?: string | null
          completed_at?: string | null
          created_at?: string
          death_location?: string | null
          deceased_name: string
          driver_agent?: string | null
          family_contact?: string | null
          family_contact_name?: string | null
          family_contact_phone?: string | null
          holder_name?: string | null
          id?: string
          location?: string | null
          observations?: string | null
          plan_name?: string | null
          protocol: string
          source?: string
          status?: string | null
          tenant_id?: string | null
          urn_model?: string | null
          vehicle_desc?: string | null
          vehicle_id?: string | null
        }
        Update: {
          address?: string | null
          caller_phone?: string | null
          completed_at?: string | null
          created_at?: string
          death_location?: string | null
          deceased_name?: string
          driver_agent?: string | null
          family_contact?: string | null
          family_contact_name?: string | null
          family_contact_phone?: string | null
          holder_name?: string | null
          id?: string
          location?: string | null
          observations?: string | null
          plan_name?: string | null
          protocol?: string
          source?: string
          status?: string | null
          tenant_id?: string | null
          urn_model?: string | null
          vehicle_desc?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_dispatches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_dispatches_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "fleet_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          category: string | null
          contract_id: string | null
          created_at: string | null
          description: string | null
          gateway_txid: string | null
          id: string
          payment_id: string | null
          service_order_id: string | null
          tenant_id: string | null
          transaction_date: string | null
          type: string
        }
        Insert: {
          amount: number
          category?: string | null
          contract_id?: string | null
          created_at?: string | null
          description?: string | null
          gateway_txid?: string | null
          id?: string
          payment_id?: string | null
          service_order_id?: string | null
          tenant_id?: string | null
          transaction_date?: string | null
          type: string
        }
        Update: {
          amount?: number
          category?: string | null
          contract_id?: string | null
          created_at?: string | null
          description?: string | null
          gateway_txid?: string | null
          id?: string
          payment_id?: string | null
          service_order_id?: string | null
          tenant_id?: string | null
          transaction_date?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "v_service_orders_without_nfse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_invoices: {
        Row: {
          c_class_trib: string | null
          cancellation_nfse_number: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by_user_id: string | null
          created_at: string
          created_by_user_id: string | null
          cst: string | null
          deduction_amount: number | null
          id: string
          ind_natureza_op: string | null
          iss_amount: number | null
          issued_at: string | null
          nfse_number: string | null
          nfse_status: string
          nfse_verification_code: string | null
          p_ibs_cbs: number | null
          pdf_url: string | null
          provider: string | null
          provider_environment: string | null
          provider_error_message: string | null
          provider_invoice_id: string | null
          provider_request_payload: Json | null
          provider_response_payload: Json | null
          service_amount: number
          service_code: string | null
          service_description: string
          service_order_id: string | null
          taker_address: string | null
          taker_city: string | null
          taker_complement: string | null
          taker_document: string | null
          taker_document_type: string | null
          taker_email: string | null
          taker_name: string
          taker_neighborhood: string | null
          taker_number: string | null
          taker_phone: string | null
          taker_state: string | null
          taker_zip_code: string | null
          tax_rate: number | null
          taxable_amount: number | null
          tenant_id: string
          updated_at: string | null
          v_bc_ibs_cbs: number | null
          v_cbs: number | null
          v_ibs: number | null
          xml_url: string | null
        }
        Insert: {
          c_class_trib?: string | null
          cancellation_nfse_number?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by_user_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          cst?: string | null
          deduction_amount?: number | null
          id?: string
          ind_natureza_op?: string | null
          iss_amount?: number | null
          issued_at?: string | null
          nfse_number?: string | null
          nfse_status?: string
          nfse_verification_code?: string | null
          p_ibs_cbs?: number | null
          pdf_url?: string | null
          provider?: string | null
          provider_environment?: string | null
          provider_error_message?: string | null
          provider_invoice_id?: string | null
          provider_request_payload?: Json | null
          provider_response_payload?: Json | null
          service_amount: number
          service_code?: string | null
          service_description: string
          service_order_id?: string | null
          taker_address?: string | null
          taker_city?: string | null
          taker_complement?: string | null
          taker_document?: string | null
          taker_document_type?: string | null
          taker_email?: string | null
          taker_name: string
          taker_neighborhood?: string | null
          taker_number?: string | null
          taker_phone?: string | null
          taker_state?: string | null
          taker_zip_code?: string | null
          tax_rate?: number | null
          taxable_amount?: number | null
          tenant_id: string
          updated_at?: string | null
          v_bc_ibs_cbs?: number | null
          v_cbs?: number | null
          v_ibs?: number | null
          xml_url?: string | null
        }
        Update: {
          c_class_trib?: string | null
          cancellation_nfse_number?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by_user_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          cst?: string | null
          deduction_amount?: number | null
          id?: string
          ind_natureza_op?: string | null
          iss_amount?: number | null
          issued_at?: string | null
          nfse_number?: string | null
          nfse_status?: string
          nfse_verification_code?: string | null
          p_ibs_cbs?: number | null
          pdf_url?: string | null
          provider?: string | null
          provider_environment?: string | null
          provider_error_message?: string | null
          provider_invoice_id?: string | null
          provider_request_payload?: Json | null
          provider_response_payload?: Json | null
          service_amount?: number
          service_code?: string | null
          service_description?: string
          service_order_id?: string | null
          taker_address?: string | null
          taker_city?: string | null
          taker_complement?: string | null
          taker_document?: string | null
          taker_document_type?: string | null
          taker_email?: string | null
          taker_name?: string
          taker_neighborhood?: string | null
          taker_number?: string | null
          taker_phone?: string | null
          taker_state?: string | null
          taker_zip_code?: string | null
          tax_rate?: number | null
          taxable_amount?: number | null
          tenant_id?: string
          updated_at?: string | null
          v_bc_ibs_cbs?: number | null
          v_cbs?: number | null
          v_ibs?: number | null
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_invoices_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_invoices_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "v_service_orders_without_nfse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fleet_expenses: {
        Row: {
          amount: number
          created_at: string
          current_km: number | null
          establishment: string | null
          expense_date: string
          expense_type: string
          id: string
          liters: number | null
          notes: string | null
          tenant_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          current_km?: number | null
          establishment?: string | null
          expense_date?: string
          expense_type: string
          id?: string
          liters?: number | null
          notes?: string | null
          tenant_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          current_km?: number | null
          establishment?: string | null
          expense_date?: string
          expense_type?: string
          id?: string
          liters?: number | null
          notes?: string | null
          tenant_id?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fleet_expenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fleet_expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "fleet_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      fleet_vehicles: {
        Row: {
          created_at: string
          current_km: number | null
          id: string
          model: string
          plate: string
          status: string | null
          tenant_id: string | null
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string
          current_km?: number | null
          id?: string
          model: string
          plate: string
          status?: string | null
          tenant_id?: string | null
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string
          current_km?: number | null
          id?: string
          model?: string
          plate?: string
          status?: string | null
          tenant_id?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fleet_vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      holders: {
        Row: {
          address: string | null
          cpf: string
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          phone: string
          status: string
          tenant_id: string | null
        }
        Insert: {
          address?: string | null
          cpf: string
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          phone: string
          status?: string
          tenant_id?: string | null
        }
        Update: {
          address?: string | null
          cpf?: string
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string
          status?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "holders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          category: string
          created_at: string | null
          id: string
          item_name: string
          min_threshold: number
          stock_quantity: number
          tenant_id: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          item_name: string
          min_threshold?: number
          stock_quantity?: number
          tenant_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          item_name?: string
          min_threshold?: number
          stock_quantity?: number
          tenant_id?: string | null
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          category: string | null
          id: string
          min_quantity: number
          name: string
          quantity: number
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          id?: string
          min_quantity?: number
          name: string
          quantity?: number
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          id?: string
          min_quantity?: number
          name?: string
          quantity?: number
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          city: string | null
          company: string | null
          converted_at: string | null
          converted_tenant_id: string | null
          created_at: string
          email: string | null
          estimated_monthly: number
          id: string
          lost_reason: string | null
          name: string
          next_follow_up: string | null
          notes: string | null
          phone: string | null
          source: string
          stage: string
          uf: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          company?: string | null
          converted_at?: string | null
          converted_tenant_id?: string | null
          created_at?: string
          email?: string | null
          estimated_monthly?: number
          id?: string
          lost_reason?: string | null
          name: string
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          source?: string
          stage?: string
          uf?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          company?: string | null
          converted_at?: string | null
          converted_tenant_id?: string | null
          created_at?: string
          email?: string | null
          estimated_monthly?: number
          id?: string
          lost_reason?: string | null
          name?: string
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          source?: string
          stage?: string
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_carnets: {
        Row: {
          amount: number
          asaas_payment_id: string | null
          contract_id: string
          created_at: string | null
          due_date: string
          holder_cpf: string | null
          holder_name: string | null
          id: string
          installment_number: number
          status: string
          tenant_id: string
          total_installments: number
        }
        Insert: {
          amount: number
          asaas_payment_id?: string | null
          contract_id: string
          created_at?: string | null
          due_date: string
          holder_cpf?: string | null
          holder_name?: string | null
          id?: string
          installment_number: number
          status?: string
          tenant_id: string
          total_installments: number
        }
        Update: {
          amount?: number
          asaas_payment_id?: string | null
          contract_id?: string
          created_at?: string | null
          due_date?: string
          holder_cpf?: string | null
          holder_name?: string | null
          id?: string
          installment_number?: number
          status?: string
          tenant_id?: string
          total_installments?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_carnets_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_carnets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          asaas_payment_id: string | null
          contract_id: string
          created_at: string | null
          due_date: string
          id: string
          paid_at: string | null
          payment_method: string | null
          pix_code: string | null
          pix_qr_code_url: string | null
          status: string
          tenant_id: string | null
        }
        Insert: {
          amount: number
          asaas_payment_id?: string | null
          contract_id: string
          created_at?: string | null
          due_date: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          pix_code?: string | null
          pix_qr_code_url?: string | null
          status?: string
          tenant_id?: string | null
        }
        Update: {
          amount?: number
          asaas_payment_id?: string | null
          contract_id?: string
          created_at?: string | null
          due_date?: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          pix_code?: string | null
          pix_qr_code_url?: string | null
          status?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      "pedrofsneto33's Org": {
        Row: {
          created_at: string
          id: number
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          tenant_id?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          commission_rate_initial: number
          commission_rate_recurring: number
          created_at: string | null
          description: string | null
          id: string
          max_dependents: number
          monthly_fee: number
          name: string
          tenant_id: string | null
        }
        Insert: {
          commission_rate_initial?: number
          commission_rate_recurring?: number
          created_at?: string | null
          description?: string | null
          id?: string
          max_dependents?: number
          monthly_fee: number
          name: string
          tenant_id?: string | null
        }
        Update: {
          commission_rate_initial?: number
          commission_rate_recurring?: number
          created_at?: string | null
          description?: string | null
          id?: string
          max_dependents?: number
          monthly_fee?: number
          name?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plans_orphans_backup: {
        Row: {
          backed_up_at: string | null
          data: Json
          id: string
        }
        Insert: {
          backed_up_at?: string | null
          data: Json
          id: string
        }
        Update: {
          backed_up_at?: string | null
          data?: Json
          id?: string
        }
        Relationships: []
      }
      regulatory_reserves: {
        Row: {
          applied_amount: number | null
          created_at: string | null
          gross_revenue: number
          id: string
          net_revenue: number
          reference_month: string
          solvency_reserve_target: number
          status: string | null
          technical_reserve_target: number
          tenant_id: string | null
        }
        Insert: {
          applied_amount?: number | null
          created_at?: string | null
          gross_revenue?: number
          id?: string
          net_revenue?: number
          reference_month: string
          solvency_reserve_target?: number
          status?: string | null
          technical_reserve_target?: number
          tenant_id?: string | null
        }
        Update: {
          applied_amount?: number | null
          created_at?: string | null
          gross_revenue?: number
          id?: string
          net_revenue?: number
          reference_month?: string
          solvency_reserve_target?: number
          status?: string | null
          technical_reserve_target?: number
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_reserves_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_commissions: {
        Row: {
          amount: number
          contract_id: string | null
          created_at: string | null
          id: string
          seller_name: string
          status: string | null
          tenant_id: string | null
        }
        Insert: {
          amount: number
          contract_id?: string | null
          created_at?: string | null
          id?: string
          seller_name: string
          status?: string | null
          tenant_id?: string | null
        }
        Update: {
          amount?: number
          contract_id?: string | null
          created_at?: string | null
          id?: string
          seller_name?: string
          status?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_commissions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_commissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          active: boolean
          commission_percent: number
          created_at: string
          id: string
          name: string
          phone: string | null
          tenant_id: string
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          active?: boolean
          commission_percent?: number
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          tenant_id: string
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          active?: boolean
          commission_percent?: number
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          tenant_id?: string
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sellers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_items: {
        Row: {
          created_at: string | null
          id: string
          inventory_id: string | null
          quantity: number | null
          service_order_id: string | null
          tenant_id: string
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_id?: string | null
          quantity?: number | null
          service_order_id?: string | null
          tenant_id: string
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_id?: string | null
          quantity?: number | null
          service_order_id?: string | null
          tenant_id?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_order_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_items_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_items_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "v_service_orders_without_nfse"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          burial_date: string | null
          burial_id: string | null
          cemetery_location: string | null
          contract_id: string | null
          created_at: string | null
          deceased_id: string
          deceased_name: string
          deceased_type: string
          id: string
          nfse_id: string | null
          nfse_required: boolean
          nfse_status: string | null
          notes: string | null
          responsavel_cpf: string | null
          responsavel_email: string | null
          responsavel_name: string | null
          responsavel_phone: string | null
          status: string | null
          tenant_id: string
          total_amount: number | null
          tracking_token: string | null
          vehicle_id: string | null
        }
        Insert: {
          burial_date?: string | null
          burial_id?: string | null
          cemetery_location?: string | null
          contract_id?: string | null
          created_at?: string | null
          deceased_id: string
          deceased_name: string
          deceased_type: string
          id?: string
          nfse_id?: string | null
          nfse_required?: boolean
          nfse_status?: string | null
          notes?: string | null
          responsavel_cpf?: string | null
          responsavel_email?: string | null
          responsavel_name?: string | null
          responsavel_phone?: string | null
          status?: string | null
          tenant_id: string
          total_amount?: number | null
          tracking_token?: string | null
          vehicle_id?: string | null
        }
        Update: {
          burial_date?: string | null
          burial_id?: string | null
          cemetery_location?: string | null
          contract_id?: string | null
          created_at?: string | null
          deceased_id?: string
          deceased_name?: string
          deceased_type?: string
          id?: string
          nfse_id?: string | null
          nfse_required?: boolean
          nfse_status?: string | null
          notes?: string | null
          responsavel_cpf?: string | null
          responsavel_email?: string | null
          responsavel_name?: string | null
          responsavel_phone?: string | null
          status?: string | null
          tenant_id?: string
          total_amount?: number | null
          tracking_token?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_burial_id_fkey"
            columns: ["burial_id"]
            isOneToOne: false
            referencedRelation: "chapel_burials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_nfse_id_fkey"
            columns: ["nfse_id"]
            isOneToOne: false
            referencedRelation: "fiscal_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_items: {
        Row: {
          category: string
          created_at: string | null
          id: string
          min_quantity: number
          name: string
          quantity: number
          tenant_id: string | null
          unit_cost: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          min_quantity?: number
          name: string
          quantity?: number
          tenant_id?: string | null
          unit_cost?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          min_quantity?: number
          name?: string
          quantity?: number
          tenant_id?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string | null
          id: string
          quantity: number
          reason: string | null
          stock_item_id: string | null
          tenant_id: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          quantity: number
          reason?: string | null
          stock_item_id?: string | null
          tenant_id?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          quantity?: number
          reason?: string | null
          stock_item_id?: string | null
          tenant_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_whatsapp_numbers: {
        Row: {
          active: boolean
          created_at: string | null
          evolution_instance: string
          id: string
          tenant_id: string
          whatsapp_number: string
        }
        Insert: {
          active?: boolean
          created_at?: string | null
          evolution_instance: string
          id?: string
          tenant_id: string
          whatsapp_number: string
        }
        Update: {
          active?: boolean
          created_at?: string | null
          evolution_instance?: string
          id?: string
          tenant_id?: string
          whatsapp_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_whatsapp_numbers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          asaas_api_key: string | null
          asaas_environment: string | null
          asaas_wallet_id: string | null
          asaas_webhook_token_hash: string | null
          cnpj: string
          commercial_plan: string | null
          created_at: string | null
          fiscal_api_key: string | null
          fiscal_auto_emit: boolean
          fiscal_cnae: string | null
          fiscal_company_address: string | null
          fiscal_company_city: string | null
          fiscal_company_document: string | null
          fiscal_company_email: string | null
          fiscal_company_ibge_code: string | null
          fiscal_company_name: string | null
          fiscal_company_neighborhood: string | null
          fiscal_company_number: string | null
          fiscal_company_phone: string | null
          fiscal_company_state: string | null
          fiscal_company_tax_regime: string | null
          fiscal_company_zip: string | null
          fiscal_default_iss_rate: number | null
          fiscal_default_service_code: string | null
          fiscal_default_service_description: string | null
          fiscal_environment: string | null
          fiscal_last_test_at: string | null
          fiscal_last_test_status: string | null
          fiscal_provider: string | null
          id: string
          issuance_city: string | null
          logo_url: string | null
          municipal_license_number: string | null
          name: string
          phone_emergency: string | null
          pix_key: string | null
          primary_color: string | null
          status: string | null
          technical_manager: string | null
          tenant_id: string | null
          trade_name: string | null
        }
        Insert: {
          asaas_api_key?: string | null
          asaas_environment?: string | null
          asaas_wallet_id?: string | null
          asaas_webhook_token_hash?: string | null
          cnpj: string
          commercial_plan?: string | null
          created_at?: string | null
          fiscal_api_key?: string | null
          fiscal_auto_emit?: boolean
          fiscal_cnae?: string | null
          fiscal_company_address?: string | null
          fiscal_company_city?: string | null
          fiscal_company_document?: string | null
          fiscal_company_email?: string | null
          fiscal_company_ibge_code?: string | null
          fiscal_company_name?: string | null
          fiscal_company_neighborhood?: string | null
          fiscal_company_number?: string | null
          fiscal_company_phone?: string | null
          fiscal_company_state?: string | null
          fiscal_company_tax_regime?: string | null
          fiscal_company_zip?: string | null
          fiscal_default_iss_rate?: number | null
          fiscal_default_service_code?: string | null
          fiscal_default_service_description?: string | null
          fiscal_environment?: string | null
          fiscal_last_test_at?: string | null
          fiscal_last_test_status?: string | null
          fiscal_provider?: string | null
          id?: string
          issuance_city?: string | null
          logo_url?: string | null
          municipal_license_number?: string | null
          name: string
          phone_emergency?: string | null
          pix_key?: string | null
          primary_color?: string | null
          status?: string | null
          technical_manager?: string | null
          tenant_id?: string | null
          trade_name?: string | null
        }
        Update: {
          asaas_api_key?: string | null
          asaas_environment?: string | null
          asaas_wallet_id?: string | null
          asaas_webhook_token_hash?: string | null
          cnpj?: string
          commercial_plan?: string | null
          created_at?: string | null
          fiscal_api_key?: string | null
          fiscal_auto_emit?: boolean
          fiscal_cnae?: string | null
          fiscal_company_address?: string | null
          fiscal_company_city?: string | null
          fiscal_company_document?: string | null
          fiscal_company_email?: string | null
          fiscal_company_ibge_code?: string | null
          fiscal_company_name?: string | null
          fiscal_company_neighborhood?: string | null
          fiscal_company_number?: string | null
          fiscal_company_phone?: string | null
          fiscal_company_state?: string | null
          fiscal_company_tax_regime?: string | null
          fiscal_company_zip?: string | null
          fiscal_default_iss_rate?: number | null
          fiscal_default_service_code?: string | null
          fiscal_default_service_description?: string | null
          fiscal_environment?: string | null
          fiscal_last_test_at?: string | null
          fiscal_last_test_status?: string | null
          fiscal_provider?: string | null
          id?: string
          issuance_city?: string | null
          logo_url?: string | null
          municipal_license_number?: string | null
          name?: string
          phone_emergency?: string | null
          pix_key?: string | null
          primary_color?: string | null
          status?: string | null
          technical_manager?: string | null
          tenant_id?: string | null
          trade_name?: string | null
        }
        Relationships: []
      }
      thanatopraxy_records: {
        Row: {
          arterial_fluid_ml: number | null
          body_condition: string | null
          cavity_fluid_ml: number | null
          contract_id: string | null
          created_at: string | null
          death_cause: string | null
          deceased_name: string
          dispatch_id: string | null
          id: string
          method: string
          observations: string | null
          other_supplies: string | null
          preservation_validity_hours: number | null
          procedure_date: string | null
          tenant_id: string
          thanatopractor_name: string
          thanatopractor_register: string | null
        }
        Insert: {
          arterial_fluid_ml?: number | null
          body_condition?: string | null
          cavity_fluid_ml?: number | null
          contract_id?: string | null
          created_at?: string | null
          death_cause?: string | null
          deceased_name: string
          dispatch_id?: string | null
          id?: string
          method?: string
          observations?: string | null
          other_supplies?: string | null
          preservation_validity_hours?: number | null
          procedure_date?: string | null
          tenant_id: string
          thanatopractor_name: string
          thanatopractor_register?: string | null
        }
        Update: {
          arterial_fluid_ml?: number | null
          body_condition?: string | null
          cavity_fluid_ml?: number | null
          contract_id?: string | null
          created_at?: string | null
          death_cause?: string | null
          deceased_name?: string
          dispatch_id?: string | null
          id?: string
          method?: string
          observations?: string | null
          other_supplies?: string | null
          preservation_validity_hours?: number | null
          procedure_date?: string | null
          tenant_id?: string
          thanatopractor_name?: string
          thanatopractor_register?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string | null
          created_at: string | null
          driver_name: string | null
          fuel_level: string | null
          id: string
          model: string
          notes: string | null
          plate: string
          status: string | null
          tenant_id: string
          year: number | null
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          driver_name?: string | null
          fuel_level?: string | null
          id?: string
          model: string
          notes?: string | null
          plate: string
          status?: string | null
          tenant_id?: string
          year?: number | null
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          driver_name?: string | null
          fuel_level?: string | null
          id?: string
          model?: string
          notes?: string | null
          plate?: string
          status?: string | null
          tenant_id?: string
          year?: number | null
        }
        Relationships: []
      }
      wake_rooms: {
        Row: {
          capacity: number | null
          created_at: string | null
          id: string
          name: string
          status: string
          tenant_id: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          name: string
          status?: string
          tenant_id?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          name?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          asaas_payment_id: string | null
          event: string | null
          id: string
          last_retried_at: string | null
          payload: Json | null
          processed: boolean
          processed_at: string | null
          provider: string
          received_at: string
          retry_count: number
          retry_error: string | null
          skipped_reason: string | null
          tenant_id: string | null
        }
        Insert: {
          asaas_payment_id?: string | null
          event?: string | null
          id?: string
          last_retried_at?: string | null
          payload?: Json | null
          processed?: boolean
          processed_at?: string | null
          provider?: string
          received_at?: string
          retry_count?: number
          retry_error?: string | null
          skipped_reason?: string | null
          tenant_id?: string | null
        }
        Update: {
          asaas_payment_id?: string | null
          event?: string | null
          id?: string
          last_retried_at?: string | null
          payload?: Json | null
          processed?: boolean
          processed_at?: string | null
          provider?: string
          received_at?: string
          retry_count?: number
          retry_error?: string | null
          skipped_reason?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string
          gateway: string | null
          id: string
          payload: Json
          status: string | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          gateway?: string | null
          id?: string
          payload: Json
          status?: string | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          gateway?: string | null
          id?: string
          payload?: Json
          status?: string | null
          tenant_id?: string | null
        }
        Relationships: []
      }
      whatsapp_agent_sessions: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          phone: string
          step: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json
          id?: string
          phone: string
          step?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          phone?: string
          step?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_agent_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_service_orders_without_nfse: {
        Row: {
          burial_date: string | null
          contract_id: string | null
          created_at: string | null
          deceased_name: string | null
          id: string | null
          nfse_required: boolean | null
          tenant_id: string | null
          total_amount: number | null
        }
        Insert: {
          burial_date?: string | null
          contract_id?: string | null
          created_at?: string | null
          deceased_name?: string | null
          id?: string | null
          nfse_required?: boolean | null
          tenant_id?: string | null
          total_amount?: number | null
        }
        Update: {
          burial_date?: string | null
          contract_id?: string | null
          created_at?: string | null
          deceased_name?: string | null
          id?: string | null
          nfse_required?: boolean | null
          tenant_id?: string | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_tenant_id: { Args: never; Returns: string }
      decrement_stock:
        | { Args: { item_id: string; qty: number }; Returns: undefined }
        | {
            Args: { p_item_id: string; p_tenant_id: string; qty: number }
            Returns: undefined
          }
      get_current_tenant_id: { Args: never; Returns: string }
      get_user_tenant_id: { Args: never; Returns: string }
      increment_stock: {
        Args: { p_item_id: string; p_tenant_id: string; qty: number }
        Returns: undefined
      }
      is_superadmin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

