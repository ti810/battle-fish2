import { useEffect, useMemo, useState } from "react"

import {
  DashboardCampeonatoCustomer,
  DashboardTotalLancamentoCustomer,
  DasboardLancamentoCustomer,
  DashboardSetorCustomer,
  DashboardPeixeCustomer,
  DashboardEquipeCustomer,
  DashboardAtletaCustomer,
  DashboardSemLancamentoCustomer
} from "~/src/shared/types/interfaces"

export default function Dashboard() {

  const [campeonato, setCampeonato] =
    useState<DashboardCampeonatoCustomer | null>(null)

  const [totalLancamento, setTotalLancamento] =
    useState<DashboardTotalLancamentoCustomer | null>(null)

  const [maiorPeixe, setMaiorPeixe] =
    useState<DashboardPeixeCustomer | null>(null)

  const [totalEquipe, setTotalEquipe] =
    useState<DashboardEquipeCustomer | null>(null)

  const [totalAtleta, setTotalAtleta] =
    useState<DashboardAtletaCustomer | null>(null)

  const [ultimosLances, setUltimosLances] =
    useState<DasboardLancamentoCustomer[]>([])

  const [setoresAtivos, setSetoresAtivos] =
    useState<DashboardSetorCustomer[]>([])

  const [equipesSemLancamento, setEquipesSemLancamento] =
    useState<DashboardSemLancamentoCustomer | null>(null)


  useEffect(() => {
    loadDashboard()
  }, [])


  async function loadDashboard() {

    const [
      camp,
      totalLanc,
      maior,
      totalEq,
      totalAt,
      ultimos,
      ativos,
      sem
    ] = await Promise.all([
      window.api.campeonato(),
      window.api.totalLancamento(),
      window.api.maiorPeixe(),
      window.api.totalEquipe(),
      window.api.totalAtleta(),
      window.api.ultimosLances(),
      window.api.setorAtivos(),
      window.api.setorSem()
    ])

    setCampeonato(camp)
    setTotalLancamento(totalLanc)
    setMaiorPeixe(maior)
    setTotalEquipe(totalEq)
    setTotalAtleta(totalAt)
    setUltimosLances(ultimos)
    setSetoresAtivos(ativos)
    setEquipesSemLancamento(sem)
  }


  const horaAtual = useMemo(() => {
    return new Date().toLocaleTimeString()
  }, [])


  return (
    <div className="min-h-screen text-slate-800 space-y-6">

      <div className="max-w-7xl mx-auto space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">
            Veja informações importantes sobre o campeonato
          </p>
        </div>

        {/* Header */}
        <div className="rounded-xl bg-white p-5 border border-slate-200 shadow-sm">

          <h1 className="text-xl font-semibold mb-2 text-slate-900">
            {campeonato?.nome_campeonato ?? "-"}
          </h1>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <StatusItem
              label="Horário"
              value={horaAtual}
            />

            <StatusItem
              label="Lançamentos"
              value={String(totalLancamento?.total_lancamento ?? 0)}
            />
          </div>
        </div>

        {/* KPIs */}
        <div className="grid md:grid-cols-3 gap-4">

          <KpiCard
            title="Maior peixe"
            value={
              maiorPeixe
                ? `${Number(maiorPeixe.maior_peixe).toFixed(2)} kg`
                : "-"
            }
            sub={maiorPeixe?.nome_equipe ?? "-"}
          />

          <KpiCard
            title="Total de equipes cadastradas"
            value={String(totalEquipe?.total_equipe ?? 0)}
            sub="Cadastrado / Ativo"
          />

          <KpiCard
            title="Total de atletas cadastrados"
            value={String(totalAtleta?.total_atleta ?? 0)}
            sub="Cadastrado / Ativo"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Últimos lançamentos */}
          <div className="lg:col-span-2 rounded-xl bg-white border border-slate-200 shadow-sm">

            <div className="p-4 border-b border-slate-200 font-semibold text-slate-900">
              Últimos lançamentos
            </div>

            <div className="divide-y divide-slate-200">

              {ultimosLances.map((l, index) => (
                <div
                  key={index}
                  className="px-4 py-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm"
                >
                  <div className="text-slate-700">
                    {l.nome_equipe}
                  </div>

                  <div className="font-semibold text-slate-900">
                    {Number(l.peso_peixe).toFixed(2)} kg
                  </div>

                  <div className="text-slate-500">
                    Setor {l.setor}
                  </div>
                </div>
              ))}

              {ultimosLances.length === 0 && (
                <div className="p-4 text-sm text-slate-500">
                  Nenhum lançamento encontrado
                </div>
              )}

            </div>
          </div>

          {/* Lateral direita */}
          <div className="space-y-6">

            {/* Setores mais ativos */}
            <div className="rounded-xl bg-white border border-slate-200 shadow-sm">

              <div className="p-4 border-b border-slate-200 font-semibold text-slate-900">
                Setores mais ativos (Lançamentos)
              </div>

              <div className="p-4 space-y-3">

                {setoresAtivos.map((s, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 border text-sm">
                        {index + 1}
                      </span>

                      <span className="font-medium">
                        Setor {s.numero_setor}
                      </span>
                    </div>

                    <span className="text-slate-500">
                      {s.lancamentos}
                    </span>
                  </div>
                ))}

                {setoresAtivos.length === 0 && (
                  <div className="text-sm text-slate-500">
                    Nenhum setor com lançamentos
                  </div>
                )}

              </div>
            </div>

            {/* Alertas */}
            <div className="rounded-xl bg-white border border-red-200 shadow-sm">

              <div className="p-4 border-b border-red-200 font-semibold text-red-600">
                Alertas operacionais
              </div>

              <div className="p-4 space-y-2 text-sm text-red-600">
                ⚠ {equipesSemLancamento?.total_equipe ?? 0} equipes sem lançamento
              </div>

            </div>

            {/* Pendências */}
            <div className="rounded-xl bg-white border border-slate-200 shadow-sm">

              <div className="p-4 border-b border-slate-200 font-semibold text-slate-900">
                Pendências de pesagem
              </div>

              <div className="p-4 text-sm space-y-1 text-slate-700">
                <div>
                  {equipesSemLancamento?.total_equipe ?? 0} equipes sem lançamento
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

/* ======================
   Components auxiliares
====================== */

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-slate-500 text-xs">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  )
}

function KpiCard({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
      <div className="text-slate-500 text-sm mb-1">{title}</div>
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
      <div className="text-slate-500 text-sm mt-1">{sub}</div>
    </div>
  )
}