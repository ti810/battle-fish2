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
        peso REAL NOT NULL, 
        equipe_id INTEGER NOT NULL,      
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TEXT,
        deletado_em TEXT,
        FOREIGN KEY (equipe_id) REFERENCES equipes(id) ON DELETE CASCADE
      )
    `)
  }

  add(data: NewPeixeCustomer): number {
    const stmt = this.db.prepare(`
      INSERT INTO peixes (peso, equipe_id) 
      VALUES (?, ?)
    `)

    const res = stmt.run(data.peso, data.equipe_id)

    return Number(res.lastInsertRowid)
  }

  listar(): PeixeCustomer[] {
    const stmt = this.db.prepare(`
      SELECT p.id, p.peso, p.grupo_id, p.criado_em
      FROM peixes p
      JOIN equipes e ON p.equipe_id = e.id
      WHERE p.deletado_em IS NULL       
      ORDER BY p.criado_em DESC
    `)

    return stmt.all() as PeixeCustomer[]
  }

  listarByEquipeId(equipeId: number): PeixeCustomer[] {
    const stmt = this.db.prepare(`
      SELECT p.id, p.tipo, p.tamanho, p.peso
      FROM peixes p    
      WHERE p.deletado_em IS NULL
       AND e = ?
      ORDER BY p.criado_em DESC
    `)

    return stmt.all(equipeId) as PeixeCustomer[]
  }
  

  buscarById(id: number): PeixeCustomer | null {
    const stmt = this.db.prepare(`
      SELECT p.id, p.tipo, p.tamanho, p.peso, g.nome as nome_grupo
      FROM peixes p
      JOIN equipes g ON g.id = p.equipe_id
      WHERE p.id = ?
      ORDER by p.criado_em
    `)

    const result = stmt.get(id)

    return result ? (result as PeixeCustomer) : null
  }

  update(peixe: PeixeCustomer): boolean {
      const fields: string[] = []
      const values: unknown[] = [] 
    

      if (peixe.peso !== undefined) {
        fields.push('peso = ?')
        values.push(peixe.peso)
      }

      if (peixe.equipe_id !== undefined) {
        fields.push('equipe_id = ?')
        values.push(peixe.equipe_id)
      }
  
      if (fields.length === 0) {
        // nada para atualizar
        return false
      }
  
      values.push(peixe.id)
  
      const stmt = this.db.prepare(`
        UPDATE peixes
        SET ${fields.join(', ')}
        WHERE id = ?
      `)
  
      const res = stmt.run(...values)
      return res.changes > 0
    }
  

  delete(id: number): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM peixes
      WHERE id = ?`)

    const res = stmt.run(id)
    return res.changes > 0
  }
}
