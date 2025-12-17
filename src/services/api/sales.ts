import api from './index';

export interface SaleItem {
    produto: {
        produto_id: number;
        nome_produto: string | null;
        quantidade: string;
        valor_venda: string;
        valor_total: string;
    }
}

export interface Sale {
    id: string;
    cliente_id: string;
    nome_cliente: string;
    data: string;
    valor_total: string;
    nome_forma_pagamento?: string;
    forma_pagamento_id?: string;
    produtos: SaleItem[];
}

export interface SalesResponse {
    code: number;
    status: string;
    meta: {
        total_registros: number;
        total_paginas: number;
    };
    data: Sale[];
}

export const salesService = {
    getAll: async (startDate?: string, endDate?: string, page = 1, limit = 100) => {
        const params: any = { pagina: page, limit: limit };
        if (startDate) params.data_inicio = startDate;
        if (endDate) params.data_fim = endDate;

        const response = await api.get<SalesResponse>('/vendas', { params });
        return response.data;
    }
};
