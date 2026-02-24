import DatabaseConstructor from 'better-sqlite3'
import { EquipeCustomer, NewEquipeCustomer, PeixeCustomer } from '../shared/types/interfaces'
import z from 'zod'
import { equipeSchema } from '../renderer/src/hooks/formValidation'
import { error } from 'console'

type ModelResponse<T> = { success: true; data: T } | { success: false; message: any }

export class EquipeModel {
  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
    this.criarTabela()
  }

  private criarTabela() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS equipes(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        setor INTEGER NOT NULL UNIQUE,
        ativo INTEGER NOT NULL DEFAULT 1,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TEXT,
        id_campeonato INTEGER NOT NULL,
        FOREIGN KEY (id_campeonato)
          REFERENCES campeonatos(id)
          ON DELETE CASCADE       
      )
    `)
  }

  listar(): EquipeCustomer[] {
    const stmt = this.db.prepare(`
      SELECT id, nome, setor, ativo, criado_em, id_campeonato
      FROM equipes      
      ORDER BY criado_em DESC
    `)

    return stmt.all() as EquipeCustomer[]
  }

  listarComUltimaCapturaOfPeixe() {
    const stmt = this.db.prepare(`
    SELECT 
      e.id,
      e.nome,
      e.ativo,
      e.setor,    
      e.criado_em,
      MAX(p.criado_em) AS ultima_captura
    FROM equipes e
    LEFT JOIN peixes p 
      ON p.id_equipe = e.id 
     AND p.deletado_em IS NULL
    GROUP BY e.id
  `)

    return stmt.all()
  }

  getById(id: number): EquipeCustomer | null {
    const stmt = this.db.prepare(`
      SELECT id, nome, ativo, setor, criado_em, id_campeonato
      FROM equipes
      WHERE deletado_em IS NULL
        AND id = ?
      LIMIT 1
    `)

    return stmt.get(id) as EquipeCustomer
  }

  edit(data: EquipeCustomer): EquipeCustomer | null {
    const stmt = this.db.prepare(`
      UPDATE equipes
      SET nome = ?, setor = ?, ativo = ?, id_campeonato = ?
      WHERE id = ?
    `)

    const result = stmt.run(data.nome, data.setor, data.ativo, data.id_campeonato, data.id)
    if (result.changes === 0) {
      return null
    }

    return this.getById(data.id)
  }

  add(data: NewEquipeCustomer): ModelResponse<NewEquipeCustomer> {
    // validação zod
    const parsed = equipeSchema.safeParse(data)

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.flatten()
      }
    }

    // // 🔎 Verifica se já existe setor
    const existe = this.db.prepare('SELECT id FROM equipes WHERE setor = ?').get(parsed.data.setor)

    if (existe) {
      return {
        success: false,
        message: 'Já existe uma equipe cadastrada para este setor.'
      }
    }

    // 1️⃣ verificar campeonato ativo
    const campeonatoAtivo = this.db
      .prepare(
        `
        SELECT id FROM campeonatos
        WHERE ativo = 1
        LIMIT 1
      `
      )
      .get() as { id: number } | undefined

    if (!campeonatoAtivo) {
      return {
        success: false,
        message: 'Nenhum campeonato ativo encontrado'
      }
    }

    const stmt = this.db.prepare(`
      INSERT INTO equipes (nome, ativo, setor, criado_em, id_campeonato)
      VALUES (?, ?, ?, ?, ?)
    `)

    const res = stmt.run(data.nome, data.ativo ?? 1, data.setor, data.criado_em, campeonatoAtivo.id)

    const equipe = this.db
      .prepare(
        `
      SELECT id, nome, ativo, setor, criado_em, id_campeonato
      FROM equipes
      WHERE id = ?
    `
      )
      .get(res.lastInsertRowid) as NewEquipeCustomer

    return {
      success: true,
      data: equipe
    }
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare(`
      DELETE from equipes 
      WHERE id = ?
    `)

    const result = stmt.run(id)
    return result.changes > 0
  }
}
