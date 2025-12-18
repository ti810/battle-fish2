import { useState } from "react";
import {UserPlus, Search, Edit2, Trash2, X} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

interface Membro {
  id: number;
  name: string;
  role: string;
  group: string;
  email: string;
  status: string;
  phone?: string;
}

export default function Membros() {
  const [members, setMembers] = useState<Membro[]>([
    { id: 1, name: "João Silva", role: "Capitão", group: "Pescadores do Sul", email: "joao@email.com", status: "Ativo", phone: "(11) 98765-4321" },
    { id: 2, name: "Pedro Santos", role: "Membro", group: "Pescadores do Sul", email: "pedro@email.com", status: "Ativo", phone: "(11) 98765-1234" },
    { id: 3, name: "Carlos Oliveira", role: "Capitão", group: "Anzol de Ouro", email: "carlos@email.com", status: "Pendente", phone: "(11) 97654-3210" },
    { id: 4, name: "Ana Souza", role: "Membro", group: "Anzol de Ouro", email: "ana@email.com", status: "Ativo", phone: "(11) 96543-2109" },
    { id: 5, name: "Marcos Lima", role: "Capitão", group: "Maré Alta", email: "marcos@email.com", status: "Ativo", phone: "(11) 95432-1098" },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Membro | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [memberForm, setMemberForm] = useState({
    name: "",
    email: "",
    phone: "",
    group: "Pescadores do Sul",
    role: "Membro",
    status: "Ativo"
  });

  const availableGroups = ["Pescadores do Sul", "Anzol de Ouro", "Maré Alta", "Tubarões"];

  const handleOpenModal = (member?: Membro) => {
    if (member) {
      setEditingMember(member);
      setMemberForm({
        name: member.name,
        email: member.email,
        phone: member.phone || "",
        group: member.group,
        role: member.role,
        status: member.status
      });
    } else {
      setEditingMember(null);
      setMemberForm({
        name: "",
        email: "",
        phone: "",
        group: "Pescadores do Sul",
        role: "Membro",
        status: "Ativo"
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMember(null);
  };

  const handleSaveMember = () => {
    if (!memberForm.name || !memberForm.email) return;

    if (editingMember) {
      setMembers(members.map(m => 
        m.id === editingMember.id 
          ? { ...m, ...memberForm }
          : m
      ));
    } else {
      const newMember: Membro = {
        id: members.length + 1,
        ...memberForm
      };
      setMembers([...members, newMember]);
    }
    handleCloseModal();
  };

  const handleDeleteMember = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este integrante?")) {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrantes</h1>
          <p className="text-gray-500">Gerencie todos os participantes do campeonato</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-200"
        >
          <UserPlus className="w-4 h-4" />
          Adicionar Integrante
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, email ou grupo..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-3">Participante</th>
                <th className="px-6 py-3">Grupo</th>
                <th className="px-6 py-3">Função</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMembers.map((member, idx) => (
                <motion.tr
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={member.id}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{member.name}</div>
                        <div className="text-xs text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{member.group}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                      member.role === "Capitão" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${
                      member.status === "Ativo"
                        ? "bg-green-50 text-green-700 border-green-100"
                        : "bg-yellow-50 text-yellow-700 border-yellow-100"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${member.status === "Ativo" ? "bg-green-500" : "bg-yellow-500"}`} />
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(member)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>Mostrando {filteredMembers.length} de {members.length} integrantes</span>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <UserPlus className="w-6 h-6 text-blue-600" />
                  {editingMember ? "Editar Integrante" : "Novo Integrante"}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={memberForm.name}
                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    placeholder="Ex: João Silva"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={memberForm.email}
                    onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    placeholder="joao@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone (opcional)</label>
                  <input
                    type="tel"
                    value={memberForm.phone}
                    onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    placeholder="(11) 98765-4321"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
                  <select
                    value={memberForm.group}
                    onChange={(e) => setMemberForm({ ...memberForm, group: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  >
                    {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                    <select
                      value={memberForm.role}
                      onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    >
                      <option value="Membro">Membro</option>
                      <option value="Capitão">Capitão</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={memberForm.status}
                      onChange={(e) => setMemberForm({ ...memberForm, status: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Pendente">Pendente</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveMember}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                  >
                    {editingMember ? "Salvar Alterações" : "Adicionar"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
