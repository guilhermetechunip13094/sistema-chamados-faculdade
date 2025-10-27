/**
 * Admin Gerenciar Chamados Page Script
 * Sistema de Chamados - Faculdade
 * Integração com IA + Handoff
 */

// Verifica autenticação e role Admin
if (!auth.isAuthenticated()) {
    console.log('Usuário não autenticado, redirecionando para login...');
    window.location.href = 'login.html';
}

if (!auth.isAdmin()) {
    console.log('Usuário não é Admin, redirecionando...');
    alert('Acesso negado. Você não tem permissão para acessar esta área.');
    window.location.href = 'dashboard.html';
}

// Elementos do DOM
const userNameEl = document.getElementById('user-name');
const navLogout = document.getElementById('nav-logout');
const alertDiv = document.getElementById('alert');
const loadingDiv = document.getElementById('loading');
const emptyStateDiv = document.getElementById('empty-state');
const ticketsTable = document.getElementById('tickets-table');
const ticketsBody = document.getElementById('tickets-body');
const resultsCount = document.getElementById('results-count');

// Filtros
const fltStatus = document.getElementById('flt-status');
const fltPriority = document.getElementById('flt-priority');
const fltCategory = document.getElementById('flt-category');
const fltTech = document.getElementById('flt-tech');
const fltSearch = document.getElementById('flt-search');
const btnClearFilters = document.getElementById('btn-clear-filters');
const btnAnalyzeAll = document.getElementById('btn-analyze-all');

// Modal Atribuir Técnico
const modalAssign = document.getElementById('modal-assign');
const closeAssign = document.getElementById('close-assign');
const btnCancelAssign = document.getElementById('btn-cancel-assign');
const btnConfirmAssign = document.getElementById('btn-confirm-assign');
const assignTicketTitle = document.getElementById('assign-ticket-title');
const assignTicketId = document.getElementById('assign-ticket-id');
const assignTechSelect = document.getElementById('assign-tech-select');

// Modal Analisar com IA
const modalAnalyze = document.getElementById('modal-analyze');
const closeAnalyze = document.getElementById('close-analyze');
const btnCancelAnalyze = document.getElementById('btn-cancel-analyze');
const btnAssignFromAnalyze = document.getElementById('btn-assign-from-analyze');
const analyzeTicketTitle = document.getElementById('analyze-ticket-title');
const analyzeTicketId = document.getElementById('analyze-ticket-id');
const analyzeLoading = document.getElementById('analyze-loading');
const analyzeResult = document.getElementById('analyze-result');
const analyzeTechName = document.getElementById('analyze-tech-name');
const analyzeTechScore = document.getElementById('analyze-tech-score');
const scoresBreakdown = document.getElementById('scores-breakdown');
const analyzeJustification = document.getElementById('analyze-justification');
const techniciansRanking = document.getElementById('technicians-ranking');

// Estado da aplicação
let allChamados = [];
let filteredChamados = [];
let allTechnicians = [];
let allCategories = [];
let currentTicketForAssign = null;
let currentAnalysisResult = null;

/**
 * Exibe mensagem de alerta
 */
function showAlert(message, type = 'info') {
    alertDiv.textContent = message;
    alertDiv.className = `alert alert-${type} show`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
        alertDiv.className = 'alert';
    }, 7000);
}

/**
 * Exibe/oculta loading
 */
function setLoading(show) {
    loadingDiv.style.display = show ? 'flex' : 'none';
    ticketsTable.style.display = show ? 'none' : 'block';
}

/**
 * Exibe empty state
 */
function setEmptyState(show) {
    emptyStateDiv.style.display = show ? 'flex' : 'none';
    ticketsTable.style.display = show ? 'none' : 'block';
}

/**
 * Atualiza informações do usuário
 */
function updateUserInfo() {
    const userInfo = auth.getUserInfo();
    if (userInfo) {
        userNameEl.textContent = userInfo.nome || userInfo.email || 'Admin';
    }
}

/**
 * Carrega categorias para filtro
 */
async function loadCategories() {
    try {
        const response = await api.get('/Categorias');
        allCategories = response || [];
        
        fltCategory.innerHTML = '<option value="">Todas</option>';
        allCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.nome;
            fltCategory.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
    }
}

/**
 * Carrega técnicos para filtro e atribuição
 */
async function loadTechnicians() {
    try {
        const response = await api.get('/Usuarios');
        allTechnicians = response.filter(u => u.role === 'Tecnico' || u.role === 'Admin');
        
        // Atualiza filtro
        const currentFilter = fltTech.value;
        fltTech.innerHTML = '<option value="">Todos</option><option value="unassigned">Não Atribuídos</option>';
        allTechnicians.forEach(tech => {
            const option = document.createElement('option');
            option.value = tech.id;
            option.textContent = tech.nome;
            fltTech.appendChild(option);
        });
        fltTech.value = currentFilter;

        // Atualiza modal de atribuição
        assignTechSelect.innerHTML = '<option value="">Selecione um técnico...</option>';
        allTechnicians.forEach(tech => {
            const option = document.createElement('option');
            option.value = tech.id;
            option.textContent = tech.nome;
            assignTechSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar técnicos:', error);
    }
}

/**
 * Busca todos os chamados
 */
async function loadAllChamados() {
    try {
        setLoading(true);
        setEmptyState(false);

        console.log('Buscando todos os chamados...');
        const response = await api.get('/Chamados');
        
        allChamados = response || [];
        console.log(`${allChamados.length} chamados encontrados`);

        applyFilters();
        setLoading(false);
        
    } catch (error) {
        console.error('Erro ao carregar chamados:', error);
        
        let errorMessage = 'Erro ao carregar chamados.';
        if (error instanceof ApiError && error.status === 401) {
            errorMessage = 'Sessão expirada. Faça login novamente.';
            setTimeout(() => auth.logout(), 2000);
        }
        
        showAlert(errorMessage, 'error');
        allChamados = [];
        setLoading(false);
        setEmptyState(true);
    }
}

/**
 * Aplica filtros
 */
function applyFilters() {
    const statusFilter = fltStatus.value.toLowerCase();
    const priorityFilter = fltPriority.value.toLowerCase();
    const categoryFilter = fltCategory.value;
    const techFilter = fltTech.value;
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

        // Filtro de categoria
        if (categoryFilter && chamado.categoriaId?.toString() !== categoryFilter) {
            return false;
        }

        // Filtro de técnico
        if (techFilter) {
            if (techFilter === 'unassigned') {
                if (chamado.tecnicoResponsavelId) return false;
            } else {
                if (chamado.tecnicoResponsavelId?.toString() !== techFilter) return false;
            }
        }

        // Filtro de busca
        if (searchFilter) {
            const titulo = chamado.titulo?.toLowerCase() || '';
            const descricao = chamado.descricao?.toLowerCase() || '';
            
            if (!titulo.includes(searchFilter) && !descricao.includes(searchFilter)) {
                return false;
            }
        }

        return true;
    });

    console.log(`Filtros aplicados: ${filteredChamados.length} de ${allChamados.length}`);
    resultsCount.textContent = `${filteredChamados.length} chamados encontrados`;
    renderChamados();
}

/**
 * Renderiza chamados na tabela
 */
function renderChamados() {
    ticketsBody.innerHTML = '';

    if (filteredChamados.length === 0) {
        setEmptyState(true);
        return;
    }

    setEmptyState(false);

    filteredChamados.forEach(chamado => {
        const row = document.createElement('tr');
        
        const statusClass = getStatusClass(chamado.status?.nome);
        const priorityClass = getPriorityClass(chamado.prioridade?.nome);

        row.innerHTML = `
            <td><strong>#${chamado.id}</strong></td>
            <td>
                <a href="chamado-detalhes.html?id=${chamado.id}" class="link-primary">
                    ${escapeHtml(chamado.titulo)}
                </a>
            </td>
            <td><span class="badge badge-${statusClass}">${chamado.status?.nome || 'N/A'}</span></td>
            <td><span class="badge badge-${priorityClass} badge-sm">${chamado.prioridade?.nome || 'N/A'}</span></td>
            <td>${escapeHtml(chamado.categoria?.nome || 'N/A')}</td>
            <td>
                ${chamado.tecnicoResponsavel 
                    ? escapeHtml(chamado.tecnicoResponsavel.nome) 
                    : '<em class="text-muted">Não atribuído</em>'}
            </td>
            <td>${formatDate(chamado.dataCriacao)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-secondary" onclick="openAssignModal(${chamado.id})" title="Atribuir Técnico">
                        👤
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="openAnalyzeModal(${chamado.id})" title="Analisar com IA">
                        🤖
                    </button>
                </div>
            </td>
        `;

        ticketsBody.appendChild(row);
    });
}

/**
 * Abre modal para atribuir técnico
 */
window.openAssignModal = function(chamadoId) {
    const chamado = allChamados.find(c => c.id === chamadoId);
    if (!chamado) return;

    currentTicketForAssign = chamado;
    assignTicketTitle.textContent = chamado.titulo;
    assignTicketId.textContent = chamado.id;
    
    // Pré-seleciona técnico atual se houver
    if (chamado.tecnicoResponsavelId) {
        assignTechSelect.value = chamado.tecnicoResponsavelId;
    } else {
        assignTechSelect.value = '';
    }

    modalAssign.style.display = 'flex';
};

/**
 * Fecha modal de atribuição
 */
function closeAssignModal() {
    modalAssign.style.display = 'none';
    currentTicketForAssign = null;
    assignTechSelect.value = '';
}

/**
 * Confirma atribuição de técnico
 */
async function confirmAssign() {
    const techId = assignTechSelect.value;
    
    if (!techId) {
        showAlert('Selecione um técnico para atribuir.', 'error');
        return;
    }

    if (!currentTicketForAssign) return;

    try {
        btnConfirmAssign.disabled = true;
        btnConfirmAssign.innerHTML = '<span class="spinner"></span> Atribuindo...';

        await api.put(`/Chamados/${currentTicketForAssign.id}/atribuir/${techId}`);

        showAlert('Técnico atribuído com sucesso!', 'success');
        closeAssignModal();
        loadAllChamados(); // Recarrega lista
        
    } catch (error) {
        console.error('Erro ao atribuir técnico:', error);
        
        let errorMessage = 'Erro ao atribuir técnico.';
        if (error instanceof ApiError && error.data?.message) {
            errorMessage = error.data.message;
        }
        
        showAlert(errorMessage, 'error');
    } finally {
        btnConfirmAssign.disabled = false;
        btnConfirmAssign.innerHTML = 'Atribuir Técnico';
    }
}

/**
 * Abre modal de análise com IA
 */
window.openAnalyzeModal = async function(chamadoId) {
    const chamado = allChamados.find(c => c.id === chamadoId);
    if (!chamado) return;

    currentTicketForAssign = chamado;
    analyzeTicketTitle.textContent = chamado.titulo;
    analyzeTicketId.textContent = chamado.id;
    
    analyzeLoading.style.display = 'flex';
    analyzeResult.style.display = 'none';
    btnAssignFromAnalyze.style.display = 'none';
    
    modalAnalyze.style.display = 'flex';

    // Faz análise com IA
    await performAIAnalysis(chamadoId);
};

/**
 * Realiza análise com IA + Handoff
 */
async function performAIAnalysis(chamadoId) {
    try {
        console.log('Analisando chamado com IA + Handoff...', chamadoId);
        
        const response = await api.post(`/Chamados/${chamadoId}/analisar-com-handoff`);
        
        currentAnalysisResult = response;
        console.log('Análise concluída:', response);

        displayAnalysisResult(response);
        
    } catch (error) {
        console.error('Erro na análise IA:', error);
        
        analyzeLoading.style.display = 'none';
        analyzeResult.innerHTML = `
            <div class="alert alert-error">
                <strong>❌ Erro na Análise</strong>
                <p>${error.message || 'Não foi possível analisar o chamado.'}</p>
            </div>
        `;
        analyzeResult.style.display = 'block';
    }
}

/**
 * Exibe resultado da análise
 */
function displayAnalysisResult(result) {
    analyzeLoading.style.display = 'none';
    analyzeResult.style.display = 'block';
    btnAssignFromAnalyze.style.display = 'block';

    // Técnico recomendado
    if (result.tecnicoRecomendado) {
        analyzeTechName.textContent = result.tecnicoRecomendado.nome;
        analyzeTechScore.textContent = `${result.scoreFinal} pts`;
    }

    // Breakdown de scores
    if (result.scores) {
        scoresBreakdown.innerHTML = '';
        
        const scoreItems = [
            { label: '🎯 Especialidade', value: result.scores.especialidade || 0 },
            { label: '📅 Disponibilidade', value: result.scores.disponibilidade || 0 },
            { label: '⚡ Performance', value: result.scores.performance || 0 },
            { label: '🔥 Prioridade', value: result.scores.prioridade || 0 },
            { label: '🧩 Complexidade', value: result.scores.bonusComplexidade || 0 }
        ];

        scoreItems.forEach(item => {
            const scoreItem = document.createElement('div');
            scoreItem.className = 'score-item';
            scoreItem.innerHTML = `
                <span class="score-label">${item.label}</span>
                <span class="score-value">${item.value} pts</span>
                <div class="score-bar">
                    <div class="score-fill" style="width: ${Math.min(item.value, 100)}%"></div>
                </div>
            `;
            scoresBreakdown.appendChild(scoreItem);
        });
    }

    // Justificativa
    if (result.justificativa) {
        analyzeJustification.textContent = result.justificativa;
    }

    // Ranking de técnicos
    if (result.rankingTecnicos && result.rankingTecnicos.length > 0) {
        techniciansRanking.innerHTML = '';
        
        result.rankingTecnicos.forEach((tech, index) => {
            const rankItem = document.createElement('div');
            rankItem.className = 'rank-item';
            
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`;
            
            rankItem.innerHTML = `
                <span class="rank-position">${medal}</span>
                <span class="rank-name">${escapeHtml(tech.nome)}</span>
                <span class="rank-score">${tech.scoreFinal} pts</span>
            `;
            techniciansRanking.appendChild(rankItem);
        });
    }
}

/**
 * Atribui técnico recomendado pela IA
 */
async function assignFromAnalyze() {
    if (!currentAnalysisResult || !currentAnalysisResult.tecnicoRecomendado) {
        showAlert('Nenhum técnico recomendado para atribuir.', 'error');
        return;
    }

    if (!currentTicketForAssign) return;

    try {
        btnAssignFromAnalyze.disabled = true;
        btnAssignFromAnalyze.innerHTML = '<span class="spinner"></span> Atribuindo...';

        const techId = currentAnalysisResult.tecnicoRecomendado.id;
        await api.put(`/Chamados/${currentTicketForAssign.id}/atribuir/${techId}`);

        showAlert(`Técnico ${currentAnalysisResult.tecnicoRecomendado.nome} atribuído com sucesso!`, 'success');
        closeAnalyzeModal();
        loadAllChamados();
        
    } catch (error) {
        console.error('Erro ao atribuir técnico:', error);
        showAlert('Erro ao atribuir técnico.', 'error');
    } finally {
        btnAssignFromAnalyze.disabled = false;
        btnAssignFromAnalyze.innerHTML = 'Atribuir Técnico Recomendado';
    }
}

/**
 * Fecha modal de análise
 */
function closeAnalyzeModal() {
    modalAnalyze.style.display = 'none';
    currentTicketForAssign = null;
    currentAnalysisResult = null;
}

/**
 * Analisa todos os chamados não atribuídos
 */
async function analyzeAllTickets() {
    const unassigned = allChamados.filter(c => !c.tecnicoResponsavelId);
    
    if (unassigned.length === 0) {
        showAlert('Não há chamados não atribuídos para analisar.', 'info');
        return;
    }

    if (!confirm(`Deseja analisar ${unassigned.length} chamados não atribuídos com IA?`)) {
        return;
    }

    btnAnalyzeAll.disabled = true;
    btnAnalyzeAll.innerHTML = '<span class="spinner"></span> Analisando...';

    let success = 0;
    let errors = 0;

    for (const chamado of unassigned) {
        try {
            await api.post(`/Chamados/${chamado.id}/analisar-com-handoff`);
            success++;
        } catch (error) {
            console.error(`Erro ao analisar chamado ${chamado.id}:`, error);
            errors++;
        }
    }

    btnAnalyzeAll.disabled = false;
    btnAnalyzeAll.innerHTML = '🤖 Analisar Todos com IA';

    showAlert(`Análise concluída: ${success} sucesso, ${errors} erros.`, success > 0 ? 'success' : 'error');
    loadAllChamados();
}

/**
 * Utilitários
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

function getPriorityClass(priority) {
    const priorityMap = {
        'Baixa': 'low',
        'Média': 'medium',
        'Alta': 'high',
        'Crítica': 'critical'
    };
    return priorityMap[priority] || 'default';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function clearFilters() {
    fltStatus.value = '';
    fltPriority.value = '';
    fltCategory.value = '';
    fltTech.value = '';
    fltSearch.value = '';
    applyFilters();
}

// Event Listeners
navLogout.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Deseja realmente sair?')) {
        auth.logout();
    }
});

fltStatus.addEventListener('change', applyFilters);
fltPriority.addEventListener('change', applyFilters);
fltCategory.addEventListener('change', applyFilters);
fltTech.addEventListener('change', applyFilters);
fltSearch.addEventListener('input', applyFilters);
btnClearFilters.addEventListener('click', clearFilters);
btnAnalyzeAll.addEventListener('click', analyzeAllTickets);

// Modal Atribuir
closeAssign.addEventListener('click', closeAssignModal);
btnCancelAssign.addEventListener('click', closeAssignModal);
btnConfirmAssign.addEventListener('click', confirmAssign);

// Modal Analisar
closeAnalyze.addEventListener('click', closeAnalyzeModal);
btnCancelAnalyze.addEventListener('click', closeAnalyzeModal);
btnAssignFromAnalyze.addEventListener('click', assignFromAnalyze);

// Fechar modals clicando fora
window.addEventListener('click', (e) => {
    if (e.target === modalAssign) closeAssignModal();
    if (e.target === modalAnalyze) closeAnalyzeModal();
});

// Inicialização
console.log('Admin Gerenciar Chamados carregado');
updateUserInfo();
loadCategories();
loadTechnicians();
loadAllChamados();

// Auto-refresh a cada 60 segundos
setInterval(() => {
    console.log('Auto-refresh: recarregando chamados...');
    loadAllChamados();
}, 60000);
