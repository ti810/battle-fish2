import DatabaseConstructor from 'better-sqlite3'
import { AtletaCustomer, NewAtletaCustomer } from '../shared/types/interfaces'

export class AtletaModel {
  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
    this.criarTabela()
  }

  private criarTabela(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS atletas(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        equipe_id INTEGER NOT NULL,  
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TEXT,
        deletado_em TEXT,
        FOREIGN KEY(equipe_id)
          REFERENCES equipes(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      )
    `)
  }
  add(data: NewAtletaCustomer): number {
    const stmt = this.db.prepare(`
        INSERT INTO atletas nome, equipe_id) 
        VALUES (?, ?, ?, ?)`)
    const res = stmt.run(data.nome, data.equipe_id)
    return Number(res.lastInsertRowid)
  }

  listar(): AtletaCustomer[] {
    const stmt = this.db.prepare(`
      SELECT id, nome, equipe_id, criado_em, atualizado_em, deletado_em
      FROM atletas
      WHERE deletado_em IS NULL
      ORDER BY criado_em DESC
    `)

    return stmt.all() as AtletaCustomer[]
  }

  getById(id: number): AtletaCustomer | null {
    const stmt = this.db.prepare(`
      SELECT id, nome, equipe_id
      FROM atletas
      WHERE id = ?
       `)

    return (stmt.get(id) ?? null) as AtletaCustomer | null
  }

  update(atleta: AtletaCustomer): boolean {
    const fields: string[] = []
    const values: unknown[] = []

    if (atleta.nome !== undefined) {
      fields.push('nome = ?')
      values.push(atleta.nome)
    }

    if (atleta.equipe_id !== undefined) {
      fields.push('equipe_id = ?')
      values.push(atleta.equipe_id)
    }

    if (fields.length === 0) {
      // nada para atualizar
      return false
    }

    values.push(atleta.id)

    const stmt = this.db.prepare(`
      UPDATE atletas
      SET ${fields.join(', ')}
      WHERE id = ?
    `)

    const res = stmt.run(...values)
    return res.changes > 0
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM atletas
      WHERE id =?`)
    const res = stmt.run(id)
    return res.changes > 0
  }
}
