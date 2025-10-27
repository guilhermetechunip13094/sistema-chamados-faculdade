/**
 * Login Page Script
 * Sistema de Chamados - Faculdade
 */

// Redireciona se já estiver autenticado
if (auth.isAuthenticated()) {
    console.log('Usuário já autenticado, redirecionando...');
    auth.redirectToDashboard();
}

// Elementos do DOM
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btn-login');
const alertDiv = document.getElementById('alert');
const togglePasswordBtn = document.getElementById('toggle-password');

/**
 * Exibe mensagem de alerta
 * @param {string} message - Mensagem a exibir
 * @param {string} type - Tipo: 'error' ou 'success'
 */
function showAlert(message, type = 'error') {
    alertDiv.textContent = message;
    alertDiv.className = `alert alert-${type} show`;
    
    // Remove após 5 segundos
    setTimeout(() => {
        alertDiv.className = 'alert';
    }, 5000);
}

/**
 * Exibe loading no botão
 * @param {boolean} isLoading - Se true, mostra spinner
 */
function setLoading(isLoading) {
    if (isLoading) {
        loading.buttonStart(btnLogin, 'Entrando...');
        loading.disableForm(loginForm);
    } else {
        loading.buttonEnd(btnLogin);
        loading.enableForm(loginForm);
    }
}

/**
 * Valida campos do formulário
 * @returns {boolean} - true se válido
 */
function validateForm() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Valida email
    if (!email) {
        showAlert('Por favor, digite seu email.', 'error');
        emailInput.focus();
        return false;
    }

    // Valida formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert('Por favor, digite um email válido.', 'error');
        emailInput.focus();
        return false;
    }

    // Valida senha
    if (!password) {
        showAlert('Por favor, digite sua senha.', 'error');
        passwordInput.focus();
        return false;
    }

    if (password.length < 6) {
        showAlert('A senha deve ter pelo menos 6 caracteres.', 'error');
        passwordInput.focus();
        return false;
    }

    return true;
}

/**
 * Manipula submissão do formulário
 */
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Valida campos
    if (!validateForm()) {
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
        setLoading(true);

        // Faz login via API
        const result = await auth.login(email, password);

        if (result.success) {
            // Exibe mensagem de sucesso
            showAlert('Login realizado com sucesso! Redirecionando...', 'success');

            // Aguarda 1 segundo e redireciona
            setTimeout(() => {
                auth.redirectToDashboard();
            }, 1000);
        }
    } catch (error) {
        console.error('Erro no login:', error);
        
        // Mensagens específicas por tipo de erro
        let errorMessage = 'Erro ao fazer login. Tente novamente.';

        if (error instanceof ApiError) {
            if (error.status === 401) {
                errorMessage = 'Email ou senha incorretos.';
            } else if (error.status === 404) {
                errorMessage = 'Serviço de autenticação não encontrado.';
            } else if (error.status === 500) {
                errorMessage = 'Erro no servidor. Tente novamente mais tarde.';
            } else if (error.message) {
                errorMessage = error.message;
            }
        } else if (error.message && error.message.includes('conectar')) {
            errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
        }

        showAlert(errorMessage, 'error');
        setLoading(false);
    }
});

/**
 * Toggle mostrar/ocultar senha
 */
togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    
    // Feedback visual
    togglePasswordBtn.setAttribute('aria-label', 
        type === 'password' ? 'Mostrar senha' : 'Ocultar senha'
    );
});

/**
 * Limpa mensagens ao digitar
 */
emailInput.addEventListener('input', () => {
    alertDiv.className = 'alert';
});

passwordInput.addEventListener('input', () => {
    alertDiv.className = 'alert';
});

/**
 * Permite Enter no campo de senha
 */
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginForm.dispatchEvent(new Event('submit'));
    }
});

// Log inicial
console.log('Página de login carregada');
console.log('API URL:', api.baseURL);
