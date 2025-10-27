/**
 * Sistema de Confirmação - FASE 6.2
 * Exibe modais de confirmação para ações críticas
 */

class ConfirmManager {
  constructor() {
    this.modal = null;
    this.currentResolve = null;
    this.init();
  }

  /**
   * Inicializa o modal de confirmação
   */
  init() {
    // Criar modal se não existir
    if (!document.getElementById('confirm-modal')) {
      this.modal = this.createModalElement();
      document.body.appendChild(this.modal);
    } else {
      this.modal = document.getElementById('confirm-modal');
    }

    // Event listener para fechar com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) {
        this.cancel();
      }
    });
  }

  /**
   * Cria elemento HTML do modal
   * @returns {HTMLElement} Modal element
   */
  createModalElement() {
    const modal = document.createElement('div');
    modal.id = 'confirm-modal';
    modal.className = 'confirm-modal';

    modal.innerHTML = `
      <div class="confirm-overlay"></div>
      <div class="confirm-dialog">
        <div class="confirm-header">
          <div class="confirm-icon"></div>
          <h3 class="confirm-title"></h3>
        </div>
        <div class="confirm-body">
          <p class="confirm-message"></p>
        </div>
        <div class="confirm-footer">
          <button class="btn btn-secondary confirm-cancel">Cancelar</button>
          <button class="btn confirm-confirm">Confirmar</button>
        </div>
      </div>
    `;

    // Event listeners
    const overlay = modal.querySelector('.confirm-overlay');
    const cancelBtn = modal.querySelector('.confirm-cancel');
    const confirmBtn = modal.querySelector('.confirm-confirm');

    overlay.addEventListener('click', () => this.cancel());
    cancelBtn.addEventListener('click', () => this.cancel());
    confirmBtn.addEventListener('click', () => this.confirm());

    return modal;
  }

  /**
   * Exibe modal de confirmação
   * @param {object} options - Opções de configuração
   * @returns {Promise<boolean>} True se confirmado, false se cancelado
   */
  show(options = {}) {
    const {
      title = 'Confirmar ação',
      message = 'Tem certeza que deseja continuar?',
      confirmText = 'Confirmar',
      cancelText = 'Cancelar',
      type = 'warning', // 'danger', 'warning', 'info'
      isDangerous = false
    } = options;

    return new Promise((resolve) => {
      this.currentResolve = resolve;

      // Atualiza conteúdo
      const icon = this.modal.querySelector('.confirm-icon');
      const titleEl = this.modal.querySelector('.confirm-title');
      const messageEl = this.modal.querySelector('.confirm-message');
      const cancelBtn = this.modal.querySelector('.confirm-cancel');
      const confirmBtn = this.modal.querySelector('.confirm-confirm');

      icon.innerHTML = this.getIcon(type);
      titleEl.textContent = title;
      messageEl.textContent = message;
      cancelBtn.textContent = cancelText;
      confirmBtn.textContent = confirmText;

      // Atualiza classes
      this.modal.className = `confirm-modal confirm-${type}`;
      confirmBtn.className = `btn ${isDangerous || type === 'danger' ? 'btn-danger' : 'btn-primary'} confirm-confirm`;

      // Mostra modal
      setTimeout(() => {
        this.modal.classList.add('active');
        confirmBtn.focus();
      }, 10);
    });
  }

  /**
   * Confirmação de ação perigosa (deletar, etc)
   * @param {string} message - Mensagem customizada
   * @param {string} title - Título customizado
   * @returns {Promise<boolean>}
   */
  danger(message, title = 'Ação irreversível') {
    return this.show({
      title,
      message,
      type: 'danger',
      isDangerous: true,
      confirmText: 'Sim, continuar',
      cancelText: 'Cancelar'
    });
  }

  /**
   * Confirmação de aviso
   * @param {string} message - Mensagem customizada
   * @param {string} title - Título customizado
   * @returns {Promise<boolean>}
   */
  warning(message, title = 'Atenção') {
    return this.show({
      title,
      message,
      type: 'warning',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar'
    });
  }

  /**
   * Confirmação informativa
   * @param {string} message - Mensagem customizada
   * @param {string} title - Título customizado
   * @returns {Promise<boolean>}
   */
  info(message, title = 'Informação') {
    return this.show({
      title,
      message,
      type: 'info',
      confirmText: 'OK',
      cancelText: 'Cancelar'
    });
  }

  /**
   * Retorna ícone SVG baseado no tipo
   * @param {string} type - Tipo da confirmação
   * @returns {string} SVG do ícone
   */
  getIcon(type) {
    const icons = {
      danger: `
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="3"/>
          <path d="M24 14V26M24 32H24.02" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
        </svg>
      `,
      warning: `
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path d="M24 6L4 42H44L24 6Z" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M24 18V26M24 32H24.02" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
        </svg>
      `,
      info: `
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="3"/>
          <path d="M24 24V32M24 16H24.02" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
        </svg>
      `
    };

    return icons[type] || icons.info;
  }

  /**
   * Confirma a ação
   */
  confirm() {
    this.close();
    if (this.currentResolve) {
      this.currentResolve(true);
      this.currentResolve = null;
    }
  }

  /**
   * Cancela a ação
   */
  cancel() {
    this.close();
    if (this.currentResolve) {
      this.currentResolve(false);
      this.currentResolve = null;
    }
  }

  /**
   * Fecha o modal
   */
  close() {
    this.modal.classList.remove('active');
  }

  /**
   * Confirmação com input de texto (ex: digitar "DELETE" para confirmar)
   * @param {object} options - Opções de configuração
   * @returns {Promise<boolean>}
   */
  async confirmWithText(options = {}) {
    const {
      title = 'Confirmar ação',
      message = 'Para confirmar, digite a palavra abaixo:',
      confirmWord = 'DELETE',
      placeholder = `Digite "${confirmWord}" para confirmar`,
      type = 'danger'
    } = options;

    return new Promise((resolve) => {
      this.currentResolve = resolve;

      // Atualiza conteúdo
      const icon = this.modal.querySelector('.confirm-icon');
      const titleEl = this.modal.querySelector('.confirm-title');
      const messageEl = this.modal.querySelector('.confirm-message');
      const cancelBtn = this.modal.querySelector('.confirm-cancel');
      const confirmBtn = this.modal.querySelector('.confirm-confirm');

      icon.innerHTML = this.getIcon(type);
      titleEl.textContent = title;
      
      // Adiciona input de confirmação
      messageEl.innerHTML = `
        ${message}
        <div style="margin-top: 16px;">
          <strong style="color: var(--danger); font-family: monospace; font-size: 18px;">${confirmWord}</strong>
        </div>
        <input 
          type="text" 
          id="confirm-input" 
          class="form-control" 
          placeholder="${placeholder}"
          style="margin-top: 12px;"
        />
      `;

      cancelBtn.textContent = 'Cancelar';
      confirmBtn.textContent = 'Confirmar';
      confirmBtn.disabled = true;
      confirmBtn.className = 'btn btn-danger confirm-confirm';

      // Valida input em tempo real
      const input = messageEl.querySelector('#confirm-input');
      input.addEventListener('input', (e) => {
        confirmBtn.disabled = e.target.value !== confirmWord;
      });

      // Mostra modal
      this.modal.className = `confirm-modal confirm-${type}`;
      setTimeout(() => {
        this.modal.classList.add('active');
        input.focus();
      }, 10);

      // Permitir Enter para confirmar
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !confirmBtn.disabled) {
          this.confirm();
        }
      });
    });
  }

  /**
   * Alert simples (só OK, sem cancelar)
   * @param {string} message - Mensagem
   * @param {string} title - Título
   * @param {string} type - Tipo
   * @returns {Promise<boolean>}
   */
  alert(message, title = 'Informação', type = 'info') {
    return new Promise((resolve) => {
      this.currentResolve = resolve;

      // Atualiza conteúdo
      const icon = this.modal.querySelector('.confirm-icon');
      const titleEl = this.modal.querySelector('.confirm-title');
      const messageEl = this.modal.querySelector('.confirm-message');
      const footer = this.modal.querySelector('.confirm-footer');
      const confirmBtn = this.modal.querySelector('.confirm-confirm');

      icon.innerHTML = this.getIcon(type);
      titleEl.textContent = title;
      messageEl.textContent = message;

      // Esconde botão cancelar
      footer.innerHTML = `
        <button class="btn btn-primary confirm-confirm" style="min-width: 120px;">OK</button>
      `;

      const newConfirmBtn = footer.querySelector('.confirm-confirm');
      newConfirmBtn.addEventListener('click', () => {
        this.close();
        resolve(true);
        this.currentResolve = null;
      });

      // Mostra modal
      this.modal.className = `confirm-modal confirm-${type}`;
      setTimeout(() => {
        this.modal.classList.add('active');
        newConfirmBtn.focus();
      }, 10);

      // Enter para fechar
      const enterHandler = (e) => {
        if (e.key === 'Enter') {
          newConfirmBtn.click();
          document.removeEventListener('keypress', enterHandler);
        }
      };
      document.addEventListener('keypress', enterHandler);
    });
  }
}

// Criar instância global
const confirm = new ConfirmManager();

// Exportar para uso em outros scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConfirmManager;
}
