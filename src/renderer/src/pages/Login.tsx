import { Anchor, Fish, Trophy, Users } from 'lucide-react';
import { motion } from "framer-motion";
import { useEffect, useState } from 'react';



export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
    const [loading, setIsLoading] = useState(false);
    const [formData, setFomrData] = useState({
        usuario: "",
        senha: ""
    });

    const loginSubmit = async () => {
        try {
            if (!formData.usuario || !formData.senha) {
                alert('Informe email e senha')
                return
            }

            const result = await window.api.login(formData)
            

            if (!result.success) {
                alert(result.message)
                return
            }        

            onLogin(result.user)


            // redirecionar / fechar modal / carregar app
        } catch (error: any) {
            console.error(error)
            alert(error.message || 'Email ou senha inválidos')
        }
    }


    // useEffect(() => {
    //     setIsLoading(false)
    // }, [])

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
                {/* Header */}
                <div className="bg-linear-to-r from-blue-600 to-blue-700 p-8 text-center">
                    <motion.div
                        initial={{ y: -20 }}
                        animate={{ y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center justify-center gap-3 mb-4"
                    >
                        <Anchor className="w-12 h-12 text-white" />
                        <h1 className="text-3xl font-bold text-white">Battle Fish System</h1>
                    </motion.div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-blue-100 text-sm"
                    >
                        Sistema de Ranking de Campeonato de Pesca
                    </motion.p>
                </div>

                {/* Content */}
                <div className="p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-6"
                    >
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Bem-vindo!
                            </h2>
                            <p className="text-gray-600">
                                Faça login para acessar o sistema
                            </p>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-3 gap-4 py-4">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                                    <Trophy className="w-6 h-6 text-blue-600" />
                                </div>
                                <p className="text-xs text-gray-600">Rankings</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                                    <Fish className="w-6 h-6 text-green-600" />
                                </div>
                                <p className="text-xs text-gray-600">Grupos</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                                    <Users className="w-6 h-6 text-purple-600" />
                                </div>
                                <p className="text-xs text-gray-600">Equipes</p>
                            </div>
                        </div>

                        <div className="flex-row">
                            <div className="flex flex-col items-center justify-center gap-2 mb-2">
                                <input
                                    type="text"
                                    value={formData.usuario}
                                    onChange={(e) => setFomrData({
                                        ...formData,
                                        usuario: e.target.value
                                    })}
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                                    placeholder="Usuário"
                                />
                            </div>
                            <div className="flex flex-col items-center justify-center gap-2">
                                <input
                                    type="password"
                                    value={formData.senha}
                                    onChange={(e) => setFomrData({
                                        ...formData,
                                        senha: e.target.value
                                    })}
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                                    placeholder="Senha"
                                />
                            </div>
                        </div>

                        {/* Login Button */}

                        <button
                            onClick={loginSubmit}
                            disabled={false}
                            className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Carregando...
                                </span>
                            ) : (

                                "Acessar"

                            )}
                        </button>

                        <p className="text-xs text-gray-500 text-center">
                            Ao fazer login, você concorda com nossos termos de uso
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
