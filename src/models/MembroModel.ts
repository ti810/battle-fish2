import DatabaseConstructor from 'better-sqlite3'
import { MemberCustomer, NewMemberCustomer } from '../shared/types/interfaces'

export class MembroModel {
  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
    this.criarTabela()
  }

  private criarTabela(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS membros(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        grupo_id INTEGER NOT NULL,   
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TEXT,
        deletado_em TEXT,
        FOREIGN KEY(grupo_id)
          REFERENCES grupos(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      )
    `)
  }
  add(data: NewMemberCustomer): number {
    const stmt = this.db.prepare(`
        INSERT INTO membros nome, grupo_id) 
        VALUES (?, ?, ?, ?)`)
    const res = stmt.run(data.nome, data.grupo_id)
    return Number(res.lastInsertRowid)
  }

  listar(): MemberCustomer[] {
    const stmt = this.db.prepare(`
      SELECT id, nome, grupo_id, criado_em, atualizado_em, deletado_em
      FROM membros
      WHERE deletado_em IS NULL
      ORDER BY criado_em DESC
    `)

    return stmt.all() as MemberCustomer[]
  }

  buscarById(id: number): MemberCustomer | null {
    const stmt = this.db.prepare(`
      SELECT id, nome, grupo_id
      FROM membros
      WHERE id = ?
       `)

    return (stmt.get(id) ?? null) as MemberCustomer | null
  }

  deletar(id: number): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM membros
      WHERE id =?`)
    const res = stmt.run(id)
    return res.changes > 0
  }
}
