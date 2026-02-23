import DatabaseConstructor from 'better-sqlite3'
import { RankingCustomer } from '../shared/types/interfaces'

export class RankingModel {
  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
  }

  // ranking(): RankingCustomer[]{
  //   const stmt = this.db.prepare(`
  //   SELECT
  //     e.id AS id,
  //     e.nome AS equipe_nome,
  //     COUNT(p.id) AS quantidade,
  //     IFNULL(SUM(p.peso), 0) AS peso_total,
  //     (COUNT(p.id) + (IFNULL(sum(p.peso), 0) * 2.0 / 100.0)) AS pontos
  //   FROM equipes e
  //   LEFT JOIN peixes p
  //   ON p.equipe_id = e.id
  //   GROUP BY e.id, e.nome
  //   ORDER BY
  //   peso_total DESC,
  //   quantidade DESC;
  // `)
  ranking(): RankingCustomer[] {
    const stmt = this.db.prepare(`
    SELECT
      e.id AS id,
      e.nome AS equipe_nome,

      COUNT(p.id) AS quantidade,

      IFNULL(SUM(p.peso), 0) AS peso_total,

      (
        COUNT(p.id) +
        (IFNULL(SUM(p.peso), 0) * 2.0 / 100.0)
      ) AS pontos

    FROM equipes e

    LEFT JOIN peixes p
      ON p.equipe_id = e.id
      AND p.deletado_em IS NULL

    GROUP BY e.id, e.nome

    ORDER BY
      peso_total DESC,
      quantidade DESC;
  `)

    return stmt.all() as RankingCustomer[]
  }
}
