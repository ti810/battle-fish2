import DatabaseConstructor from 'better-sqlite3'
import { GroupCustomer, NewGroupCustomer } from '../shared/types/interfaces'
import z from 'zod'

export class GrupoModel {
  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
    this.criarTabela()
  }

  private criarTabela() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS grupos(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        qtde_membros INTEGER NOT NULL,
        ativo INTEGER NOT NULL DEFAULT 1,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TEXT,
        deletado_em TEXT       
      )
    `)
  }

  listar(): GroupCustomer[] {
    const stmt = this.db.prepare(`
      SELECT id, nome, ativo, qtde_membros, criado_em
      FROM grupos
      WHERE deletado_em IS NULL
      ORDER BY criado_em DESC
    `)

    return stmt.all() as GroupCustomer[]
  }

  getById(id: number): GroupCustomer | null {
    const stmt = this.db.prepare(`
      SELECT id, nome, ativo, qtde_membros, criado_em
      FROM grupos
      WHERE deletado_em IS NULL
        AND id = ?
      LIMIT 1
    `)

    return stmt.get(id) as GroupCustomer
  }

  edit(data: GroupCustomer): GroupCustomer | null {
    const stmt = this.db.prepare(`
      UPDATE grupos
      SET nome = ?, qtde_membros = ?      
      WHERE id = ?      
    `)

    const result = stmt.run(data.nome, data.qtde_membros, data.id)
    if (result.changes === 0) {
      return null
    }

    return this.getById(data.id)
  }

  add(data: NewGroupCustomer): NewGroupCustomer {
    const stmt = this.db.prepare(`
      INSERT INTO grupos (nome, ativo, criado_em, qtde_membros) 
      VALUES (?, ?, ?, ?)
    `)

    const res = stmt.run(data.nome, data.ativo ?? 1, data.criado_em, data.qtde_membros)

    const select = this.db.prepare(`
      SELECT id, nome, ativo, criado_em, qtde_membros
      FROM grupos
      WHERE id = ?
    `)

    return select.get(res.lastInsertRowid) as NewGroupCustomer
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare(`
      DELETE from grupos 
      WHERE id = ?
    `)

    const result = stmt.run(id)
    return result.changes > 0
  }
}
