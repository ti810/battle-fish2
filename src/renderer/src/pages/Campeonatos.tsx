import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, AlignEndVertical, MoreVertical, Users, Edit2, PowerCircle, CircleCheckBig, CircleSlash2 } from 'lucide-react';
import { findDimensionValueType, motion } from 'framer-motion';
import { agoraParaSQLite, tempoRelativo } from '../lib/utils';
import { CampeonatoCustomer, NewCampeonatoCustomer } from '~/src/shared/types/interfaces';
import { toast } from 'sonner';
import Loader from '../components/Loader';
import { formValidation } from '../hooks/formValidation';
import { campeonatoSchema } from '../hooks/formValidation';
import { Rifm } from 'rifm';
import { preview } from 'vite';



export default function Campeonatos() {

  const navigate = useNavigate();

  const [openId, setOpenId] = useState(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const toggleMenu = (id: any) => {
    setOpenId(openId === id ? null : id)
  }

  const [showAddCampeonatoModal, setShowAddCampeonatoModal] = useState(false)
  const [showEditCampeonatoModal, setShowEditCampeonatoModal] = useState(false)
  const [showEncerrarCampeonatoModal, setShowEncerrarCampeonatoModal] = useState(false)

  const [loading, setLoading] = useState(false);
  const nomeRef = useRef<HTMLInputElement>(null)
  const dataInicialRef = useRef<HTMLInputElement>(null)
  const dataFinalRef = useRef<HTMLInputElement>(null)
  const idEquipeRef = useRef<HTMLInputElement>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [equipesCount, setEquipesCount] = useState<Record<number, number>>({})

  const [campeonatos, setCampeonatos] = useState<CampeonatoCustomer[]>([])


  // Form states
  const [campeonatoForm, setCampeonatoForm] = useState<NewCampeonatoCustomer | CampeonatoCustomer>({
    nome: "",
    data_inicial: "",
    data_final: "",
    criado_em: agoraParaSQLite()
  });

  // CRUD Equipe

  const handleEditCampeonato = async () => {
    try {

      // const validationRules = await formValidation(campeonatoSchema, campeonatoForm)

      // if (!validationRules.success) {
      //   setFieldErrors(validationRules.fieldErrors)
      //   const firstField = Object.keys(validationRules.fieldErrors)[0]
      //   if (firstField === "nome") {
      //     nomeRef.current?.focus()
      //   }

      //   if (firstField === "data_inicial") {
      //     dataInicialRef.current?.focus()
      //   }

      //   if (firstField === "data_final") {
      //     dataFinalRef.current?.focus()
      //   }

      //   toast.error(
      //     <div className="space-y-1">
      //       {Object.values(validationRules.fieldErrors).map((err, index) => (
      //         <p key={index}>• {err}</p>
      //       ))}
      //     </div>
      //   )

      //   return
      // }


      // const res = await window.api.editCampeonatoById(campeonatoForm as CampeonatoCustomer)


      // if (res.success) {
      //   toast.success("Campeonato alterado com sucesso")
      //   // Limpar valores dos Inputs 
      //   setCampeonatoForm({
      //     nome: "",
      //     data_inicial: "",
      //     data_final: "",
      //     criado_em: ""
      //   })
      //   setShowEditCampeonatoModal(false)
      //   // carregarDados()

      // }


    } catch (error) {
      console.log("Erro ao alterar dados do Campeonato", error)
      toast.error(`Erro ao alterar dados do Campeonato ${error}`)
    } finally {
      setLoading(false)
    }

  };

  const handleAddCampeonato = async () => {
    try {

      const validationRules = await formValidation(campeonatoSchema, campeonatoForm)

      if (!validationRules.success) {
        setFieldErrors(validationRules.fieldErrors)
        const firstField = Object.keys(validationRules.fieldErrors)[0]
        if (firstField === "nome") {
          nomeRef.current?.focus()
        }

        if (firstField === "data_inicial") {
          dataInicialRef.current?.focus()
        }

        if (firstField === "data_final") {
          dataFinalRef.current?.focus()
        }

        toast.error(
          <div className="space-y-1">
            {Object.values(validationRules.fieldErrors).map((err, index) => (
              <p key={index}>• {err}</p>
            ))}
          </div>
        )

        return
      }


      const confirmar = await window.api.verificarCampeonatoAtivo()

      // console.log(confirmar.ativo)
      // return


      if (!confirmar.ativo) {
        const novo = await window.api.addNovoCampeonato(campeonatoForm as NewCampeonatoCustomer)

        toast.success(`Campeonato ${novo.data.nome} criado com sucesso.`)
        // console.log("Criado:", novo.campeonato)
      } else {
        const resposta1 = await window.api.showMessageBox({
          type: 'question',
          buttons: ['Sim', 'Não'],
          title: 'Campeonato Ativo',
          message: 'Já existe um campeonato ativo. Deseja encerrá-lo e criar um novo?'
        })

        if (!resposta1.response) {
          const resposta2 = await window.api.showMessageBox({
            type: 'question',
            buttons: ['Sim', 'Não'],
            title: 'Atenção!',
            message: 'Todos os dados do campeonato atual serão perdidos. Deseja continuar?'
          })

          if (!resposta2.response) {
            const novo = await window.api.addNovoCampeonato(campeonatoForm as NewCampeonatoCustomer)
            toast.success(`Campeonato ${novo.data.nome} criado com sucesso.`)
          }


        }

        setCampeonatoForm({
          nome: "",
          data_inicial: "",
          data_final: "",
          criado_em: ""
        })

        // confirm('Já existe um campeonato ativo. Deseja encerrá-lo e criar um novo?') 
      }

      setShowAddCampeonatoModal(false)
      carregarDados()

    } catch (error) {
      console.log("Erro ao salvar dados do Campeonato", error)
      toast.error(`Erro ao salvar dados do Campeonato ${error}`)
    } finally {
      setLoading(false)
    }

  };

  const carregarDados = async () => {
    const res = await window.api.listarCampeonatos();

    if (!res.success) return;

    setCampeonatos(res.data);

    const equipes = await Promise.all(
      res.data.map(async (campeonato: { id: number }) => window.api.listarEquipesByCampeonatoId(campeonato.id))
    )

    setEquipesCount((equipes[0].data.totalEquipes) || null)
  };

  // const handleDeletarEquipe = async () => {
  //   try {
  //     setLoading(true)

  //     const res = await window.api.deletarEquipe(Number(equipeId))
  //     if (res.success) {
  //       toast.success(`Equipe excluído com sucesso`)
  //       setShowDeleteEquipeModal(false)
  //       carregarDados()

  //     }

  //   } catch (error) {
  //     console.log("Erro ao listar Equipes", error)
  //     toast.error(`Erro ao listar Equipes ${error}`)

  //   } finally {
  //     setLoading(false)
  //   }
  // }

  // const getEquipeId = async (id: number) => {
  //   try {
  //     const res = await window.api.listarEquipeById(id)
  //     setEquipeForm(res.data)
  //     setEquipeId(res.data.id)

  //   } catch (error) {
  //     console.log("Erro ao carregar Equipe", error)
  //     toast.error(`Erro ao carregar Equipe ${error}`)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  // CRUD Peixe 

  //   const handleAddPeixe = async () => {
  //     try {

  //       const validationRules = formValidation(peixeSchema, peixeForm)

  //       if (!validationRules.success) {
  //         setFieldErrors(validationRules.fieldErrors)
  //         const firstField = Object.keys(validationRules.fieldErrors)[0]
  //         if (firstField === "tipo") {
  //           nomeRef.current?.focus()
  //         }
  //         toast.error(
  //           <div className="space-y-1">
  //             {Object.values(validationRules.fieldErrors).map((err, index) => (
  //               <p key={index}>• {err}</p>
  //             ))}
  //           </div>
  //         )

  //         return
  //       }
  //       setLoading(true)


  //       const res = await window.api.addNovoPeixe(peixeForm as NewPeixeCustomer)

  //       if (res.success) {
  //         toast.success("Peixe salvo com sucesso")
  //         // Limpar valores dos Inputs 
  //         setPeixeForm({
  //           id: Number(null as number | null),
  //           tipo: "",
  //           tamanho: "",
  //           peso: "",
  //           id_equipe: Number(null as number | null),
  //           criado_em: ""
  //         })
  //         setShowAddPeixeModal(false)
  //         carregarDados()

  //       }


  //     } catch (error) {
  //       console.log("Erro ao salvar dados do Peixe", error)
  //       toast.error(`Erro ao salvar dados do Peixe ${error}`)
  //     } finally {
  //       setLoading(false)
  //     }

  //   };


  // // CRUD atleta
  // const handleAddAtleta = async () => {
  //     try {

  //       const validationRules = formValidation(atletaSchema, atletaForm)

  //       if (!validationRules.success) {
  //         setFieldErrors(validationRules.fieldErrors)
  //         const firstField = Object.keys(validationRules.fieldErrors)[0]
  //         if (firstField === "nome") {
  //           nomeAtref.current?.focus()
  //         }

  //         toast.error(
  //           <div className="space-y-1">
  //             {Object.values(validationRules.fieldErrors).map((err, index) => (
  //               <p key={index}>• {err}</p>
  //             ))}
  //           </div>
  //         )

  //         return
  //       }


  //       const res = await window.api.addNovoAtleta(atletaForm as NewAtletaCustomer)


  //       if (res.success) {
  //         toast.success("Atleta salvo com sucesso")
  //         // Limpar valores dos Inputs 
  //         setAtletaForm({
  //           nome: "",
  //           equipe_id: Number(null as number | null),
  //         })
  //         setShowAtletaModal(false)
  //         carregarDados()

  //       }


  //     } catch (error) {
  //       console.log("Erro ao salvar dados do Equipe", error)
  //       toast.error(`Erro ao salvar dados do Equipe ${error}`)
  //     } finally {
  //       setLoading(false)
  //     }

  //   };

  useEffect(() => {
    carregarDados()
  }, [])

  //   useEffect(() => {
  //     function handleClickOutside(event: any) {
  //       if (
  //         dropdownRef.current &&
  //         !dropdownRef.current.contains(event.target)
  //       ) {
  //         setOpenId(null);
  //       }
  //     }

  //     document.addEventListener("mousedown", handleClickOutside);
  //     return () => document.removeEventListener("mousedown", handleClickOutside);

  //   }, [])

  //   useEffect(() => {
  //     if (equipeId) {
  //       setPeixeForm(prev => ({
  //         ...prev,
  //         id_equipe: equipeId
  //       }))
  //     }
  //   }, [equipeId]);

  //    useEffect(() => {
  //     if (equipeId) {
  //       setAtletaForm(prev => ({
  //         ...prev,
  //         equipe_id: equipeId
  //       }))
  //     }
  //   }, [equipeId]);

  return (
    <>
      <Loader show={loading} />
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campeonato Ativo</h1>
            <p className="text-gray-500">Gerencie o campeonato ativo</p>
          </div>
          <div className="flex ml-auto gap-2">
            <button
              onClick={() => setShowAddCampeonatoModal(true)}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-200"
            >
              <AlignEndVertical className="w-4 h-4" />
              Novo Campeonato
            </button>
          </div>
        </div>

        {/* Equipes Grid */}
        <div className="grid grid-cols-1 gap-4">
          {campeonatos.map((camp, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={camp.id}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
            >
              <div className="flex gap-3 justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                    {camp.nome.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{camp.nome}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${camp.ativo === 1 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {camp.ativo === 1 ? "ATIVO" : "INATIVO"}
                    </span>
                  </div>
                </div>
                <div className='bg-white relative'>
                  <div key={camp.id} className="right-0 absolute flex flex-col items-end">
                    <button onClick={() => toggleMenu(camp.id)} type='button' className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {camp.id === openId && (
                      <div ref={dropdownRef} className={`dropdown-menu active float-right text-gray-500 bg-white drop-shadow-lg drop-shadow-gray-700 rounded-[5px] text-left`}>
                        <button type='button' onClick={() => {
                          setShowEditCampeonatoModal(true)
                        }} className='w-full px-4 py-2 rounded-tl-[5px] rounded-tr-[5px] hover:bg-gray-300 flex flex-row text-blue-600'><Edit2 className="w-5 h-5" />&nbsp;&nbsp;Alterar</button>
                        <button type='button' onClick={() => {
                          setShowEncerrarCampeonatoModal(true)
                          // getEquipeId(equipe.id)
                        }} className='w-full px-4 py-2 rounded-bl-[5px] rounded-br-[5px] hover:bg-gray-300 flex flex-row text-red-600'><PowerCircle className="w-5 h-5" />&nbsp;&nbsp;Encerrar</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-50">
                {/* <span>Última captura: {tempoRelativo(camp.ultima_captura)}</span> */}

                <div
                  className="text-gray-600 flex items-center gap-1"
                >
                  <span className='flex font-semibold from-green-600 to-gray-600 bg-linear-to-l w-7 h-7 rounded-full justify-center items-center text-white text-lg'>{Number(equipesCount) || 0}</span> Equipe{Number(equipesCount) > 1 && "s"} participando no momento
                </div>
                <button
                  onClick={() => navigate("/equipes?", { state: { openModal: true } })}
                  className="text-blue-600  flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Adicionar Equipe
                </button>
              </div>
            </motion.div>
          ))}
        </div>


        {/* Add Campeonato Modal */}
        {showAddCampeonatoModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AlignEndVertical className="w-6 h-6 text-blue-600" />
                Criar Novo Campeonato
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Campeonato <span className='text-red-600'>*</span></label>
                  <input
                    type="text"
                    ref={nomeRef}
                    value={campeonatoForm.nome}
                    onChange={
                      (e) => {
                        setCampeonatoForm({ ...campeonatoForm, nome: e.target.value })
                        setFieldErrors((prev) => {
                          const { nome, ...rest } = prev
                          return rest
                        })
                      }
                    }
                    className={`${fieldErrors.nome ? "border border-red-500 focus:ring-2 focus:ring-red-400" : "border border-gray-300 focus:ring-2 focus:ring-blue-200"} w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none`}
                    placeholder="Ex: Campeonato Sul Bahiano 2026"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Inicio <span className='text-red-600'>*</span></label>
                  <input
                    type="datetime-local"
                    ref={dataInicialRef}
                    value={campeonatoForm.data_inicial}
                    onChange={
                      (e) => {
                        setCampeonatoForm({ ...campeonatoForm, data_inicial: e.target.value })
                        setFieldErrors((prev) => {
                          const { data_inicial, ...rest } = prev
                          return rest
                        })
                      }
                    }
                    className={`${fieldErrors.nome ? "border border-red-500 focus:ring-2 focus:ring-red-400" : "border border-gray-300 focus:ring-2 focus:ring-blue-200"} w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none`}
                    placeholder="Ex: Campeonato Sul Bahiano 2026"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Encerramento <span className='text-red-600'>*</span></label>
                  <input
                    type="datetime-local"
                    ref={dataFinalRef}
                    value={campeonatoForm.data_final}
                    onChange={
                      (e) => {
                        setCampeonatoForm({ ...campeonatoForm, data_final: e.target.value })
                        setFieldErrors((prev) => {
                          const { data_final, ...rest } = prev
                          return rest
                        })
                      }
                    }
                    className={`${fieldErrors.nome ? "border border-red-500 focus:ring-2 focus:ring-red-400" : "border border-gray-300 focus:ring-2 focus:ring-blue-200"} w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none`}
                    placeholder="Ex: Campeonato Sul Bahiano 2026"
                  />
                </div>
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campeonato Ativo <span className='text-red-600'>*</span></label>
                  <div className='flex items-center gap-2'>
                    <input
                      type="checkbox"
                      checked={campeonatoForm.ativo === 1}
                      onChange={(e) => setCampeonatoForm({ ...campeonatoForm, ativo: e.target.checked ? 1 : 0 })}
                      className="h-4 w-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200"
                    />
                    <span> {campeonatoForm.ativo === 1 ? <span className='flex gap-1 text-green-600'><CircleCheckBig />{"SIM"}</span> : <span className='flex gap-1 text-red-400'><CircleSlash2 />{"NÃO"}</span>}</span>
                  </div>

                </div> */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddCampeonatoModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddCampeonato}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                  >
                    Criar Campeonato
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Alter Campeonato Modal */}
        {showEditCampeonatoModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                Cadastrar Nova Equipe
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Equipe <span className='text-red-600'>*</span></label>
                  <input
                    type="text"
                    ref={nomeRef}
                    value={campeonatoForm.nome}
                    onChange={
                      (e) => {
                        setCampeonatoForm({ ...campeonatoForm, nome: e.target.value })
                        setFieldErrors((prev) => {
                          const { nome, ...rest } = prev
                          return rest
                        })
                      }
                    }
                    className={`${fieldErrors.nome ? "border border-red-500 focus:ring-2 focus:ring-red-400" : "border border-gray-300 focus:ring-2 focus:ring-blue-200"} w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none`}
                    placeholder="Ex: Pescadores do Norte"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de Integrantes <span className='text-red-600'>*</span></label>
                  <input
                    type="number"
                    ref={dataInicialRef}
                    value={campeonatoForm.data_inicial}
                    onChange={(e) => {
                      setCampeonatoForm({ ...campeonatoForm, data_inicial: e.target.value })
                      setFieldErrors((prev) => {
                        const { data_inicial, ...rest } = prev
                        return rest
                      })
                    }}
                    className={`${fieldErrors.data_inicial ? "border border-red-500 focus:ring-2 focus:ring-red-400" : "border border-gray-300 focus:ring-2 focus:ring-blue-200"} w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none`}
                    placeholder="1"
                    min="1"
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowEditCampeonatoModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleEditCampeonato}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                  >
                    Alterar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

      </div >



    </>

  );
}