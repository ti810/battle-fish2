import DatabaseConstructor from 'better-sqlite3'
import { MemberCustomer } from '../shared/types/interfaces'

export class MemberModel {
  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
    this.criarTabela()
  }

  private criarTabela() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS membros(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        grupo_id         
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TEXT,
        deletado_em TEXT
      )
    `)
  }

  listar(): Customer[] {
    const stmt = this.db.prepare(`
      SELECT id, nome, email, senha, criado_em, atualizado_em, deletado_em
      FROM usuarios
      WHERE deletado_em IS NULL
      ORDER BY criado_em DESC
    `)

    return stmt.all() as Customer[]
  }
}
