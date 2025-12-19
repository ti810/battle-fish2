import DatabaseConstructor from 'better-sqlite3'
import { GroupCustomer, NewGroupCustomer } from '../shared/types/interfaces'

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
}
