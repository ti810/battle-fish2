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
  criado_em: string
}

export interface AtletaCustomer {
  id: number
  nome?: string
  equipe_id?: number
}

export interface NewEquipeCustomer {
  id: number
  nome: string
  ativo?: number
  qtde_atletas: number
  criado_em: string
}

export interface EquipeCustomer {
  id: number
  nome: string
  ativo?: number
  qtde_atletas: number
}

export interface PeixeCustomer {
  id: number
  tipo: string
  tamanho: string
  peso: string
  id_equipe: number  
}

export interface NewPeixeCustomer {
  id: number
  tipo: string
  tamanho: string
  peso: string
  id_equipe: number
  criado_em: string
}
