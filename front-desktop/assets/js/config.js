// config.js - Configurações do usuário (perfil, senha, notificações)

// Verificar autenticação
if (!authService.isAuthenticated()) {
    window.location.href = 'login.html';
}

// Estado global
let userData = null;
let originalData = null;

// Elementos do DOM
const logoutBtn = document.getElementById('logoutBtn');
const loadingModal = document.getElementById('loadingModal');
const loadingMessage = document.getElementById('loadingMessage');

// Tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const perfilTab = document.getElementById('perfilTab');
const senhaTab = document.getElementById('senhaTab');
const notificacoesTab = document.getElementById('notificacoesTab');

// Forms
const perfilForm = document.getElementById('perfilForm');
const senhaForm = document.getElementById('senhaForm');

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    loadNotificationSettings();
    setupEventListeners();
});

// ========================================
// CARREGAR DADOS DO USUÁRIO
// ========================================

async function loadUserData() {
    showLoading('Carregando dados do perfil...');
    
    try {
        const userInfo = authService.getUserInfo();
        const response = await apiClient.get(`/Usuarios/${userInfo.userId}`);
        userData = response.data || response;
        originalData = JSON.parse(JSON.stringify(userData)); // Deep clone
        
        displayUserData(userData);
        hideLoading();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        hideLoading();
        showToast('Erro ao carregar dados do perfil', 'error');
    }
}

function displayUserData(user) {
    document.getElementById('nome').value = user.nome || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('cpf').value = user.cpf || '';
    document.getElementById('telefone').value = user.telefone || '';
    document.getElementById('role').value = getRoleDisplay(user.role);
}

function getRoleDisplay(role) {
    const roles = {
        'Admin': 'Administrador',
        'Tecnico': 'Técnico',
        'Usuario': 'Usuário'
    };
    return roles[role] || role;
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Logout
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        authService.logout();
        window.location.href = 'login.html';
    });
    
    // Tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Perfil Form
    perfilForm.addEventListener('submit', handlePerfilSubmit);
    document.getElementById('cancelPerfilBtn').addEventListener('click', resetPerfilForm);
    
    // Senha Form
    senhaForm.addEventListener('submit', handleSenhaSubmit);
    document.getElementById('cancelSenhaBtn').addEventListener('click', resetSenhaForm);
    
    // Notificações
    document.getElementById('salvarNotifBtn').addEventListener('click', saveNotificationSettings);
    
    // Máscaras
    document.getElementById('cpf').addEventListener('input', maskCPF);
    document.getElementById('telefone').addEventListener('input', maskTelefone);
}

// ========================================
// TABS
// ========================================

function switchTab(tabName) {
    // Remove active de todos
    tabBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Adiciona active no selecionado
    const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedBtn) selectedBtn.classList.add('active');
    
    const tabs = {
        'perfil': perfilTab,
        'senha': senhaTab,
        'notificacoes': notificacoesTab
    };
    
    if (tabs[tabName]) {
        tabs[tabName].classList.add('active');
    }
}

// ========================================
// EDITAR PERFIL
// ========================================

async function handlePerfilSubmit(e) {
    e.preventDefault();
    
    const formData = {
        nome: document.getElementById('nome').value.trim(),
        email: document.getElementById('email').value.trim(),
        cpf: document.getElementById('cpf').value.replace(/\D/g, ''),
        telefone: document.getElementById('telefone').value.replace(/\D/g, '')
    };
    
    // Validar
    if (!formData.nome || !formData.email) {
        showToast('Nome e e-mail são obrigatórios', 'warning');
        return;
    }
    
    // Verificar se houve mudanças
    if (JSON.stringify(formData) === JSON.stringify({
        nome: originalData.nome,
        email: originalData.email,
        cpf: originalData.cpf,
        telefone: originalData.telefone
    })) {
        showToast('Nenhuma alteração foi feita', 'info');
        return;
    }
    
    showLoading('Salvando alterações...');
    
    try {
        const userInfo = authService.getUserInfo();
        await apiClient.put(`/Usuarios/${userInfo.userId}`, formData);
        
        hideLoading();
        showToast('Perfil atualizado com sucesso!', 'success');
        
        // Recarregar dados
        setTimeout(() => loadUserData(), 1000);
        
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        hideLoading();
        
        const errorMessage = error.message || 'Erro ao atualizar perfil';
        showToast(errorMessage, 'error');
    }
}

function resetPerfilForm() {
    if (originalData) {
        displayUserData(originalData);
        showToast('Alterações canceladas', 'info');
    }
}

// ========================================
// ALTERAR SENHA
// ========================================

async function handleSenhaSubmit(e) {
    e.preventDefault();
    
    const senhaAtual = document.getElementById('senhaAtual').value;
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    
    // Validações
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
        showToast('Preencha todos os campos', 'warning');
        return;
    }
    
    if (novaSenha.length < 6) {
        showToast('A nova senha deve ter no mínimo 6 caracteres', 'warning');
        return;
    }
    
    if (novaSenha !== confirmarSenha) {
        showToast('As senhas não coincidem', 'error');
        return;
    }
    
    if (senhaAtual === novaSenha) {
        showToast('A nova senha deve ser diferente da atual', 'warning');
        return;
    }
    
    showLoading('Alterando senha...');
    
    try {
        const userInfo = authService.getUserInfo();
        
        // Tentar endpoint específico de alterar senha
        // Se não existir, usar update geral
        const payload = {
            senhaAtual: senhaAtual,
            novaSenha: novaSenha
        };
        
        try {
            await apiClient.put(`/Usuarios/${userInfo.userId}/senha`, payload);
        } catch (error) {
            // Fallback: update completo com senha
            await apiClient.put(`/Usuarios/${userInfo.userId}`, {
                ...userData,
                senha: novaSenha,
                senhaAtual: senhaAtual
            });
        }
        
        hideLoading();
        showToast('Senha alterada com sucesso!', 'success');
        
        // Limpar form
        resetSenhaForm();
        
        // Opcional: fazer logout após trocar senha
        // setTimeout(() => {
        //     authService.logout();
        //     window.location.href = 'login.html';
        // }, 2000);
        
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        hideLoading();
        
        let errorMessage = 'Erro ao alterar senha';
        if (error.message?.includes('atual')) {
            errorMessage = 'Senha atual incorreta';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showToast(errorMessage, 'error');
    }
}

function resetSenhaForm() {
    senhaForm.reset();
}

// ========================================
// NOTIFICAÇÕES (LocalStorage)
// ========================================

function loadNotificationSettings() {
    const settings = getNotificationSettings();
    
    document.getElementById('notifNovosChamados').checked = settings.novosChamados;
    document.getElementById('notifAtualizacoes').checked = settings.atualizacoes;
    document.getElementById('notifAtribuicao').checked = settings.atribuicao;
    document.getElementById('notifSom').checked = settings.som;
}

function getNotificationSettings() {
    const defaultSettings = {
        novosChamados: true,
        atualizacoes: true,
        atribuicao: true,
        som: false
    };
    
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
        try {
            return { ...defaultSettings, ...JSON.parse(saved) };
        } catch (e) {
            return defaultSettings;
        }
    }
    
    return defaultSettings;
}

function saveNotificationSettings() {
    const settings = {
        novosChamados: document.getElementById('notifNovosChamados').checked,
        atualizacoes: document.getElementById('notifAtualizacoes').checked,
        atribuicao: document.getElementById('notifAtribuicao').checked,
        som: document.getElementById('notifSom').checked
    };
    
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    
    showToast('Preferências de notificações salvas!', 'success');
}

// ========================================
// MÁSCARAS
// ========================================

function maskCPF(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length <= 11) {
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    
    e.target.value = value;
}

function maskTelefone(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length <= 11) {
        if (value.length <= 10) {
            // (00) 0000-0000
            value = value.replace(/(\d{2})(\d)/, '($1) $2');
            value = value.replace(/(\d{4})(\d)/, '$1-$2');
        } else {
            // (00) 00000-0000
            value = value.replace(/(\d{2})(\d)/, '($1) $2');
            value = value.replace(/(\d{5})(\d)/, '$1-$2');
        }
    }
    
    e.target.value = value;
}

// ========================================
// UI HELPERS
// ========================================

function showLoading(message = 'Carregando...') {
    loadingMessage.textContent = message;
    loadingModal.style.display = 'flex';
}

function hideLoading() {
    loadingModal.style.display = 'none';
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
