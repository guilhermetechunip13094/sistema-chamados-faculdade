/**
 * Sistema de Loading States - FASE 6.1
 * Gerencia spinners, skeleton screens e estados de loading
 */

class LoadingManager {
  constructor() {
    this.overlay = null;
    this.activeRequests = 0;
    this.init();
  }

  /**
   * Inicializa o overlay de loading
   */
  init() {
    // Criar overlay se não existir
    if (!document.getElementById('loading-overlay')) {
      this.overlay = document.createElement('div');
      this.overlay.id = 'loading-overlay';
      this.overlay.className = 'loading-overlay';
      this.overlay.innerHTML = '<div class="spinner"></div>';
      document.body.appendChild(this.overlay);
    } else {
      this.overlay = document.getElementById('loading-overlay');
    }
  }

  /**
   * Mostra o overlay de loading global
   */
  show() {
    this.activeRequests++;
    if (this.overlay) {
      this.overlay.classList.add('active');
    }
  }

  /**
   * Esconde o overlay de loading global
   */
  hide() {
    this.activeRequests--;
    if (this.activeRequests <= 0) {
      this.activeRequests = 0;
      if (this.overlay) {
        this.overlay.classList.remove('active');
      }
    }
  }

  /**
   * Adiciona spinner a um botão
   * @param {HTMLElement} button - Elemento do botão
   * @param {string} originalText - Texto original do botão (opcional)
   */
  buttonStart(button, originalText = null) {
    if (!button) return;
    
    button.disabled = true;
    button.classList.add('btn-loading');
    
    if (originalText) {
      button.dataset.originalText = button.textContent;
      button.textContent = originalText;
    }
  }

  /**
   * Remove spinner de um botão
   * @param {HTMLElement} button - Elemento do botão
   */
  buttonEnd(button) {
    if (!button) return;
    
    button.disabled = false;
    button.classList.remove('btn-loading');
    
    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }

  /**
   * Cria skeleton para cards de chamados
   * @param {number} count - Número de skeleton cards
   * @returns {string} HTML do skeleton
   */
  createSkeletonCards(count = 3) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="skeleton-card">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
        </div>
      `;
    }
    return html;
  }

  /**
   * Cria skeleton para tabela
   * @param {number} rows - Número de linhas
   * @param {number} cols - Número de colunas
   * @returns {string} HTML do skeleton
   */
  createSkeletonTable(rows = 5, cols = 5) {
    let html = '<table class="skeleton-table"><tbody>';
    for (let i = 0; i < rows; i++) {
      html += '<tr>';
      for (let j = 0; j < cols; j++) {
        html += '<td><div class="skeleton skeleton-row"></div></td>';
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
  }

  /**
   * Cria skeleton para estatísticas
   * @param {number} count - Número de cards de estatísticas
   * @returns {string} HTML do skeleton
   */
  createSkeletonStats(count = 4) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += '<div class="skeleton skeleton-stat"></div>';
    }
    return html;
  }

  /**
   * Cria skeleton para gráfico
   * @returns {string} HTML do skeleton
   */
  createSkeletonChart() {
    return '<div class="skeleton skeleton-chart"></div>';
  }

  /**
   * Mostra skeleton em um container
   * @param {string} containerId - ID do container
   * @param {string} type - Tipo de skeleton ('cards', 'table', 'stats', 'chart')
   * @param {object} options - Opções adicionais
   */
  showSkeleton(containerId, type = 'cards', options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let skeletonHtml = '';
    
    switch (type) {
      case 'cards':
        skeletonHtml = this.createSkeletonCards(options.count || 3);
        break;
      case 'table':
        skeletonHtml = this.createSkeletonTable(options.rows || 5, options.cols || 5);
        break;
      case 'stats':
        skeletonHtml = this.createSkeletonStats(options.count || 4);
        break;
      case 'chart':
        skeletonHtml = this.createSkeletonChart();
        break;
      default:
        skeletonHtml = this.createSkeletonCards();
    }

    container.innerHTML = skeletonHtml;
  }

  /**
   * Remove skeleton e adiciona conteúdo com animação
   * @param {string} containerId - ID do container
   * @param {string} content - Conteúdo HTML a ser inserido
   */
  hideSkeleton(containerId, content) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = content;
    container.classList.add('fade-in');
    
    // Remove classe após animação
    setTimeout(() => {
      container.classList.remove('fade-in');
    }, 400);
  }

  /**
   * Adiciona spinner inline a um elemento
   * @param {HTMLElement} element - Elemento onde adicionar o spinner
   */
  addInlineSpinner(element) {
    if (!element) return;
    
    const spinner = document.createElement('span');
    spinner.className = 'spinner-inline';
    spinner.dataset.loadingSpinner = 'true';
    element.appendChild(spinner);
  }

  /**
   * Remove spinner inline de um elemento
   * @param {HTMLElement} element - Elemento do qual remover o spinner
   */
  removeInlineSpinner(element) {
    if (!element) return;
    
    const spinner = element.querySelector('[data-loading-spinner="true"]');
    if (spinner) {
      spinner.remove();
    }
  }

  /**
   * Adiciona classe de loading a um input
   * @param {HTMLElement} input - Elemento input
   */
  inputStart(input) {
    if (!input) return;
    input.classList.add('input-loading');
    input.disabled = true;
  }

  /**
   * Remove classe de loading de um input
   * @param {HTMLElement} input - Elemento input
   */
  inputEnd(input) {
    if (!input) return;
    input.classList.remove('input-loading');
    input.disabled = false;
  }

  /**
   * Adiciona loading a um container específico
   * @param {string} containerId - ID do container
   */
  containerStart(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.classList.add('loading-container', 'loading');
  }

  /**
   * Remove loading de um container específico
   * @param {string} containerId - ID do container
   */
  containerEnd(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.classList.remove('loading');
  }

  /**
   * Desabilita todos os inputs de um formulário
   * @param {HTMLFormElement} form - Elemento do formulário
   */
  disableForm(form) {
    if (!form) return;
    
    const inputs = form.querySelectorAll('input, select, textarea, button');
    inputs.forEach(input => {
      input.disabled = true;
    });
  }

  /**
   * Habilita todos os inputs de um formulário
   * @param {HTMLFormElement} form - Elemento do formulário
   */
  enableForm(form) {
    if (!form) return;
    
    const inputs = form.querySelectorAll('input, select, textarea, button');
    inputs.forEach(input => {
      input.disabled = false;
    });
  }

  /**
   * Wrapper para requisições fetch com loading automático
   * @param {string} url - URL da requisição
   * @param {object} options - Opções do fetch
   * @param {boolean} showOverlay - Se deve mostrar overlay global
   * @returns {Promise} Promise do fetch
   */
  async fetchWithLoading(url, options = {}, showOverlay = true) {
    if (showOverlay) {
      this.show();
    }

    try {
      const response = await fetch(url, options);
      return response;
    } finally {
      if (showOverlay) {
        this.hide();
      }
    }
  }
}

// Criar instância global
const loading = new LoadingManager();

// Exportar para uso em outros scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LoadingManager;
}
