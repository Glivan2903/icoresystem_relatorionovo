import api from './index';

export interface QuoteItem {
    produto_id?: number;
    nome_produto?: string;
    quantidade: string;
    valor_unitario: string;
    valor_total: string;
}

export interface Quote {
    id: string;
    codigo: string;
    cliente_id: string;
    nome_cliente: string;
    data: string;
    valor_total: string;
    situacao: string; // nome_situacao in response usually
    produtos?: QuoteItem[];
}

export interface QuotesResponse {
    code: number;
    status: string;
    meta: {
        total_registros: number;
        total_paginas: number;
    };
    data: Quote[];
}

export const quotesService = {
    getAll: async (startDate?: string, endDate?: string, page = 1, limit = 100) => {
        const params: any = { pagina: page, limit: limit };
        if (startDate) params.data_inicio = startDate;
        if (endDate) params.data_fim = endDate;

        const response = await api.get<QuotesResponse>('/orcamentos', { params });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<{ data: Quote }>(`/orcamentos/${id}`);
        return response.data.data;
    }
};
