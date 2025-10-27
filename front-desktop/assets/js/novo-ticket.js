// novo-ticket.js - Criação de novos chamados com preview IA

// Verificar autenticação
if (!authService.isAuthenticated()) {
    window.location.href = 'login.html';
}

// Estado global
let categorias = [];
let prioridades = [];
let aiAnalysisResult = null;

// Elementos do DOM
const form = document.getElementById('newTicketForm');
const tituloInput = document.getElementById('titulo');
const descricaoTextarea = document.getElementById('descricao');
const categoriaSelect = document.getElementById('categoriaId');
const prioridadeSelect = document.getElementById('prioridadeId');
const charCount = document.getElementById('charCount');
const previewBtn = document.getElementById('previewBtn');
const submitBtn = document.getElementById('submitBtn');
const aiPreviewCard = document.getElementById('aiPreviewCard');
const aiPreviewContent = document.getElementById('aiPreviewContent');
const closePreviewBtn = document.getElementById('closePreviewBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loadingModal = document.getElementById('loadingModal');
const loadingMessage = document.getElementById('loadingMessage');

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    loadCategorias();
    loadPrioridades();
    setupEventListeners();
});

// ========================================
// CARREGAR DADOS
// ========================================

async function loadCategorias() {
    try {
        const response = await apiClient.get('/Categorias');
        categorias = response.data || response;
        
        populateCategoriaSelect();
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        showToast('Erro ao carregar categorias', 'error');
        // Fallback para categorias padrão
        categorias = [
            { id: 1, nome: 'Hardware' },
            { id: 2, nome: 'Software' },
            { id: 3, nome: 'Rede' },
            { id: 4, nome: 'Acesso/Senha' },
            { id: 5, nome: 'Outros' }
        ];
        populateCategoriaSelect();
    }
}

async function loadPrioridades() {
    try {
        const response = await apiClient.get('/Prioridades');
        prioridades = response.data || response;
        
        populatePrioridadeSelect();
    } catch (error) {
        console.error('Erro ao carregar prioridades:', error);
        showToast('Erro ao carregar prioridades', 'error');
        // Fallback para prioridades padrão
        prioridades = [
            { id: 1, nome: 'Alta', nivel: 3 },
            { id: 2, nome: 'Média', nivel: 2 },
            { id: 3, nome: 'Baixa', nivel: 1 }
        ];
        populatePrioridadeSelect();
    }
}

function populateCategoriaSelect() {
    categoriaSelect.innerHTML = '<option value="">Selecione...</option>';
    categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.nome;
        categoriaSelect.appendChild(option);
    });
}

function populatePrioridadeSelect() {
    prioridadeSelect.innerHTML = '<option value="">Selecione...</option>';
    prioridades.forEach(prio => {
        const option = document.createElement('option');
        option.value = prio.id;
        option.textContent = prio.nome;
        prioridadeSelect.appendChild(option);
    });
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Contador de caracteres
    descricaoTextarea.addEventListener('input', updateCharCount);
    
    // Preview IA
    previewBtn.addEventListener('click', showAIPreview);
    
    // Fechar preview
    closePreviewBtn.addEventListener('click', closeAIPreview);
    
    // Submit form
    form.addEventListener('submit', handleSubmit);
    
    // Logout
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        authService.logout();
        window.location.href = 'login.html';
    });
    
    // Limpar preview ao alterar form
    [tituloInput, descricaoTextarea, categoriaSelect, prioridadeSelect].forEach(element => {
        element.addEventListener('change', () => {
            aiAnalysisResult = null;
            closeAIPreview();
        });
    });
}

function updateCharCount() {
    const count = descricaoTextarea.value.length;
    charCount.textContent = count;
    
    if (count > 900) {
        charCount.style.color = 'var(--danger)';
    } else if (count > 700) {
        charCount.style.color = 'var(--warning)';
    } else {
        charCount.style.color = 'var(--text-muted)';
    }
}

// ========================================
// PREVIEW DA ANÁLISE IA
// ========================================

async function showAIPreview() {
    // Validar campos obrigatórios
    if (!validateForm(false)) {
        showToast('Preencha todos os campos antes de ver a sugestão da IA', 'warning');
        return;
    }
    
    const formData = getFormData();
    
    showLoading('Analisando chamado com IA...');
    
    try {
        // Chamar API de análise
        const response = await apiClient.post(`/Chamados/analisar-com-handoff`, formData);
        aiAnalysisResult = response.data || response;
        
        displayAIPreview(aiAnalysisResult);
        hideLoading();
        
    } catch (error) {
        console.error('Erro ao analisar com IA:', error);
        hideLoading();
        showToast('Erro ao obter sugestão da IA. O chamado será criado normalmente.', 'error');
    }
}

function displayAIPreview(result) {
    if (!result || !result.tecnicoRecomendado) {
        showToast('IA não retornou sugestão. O chamado será criado normalmente.', 'warning');
        return;
    }
    
    const tecnico = result.tecnicoRecomendado;
    const scores = result.scores || {};
    
    let html = `
        <div class="ai-preview-section">
            <h4>Técnico Recomendado</h4>
            <div class="tech-recommended">
                <div class="tech-info">
                    <strong>${escapeHtml(tecnico.nome)}</strong>
                    <span class="text-muted">${escapeHtml(tecnico.email)}</span>
                </div>
                <span class="score-badge">${scores.total || 0} pts</span>
            </div>
        </div>
        
        <div class="ai-preview-section">
            <h4>Breakdown de Scores</h4>
            <div class="scores-list">
    `;
    
    // Scores individuais
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
    
    html += `
            </div>
        </div>
    `;
    
    // Justificativa
    if (result.justificativa) {
        html += `
            <div class="ai-preview-section">
                <h4>Justificativa da IA</h4>
                <div class="justification-text">
                    ${escapeHtml(result.justificativa)}
                </div>
            </div>
        `;
    }
    
    // Ranking (se houver)
    if (result.ranking && result.ranking.length > 0) {
        html += `
            <div class="ai-preview-section">
                <h4>Ranking de Técnicos</h4>
                <div class="ranking-list">
        `;
        
        result.ranking.slice(0, 5).forEach((item, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            html += `
                <div class="rank-item">
                    <span class="rank-position">${medal || (index + 1)}</span>
                    <span class="rank-name">${escapeHtml(item.tecnico?.nome || 'N/A')}</span>
                    <span class="rank-score">${item.scoreTotal || 0} pts</span>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    aiPreviewContent.innerHTML = html;
    aiPreviewCard.style.display = 'block';
    
    // Scroll suave até o preview
    setTimeout(() => {
        aiPreviewCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

function closeAIPreview() {
    aiPreviewCard.style.display = 'none';
    aiAnalysisResult = null;
}

// ========================================
// SUBMIT FORM
// ========================================

async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm(true)) {
        return;
    }
    
    const formData = getFormData();
    
    showLoading('Criando chamado...');
    
    try {
        const response = await apiClient.post('/Chamados', formData);
        const chamado = response.data || response;
        
        hideLoading();
        showToast('Chamado criado com sucesso!', 'success');
        
        // Redirecionar para detalhes do chamado
        setTimeout(() => {
            window.location.href = `chamado-detalhes.html?id=${chamado.id}`;
        }, 1000);
        
    } catch (error) {
        console.error('Erro ao criar chamado:', error);
        hideLoading();
        
        const errorMessage = error.message || 'Erro ao criar chamado. Tente novamente.';
        showToast(errorMessage, 'error');
    }
}

// ========================================
// VALIDAÇÃO E HELPERS
// ========================================

function validateForm(showErrors) {
    let isValid = true;
    const errors = [];
    
    if (!tituloInput.value.trim()) {
        isValid = false;
        errors.push('Título é obrigatório');
        if (showErrors) tituloInput.classList.add('error');
    } else {
        tituloInput.classList.remove('error');
    }
    
    if (!descricaoTextarea.value.trim()) {
        isValid = false;
        errors.push('Descrição é obrigatória');
        if (showErrors) descricaoTextarea.classList.add('error');
    } else {
        descricaoTextarea.classList.remove('error');
    }
    
    if (!categoriaSelect.value) {
        isValid = false;
        errors.push('Categoria é obrigatória');
        if (showErrors) categoriaSelect.classList.add('error');
    } else {
        categoriaSelect.classList.remove('error');
    }
    
    if (!prioridadeSelect.value) {
        isValid = false;
        errors.push('Prioridade é obrigatória');
        if (showErrors) prioridadeSelect.classList.add('error');
    } else {
        prioridadeSelect.classList.remove('error');
    }
    
    if (showErrors && !isValid) {
        showToast(errors.join(', '), 'error');
    }
    
    return isValid;
}

function getFormData() {
    return {
        titulo: tituloInput.value.trim(),
        descricao: descricaoTextarea.value.trim(),
        categoriaId: parseInt(categoriaSelect.value),
        prioridadeId: parseInt(prioridadeSelect.value),
        usuarioId: authService.getUserInfo().userId
    };
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
    // Criar elemento de toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Mostrar toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remover toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// INICIALIZAÇÃO ADICIONAL
// ========================================

// Atualizar contador inicial
updateCharCount();
