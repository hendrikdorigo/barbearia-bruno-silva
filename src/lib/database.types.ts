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
          atendimento_concluido_em: string | null
          atendimento_iniciado_em: string | null
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
          atendimento_concluido_em?: string | null
          atendimento_iniciado_em?: string | null
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
        Update: {
          atendimento_concluido_em?: string | null
          atendimento_iniciado_em?: string | null
          barbeiro_id?: string
          checkin_at?: string | null
          cliente_id?: string
          created_at?: string
          data_hora?: string
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"] | null
          id?: string
          observacao?: string | null
          pagamento_antecipado?: boolean
          servico_id?: string
          status?: Database["public"]["Enums"]["agendamento_status"]
          updated_at?: string
          valor_repasse_bruno?: number
          valor_servico?: number
        }
      }
      app_popups: {
        Row: {
          ativo: boolean
          conteudo_url: string | null
          created_at: string
          criado_por: string | null
          data_fim: string | null
          data_inicio: string | null
          id: string
          is_boas_vindas: boolean
          mensagem: string | null
          publico: Database["public"]["Enums"]["popup_publico"]
          tipo: Database["public"]["Enums"]["popup_tipo"]
          titulo: string
        }
        Insert: {
          ativo?: boolean
          conteudo_url?: string | null
          created_at?: string
          criado_por?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          is_boas_vindas?: boolean
          mensagem?: string | null
          publico?: Database["public"]["Enums"]["popup_publico"]
          tipo: Database["public"]["Enums"]["popup_tipo"]
          titulo: string
        }
        Update: {
          ativo?: boolean
          conteudo_url?: string | null
          created_at?: string
          criado_por?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          is_boas_vindas?: boolean
          mensagem?: string | null
          publico?: Database["public"]["Enums"]["popup_publico"]
          tipo?: Database["public"]["Enums"]["popup_tipo"]
          titulo?: string
        }
      }
      barbeiro_bloqueios: {
        Row: {
          barbeiro_id: string
          created_at: string
          data: string | null
          dia_semana: number | null
          hora_fim: string
          hora_inicio: string
          id: string
          motivo: string | null
          updated_at: string
        }
        Insert: {
          barbeiro_id: string
          created_at?: string
          data?: string | null
          dia_semana?: number | null
          hora_fim: string
          hora_inicio: string
          id?: string
          motivo?: string | null
          updated_at?: string
        }
        Update: {
          barbeiro_id?: string
          created_at?: string
          data?: string | null
          dia_semana?: number | null
          hora_fim?: string
          hora_inicio?: string
          id?: string
          motivo?: string | null
          updated_at?: string
        }
      }
      barbeiro_excecoes: {
        Row: {
          ativo: boolean
          barbeiro_id: string
          created_at: string
          data: string
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          motivo: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          barbeiro_id: string
          created_at?: string
          data: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          motivo?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          barbeiro_id?: string
          created_at?: string
          data?: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          motivo?: string | null
          updated_at?: string
        }
      }
      barbeiro_horarios: {
        Row: {
          ativo: boolean
          barbeiro_id: string
          created_at: string
          dia_semana: number
          hora_fim: string
          hora_inicio: string
          id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          barbeiro_id: string
          created_at?: string
          dia_semana: number
          hora_fim?: string
          hora_inicio?: string
          id?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          barbeiro_id?: string
          created_at?: string
          dia_semana?: number
          hora_fim?: string
          hora_inicio?: string
          id?: string
          updated_at?: string
        }
      }
      barbeiro_servicos: {
        Row: {
          ativo: boolean
          barbeiro_id: string
          created_at: string
          preco_personalizado: number | null
          servico_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          barbeiro_id: string
          created_at?: string
          preco_personalizado?: number | null
          servico_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          barbeiro_id?: string
          created_at?: string
          preco_personalizado?: number | null
          servico_id?: string
          updated_at?: string
        }
      }
      barbeiros: {
        Row: {
          ativo: boolean
          banner_url: string | null
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
          banner_url?: string | null
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
        Update: {
          ativo?: boolean
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          especialidades?: string[]
          google_calendar_access_token?: string | null
          google_calendar_connected?: boolean
          google_calendar_refresh_token?: string | null
          google_calendar_token_expiry?: string | null
          is_dono?: boolean
          portfolio_imagens?: string[]
          profile_id?: string
        }
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
        Update: {
          cpf?: string
          created_at?: string
          data_nascimento?: string
          exige_pagamento_antecipado?: boolean
          foto_url?: string | null
          profile_id?: string
          qtd_no_show?: number
        }
      }
      comanda_itens: {
        Row: {
          comanda_id: string
          created_at: string
          id: string
          preco_unitario: number
          produto_id: string
          quantidade: number
        }
        Insert: {
          comanda_id: string
          created_at?: string
          id?: string
          preco_unitario?: number
          produto_id: string
          quantidade?: number
        }
        Update: {
          comanda_id?: string
          created_at?: string
          id?: string
          preco_unitario?: number
          produto_id?: string
          quantidade?: number
        }
      }
      comandas: {
        Row: {
          agendamento_id: string
          barbeiro_id: string
          cliente_id: string
          confirmado_caixa_em: string | null
          confirmado_caixa_por: string | null
          created_at: string
          fechada_em: string | null
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"] | null
          id: string
          pago_antecipado: boolean
          status: Database["public"]["Enums"]["comanda_status"]
          updated_at: string
          valor_produtos: number
          valor_servico: number
        }
        Insert: {
          agendamento_id: string
          barbeiro_id: string
          cliente_id: string
          confirmado_caixa_em?: string | null
          confirmado_caixa_por?: string | null
          created_at?: string
          fechada_em?: string | null
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"] | null
          id?: string
          pago_antecipado?: boolean
          status?: Database["public"]["Enums"]["comanda_status"]
          updated_at?: string
          valor_produtos?: number
          valor_servico?: number
        }
        Update: {
          agendamento_id?: string
          barbeiro_id?: string
          cliente_id?: string
          confirmado_caixa_em?: string | null
          confirmado_caixa_por?: string | null
          created_at?: string
          fechada_em?: string | null
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"] | null
          id?: string
          pago_antecipado?: boolean
          status?: Database["public"]["Enums"]["comanda_status"]
          updated_at?: string
          valor_produtos?: number
          valor_servico?: number
        }
      }
      feedbacks: {
        Row: {
          agendamento_id: string | null
          barbeiro_id: string
          cliente_id: string
          comentario: string | null
          comentario_preset: string | null
          created_at: string
          id: string
          nota: number
        }
        Insert: {
          agendamento_id?: string | null
          barbeiro_id: string
          cliente_id: string
          comentario?: string | null
          comentario_preset?: string | null
          created_at?: string
          id?: string
          nota: number
        }
        Update: {
          agendamento_id?: string | null
          barbeiro_id?: string
          cliente_id?: string
          comentario?: string | null
          comentario_preset?: string | null
          created_at?: string
          id?: string
          nota?: number
        }
      }
      fidelidade_config: {
        Row: {
          ativo: boolean
          barbeiro_id: string
          created_at: string
          id: string
          meta_atendimentos: number
          premio_descricao: string
        }
        Insert: {
          ativo?: boolean
          barbeiro_id: string
          created_at?: string
          id?: string
          meta_atendimentos: number
          premio_descricao: string
        }
        Update: {
          ativo?: boolean
          barbeiro_id?: string
          created_at?: string
          id?: string
          meta_atendimentos?: number
          premio_descricao?: string
        }
      }
      fidelidade_progresso: {
        Row: {
          atendimentos_concluidos: number
          barbeiro_id: string
          cliente_id: string
          ultimo_marco_atingido: number
          updated_at: string
        }
        Insert: {
          atendimentos_concluidos?: number
          barbeiro_id: string
          cliente_id: string
          ultimo_marco_atingido?: number
          updated_at?: string
        }
        Update: {
          atendimentos_concluidos?: number
          barbeiro_id?: string
          cliente_id?: string
          ultimo_marco_atingido?: number
          updated_at?: string
        }
      }
      fila_espera: {
        Row: {
          agendamento_id: string | null
          barbeiro_id: string
          cliente_id: string
          created_at: string
          data: string
          expira_em: string | null
          hora: string | null
          id: string
          notificado_em: string | null
          servico_id: string | null
          status: Database["public"]["Enums"]["fila_status"]
          updated_at: string
        }
        Insert: {
          agendamento_id?: string | null
          barbeiro_id: string
          cliente_id: string
          created_at?: string
          data: string
          expira_em?: string | null
          hora?: string | null
          id?: string
          notificado_em?: string | null
          servico_id?: string | null
          status?: Database["public"]["Enums"]["fila_status"]
          updated_at?: string
        }
        Update: {
          agendamento_id?: string | null
          barbeiro_id?: string
          cliente_id?: string
          created_at?: string
          data?: string
          expira_em?: string | null
          hora?: string | null
          id?: string
          notificado_em?: string | null
          servico_id?: string | null
          status?: Database["public"]["Enums"]["fila_status"]
          updated_at?: string
        }
      }
      lembretes_whatsapp: {
        Row: {
          agendado_para: string
          agendamento_id: string | null
          created_at: string
          enviado_em: string | null
          erro: string | null
          id: string
          mensagem: string | null
          referencia_id: string | null
          status_envio: Database["public"]["Enums"]["envio_status"]
          telefone_destino: string | null
          tentativas: number
          tipo: string
        }
        Insert: {
          agendado_para: string
          agendamento_id?: string | null
          created_at?: string
          enviado_em?: string | null
          erro?: string | null
          id?: string
          mensagem?: string | null
          referencia_id?: string | null
          status_envio?: Database["public"]["Enums"]["envio_status"]
          telefone_destino?: string | null
          tentativas?: number
          tipo?: string
        }
        Update: {
          agendado_para?: string
          agendamento_id?: string | null
          created_at?: string
          enviado_em?: string | null
          erro?: string | null
          id?: string
          mensagem?: string | null
          referencia_id?: string | null
          status_envio?: Database["public"]["Enums"]["envio_status"]
          telefone_destino?: string | null
          tentativas?: number
          tipo?: string
        }
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
        Update: {
          created_at?: string
          id?: string
          lida?: boolean
          mensagem?: string
          profile_id?: string
          referencia_id?: string | null
          tipo?: string
          titulo?: string
        }
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
        Update: {
          agendamento_id?: string
          created_at?: string
          gateway_referencia?: string | null
          id?: string
          metodo?: Database["public"]["Enums"]["forma_pagamento"]
          status?: Database["public"]["Enums"]["pagamento_status"]
          valor?: number
        }
      }
      popup_visualizacoes: {
        Row: {
          popup_id: string
          profile_id: string
          visualizado_em: string
        }
        Insert: {
          popup_id: string
          profile_id: string
          visualizado_em?: string
        }
        Update: {
          popup_id?: string
          profile_id?: string
          visualizado_em?: string
        }
      }
      post_comentarios: {
        Row: {
          cliente_id: string
          comentario: string
          created_at: string
          id: string
          mencoes: string[]
          post_id: string
        }
        Insert: {
          cliente_id: string
          comentario: string
          created_at?: string
          id?: string
          mencoes?: string[]
          post_id: string
        }
        Update: {
          cliente_id?: string
          comentario?: string
          created_at?: string
          id?: string
          mencoes?: string[]
          post_id?: string
        }
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
        Update: {
          cliente_id?: string
          created_at?: string
          post_id?: string
        }
      }
      posts_comunidade: {
        Row: {
          barbeiro_id: string
          conteudo_url: string | null
          created_at: string
          id: string
          mencoes: string[]
          texto: string | null
          tipo: Database["public"]["Enums"]["post_tipo"]
        }
        Insert: {
          barbeiro_id: string
          conteudo_url?: string | null
          created_at?: string
          id?: string
          mencoes?: string[]
          texto?: string | null
          tipo: Database["public"]["Enums"]["post_tipo"]
        }
        Update: {
          barbeiro_id?: string
          conteudo_url?: string | null
          created_at?: string
          id?: string
          mencoes?: string[]
          texto?: string | null
          tipo?: Database["public"]["Enums"]["post_tipo"]
        }
      }
      produtos: {
        Row: {
          ativo: boolean
          categoria: string | null
          created_at: string
          descricao: string | null
          estoque: number | null
          id: string
          imagem_url: string | null
          nome: string
          preco: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          estoque?: number | null
          id?: string
          imagem_url?: string | null
          nome: string
          preco: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          estoque?: number | null
          id?: string
          imagem_url?: string | null
          nome?: string
          preco?: number
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          nome: string
          notif_whatsapp_comunidade: boolean
          role: Database["public"]["Enums"]["user_role"]
          telefone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          nome: string
          notif_whatsapp_comunidade?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          nome?: string
          notif_whatsapp_comunidade?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          telefone?: string | null
          updated_at?: string
        }
      }
      servico_ajustes: {
        Row: {
          ativo: boolean
          barbeiro_id: string
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          dia_semana: number | null
          id: string
          motivo: string | null
          servico_id: string | null
          tipo: Database["public"]["Enums"]["ajuste_tipo"]
          valor: number
          valor_tipo: Database["public"]["Enums"]["ajuste_valor_tipo"]
        }
        Insert: {
          ativo?: boolean
          barbeiro_id: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          dia_semana?: number | null
          id?: string
          motivo?: string | null
          servico_id?: string | null
          tipo: Database["public"]["Enums"]["ajuste_tipo"]
          valor: number
          valor_tipo: Database["public"]["Enums"]["ajuste_valor_tipo"]
        }
        Update: {
          ativo?: boolean
          barbeiro_id?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          dia_semana?: number | null
          id?: string
          motivo?: string | null
          servico_id?: string | null
          tipo?: Database["public"]["Enums"]["ajuste_tipo"]
          valor?: number
          valor_tipo?: Database["public"]["Enums"]["ajuste_valor_tipo"]
        }
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
        Update: {
          ativo?: boolean
          created_at?: string
          duracao_minutos?: number
          id?: string
          nome?: string
          preco?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aceitar_vaga_fila: { Args: { p_fila_id: string }; Returns: string }
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
      ajuste_tipo: "desconto" | "acrescimo"
      ajuste_valor_tipo: "percentual" | "fixo"
      comanda_status: "aberta" | "aguardando_pagamento" | "paga" | "fechada"
      envio_status: "agendado" | "enviado" | "falhou" | "cancelado"
      fila_status: "aguardando" | "notificado" | "aceito" | "expirado" | "cancelado"
      forma_pagamento: "credito" | "debito" | "dinheiro" | "pix"
      pagamento_status: "pendente" | "aprovado" | "recusado" | "estornado"
      popup_publico: "todos" | "clientes" | "barbeiros"
      popup_tipo: "video" | "imagem" | "texto"
      post_tipo: "imagem" | "video" | "texto"
      user_role: "cliente" | "barbeiro" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
