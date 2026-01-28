import DatabaseConstructor from 'better-sqlite3'
import { PeixeCustomer, NewPeixeCustomer } from '../shared/types/interfaces'

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
        id_grupo INTEGER NOT NULL,      
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TEXT,
        deletado_em TEXT,
        FOREIGN KEY (id_grupo) REFERENCES grupos(id) ON DELETE CASCADE
      )
    `)
  }

  add(data: NewPeixeCustomer): number {
    const stmt = this.db.prepare(`
      INSERT INTO peixes (tipo, tamanho, peso, id_grupo) 
      VALUES (?, ?, ?, ?)
    `)

    const res = stmt.run(data.tipo, data.tamanho, data.peso, data.id_grupo)

    return Number(res.lastInsertRowid)
  }

  listar(): PeixeCustomer[] {
    const stmt = this.db.prepare(`
      SELECT p.id, p.tipo, p.tamanho, p.peso, g.nome as nome_grupo, p.criado_em
      FROM peixes p
      JOIN grupos g ON p.id_grupo = g.id
      WHERE p.deletado_em IS NULL       
      ORDER BY p.criado_em DESC
    `)

    return stmt.all() as PeixeCustomer[]
  }

  listarByGrupoId(grupoId: number): PeixeCustomer[] {
    
    const stmt = this.db.prepare(`
      SELECT p.id, p.tipo, p.tamanho, p.peso
      FROM peixes p    
      WHERE p.deletado_em IS NULL
       AND id_grupo = ?
      ORDER BY p.criado_em DESC
    `)

    return stmt.all(grupoId) as PeixeCustomer[]
  }


  buscarById(id: number): PeixeCustomer | null {
    const stmt = this.db.prepare(`
      SELECT p.id, p.tipo, p.tamanho, p.peso, g.nome as nome_grupo
      FROM peixes p
      JOIN grupos g ON g.id = p.id_grupo
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
