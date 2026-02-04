export interface NewUserCustomer {
  nome: string
  email?: string
  usuario?: string
  senha: string
}

export interface UserCustomer {
  id: number
  nome: string
  email?: string | null
  grupo_id: number
  usuario?: string
  criado_em: string
}

export interface NewAtletaCustomer {
  nome: string
  equipe_id: number
  criado_em?: string
}

export interface AtletaCustomer {
  id: number
  nome: string
  equipe_id: number
  equipe_setor: string
  equipe_nome: string
}

export interface NewEquipeCustomer {
  nome: string
  ativo?: number
  qtde_atletas: number
  setor: number
  criado_em?: string
  atualizado_em?: string
  deletado_em?: string
}

export interface EquipeCustomer extends NewEquipeCustomer {
  id: number
}

export interface EquipeCustomerComUltimaCaptura extends NewEquipeCustomer {
  id: number
  nome: string
  ativo?: number
  qtde_atletas: number
  setor: number
  ultima_captura: string | null
}

export interface NewPeixeCustomer {
  tipo: string
  tamanho: string
  peso: string
  id_equipe: number
  criado_em: string
}

export interface PeixeCustomer extends NewPeixeCustomer {
  id: number
}