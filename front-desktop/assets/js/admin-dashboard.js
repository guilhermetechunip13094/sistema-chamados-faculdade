/**
 * Admin Dashboard Page Script
 * Sistema de Chamados - Faculdade
 */

// Verifica autenticação e role Admin
if (!auth.isAuthenticated()) {
    console.log('Usuário não autenticado, redirecionando para login...');
    window.location.href = 'login.html';
}

// Verifica se é Admin
if (!auth.isAdmin()) {
    console.log('Usuário não é Admin, redirecionando para dashboard normal...');
    alert('Acesso negado. Você não tem permissão para acessar esta área.');
    window.location.href = 'dashboard.html';
}

// Elementos do DOM
const userNameEl = document.getElementById('user-name');
const navLogout = document.getElementById('nav-logout');
const alertDiv = document.getElementById('alert');
const loadingDiv = document.getElementById('loading');
const statsSection = document.getElementById('stats-section');
const chartsSection = document.getElementById('charts-section');

// KPIs
const kpiTotal = document.getElementById('kpi-total');
const kpiOpen = document.getElementById('kpi-open');
const kpiProgress = document.getElementById('kpi-progress');
const kpiPending = document.getElementById('kpi-pending');
const kpiResolved = document.getElementById('kpi-resolved');
const kpiClosed = document.getElementById('kpi-closed');

// Botões
const btnManageTickets = document.getElementById('btn-manage-tickets');
const btnViewTechnicians = document.getElementById('btn-view-technicians');
const btnViewUsers = document.getElementById('btn-view-users');
const btnRefresh = document.getElementById('btn-refresh');

// Tabela de chamados recentes
const recentTicketsBody = document.getElementById('recent-tickets-body');
const recentTicketsLoading = document.getElementById('recent-tickets-loading');

// Gráficos Chart.js
let chartStatus = null;
let chartCategory = null;
let chartPriority = null;

// Estado da aplicação
let allChamados = [];

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
    statsSection.style.display = show ? 'none' : 'grid';
    chartsSection.style.display = show ? 'none' : 'grid';
}

/**
 * Atualiza informações do usuário no header
 */
function updateUserInfo() {
    const userInfo = auth.getUserInfo();
    
    if (userInfo) {
        userNameEl.textContent = userInfo.nome || userInfo.email || 'Admin';
        console.log('Admin:', userInfo.nome);
    }
}

/**
 * Busca todos os chamados (Admin tem acesso a todos)
 */
async function loadAllChamados() {
    try {
        setLoading(true);

        console.log('Buscando todos os chamados (Admin)...');
        const response = await api.get('/Chamados');
        
        allChamados = response || [];
        console.log(`${allChamados.length} chamados encontrados no sistema`);

        updateStatistics();
        updateCharts();
        loadRecentTickets();
        
        setLoading(false);
        
    } catch (error) {
        console.error('Erro ao carregar chamados:', error);
        
        let errorMessage = 'Erro ao carregar estatísticas.';
        
        if (error instanceof ApiError) {
            if (error.status === 401) {
                errorMessage = 'Sessão expirada. Faça login novamente.';
                setTimeout(() => auth.logout(), 2000);
            } else if (error.status === 403) {
                errorMessage = 'Acesso negado. Você não tem permissão de administrador.';
                setTimeout(() => window.location.href = 'dashboard.html', 2000);
            } else if (error.message) {
                errorMessage = error.message;
            }
        }
        
        showAlert(errorMessage, 'error');
        allChamados = [];
        setLoading(false);
    }
}

/**
 * Atualiza estatísticas (KPIs)
 */
function updateStatistics() {
    const total = allChamados.length;
    
    const countByStatus = {
        'Aberto': 0,
        'Em Andamento': 0,
        'Pendente': 0,
        'Resolvido': 0,
        'Fechado': 0
    };

    allChamados.forEach(chamado => {
        const statusNome = chamado.status?.nome || 'Desconhecido';
        if (countByStatus.hasOwnProperty(statusNome)) {
            countByStatus[statusNome]++;
        }
    });

    kpiTotal.textContent = total;
    kpiOpen.textContent = countByStatus['Aberto'];
    kpiProgress.textContent = countByStatus['Em Andamento'];
    kpiPending.textContent = countByStatus['Pendente'];
    kpiResolved.textContent = countByStatus['Resolvido'];
    kpiClosed.textContent = countByStatus['Fechado'];

    console.log('Estatísticas atualizadas:', countByStatus);
}

/**
 * Atualiza gráficos Chart.js
 */
function updateCharts() {
    updateStatusChart();
    updateCategoryChart();
    updatePriorityChart();
}

/**
 * Gráfico: Chamados por Status
 */
function updateStatusChart() {
    const statusCount = {};
    
    allChamados.forEach(chamado => {
        const status = chamado.status?.nome || 'Sem Status';
        statusCount[status] = (statusCount[status] || 0) + 1;
    });

    const labels = Object.keys(statusCount);
    const data = Object.values(statusCount);
    const backgroundColors = labels.map(getStatusColor);

    const ctx = document.getElementById('chart-status').getContext('2d');
    
    // Destroi gráfico anterior se existir
    if (chartStatus) {
        chartStatus.destroy();
    }

    chartStatus = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12,
                            family: 'Inter, sans-serif'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const value = context.parsed;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Gráfico: Chamados por Categoria
 */
function updateCategoryChart() {
    const categoryCount = {};
    
    allChamados.forEach(chamado => {
        const category = chamado.categoria?.nome || 'Sem Categoria';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const labels = Object.keys(categoryCount);
    const data = Object.values(categoryCount);

    const ctx = document.getElementById('chart-category').getContext('2d');
    
    if (chartCategory) {
        chartCategory.destroy();
    }

    chartCategory = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quantidade',
                data: data,
                backgroundColor: '#2563eb',
                borderColor: '#1e40af',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} chamados`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

/**
 * Gráfico: Chamados por Prioridade
 */
function updatePriorityChart() {
    const priorityCount = {};
    
    allChamados.forEach(chamado => {
        const priority = chamado.prioridade?.nome || 'Sem Prioridade';
        priorityCount[priority] = (priorityCount[priority] || 0) + 1;
    });

    // Ordena prioridades: Crítica, Alta, Média, Baixa
    const priorityOrder = ['Crítica', 'Alta', 'Média', 'Baixa', 'Sem Prioridade'];
    const labels = priorityOrder.filter(p => priorityCount[p] > 0);
    const data = labels.map(p => priorityCount[p]);
    const backgroundColors = labels.map(getPriorityColor);

    const ctx = document.getElementById('chart-priority').getContext('2d');
    
    if (chartPriority) {
        chartPriority.destroy();
    }

    chartPriority = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12,
                            family: 'Inter, sans-serif'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const value = context.parsed;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Retorna cor para status
 * @param {string} status - Nome do status
 * @returns {string} - Cor hexadecimal
 */
function getStatusColor(status) {
    const colors = {
        'Aberto': '#fbbf24',
        'Em Andamento': '#60a5fa',
        'Pendente': '#fb923c',
        'Resolvido': '#34d399',
        'Fechado': '#9ca3af'
    };
    return colors[status] || '#e5e7eb';
}

/**
 * Retorna cor para prioridade
 * @param {string} priority - Nome da prioridade
 * @returns {string} - Cor hexadecimal
 */
function getPriorityColor(priority) {
    const colors = {
        'Crítica': '#ef4444',
        'Alta': '#fb923c',
        'Média': '#fbbf24',
        'Baixa': '#34d399'
    };
    return colors[priority] || '#e5e7eb';
}

/**
 * Carrega chamados recentes (últimos 10)
 */
function loadRecentTickets() {
    recentTicketsBody.innerHTML = '';

    if (allChamados.length === 0) {
        recentTicketsBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    Nenhum chamado no sistema
                </td>
            </tr>
        `;
        return;
    }

    // Ordena por data de criação (mais recente primeiro)
    const sorted = [...allChamados].sort((a, b) => {
        return new Date(b.dataCriacao) - new Date(a.dataCriacao);
    });

    // Pega os 10 mais recentes
    const recent = sorted.slice(0, 10);

    recent.forEach(chamado => {
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        row.onclick = () => viewChamadoDetails(chamado.id);

        const statusClass = getStatusClass(chamado.status?.nome);
        const priorityClass = getPriorityClass(chamado.prioridade?.nome);

        row.innerHTML = `
            <td><strong>#${chamado.id}</strong></td>
            <td>${escapeHtml(chamado.titulo)}</td>
            <td><span class="badge badge-${statusClass}">${chamado.status?.nome || 'N/A'}</span></td>
            <td><span class="badge badge-${priorityClass} badge-sm">${chamado.prioridade?.nome || 'N/A'}</span></td>
            <td>${escapeHtml(chamado.categoria?.nome || 'N/A')}</td>
            <td>${chamado.tecnicoResponsavel ? escapeHtml(chamado.tecnicoResponsavel.nome) : '<em class="text-muted">Não atribuído</em>'}</td>
            <td>${formatDate(chamado.dataCriacao)}</td>
        `;

        recentTicketsBody.appendChild(row);
    });
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
 * Formata data para exibição
 * @param {string} dateString - Data ISO
 * @returns {string} - Data formatada
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
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
    window.location.href = `chamado-detalhes.html?id=${chamadoId}`;
}

/**
 * Navega para página de gerenciar chamados
 */
function goToManageTickets() {
    window.location.href = 'admin-chamados.html';
}

// Event Listeners
navLogout.addEventListener('click', (e) => {
    e.preventDefault();
    
    if (confirm('Deseja realmente sair?')) {
        console.log('Admin fazendo logout...');
        auth.logout();
    }
});

btnManageTickets.addEventListener('click', goToManageTickets);

btnViewTechnicians.addEventListener('click', () => {
    showAlert('Página de técnicos em desenvolvimento.', 'info');
});

btnViewUsers.addEventListener('click', () => {
    showAlert('Página de usuários em desenvolvimento.', 'info');
});

btnRefresh.addEventListener('click', () => {
    console.log('Recarregando estatísticas...');
    showAlert('Atualizando estatísticas...', 'info');
    loadAllChamados();
});

// Inicialização
console.log('Admin Dashboard carregado');
console.log('API URL:', api.baseURL);

updateUserInfo();
loadAllChamados();

// Auto-refresh a cada 60 segundos (menos frequente que dashboard de usuário)
setInterval(() => {
    console.log('Auto-refresh: recarregando estatísticas admin...');
    loadAllChamados();
}, 60000);
