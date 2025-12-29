import api from './index';

export interface Client {
    id: string;
    nome: string;
    cpf_cnpj: string;
    telefone: string;
    celular?: string;
    email: string;
    ativo?: string;
}

export interface AddressWrapper {
    endereco: {
        tipo_id: string;
        nome_tipo: string;
        cep: string;
        logradouro: string;
        numero: string;
        complemento: string;
        bairro: string;
        pais: string;
        cidade_id: string;
        nome_cidade: string;
        estado: string;
    };
}

export interface ClientDetail extends Client {
    rg: string;
    data_nascimento: string;
    cpf: string;
    cnpj: string;
    enderecos: AddressWrapper[];
    obs: string;
    celular: string;
}

export interface ClientsResponse {
    code: number;
    status: string;
    meta: {
        total_registros: number;
        total_paginas: number;
    };
    data: ClientDetail[];
}

export const clientsService = {
    getAll: async (page = 1, limit = 100, filters?: { nome?: string; cpf_cnpj?: string; email?: string; telefone?: string; ativo?: string }) => {
        const params: any = { pagina: page, limite: limit, ...filters };
        const response = await api.get<ClientsResponse>('/clientes', { params });
        // The API returns ClientDetail even in getAll slightly differently maybe? 
        // But for list view we just need basic fields. Mapping ClientDetail to Client is implicit if fields match.
        return response.data;
    },


    getById: async (id: string) => {
        const response = await api.get<{ data: ClientDetail | ClientDetail[] }>(`/clientes/${id}`);
        const data = response.data.data;
        if (Array.isArray(data)) {
            return data[0];
        }
        return data;
    },

    create: async (data: Partial<Client>) => {
        const response = await api.post('/clientes', data);
        return response.data;
    },

    update: async (id: string, data: Partial<ClientDetail>) => {
        const response = await api.put(`/clientes/${id}`, data);
        return response.data;
    },

    fetchAllClients: async (filters?: { nome?: string; cpf_cnpj?: string; email?: string; telefone?: string; ativo?: string }) => {
        let allClients: ClientDetail[] = [];
        let page = 1;
        let totalPages = 1;

        do {
            const response = await clientsService.getAll(page, 100, filters);
            allClients = [...allClients, ...response.data];
            totalPages = response.meta.total_paginas;
            page++;
        } while (page <= totalPages);

        return allClients;
    }
};
