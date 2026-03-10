import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, Fish, MoreVertical, Scale,  Users, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { agoraParaSQLite, tempoRelativo } from '../lib/utils';
import { NewEquipeCustomer, PeixeCustomer, NewPeixeCustomer, EquipeCustomer, EquipeCustomerComUltimaCaptura, NewAtletaCustomer, AtletaCustomer } from '~/src/shared/types/interfaces';
import { toast } from 'sonner';
import Loader from '../components/Loader';
import { formValidation } from '../hooks/formValidation';
import { equipeSchema, peixeSchema, atletaSchema } from '../hooks/formValidation';
import { Rifm } from 'rifm';

const TEAM_TYPE_OPTIONS = ['Masculino', 'Misto', 'Senior'] as const

function parseOptionalNumber(value: string): number | undefined {
  return value.trim() === '' ? undefined : Number(value)
}

export default function Equipes() {

  const location = useLocation()
  const navigate = useNavigate()


  const [openId, setOpenId] = useState(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const toggleMenu = (id: any) => {
    setOpenId(openId === id ? null : id)
  }


  // Search 
  const [searchTerm, setSearchTerm] = useState('');

  const [loading, setLoading] = useState(false);

  const nomeRef = useRef<HTMLInputElement>(null)
  const setorRef = useRef<HTMLInputElement>(null)
  const tipoEquipeRef = useRef<HTMLSelectElement>(null)
  const nomeAtref = useRef<HTMLInputElement>(null)
  const qtdeRef = useRef<HTMLInputElement>(null)

  const idEquipeRef = useRef<HTMLInputElement>(null)
  const pesoRef = useRef<HTMLInputElement>(null)

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const [showAddPeixeModal, setShowAddPeixeModal] = useState(false);
  const [showAddEquipeModal, setShowAddEquipeModal] = useState(false);
  const [showAtletaModal, setShowAtletaModal] = useState(false);
  const [showEditEquipeModal, setShowEditEquipeModal] = useState(false);
  const [showDeleteEquipeModal, setShowDeleteEquipeModal] = useState(false);
  const [equipes, setEquipes] = useState<EquipeCustomerComUltimaCaptura[]>([]);
  const [equipeSelecionada, setEquipeSelecionada] = useState<EquipeCustomerComUltimaCaptura | null>(null)
  const [isEquipeSelecionada, setIsEquipeSelecionada] = useState(false);
  const [contagem, setContagem] = useState({
    atletas: 0,
    peixes: 0
  })


  const [equipeId, setEquipeId] = useState<number | null>(null)


  // Form states
  const [equipeForm, setEquipeForm] = useState<NewEquipeCustomer | EquipeCustomer>({
    nome: "",
    tipo_equipe: "Misto",
    criado_em: agoraParaSQLite(),
  });

  const [peixeForm, setPeixeForm] = useState<NewPeixeCustomer | PeixeCustomer>({
    peso: "",
    equipe_id: 0,
    criado_em: agoraParaSQLite()
  })

  const [atletaForm, setAtletaForm] = useState<NewAtletaCustomer | AtletaCustomer>({
    nome: "",
    equipe_id: 0,
    criado_em: agoraParaSQLite()
  });

  const initialEquipeForm = {
    nome: "",
    tipo_equipe: "Misto",
    criado_em: "",
  }

  const filteredEquipes = equipes.filter(
    (m) => 
      m.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )



  // CRUD Equipe 

  const handleEditEquipe = async () => {
    try {

      const validationRules = await formValidation(equipeSchema, equipeForm)

      if (!(validationRules).success) {
        setFieldErrors(validationRules.fieldErrors)
        const firstField = Object.keys(validationRules.fieldErrors)[0]
        if (firstField === "nome") {
          nomeRef.current?.focus()
        }

        if (firstField === "setor") {
          setorRef.current?.focus()
        }

        if (firstField === "tipo_equipe") {
          tipoEquipeRef.current?.focus()
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

      if (!equipeId) {
        toast.error("Equipe não carregado")
        return
      }

      const res = await window.api.editEquipeById(equipeForm as EquipeCustomer)

      if (res.data.success) {
        toast.success("Equipe alterada com sucesso")
        // Limpar valores dos Inputs 
        setEquipeForm(initialEquipeForm)
        setShowEditEquipeModal(false)
        carregarDados()

      } else {
        toast.error(res.data.message)
      }

    } catch (error) {
      console.log("Erro ao salvar dados do Equipe", error)
      toast.error(`Erro ao salvar dados do Equipe ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEquipe = async () => {
    try {

      const validationRules = await formValidation(equipeSchema, equipeForm)

      if (!validationRules.success) {
        setFieldErrors(validationRules.fieldErrors)
        const firstField = Object.keys(validationRules.fieldErrors)[0]
        if (firstField === "nome") {
          nomeRef.current?.focus()
        }

        if (firstField === "qtde_atletas") {
          qtdeRef.current?.focus()
        }

        if (firstField === "setor") {
          setorRef.current?.focus()
        }

        if (firstField === "tipo_equipe") {
          tipoEquipeRef.current?.focus()
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


      const res = await window.api.addNovaEquipe(equipeForm as NewEquipeCustomer)

      if (!res.data.success) {
        toast.error(res.data.message || "Erro ao salvar equipe")
      }

      if (res.data.success) {
        toast.success("Equipe salvo com sucesso")
        // Limpar valores dos Inputs 
        setEquipeForm(initialEquipeForm)
        setShowAddEquipeModal(false)
        carregarDados()
      }


    } catch (error) {
      console.log("Erro ao salvar dados do Equipe", error)
      toast.error(`Erro ao salvar dados do Equipe ${error}`)
    } finally {
      setLoading(false)
    }

  };

  const handleDeletarEquipe = async () => {
    try {
      setLoading(true)

      const res = await window.api.deletarEquipe(Number(equipeId))
      if (res.success) {
        toast.success(`Equipe excluído com sucesso`)
        setShowDeleteEquipeModal(false)
        carregarDados()

      }

    } catch (error) {
      console.log("Erro ao listar Equipes", error)
      toast.error(`Erro ao listar Equipes ${error}`)

    } finally {
      setLoading(false)
    }
  }

  const getEquipeId = async (id: number) => {
    try {
      const res = await window.api.listarEquipeById(id)
      setEquipeForm(res.data)
      setEquipeId(res.data.id)

    } catch (error) {
      console.log("Erro ao carregar Equipe", error)
      toast.error(`Erro ao carregar Equipe ${error}`)
    } finally {
      setLoading(false)
    }
  }

  // CRUD Peixe 

  const handleAddPeixe = async () => {
    try {

      const validationRules = await formValidation(peixeSchema, peixeForm)

      if (!validationRules.success) {
        setFieldErrors(validationRules.fieldErrors)
        const firstField = Object.keys(validationRules.fieldErrors)[0]

        if (firstField === "peso") {
          pesoRef.current?.focus()
        }

        if (firstField === "equipe_id") {
          idEquipeRef.current?.focus()
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

      // const pesoAtualizado = peixeForm.peso.replace(/[^0-9,]/g, '')  deixa , 
      // const pesoAtualizado = peixeForm.peso.replace(/[^0-9.]/g, '') // deixa .
      const pesoAtualizado = peixeForm.peso.replace(/[^0-9]/g, '') // deixa apenas números
      const peixeAtualizado = {
        ...peixeForm,
        peso: pesoAtualizado
      }

      // console.log(peixeAtualizado)
      // return


      const res = await window.api.addNovoPeixe(peixeAtualizado as NewPeixeCustomer)



      if (res.success) {
        toast.success("Peixe salvo com sucesso")
        // Limpar valores dos Inputs 
        setPeixeForm({
          peso: "",
          equipe_id: Number(null as number | null),
          criado_em: ""
        })
        setShowAddPeixeModal(false)
        carregarDados()

      } else {
        toast.error(res?.message || "Nao foi possivel salvar esta captura.")
      }


    } catch (error) {
      console.log("Erro ao salvar dados do Peixe", error)
      toast.error(`Erro ao salvar dados do Peixe ${error}`)
    } finally {
      setLoading(false)
    }

  };

  const carregarDados = async () => {
    const res = await window.api.listarEquipesComUltimaCaptura()

    if (res.success) {
      setEquipes(res.data)
    }
  }
  // CRUD atleta
  const handleAddAtleta = async () => {
    try {

      const validationRules = await formValidation(atletaSchema, atletaForm)

      if (!validationRules.success) {
        setFieldErrors(validationRules.fieldErrors)
        const firstField = Object.keys(validationRules.fieldErrors)[0]
        if (firstField === "nome") {
          nomeAtref.current?.focus()
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


      const res = await window.api.addNovoAtleta(atletaForm as NewAtletaCustomer)


      if (res.success) {
        toast.success("Atleta salvo com sucesso")
        // Limpar valores dos Inputs 
        setAtletaForm({
          nome: "",
          equipe_id: Number(null as number | null),
        })
        setShowAtletaModal(false)
        carregarDados()

      } else {
        toast.error(res?.message || "Nao foi possivel salvar este atleta.")
      }


    } catch (error) {
      console.log("Erro ao salvar dados do Equipe", error)
      toast.error(`Erro ao salvar dados do Equipe ${error}`)
    } finally {
      setLoading(false)
    }

  };

  useEffect(() => {
    carregarDados()
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

  useEffect(() => {
    if (equipeId) {
      setPeixeForm(prev => ({
        ...prev,
        equipe_id: equipeId
      }))
    }
  }, [equipeId]);

  useEffect(() => {
    if (equipeId) {
      setAtletaForm(prev => ({
        ...prev,
        equipe_id: equipeId
      }))
    }
  }, [equipeId]);


  return (
    <>
      <Loader show={loading} />
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onAnimationComplete={() => {
            if (location.state?.openModal) {
              setShowAddEquipeModal(true)
            }
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Equipes de Pesca</h1>
              <p className="text-gray-500">Gerencie as equipes do campeonato</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAddPeixeModal(true)
                  setIsEquipeSelecionada(false)
                  setPeixeForm(prev => ({
                    ...prev,
                    equipe_id: 0
                  }));
                }}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-green-200"
              >
                <Fish className="w-4 h-4" />
                Cadastrar Peixe
              </button>
              <button
                onClick={() => {
                  setShowAddEquipeModal(true)
                  setEquipeForm({ nome: "", tipo_equipe: "Misto" })
                }}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-200"
              >
                <Users className="w-4 h-4" />
                Nova Equipe
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-100 mb-6 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm || ""}
                placeholder="Buscar equipes pelo nome..."
                className="w-full h-9 pl-9 pr-4 py- bg-gray-50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                onChange={(e) => setSearchTerm(e.target.value)}

              />
            </div>
          </div>


          {/* Equipes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEquipes.map((equipe, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={equipe.id}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
              >
                <div className="flex gap-3 justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                      {equipe.nome.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{equipe.nome}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${equipe.ativo === 1 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {equipe.ativo === 1 ? "ATIVO" : "INATIVO"}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{equipe.tipo_equipe}</p>
                    </div>
                  </div>
                  <div className='bg-white relative'>
                    <div key={equipe.id} className="right-0 absolute flex flex-col items-end">
                      <button onClick={() => toggleMenu(equipe.id)} type='button' className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {equipe.id === openId && (
                        <div ref={dropdownRef} className={`dropdown-menu active float-right text-gray-500 bg-white drop-shadow-lg drop-shadow-gray-700 rounded-[5px] text-left`}>
                          <button type='button' onClick={() => {
                            setShowEditEquipeModal(true)
                            getEquipeId(equipe.id)
                          }} className='w-full px-4 py-2 rounded-tl-[5px] rounded-tr-[5px] hover:bg-gray-300 flex flex-row text-blue-600'><Edit2 className="w-5 h-5" />&nbsp;&nbsp;Editar</button>
                          <button type='button' onClick={() => {
                            setShowDeleteEquipeModal(true)
                            getEquipeId(equipe.id)
                          }} className='w-full px-4 py-2 rounded-bl-[5px] rounded-br-[5px] hover:bg-gray-300 flex flex-row text-red-600'><Trash2 className="w-5 h-5" />&nbsp;&nbsp;Deletar</button>
                        </div>
                      )}
                    </div>
                    {/* <div key={equipe.id} className="right-0 absolute flex flex-col items-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu(equipe.id);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {equipe.id === openId && (
                      <div
                        className="dropdown-menu active float-right text-gray-500 bg-white drop-shadow-lg rounded-[5px] text-left"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setShowEditEquipeModal(true);
                          }}
                          className="w-full px-4 py-2 rounded-tl-[5px] rounded-tr-[5px] hover:bg-gray-300 flex flex-row"
                        >
                          <Edit className="w-5 h-5" />
                          &nbsp;&nbsp;Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowDeleteEquipeModal(true);
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
                    <p className="font-semibold text-gray-900">{equipe.total_atletas}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Capturas</p>
                    <p className="font-semibold text-blue-600">{equipe.total_peixes}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-50">
                  <span>Última captura: {tempoRelativo(equipe.ultima_captura)}</span>

                  <button
                    onClick={() => {
                      setEquipeSelecionada(equipe)
                      setIsEquipeSelecionada(true)
                      setPeixeForm(prev => ({
                        ...prev,
                        equipe_id: equipe.id
                      }));
                      setShowAddPeixeModal(true)

                    }}
                    className="text-blue-600 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Adicionar Peixe
                  </button>
                  {/* Atleta*/}
                  <button
                    onClick={() => {
                      setEquipeSelecionada(equipe)
                      setIsEquipeSelecionada(true)
                      setAtletaForm(prev => ({
                        ...prev,
                        equipe_id: equipe.id
                      }));
                      setShowAtletaModal(true)

                    }}
                    className="text-blue-600  flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Adicionar Atleta
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Add Catch Modal */}
          {showAddPeixeModal && (
            <div className="equipe fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Equipe</label>

                    <select
                      value={peixeForm.equipe_id ?? ""}
                      onChange={(e) => {
                        setPeixeForm(prev => ({
                          ...prev,
                          equipe_id: Number(e.target.value)
                        }))
                        setEquipeId(peixeForm.equipe_id)
                      }}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-200 focus:outline-none"
                    >
                      <option disabled value={0}>Selecione uma equipe...</option>
                      {equipeSelecionada && isEquipeSelecionada ? (
                        <option value={equipeSelecionada.id as number}>
                          {equipeSelecionada.nome}
                        </option>
                      ) : equipes.map((equipe) => (
                        <option key={equipe.id} value={equipe.id}>{equipe.nome}</option>
                      ))}
                    </select>
                  </div>
                  {/* <div>
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
                  </div> */}
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 items-center gap-1">
                        <Scale className="w-4 h-4" /> Peso (Kg) <small>(Min: 151 gramas)</small>
                      </label>
                      <Rifm
                        value={peixeForm.peso}
                        onChange={(valor) =>
                          setPeixeForm({ ...peixeForm, peso: valor })
                        }
                        format={(str) => {
                          const onlyNumbers = str
                            .replace(/[^\d]/g, "")
                            .replace(/^0+(?=\d)/, "");

                          if (!onlyNumbers) return "";

                          const number = parseInt(onlyNumbers, 10);

                          // Se for menor que 1000 → gramas
                          if (number < 1000) {
                            return Number(number) === 1 ? "1 grama" : number + " gramas";
                          }

                          // Se for 1000 ou mais → aplica sua máscara e adiciona "quilos"
                          const formatted = onlyNumbers
                            .replace(/(\d+)(\d{3})$/, "$1,$2")
                            .replace(/^(\d+),/, (match, p1) =>
                              p1.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + ","
                            );


                          return Number(formatted.replace(",", ".")) === 1 ? formatted + " quilo" : formatted + " quilos";
                        }}
                      >
                        {({ value, onChange }) => (
                          <input
                            ref={pesoRef}
                            value={value}
                            onChange={onChange}
                            placeholder="0,00"
                            className="border rounded p-2 w-full"
                          />
                        )}
                      </Rifm>
                    </div>
                    {/* <div>
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
                    </div> */}
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        handleAddPeixe()
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
                    >
                      Salvar Captura
                    </button>
                    <button
                      onClick={() => setShowAddPeixeModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Add Equipe Modal */}
          {showAddEquipeModal && (
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
                      value={equipeForm.nome}
                      onChange={
                        (e) => {
                          setEquipeForm({ ...equipeForm, nome: e.target.value })
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Equipe <span className='text-red-600'>*</span>
                    </label>
                    <select
                      ref={tipoEquipeRef}
                      value={equipeForm.tipo_equipe}
                      onChange={(e) => {
                        setEquipeForm({ ...equipeForm, tipo_equipe: e.target.value as NewEquipeCustomer['tipo_equipe'] })
                        setFieldErrors((prev) => {
                          const { tipo_equipe, ...rest } = prev
                          return rest
                        })
                      }}
                      className={`${fieldErrors.tipo_equipe ? "border border-red-500 focus:ring-2 focus:ring-red-400" : "border border-gray-300 focus:ring-2 focus:ring-blue-200"} w-full rounded-lg p-2 focus:outline-none`}
                    >
                      {TEAM_TYPE_OPTIONS.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Setor</label>
                    <input
                      type="number"
                      ref={setorRef}
                      value={equipeForm.setor ?? ""}
                      onChange={(e) => {
                        setEquipeForm({ ...equipeForm, setor: parseOptionalNumber(e.target.value) })
                        setFieldErrors((prev) => {
                          const { setor, ...rest } = prev
                          return rest
                        })
                      }}
                      className={`${fieldErrors.setor ? "border border-red-500 focus:ring-2 focus:ring-red-400" : "border border-gray-300 focus:ring-2 focus:ring-blue-200"} w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none`}
                      placeholder="1"
                      min="1"
                    />
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowAddEquipeModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddEquipe}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                    >
                      Criar Equipe
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Edit Equipe Modal  */}
          {showEditEquipeModal && (
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
                      value={equipeForm.nome}
                      onChange={
                        (e) => {
                          setEquipeForm({ ...equipeForm, nome: e.target.value })
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Equipe <span className='text-red-600'>*</span>
                    </label>
                    <select
                      ref={tipoEquipeRef}
                      value={equipeForm.tipo_equipe}
                      onChange={(e) => {
                        setEquipeForm({ ...equipeForm, tipo_equipe: e.target.value as NewEquipeCustomer['tipo_equipe'] })
                        setFieldErrors((prev) => {
                          const { tipo_equipe, ...rest } = prev
                          return rest
                        })
                      }}
                      className={`${fieldErrors.tipo_equipe ? "border border-red-500 focus:ring-2 focus:ring-red-400" : "border border-gray-300 focus:ring-2 focus:ring-blue-200"} w-full rounded-lg p-2 focus:outline-none`}
                    >
                      {TEAM_TYPE_OPTIONS.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Setor</label>
                    <input
                      type="number"
                      ref={setorRef}
                      value={equipeForm.setor ?? ""}
                      onChange={(e) => {
                        setEquipeForm({ ...equipeForm, setor: parseOptionalNumber(e.target.value) })
                        setFieldErrors((prev) => {
                          const { setor, ...rest } = prev
                          return rest
                        })
                      }}
                      className={`${fieldErrors.setor ? "border border-red-500 focus:ring-2 focus:ring-red-400" : "border border-gray-300 focus:ring-2 focus:ring-blue-200"} w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none`}
                      placeholder="1"
                      min="1"
                    />
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowEditEquipeModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleEditEquipe}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                    >
                      Editar Equipe
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
          {showDeleteEquipeModal && (
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
                  <span className='text-red-500 font-bold text-[24px]'>  {equipeForm.nome}</span>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowDeleteEquipeModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDeletarEquipe}
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
          {/*AtletaModal*/}
          {
            showAtletaModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      Novo atleta
                    </h2>

                    <button
                      onClick={() => setShowAtletaModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                      type="button"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Nome */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome completo
                      </label>

                      <input
                        type="text"
                        ref={nomeAtref}
                        value={atletaForm.nome}
                        onChange={(e) => {
                          setAtletaForm({
                            ...atletaForm,
                            nome: e.target.value
                          })
                        }}
                        placeholder='Ex: João da Silva'
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                      />
                    </div>

                    {/* Equipe */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Equipe
                      </label>

                      <select
                        value={atletaForm.equipe_id ?? ""}
                        onChange={(e) => {
                          setAtletaForm(prev => ({
                            ...prev,
                            equipe_id: Number(e.target.value)
                          }))

                          setEquipeId(atletaForm.equipe_id)
                        }}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                      >
                        <option disabled value="">
                          Selecione uma equipe...
                        </option>

                        {equipeSelecionada && isEquipeSelecionada ? (
                          <option value={equipeSelecionada.id}>
                            {equipeSelecionada.nome}
                          </option>
                        ) : (
                          equipes.map((equipe) => (
                            <option key={equipe.id} value={equipe.id}>
                              {equipe.nome}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setShowAtletaModal(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>

                      <button
                        type="button"
                        onClick={handleAddAtleta}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )
          }

        </motion.div>
      </div >


    </>

  );
}
