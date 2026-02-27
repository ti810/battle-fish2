import DatabaseConstructor from 'better-sqlite3'
import { 
    DashboardPeixeCustomer,
    DashboardEquipeCustomer,
    DashboardAtletaCustomer,
    DashboardSemLancamentoCustomer,
    DashboardSetorCustomer,
    DasboardLancamentoCustomer,
    DashboardCampeonatoCustomer,
    DashboardTotalLancamentoCustomer,
 } from '../shared/types/interfaces'

export class DashboardModel {
  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
  }

  campeonato(): DashboardCampeonatoCustomer {
    const stmt = this.db.prepare(`
        SELECT nome AS nome_campeonato
        FROM campeonatos
        WHERE ativo IS 1
        LIMIT 1`)

        return stmt.get() as DashboardCampeonatoCustomer
  }
 
  totalLancamento(): DashboardTotalLancamentoCustomer {
    const stmt = this.db.prepare(`
        SELECT COUNT(*) AS total_lancamento
        FROM peixes
        WHERE deletado_em IS NULL`)

        return stmt.get() as DashboardTotalLancamentoCustomer
  }

  maiorPeixe(): DashboardPeixeCustomer {
    const stmt = this.db.prepare(`
        SELECT
            p.peso AS maior_peixe,
            e.nome AS nome_equipe
        FROM peixes p
        JOIN equipes e ON e.id = p.equipe_id
        ORDER BY p.peso DESC, p.id ASC
        LIMIT 1 `)

    return stmt.get() as DashboardPeixeCustomer
  }

  totalEquipe(): DashboardEquipeCustomer {
    const stmt = this.db.prepare(`
       SELECT COUNT(*) AS total_equipe
       FROM equipes
       WHERE ativo IS 1 `)

       return stmt.get() as DashboardEquipeCustomer
  }

  totalAtleta(): DashboardAtletaCustomer {
    const stmt = this.db.prepare(`
        SELECT COUNT(*) AS total_atleta
        FROM atletas
        WHERE deletado_em IS NULL  `)

        return stmt.get() as DashboardAtletaCustomer
  }

  ultimosLances(): DasboardLancamentoCustomer[]{
    const stmt = this.db.prepare(`
       SELECT
            e.nome  AS nome_equipe,
            p.peso  AS peso_peixe,
            e.setor AS setor
        FROM peixes p
        JOIN equipes e ON e.id = p.equipe_id
        ORDER BY p.id DESC
        LIMIT 5 `)

        return stmt.all() as DasboardLancamentoCustomer[]
  }

  setorAtivos(): DashboardSetorCustomer[] {
    const stmt = this.db.prepare(`
        SELECT
            e.setor AS numero_setor,
            COUNT(p.id) AS lancamentos
        FROM peixes p
        JOIN equipes e ON e.id = p.equipe_id
        GROUP BY
            e.setor
        ORDER BY
            lancamentos DESC
        LIMIT 3`)

        return stmt.all() as DashboardSetorCustomer[]
  }

  setorSem(): DashboardSemLancamentoCustomer {
    const stmt = this.db.prepare(`
        SELECT COUNT(DISTINCT e.id) AS total_equipe
        FROM equipes e
        LEFT JOIN peixes p ON p.equipe_id = e.id
        WHERE p.id IS NULL`)

        return stmt.get() as DashboardSemLancamentoCustomer
  }
}