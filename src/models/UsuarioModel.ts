import DatabaseConstructor from 'better-sqlite3'
import {
  AlterarSenhaPayload,
  AtualizarUsuarioPerfilPayload,
  AuthUserCustomer,
  UserCustomer,
  UserLogCustomer
} from '../shared/types/interfaces'

type UsuarioComSenha = AuthUserCustomer & {
  senha: string
  email: string | null
}

type UpsertAccessUserPayload = {
  id?: number | null
  nome: string
  usuario: string
  senha: string
}

export class UsuarioModel {
  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
    this.criarTabela()
    this.criarTabelaLogs()
    this.garantirColunasLegadas()
    this.garantirUsuarioMaster()
  }

  private criarTabela(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS usuarios(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        usuario TEXT,
        email TEXT,
        senha TEXT NOT NULL,
        is_master INTEGER NOT NULL DEFAULT 0,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TEXT,
        deletado_em TEXT
      )
    `)
  }

  private criarTabelaLogs(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS usuarios_logs(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        acao TEXT NOT NULL,
        detalhes TEXT,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
      )
    `)
  }

  private garantirColunasLegadas(): void {
    const columns = this.db
      .prepare("PRAGMA table_info('usuarios')")
      .all() as Array<{ name: string }>

    const hasColumn = (columnName: string) => columns.some((column) => column.name === columnName)

    if (!hasColumn('usuario')) {
      this.db.exec('ALTER TABLE usuarios ADD COLUMN usuario TEXT')
    }

    if (!hasColumn('is_master')) {
      this.db.exec('ALTER TABLE usuarios ADD COLUMN is_master INTEGER NOT NULL DEFAULT 0')
    }

    if (!hasColumn('email')) {
      this.db.exec('ALTER TABLE usuarios ADD COLUMN email TEXT')
    }

    if (!hasColumn('atualizado_em')) {
      this.db.exec('ALTER TABLE usuarios ADD COLUMN atualizado_em TEXT')
    }

    if (!hasColumn('deletado_em')) {
      this.db.exec('ALTER TABLE usuarios ADD COLUMN deletado_em TEXT')
    }

    this.db.exec(`
      UPDATE usuarios
      SET usuario = 'user_' || id
      WHERE usuario IS NULL OR TRIM(usuario) = ''
    `)

    this.db.exec(`
      UPDATE usuarios
      SET email = CASE
        WHEN email IS NULL OR TRIM(email) = '' THEN usuario || '@local.app'
        ELSE email
      END
    `)
  }

  private garantirUsuarioMaster(): void {
    const master = this.db
      .prepare(
        `
          SELECT id
          FROM usuarios
          WHERE is_master = 1
            AND deletado_em IS NULL
          LIMIT 1
        `
      )
      .get() as { id: number } | undefined

    if (master) {
      return
    }

    const masterByLogin = this.db
      .prepare(
        `
          SELECT id
          FROM usuarios
          WHERE LOWER(usuario) = LOWER(?)
          LIMIT 1
        `
      )
      .get('master') as { id: number } | undefined

    if (masterByLogin) {
      this.db
        .prepare(
          `
            UPDATE usuarios
            SET is_master = 1,
                senha = CASE WHEN senha IS NULL OR TRIM(senha) = '' THEN ? ELSE senha END,
                atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ?
          `
        )
        .run('master123', masterByLogin.id)
      return
    }

    this.db
      .prepare(
        `
          INSERT INTO usuarios (nome, usuario, email, senha, is_master)
          VALUES (?, ?, ?, ?, ?)
        `
      )
      .run('Master', 'master', 'master@local.app', 'master123', 1)
  }

  listar(actorUserId: number): UserCustomer[] {
    const actorIsMaster = this.isMaster(actorUserId)

    const stmt = this.db.prepare(`
      SELECT id, nome, email, usuario, is_master, criado_em
      FROM usuarios
      WHERE deletado_em IS NULL
        AND (? = 1 OR id = ?)
      ORDER BY criado_em DESC
    `)

    return stmt.all(actorIsMaster ? 1 : 0, actorUserId) as UserCustomer[]
  }

  buscarComSenhaPorCredencial(credencial: string): UsuarioComSenha | null {
    const stmt = this.db.prepare(`
      SELECT id, nome, usuario, senha, is_master, email
      FROM usuarios
      WHERE (LOWER(usuario) = LOWER(?) OR LOWER(email) = LOWER(?))
        AND deletado_em IS NULL
      LIMIT 1
    `)

    return (stmt.get(credencial, credencial) ?? null) as UsuarioComSenha | null
  }

  autenticar(credencial: string, senha: string): AuthUserCustomer | null {
    const user = this.buscarComSenhaPorCredencial(credencial)

    if (!user) {
      return null
    }

    if (user.senha !== senha) {
      return null
    }

    return {
      id: user.id,
      nome: user.nome,
      usuario: user.usuario,
      is_master: user.is_master
    }
  }

  isMaster(userId: number): boolean {
    const row = this.db
      .prepare(
        `
          SELECT id
          FROM usuarios
          WHERE id = ?
            AND is_master = 1
            AND deletado_em IS NULL
          LIMIT 1
        `
      )
      .get(userId) as { id: number } | undefined

    return Boolean(row)
  }

  registrarLog(payload: { usuario_id?: number | null; acao: string; detalhes?: string }): void {
    this.db
      .prepare(
        `
          INSERT INTO usuarios_logs (usuario_id, acao, detalhes)
          VALUES (?, ?, ?)
        `
      )
      .run(payload.usuario_id ?? null, payload.acao, payload.detalhes ?? '')
  }

  listarLogs(actorUserId: number): UserLogCustomer[] {
    const actorIsMaster = this.isMaster(actorUserId)

    const stmt = this.db.prepare(`
      SELECT
        l.id,
        l.usuario_id,
        u.nome AS usuario_nome,
        u.usuario AS usuario_login,
        l.acao,
        COALESCE(l.detalhes, '') AS detalhes,
        l.criado_em
      FROM usuarios_logs l
      LEFT JOIN usuarios u
        ON u.id = l.usuario_id
      WHERE (? = 1 OR l.usuario_id = ?)
      ORDER BY l.id DESC
      LIMIT 200
    `)

    return stmt.all(actorIsMaster ? 1 : 0, actorUserId) as UserLogCustomer[]
  }

  alterarSenha(payload: AlterarSenhaPayload): { success: boolean; message: string } {
    const actorUserId = Number(payload.actor_user_id)
    const senhaAtual = String(payload.senha_atual ?? '').trim()
    const novaSenha = String(payload.nova_senha ?? '').trim()

    if (!actorUserId) {
      return { success: false, message: 'Usuario nao autenticado.' }
    }

    if (!senhaAtual || !novaSenha) {
      return { success: false, message: 'Preencha senha atual e nova senha.' }
    }

    if (novaSenha.length < 4) {
      return { success: false, message: 'Nova senha precisa ter ao menos 4 caracteres.' }
    }

    const user = this.db
      .prepare(
        `
          SELECT id, nome, usuario, senha
          FROM usuarios
          WHERE id = ?
            AND deletado_em IS NULL
          LIMIT 1
        `
      )
      .get(actorUserId) as { id: number; nome: string; usuario: string; senha: string } | undefined

    if (!user) {
      return { success: false, message: 'Usuario nao encontrado.' }
    }

    if (user.senha !== senhaAtual) {
      this.registrarLog({
        usuario_id: actorUserId,
        acao: 'ALTERAR_SENHA_FALHA',
        detalhes: 'Senha atual informada incorreta.'
      })
      return { success: false, message: 'Senha atual invalida.' }
    }

    this.db
      .prepare(
        `
          UPDATE usuarios
          SET senha = ?,
              atualizado_em = CURRENT_TIMESTAMP
          WHERE id = ?
        `
      )
      .run(novaSenha, actorUserId)

    this.registrarLog({
      usuario_id: actorUserId,
      acao: 'ALTERAR_SENHA_SUCESSO',
      detalhes: 'Usuario alterou a propria senha.'
    })

    return { success: true, message: 'Senha alterada com sucesso.' }
  }

  atualizarPerfil(payload: AtualizarUsuarioPerfilPayload): { success: boolean; message: string } {
    const actorUserId = Number(payload.actor_user_id)
    const targetUserId = Number(payload.target_user_id)
    const nome = String(payload.nome ?? '').trim()
    const usuario = String(payload.usuario ?? '').trim().toLowerCase()
    const email = String(payload.email ?? '').trim().toLowerCase()

    if (!actorUserId || !targetUserId) {
      return { success: false, message: 'Usuario nao autenticado.' }
    }

    if (!nome || !usuario || !email) {
      return { success: false, message: 'Preencha nome, login e email.' }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Informe um email valido.' }
    }

    const actor = this.db
      .prepare(
        `
          SELECT id, is_master
          FROM usuarios
          WHERE id = ?
            AND deletado_em IS NULL
          LIMIT 1
        `
      )
      .get(actorUserId) as { id: number; is_master: number } | undefined

    if (!actor) {
      return { success: false, message: 'Usuario nao autenticado.' }
    }

    if (Number(actor.is_master) !== 1 && actor.id !== targetUserId) {
      return { success: false, message: 'Acesso negado para editar este usuario.' }
    }

    const target = this.db
      .prepare(
        `
          SELECT id
          FROM usuarios
          WHERE id = ?
            AND deletado_em IS NULL
          LIMIT 1
        `
      )
      .get(targetUserId) as { id: number } | undefined

    if (!target) {
      return { success: false, message: 'Usuario alvo nao encontrado.' }
    }

    const duplicatedLogin = this.db
      .prepare(
        `
          SELECT id
          FROM usuarios
          WHERE LOWER(usuario) = LOWER(?)
            AND id != ?
            AND deletado_em IS NULL
          LIMIT 1
        `
      )
      .get(usuario, targetUserId) as { id: number } | undefined

    if (duplicatedLogin) {
      return { success: false, message: 'Ja existe um usuario com este login.' }
    }

    const duplicatedEmail = this.db
      .prepare(
        `
          SELECT id
          FROM usuarios
          WHERE LOWER(email) = LOWER(?)
            AND id != ?
            AND deletado_em IS NULL
          LIMIT 1
        `
      )
      .get(email, targetUserId) as { id: number } | undefined

    if (duplicatedEmail) {
      return { success: false, message: 'Ja existe um usuario com este email.' }
    }

    this.db
      .prepare(
        `
          UPDATE usuarios
          SET nome = ?,
              usuario = ?,
              email = ?,
              atualizado_em = CURRENT_TIMESTAMP
          WHERE id = ?
            AND deletado_em IS NULL
        `
      )
      .run(nome, usuario, email, targetUserId)

    this.registrarLog({
      usuario_id: actorUserId,
      acao: 'USUARIO_PERFIL_ATUALIZADO',
      detalhes:
        actorUserId === targetUserId
          ? 'Usuario atualizou o proprio nome/login/email.'
          : `Usuario ${actorUserId} atualizou perfil do usuario ${targetUserId}.`
    })

    return { success: true, message: 'Usuario atualizado com sucesso.' }
  }

  private gerarEmailDisponivel(usuario: string, excludeId?: number | null): string {
    const normalized = usuario.toLowerCase().replace(/[^a-z0-9_.-]/g, '') || 'user'

    let attempt = 0

    while (attempt < 1000) {
      const suffix = attempt === 0 ? '' : `+${attempt}`
      const email = `${normalized}${suffix}@local.app`

      const exists = this.db
        .prepare(
          `
            SELECT id
            FROM usuarios
            WHERE LOWER(email) = LOWER(?)
              AND (? IS NULL OR id != ?)
            LIMIT 1
          `
        )
        .get(email, excludeId ?? null, excludeId ?? null) as { id: number } | undefined

      if (!exists) {
        return email
      }

      attempt += 1
    }

    return `${normalized}_${Date.now()}@local.app`
  }

  upsertAccessUser(payload: UpsertAccessUserPayload): { id: number } {
    const nome = payload.nome.trim()
    const usuario = payload.usuario.trim().toLowerCase()
    const senha = payload.senha.trim()

    if (!nome || !usuario || !senha) {
      throw new Error('Nome, usuario e senha do acesso sao obrigatorios.')
    }

    if (senha.length < 4) {
      throw new Error('A senha do usuario de acesso precisa ter ao menos 4 caracteres.')
    }

    const duplicatedLogin = this.db
      .prepare(
        `
          SELECT id
          FROM usuarios
          WHERE LOWER(usuario) = LOWER(?)
            AND (? IS NULL OR id != ?)
          LIMIT 1
        `
      )
      .get(usuario, payload.id ?? null, payload.id ?? null) as { id: number } | undefined

    if (duplicatedLogin) {
      throw new Error('Ja existe um usuario com este login.')
    }

    if (payload.id) {
      this.db
        .prepare(
          `
            UPDATE usuarios
            SET nome = ?,
                usuario = ?,
                senha = ?,
                atualizado_em = CURRENT_TIMESTAMP,
                is_master = 0,
                email = CASE
                  WHEN email IS NULL OR TRIM(email) = '' THEN ?
                  ELSE email
                END
            WHERE id = ?
          `
        )
        .run(nome, usuario, senha, this.gerarEmailDisponivel(usuario, payload.id), payload.id)

      this.registrarLog({
        usuario_id: payload.id,
        acao: 'USUARIO_SISTEMA_ATUALIZADO',
        detalhes: 'Usuario principal do sistema foi atualizado na configuracao.'
      })

      return { id: payload.id }
    }

    const existingAccessUser = this.db
      .prepare(
        `
          SELECT id
          FROM usuarios
          WHERE is_master = 0
            AND deletado_em IS NULL
          ORDER BY id ASC
          LIMIT 1
        `
      )
      .get() as { id: number } | undefined

    if (existingAccessUser) {
      this.db
        .prepare(
          `
            UPDATE usuarios
            SET nome = ?,
                usuario = ?,
                senha = ?,
                atualizado_em = CURRENT_TIMESTAMP,
                email = CASE
                  WHEN email IS NULL OR TRIM(email) = '' THEN ?
                  ELSE email
                END
            WHERE id = ?
          `
        )
        .run(
          nome,
          usuario,
          senha,
          this.gerarEmailDisponivel(usuario, existingAccessUser.id),
          existingAccessUser.id
        )

      this.registrarLog({
        usuario_id: existingAccessUser.id,
        acao: 'USUARIO_SISTEMA_ATUALIZADO',
        detalhes: 'Usuario principal do sistema foi atualizado na configuracao.'
      })

      return { id: existingAccessUser.id }
    }

    const inserted = this.db
      .prepare(
        `
          INSERT INTO usuarios (nome, usuario, email, senha, is_master)
          VALUES (?, ?, ?, ?, 0)
        `
      )
      .run(nome, usuario, this.gerarEmailDisponivel(usuario), senha)

    const insertedId = Number(inserted.lastInsertRowid)

    this.registrarLog({
      usuario_id: insertedId,
      acao: 'USUARIO_SISTEMA_CRIADO',
      detalhes: 'Usuario principal do sistema foi criado na configuracao.'
    })

    return {
      id: insertedId
    }
  }
}
