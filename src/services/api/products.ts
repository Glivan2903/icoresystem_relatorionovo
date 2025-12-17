import api from './index';

export interface Product {
    id: string;
    nome: string;
    codigo_interno: string;
    codigo_barra: string;
    grupo_id: string;
    nome_grupo: string;
    estoque: number;
    valor_custo: string;
    valor_venda: string;
    ativo: string;
}

export interface ProductResponse {
    code: number;
    status: string;
    meta: {
        total_registros: number;
        total_paginas: number;
    };
    data: Product[];
}

export const productService = {
    getAll: async (page = 1, limit = 100) => {
        const response = await api.get<ProductResponse>('/produtos', {
            params: { pagina: page, limite: limit }
        });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<{ data: Product }>(`/produtos/${id}`);
        return response.data.data;
    },

    updatePrice: async (id: string, newPrice: number) => {
        // Note: The API might require sending the full object or a specific structure.
        // Based on docs, PUT /produtos/{id} expects fields.
        // We'll need to fetch specific fields first if partial update isn't supported, 
        // but for now simplified to sending price.
        // Real implementation might need to handle other mandatory fields if any.
        const response = await api.put(`/produtos/${id}`, {
            valor_venda: newPrice.toFixed(4)
        });
        return response.data;
    }
};
