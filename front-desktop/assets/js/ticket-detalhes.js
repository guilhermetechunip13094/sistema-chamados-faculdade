// ticket-detalhes.js - Visualização completa do chamado com ações baseadas em role

// Verificar autenticação
if (!authService.isAuthenticated()) {
    window.location.href = 'login.html';
}

// Estado global
let chamadoId = null;
let chamadoData = null;
let userRole = null;
let allStatus = [];
let allPrioridades = [];
let allTecnicos = [];

// Elementos do DOM
const logoutBtn = document.getElementById('logoutBtn');
const backBtn = document.getElementById('backBtn');
const loadingModal = document.getElementById('loadingModal');
const loadingMessage = document.getElementById('loadingMessage');

// Modals
const statusModal = document.getElementById('statusModal');
const reatribuirModal = document.getElementById('reatribuirModal');
const prioridadeModal = document.getElementById('prioridadeModal');
const fecharModal = document.getElementById('fecharModal');

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Pegar ID da URL
    const params = new URLSearchParams(window.location.search);
    chamadoId = params.get('id');
    
    if (!chamadoId) {
        showToast('ID do chamado não encontrado', 'error');
        setTimeout(() => window.location.href = 'dashboard.html', 2000);
        return;
    }
    
    // Pegar role do usuário
    userRole = authService.getUserRole();
    
    // Carregar dados
    loadChamado();
    loadStatus();
    loadPrioridades();
    if (userRole === 'Admin') {
        loadTecnicos();
    }
    
    setupEventListeners();
});

// ========================================
// CARREGAR DADOS
// ========================================

async function loadChamado() {
    showLoading('Carregando chamado...');
    
    try {
        const response = await apiClient.get(`/Chamados/${chamadoId}`);
        chamadoData = response.data || response;
        
        displayChamado(chamadoData);
        buildActionButtons();
        loadHistorico();
        
        hideLoading();
    } catch (error) {
        console.error('Erro ao carregar chamado:', error);
        hideLoading();
        showToast('Erro ao carregar chamado', 'error');
        setTimeout(() => window.location.href = 'dashboard.html', 2000);
    }
}

async function loadStatus() {
    try {
        const response = await apiClient.get('/Status');
        allStatus = response.data || response;
        
        populateStatusSelect();
    } catch (error) {
        console.error('Erro ao carregar status:', error);
    }
}

async function loadPrioridades() {
    try {
        const response = await apiClient.get('/Prioridades');
        allPrioridades = response.data || response;
        
        populatePrioridadeSelect();
    } catch (error) {
        console.error('Erro ao carregar prioridades:', error);
    }
}

async function loadTecnicos() {
    try {
        const response = await apiClient.get('/Usuarios');
        const usuarios = response.data || response;
        
        // Filtrar apenas técnicos e admins
        allTecnicos = usuarios.filter(u => 
            u.role === 'Tecnico' || u.role === 'Admin'
        );
        
        populateTecnicoSelect();
    } catch (error) {
        console.error('Erro ao carregar técnicos:', error);
    }
}

async function loadHistorico() {
    // Placeholder: API futura para histórico
    // Por enquanto, criar timeline básica com dados do chamado
    const timeline = document.getElementById('historicoTimeline');
    
    let html = `
        <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <strong>Chamado Criado</strong>
                <p class="text-muted">${formatDate(chamadoData.dataCriacao)}</p>
                <p>Por: ${escapeHtml(chamadoData.usuario?.nome || 'Desconhecido')}</p>
            </div>
        </div>
    `;
    
    if (chamadoData.tecnicoAtribuido) {
        html += `
            <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                    <strong>Técnico Atribuído</strong>
                    <p>${escapeHtml(chamadoData.tecnicoAtribuido.nome)}</p>
                </div>
            </div>
        `;
    }
    
    if (chamadoData.dataAtualizacao && chamadoData.dataAtualizacao !== chamadoData.dataCriacao) {
        html += `
            <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                    <strong>Última Atualização</strong>
                    <p class="text-muted">${formatDate(chamadoData.dataAtualizacao)}</p>
                </div>
            </div>
        `;
    }
    
    timeline.innerHTML = html;
}

// ========================================
// EXIBIR CHAMADO
// ========================================

function displayChamado(chamado) {
    // Header
    document.getElementById('chamadoId').textContent = chamado.id;
    document.getElementById('chamadoTitulo').textContent = chamado.titulo;
    
    // Status
    const statusBadge = document.getElementById('chamadoStatus');
    statusBadge.textContent = chamado.status?.nome || 'N/A';
    statusBadge.className = `badge ${getStatusClass(chamado.status?.nome)}`;
    
    // Prioridade
    const prioBadge = document.getElementById('chamadoPrioridade');
    prioBadge.textContent = chamado.prioridade?.nome || 'N/A';
    prioBadge.className = `badge ${getPriorityClass(chamado.prioridade?.nome)}`;
    
    // Categoria
    document.getElementById('chamadoCategoria').textContent = 
        chamado.categoria?.nome || 'N/A';
    
    // Datas
    document.getElementById('chamadoDataCriacao').textContent = 
        formatDate(chamado.dataCriacao);
    document.getElementById('chamadoDataAtualizacao').textContent = 
        formatDate(chamado.dataAtualizacao);
    
    // Descrição
    document.getElementById('chamadoDescricao').textContent = chamado.descricao;
    
    // Técnico
    const tecnicoSection = document.getElementById('tecnicoSection');
    if (chamado.tecnicoAtribuido) {
        document.getElementById('tecnicoNome').textContent = 
            chamado.tecnicoAtribuido.nome;
        document.getElementById('tecnicoEmail').textContent = 
            chamado.tecnicoAtribuido.email;
    } else {
        document.getElementById('tecnicoInfo').innerHTML = 
            '<span class="text-muted">Nenhum técnico atribuído</span>';
    }
    
    // Scores do Handoff (Admin apenas)
    if (userRole === 'Admin' && chamado.handoffScores) {
        displayHandoffScores(chamado.handoffScores);
    }
    
    // Justificativa IA (se disponível)
    if (chamado.justificativaIA) {
        document.getElementById('justificativaSection').style.display = 'block';
        document.getElementById('justificativaText').textContent = 
            chamado.justificativaIA;
    }
}

function displayHandoffScores(scores) {
    const scoresSection = document.getElementById('scoresSection');
    const scoresContent = document.getElementById('scoresContent');
    
    scoresSection.style.display = 'block';
    
    let html = '<div class="scores-list">';
    
    const scoreItems = [
        { label: 'Especialidade', value: scores.especialidade || 0, max: 50 },
        { label: 'Disponibilidade', value: scores.disponibilidade || 0, max: 30 },
        { label: 'Performance', value: scores.performance || 0, max: 15 },
        { label: 'Prioridade', value: scores.prioridade || 0, max: 10 },
        { label: 'Complexidade', value: scores.complexidade || 0, max: 10 }
    ];
    
    scoreItems.forEach(item => {
        const percentage = (item.value / item.max) * 100;
        html += `
            <div class="score-item">
                <div class="score-label">
                    <span>${item.label}</span>
                    <span class="score-value">${item.value}/${item.max} pts</span>
                </div>
                <div class="score-bar">
                    <div class="score-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    if (scores.total) {
        html += `
            <div style="margin-top: 16px; text-align: center;">
                <strong>Score Total: </strong>
                <span class="score-badge">${scores.total} pontos</span>
            </div>
        `;
    }
    
    scoresContent.innerHTML = html;
}

// ========================================
// AÇÕES BASEADAS EM ROLE
// ========================================

function buildActionButtons() {
    const container = document.getElementById('acoesContainer');
    let html = '';
    
    const isClosed = chamadoData.status?.nome?.toLowerCase() === 'fechado';
    
    if (isClosed) {
        html = '<p class="text-muted">Este chamado está fechado.</p>';
    } else {
        switch (userRole) {
            case 'Usuario':
                // Usuário pode apenas fechar
                html = `
                    <button class="btn btn-danger" onclick="openFecharModal()">
                        Fechar Chamado
                    </button>
                `;
                break;
                
            case 'Tecnico':
                // Técnico pode atualizar status e adicionar nota
                html = `
                    <button class="btn btn-primary" onclick="openStatusModal()">
                        Atualizar Status
                    </button>
                    <button class="btn btn-danger" onclick="openFecharModal()">
                        Fechar Chamado
                    </button>
                `;
                break;
                
            case 'Admin':
                // Admin tem todas as permissões
                html = `
                    <button class="btn btn-primary" onclick="openStatusModal()">
                        Atualizar Status
                    </button>
                    <button class="btn btn-secondary" onclick="openReatribuirModal()">
                        Reatribuir Técnico
                    </button>
                    <button class="btn btn-secondary" onclick="openPrioridadeModal()">
                        Alterar Prioridade
                    </button>
                    <button class="btn btn-danger" onclick="openFecharModal()">
                        Fechar Chamado
                    </button>
                `;
                break;
        }
    }
    
    container.innerHTML = html;
}

// ========================================
// MODALS - ATUALIZAR STATUS
// ========================================

function openStatusModal() {
    statusModal.style.display = 'flex';
}

function closeStatusModal() {
    statusModal.style.display = 'none';
    document.getElementById('notaTecnica').value = '';
}

async function confirmUpdateStatus() {
    const statusId = document.getElementById('novoStatus').value;
    const nota = document.getElementById('notaTecnica').value;
    
    if (!statusId) {
        showToast('Selecione um status', 'warning');
        return;
    }
    
    showLoading('Atualizando status...');
    closeStatusModal();
    
    try {
        const payload = {
            statusId: parseInt(statusId),
            nota: nota || null
        };
        
        await apiClient.put(`/Chamados/${chamadoId}/status`, payload);
        
        hideLoading();
        showToast('Status atualizado com sucesso!', 'success');
        
        // Recarregar chamado
        setTimeout(() => loadChamado(), 1000);
        
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        hideLoading();
        showToast('Erro ao atualizar status', 'error');
    }
}

// ========================================
// MODALS - REATRIBUIR TÉCNICO
// ========================================

function openReatribuirModal() {
    reatribuirModal.style.display = 'flex';
}

function closeReatribuirModal() {
    reatribuirModal.style.display = 'none';
}

async function confirmReatribuir() {
    const tecnicoId = document.getElementById('novoTecnico').value;
    
    if (!tecnicoId) {
        showToast('Selecione um técnico', 'warning');
        return;
    }
    
    showLoading('Reatribuindo técnico...');
    closeReatribuirModal();
    
    try {
        await apiClient.put(`/Chamados/${chamadoId}/atribuir/${tecnicoId}`);
        
        hideLoading();
        showToast('Técnico reatribuído com sucesso!', 'success');
        
        // Recarregar chamado
        setTimeout(() => loadChamado(), 1000);
        
    } catch (error) {
        console.error('Erro ao reatribuir técnico:', error);
        hideLoading();
        showToast('Erro ao reatribuir técnico', 'error');
    }
}

// ========================================
// MODALS - ALTERAR PRIORIDADE
// ========================================

function openPrioridadeModal() {
    prioridadeModal.style.display = 'flex';
}

function closePrioridadeModal() {
    prioridadeModal.style.display = 'none';
}

async function confirmAlterarPrioridade() {
    const prioridadeId = document.getElementById('novaPrioridade').value;
    
    if (!prioridadeId) {
        showToast('Selecione uma prioridade', 'warning');
        return;
    }
    
    showLoading('Alterando prioridade...');
    closePrioridadeModal();
    
    try {
        await apiClient.put(`/Chamados/${chamadoId}/prioridade/${prioridadeId}`);
        
        hideLoading();
        showToast('Prioridade alterada com sucesso!', 'success');
        
        // Recarregar chamado
        setTimeout(() => loadChamado(), 1000);
        
    } catch (error) {
        console.error('Erro ao alterar prioridade:', error);
        hideLoading();
        showToast('Erro ao alterar prioridade', 'error');
    }
}

// ========================================
// MODALS - FECHAR CHAMADO
// ========================================

function openFecharModal() {
    fecharModal.style.display = 'flex';
}

function closeFecharModal() {
    fecharModal.style.display = 'none';
}

async function confirmFechar() {
    showLoading('Fechando chamado...');
    closeFecharModal();
    
    try {
        // Buscar ID do status "Fechado"
        const statusFechado = allStatus.find(s => 
            s.nome?.toLowerCase() === 'fechado'
        );
        
        if (!statusFechado) {
            throw new Error('Status "Fechado" não encontrado');
        }
        
        await apiClient.put(`/Chamados/${chamadoId}/status`, {
            statusId: statusFechado.id
        });
        
        hideLoading();
        showToast('Chamado fechado com sucesso!', 'success');
        
        // Recarregar chamado
        setTimeout(() => loadChamado(), 1000);
        
    } catch (error) {
        console.error('Erro ao fechar chamado:', error);
        hideLoading();
        showToast('Erro ao fechar chamado', 'error');
    }
}

// ========================================
// POPULATE SELECTS
// ========================================

function populateStatusSelect() {
    const select = document.getElementById('novoStatus');
    select.innerHTML = '<option value="">Selecione...</option>';
    
    allStatus.forEach(status => {
        const option = document.createElement('option');
        option.value = status.id;
        option.textContent = status.nome;
        select.appendChild(option);
    });
}

function populatePrioridadeSelect() {
    const select = document.getElementById('novaPrioridade');
    select.innerHTML = '<option value="">Selecione...</option>';
    
    allPrioridades.forEach(prio => {
        const option = document.createElement('option');
        option.value = prio.id;
        option.textContent = prio.nome;
        select.appendChild(option);
    });
}

function populateTecnicoSelect() {
    const select = document.getElementById('novoTecnico');
    select.innerHTML = '<option value="">Selecione...</option>';
    
    allTecnicos.forEach(tec => {
        const option = document.createElement('option');
        option.value = tec.id;
        option.textContent = `${tec.nome} (${tec.email})`;
        select.appendChild(option);
    });
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
    
    // Back button
    backBtn.addEventListener('click', () => {
        window.history.back();
    });
    
    // Status Modal
    document.getElementById('closeStatusModal').addEventListener('click', closeStatusModal);
    document.getElementById('cancelStatusBtn').addEventListener('click', closeStatusModal);
    document.getElementById('confirmStatusBtn').addEventListener('click', confirmUpdateStatus);
    
    // Reatribuir Modal
    document.getElementById('closeReatribuirModal').addEventListener('click', closeReatribuirModal);
    document.getElementById('cancelReatribuirBtn').addEventListener('click', closeReatribuirModal);
    document.getElementById('confirmReatribuirBtn').addEventListener('click', confirmReatribuir);
    
    // Prioridade Modal
    document.getElementById('closePrioridadeModal').addEventListener('click', closePrioridadeModal);
    document.getElementById('cancelPrioridadeBtn').addEventListener('click', closePrioridadeModal);
    document.getElementById('confirmPrioridadeBtn').addEventListener('click', confirmAlterarPrioridade);
    
    // Fechar Modal
    document.getElementById('closeFecharModal').addEventListener('click', closeFecharModal);
    document.getElementById('cancelFecharBtn').addEventListener('click', closeFecharModal);
    document.getElementById('confirmFecharBtn').addEventListener('click', confirmFechar);
    
    // Close modals on backdrop click
    [statusModal, reatribuirModal, prioridadeModal, fecharModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
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

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getStatusClass(status) {
    if (!status) return 'badge-secondary';
    const s = status.toLowerCase();
    if (s.includes('aberto') || s.includes('novo')) return 'badge-primary';
    if (s.includes('andamento') || s.includes('progresso')) return 'badge-warning';
    if (s.includes('fechado') || s.includes('concluído')) return 'badge-success';
    if (s.includes('pendente')) return 'badge-secondary';
    return 'badge-secondary';
}

function getPriorityClass(priority) {
    if (!priority) return 'badge-secondary';
    const p = priority.toLowerCase();
    if (p.includes('alta') || p.includes('urgente')) return 'badge-danger';
    if (p.includes('média') || p.includes('media')) return 'badge-warning';
    if (p.includes('baixa')) return 'badge-success';
    return 'badge-secondary';
}

// Tornar funções globais para onclick
window.openStatusModal = openStatusModal;
window.openReatribuirModal = openReatribuirModal;
window.openPrioridadeModal = openPrioridadeModal;
window.openFecharModal = openFecharModal;
