import DatabaseConstructor from 'better-sqlite3'
import { EquipeCustomer, NewEquipeCustomer, PeixeCustomer } from '../shared/types/interfaces'
import z from 'zod'

export class EquipeModel {
  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
    this.criarTabela()
  }

  private criarTabela() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS equipes(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        setor INTERGER NOT NULL,
        qtde_atletas INTEGER NOT NULL,
        ativo INTEGER NOT NULL DEFAULT 1,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TEXT,
        deletado_em TEXT       
      )
    `)
  }

  listar(): EquipeCustomer[] {
    const stmt = this.db.prepare(`
      SELECT id, nome, ativo, qtde_atletas, criado_em
      FROM equipes
      WHERE deletado_em IS NULL
      ORDER BY criado_em DESC
    `)

    return stmt.all() as EquipeCustomer[]
  }

  listarComUltimaCapturaOfPeixe() {
    const stmt = this.db.prepare(`
    SELECT 
      e.id,
      e.nome,
      e.ativo,
      e.setor,
      e.qtde_atletas,
      e.criado_em,
      MAX(p.criado_em) AS ultima_captura
    FROM equipes e
    LEFT JOIN peixes p 
      ON p.id_equipe = e.id 
     AND p.deletado_em IS NULL
    GROUP BY e.id
  `)

    return stmt.all()
  }

  getById(id: number): EquipeCustomer | null {
    const stmt = this.db.prepare(`
      SELECT id, nome, ativo, setor, qtde_atletas, criado_em
      FROM equipes
      WHERE deletado_em IS NULL
        AND id = ?
      LIMIT 1
    `)

    return stmt.get(id) as EquipeCustomer
  }

  edit(data: EquipeCustomer): EquipeCustomer | null {
    const stmt = this.db.prepare(`
      UPDATE equipes
      SET nome = ?, qtde_atletas = ?, setor = ?      
      WHERE id = ?      
    `)

    const result = stmt.run(data.nome, data.qtde_atletas, data.setor, data.id)
    if (result.changes === 0) {
      return null
    }

    return this.getById(data.id)
  }

  add(data: NewEquipeCustomer): NewEquipeCustomer {
    const stmt = this.db.prepare(`
      INSERT INTO equipes (nome, ativo, setor, criado_em, qtde_atletas) 
      VALUES (?, ?, ?, ?, ?)
    `)

    const res = stmt.run(data.nome, data.ativo ?? 1, data.setor, data.criado_em, data.qtde_atletas)

    const select = this.db.prepare(`
      SELECT id, nome, ativo, setor, criado_em, qtde_atletas
      FROM equipes
      WHERE id = ?
    `)

    return select.get(res.lastInsertRowid) as NewEquipeCustomer
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare(`
      DELETE from equipes 
      WHERE id = ?
    `)

    const result = stmt.run(id)
    return result.changes > 0
  }
}