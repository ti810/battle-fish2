import { PeixeModel } from '../models/PeixeModel'
import { NewPeixe, PeixeCustomer } from '../shared/types/interfaces'

export class PeixeService {
  constructor(private model: PeixeModel) {}

  listar(): PeixeCustomer[] {
    return this.model.listar()
  }

  listarById(id: number): PeixeCustomer | null {
    if (!id || id <= 0) {
      throw new Error('ID inválido')
    }
    return this.model.listarById(id)
  }

  adicionar(doc: NewPeixe): number {
    // REGRAS DE NEGÓCIO AQUI
    if (!doc.tipo || doc.tipo.length < 3) {
      throw new Error('Tipo do peixe inválido, minimo 4 caracteres')
    }

    if (doc.peso <= 0 || doc.tamanho <= 0) {
      throw new Error('Peso e tamanho devem ser maiores que zero')
    }

    if (doc.id_membro <= 0) {
      throw new Error('Usuário inválido')
    }

    return this.model.add(doc)
  }

  delete(id: number): boolean {
    if (!id || id <= 0) {
      throw new Error('ID inválido')
    }
    return this.model.delete(id)
  }
}
