import DatabaseConstructor from 'better-sqlite3'
import { RankingCustomer } from '../shared/types/interfaces'

export class RankingModel{
    private db: InstanceType<typeof DatabaseConstructor>
    
      constructor(db: InstanceType<typeof DatabaseConstructor>) {
        this.db = db
      }
    
    ranking(): RankingCustomer[]{
        const stmt = this.db.prepare(`
        SELECT
         e.nome AS equipe_nome,
         COUNT(p.id) AS quantidade,
         IFNULL(SUM(p.peso), 0) AS peso_total
        FROM equipes e
        LEFT JOIN peixes p
        ON p.id_equipe = e.id
        GROUP BY e.id, e.nome
        ORDER BY
        peso_total DESC,
        quantidade DESC;
                                `)
        return stmt.all() as RankingCustomer[]

            
    }
}