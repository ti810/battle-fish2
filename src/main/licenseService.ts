import fs from 'fs'
import os from 'os'
import path from 'path'
import crypto from 'crypto'
import type { App } from 'electron'

type DeviceIdentity = {
  deviceId: string
  mac: string
}

type LicenseConfig = {
  apiBaseUrl: string
  apiKey: string
  validateIntervalMs: number
  requireSignedToken: boolean
  allowOfflineValidation: boolean
  publicKeyTtlMs: number
  tokenClockSkewSeconds: number
}

type TokenSource = 'server' | 'cache' | null

type LicenseApiResult = {
  success: boolean
  status: string
  message: string
  valid: boolean
  expiresAt: string | null
  serverTime: string | null
  licenseToken: string | null
  tokenExpiresAt: string | null
  tokenStatus: string | null
  tokenSource: TokenSource
}

type HttpResult = {
  ok: boolean
  statusCode: number
  data: Record<string, unknown> | null
  message: string
}

type PublicKeyData = {
  publicKey: string
  tokenKid: string | null
  fingerprint: string | null
  fetchedAt: number
}

type LicenseCacheState = {
  licenseToken: string | null
  tokenExpiresAt: string | null
  tokenKid: string | null
  tokenUpdatedAt: string | null
  publicKey: string | null
  publicKeyKid: string | null
  publicKeyFingerprint: string | null
  publicKeyUpdatedAt: string | null
}

type TokenVerificationResult = {
  ok: boolean
  status: string
  message: string
  tokenExpiresAt: string | null
  licenseExpiresAt: string | null
  tokenKid: string | null
  clearCachedToken: boolean
}

const DEVICE_FILE_NAME = 'license-device.json'
const CACHE_FILE_NAME = 'license-cache.json'

const MIN_VALIDATE_INTERVAL_MS = 60_000
const DEFAULT_VALIDATE_INTERVAL_MS = 15 * 60 * 1000

const MIN_PUBLIC_KEY_TTL_MS = 60_000
const DEFAULT_PUBLIC_KEY_TTL_MS = 6 * 60 * 60 * 1000

const DEFAULT_TOKEN_CLOCK_SKEW_SECONDS = 30
const MAX_TOKEN_CLOCK_SKEW_SECONDS = 300

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeSerial(value: string): string {
  return String(value || '').trim().toUpperCase()
}

function normalizeMacAddress(value: string): string {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/-/g, ':')
}

function detectMacAddress(): string {
  const interfaces = os.networkInterfaces()
  for (const group of Object.values(interfaces)) {
    if (!Array.isArray(group)) continue

    for (const entry of group) {
      if (!entry || entry.internal) continue
      const mac = normalizeMacAddress(entry.mac || '')
      if (mac && mac !== '00:00:00:00:00:00') {
        return mac
      }
    }
  }

  return '00:00:00:00:00:00'
}

function parseDotEnvLine(line: string): { key: string; value: string } | null {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return null

  const separatorIndex = trimmed.indexOf('=')
  if (separatorIndex <= 0) return null

  const key = trimmed.slice(0, separatorIndex).trim()
  if (!key) return null

  let value = trimmed.slice(separatorIndex + 1).trim()
  if (
    (value.startsWith('"') && value.endsWith('"'))
    || (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }

  return { key, value }
}

function parseBooleanLike(value: string | undefined, fallback: boolean): boolean {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return fallback

  if (['1', 'true', 'yes', 'on', 'sim'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off', 'nao', 'não'].includes(normalized)) return false

  return fallback
}

function toNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function formatUnixTimestamp(seconds: number): string | null {
  if (!Number.isFinite(seconds) || seconds <= 0) return null

  const date = new Date(seconds * 1000)
  if (Number.isNaN(date.getTime())) return null

  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hour = String(date.getUTCHours()).padStart(2, '0')
  const minute = String(date.getUTCMinutes()).padStart(2, '0')
  const second = String(date.getUTCSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hour}:${minute}:${second} UTC`
}

function decodeBase64Url(input: string): Buffer {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const mod = normalized.length % 4
  const padded = mod === 0 ? normalized : normalized + '='.repeat(4 - mod)
  return Buffer.from(padded, 'base64')
}

function loadEnvFallback(app: App): void {
  const candidates = [path.join(process.cwd(), '.env')]

  try {
    const appPath = app.getAppPath()
    candidates.push(path.join(appPath, '.env'))
  } catch {
    // ignore
  }

  try {
    const exeDir = path.dirname(app.getPath('exe'))
    candidates.push(
      path.join(exeDir, '.env'),
      path.join(exeDir, 'resources', '.env'),
      path.join(process.resourcesPath || '', '.env'),
      path.join(process.resourcesPath || '', 'resources', '.env')
    )
  } catch {
    // ignore
  }

  for (const candidate of candidates) {
    if (!candidate || !fs.existsSync(candidate)) continue

    try {
      const lines = fs.readFileSync(candidate, 'utf8').split(/\r?\n/)
      for (const raw of lines) {
        const parsed = parseDotEnvLine(raw)
        if (!parsed) continue
        if (process.env[parsed.key]) continue
        process.env[parsed.key] = parsed.value
      }
    } catch {
      // ignore parse errors
    }
  }
}

function loadJsonConfigFallback(app: App): void {
  const candidates: string[] = []

  try {
    const appPath = app.getAppPath()
    candidates.push(
      path.join(appPath, 'resources', 'license-config.json')
    )
  } catch {
    // ignore
  }

  try {
    const exeDir = path.dirname(app.getPath('exe'))
    candidates.push(
      path.join(exeDir, 'license-config.json'),
      path.join(exeDir, 'resources', 'license-config.json'),
      path.join(process.resourcesPath || '', 'license-config.json'),
      path.join(process.resourcesPath || '', 'resources', 'license-config.json')
    )
  } catch {
    // ignore
  }

  candidates.push(path.join(process.cwd(), 'resources', 'license-config.json'))

  for (const candidate of candidates) {
    if (!candidate || !fs.existsSync(candidate)) continue

    try {
      const parsed = JSON.parse(fs.readFileSync(candidate, 'utf8')) as Record<string, unknown>

      if (!process.env.LICENSE_API_BASE_URL && typeof parsed.LICENSE_API_BASE_URL === 'string') {
        process.env.LICENSE_API_BASE_URL = parsed.LICENSE_API_BASE_URL.trim()
      }
      if (!process.env.LICENSE_API_KEY && typeof parsed.LICENSE_API_KEY === 'string') {
        process.env.LICENSE_API_KEY = parsed.LICENSE_API_KEY.trim()
      }
      if (!process.env.LICENSE_VALIDATE_INTERVAL_MS && parsed.LICENSE_VALIDATE_INTERVAL_MS !== undefined) {
        process.env.LICENSE_VALIDATE_INTERVAL_MS = String(parsed.LICENSE_VALIDATE_INTERVAL_MS).trim()
      }
      if (!process.env.LICENSE_REQUIRE_SIGNED_TOKEN && parsed.LICENSE_REQUIRE_SIGNED_TOKEN !== undefined) {
        process.env.LICENSE_REQUIRE_SIGNED_TOKEN = String(parsed.LICENSE_REQUIRE_SIGNED_TOKEN).trim()
      }
      if (!process.env.LICENSE_ALLOW_OFFLINE_TOKEN && parsed.LICENSE_ALLOW_OFFLINE_TOKEN !== undefined) {
        process.env.LICENSE_ALLOW_OFFLINE_TOKEN = String(parsed.LICENSE_ALLOW_OFFLINE_TOKEN).trim()
      }
      if (!process.env.LICENSE_PUBLIC_KEY_TTL_MS && parsed.LICENSE_PUBLIC_KEY_TTL_MS !== undefined) {
        process.env.LICENSE_PUBLIC_KEY_TTL_MS = String(parsed.LICENSE_PUBLIC_KEY_TTL_MS).trim()
      }
      if (!process.env.LICENSE_TOKEN_CLOCK_SKEW_SECONDS && parsed.LICENSE_TOKEN_CLOCK_SKEW_SECONDS !== undefined) {
        process.env.LICENSE_TOKEN_CLOCK_SKEW_SECONDS = String(parsed.LICENSE_TOKEN_CLOCK_SKEW_SECONDS).trim()
      }
    } catch {
      // ignore invalid json
    }
  }
}

function createEmptyCacheState(): LicenseCacheState {
  return {
    licenseToken: null,
    tokenExpiresAt: null,
    tokenKid: null,
    tokenUpdatedAt: null,
    publicKey: null,
    publicKeyKid: null,
    publicKeyFingerprint: null,
    publicKeyUpdatedAt: null
  }
}

export class LicenseService {
  private readonly app: App
  private readonly config: LicenseConfig
  private readonly identityFilePath: string
  private readonly cacheFilePath: string
  private identityCache: DeviceIdentity | null = null
  private cacheState: LicenseCacheState

  constructor(app: App) {
    this.app = app
    loadEnvFallback(app)
    loadJsonConfigFallback(app)

    const rawBase = String(process.env.LICENSE_API_BASE_URL || '').trim()
    const rawKey = String(process.env.LICENSE_API_KEY || '').trim()
    const rawInterval = Number.parseInt(String(process.env.LICENSE_VALIDATE_INTERVAL_MS || ''), 10)
    const rawPublicKeyTtl = Number.parseInt(String(process.env.LICENSE_PUBLIC_KEY_TTL_MS || ''), 10)
    const rawClockSkew = Number.parseInt(String(process.env.LICENSE_TOKEN_CLOCK_SKEW_SECONDS || ''), 10)

    const validateIntervalMs =
      Number.isFinite(rawInterval) && rawInterval >= MIN_VALIDATE_INTERVAL_MS
        ? rawInterval
        : DEFAULT_VALIDATE_INTERVAL_MS

    const publicKeyTtlMs =
      Number.isFinite(rawPublicKeyTtl) && rawPublicKeyTtl >= MIN_PUBLIC_KEY_TTL_MS
        ? rawPublicKeyTtl
        : DEFAULT_PUBLIC_KEY_TTL_MS

    const tokenClockSkewSeconds =
      Number.isFinite(rawClockSkew) && rawClockSkew >= 0
        ? Math.min(rawClockSkew, MAX_TOKEN_CLOCK_SKEW_SECONDS)
        : DEFAULT_TOKEN_CLOCK_SKEW_SECONDS

    this.config = {
      apiBaseUrl: rawBase.replace(/\/+$/, ''),
      apiKey: rawKey,
      validateIntervalMs,
      requireSignedToken: parseBooleanLike(process.env.LICENSE_REQUIRE_SIGNED_TOKEN, true),
      allowOfflineValidation: parseBooleanLike(process.env.LICENSE_ALLOW_OFFLINE_TOKEN, true),
      publicKeyTtlMs,
      tokenClockSkewSeconds
    }

    const userDataPath = this.app.getPath('userData')
    this.identityFilePath = path.join(userDataPath, DEVICE_FILE_NAME)
    this.cacheFilePath = path.join(userDataPath, CACHE_FILE_NAME)
    this.cacheState = this.loadCacheState()
  }

  isConfigured(): boolean {
    return Boolean(this.config.apiBaseUrl) && Boolean(this.config.apiKey)
  }

  getValidateIntervalMs(): number {
    return this.config.validateIntervalMs
  }

  async activate(serial: string): Promise<LicenseApiResult> {
    const normalized = normalizeSerial(serial)

    if (!normalized) {
      return this.buildResult({
        success: false,
        status: 'INVALID',
        message: 'Informe uma chave de licenca.',
        valid: false
      })
    }

    return this.callLicenseEndpoint('/license/activate', normalized)
  }

  async validate(serial: string): Promise<LicenseApiResult> {
    const normalized = normalizeSerial(serial)
    if (!normalized) {
      return this.buildResult({
        success: false,
        status: 'INVALID',
        message: 'Licenca nao informada.',
        valid: false
      })
    }

    return this.callLicenseEndpoint('/license/validate', normalized)
  }

  private buildResult(input: {
    success: boolean
    status: string
    message: string
    valid: boolean
    expiresAt?: string | null
    serverTime?: string | null
    licenseToken?: string | null
    tokenExpiresAt?: string | null
    tokenStatus?: string | null
    tokenSource?: TokenSource
  }): LicenseApiResult {
    return {
      success: input.success,
      status: input.status,
      message: input.message,
      valid: input.valid,
      expiresAt: input.expiresAt ?? null,
      serverTime: input.serverTime ?? null,
      licenseToken: input.licenseToken ?? null,
      tokenExpiresAt: input.tokenExpiresAt ?? null,
      tokenStatus: input.tokenStatus ?? null,
      tokenSource: input.tokenSource ?? null
    }
  }

  private async callLicenseEndpoint(endpoint: '/license/activate' | '/license/validate', serial: string): Promise<LicenseApiResult> {
    if (!this.isConfigured()) {
      return this.buildResult({
        success: false,
        status: 'CONFIG_ERROR',
        message: 'Configure LICENSE_API_BASE_URL e LICENSE_API_KEY.',
        valid: false
      })
    }

    const identity = this.getOrCreateIdentity()
    const payload = {
      serial,
      device_id: identity.deviceId,
      mac: identity.mac,
      app_version: this.app.getVersion()
    }

    const result = await this.postJson(endpoint, payload)
    if (!result.data) {
      if (endpoint === '/license/validate' && this.config.allowOfflineValidation) {
        const offline = await this.validateWithCachedToken(serial, identity)
        if (offline) {
          return offline
        }
      }

      return this.buildResult({
        success: false,
        status: 'NETWORK_ERROR',
        message: `Falha ao conectar no servidor (${result.message || 'sem resposta'}).`,
        valid: false
      })
    }

    const statusRaw = this.readString(result.data.status) || (result.data.success ? 'ACTIVE' : 'INVALID')
    const status = statusRaw.toUpperCase()
    const responseSuccess = Boolean(result.data.success)
    const serverTime = this.readString(result.data.server_time)

    let expiresAt = this.readString(result.data.expires_at)
    let tokenExpiresAt = this.readString(result.data.token_expires_at)
    const token = this.readString(result.data.license_token)
    const tokenKid = this.readString(result.data.token_kid)
    const message = this.readString(result.data.message)
      || (status === 'ACTIVE' ? 'Licenca valida.' : 'Licenca invalida.')

    const serverValid = endpoint === '/license/validate'
      ? Boolean(result.data.valid)
      : responseSuccess && status === 'ACTIVE'

    const mustHaveToken = this.config.requireSignedToken && serverValid
    let tokenStatus: string | null = null

    if (token || mustHaveToken) {
      const tokenCheck = await this.verifySignedToken({
        token,
        serial,
        identity,
        allowNetwork: true,
        tokenRequired: mustHaveToken
      })

      tokenStatus = tokenCheck.status
      if (!tokenCheck.ok) {
        if (tokenCheck.clearCachedToken) {
          this.clearCachedToken()
        }

        return this.buildResult({
          success: false,
          status: tokenCheck.status,
          message: tokenCheck.message,
          valid: false,
          expiresAt: expiresAt ?? tokenCheck.licenseExpiresAt,
          serverTime,
          licenseToken: token,
          tokenExpiresAt: tokenExpiresAt ?? tokenCheck.tokenExpiresAt,
          tokenStatus: tokenCheck.status,
          tokenSource: 'server'
        })
      }

      tokenExpiresAt = tokenExpiresAt ?? tokenCheck.tokenExpiresAt
      expiresAt = expiresAt ?? tokenCheck.licenseExpiresAt

      if (token) {
        this.storeLicenseToken(token, tokenExpiresAt, tokenKid ?? tokenCheck.tokenKid)
      }
    }

    if (endpoint === '/license/validate' && !serverValid) {
      this.clearCachedToken()
    }

    return this.buildResult({
      success: responseSuccess,
      status,
      message,
      valid: serverValid,
      expiresAt,
      serverTime,
      licenseToken: token,
      tokenExpiresAt,
      tokenStatus,
      tokenSource: token ? 'server' : null
    })
  }

  private async validateWithCachedToken(serial: string, identity: DeviceIdentity): Promise<LicenseApiResult | null> {
    const cachedToken = this.cacheState.licenseToken
    if (!cachedToken) {
      return null
    }

    const tokenCheck = await this.verifySignedToken({
      token: cachedToken,
      serial,
      identity,
      allowNetwork: false,
      tokenRequired: true
    })

    if (!tokenCheck.ok) {
      if (tokenCheck.clearCachedToken) {
        this.clearCachedToken()
      }

      if (tokenCheck.status === 'TOKEN_PUBLIC_KEY_MISSING') {
        return null
      }

      return this.buildResult({
        success: false,
        status: tokenCheck.status,
        message: tokenCheck.message,
        valid: false,
        expiresAt: tokenCheck.licenseExpiresAt,
        licenseToken: null,
        tokenExpiresAt: tokenCheck.tokenExpiresAt,
        tokenStatus: tokenCheck.status,
        tokenSource: 'cache'
      })
    }

    return this.buildResult({
      success: true,
      status: 'ACTIVE_OFFLINE',
      message: 'Licenca validada localmente (modo offline).',
      valid: true,
      expiresAt: tokenCheck.licenseExpiresAt,
      licenseToken: cachedToken,
      tokenExpiresAt: tokenCheck.tokenExpiresAt,
      tokenStatus: tokenCheck.status,
      tokenSource: 'cache'
    })
  }

  private async verifySignedToken(input: {
    token: string | null
    serial: string
    identity: DeviceIdentity
    allowNetwork: boolean
    tokenRequired: boolean
  }): Promise<TokenVerificationResult> {
    const expectedSerial = normalizeSerial(input.serial)

    if (!input.token) {
      if (input.tokenRequired) {
        return {
          ok: false,
          status: 'TOKEN_MISSING',
          message: 'Servidor nao retornou license_token assinado para esta licenca.',
          tokenExpiresAt: null,
          licenseExpiresAt: null,
          tokenKid: null,
          clearCachedToken: false
        }
      }

      return {
        ok: true,
        status: 'TOKEN_NOT_REQUIRED',
        message: '',
        tokenExpiresAt: null,
        licenseExpiresAt: null,
        tokenKid: null,
        clearCachedToken: false
      }
    }

    const parts = input.token.split('.')
    if (parts.length !== 3) {
      return {
        ok: false,
        status: 'TOKEN_FORMAT_INVALID',
        message: 'Formato de license_token invalido.',
        tokenExpiresAt: null,
        licenseExpiresAt: null,
        tokenKid: null,
        clearCachedToken: true
      }
    }

    const [headerPart, payloadPart, signaturePart] = parts

    let header: Record<string, unknown>
    let payload: Record<string, unknown>

    try {
      header = JSON.parse(decodeBase64Url(headerPart).toString('utf8')) as Record<string, unknown>
      payload = JSON.parse(decodeBase64Url(payloadPart).toString('utf8')) as Record<string, unknown>
    } catch {
      return {
        ok: false,
        status: 'TOKEN_PARSE_ERROR',
        message: 'Nao foi possivel ler o license_token.',
        tokenExpiresAt: null,
        licenseExpiresAt: null,
        tokenKid: null,
        clearCachedToken: true
      }
    }

    if (!isRecord(header) || !isRecord(payload)) {
      return {
        ok: false,
        status: 'TOKEN_PARSE_ERROR',
        message: 'Claims do license_token estao invalidos.',
        tokenExpiresAt: null,
        licenseExpiresAt: null,
        tokenKid: null,
        clearCachedToken: true
      }
    }

    const tokenAlg = this.readString(header.alg)?.toUpperCase() || ''
    if (tokenAlg !== 'RS256') {
      return {
        ok: false,
        status: 'TOKEN_ALG_INVALID',
        message: `Algoritmo de assinatura nao suportado (${tokenAlg || 'desconhecido'}).`,
        tokenExpiresAt: null,
        licenseExpiresAt: null,
        tokenKid: this.readString(header.kid),
        clearCachedToken: true
      }
    }

    const tokenKid = this.readString(header.kid)
    const keyData = await this.resolvePublicKey(tokenKid, input.allowNetwork, false)
    if (!keyData) {
      return {
        ok: false,
        status: 'TOKEN_PUBLIC_KEY_MISSING',
        message: 'Chave publica de licenca indisponivel para validar assinatura.',
        tokenExpiresAt: null,
        licenseExpiresAt: null,
        tokenKid,
        clearCachedToken: false
      }
    }

    const signingInput = `${headerPart}.${payloadPart}`
    const signature = decodeBase64Url(signaturePart)

    let signatureValid = this.verifySignature(signingInput, signature, keyData.publicKey)
    if (!signatureValid && input.allowNetwork) {
      const refreshedKeyData = await this.resolvePublicKey(tokenKid, true, true)
      if (refreshedKeyData) {
        signatureValid = this.verifySignature(signingInput, signature, refreshedKeyData.publicKey)
      }
    }

    if (!signatureValid) {
      return {
        ok: false,
        status: 'TOKEN_SIGNATURE_INVALID',
        message: 'Assinatura do license_token invalida.',
        tokenExpiresAt: null,
        licenseExpiresAt: null,
        tokenKid,
        clearCachedToken: true
      }
    }

    const exp = this.readNumber(payload.exp)
    const tokenExpiresAt = exp ? formatUnixTimestamp(exp) : null
    const nbf = this.readNumber(payload.nbf)

    if (!exp) {
      return {
        ok: false,
        status: 'TOKEN_EXP_MISSING',
        message: 'license_token sem claim exp.',
        tokenExpiresAt: null,
        licenseExpiresAt: null,
        tokenKid,
        clearCachedToken: true
      }
    }

    const nowSeconds = Math.floor(Date.now() / 1000)
    const skew = this.config.tokenClockSkewSeconds

    if (nowSeconds - skew >= exp) {
      return {
        ok: false,
        status: 'TOKEN_EXPIRED',
        message: 'license_token expirado.',
        tokenExpiresAt,
        licenseExpiresAt: null,
        tokenKid,
        clearCachedToken: true
      }
    }

    if (nbf && nowSeconds + skew < nbf) {
      return {
        ok: false,
        status: 'TOKEN_NOT_YET_VALID',
        message: 'license_token ainda nao esta valido (nbf).',
        tokenExpiresAt,
        licenseExpiresAt: null,
        tokenKid,
        clearCachedToken: false
      }
    }

    const claimSub = normalizeSerial(this.readString(payload.sub) || '')
    if (claimSub && claimSub !== expectedSerial) {
      return {
        ok: false,
        status: 'TOKEN_SERIAL_MISMATCH',
        message: 'license_token nao corresponde a chave serial informada.',
        tokenExpiresAt,
        licenseExpiresAt: null,
        tokenKid,
        clearCachedToken: true
      }
    }

    let licenseExpiresAt: string | null = null

    if (isRecord(payload.license)) {
      const licenseSerial = normalizeSerial(this.readString(payload.license.serial) || '')
      if (licenseSerial && licenseSerial !== expectedSerial) {
        return {
          ok: false,
          status: 'TOKEN_SERIAL_MISMATCH',
          message: 'Claim license.serial do token nao confere.',
          tokenExpiresAt,
          licenseExpiresAt: null,
          tokenKid,
          clearCachedToken: true
        }
      }

      const licenseStatus = (this.readString(payload.license.status) || '').toLowerCase()
      if (licenseStatus === 'blocked') {
        return {
          ok: false,
          status: 'TOKEN_LICENSE_BLOCKED',
          message: 'Licenca bloqueada conforme token assinado.',
          tokenExpiresAt,
          licenseExpiresAt: this.readString(payload.license.expires_at),
          tokenKid,
          clearCachedToken: true
        }
      }

      if (licenseStatus === 'expired') {
        return {
          ok: false,
          status: 'TOKEN_LICENSE_EXPIRED',
          message: 'Licenca expirada conforme token assinado.',
          tokenExpiresAt,
          licenseExpiresAt: this.readString(payload.license.expires_at),
          tokenKid,
          clearCachedToken: true
        }
      }

      licenseExpiresAt = this.readString(payload.license.expires_at)
    }

    if (isRecord(payload.device)) {
      const claimDeviceId = this.readString(payload.device.id)
      if (claimDeviceId && claimDeviceId !== input.identity.deviceId) {
        return {
          ok: false,
          status: 'TOKEN_DEVICE_MISMATCH',
          message: 'license_token emitido para outro dispositivo.',
          tokenExpiresAt,
          licenseExpiresAt,
          tokenKid,
          clearCachedToken: true
        }
      }

      const claimMac = normalizeMacAddress(this.readString(payload.device.mac) || '')
      const currentMac = normalizeMacAddress(input.identity.mac)
      if (claimMac && currentMac && claimMac !== currentMac) {
        return {
          ok: false,
          status: 'TOKEN_MAC_MISMATCH',
          message: 'license_token emitido para outro MAC address.',
          tokenExpiresAt,
          licenseExpiresAt,
          tokenKid,
          clearCachedToken: true
        }
      }
    }

    return {
      ok: true,
      status: 'TOKEN_VALID',
      message: '',
      tokenExpiresAt,
      licenseExpiresAt,
      tokenKid,
      clearCachedToken: false
    }
  }

  private verifySignature(signingInput: string, signature: Buffer, publicKeyPem: string): boolean {
    try {
      return crypto.verify('RSA-SHA256', Buffer.from(signingInput), publicKeyPem, signature)
    } catch {
      return false
    }
  }

  private async resolvePublicKey(tokenKid: string | null, allowNetwork: boolean, forceRefresh: boolean): Promise<PublicKeyData | null> {
    const cached = this.getCachedPublicKey()
    const cacheMatchesKid = cached ? this.publicKeyMatchesKid(cached, tokenKid) : false

    if (
      cached
      && cacheMatchesKid
      && !forceRefresh
      && (!allowNetwork || !this.isPublicKeyStale(cached))
    ) {
      return cached
    }

    if (allowNetwork) {
      const fetched = await this.fetchPublicKeyFromServer()
      if (fetched) {
        this.storePublicKey(fetched)
        if (this.publicKeyMatchesKid(fetched, tokenKid)) {
          return fetched
        }
      }
    }

    if (cached && cacheMatchesKid) {
      return cached
    }

    return null
  }

  private publicKeyMatchesKid(data: PublicKeyData, tokenKid: string | null): boolean {
    if (!tokenKid) return true
    if (!data.tokenKid) return true
    return data.tokenKid === tokenKid
  }

  private isPublicKeyStale(data: PublicKeyData): boolean {
    if (!data.fetchedAt || data.fetchedAt <= 0) {
      return true
    }

    return (Date.now() - data.fetchedAt) >= this.config.publicKeyTtlMs
  }

  private getCachedPublicKey(): PublicKeyData | null {
    if (!this.cacheState.publicKey) {
      return null
    }

    const fetchedAt = this.cacheState.publicKeyUpdatedAt
      ? Date.parse(this.cacheState.publicKeyUpdatedAt)
      : 0

    return {
      publicKey: this.cacheState.publicKey,
      tokenKid: this.cacheState.publicKeyKid,
      fingerprint: this.cacheState.publicKeyFingerprint,
      fetchedAt: Number.isFinite(fetchedAt) ? fetchedAt : 0
    }
  }

  private async fetchPublicKeyFromServer(): Promise<PublicKeyData | null> {
    const result = await this.getJson('/license/public-key')
    if (!result.data || !result.ok) {
      return null
    }

    if (!Boolean(result.data.success)) {
      return null
    }

    const publicKey = this.readString(result.data.public_key)
    if (!publicKey) {
      return null
    }

    return {
      publicKey,
      tokenKid: this.readString(result.data.token_kid),
      fingerprint: this.readString(result.data.public_key_fingerprint),
      fetchedAt: Date.now()
    }
  }

  private storePublicKey(data: PublicKeyData): void {
    this.cacheState.publicKey = data.publicKey
    this.cacheState.publicKeyKid = data.tokenKid
    this.cacheState.publicKeyFingerprint = data.fingerprint
    this.cacheState.publicKeyUpdatedAt = new Date(data.fetchedAt).toISOString()
    this.saveCacheState()
  }

  private storeLicenseToken(token: string, tokenExpiresAt: string | null, tokenKid: string | null): void {
    this.cacheState.licenseToken = token
    this.cacheState.tokenExpiresAt = tokenExpiresAt
    this.cacheState.tokenKid = tokenKid
    this.cacheState.tokenUpdatedAt = new Date().toISOString()
    this.saveCacheState()
  }

  private clearCachedToken(): void {
    if (!this.cacheState.licenseToken && !this.cacheState.tokenExpiresAt && !this.cacheState.tokenKid) {
      return
    }

    this.cacheState.licenseToken = null
    this.cacheState.tokenExpiresAt = null
    this.cacheState.tokenKid = null
    this.cacheState.tokenUpdatedAt = new Date().toISOString()
    this.saveCacheState()
  }

  private loadCacheState(): LicenseCacheState {
    const empty = createEmptyCacheState()
    if (!fs.existsSync(this.cacheFilePath)) {
      return empty
    }

    try {
      const raw = JSON.parse(fs.readFileSync(this.cacheFilePath, 'utf8')) as Record<string, unknown>
      return {
        licenseToken: toNullableString(raw.licenseToken),
        tokenExpiresAt: toNullableString(raw.tokenExpiresAt),
        tokenKid: toNullableString(raw.tokenKid),
        tokenUpdatedAt: toNullableString(raw.tokenUpdatedAt),
        publicKey: toNullableString(raw.publicKey),
        publicKeyKid: toNullableString(raw.publicKeyKid),
        publicKeyFingerprint: toNullableString(raw.publicKeyFingerprint),
        publicKeyUpdatedAt: toNullableString(raw.publicKeyUpdatedAt)
      }
    } catch {
      return empty
    }
  }

  private saveCacheState(): void {
    try {
      fs.mkdirSync(path.dirname(this.cacheFilePath), { recursive: true })
      fs.writeFileSync(this.cacheFilePath, JSON.stringify(this.cacheState, null, 2), 'utf8')
    } catch {
      // ignore persistence errors
    }
  }

  private readString(value: unknown): string | null {
    return toNullableString(value)
  }

  private readNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value)
      return Number.isFinite(parsed) ? parsed : null
    }

    return null
  }

  private getOrCreateIdentity(): DeviceIdentity {
    if (this.identityCache) {
      return this.identityCache
    }

    let next: DeviceIdentity | null = null

    if (fs.existsSync(this.identityFilePath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(this.identityFilePath, 'utf8')) as Partial<DeviceIdentity>
        const deviceId = String(parsed.deviceId || '').trim()
        const mac = normalizeMacAddress(String(parsed.mac || ''))
        if (deviceId) {
          next = {
            deviceId,
            mac: mac || detectMacAddress()
          }
        }
      } catch {
        // ignore invalid file
      }
    }

    if (!next) {
      next = {
        deviceId: crypto.randomUUID(),
        mac: detectMacAddress()
      }
    }

    this.identityCache = next
    this.saveIdentity(next)
    return next
  }

  private saveIdentity(identity: DeviceIdentity): void {
    try {
      fs.mkdirSync(path.dirname(this.identityFilePath), { recursive: true })
      fs.writeFileSync(this.identityFilePath, JSON.stringify(identity, null, 2), 'utf8')
    } catch {
      // ignore persistence errors
    }
  }

  private async postJson(
    endpoint: string,
    payload: Record<string, unknown>
  ): Promise<HttpResult> {
    return this.requestJson('POST', endpoint, payload)
  }

  private async getJson(endpoint: string): Promise<HttpResult> {
    return this.requestJson('GET', endpoint)
  }

  private async requestJson(
    method: 'GET' | 'POST',
    endpoint: string,
    payload?: Record<string, unknown>
  ): Promise<HttpResult> {
    const controller = new AbortController()
    const timeoutRef = setTimeout(() => controller.abort(), 10_000)
    const url = `${this.config.apiBaseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.config.apiKey
        },
        body: method === 'POST' ? JSON.stringify(payload ?? {}) : undefined,
        signal: controller.signal
      })

      const text = await response.text()
      let data: Record<string, unknown> | null = null
      try {
        data = text ? (JSON.parse(text) as Record<string, unknown>) : null
      } catch {
        data = null
      }

      return {
        ok: response.ok,
        statusCode: response.status,
        data,
        message: ''
      }
    } catch (error) {
      const causeMessage =
        error && typeof error === 'object' && 'cause' in error && error.cause && typeof (error.cause as { message?: string }).message === 'string'
          ? (error.cause as { message: string }).message
          : ''

      const baseMessage = error instanceof Error ? error.message : 'erro desconhecido'
      const combined = causeMessage && causeMessage !== baseMessage ? `${baseMessage} | ${causeMessage}` : baseMessage

      return {
        ok: false,
        statusCode: 0,
        data: null,
        message: `${combined} [${url}]`
      }
    } finally {
      clearTimeout(timeoutRef)
    }
  }
}
