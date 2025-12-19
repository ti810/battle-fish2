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

export interface NewMemberCustomer {
  nome: string
  grupo_id: number
}

export interface MemberCustomer {
  id: number
  nome: string
  grupo_id: number
}

export interface NewGroupCustomer {
  nome: string
  ativo? : number
  qtde_membros: number
  criado_em: string
}

export interface GroupCustomer {
  id: number
  nome: string
  ativo? : number
  qtde_membros: number
}
