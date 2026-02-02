const tempoRelativo = (data: string | null) => {
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


export default tempoRelativo