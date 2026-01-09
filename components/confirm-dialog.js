/**
 * Confirm Dialog Component - Diálogo de confirmação para ações destrutivas
 * @author Lista de Tarefas App
 * @version 1.0.0
 */

import { taskStorage } from '../services/task-storage.js';
import { STATE_EVENTS } from '../state/app-state.js';
import { logger } from '../utils/logger.js';

/**
 * Classe para gerenciar diálogos de confirmação
 */
export class ConfirmDialog {
    constructor() {
        this.modalElement = null;
        this.isOpen = false;
        this.currentTask = null;
        this.onConfirmCallback = null;
        this.originalBodyOverflow = '';

        // Bind de métodos
        this.handleKeydown = this.handleKeydown.bind(this);
        this.handleBackdropClick = this.handleBackdropClick.bind(this);
    }

    /**
     * Mostra o diálogo de confirmação
     * @param {Object} task - Dados da tarefa a ser removida
     * @param {Function} onConfirm - Callback executado ao confirmar
     */
    show(task, onConfirm) {
        this.currentTask = task;
        this.onConfirmCallback = onConfirm;

        // Criar modal se não existir
        if (!this.modalElement) {
            this.createModal();
        }

        // Atualizar conteúdo
        this.updateContent();

        // Mostrar modal
        this.showModal();

        logger.debug('ConfirmDialog shown', { taskId: task.id });
    }

    /**
     * Cria o modal de confirmação
     */
    createModal() {
        // Modal overlay
        this.modalElement = document.createElement('div');
        this.modalElement.className = 'confirm-dialog__overlay';
        this.modalElement.setAttribute('role', 'dialog');
        this.modalElement.setAttribute('aria-modal', 'true');
        this.modalElement.setAttribute('aria-labelledby', 'confirm-dialog-title');
        this.modalElement.style.display = 'none';

        // Modal content
        this.modalElement.innerHTML = `
            <div class="confirm-dialog__modal" role="document">
                <div class="confirm-dialog__icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 9v6m0 3.5a.5.5 0 110-1 .5.5 0 010 1z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </div>

                <div class="confirm-dialog__content">
                    <h3 class="confirm-dialog__title" id="confirm-dialog-title">Remover Tarefa</h3>
                    <p class="confirm-dialog__message">
                        Tem certeza que deseja remover a tarefa "<span class="confirm-dialog__task-title"></span>"?
                    </p>
                    <p class="confirm-dialog__warning">Esta ação não pode ser desfeita.</p>
                </div>

                <div class="confirm-dialog__actions">
                    <label class="confirm-dialog__checkbox-label">
                        <input type="checkbox" class="confirm-dialog__checkbox" />
                        <span class="confirm-dialog__checkbox-text">Não perguntar novamente</span>
                    </label>

                    <div class="confirm-dialog__buttons">
                        <button type="button" class="btn btn--secondary confirm-dialog__cancel">
                            Cancelar
                        </button>
                        <button type="button" class="btn btn--danger confirm-dialog__confirm">
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Adicionar ao DOM
        document.body.appendChild(this.modalElement);

        // Adicionar event listeners
        this.addEventListeners();

        logger.debug('ConfirmDialog modal created');
    }

    /**
     * Atualiza o conteúdo do diálogo com os dados da tarefa
     */
    updateContent() {
        const titleElement = this.modalElement.querySelector('.confirm-dialog__task-title');
        titleElement.textContent = this.currentTask.title || 'Tarefa sem título';
    }

    /**
     * Mostra o modal com animação
     */
    showModal() {
        // Prevenir scroll do body
        this.originalBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        // Mostrar modal
        this.modalElement.style.display = 'flex';

        // Forçar reflow para animação
        this.modalElement.offsetHeight;

        this.modalElement.classList.add('confirm-dialog__overlay--open');
        this.isOpen = true;

        // Foco no botão cancelar
        setTimeout(() => {
            this.modalElement.querySelector('.confirm-dialog__cancel').focus();
        }, 100);
    }

    /**
     * Esconde o modal com animação
     */
    hideModal() {
        if (!this.isOpen) return;

        this.modalElement.classList.remove('confirm-dialog__overlay--open');

        setTimeout(() => {
            this.modalElement.style.display = 'none';
            document.body.style.overflow = this.originalBodyOverflow;
            this.isOpen = false;
            this.currentTask = null;
            this.onConfirmCallback = null;

            // Resetar checkbox
            const checkbox = this.modalElement.querySelector('.confirm-dialog__checkbox');
            if (checkbox) {
                checkbox.checked = false;
            }
        }, 200);
    }

    /**
     * Adiciona os event listeners
     */
    addEventListeners() {
        // Botão confirmar
        this.confirmButton = this.modalElement.querySelector('.confirm-dialog__confirm');
        this.confirmButton.addEventListener('click', () => this.confirm());

        // Botão cancelar
        this.cancelButton = this.modalElement.querySelector('.confirm-dialog__cancel');
        this.cancelButton.addEventListener('click', () => this.close());

        // Escape para fechar
        document.addEventListener('keydown', this.handleKeydown);

        // Click no backdrop para fechar
        this.modalElement.addEventListener('click', this.handleBackdropClick);
    }

    /**
     * Confirma a ação
     */
    async confirm() {
        try {
            // Verificar se não deve perguntar novamente
            const checkbox = this.modalElement.querySelector('.confirm-dialog__checkbox');
            const dontAskAgain = checkbox ? checkbox.checked : false;

            // Mostrar loading no botão
            this.setConfirmLoading(true);

            // Executar callback se existir
            if (this.onConfirmCallback) {
                await this.onConfirmCallback(dontAskAgain);
            }

            // Fechar modal
            this.close();

            logger.info('ConfirmDialog confirmed', { taskId: this.currentTask.id, dontAskAgain });

        } catch (error) {
            logger.error('Error in confirm dialog:', error);
            this.showError('Erro ao executar ação. Tente novamente.');
        } finally {
            this.setConfirmLoading(false);
        }
    }

    /**
     * Define estado de loading no botão confirmar
     */
    setConfirmLoading(loading) {
        if (loading) {
            this.confirmButton.disabled = true;
            this.confirmButton.innerHTML = `
                <span class="spinner"></span>
                Removendo...
            `;
        } else {
            this.confirmButton.disabled = false;
            this.confirmButton.textContent = 'Confirmar';
        }
    }

    /**
     * Mostra mensagem de erro
     */
    showError(message) {
        // Criar toast de erro
        const toast = document.createElement('div');
        toast.className = 'toast toast--error';
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.right = '20px';
        toast.style.zIndex = '9999';

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    /**
     * Manipula tecla Escape
     */
    handleKeydown(event) {
        if (event.key === 'Escape' && this.isOpen) {
            this.close();
        }
    }

    /**
     * Manipula clique no backdrop
     */
    handleBackdropClick(event) {
        if (event.target === this.modalElement && this.isOpen) {
            this.close();
        }
    }

    /**
     * Fecha o modal
     */
    close() {
        this.hideModal();
    }

    /**
     * Remove o componente do DOM
     */
    destroy() {
        if (this.modalElement) {
            this.modalElement.remove();
            this.modalElement = null;
        }

        // Remover event listeners
        document.removeEventListener('keydown', this.handleKeydown);

        logger.debug('ConfirmDialog destroyed');
    }
}