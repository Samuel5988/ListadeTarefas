/**
 * Toast Manager - Sistema de notificações visuais
 * @author Lista de Tarefas App
 * @version 1.0.0
 */

export class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = new Map();
        this.defaultOptions = {
            duration: 3000,
            position: 'top-right',
            closable: true,
            pauseOnHover: true
        };
    }

    /**
     * Inicializa o container de toasts
     */
    initialize() {
        if (this.container) return;

        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('aria-label', 'Notificações');
        document.body.appendChild(this.container);
    }

    /**
     * Exibe uma notificação toast
     * @param {string} message - Mensagem a exibir
     * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
     * @param {Object} options - Opções adicionais
     */
    show(message, type = 'info', options = {}) {
        this.initialize();

        const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const config = { ...this.defaultOptions, ...options };

        // Criar elemento toast
        const toast = this.createToast(toastId, message, type, config);

        // Adicionar ao container
        this.container.appendChild(toast);
        this.toasts.set(toastId, { element: toast, config });

        // Animar entrada
        requestAnimationFrame(() => {
            toast.classList.add('toast--show');
        });

        // Auto-remover após duração
        if (config.duration > 0) {
            setTimeout(() => this.remove(toastId), config.duration);
        }

        return toastId;
    }

    /**
     * Cria elemento toast
     */
    createToast(id, message, type, config) {
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.setAttribute('data-toast-id', id);
        toast.setAttribute('role', 'alert');

        const icon = this.getIcon(type);

        toast.innerHTML = `
            <div class="toast__icon">${icon}</div>
            <div class="toast__message">${message}</div>
            ${config.closable ? '<button class="toast__close" aria-label="Fechar notificação">×</button>' : ''}
        `;

        // Event listeners
        if (config.closable) {
            const closeBtn = toast.querySelector('.toast__close');
            closeBtn.addEventListener('click', () => this.remove(id));
        }

        if (config.pauseOnHover) {
            let timeoutId;
            const pauseTimer = () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
            };
            const resumeTimer = () => {
                if (config.duration > 0) {
                    timeoutId = setTimeout(() => this.remove(id), config.duration);
                }
            };

            toast.addEventListener('mouseenter', pauseTimer);
            toast.addEventListener('mouseleave', resumeTimer);
            toast.addEventListener('focusin', pauseTimer);
            toast.addEventListener('focusout', resumeTimer);
        }

        return toast;
    }

    /**
     * Retorna ícone SVG para o tipo
     */
    getIcon(type) {
        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>'
        };
        return icons[type] || icons.info;
    }

    /**
     * Remove um toast
     */
    remove(toastId) {
        const toastData = this.toasts.get(toastId);
        if (!toastData) return;

        const { element } = toastData;
        element.classList.add('toast--hide');

        // Remover após animação
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.toasts.delete(toastId);
        }, 300);
    }

    /**
     * Remove todos os toasts
     */
    clearAll() {
        this.toasts.forEach((_, toastId) => this.remove(toastId));
    }
}

// Instância global
export const toastManager = new ToastManager();

// Métodos de conveniência
export const toast = {
    success: (message, options) => toastManager.show(message, 'success', options),
    error: (message, options) => toastManager.show(message, 'error', options),
    warning: (message, options) => toastManager.show(message, 'warning', options),
    info: (message, options) => toastManager.show(message, 'info', options),
    clear: () => toastManager.clearAll()
};