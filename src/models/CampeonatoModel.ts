import DatabaseConstructor from "better-sqlite3";
import {
  CampeonatoCustomer,
  NewCampeonatoCustomer,
  EquipeCustomer,
} from "../shared/types/interfaces";
import z from "zod";

type ModelResponse<T> =
  | { success: true; data: T }
  | { success: false; message: string };

export class CampeonatoModel {
  private db: InstanceType<typeof DatabaseConstructor>;

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db;
    this.criarTabela();
  }

  private criarTabela() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS campeonatos(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        data_inicial TEXT NOT NULL,
        data_final TEXT NOT NULL,
        ativo INTEGER DEFAULT 1,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP  
      )
    `);
  }

  listar(): CampeonatoCustomer[] {
    const stmt = this.db.prepare(`
      SELECT id, nome, data_inicial, data_final, ativo, criado_em
      FROM campeonatos
      ORDER BY criado_em DESC
    `);

    return stmt.all() as CampeonatoCustomer[];
  }

  getCampeonatoAtivo() {
    const stmt = this.db.prepare(`
      SELECT id FROM campeonatos
      WHERE ativo = 1
      LIMIT 1
  `);

    return stmt.get();
  }

  getById(id: number): CampeonatoCustomer | null {
    const stmt = this.db.prepare(`
      SELECT id, nome, data_inicial, data_final, ativo, criado_em
      FROM campeonatos
      WHERE deletado_em IS NULL
        AND id = ?
      LIMIT 1
    `);

    return stmt.get(id) as CampeonatoCustomer;
  }

  listarEquipesByCampeonatoId(id: number) {
    const equipes = this.db
      .prepare(`
        SELECT e.id, e.nome, e.setor, e.criado_em      
        FROM equipes e      
        WHERE e.id_campeonato = ?
    `
      ).all(id);

    const total = this.db
      .prepare(
      `
        SELECT COUNT(*) 
        FROM equipes 
        WHERE id_campeonato = ?
      `
      ).pluck().get(id);

    return {
      totalEquipes: String(total),
      equipes: equipes as EquipeCustomer[],
    };
  }

  edit(data: CampeonatoCustomer): CampeonatoCustomer | null {
    const stmt = this.db.prepare(`
      UPDATE campeonatos
      SET nome = ?, data_inicial = ?, data_final = ?, ativo = ?      
      WHERE id = ?      
    `);

    const result = stmt.run(
      data.nome,
      data.data_inicial,
      data.data_final,
      data.ativo,
      data.id
    );
    if (result.changes === 0) {
      return null;
    }

    return this.getById(data.id);
  }

  // add(data: NewCampeonatoCustomer, forcarEncerramento = false) {
  //   const campeonatoAtivo = this.getCampeonatoAtivo() as CampeonatoCustomer | undefined

  //   // Se existir ativo e não foi autorizado forçar
  //   if (campeonatoAtivo && !forcarEncerramento) {
  //     return {
  //       precisaConfirmacao: true,
  //       mensagem: 'Já existe um campeonato ativo. Deseja encerrá-lo?'
  //     }
  //   }

  //   const transaction = this.db.transaction(() => {
  //     if (campeonatoAtivo && forcarEncerramento) {
  //       this.db
  //         .prepare(
  //           `
  //       UPDATE campeonatos SET ativo = 0 WHERE id = ?
  //     `
  //         )
  //         .run(campeonatoAtivo.id)
  //     }

  //     const stmt = this.db.prepare(`
  //       INSERT INTO campeonatos (nome, data_inicial, data_final, ativo, criado_em)
  //       VALUES (?, ?, ?, ?, ?)
  //     `)

  //     const res = stmt.run(data.nome, data.data_inicial, data.data_final, 1, data.criado_em)

  //     return this.db.prepare(`
  //       SELECT id, nome, data_inicial, data_final, ativo, criado_em
  //       FROM campeonatos
  //       WHERE id = ?
  //     `).get(res.lastInsertRowid)
  //   })

  //   return {
  //     precisaConfirmacao: false,
  //     campeonato: transaction()
  //   }
  // }

  //   add(data: NewCampeonatoCustomer, forcarEncerramento = false): NewCampeonatoCustomer {
  //     const campeonatoAtivo = this.getCampeonatoAtivo() as CampeonatoCustomer | undefined

  //     // console.log(campeonatoAtivo)

  //     // Se existir ativo e não foi autorizado forçar
  //     if (campeonatoAtivo && !forcarEncerramento) {
  //       throw new Error('Já existe um campeonato ativo. Deseja encerrá-lo?')
  //     }

  //     const transaction = this.db.transaction(() => {
  //       // Se existir ativo e usuário confirmou
  //       if (campeonatoAtivo && forcarEncerramento) {
  //         this.db.prepare(`
  //             UPDATE campeonatos SET ativo = 0 WHERE id = ?
  //         `).run(campeonatoAtivo.id)
  //       }

  //       const stmt = this.db.prepare(`
  //       INSERT INTO campeonatos (nome, data_inicial, data_final, ativo, criado_em)
  //       VALUES (?, ?, ?, ?, ?)
  //     `)

  //       const res = stmt.run(
  //         data.nome,
  //         data.data_inicial,
  //         data.data_final,
  //         0, // novo já entra ativo
  //         data.criado_em
  //       )

  //       return this.db.prepare(`
  //         SELECT id, nome, data_inicial, data_final, ativo, criado_em
  //         FROM campeonatos
  //         WHERE id = ?
  //     `).get(res.lastInsertRowid)
  //   })

  //   return transaction() as NewCampeonatoCustomer
  // }

  add(data: NewCampeonatoCustomer): NewCampeonatoCustomer {
    const transaction = this.db.transaction(() => {
      this.db.prepare(`DELETE FROM campeonatos`).run();

      const stmt = this.db.prepare(`
      INSERT INTO campeonatos (nome, data_inicial, data_final, ativo, criado_em)
      VALUES (?, ?,  ?, ?, ?)
    `);

      const res = stmt.run(
        data.nome,
        data.data_inicial,
        data.data_final,
        1,
        data.criado_em
      );

      return this.db
        .prepare(
          `
        SELECT id, nome, data_inicial, data_final, criado_em
        FROM campeonatos
        WHERE id = ?
      `
        )
        .get(res.lastInsertRowid);
    });

    return transaction() as NewCampeonatoCustomer;
  }

  encerrar(id: number): boolean {
    const stmt = this.db.prepare(`
      DELETE from campeonatos
      WHERE id = ?
    `);

    const result = stmt.run(id);
    return result.changes > 0;
  }
}
