import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatarDataBR(dataUTC: string) {
  return new Date(dataUTC + 'Z').toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo'
  })
}

export function agoraParaSQLite(): string {
  const agora = new Date()

  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  const hora = String(agora.getHours()).padStart(2, '0')
  const minuto = String(agora.getMinutes()).padStart(2, '0')

  return `${ano}-${mes}-${dia} ${hora}:${minuto}`
}