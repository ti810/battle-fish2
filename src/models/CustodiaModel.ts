import DatabaseConstructor from 'better-sqlite3'
import { CustodiaCustomer } from '../shared/types/interfaces'

export class CustodiaModel {
  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
  }

  custodia(): CustodiaCustomer[] {
    const stmt = this.db.prepare(`
    SELECT
    p.id   AS id,
    p.peso  AS peso,
    e.nome AS equipe,
    e.setor AS setor,
    c.nome AS campeonato
    FROM peixes p
    JOIN equipes e
        ON e.id = p.equipe_id
    JOIN campeonatos c
    ON c.id = e.id_campeonato;
  `)

    return stmt.all() as CustodiaCustomer[]
  }
}
