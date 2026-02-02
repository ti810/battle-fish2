import DatabaseConstructor from 'better-sqlite3'
import { EquipeCustomer, NewEquipeCustomer } from '../shared/types/interfaces'
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
        setor INTEGER NOT NULL,
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
      SELECT id, nome, setor, ativo, qtde_atletas, criado_em
      FROM equipes
      WHERE deletado_em IS NULL
      ORDER BY criado_em DESC
    `)

    return stmt.all() as EquipeCustomer[]
  }

  getById(id: number): EquipeCustomer | null {
    const stmt = this.db.prepare(`
      SELECT id, nome, setor, ativo, qtde_atletas, criado_em
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
      SET nome = ?, setor=?, qtde_atletas = ?     
      WHERE id = ?      
    `)

    const result = stmt.run(data.nome,data.setor, data.qtde_atletas, data.id)
    if (result.changes === 0) {
      return null
    }

    return this.getById(data.id)
  }

  add(data: NewEquipeCustomer): NewEquipeCustomer {
    const stmt = this.db.prepare(`
      INSERT INTO equipes (nome, setor, ativo, criado_em, qtde_atletas) 
      VALUES (?, ?, ?, ?, ?)
    `)

    const res = stmt.run(data.nome, data.setor, data.ativo ?? 1, data.criado_em, data.qtde_atletas)

    const select = this.db.prepare(`
      SELECT id, nome, setor, ativo, criado_em, qtde_atletas
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
