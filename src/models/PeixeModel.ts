import DatabaseConstructor from 'better-sqlite3'
import { PeixeCustomer, NewPeixe } from '../shared/types/interfaces'

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
        tipo TEXT NOT NULL,
        tamanho FLOAT,
        peso FLOAT, 
        id_membro INTEGER NOT NULL,      
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TEXT,
        deletado_em TEXT,
        FOREIGN KEY (id_membro) REFERENCES membros(id) ON DELETE CASCADE
      )
    `)
  }

  add(data: NewPeixe): number {
    const stmt = this.db.prepare(`
      INSERT INTO peixes (tipo, tamanho, peso, id_membro) 
      VALUES (?, ?, ?, ?)
    `)

    const res = stmt.run(data.tipo, data.tamanho, data.peso, data.id_membro)

    return Number(res.lastInsertRowid)
  }

  listar(): PeixeCustomer[] {
    const stmt = this.db.prepare(`
      SELECT p.id, p.tipo, p.tamanho, p.peso, m.nome as nome_membro, p.criado_em
      FROM peixes p
      JOIN membros m ON p.id_membro = m.id
      WHERE p.deletado_em IS NULL
      ORDER BY p.criado_em DESC
    `)

    return stmt.all() as PeixeCustomer[]
  }

  listarById(id: number): PeixeCustomer | null {
    const stmt = this.db.prepare(`
      SELECT p.id, p.tipo, p.tamanho, p.peso, m.nome as nome_membro
      FROM peixes p
      JOIN membros m ON m.id = p.id_membro
      WHERE p.id = ?
      ORDER by p.criado_em
    `)

    const result = stmt.get(id)

    return result ? (result as PeixeCustomer) : null
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM peixes
      WHERE id = ?`)

    const res = stmt.run(id)
    return res.changes > 0
  }
}
