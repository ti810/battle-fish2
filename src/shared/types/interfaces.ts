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
  usuario?: string
  criado_em: string
}

export interface NewMemberCustomer {
  nome: string
  grupo_id: number
}

export interface MemberCustomer {
  id: number
  nome: string
  grupo_id: number
}

export interface PeixeCustomer {
  id: number
  tipo: string
  tamanho: string
  peso: string
  id_membro: number
}

export interface NewPeixeCustomer {
  id: number
  tipo: string
  tamanho: string
  peso: string
  id_membro: number
}
