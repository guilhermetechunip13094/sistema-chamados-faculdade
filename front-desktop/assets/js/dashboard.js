/**
 * Dashboard Page Script
 * Sistema de Chamados - Faculdade
 */

// Verifica autenticação - redireciona se não estiver logado
if (!auth.isAuthenticated()) {
    console.log('Usuário não autenticado, redirecionando para login...');
    window.location.href = 'login.html';
}

// Elementos do DOM
const userNameEl = document.getElementById('user-name');
const userRoleEl = document.getElementById('user-role');
const navLogout = document.getElementById('nav-logout');
const alertDiv = document.getElementById('alert');
const loadingDiv = document.getElementById('loading');
const emptyStateDiv = document.getElementById('empty-state');
const chamadosGrid = document.getElementById('chamados-grid');

// Filtros
const fltStatus = document.getElementById('flt-status');
const fltPriority = document.getElementById('flt-priority');
const fltSearch = document.getElementById('flt-search');
const btnClearFilters = document.getElementById('btn-clear-filters');
const btnNovo = document.getElementById('btn-novo');
const btnNovoEmpty = document.getElementById('btn-novo-empty');

// Estatísticas
const statTotal = document.getElementById('stat-total');
const statOpen = document.getElementById('stat-open');
const statProgress = document.getElementById('stat-progress');
const statClosed = document.getElementById('stat-closed');

// Estado da aplicação
let allChamados = [];
let filteredChamados = [];

/**
 * Exibe mensagem de alerta
 * @param {string} message - Mensagem a exibir
 * @param {string} type - Tipo: 'error', 'success', 'info'
 */
function showAlert(message, type = 'info') {
    alertDiv.textContent = message;
    alertDiv.className = `alert alert-${type} show`;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setTimeout(() => {
        alertDiv.className = 'alert';
    }, 5000);
}

/**
 * Exibe/oculta loading
 * @param {boolean} show - Se true, mostra loading
 */
function setLoading(show) {
    loadingDiv.style.display = show ? 'flex' : 'none';
    chamadosGrid.style.display = show ? 'none' : 'grid';
}

/**
 * Exibe estado vazio
 * @param {boolean} show - Se true, mostra empty state
 */
function setEmptyState(show) {
    emptyStateDiv.style.display = show ? 'flex' : 'none';
    chamadosGrid.style.display = show ? 'none' : 'grid';
}

/**
 * Atualiza informações do usuário no header
 */
function updateUserInfo() {
    const userInfo = auth.getUserInfo();
    
    if (userInfo) {
        userNameEl.textContent = userInfo.nome || userInfo.email || 'Usuário';
        
        const roleMap = {
            'Admin': '👑 Administrador',
            'Tecnico': '🔧 Técnico',
            'Usuario': '👤 Usuário'
        };
        
        const role = auth.getUserRole();
        userRoleEl.textContent = roleMap[role] || '👤 Usuário';
        
        console.log('Usuário:', userInfo.nome, '| Role:', role);
    }
}

/**
 * Busca todos os chamados do usuário
 */
async function loadChamados() {
    try {
        // Mostra skeleton
        loading.showSkeleton('chamados-grid', 'cards', { count: 3 });
        setEmptyState(false);

        console.log('Buscando chamados do usuário...');
        const response = await api.get('/Chamados');
        
        allChamados = response || [];
        console.log(`${allChamados.length} chamados encontrados`);
        console.log('Primeiro chamado:', allChamados[0]); // Debug

        updateStatistics();
        applyFilters();
        
    } catch (error) {
        console.error('Erro ao carregar chamados:', error);
        
        let errorMessage = 'Erro ao carregar chamados.';
        
        if (error instanceof ApiError) {
            if (error.status === 401) {
                errorMessage = 'Sessão expirada. Faça login novamente.';
                setTimeout(() => auth.logout(), 2000);
            } else if (error.status === 403) {
                errorMessage = 'Você não tem permissão para visualizar os chamados.';
            } else if (error.message) {
                errorMessage = error.message;
            }
        }
        
        showAlert(errorMessage, 'error');
        allChamados = [];
        chamadosGrid.innerHTML = '';
        setEmptyState(true);
    } finally {
        loading.hideSkeleton('chamados-grid');
    }
}

/**
 * Atualiza estatísticas do dashboard
 */
function updateStatistics() {
    const total = allChamados.length;
    const abertos = allChamados.filter(c => c.status?.nome === 'Aberto').length;
    const emAndamento = allChamados.filter(c => c.status?.nome === 'Em Andamento').length;
    const resolvidos = allChamados.filter(c => 
        c.status?.nome === 'Resolvido' || c.status?.nome === 'Fechado'
    ).length;

    statTotal.textContent = total;
    statOpen.textContent = abertos;
    statProgress.textContent = emAndamento;
    statClosed.textContent = resolvidos;
}

/**
 * Aplica filtros aos chamados
 */
function applyFilters() {
    const statusFilter = fltStatus.value.toLowerCase();
    const priorityFilter = fltPriority.value.toLowerCase();
    const searchFilter = fltSearch.value.toLowerCase().trim();

    filteredChamados = allChamados.filter(chamado => {
        // Filtro de status
        if (statusFilter && chamado.status?.nome?.toLowerCase() !== statusFilter) {
            return false;
        }

        // Filtro de prioridade
        if (priorityFilter && chamado.prioridade?.nome?.toLowerCase() !== priorityFilter) {
            return false;
        }

        // Filtro de busca (título ou descrição)
        if (searchFilter) {
            const titulo = chamado.titulo?.toLowerCase() || '';
            const descricao = chamado.descricao?.toLowerCase() || '';
            
            if (!titulo.includes(searchFilter) && !descricao.includes(searchFilter)) {
                return false;
            }
        }

        return true;
    });

    console.log(`Filtros aplicados: ${filteredChamados.length} de ${allChamados.length} chamados`);
    renderChamados();
}

/**
 * Renderiza chamados no grid
 */
function renderChamados() {
    if (filteredChamados.length === 0) {
        chamadosGrid.innerHTML = '';
        setEmptyState(true);
        return;
    }

    setEmptyState(false);

    // Cria HTML dos chamados
    const chamadosHtml = filteredChamados.map(chamado => {
        const card = createChamadoCardHtml(chamado);
        return card;
    }).join('');

    // Remove skeleton e adiciona conteúdo com animação
    loading.hideSkeleton('chamados-grid', chamadosHtml);

    // Adiciona event listeners aos cards usando data-id
    const cards = chamadosGrid.querySelectorAll('.chamado-card');
    cards.forEach((card) => {
        const chamadoId = card.getAttribute('data-id');
        card.onclick = () => viewChamadoDetails(chamadoId);
    });
}

/**
 * Cria HTML do card de chamado
 * @param {Object} chamado - Dados do chamado
 * @returns {string} - HTML do card
 */
function createChamadoCardHtml(chamado) {
    // Badge de status
    const statusClass = getStatusClass(chamado.status?.nome || chamado.status?.Nome);
    const priorityClass = getPriorityClass(chamado.prioridade?.nome || chamado.prioridade?.Nome);

    // Formata data (backend retorna DataAbertura em PascalCase)
    const dataFormatada = formatDate(chamado.dataAbertura || chamado.DataAbertura);
    
    // Normaliza campos para evitar undefined
    const id = chamado.id || chamado.Id;
    const titulo = chamado.titulo || chamado.Titulo || 'Sem título';
    const descricao = chamado.descricao || chamado.Descricao || '';
    const statusNome = chamado.status?.nome || chamado.status?.Nome || 'N/A';
    const prioridadeNome = chamado.prioridade?.nome || chamado.prioridade?.Nome || 'N/A';
    const categoriaNome = chamado.categoria?.nome || chamado.categoria?.Nome || 'Sem categoria';
    const tecnicoNome = chamado.tecnico?.nomeCompleto || chamado.tecnico?.NomeCompleto || 
                        chamado.tecnicoAtribuidoNome || chamado.TecnicoAtribuidoNome || null;

    return `
        <div class="chamado-card" data-id="${id}">
            <div class="chamado-header">
                <h3 class="chamado-title">${escapeHtml(titulo)}</h3>
                <span class="badge badge-${statusClass}">${statusNome}</span>
            </div>
            <div class="chamado-body">
                <p class="chamado-description">${escapeHtml(descricao).substring(0, 100)}${descricao.length > 100 ? '...' : ''}</p>
                <div class="chamado-info">
                    <span class="badge badge-priority badge-${priorityClass}">${prioridadeNome}</span>
                    <span class="chamado-categoria">${categoriaNome}</span>
                </div>
            </div>
            <div class="chamado-footer">
                <div class="tecnico-info">
                    ${tecnicoNome ? 
                        `<span class="tecnico-nome">${escapeHtml(tecnicoNome)}</span>` :
                        '<span class="tecnico-nome">Não atribuído</span>'
                    }
                </div>
                <span class="chamado-data">${dataFormatada}</span>
            </div>
        </div>
    `;
}

/**
 * Cria card de chamado (DEPRECATED - usar createChamadoCardHtml)
 * @param {Object} chamado - Dados do chamado
 * @returns {HTMLElement} - Elemento do card
 */
function createChamadoCard(chamado) {
    const card = document.createElement('div');
    card.className = 'chamado-card';
    card.onclick = () => viewChamadoDetails(chamado.id);

    // Badge de status
    const statusClass = getStatusClass(chamado.status?.nome);
    const priorityClass = getPriorityClass(chamado.prioridade?.nome);

    // Formata data
    const dataFormatada = formatDate(chamado.dataCriacao);

    card.innerHTML = `
        <div class="chamado-header">
            <h3 class="chamado-title">${escapeHtml(chamado.titulo)}</h3>
            <span class="badge badge-${statusClass}">${chamado.status?.nome || 'N/A'}</span>
        </div>
        
        <p class="chamado-description">${escapeHtml(truncateText(chamado.descricao, 120))}</p>
        
        <div class="chamado-meta">
            <div class="chamado-info">
                <span class="badge badge-${priorityClass} badge-sm">
                    ${getPriorityIcon(chamado.prioridade?.nome)} ${chamado.prioridade?.nome || 'N/A'}
                </span>
                <span class="chamado-category">
                    📁 ${chamado.categoria?.nome || 'Sem categoria'}
                </span>
            </div>
            
            <div class="chamado-footer">
                ${chamado.tecnicoResponsavel 
                    ? `<span class="chamado-tech">🔧 ${escapeHtml(chamado.tecnicoResponsavel.nome)}</span>` 
                    : '<span class="chamado-tech text-muted">Aguardando atribuição</span>'
                }
                <span class="chamado-date">📅 ${dataFormatada}</span>
            </div>
        </div>
    `;

    return card;
}

/**
 * Retorna classe CSS para status
 * @param {string} status - Nome do status
 * @returns {string} - Classe CSS
 */
function getStatusClass(status) {
    const statusMap = {
        'Aberto': 'open',
        'Em Andamento': 'progress',
        'Pendente': 'pending',
        'Resolvido': 'resolved',
        'Fechado': 'closed'
    };
    return statusMap[status] || 'default';
}

/**
 * Retorna classe CSS para prioridade
 * @param {string} priority - Nome da prioridade
 * @returns {string} - Classe CSS
 */
function getPriorityClass(priority) {
    const priorityMap = {
        'Baixa': 'low',
        'Média': 'medium',
        'Alta': 'high',
        'Crítica': 'critical'
    };
    return priorityMap[priority] || 'default';
}

/**
 * Retorna ícone para prioridade
 * @param {string} priority - Nome da prioridade
 * @returns {string} - Emoji do ícone
 */
function getPriorityIcon(priority) {
    const iconMap = {
        'Baixa': '🟢',
        'Média': '🟡',
        'Alta': '🟠',
        'Crítica': '🔴'
    };
    return iconMap[priority] || '⚪';
}

/**
 * Formata data para exibição
 * @param {string} dateString - Data ISO
 * @returns {string} - Data formatada
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours === 0) {
            const diffMins = Math.floor(diffMs / (1000 * 60));
            return `há ${diffMins} min`;
        }
        return `há ${diffHours}h`;
    } else if (diffDays === 1) {
        return 'ontem';
    } else if (diffDays < 7) {
        return `há ${diffDays} dias`;
    }

    return date.toLocaleDateString('pt-BR');
}

/**
 * Trunca texto para exibição
 * @param {string} text - Texto completo
 * @param {number} maxLength - Tamanho máximo
 * @returns {string} - Texto truncado
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Escapa HTML para prevenir XSS
 * @param {string} text - Texto a escapar
 * @returns {string} - Texto escapado
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Navega para detalhes do chamado
 * @param {number} chamadoId - ID do chamado
 */
function viewChamadoDetails(chamadoId) {
    console.log('Abrindo detalhes do chamado:', chamadoId);
    window.location.href = `ticket-detalhes.html?id=${chamadoId}`;
}

/**
 * Limpa todos os filtros
 */
function clearFilters() {
    fltStatus.value = '';
    fltPriority.value = '';
    fltSearch.value = '';
    applyFilters();
}

/**
 * Navega para criação de novo chamado
 */
function goToNovoChamado() {
    window.location.href = 'novo-chamado.html';
}

// Event Listeners
navLogout.addEventListener('click', (e) => {
    e.preventDefault();
    
    if (confirm('Deseja realmente sair?')) {
        console.log('Usuário fazendo logout...');
        auth.logout();
    }
});

fltStatus.addEventListener('change', applyFilters);
fltPriority.addEventListener('change', applyFilters);
fltSearch.addEventListener('input', applyFilters);
btnClearFilters.addEventListener('click', clearFilters);
btnNovo.addEventListener('click', goToNovoChamado);
btnNovoEmpty.addEventListener('click', goToNovoChamado);

// Inicialização
console.log('Dashboard carregado');
console.log('API URL:', api.baseURL);

updateUserInfo();
loadChamados();

// Auto-refresh a cada 30 segundos
setInterval(() => {
    console.log('Auto-refresh: recarregando chamados...');
    loadChamados();
}, 30000);
