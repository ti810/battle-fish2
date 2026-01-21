import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Plus, Search, Fish, MoreVertical, Scale, Ruler, Users, Edit2, Trash2 } from 'lucide-react';
import { findDimensionValueType, motion } from 'framer-motion';
import { agoraParaSQLite } from '../lib/utils';
import { NewGroupCustomer, GroupCustomer, PeixeCustomer, NewPeixeCustomer } from '~/src/shared/types/interfaces';
import { toast } from 'sonner';
import Loader from '../components/Loader';
import { formValidation } from '../hooks/formValidation';
import { grupoSchema } from '../hooks/formValidation';
import { Rifm } from 'rifm';


export default function Grupos() {

  const [openId, setOpenId] = useState(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const toggleMenu = (id: any) => {
    setOpenId(openId === id ? null : id)
  }

  const [loading, setLoading] = useState(false);

  const nomeRef = useRef<HTMLInputElement>(null)
  const qtdeRef = useRef<HTMLInputElement>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const [showAddFishModal, setShowAddFishModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
  const [grupos, setGrupos] = useState<GroupCustomer[]>([])
  const [peixes, setPeixes] = useState<GroupCustomer[]>([])
  const [grupoId, setGrupoId] = useState<number | null>(null)

  // Form states
  const [grupoForm, setGrupoForm] = useState<NewGroupCustomer | GroupCustomer>({
    id: Number(null as number | null),
    nome: "",
    qtde_membros: 1,
    criado_em: agoraParaSQLite()
  });

  const [peixeForm, setPeixeForm] = useState<NewPeixeCustomer | PeixeCustomer>({
    id: Number(null as number | null),
    tipo: "",
    tamanho: "",
    peso: "",
    nome_membro: "",
    id_membro: Number(null as number | null),
    criado_em: agoraParaSQLite()
  });

  const initialGrupoForm = {
    id: Number(null as number | null),
    nome: "",
    qtde_membros: 1,
    criado_em: "",
  }


  useEffect(() => { console.log(grupoForm) }, [grupoForm])


  // CRUD Grupo 
 
  const handleEditGroup = async () => {
    try {

      const validationRules = formValidation(grupoSchema, grupoForm)

      if (!validationRules.success) {
        setFieldErrors(validationRules.fieldErrors)
        const firstField = Object.keys(validationRules.fieldErrors)[0]
        if (firstField === "nome") {
          nomeRef.current?.focus()
        }

        if (firstField === "qtde_membros") {
          qtdeRef.current?.focus()
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
      setLoading(true)

      if (!grupoId) {
        toast.error("Grupo não carregado")
        return
      }

      const res = await window.api.editGrupoById(grupoForm as GroupCustomer)

      if (res.success) {
        toast.success("Grupo salvo com sucesso")
        // Limpar valores dos Inputs 
        setGrupoForm(initialGrupoForm)
        setShowEditGroupModal(false)
        fetchListGroup()

      }

    } catch (error) {
      console.log("Erro ao salvar dados do Grupo", error)
      toast.error(`Erro ao salvar dados do Grupo ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAddGroup = async () => {
    try {

      const validationRules = formValidation(grupoSchema, grupoForm)

      if (!validationRules.success) {
        setFieldErrors(validationRules.fieldErrors)
        const firstField = Object.keys(validationRules.fieldErrors)[0]
        if (firstField === "nome") {
          nomeRef.current?.focus()
        }

        if (firstField === "qtde_membros") {
          qtdeRef.current?.focus()
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
      setLoading(true)

      const res = await window.api.addNovoGrupo(grupoForm as NewGroupCustomer)

      if (res.success) {
        toast.success("Grupo salvo com sucesso")
        // Limpar valores dos Inputs 
        setGrupoForm(initialGrupoForm)
        setShowAddGroupModal(false)
        fetchListGroup()

      }


    } catch (error) {
      console.log("Erro ao salvar dados do Grupo", error)
      toast.error(`Erro ao salvar dados do Grupo ${error}`)
    } finally {
      setLoading(false)
    }

  };

  const handleDeletarGroup = async () => {
    try {
      setLoading(true)

      const res = await window.api.deletarGrupo(Number(grupoId))
      if (res.success) {
        toast.success(`Grupo excluído com sucesso`)
        setShowDeleteGroupModal(false)
        fetchListGroup()

      }

    } catch (error) {
      console.log("Erro ao listar Grupos", error)
      toast.error(`Erro ao listar Grupos ${error}`)

    } finally {
      setLoading(false)
    }
  }

  // CRUD Peixe 

    const handleAddPeixe = async () => {
    try {

      const validationRules = formValidation(peixeSchema, peixeFormForm)

      if (!validationRules.success) {
        setFieldErrors(validationRules.fieldErrors)
        const firstField = Object.keys(validationRules.fieldErrors)[0]
        if (firstField === "nome") {
          nomeRef.current?.focus()
        }

        if (firstField === "qtde_membros") {
          qtdeRef.current?.focus()
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
      setLoading(true)

      const res = await window.api.addNovoGrupo(grupoForm as NewGroupCustomer)

      if (res.success) {
        toast.success("Grupo salvo com sucesso")
        // Limpar valores dos Inputs 
        setGrupoForm(initialGrupoForm)
        setShowAddGroupModal(false)
        fetchListGroup()

      }


    } catch (error) {
      console.log("Erro ao salvar dados do Grupo", error)
      toast.error(`Erro ao salvar dados do Grupo ${error}`)
    } finally {
      setLoading(false)
    }

  };

  const fetchListGroup = async () => {
    try {
      setLoading(true)

      const res = await window.api.listarGrupos()
      if (res.success) {
        setGrupos(res.data)
      }

    } catch (error) {
      console.log("Erro ao listar Grupos", error)
      toast.error(`Erro ao listar Grupos ${error}`)
    } finally {
      setLoading(false)
    }

  }

  const getGroupId = async (id: number) => {
    try {
      const res = await window.api.listarGrupoById(id)
      setGrupoForm(res.data)
      setGrupoId(res.data.id)

    } catch (error) {
      console.log("Erro ao carregar Grupo", error)
      toast.error(`Erro ao carregar Grupo ${error}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchListGroup()
  }, [])

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpenId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);

  }, [])


  return (
    <>
      <Loader show={loading} />
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Grupos de Pesca</h1>
            <p className="text-gray-500">Gerencie as equipes do campeonato</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddFishModal(true)}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-green-200"
            >
              <Fish className="w-4 h-4" />
              Cadastrar Peixe
            </button>
            <button
              onClick={() => setShowAddGroupModal(true)}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-200"
            >
              <Users className="w-4 h-4" />
              Nova Equipe
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar grupos..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {grupos.map((grupo, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={grupo.id}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
            >
              <div className="flex gap-3 justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                    {grupo.nome.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{grupo.nome}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${grupo.ativo === 1 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {grupo.ativo === 1 ? "ATIVO" : "INATIVO"}
                    </span>
                  </div>
                </div>
                <div className='bg-white relative'>
                  <div key={grupo.id} className="right-0 absolute flex flex-col items-end">
                    <button onClick={() => toggleMenu(grupo.id)} type='button' className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {grupo.id === openId && (
                      <div ref={dropdownRef} className={`dropdown-menu active float-right text-gray-500 bg-white drop-shadow-lg drop-shadow-gray-700 rounded-[5px] text-left`}>
                        <button type='button' onClick={() => {
                          setShowEditGroupModal(true)
                          getGroupId(grupo.id)
                        }} className='w-full px-4 py-2 rounded-tl-[5px] rounded-tr-[5px] hover:bg-gray-300 flex flex-row text-blue-600'><Edit2 className="w-5 h-5" />&nbsp;&nbsp;Editar</button>
                        <button type='button' onClick={() => {
                          setShowDeleteGroupModal(true)
                          getGroupId(grupo.id)
                        }} className='w-full px-4 py-2 rounded-bl-[5px] rounded-br-[5px] hover:bg-gray-300 flex flex-row text-red-600'><Trash2 className="w-5 h-5" />&nbsp;&nbsp;Deletar</button>
                      </div>
                    )}
                  </div>
                  {/* <div key={grupo.id} className="right-0 absolute flex flex-col items-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu(grupo.id);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {grupo.id === openId && (
                      <div
                        className="dropdown-menu active float-right text-gray-500 bg-white drop-shadow-lg rounded-[5px] text-left"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setShowEditGroupModal(true);
                          }}
                          className="w-full px-4 py-2 rounded-tl-[5px] rounded-tr-[5px] hover:bg-gray-300 flex flex-row"
                        >
                          <Edit className="w-5 h-5" />
                          &nbsp;&nbsp;Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowDeleteGroupModal(true);
                          }}
                          className="w-full px-4 py-2 rounded-bl-[5px] rounded-br-[5px] hover:bg-gray-300 flex flex-row"
                        >
                          <Trash className="w-5 h-5" />
                          &nbsp;&nbsp;Deletar
                        </button>
                      </div>
                    )}
                  </div> */}

                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-gray-50 p-2 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Integrantes</p>
                  <p className="font-semibold text-gray-900">{grupo.qtde_membros}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Capturas</p>
                  {/* <p className="font-semibold text-blue-600">{grupo.catches}</p> VER DEPOIS */}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-50">
                {/* <span>Última captura: {grupo.lastCatch}</span> VER DEPOIS */}

                <button
                  onClick={() => null}
                  className="text-blue-600 hover:text-blue-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Adicionar Peixe
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Add Catch Modal */}
        {showAddFishModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Fish className="w-6 h-6 text-green-600" />
                Cadastrar Captura de Peixe
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>

                  <select
                    value={grupoForm.id ?? null}
                    onChange={(e) => setGrupoForm({ ...grupoForm, id: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-200 focus:outline-none"
                  >
                    <option disabled value="0">Selecione um grupo...</option>
                    {grupos.map((grupo) => (
                      <option key={grupo.id} value={grupo.id}>{grupo.nome}</option>
                    ))}
                  </select>


                  {/* {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)} */}

                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 items-center gap-1">
                    <Fish className="w-4 h-4" /> Espécie
                  </label>
                  <input
                    type="text"
                    value={peixeForm.tipo}
                    onChange={(e) => setPeixeForm({ ...peixeForm, tipo: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-200 focus:outline-none"
                    placeholder="Ex: Tucunaré, Dourado..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 items-center gap-1">
                      <Scale className="w-4 h-4" /> Peso (kg)
                    </label>
                    <Rifm
                      value={peixeForm.peso}
                      onChange={(valor) =>
                        setPeixeForm({ ...peixeForm, peso: valor })
                      }
                      format={(str) =>
                        str
                          .replace(/[^\d]/g, "")
                          .replace(/(\d{1,3})(\d{3})$/, "$1,$2")
                      }
                    >
                      {({ value, onChange }) => (
                        <input
                          value={value}
                          onChange={onChange}
                          placeholder="0,00"
                          className="border rounded p-2 w-full"
                        />
                      )}
                    </Rifm>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 items-center gap-1">
                      <Ruler className="w-4 h-4" /> Tamanho (cm)
                    </label>
                    <Rifm
                      value={peixeForm.tamanho}
                      onChange={(valor) =>
                        setPeixeForm({ ...peixeForm, tamanho: valor })
                      }
                      format={(str) =>
                        str
                          .replace(/[^\d]/g, "")
                          .slice(0, 3) // até 999 cm
                      }
                    >
                      {({ value, onChange }) => (
                        <input
                          value={value}
                          onChange={onChange}
                          placeholder="Ex.: 100 cm"
                          className="border rounded p-2 w-full"
                        />
                      )}
                    </Rifm>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddFishModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {

                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
                  >
                    Salvar Captura
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add Group Modal */}
        {showAddGroupModal && (
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
                    value={grupoForm.nome}
                    onChange={
                      (e) => {
                        setGrupoForm({ ...grupoForm, nome: e.target.value })
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
                    ref={qtdeRef}
                    value={grupoForm.qtde_membros}
                    onChange={(e) => {
                      setGrupoForm({ ...grupoForm, qtde_membros: Number(e.target.value) })
                      setFieldErrors((prev) => {
                        const { qtde_membros, ...rest } = prev
                        return rest
                      })
                    }}
                    className={`${fieldErrors.qtde_membros ? "border border-red-500 focus:ring-2 focus:ring-red-400" : "border border-gray-300 focus:ring-2 focus:ring-blue-200"} w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none`}
                    placeholder="1"
                    min="1"
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddGroupModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddGroup}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                  >
                    Criar Equipe
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Grupo Modal  */}
        {showEditGroupModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                Editar Equipe
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Equipe <span className='text-red-600'>*</span></label>
                  <input
                    type="text"
                    ref={nomeRef}
                    value={grupoForm.nome}
                    onChange={
                      (e) => {
                        setGrupoForm({ ...grupoForm, nome: e.target.value })
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
                    ref={qtdeRef}
                    value={grupoForm.qtde_membros}
                    onChange={(e) => {
                      setGrupoForm({ ...grupoForm, qtde_membros: Number(e.target.value) })
                      setFieldErrors((prev) => {
                        const { qtde_membros, ...rest } = prev
                        return rest
                      })
                    }}
                    className={`${fieldErrors.qtde_membros ? "border border-red-500 focus:ring-2 focus:ring-red-400" : "border border-gray-300 focus:ring-2 focus:ring-blue-200"} w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none`}
                    placeholder="1"
                    min="1"
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowEditGroupModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleEditGroup}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                  >
                    Editar Equipe
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {showDeleteGroupModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                Deletar esta Equipe?
              </h2>

              <div className='bg-amber-100 w-full rounded-md p-1 text-left'>
                <span className='text-[20px] ml-4'>Nome: </span>
                <span className='text-red-500 font-bold text-[24px]'>  {grupoForm.nome}</span>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowDeleteGroupModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeletarGroup}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                  >
                    Confirmar deleção
                  </button>
                </div>
              </div>
            </motion.div>
          </div >
        )
        }
      </div >
    </>

  );
}
