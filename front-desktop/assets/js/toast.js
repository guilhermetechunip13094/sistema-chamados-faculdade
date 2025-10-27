/**
 * Sistema de Toast Notifications - FASE 6.2
 * Exibe notificações visuais elegantes para feedback ao usuário
 */

class ToastManager {
  constructor() {
    this.container = null;
    this.toasts = [];
    this.maxToasts = 5;
    this.init();
  }

  /**
   * Inicializa o container de toasts
   */
  init() {
    // Criar container se não existir
    if (!document.getElementById('toast-container')) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById('toast-container');
    }
  }

  /**
   * Exibe toast de sucesso
   * @param {string} message - Mensagem a exibir
   * @param {number} duration - Duração em ms (padrão: 3000)
   * @returns {string} ID do toast
   */
  success(message, duration = 3000) {
    return this.show(message, 'success', duration);
  }

  /**
   * Exibe toast de erro
   * @param {string} message - Mensagem a exibir
   * @param {number} duration - Duração em ms (padrão: 4000)
   * @returns {string} ID do toast
   */
  error(message, duration = 4000) {
    return this.show(message, 'error', duration);
  }

  /**
   * Exibe toast de aviso
   * @param {string} message - Mensagem a exibir
   * @param {number} duration - Duração em ms (padrão: 3500)
   * @returns {string} ID do toast
   */
  warning(message, duration = 3500) {
    return this.show(message, 'warning', duration);
  }

  /**
   * Exibe toast informativo
   * @param {string} message - Mensagem a exibir
   * @param {number} duration - Duração em ms (padrão: 3000)
   * @returns {string} ID do toast
   */
  info(message, duration = 3000) {
    return this.show(message, 'info', duration);
  }

  /**
   * Exibe toast genérico
   * @param {string} message - Mensagem a exibir
   * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
   * @param {number} duration - Duração em ms
   * @returns {string} ID do toast
   */
  show(message, type = 'info', duration = 3000) {
    // Limita número de toasts visíveis
    if (this.toasts.length >= this.maxToasts) {
      this.removeOldest();
    }

    // Cria ID único
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Cria elemento do toast
    const toast = this.createToastElement(id, message, type);
    
    // Adiciona ao container
    this.container.appendChild(toast);
    this.toasts.push({ id, element: toast, timeout: null });

    // Animação de entrada
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // Auto-dismiss
    if (duration > 0) {
      const timeout = setTimeout(() => {
        this.dismiss(id);
      }, duration);

      // Armazena timeout para poder cancelar
      const toastData = this.toasts.find(t => t.id === id);
      if (toastData) {
        toastData.timeout = timeout;
      }
    }

    return id;
  }

  /**
   * Cria elemento HTML do toast
   * @param {string} id - ID único do toast
   * @param {string} message - Mensagem
   * @param {string} type - Tipo
   * @returns {HTMLElement} Elemento do toast
   */
  createToastElement(id, message, type) {
    const toast = document.createElement('div');
    toast.id = id;
    toast.className = `toast toast-${type}`;

    // Ícone baseado no tipo
    const icon = this.getIcon(type);

    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-message">${this.escapeHtml(message)}</div>
      </div>
      <button class="toast-close" aria-label="Fechar notificação">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    `;

    // Event listener para fechar
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.dismiss(id));

    // Pausa auto-dismiss ao passar mouse
    toast.addEventListener('mouseenter', () => {
      const toastData = this.toasts.find(t => t.id === id);
      if (toastData && toastData.timeout) {
        clearTimeout(toastData.timeout);
        toastData.timeout = null;
      }
    });

    // Retoma auto-dismiss ao tirar mouse
    toast.addEventListener('mouseleave', () => {
      const toastData = this.toasts.find(t => t.id === id);
      if (toastData && !toastData.timeout) {
        toastData.timeout = setTimeout(() => {
          this.dismiss(id);
        }, 2000);
      }
    });

    return toast;
  }

  /**
   * Retorna ícone SVG baseado no tipo
   * @param {string} type - Tipo do toast
   * @returns {string} SVG do ícone
   */
  getIcon(type) {
    const icons = {
      success: `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/>
          <path d="M6 10L9 13L14 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `,
      error: `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/>
          <path d="M10 6V11M10 14H10.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `,
      warning: `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2L2 17H18L10 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M10 8V11M10 14H10.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `,
      info: `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/>
          <path d="M10 10V14M10 7H10.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `
    };

    return icons[type] || icons.info;
  }

  /**
   * Remove toast
   * @param {string} id - ID do toast
   */
  dismiss(id) {
    const toastData = this.toasts.find(t => t.id === id);
    if (!toastData) return;

    // Cancela timeout se existir
    if (toastData.timeout) {
      clearTimeout(toastData.timeout);
    }

    // Animação de saída
    toastData.element.classList.remove('show');
    toastData.element.classList.add('hide');

    // Remove do DOM após animação
    setTimeout(() => {
      if (toastData.element.parentNode) {
        toastData.element.parentNode.removeChild(toastData.element);
      }
      
      // Remove do array
      this.toasts = this.toasts.filter(t => t.id !== id);
    }, 300);
  }

  /**
   * Remove o toast mais antigo
   */
  removeOldest() {
    if (this.toasts.length > 0) {
      this.dismiss(this.toasts[0].id);
    }
  }

  /**
   * Remove todos os toasts
   */
  dismissAll() {
    // Cria cópia do array para evitar problemas durante remoção
    const toastIds = this.toasts.map(t => t.id);
    toastIds.forEach(id => this.dismiss(id));
  }

  /**
   * Escapa HTML para prevenir XSS
   * @param {string} text - Texto a escapar
   * @returns {string} Texto escapado
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Toast com ação customizada
   * @param {string} message - Mensagem
   * @param {string} type - Tipo
   * @param {object} action - { text, callback }
   * @param {number} duration - Duração (0 = não fecha automaticamente)
   * @returns {string} ID do toast
   */
  showWithAction(message, type, action, duration = 0) {
    const id = this.show(message, type, duration);
    
    // Adiciona botão de ação
    const toast = document.getElementById(id);
    if (toast && action) {
      const actionBtn = document.createElement('button');
      actionBtn.className = 'toast-action';
      actionBtn.textContent = action.text;
      actionBtn.onclick = () => {
        action.callback();
        this.dismiss(id);
      };

      const content = toast.querySelector('.toast-content');
      content.appendChild(actionBtn);
    }

    return id;
  }

  /**
   * Toast de loading (não fecha automaticamente)
   * @param {string} message - Mensagem
   * @returns {string} ID do toast
   */
  loading(message) {
    const id = this.show(message, 'info', 0);
    
    // Adiciona spinner
    const toast = document.getElementById(id);
    if (toast) {
      const icon = toast.querySelector('.toast-icon');
      icon.innerHTML = '<div class="spinner-inline"></div>';
      toast.classList.add('toast-loading');
    }

    return id;
  }

  /**
   * Atualiza toast de loading para sucesso/erro
   * @param {string} id - ID do toast de loading
   * @param {string} message - Nova mensagem
   * @param {string} type - Novo tipo ('success' ou 'error')
   * @param {number} duration - Duração
   */
  updateLoading(id, message, type = 'success', duration = 3000) {
    const toast = document.getElementById(id);
    if (!toast) return;

    // Remove classe loading
    toast.classList.remove('toast-loading', 'toast-info');
    toast.classList.add(`toast-${type}`);

    // Atualiza ícone
    const icon = toast.querySelector('.toast-icon');
    icon.innerHTML = this.getIcon(type);

    // Atualiza mensagem
    const messageEl = toast.querySelector('.toast-message');
    messageEl.textContent = message;

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }
}

// Criar instância global
const toast = new ToastManager();

// Exportar para uso em outros scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ToastManager;
}
