import DatabaseConstructor from 'better-sqlite3'
import { CampeonatoCustomer, EquipeCustomer, NewCampeonatoCustomer } from '../shared/types/interfaces'

export class CampeonatoModel {
  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
    this.criarTabela()
  }

  private criarTabela() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS campeonatos(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        data_inicial TEXT NOT NULL,
        data_final TEXT NOT NULL,
        ativo INTEGER DEFAULT 1,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }

  listar(): CampeonatoCustomer[] {
    const stmt = this.db.prepare(`
      SELECT id, nome, data_inicial, data_final, ativo, criado_em
      FROM campeonatos
      ORDER BY id DESC
    `)

    return stmt.all() as CampeonatoCustomer[]
  }

  getCampeonatoAtivo(): { id: number } | undefined {
    const stmt = this.db.prepare(`
      SELECT id
      FROM campeonatos
      WHERE ativo = 1
      ORDER BY id DESC
      LIMIT 1
    `)

    return stmt.get() as { id: number } | undefined
  }

  getById(id: number): CampeonatoCustomer | null {
    const stmt = this.db.prepare(`
      SELECT id, nome, data_inicial, data_final, ativo, criado_em
      FROM campeonatos
      WHERE id = ?
      LIMIT 1
    `)

    return (stmt.get(id) ?? null) as CampeonatoCustomer | null
  }

  listarEquipesByCampeonatoId(id: number) {
    const equipes = this.db
      .prepare(
        `
          SELECT e.id, e.nome, e.setor, e.criado_em
          FROM equipes e
          WHERE e.id_campeonato = ?
        `
      )
      .all(id)

    const total = this.db
      .prepare(
        `
          SELECT COUNT(*)
          FROM equipes
          WHERE id_campeonato = ?
        `
      )
      .pluck()
      .get(id)

    return {
      totalEquipes: String(total),
      equipes: equipes as EquipeCustomer[]
    }
  }

  edit(data: CampeonatoCustomer): CampeonatoCustomer | null {
    const stmt = this.db.prepare(`
      UPDATE campeonatos
      SET nome = ?,
          data_inicial = ?,
          data_final = ?,
          ativo = ?
      WHERE id = ?
    `)

    const result = stmt.run(data.nome, data.data_inicial, data.data_final, data.ativo ?? 0, data.id)

    if (result.changes === 0) {
      return null
    }

    return this.getById(data.id)
  }

  add(data: NewCampeonatoCustomer): NewCampeonatoCustomer {
    const transaction = this.db.transaction(() => {
      // Mantem apenas 1 campeonato no banco e remove todos os dados operacionais anteriores.
      this.db.prepare('DELETE FROM peixes').run()
      this.db.prepare('DELETE FROM atletas').run()
      this.db.prepare('DELETE FROM equipes').run()
      this.db.prepare('DELETE FROM campeonatos').run()

      const stmt = this.db.prepare(`
        INSERT INTO campeonatos (nome, data_inicial, data_final, ativo, criado_em)
        VALUES (?, ?, ?, 1, ?)
      `)

      const res = stmt.run(data.nome, data.data_inicial, data.data_final, data.criado_em)

      return this.db
        .prepare(
          `
            SELECT id, nome, data_inicial, data_final, ativo, criado_em
            FROM campeonatos
            WHERE id = ?
          `
        )
        .get(res.lastInsertRowid)
    })

    return transaction() as NewCampeonatoCustomer
  }

  encerrar(id: number): boolean {
    const stmt = this.db.prepare(`
      UPDATE campeonatos
      SET ativo = 0,
          data_final = CASE
            WHEN data_final IS NULL OR TRIM(data_final) = '' THEN CURRENT_TIMESTAMP
            ELSE data_final
          END
      WHERE id = ?
    `)

    const result = stmt.run(id)

    return result.changes > 0
  }
}
