import api from './index';

export interface PaymentMethod {
    id: string;
    nome: string;
    tipo: string;
}

interface PaymentMethodItem {
    FormasPagamento: {
        id: string;
        nome: string;
        tipo: string;
        // Other fields we don't need for the dropdown
    };
}

interface ApiResponse {
    code: number;
    data: PaymentMethodItem[];
}

export const paymentMethodsService = {
    getAll: async () => {
        const response = await api.get<ApiResponse[]>('/formas_pagamentos');
        // The API returns an array wrapped in another array as per the user's example: [ { data: [...] } ]
        // We need to access the first element of the response data, then its inner 'data' property.
        // And then map each item to extract 'FormasPagamento'.

        const rootData = response.data[0];
        if (!rootData || !rootData.data) return [];

        return rootData.data.map(item => ({
            id: item.FormasPagamento.id,
            nome: item.FormasPagamento.nome,
            tipo: item.FormasPagamento.tipo
        }));
    }
};
