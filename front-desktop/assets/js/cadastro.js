/**
 * Cadastro Page Script
 * Sistema de Chamados - Faculdade
 */

// Redireciona se já estiver autenticado
if (auth.isAuthenticated()) {
    console.log('Usuário já autenticado, redirecionando...');
    auth.redirectToDashboard();
}

// Elementos do DOM
const registerForm = document.getElementById('register-form');
const nameInput = document.getElementById('r-name');
const emailInput = document.getElementById('r-email');
const cpfInput = document.getElementById('r-cpf');
const phoneInput = document.getElementById('r-phone');
const passInput = document.getElementById('r-pass');
const pass2Input = document.getElementById('r-pass2');
const btnRegister = document.getElementById('btn-register');
const alertDiv = document.getElementById('alert');
const togglePassBtn = document.getElementById('toggle-pass');
const togglePass2Btn = document.getElementById('toggle-pass2');

/**
 * Exibe mensagem de alerta
 * @param {string} message - Mensagem a exibir
 * @param {string} type - Tipo: 'error' ou 'success'
 */
function showAlert(message, type = 'error') {
    alertDiv.textContent = message;
    alertDiv.className = `alert alert-${type} show`;
    
    // Scroll para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Remove após 7 segundos
    setTimeout(() => {
        alertDiv.className = 'alert';
    }, 7000);
}

/**
 * Exibe erro em campo específico
 * @param {string} fieldId - ID do campo
 * @param {string} message - Mensagem de erro
 */
function showFieldError(fieldId, message) {
    const errorDiv = document.getElementById(`error-${fieldId}`);
    const input = document.getElementById(`r-${fieldId}`);
    
    if (errorDiv && input) {
        errorDiv.textContent = message;
        errorDiv.className = 'field-error show';
        input.classList.add('input-error');
    }
}

/**
 * Limpa erro de campo específico
 * @param {string} fieldId - ID do campo
 */
function clearFieldError(fieldId) {
    const errorDiv = document.getElementById(`error-${fieldId}`);
    const input = document.getElementById(`r-${fieldId}`);
    
    if (errorDiv && input) {
        errorDiv.className = 'field-error';
        input.classList.remove('input-error');
    }
}

/**
 * Limpa todos os erros
 */
function clearAllErrors() {
    ['name', 'email', 'cpf', 'phone', 'pass', 'pass2'].forEach(clearFieldError);
    alertDiv.className = 'alert';
}

/**
 * Exibe loading no botão
 * @param {boolean} isLoading - Se true, mostra spinner
 */
function setLoading(isLoading) {
    if (isLoading) {
        loading.buttonStart(btnRegister, 'Criando conta...');
        loading.disableForm(registerForm);
    } else {
        loading.buttonEnd(btnRegister);
        loading.enableForm(registerForm);
    }
}

/**
 * Formata CPF (000.000.000-00)
 * @param {string} value - CPF não formatado
 * @returns {string} - CPF formatado
 */
function formatCPF(value) {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
}

/**
 * Formata Telefone ((00) 00000-0000)
 * @param {string} value - Telefone não formatado
 * @returns {string} - Telefone formatado
 */
function formatPhone(value) {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
}

/**
 * Valida CPF
 * @param {string} cpf - CPF a validar
 * @returns {boolean} - true se válido
 */
function validateCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    
    // CPFs inválidos conhecidos
    const invalidCPFs = [
        '00000000000', '11111111111', '22222222222',
        '33333333333', '44444444444', '55555555555',
        '66666666666', '77777777777', '88888888888',
        '99999999999'
    ];
    
    if (invalidCPFs.includes(cpf)) return false;
    
    // Validação do dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(10))) return false;
    
    return true;
}

/**
 * Valida formulário
 * @returns {boolean} - true se válido
 */
function validateForm() {
    clearAllErrors();
    let isValid = true;

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const cpf = cpfInput.value.trim();
    const phone = phoneInput.value.trim();
    const password = passInput.value;
    const password2 = pass2Input.value;

    // Valida nome
    if (!name) {
        showFieldError('name', 'Nome é obrigatório');
        isValid = false;
    } else if (name.length < 3) {
        showFieldError('name', 'Nome deve ter pelo menos 3 caracteres');
        isValid = false;
    }

    // Valida email
    if (!email) {
        showFieldError('email', 'Email é obrigatório');
        isValid = false;
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showFieldError('email', 'Email inválido');
            isValid = false;
        }
    }

    // Valida CPF (opcional mas se preenchido deve ser válido)
    if (cpf) {
        if (!validateCPF(cpf)) {
            showFieldError('cpf', 'CPF inválido');
            isValid = false;
        }
    }

    // Valida telefone (opcional mas se preenchido deve ter formato correto)
    if (phone) {
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length < 10 || phoneDigits.length > 11) {
            showFieldError('phone', 'Telefone inválido');
            isValid = false;
        }
    }

    // Valida senha
    if (!password) {
        showFieldError('pass', 'Senha é obrigatória');
        isValid = false;
    } else if (password.length < 6) {
        showFieldError('pass', 'Senha deve ter pelo menos 6 caracteres');
        isValid = false;
    } else if (!/[A-Z]/.test(password)) {
        showFieldError('pass', 'Senha deve conter pelo menos uma letra maiúscula');
        isValid = false;
    } else if (!/[0-9]/.test(password)) {
        showFieldError('pass', 'Senha deve conter pelo menos um número');
        isValid = false;
    }

    // Valida confirmação de senha
    if (!password2) {
        showFieldError('pass2', 'Confirmação é obrigatória');
        isValid = false;
    } else if (password !== password2) {
        showFieldError('pass2', 'Senhas não coincidem');
        isValid = false;
    }

    return isValid;
}

/**
 * Manipula submissão do formulário
 */
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Valida campos
    if (!validateForm()) {
        showAlert('Por favor, corrija os erros no formulário.', 'error');
        return;
    }

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const cpf = cpfInput.value.replace(/\D/g, ''); // Remove formatação
    const phone = phoneInput.value.replace(/\D/g, ''); // Remove formatação
    const password = passInput.value;

    try {
        setLoading(true);

        // Prepara dados para envio
        const userData = {
            nome: name,
            email: email,
            senha: password
        };

        // Adiciona CPF se preenchido
        if (cpf) {
            userData.cpf = cpf;
        }

        // Adiciona telefone se preenchido
        if (phone) {
            userData.telefone = phone;
        }

        // Faz cadastro via API
        const result = await auth.register(userData);

        if (result.success) {
            // Exibe mensagem de sucesso
            showAlert('Cadastro realizado com sucesso! Redirecionando para login...', 'success');

            // Limpa formulário
            registerForm.reset();

            // Aguarda 2 segundos e redireciona para login
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    } catch (error) {
        console.error('Erro no cadastro:', error);
        
        // Mensagens específicas por tipo de erro
        let errorMessage = 'Erro ao criar conta. Tente novamente.';

        if (error instanceof ApiError) {
            if (error.status === 400) {
                errorMessage = error.data?.message || 'Dados inválidos. Verifique os campos.';
            } else if (error.status === 409) {
                errorMessage = 'Este email já está cadastrado.';
                showFieldError('email', 'Email já cadastrado');
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
togglePassBtn.addEventListener('click', () => {
    const type = passInput.type === 'password' ? 'text' : 'password';
    passInput.type = type;
    togglePassBtn.setAttribute('aria-label', 
        type === 'password' ? 'Mostrar senha' : 'Ocultar senha'
    );
});

togglePass2Btn.addEventListener('click', () => {
    const type = pass2Input.type === 'password' ? 'text' : 'password';
    pass2Input.type = type;
    togglePass2Btn.setAttribute('aria-label', 
        type === 'password' ? 'Mostrar confirmação' : 'Ocultar confirmação'
    );
});

/**
 * Formatação automática de CPF
 */
cpfInput.addEventListener('input', (e) => {
    e.target.value = formatCPF(e.target.value);
    clearFieldError('cpf');
});

/**
 * Formatação automática de telefone
 */
phoneInput.addEventListener('input', (e) => {
    e.target.value = formatPhone(e.target.value);
    clearFieldError('phone');
});

/**
 * Limpa erros ao digitar
 */
nameInput.addEventListener('input', () => clearFieldError('name'));
emailInput.addEventListener('input', () => clearFieldError('email'));
passInput.addEventListener('input', () => clearFieldError('pass'));
pass2Input.addEventListener('input', () => clearFieldError('pass2'));

// Log inicial
console.log('Página de cadastro carregada');
console.log('API URL:', api.baseURL);
