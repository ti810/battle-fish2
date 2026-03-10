import DatabaseConstructor from 'better-sqlite3'
import { SistemaConfigCustomer } from '../shared/types/interfaces'

type SaveConfiguracaoModelPayload = {
  empresa_nome: string
  cnpj: string
  endereco: string
  telefone?: string
  email?: string
  licenca_chave?: string
  usuario_acesso_id: number
}

export class ConfiguracaoModel {
  static readonly LICENSE_REVALIDATION_INTERVAL_MS = 2 * 24 * 60 * 60 * 1000
  static readonly CLOCK_ROLLBACK_TOLERANCE_MS = 10 * 60 * 1000

  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
    this.criarTabela()
    this.garantirRegistroPadrao()
  }

  private criarTabela(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS configuracoes_sistema(
        id INTEGER PRIMARY KEY CHECK(id = 1),
        empresa_nome TEXT NOT NULL DEFAULT '',
        cnpj TEXT NOT NULL DEFAULT '',
        endereco TEXT NOT NULL DEFAULT '',
        telefone TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        licenca_chave TEXT NOT NULL DEFAULT '',
        licenca_ativa INTEGER NOT NULL DEFAULT 0,
        licenca_ultima_verificacao_em TEXT DEFAULT NULL,
        licenca_ultimo_horario_local_em TEXT DEFAULT NULL,
        usuario_acesso_id INTEGER,
        atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(usuario_acesso_id) REFERENCES usuarios(id) ON DELETE SET NULL
      )
    `)

    const columns = this.db
      .prepare('PRAGMA table_info(configuracoes_sistema)')
      .all() as Array<{ name: string }>

    const hasUltimaVerificacao = columns.some(
      (column) => column.name === 'licenca_ultima_verificacao_em'
    )

    if (!hasUltimaVerificacao) {
      this.db.exec(
        'ALTER TABLE configuracoes_sistema ADD COLUMN licenca_ultima_verificacao_em TEXT DEFAULT NULL'
      )
    }

    const hasUltimoHorarioLocal = columns.some(
      (column) => column.name === 'licenca_ultimo_horario_local_em'
    )

    if (!hasUltimoHorarioLocal) {
      this.db.exec(
        'ALTER TABLE configuracoes_sistema ADD COLUMN licenca_ultimo_horario_local_em TEXT DEFAULT NULL'
      )
    }

    this.db.exec(`
      UPDATE configuracoes_sistema
      SET licenca_ultima_verificacao_em = CURRENT_TIMESTAMP
      WHERE licenca_ativa = 1
        AND (licenca_ultima_verificacao_em IS NULL OR TRIM(licenca_ultima_verificacao_em) = '')
    `)

    this.db.exec(`
      UPDATE configuracoes_sistema
      SET licenca_ultimo_horario_local_em = CURRENT_TIMESTAMP
      WHERE licenca_ativa = 1
        AND (licenca_ultimo_horario_local_em IS NULL OR TRIM(licenca_ultimo_horario_local_em) = '')
    `)
  }

  private garantirRegistroPadrao(): void {
    this.db.exec(`
      INSERT OR IGNORE INTO configuracoes_sistema (
        id,
        empresa_nome,
        cnpj,
        endereco,
        telefone,
        email,
        licenca_chave,
        licenca_ativa,
        licenca_ultima_verificacao_em,
        licenca_ultimo_horario_local_em,
        usuario_acesso_id,
        atualizado_em
      ) VALUES (1, '', '', '', '', '', '', 0, NULL, NULL, NULL, CURRENT_TIMESTAMP)
    `)
  }

  obter(): SistemaConfigCustomer {
    const row = this.db
      .prepare(
        `
          SELECT
            c.id,
            c.empresa_nome,
            c.cnpj,
            c.endereco,
            c.telefone,
            c.email,
            c.licenca_chave,
            c.licenca_ativa,
            c.licenca_ultima_verificacao_em,
            c.licenca_ultimo_horario_local_em,
            COALESCE(c.atualizado_em, '') AS atualizado_em,
            c.usuario_acesso_id,
            u.nome AS usuario_acesso_nome,
            u.usuario AS usuario_acesso_login
          FROM configuracoes_sistema c
          LEFT JOIN usuarios u
            ON u.id = c.usuario_acesso_id
          WHERE c.id = 1
          LIMIT 1
        `
      )
      .get() as SistemaConfigCustomer | undefined

    if (row) {
      return row
    }

    return {
      id: 1,
      empresa_nome: '',
      cnpj: '',
      endereco: '',
      telefone: '',
      email: '',
      licenca_chave: '',
      licenca_ativa: 0,
      licenca_ultima_verificacao_em: null,
      licenca_ultimo_horario_local_em: null,
      atualizado_em: '',
      usuario_acesso_id: null,
      usuario_acesso_nome: null,
      usuario_acesso_login: null
    }
  }

  private parseDateTime(value: string | null | undefined): Date | null {
    if (!value) return null

    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }

    const normalized = String(value).trim().replace(' ', 'T')
    const fallback = new Date(normalized)
    if (!Number.isNaN(fallback.getTime())) {
      return fallback
    }

    return null
  }

  getLicenseRevalidationLimitDate(referenceDate = new Date()): Date {
    return new Date(referenceDate.getTime() - ConfiguracaoModel.LICENSE_REVALIDATION_INTERVAL_MS)
  }

  private getCurrentSqlTimestamp(): string {
    const row = this.db
      .prepare(`SELECT CURRENT_TIMESTAMP AS now`)
      .get() as { now: string }

    return row.now
  }

  private getMostRecentKnownClock(
    config: Pick<
      SistemaConfigCustomer,
      'licenca_ultima_verificacao_em' | 'licenca_ultimo_horario_local_em'
    >
  ): Date | null {
    const candidates = [
      this.parseDateTime(config.licenca_ultima_verificacao_em),
      this.parseDateTime(config.licenca_ultimo_horario_local_em)
    ].filter((value): value is Date => Boolean(value))

    if (candidates.length === 0) {
      return null
    }

    return new Date(Math.max(...candidates.map((item) => item.getTime())))
  }

  isLicensePastRevalidationWindow(
    config: SistemaConfigCustomer,
    referenceDate = new Date()
  ): boolean {
    const serial = String(config.licenca_chave || '').trim()
    if (!serial || Number(config.licenca_ativa) !== 1) {
      return false
    }

    const lastVerification = this.parseDateTime(config.licenca_ultima_verificacao_em)
    if (!lastVerification) {
      return true
    }

    return lastVerification.getTime() < this.getLicenseRevalidationLimitDate(referenceDate).getTime()
  }

  isClockRollbackDetected(
    config: SistemaConfigCustomer,
    referenceDate = new Date()
  ): boolean {
    const serial = String(config.licenca_chave || '').trim()
    if (!serial || Number(config.licenca_ativa) !== 1) {
      return false
    }

    const mostRecentKnownClock = this.getMostRecentKnownClock(config)
    if (!mostRecentKnownClock) {
      return false
    }

    return (
      referenceDate.getTime() + ConfiguracaoModel.CLOCK_ROLLBACK_TOLERANCE_MS
      < mostRecentKnownClock.getTime()
    )
  }

  registrarHorarioLocalLicenca(
    licencaChave: string,
    now = this.getCurrentSqlTimestamp()
  ): SistemaConfigCustomer {
    const normalized = String(licencaChave || '').trim().toUpperCase()
    if (!normalized) {
      return this.obter()
    }

    this.db
      .prepare(
        `
          UPDATE configuracoes_sistema
          SET licenca_ultimo_horario_local_em = CASE
            WHEN licenca_ultimo_horario_local_em IS NULL OR licenca_ultimo_horario_local_em < ? THEN ?
            ELSE licenca_ultimo_horario_local_em
          END,
          atualizado_em = CURRENT_TIMESTAMP
          WHERE id = 1
            AND licenca_chave = ?
        `
      )
      .run(now, now, normalized)

    return this.obter()
  }

  salvar(payload: SaveConfiguracaoModelPayload): SistemaConfigCustomer {
    const empresaNome = payload.empresa_nome.trim()
    const cnpj = payload.cnpj.trim()
    const endereco = payload.endereco.trim()

    if (!empresaNome) {
      throw new Error('Informe o nome da empresa.')
    }

    if (!cnpj) {
      throw new Error('Informe o CNPJ da empresa.')
    }

    if (!endereco) {
      throw new Error('Informe o endereco da empresa.')
    }

    const transaction = this.db.transaction((data: SaveConfiguracaoModelPayload) => {
      const current = this.db
        .prepare(
          `
            SELECT licenca_chave, licenca_ativa, licenca_ultima_verificacao_em, licenca_ultimo_horario_local_em
            FROM configuracoes_sistema
            WHERE id = 1
            LIMIT 1
          `
        )
        .get() as
        | {
            licenca_chave: string
            licenca_ativa: number
            licenca_ultima_verificacao_em: string | null
            licenca_ultimo_horario_local_em: string | null
          }
        | undefined

      const normalizedLicense = (data.licenca_chave ?? current?.licenca_chave ?? '').trim().toUpperCase()

      const shouldKeepActive = current?.licenca_chave === normalizedLicense
      const nextLicenseStatus = normalizedLicense ? (shouldKeepActive ? current?.licenca_ativa ?? 0 : 0) : 0

      this.db
        .prepare(
          `
            INSERT INTO configuracoes_sistema (
              id,
              empresa_nome,
              cnpj,
              endereco,
              telefone,
              email,
              licenca_chave,
              licenca_ativa,
              licenca_ultima_verificacao_em,
              licenca_ultimo_horario_local_em,
              usuario_acesso_id,
              atualizado_em
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
              empresa_nome = excluded.empresa_nome,
              cnpj = excluded.cnpj,
              endereco = excluded.endereco,
              telefone = excluded.telefone,
              email = excluded.email,
              licenca_chave = excluded.licenca_chave,
              licenca_ativa = excluded.licenca_ativa,
              licenca_ultima_verificacao_em = excluded.licenca_ultima_verificacao_em,
              licenca_ultimo_horario_local_em = excluded.licenca_ultimo_horario_local_em,
              usuario_acesso_id = excluded.usuario_acesso_id,
              atualizado_em = CURRENT_TIMESTAMP
          `
        )
        .run(
          1,
          empresaNome,
          cnpj,
          endereco,
          (data.telefone ?? '').trim(),
          (data.email ?? '').trim(),
          normalizedLicense,
          nextLicenseStatus,
          normalizedLicense && shouldKeepActive ? current?.licenca_ultima_verificacao_em ?? null : null,
          normalizedLicense && shouldKeepActive ? current?.licenca_ultimo_horario_local_em ?? null : null,
          data.usuario_acesso_id
        )
    })

    transaction(payload)

    return this.obter()
  }

  ativarLicenca(licencaChave: string): SistemaConfigCustomer {
    const normalized = licencaChave.trim().toUpperCase()

    if (!normalized) {
      throw new Error('Informe uma chave de licenca para ativar o sistema.')
    }

    if (normalized.length < 12 || !/^[A-Z0-9-]+$/.test(normalized)) {
      throw new Error('Chave de licenca invalida. Use letras, numeros e hifen (minimo 12 caracteres).')
    }

    this.db
      .prepare(
        `
          INSERT INTO configuracoes_sistema (
            id,
            licenca_chave,
            licenca_ativa,
            licenca_ultima_verificacao_em,
            licenca_ultimo_horario_local_em,
            atualizado_em
          ) VALUES (1, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT(id) DO UPDATE SET
            licenca_chave = excluded.licenca_chave,
            licenca_ativa = 1,
            licenca_ultima_verificacao_em = CURRENT_TIMESTAMP,
            licenca_ultimo_horario_local_em = CURRENT_TIMESTAMP,
            atualizado_em = CURRENT_TIMESTAMP
        `
      )
      .run(normalized)

    return this.obter()
  }

  definirStatusLicenca(licencaChave: string, ativa: 0 | 1): SistemaConfigCustomer {
    const normalized = String(licencaChave || '').trim().toUpperCase()
    const status = ativa === 1 ? 1 : 0

    this.db
      .prepare(
        `
          INSERT INTO configuracoes_sistema (
            id,
            licenca_chave,
            licenca_ativa,
            licenca_ultima_verificacao_em,
            licenca_ultimo_horario_local_em,
            atualizado_em
          ) VALUES (1, ?, ?, (
            SELECT licenca_ultima_verificacao_em
            FROM configuracoes_sistema
            WHERE id = 1
          ), (
            SELECT licenca_ultimo_horario_local_em
            FROM configuracoes_sistema
            WHERE id = 1
          ), CURRENT_TIMESTAMP)
          ON CONFLICT(id) DO UPDATE SET
            licenca_chave = excluded.licenca_chave,
            licenca_ativa = excluded.licenca_ativa,
            licenca_ultima_verificacao_em = COALESCE(excluded.licenca_ultima_verificacao_em, configuracoes_sistema.licenca_ultima_verificacao_em),
            licenca_ultimo_horario_local_em = COALESCE(excluded.licenca_ultimo_horario_local_em, configuracoes_sistema.licenca_ultimo_horario_local_em),
            atualizado_em = CURRENT_TIMESTAMP
        `
      )
      .run(normalized, status)

    return this.obter()
  }

  registrarValidacaoOnlineLicenca(
    licencaChave: string,
    ativa: 0 | 1,
    verifiedAt: string | null = null
  ): SistemaConfigCustomer {
    const normalized = String(licencaChave || '').trim().toUpperCase()
    const status = ativa === 1 ? 1 : 0
    const verifiedAtValue = verifiedAt?.trim() || this.getCurrentSqlTimestamp()

    this.db
      .prepare(
        `
          INSERT INTO configuracoes_sistema (
            id,
            licenca_chave,
            licenca_ativa,
            licenca_ultima_verificacao_em,
            licenca_ultimo_horario_local_em,
            atualizado_em
          ) VALUES (1, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT(id) DO UPDATE SET
            licenca_chave = excluded.licenca_chave,
            licenca_ativa = excluded.licenca_ativa,
            licenca_ultima_verificacao_em = excluded.licenca_ultima_verificacao_em,
            atualizado_em = CURRENT_TIMESTAMP
        `
      )
      .run(normalized, status, verifiedAtValue)

    return this.registrarHorarioLocalLicenca(normalized)
  }
}
