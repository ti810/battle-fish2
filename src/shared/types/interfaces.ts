export interface NewUserCustomer {
  nome: string
  email?: string
  usuario?: string
  senha: string
  is_master?: number
}

export interface UserCustomer {
  id: number
  nome: string
  usuario?: string | null
  email?: string | null
  senha?: string
  is_master?: number
  grupo_id?: number
  criado_em?: string
}

export interface AuthUserCustomer {
  id: number
  nome: string
  usuario: string
  is_master: number
}

export interface AlterarSenhaPayload {
  actor_user_id: number
  senha_atual: string
  nova_senha: string
}

export interface AtualizarUsuarioPerfilPayload {
  actor_user_id: number
  target_user_id: number
  nome: string
  usuario: string
  email: string
}

export interface UserLogCustomer {
  id: number
  usuario_id: number | null
  usuario_nome: string | null
  usuario_login: string | null
  acao: string
  detalhes: string
  criado_em: string
}

export interface SaveSistemaConfigPayload {
  actor_user_id: number
  empresa_nome: string
  cnpj: string
  endereco: string
  telefone?: string
  email?: string
  licenca_chave?: string
  access_user: {
    id?: number | null
    nome: string
    usuario: string
    senha: string
  }
}

export interface AtivarLicencaPayload {
  actor_user_id: number
  licenca_chave: string
}

export interface ValidarLicencaPayload {
  actor_user_id: number
}

export interface SistemaConfigCustomer {
  id: number
  empresa_nome: string
  cnpj: string
  endereco: string
  telefone: string
  email: string
  licenca_chave: string
  licenca_ativa: number
  licenca_ultima_verificacao_em: string | null
  licenca_ultimo_horario_local_em: string | null
  atualizado_em: string
  usuario_acesso_id: number | null
  usuario_acesso_nome: string | null
  usuario_acesso_login: string | null
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
  equipe_setor?: string
  equipe_nome?: string
  equipe_tipo?: TipoEquipe
}

export type TipoEquipe = 'Masculino' | 'Misto' | 'Senior'

export interface NewEquipeCustomer {
  nome: string
  ativo?: number
  setor?: number
  tipo_equipe: TipoEquipe
  criado_em?: string
  id_campeonato?: number
  atualizado_em?: string
}

export interface EquipeCustomer extends NewEquipeCustomer {
  id: number
}

export interface EquipeCustomerComUltimaCaptura extends NewEquipeCustomer {
  id: number
  nome: string
  ativo?: number
  qtde_atletas: number
  setor?: number
  ultima_captura: string | null
  total_peixes: number | null 
  total_atletas: number | null
}

export interface NewPeixeCustomer {
  peso: string
  equipe_id: number
  criado_em?: string
}

export interface PeixeCustomer extends NewPeixeCustomer {
  id: number
}

export interface RankingCustomer{
  id: number
  equipe_nome: string
  tipo_equipe: TipoEquipe
  peso_total: number
  quantidade: number
  tamanho: number
  pontos: number
}


export interface NewCampeonatoCustomer { 
  nome: string
  data_inicial: string
  data_final: string
  ativo?: number
  criado_em: string
}

export interface CampeonatoCustomer extends NewCampeonatoCustomer {
  id: number
}

export interface CustodiaCustomer{
  id:number
  peso: string
  equipe: string
  id_equipe: number
  campeonato: string
  setor:number
}

//Dasboard
export interface DashboardCampeonatoCustomer{
  nome_campeonato: string
}

export interface DashboardTotalLancamentoCustomer{
  total_lancamento: number
}
export interface DasboardLancamentoCustomer{
  nome_equipe: string
  peso_peixe: string
  setor: number
}

export interface DashboardSetorCustomer{
  numero_setor: number
  lancamentos: number
}

export interface DashboardPeixeCustomer{
  maior_peixe: number
  nome_equipe: string
}

export interface DashboardEquipeCustomer{
  total_equipe: number
}

export interface DashboardAtletaCustomer{
  total_atleta: number
}

export interface DashboardSemLancamentoCustomer{
  total_equipe: number
}
