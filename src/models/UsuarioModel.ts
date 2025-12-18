import DatabaseConstructor from 'better-sqlite3'
import { UserCustomer } from '../shared/types/interfaces'

export class UsuarioModel {
  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
    this.criarTabela()
  }

  private criarTabela() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS usuarios(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        senha TEXT NOT NULL,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TEXT,
        deletado_em TEXT
      )
    `)
  }

  listar(): UserCustomer[] {
    const stmt = this.db.prepare(`
      SELECT id, nome, email, senha, criado_em, atualizado_em, deletado_em
      FROM usuarios
      WHERE deletado_em IS NULL
      ORDER BY criado_em DESC
    `)

    return stmt.all() as UserCustomer[]
  }
}
