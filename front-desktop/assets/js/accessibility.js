/**
 * Sistema de Acessibilidade - FASE 6.4
 * Gerencia melhorias de acessibilidade e auditoria WCAG
 */

class AccessibilityManager {
  constructor() {
    this.init();
  }

  /**
   * Inicializa sistema de acessibilidade
   */
  init() {
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupSkipLinks();
    this.setupAriaLiveRegions();
    this.enhanceModals();
    this.enhanceToasts();
  }

  /**
   * Configura navegação por teclado
   */
  setupKeyboardNavigation() {
    // ESC fecha modais e toasts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeActiveModals();
        this.closeFocusedToast();
      }
    });

    // Tab trap em modais abertos
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.handleTabInModal(e);
      }
    });

    // Enter/Space ativam elementos clicáveis
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const target = e.target;
        if (target.getAttribute('role') === 'button' && !target.disabled) {
          e.preventDefault();
          target.click();
        }
      }
    });
  }

  /**
   * Gerencia foco visível e estados
   */
  setupFocusManagement() {
    // Remove outline apenas para mouse, mantém para teclado
    let isMouseUser = false;

    document.addEventListener('mousedown', () => {
      isMouseUser = true;
      document.body.classList.add('mouse-user');
    });

    document.addEventListener('keydown', () => {
      isMouseUser = false;
      document.body.classList.remove('mouse-user');
    });

    // Focus dentro de cards clicáveis
    const clickableCards = document.querySelectorAll('.chamado-card, .card[onclick]');
    clickableCards.forEach(card => {
      if (!card.hasAttribute('tabindex')) {
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
      }
    });
  }

  /**
   * Cria skip links para navegação rápida
   */
  setupSkipLinks() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Pular para o conteúdo principal';
    skipLink.setAttribute('aria-label', 'Pular navegação e ir direto ao conteúdo');

    document.body.insertBefore(skipLink, document.body.firstChild);

    // Garante que main content tem ID
    const mainContent = document.querySelector('main, .main, [role="main"]');
    if (mainContent && !mainContent.id) {
      mainContent.id = 'main-content';
      mainContent.setAttribute('role', 'main');
    }
  }

  /**
   * Configura ARIA live regions para anúncios
   */
  setupAriaLiveRegions() {
    // Cria região para anúncios assertivos (toasts, erros)
    if (!document.getElementById('aria-live-assertive')) {
      const assertive = document.createElement('div');
      assertive.id = 'aria-live-assertive';
      assertive.className = 'sr-only';
      assertive.setAttribute('role', 'alert');
      assertive.setAttribute('aria-live', 'assertive');
      assertive.setAttribute('aria-atomic', 'true');
      document.body.appendChild(assertive);
    }

    // Cria região para anúncios polidos (notificações)
    if (!document.getElementById('aria-live-polite')) {
      const polite = document.createElement('div');
      polite.id = 'aria-live-polite';
      polite.className = 'sr-only';
      polite.setAttribute('role', 'status');
      polite.setAttribute('aria-live', 'polite');
      polite.setAttribute('aria-atomic', 'true');
      document.body.appendChild(polite);
    }
  }

  /**
   * Melhora acessibilidade de modais
   */
  enhanceModals() {
    const modals = document.querySelectorAll('.modal, .confirm-modal');
    modals.forEach(modal => {
      // ARIA attributes
      if (!modal.hasAttribute('role')) {
        modal.setAttribute('role', 'dialog');
      }
      if (!modal.hasAttribute('aria-modal')) {
        modal.setAttribute('aria-modal', 'true');
      }

      // Label do modal
      const title = modal.querySelector('h2, h3, .modal-title, .confirm-title');
      if (title && !title.id) {
        title.id = `modal-title-${Date.now()}`;
        modal.setAttribute('aria-labelledby', title.id);
      }
    });
  }

  /**
   * Melhora acessibilidade de toasts
   */
  enhanceToasts() {
    // Observer para toasts dinâmicos
    const toastContainer = document.querySelector('.toast-container');
    if (toastContainer) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.classList && node.classList.contains('toast')) {
              this.enhanceToast(node);
            }
          });
        });
      });

      observer.observe(toastContainer, { childList: true });
    }
  }

  /**
   * Adiciona ARIA a um toast específico
   * @param {HTMLElement} toast - Elemento do toast
   */
  enhanceToast(toast) {
    // Role baseado no tipo
    const isError = toast.classList.contains('toast-error');
    toast.setAttribute('role', isError ? 'alert' : 'status');
    toast.setAttribute('aria-live', isError ? 'assertive' : 'polite');
    toast.setAttribute('aria-atomic', 'true');

    // Anuncia mensagem para screen readers
    const message = toast.querySelector('.toast-message');
    if (message) {
      this.announce(message.textContent, isError ? 'assertive' : 'polite');
    }
  }

  /**
   * Anuncia mensagem para screen readers
   * @param {string} message - Mensagem a anunciar
   * @param {string} politeness - 'assertive' ou 'polite'
   */
  announce(message, politeness = 'polite') {
    const regionId = politeness === 'assertive' ? 'aria-live-assertive' : 'aria-live-polite';
    const region = document.getElementById(regionId);
    
    if (region) {
      // Limpa e atualiza
      region.textContent = '';
      setTimeout(() => {
        region.textContent = message;
      }, 100);
    }
  }

  /**
   * Fecha modais ativos
   */
  closeActiveModals() {
    const activeModals = document.querySelectorAll('.modal.active, .confirm-modal.active');
    activeModals.forEach(modal => {
      const closeBtn = modal.querySelector('[data-dismiss], .modal-close, .confirm-cancel');
      if (closeBtn) {
        closeBtn.click();
      }
    });
  }

  /**
   * Fecha toast com foco
   */
  closeFocusedToast() {
    const focusedToast = document.querySelector('.toast:focus-within');
    if (focusedToast) {
      const closeBtn = focusedToast.querySelector('.toast-close');
      if (closeBtn) {
        closeBtn.click();
      }
    }
  }

  /**
   * Gerencia Tab em modais (trap focus)
   * @param {KeyboardEvent} e - Evento de teclado
   */
  handleTabInModal(e) {
    const activeModal = document.querySelector('.modal.active, .confirm-modal.active');
    if (!activeModal) return;

    const focusableElements = activeModal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  /**
   * Adiciona labels ausentes em formulários
   */
  addMissingLabels() {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (!input.id) {
        input.id = `input-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      // Verifica se tem label associado
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (!label && !input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
        // Adiciona aria-label baseado no placeholder ou name
        const labelText = input.placeholder || input.name || input.type;
        input.setAttribute('aria-label', labelText);
      }
    });
  }

  /**
   * Adiciona alt em imagens sem descrição
   */
  addMissingAltText() {
    const images = document.querySelectorAll('img:not([alt])');
    images.forEach(img => {
      // Se imagem decorativa
      if (img.parentElement.classList.contains('icon') || img.classList.contains('decorative')) {
        img.alt = '';
        img.setAttribute('role', 'presentation');
      } else {
        // Tenta usar título ou nome do arquivo
        img.alt = img.title || img.src.split('/').pop().split('.')[0];
      }
    });
  }

  /**
   * Verifica contraste de cores (simulação básica)
   * @param {string} bg - Cor de fundo (hex)
   * @param {string} fg - Cor de texto (hex)
   * @returns {object} Resultado da verificação
   */
  checkContrast(bg, fg) {
    const getLuminance = (hex) => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = ((rgb >> 16) & 0xff) / 255;
      const g = ((rgb >> 8) & 0xff) / 255;
      const b = (rgb & 0xff) / 255;

      const [rs, gs, bs] = [r, g, b].map(c => 
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      );

      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const l1 = getLuminance(bg);
    const l2 = getLuminance(fg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return {
      ratio: ratio.toFixed(2),
      passAA: ratio >= 4.5,
      passAAA: ratio >= 7,
      passLargeAA: ratio >= 3,
      passLargeAAA: ratio >= 4.5
    };
  }

  /**
   * Audita página atual e retorna relatório
   * @returns {object} Relatório de acessibilidade
   */
  audit() {
    const issues = [];
    const warnings = [];
    const passed = [];

    // 1. Verifica lang attribute
    if (!document.documentElement.lang) {
      issues.push({
        severity: 'error',
        rule: 'html-has-lang',
        message: 'Elemento <html> não possui atributo lang',
        fix: 'Adicionar <html lang="pt-BR">'
      });
    } else {
      passed.push('html-has-lang');
    }

    // 2. Verifica título da página
    if (!document.title || document.title.trim() === '') {
      issues.push({
        severity: 'error',
        rule: 'document-title',
        message: 'Página não possui título',
        fix: 'Adicionar <title> descritivo'
      });
    } else {
      passed.push('document-title');
    }

    // 3. Verifica headings (h1-h6)
    const h1 = document.querySelectorAll('h1');
    if (h1.length === 0) {
      warnings.push({
        severity: 'warning',
        rule: 'page-has-heading-one',
        message: 'Página não possui <h1>',
        fix: 'Adicionar <h1> como título principal'
      });
    } else if (h1.length > 1) {
      warnings.push({
        severity: 'warning',
        rule: 'page-has-heading-one',
        message: `Página possui ${h1.length} elementos <h1> (recomendado: 1)`,
        fix: 'Usar apenas um <h1> por página'
      });
    } else {
      passed.push('page-has-heading-one');
    }

    // 4. Verifica imagens sem alt
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    if (imagesWithoutAlt.length > 0) {
      issues.push({
        severity: 'error',
        rule: 'image-alt',
        message: `${imagesWithoutAlt.length} imagem(ns) sem atributo alt`,
        elements: Array.from(imagesWithoutAlt).map(img => img.outerHTML.substring(0, 100)),
        fix: 'Adicionar alt="" para imagens decorativas ou alt="descrição" para imagens informativas'
      });
    } else {
      passed.push('image-alt');
    }

    // 5. Verifica inputs sem label
    const inputsWithoutLabel = Array.from(document.querySelectorAll('input, select, textarea'))
      .filter(input => {
        const hasLabel = document.querySelector(`label[for="${input.id}"]`);
        const hasAriaLabel = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');
        return !hasLabel && !hasAriaLabel;
      });

    if (inputsWithoutLabel.length > 0) {
      issues.push({
        severity: 'error',
        rule: 'label',
        message: `${inputsWithoutLabel.length} campo(s) sem label`,
        elements: inputsWithoutLabel.map(input => `${input.type} ${input.name || input.id}`),
        fix: 'Adicionar <label> ou aria-label a cada campo'
      });
    } else {
      passed.push('label');
    }

    // 6. Verifica links sem texto
    const emptyLinks = Array.from(document.querySelectorAll('a'))
      .filter(link => !link.textContent.trim() && !link.getAttribute('aria-label'));

    if (emptyLinks.length > 0) {
      issues.push({
        severity: 'error',
        rule: 'link-name',
        message: `${emptyLinks.length} link(s) sem texto descritivo`,
        elements: emptyLinks.map(link => link.href),
        fix: 'Adicionar texto ao link ou aria-label'
      });
    } else {
      passed.push('link-name');
    }

    // 7. Verifica botões sem texto
    const emptyButtons = Array.from(document.querySelectorAll('button'))
      .filter(btn => !btn.textContent.trim() && !btn.getAttribute('aria-label'));

    if (emptyButtons.length > 0) {
      warnings.push({
        severity: 'warning',
        rule: 'button-name',
        message: `${emptyButtons.length} botão(ões) sem texto descritivo`,
        fix: 'Adicionar texto ao botão ou aria-label'
      });
    } else {
      passed.push('button-name');
    }

    // 8. Verifica tabindex inválido
    const invalidTabindex = document.querySelectorAll('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])');
    if (invalidTabindex.length > 0) {
      warnings.push({
        severity: 'warning',
        rule: 'tabindex',
        message: `${invalidTabindex.length} elemento(s) com tabindex > 0 (não recomendado)`,
        fix: 'Usar apenas tabindex="0" ou tabindex="-1"'
      });
    } else {
      passed.push('tabindex');
    }

    return {
      summary: {
        errors: issues.length,
        warnings: warnings.length,
        passed: passed.length,
        total: issues.length + warnings.length + passed.length
      },
      issues,
      warnings,
      passed,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Imprime relatório de auditoria no console
   */
  printAuditReport() {
    const report = this.audit();
    
    console.group('📋 Relatório de Acessibilidade');
    console.log(`✅ Aprovado: ${report.passed.length}`);
    console.log(`❌ Erros: ${report.summary.errors}`);
    console.log(`⚠️ Avisos: ${report.summary.warnings}`);
    
    if (report.issues.length > 0) {
      console.group('❌ Erros Críticos');
      report.issues.forEach(issue => {
        console.error(`[${issue.rule}] ${issue.message}`);
        console.log(`   Fix: ${issue.fix}`);
        if (issue.elements) {
          console.log('   Elementos:', issue.elements);
        }
      });
      console.groupEnd();
    }

    if (report.warnings.length > 0) {
      console.group('⚠️ Avisos');
      report.warnings.forEach(warning => {
        console.warn(`[${warning.rule}] ${warning.message}`);
        console.log(`   Fix: ${warning.fix}`);
      });
      console.groupEnd();
    }

    console.groupEnd();
    
    return report;
  }
}

// Criar instância global
const a11y = new AccessibilityManager();

// Adiciona comando de auditoria ao console
window.auditAccessibility = () => a11y.printAuditReport();

// Exportar para uso em outros scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccessibilityManager;
}

// Log de inicialização
console.log('♿ Sistema de Acessibilidade carregado. Use auditAccessibility() para auditar a página.');
