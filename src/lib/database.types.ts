export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
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
          google_event_id: string | null
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
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          google_event_id?: string | null
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
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          google_event_id?: string | null
          id?: string
          observacao?: string | null
          pagamento_antecipado?: boolean
          servico_id?: string
          status?: Database["public"]["Enums"]["agendamento_status"]
          updated_at?: string
          valor_repasse_bruno?: number
          valor_servico?: number
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "agendamentos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      app_popups: {
        Row: {
          ativo: boolean
          audiencia_login: string
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
          audiencia_login?: string
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
          audiencia_login?: string
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
        Relationships: [
          {
            foreignKeyName: "app_popups_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "barbeiro_bloqueios_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["profile_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "barbeiro_excecoes_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["profile_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "barbeiro_horarios_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["profile_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "barbeiro_servicos_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "barbeiro_servicos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      barbeiros: {
        Row: {
          ativo: boolean
          banner_url: string | null
          bio: string | null
          comissao_percentual: number
          created_at: string
          especialidades: string[]
          google_calendar_connected: boolean
          is_dono: boolean
          portfolio_imagens: string[]
          profile_id: string
        }
        Insert: {
          ativo?: boolean
          banner_url?: string | null
          bio?: string | null
          comissao_percentual?: number
          created_at?: string
          especialidades?: string[]
          google_calendar_connected?: boolean
          is_dono?: boolean
          portfolio_imagens?: string[]
          profile_id: string
        }
        Update: {
          ativo?: boolean
          banner_url?: string | null
          bio?: string | null
          comissao_percentual?: number
          created_at?: string
          especialidades?: string[]
          google_calendar_connected?: boolean
          is_dono?: boolean
          portfolio_imagens?: string[]
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "barbeiros_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          cpf: string
          created_at: string
          data_nascimento: string
          email: string | null
          exige_pagamento_antecipado: boolean
          foto_url: string | null
          frequencia_dias: number | null
          pre_agendamento_ativo: boolean
          profile_id: string
          qtd_no_show: number
        }
        Insert: {
          cpf: string
          created_at?: string
          data_nascimento: string
          email?: string | null
          exige_pagamento_antecipado?: boolean
          foto_url?: string | null
          frequencia_dias?: number | null
          pre_agendamento_ativo?: boolean
          profile_id: string
          qtd_no_show?: number
        }
        Update: {
          cpf?: string
          created_at?: string
          data_nascimento?: string
          email?: string | null
          exige_pagamento_antecipado?: boolean
          foto_url?: string | null
          frequencia_dias?: number | null
          pre_agendamento_ativo?: boolean
          profile_id?: string
          qtd_no_show?: number
        }
        Relationships: [
          {
            foreignKeyName: "clientes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          preco_unitario: number
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
        Relationships: [
          {
            foreignKeyName: "comanda_itens_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
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
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
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
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          pago_antecipado?: boolean
          status?: Database["public"]["Enums"]["comanda_status"]
          updated_at?: string
          valor_produtos?: number
          valor_servico?: number
        }
        Relationships: [
          {
            foreignKeyName: "comandas_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: true
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "comandas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "comandas_confirmado_caixa_por_fkey"
            columns: ["confirmado_caixa_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_pagamento: {
        Row: {
          desconto_pagamento_antecipado_percentual: number
          id: string
          updated_at: string
        }
        Insert: {
          desconto_pagamento_antecipado_percentual?: number
          id?: string
          updated_at?: string
        }
        Update: {
          desconto_pagamento_antecipado_percentual?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "feedbacks_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedbacks_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "feedbacks_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["profile_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "fidelidade_config_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["profile_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "fidelidade_progresso_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "fidelidade_progresso_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["profile_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "fila_espera_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fila_espera_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "fila_espera_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "fila_espera_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_tokens: {
        Row: {
          access_token: string | null
          barbeiro_id: string
          expiry: string | null
          refresh_token: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          barbeiro_id: string
          expiry?: string | null
          refresh_token?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          barbeiro_id?: string
          expiry?: string | null
          refresh_token?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_tokens_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: true
            referencedRelation: "barbeiros"
            referencedColumns: ["profile_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "lembretes_whatsapp_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "notificacoes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "pagamentos_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "popup_visualizacoes_popup_id_fkey"
            columns: ["popup_id"]
            isOneToOne: false
            referencedRelation: "app_popups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "popup_visualizacoes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_itens: {
        Row: {
          barbeiro_id: string
          created_at: string
          id: string
          legenda: string | null
          ordem: number
          url: string
        }
        Insert: {
          barbeiro_id: string
          created_at?: string
          id?: string
          legenda?: string | null
          ordem?: number
          url: string
        }
        Update: {
          barbeiro_id?: string
          created_at?: string
          id?: string
          legenda?: string | null
          ordem?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_itens_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["profile_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "post_comentarios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "post_comentarios_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_comunidade"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "post_curtidas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "post_curtidas_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_comunidade"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "posts_comunidade_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      pre_agendamentos: {
        Row: {
          agendamento_id: string | null
          barbeiro_id: string
          cliente_id: string
          created_at: string
          data_hora_prevista: string
          id: string
          origem_agendamento_id: string
          servico_id: string
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          agendamento_id?: string | null
          barbeiro_id: string
          cliente_id: string
          created_at?: string
          data_hora_prevista: string
          id?: string
          origem_agendamento_id: string
          servico_id: string
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          agendamento_id?: string | null
          barbeiro_id?: string
          cliente_id?: string
          created_at?: string
          data_hora_prevista?: string
          id?: string
          origem_agendamento_id?: string
          servico_id?: string
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pre_agendamentos_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_agendamentos_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "pre_agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_agendamentos_origem_agendamento_id_fkey"
            columns: ["origem_agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_agendamentos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "servico_ajustes_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "servico_ajustes_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
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
      is_admin: { Args: never; Returns: boolean }
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
      fila_status:
        | "aguardando"
        | "notificado"
        | "aceito"
        | "expirado"
        | "cancelado"
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agendamento_status: [
        "pendente",
        "confirmado",
        "cancelado",
        "no_show",
        "concluido",
      ],
      ajuste_tipo: ["desconto", "acrescimo"],
      ajuste_valor_tipo: ["percentual", "fixo"],
      comanda_status: ["aberta", "aguardando_pagamento", "paga", "fechada"],
      envio_status: ["agendado", "enviado", "falhou", "cancelado"],
      fila_status: [
        "aguardando",
        "notificado",
        "aceito",
        "expirado",
        "cancelado",
      ],
      forma_pagamento: ["credito", "debito", "dinheiro", "pix"],
      pagamento_status: ["pendente", "aprovado", "recusado", "estornado"],
      popup_publico: ["todos", "clientes", "barbeiros"],
      popup_tipo: ["video", "imagem", "texto"],
      post_tipo: ["imagem", "video", "texto"],
      user_role: ["cliente", "barbeiro", "admin"],
    },
  },
} as const
