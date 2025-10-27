/**
 * API Client - Cliente HTTP para comunicação com a API
 * Sistema de Chamados - Faculdade
 */

class ApiClient {
    constructor() {
        this.baseURL = 'http://localhost:5246/api';
        this.token = localStorage.getItem('token');
    }

    /**
     * Método genérico para fazer requisições HTTP
     * @param {string} endpoint - Endpoint da API (sem /api)
     * @param {object} options - Opções da requisição (method, body, headers)
     * @returns {Promise<object>} - Resposta da API
     */
    async request(endpoint, options = {}) {
        // Atualiza token do localStorage
        this.token = localStorage.getItem('token');

        // Monta URL completa
        const url = `${this.baseURL}${endpoint}`;

        // Headers padrão
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Adiciona token JWT se existir
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        // Configuração da requisição
        const config = {
            method: options.method || 'GET',
            headers: headers,
            ...options
        };

        // Adiciona body se existir e não for GET
        if (options.body && config.method !== 'GET') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);

            // Trata resposta vazia (204 No Content)
            if (response.status === 204) {
                return { success: true };
            }

            // Tenta parsear JSON
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            // Verifica se houve erro HTTP
            if (!response.ok) {
                // Token expirado ou inválido
                if (response.status === 401) {
                    this.handleUnauthorized();
                }

                throw new ApiError(
                    data.message || data || 'Erro na requisição',
                    response.status,
                    data
                );
            }

            return data;
        } catch (error) {
            // Erro de rede ou fetch
            if (error instanceof ApiError) {
                throw error;
            }

            // Erro de conexão
            console.error('Erro de conexão:', error);
            throw new ApiError(
                'Erro ao conectar com o servidor. Verifique sua conexão.',
                0,
                error
            );
        }
    }

    /**
     * Trata resposta 401 Unauthorized
     */
    handleUnauthorized() {
        console.warn('Token inválido ou expirado. Redirecionando para login...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redireciona para login se não estiver lá
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = '/pages/login.html';
        }
    }

    /**
     * GET - Buscar dados
     * @param {string} endpoint - Endpoint da API
     * @param {object} params - Query params (opcional)
     * @returns {Promise<object>}
     */
    async get(endpoint, params = {}) {
        // Adiciona query params se existirem
        if (Object.keys(params).length > 0) {
            const queryString = new URLSearchParams(params).toString();
            endpoint = `${endpoint}?${queryString}`;
        }

        return this.request(endpoint, { method: 'GET' });
    }

    /**
     * POST - Criar recurso
     * @param {string} endpoint - Endpoint da API
     * @param {object} data - Dados a enviar
     * @returns {Promise<object>}
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: data
        });
    }

    /**
     * PUT - Atualizar recurso
     * @param {string} endpoint - Endpoint da API
     * @param {object} data - Dados a atualizar
     * @returns {Promise<object>}
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data
        });
    }

    /**
     * DELETE - Deletar recurso
     * @param {string} endpoint - Endpoint da API
     * @returns {Promise<object>}
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    /**
     * PATCH - Atualização parcial
     * @param {string} endpoint - Endpoint da API
     * @param {object} data - Dados a atualizar
     * @returns {Promise<object>}
     */
    async patch(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: data
        });
    }
}

/**
 * Classe de erro customizada para API
 */
class ApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

// Exporta instância única do cliente API
const api = new ApiClient();

// Torna disponível globalmente
window.api = api;
window.ApiError = ApiError;
