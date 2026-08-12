export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          barbeiro_id: string
          checkin_at: string | null
          cliente_id: string
          created_at: string
          data_hora: string
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"] | null
          id: string
          observacao: string | null
          pagamento_antecipado: boolean
          servico_id: string
          status: Database["public"]["Enums"]["agendamento_status"]
          updated_at: string
          valor_repasse_bruno: number
          valor_servico: number
        }
        Insert: {
          barbeiro_id: string
          checkin_at?: string | null
          cliente_id: string
          created_at?: string
          data_hora: string
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"] | null
          id?: string
          observacao?: string | null
          pagamento_antecipado?: boolean
          servico_id: string
          status?: Database["public"]["Enums"]["agendamento_status"]
          updated_at?: string
          valor_repasse_bruno?: number
          valor_servico: number
        }
        Update: Partial<Database["public"]["Tables"]["agendamentos"]["Insert"]>
      }
      barbeiros: {
        Row: {
          ativo: boolean
          bio: string | null
          created_at: string
          especialidades: string[]
          google_calendar_access_token: string | null
          google_calendar_connected: boolean
          google_calendar_refresh_token: string | null
          google_calendar_token_expiry: string | null
          is_dono: boolean
          portfolio_imagens: string[]
          profile_id: string
        }
        Insert: {
          ativo?: boolean
          bio?: string | null
          created_at?: string
          especialidades?: string[]
          google_calendar_access_token?: string | null
          google_calendar_connected?: boolean
          google_calendar_refresh_token?: string | null
          google_calendar_token_expiry?: string | null
          is_dono?: boolean
          portfolio_imagens?: string[]
          profile_id: string
        }
        Update: Partial<Database["public"]["Tables"]["barbeiros"]["Insert"]>
      }
      clientes: {
        Row: {
          cpf: string
          created_at: string
          data_nascimento: string
          exige_pagamento_antecipado: boolean
          foto_url: string | null
          profile_id: string
          qtd_no_show: number
        }
        Insert: {
          cpf: string
          created_at?: string
          data_nascimento: string
          exige_pagamento_antecipado?: boolean
          foto_url?: string | null
          profile_id: string
          qtd_no_show?: number
        }
        Update: Partial<Database["public"]["Tables"]["clientes"]["Insert"]>
      }
      feedbacks: {
        Row: {
          agendamento_id: string | null
          barbeiro_id: string
          cliente_id: string
          comentario: string | null
          created_at: string
          id: string
          nota: number
        }
        Insert: {
          agendamento_id?: string | null
          barbeiro_id: string
          cliente_id: string
          comentario?: string | null
          created_at?: string
          id?: string
          nota: number
        }
        Update: Partial<Database["public"]["Tables"]["feedbacks"]["Insert"]>
      }
      lembretes_whatsapp: {
        Row: {
          agendado_para: string
          agendamento_id: string
          created_at: string
          enviado_em: string | null
          erro: string | null
          id: string
          mensagem: string | null
          status_envio: Database["public"]["Enums"]["envio_status"]
          telefone_destino: string | null
          tentativas: number
        }
        Insert: {
          agendado_para: string
          agendamento_id: string
          created_at?: string
          enviado_em?: string | null
          erro?: string | null
          id?: string
          mensagem?: string | null
          status_envio?: Database["public"]["Enums"]["envio_status"]
          telefone_destino?: string | null
          tentativas?: number
        }
        Update: Partial<Database["public"]["Tables"]["lembretes_whatsapp"]["Insert"]>
      }
      notificacoes: {
        Row: {
          created_at: string
          id: string
          lida: boolean
          mensagem: string
          profile_id: string
          referencia_id: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean
          mensagem: string
          profile_id: string
          referencia_id?: string | null
          tipo: string
          titulo: string
        }
        Update: Partial<Database["public"]["Tables"]["notificacoes"]["Insert"]>
      }
      pagamentos: {
        Row: {
          agendamento_id: string
          created_at: string
          gateway_referencia: string | null
          id: string
          metodo: Database["public"]["Enums"]["forma_pagamento"]
          status: Database["public"]["Enums"]["pagamento_status"]
          valor: number
        }
        Insert: {
          agendamento_id: string
          created_at?: string
          gateway_referencia?: string | null
          id?: string
          metodo: Database["public"]["Enums"]["forma_pagamento"]
          status?: Database["public"]["Enums"]["pagamento_status"]
          valor: number
        }
        Update: Partial<Database["public"]["Tables"]["pagamentos"]["Insert"]>
      }
      post_comentarios: {
        Row: {
          cliente_id: string
          comentario: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          cliente_id: string
          comentario: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: Partial<Database["public"]["Tables"]["post_comentarios"]["Insert"]>
      }
      post_curtidas: {
        Row: {
          cliente_id: string
          created_at: string
          post_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          post_id: string
        }
        Update: Partial<Database["public"]["Tables"]["post_curtidas"]["Insert"]>
      }
      posts_comunidade: {
        Row: {
          barbeiro_id: string
          conteudo_url: string | null
          created_at: string
          id: string
          texto: string | null
          tipo: Database["public"]["Enums"]["post_tipo"]
        }
        Insert: {
          barbeiro_id: string
          conteudo_url?: string | null
          created_at?: string
          id?: string
          texto?: string | null
          tipo: Database["public"]["Enums"]["post_tipo"]
        }
        Update: Partial<Database["public"]["Tables"]["posts_comunidade"]["Insert"]>
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          nome: string
          role: Database["public"]["Enums"]["user_role"]
          telefone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          nome: string
          role?: Database["public"]["Enums"]["user_role"]
          telefone?: string | null
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
      }
      servicos: {
        Row: {
          ativo: boolean
          created_at: string
          duracao_minutos: number
          id: string
          nome: string
          preco: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          duracao_minutos?: number
          id?: string
          nome: string
          preco: number
        }
        Update: Partial<Database["public"]["Tables"]["servicos"]["Insert"]>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_role_is: {
        Args: { r: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_barbeiro_self: { Args: { p_barbeiro_id: string }; Returns: boolean }
      marcar_no_show: { Args: { p_agendamento_id: string }; Returns: undefined }
    }
    Enums: {
      agendamento_status:
        | "pendente"
        | "confirmado"
        | "cancelado"
        | "no_show"
        | "concluido"
      envio_status: "agendado" | "enviado" | "falhou" | "cancelado"
      forma_pagamento: "credito" | "debito" | "dinheiro" | "pix"
      pagamento_status: "pendente" | "aprovado" | "recusado" | "estornado"
      post_tipo: "imagem" | "video" | "texto"
      user_role: "cliente" | "barbeiro" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
