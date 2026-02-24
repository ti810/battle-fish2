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

  return `${ano}-${mes}-${dia}T${hora}:${minuto}`
}

export function capitalizeWords(str: string) {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

export function tempoRelativo (data: string | null) {
  if (!data) return "Nenhuma captura";

  const diffMs = Date.now() - new Date(data).getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "agora mesmo";
  if (diffMin < 60) return `${diffMin} min atrás`;

  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `${diffHoras}h atrás`;

  const diffDias = Math.floor(diffHoras / 24);
  return `${diffDias} dias atrás`;
};
