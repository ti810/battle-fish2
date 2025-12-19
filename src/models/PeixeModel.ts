import DatabaseConstructor from 'better-sqlite3'
import { PeixeCustomer } from '../shared/types/interfaces'

export class PeixeModel {
  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
    this.criarTabela()
  }

  private criarTabela(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS peixes(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        id_membro INTEGER NOT NULL       
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_membro) REFERENCES meembros(id) ON DELETE CASCADE
      )
    `)
  }

  listar(): PeixeCustomer[] {
    const stmt = this.db.prepare(`
      SELECT * FROM peixes ORDER BY criado_em DESC
    `)

    return stmt.all() as PeixeCustomer[]
  }
}
