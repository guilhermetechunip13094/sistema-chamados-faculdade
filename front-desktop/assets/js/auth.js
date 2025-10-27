/**
 * Auth Service - Gerenciamento de Autenticação
 * Sistema de Chamados - Faculdade
 */

class AuthService {
    constructor() {
        this.api = window.api;
        this.tokenKey = 'token';
        this.userKey = 'user';
    }

    /**
     * Realiza login do usuário
     * @param {string} email - Email do usuário
     * @param {string} senha - Senha do usuário
     * @returns {Promise<object>} - Dados do usuário e token
     */
    async login(email, senha) {
        try {
            const response = await this.api.post('/Usuarios/login', {
                email,
                senha
            });

            // Armazena token
            if (response.token) {
                localStorage.setItem(this.tokenKey, response.token);
                
                // Decodifica e armazena informações do usuário
                const userInfo = this.decodeToken(response.token);
                localStorage.setItem(this.userKey, JSON.stringify(userInfo));

                console.log('Login realizado com sucesso!', userInfo);
                return {
                    success: true,
                    user: userInfo,
                    token: response.token
                };
            }

            throw new Error('Token não recebido do servidor');
        } catch (error) {
            console.error('Erro no login:', error);
            throw error;
        }
    }

    /**
     * Registra novo usuário
     * @param {object} userData - Dados do usuário
     * @returns {Promise<object>}
     */
    async register(userData) {
        try {
            const response = await this.api.post('/Usuarios/register', userData);
            
            console.log('Cadastro realizado com sucesso!');
            return {
                success: true,
                message: 'Cadastro realizado! Faça login para continuar.',
                data: response
            };
        } catch (error) {
            console.error('Erro no cadastro:', error);
            throw error;
        }
    }

    /**
     * Realiza logout do usuário
     */
    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        console.log('Logout realizado');
        
        // Redireciona para login
        window.location.href = '/pages/login.html';
    }

    /**
     * Verifica se usuário está autenticado
     * @returns {boolean}
     */
    isAuthenticated() {
        const token = localStorage.getItem(this.tokenKey);
        
        if (!token) {
            return false;
        }

        // Verifica se token está expirado
        try {
            const decoded = this.decodeToken(token);
            const now = Date.now() / 1000; // em segundos
            
            if (decoded.exp && decoded.exp < now) {
                console.warn('Token expirado');
                this.logout();
                return false;
            }

            return true;
        } catch (error) {
            console.error('Erro ao validar token:', error);
            return false;
        }
    }

    /**
     * Obtém role do usuário (Admin, Tecnico, Usuario)
     * @returns {string|null}
     */
    getUserRole() {
        const user = this.getUserInfo();
        return user ? user.role : null;
    }

    /**
     * Obtém informações do usuário logado
     * @returns {object|null}
     */
    getUserInfo() {
        const userJson = localStorage.getItem(this.userKey);
        
        if (!userJson) {
            return null;
        }

        try {
            return JSON.parse(userJson);
        } catch (error) {
            console.error('Erro ao parsear dados do usuário:', error);
            return null;
        }
    }

    /**
     * Obtém token JWT
     * @returns {string|null}
     */
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    /**
     * Decodifica token JWT (base64)
     * @param {string} token - Token JWT
     * @returns {object} - Payload do token
     */
    decodeToken(token) {
        try {
            // JWT tem 3 partes: header.payload.signature
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Token JWT inválido');
            }

            // Decodifica payload (parte central)
            const payload = parts[1];
            const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
            const parsed = JSON.parse(decoded);

            // Extrai informações principais
            return {
                id: parsed.nameid || parsed.sub || parsed.userId,
                email: parsed.email || parsed.unique_name,
                nome: parsed.name || parsed.given_name,
                role: parsed.role || parsed['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
                exp: parsed.exp, // Expiration time
                iat: parsed.iat  // Issued at
            };
        } catch (error) {
            console.error('Erro ao decodificar token:', error);
            throw new Error('Token inválido');
        }
    }

    /**
     * Verifica se usuário tem role específica
     * @param {string} requiredRole - Role necessária
     * @returns {boolean}
     */
    hasRole(requiredRole) {
        const userRole = this.getUserRole();
        return userRole === requiredRole;
    }

    /**
     * Verifica se usuário é Admin
     * @returns {boolean}
     */
    isAdmin() {
        return this.hasRole('Admin');
    }

    /**
     * Verifica se usuário é Técnico
     * @returns {boolean}
     */
    isTecnico() {
        return this.hasRole('Tecnico');
    }

    /**
     * Verifica se usuário é Usuário comum
     * @returns {boolean}
     */
    isUsuario() {
        return this.hasRole('Usuario');
    }

    /**
     * Protege página - redireciona se não autenticado
     * @param {string} requiredRole - Role necessária (opcional)
     */
    requireAuth(requiredRole = null) {
        if (!this.isAuthenticated()) {
            console.warn('Acesso negado: usuário não autenticado');
            window.location.href = '/pages/login.html';
            return false;
        }

        // Verifica role se especificada
        if (requiredRole && !this.hasRole(requiredRole)) {
            console.warn(`Acesso negado: role '${requiredRole}' necessária`);
            window.location.href = '/pages/dashboard.html';
            return false;
        }

        return true;
    }

    /**
     * Redireciona para dashboard apropriado baseado na role
     */
    redirectToDashboard() {
        const role = this.getUserRole();

        switch (role) {
            case 'Admin':
                window.location.href = '/pages/admin-dashboard.html';
                break;
            case 'Tecnico':
            case 'Usuario':
            default:
                window.location.href = '/pages/dashboard.html';
                break;
        }
    }

    /**
     * Atualiza senha do usuário
     * @param {string} senhaAtual - Senha atual
     * @param {string} novaSenha - Nova senha
     * @returns {Promise<object>}
     */
    async changePassword(senhaAtual, novaSenha) {
        try {
            const user = this.getUserInfo();
            if (!user || !user.id) {
                throw new Error('Usuário não autenticado');
            }

            const response = await this.api.put(`/Usuarios/${user.id}/senha`, {
                senhaAtual,
                novaSenha
            });

            console.log('Senha alterada com sucesso!');
            return response;
        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            throw error;
        }
    }

    /**
     * Atualiza perfil do usuário
     * @param {object} userData - Dados a atualizar
     * @returns {Promise<object>}
     */
    async updateProfile(userData) {
        try {
            const user = this.getUserInfo();
            if (!user || !user.id) {
                throw new Error('Usuário não autenticado');
            }

            const response = await this.api.put(`/Usuarios/${user.id}`, userData);

            // Atualiza informações locais
            const updatedUser = { ...user, ...userData };
            localStorage.setItem(this.userKey, JSON.stringify(updatedUser));

            console.log('Perfil atualizado com sucesso!');
            return response;
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            throw error;
        }
    }
}

// Exporta instância única do serviço de autenticação
const auth = new AuthService();

// Torna disponível globalmente
window.auth = auth;
