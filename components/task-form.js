/**
 * Task Form Component - Modal para criação de tarefas
 * @author Lista de Tarefas App
 * @version 1.0.0
 */

import { taskStorage } from '../services/task-storage.js';
import { STATE_EVENTS } from '../state/app-state.js';
import { logger } from '../utils/logger.js';

/**
 * Classe para gerenciar o formulário de criação de tarefas
 */
export class TaskForm {
    constructor() {
        this.modalElement = null;
        this.formElement = null;
        this.fabElement = null;
        this.isOpen = false;
        this.categories = ['Tarefas']; // Valor inicial padrão
        this.originalBodyOverflow = '';
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
        this.handleBackdropClick = this.handleBackdropClick.bind(this);
    }

    /**
     * Inicializa o componente
     */
    init() {
        this.createFab();
        this.createModal();
        this.loadCategories();
        logger.debug('TaskForm initialized');
    }

    /**
     * Cria o FAB (Floating Action Button)
     */
    createFab() {
        if (this.fabElement) return;

        this.fabElement = document.createElement('button');
        this.fabElement.className = 'fab fab--primary';

        // Estilos inline para garantir funcionamento em mobile (sobrescreve Tailwind e outros CSS)
        this.fabElement.style.cssText = `
            position: fixed !important;
            bottom: 16px !important;
            right: 16px !important;
            width: 56px !important;
            height: 56px !important;
            min-width: 56px !important;
            min-height: 56px !important;
            border-radius: 50% !important;
            border: none !important;
            background-color: var(--primary, #6c757d) !important;
            color: white !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
            transition: all 0.2s ease !important;
            z-index: 9999 !important;
            padding: 0 !important;
            margin: 0 !important;
        `;

        this.fabElement.innerHTML = `
            <svg class="fab__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width: 24px; height: 24px;">
                <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="sr-only">Adicionar nova tarefa</span>
        `;

        // Event listeners com feedback visual
        this.fabElement.addEventListener('click', () => this.open());
        this.fabElement.addEventListener('touchstart', () => {
            this.fabElement.style.transform = 'scale(0.95)';
        });
        this.fabElement.addEventListener('touchend', () => {
            this.fabElement.style.transform = 'scale(1)';
        });

        document.body.appendChild(this.fabElement);

        logger.debug('FAB created with inline styles');
    }

    /**
     * Cria o modal do formulário
     */
    createModal() {
        if (this.modalElement) return;

        // Modal overlay
        this.modalElement = document.createElement('div');
        this.modalElement.className = 'task-form__overlay';
        this.modalElement.setAttribute('role', 'dialog');
        this.modalElement.setAttribute('aria-modal', 'true');
        this.modalElement.setAttribute('aria-label', 'Criar nova tarefa');

        // Modal content
        this.modalElement.innerHTML = `
            <div class="task-form__modal" role="document">
                <div class="task-form__header">
                    <h2 class="task-form__title">Nova Tarefa</h2>
                    <button type="button" class="task-form__close" aria-label="Fechar">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>

                <form class="task-form__form" novalidate>
                    <div class="task-form__field">
                        <label for="task-title" class="task-form__label">Título *</label>
                        <input
                            type="text"
                            id="task-title"
                            name="title"
                            class="task-form__input"
                            placeholder="Ex: Estudar JavaScript"
                            required
                            maxlength="100"
                            autocomplete="off"
                        />
                        <div class="task-form__error" id="task-title-error"></div>
                    </div>

                    <div class="task-form__field">
                        <label for="task-description" class="task-form__label">Descrição</label>
                        <textarea
                            id="task-description"
                            name="description"
                            class="task-form__textarea"
                            placeholder="Adicione detalhes sobre a tarefa..."
                            rows="3"
                            maxlength="500"
                        ></textarea>
                        <div class="task-form__error" id="task-description-error"></div>
                    </div>

                    <div class="task-form__row">
                        <div class="task-form__field">
                            <label for="task-category" class="task-form__label">Categoria</label>
                            <select id="task-category" name="category" class="task-form__select">
                                ${this.categories.map(cat => `
                                    <option value="${cat}">${cat}</option>
                                `).join('')}
                            </select>
                        </div>

                        <div class="task-form__field">
                            <label for="task-priority" class="task-form__label">Prioridade</label>
                            <select id="task-priority" name="priority" class="task-form__select">
                                <option value="low">Baixa</option>
                                <option value="medium" selected>Média</option>
                                <option value="high">Alta</option>
                            </select>
                        </div>
                    </div>

                    <div class="task-form__field">
                        <label for="task-dueDate" class="task-form__label">Lembrete (opcional)</label>
                        <input
                            type="datetime-local"
                            id="task-dueDate"
                            name="dueDate"
                            class="task-form__input"
                        />
                        <div class="task-form__error" id="task-dueDate-error"></div>
                    </div>

                    <div class="task-form__actions">
                        <button type="button" class="btn btn--secondary task-form__cancel">
                            Cancelar
                        </button>
                        <button type="submit" class="btn btn--primary task-form__submit">
                            <span class="task-form__submit-text">Criar Tarefa</span>
                            <span class="task-form__submit-loading" style="display: none;">
                                <span class="spinner"></span>
                                Criando...
                            </span>
                        </button>
                    </div>
                </form>

                <div class="task-form__feedback" id="task-form-feedback"></div>
            </div>
        `;

        // Adicionar ao body
        document.body.appendChild(this.modalElement);

        // Configurar elementos
        this.formElement = this.modalElement.querySelector('.task-form__form');
        const closeBtn = this.modalElement.querySelector('.task-form__close');
        const cancelBtn = this.modalElement.querySelector('.task-form__cancel');

        // Event listeners
        closeBtn.addEventListener('click', () => this.close());
        cancelBtn.addEventListener('click', () => this.close());
        this.formElement.addEventListener('submit', this.handleSubmit);

        // Event listeners para validação em tempo real
        const titleInput = this.formElement.querySelector('#task-title');
        titleInput.addEventListener('input', () => this.validateField(titleInput));
        titleInput.addEventListener('blur', () => this.validateField(titleInput));

        // Validar data futura
        const dueDateInput = this.formElement.querySelector('#task-dueDate');
        dueDateInput.addEventListener('change', () => this.validateField(dueDateInput));

        logger.debug('Modal created');
    }

    /**
     * Carrega categorias do AppState
     */
    async loadCategories() {
        try {
            // Carregar categorias do AppState
            if (window.appState) {
                this.categories = window.appState.getCategoriesFromState();
                logger.info('Categories loaded from AppState:', this.categories);
            } else {
                logger.warn('AppState not available, using default categories');
            }
        } catch (error) {
            logger.warn('Failed to load categories from AppState, using defaults', error);
        }
    }

    /**
     * Atualiza o select de categorias no formulário
     */
    updateCategorySelect() {
        const categorySelect = this.formElement.querySelector('#task-category');
        if (categorySelect && this.categories) {
            // DEBUG: Log antes de atualizar
            logger.info('Updating category select with:', {
                currentCategories: this.categories,
                selectElement: !!categorySelect,
                currentOptions: categorySelect.options.length
            });

            // Limpar opções existentes
            categorySelect.innerHTML = '';

            // Adicionar novas opções
            this.categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                categorySelect.appendChild(option);
            });

            // DEBUG: Log após atualizar
            logger.info('Category select updated:', {
                newOptionsCount: categorySelect.options.length,
                options: Array.from(categorySelect.options).map(opt => ({ value: opt.value, text: opt.text }))
            });
        } else {
            logger.warn('Cannot update category select:', {
                hasSelect: !!categorySelect,
                hasCategories: !!this.categories,
                categories: this.categories
            });
        }
    }

    /**
     * Abre o modal
     */
    async open() {
        if (this.isOpen) return;

        // Recarregar categorias antes de abrir
        await this.loadCategories();

        // Atualizar o select de categorias no formulário
        this.updateCategorySelect();

        this.isOpen = true;
        this.modalElement.classList.add('task-form__overlay--open');

        // Auto-focus no campo título
        setTimeout(() => {
            const titleInput = this.formElement.querySelector('#task-title');
            titleInput.focus();
        }, 100);

        // Adicionar event listeners globais
        document.addEventListener('keydown', this.handleKeydown);

        // Impedir scroll do body, preservando valor original
        this.originalBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        logger.debug('Modal opened');
    }

    /**
     * Fecha o modal
     */
    close() {
        if (!this.isOpen) return;

        this.isOpen = false;
        this.modalElement.classList.remove('task-form__overlay--open');

        // Remover event listeners globais
        document.removeEventListener('keydown', this.handleKeydown);

        // Restaurar scroll do body para o valor original
        document.body.style.overflow = this.originalBodyOverflow;
        this.originalBodyOverflow = '';

        // Resetar formulário
        this.formElement.reset();
        this.clearValidation();

        logger.debug('Modal closed');
    }

    /**
     * Manipula eventos de teclado
     */
    handleKeydown(event) {
        if (event.key === 'Escape') {
            this.close();
        }
    }

    /**
     * Manipula clique no backdrop
     */
    handleBackdropClick(event) {
        if (event.target === this.modalElement) {
            this.close();
        }
    }

    /**
     * Manipula submit do formulário
     */
    async handleSubmit(event) {
        event.preventDefault();

        if (!this.validateForm()) {
            return;
        }

        const submitBtn = this.formElement.querySelector('.task-form__submit');
        const submitText = submitBtn.querySelector('.task-form__submit-text');
        const submitLoading = submitBtn.querySelector('.task-form__submit-loading');

        try {
            // Loading state
            submitBtn.disabled = true;
            submitText.style.display = 'none';
            submitLoading.style.display = 'flex';

            // Obter dados do formulário
            const formData = new FormData(this.formElement);
            const title = this.sanitizeInput(formData.get('title').trim());
            const description = this.sanitizeInput(formData.get('description').trim());
            const category = formData.get('category');
            const priority = formData.get('priority');
            const dueDate = formData.get('dueDate') || null;

            // DEBUG: Log para verificar os dados
            logger.info('Form data extracted:', {
                title,
                description,
                category,
                priority,
                availableCategories: this.categories,
                categoryExists: this.categories.includes(category)
            });

            // Validação adicional de categoria
            if (!this.categories.includes(category)) {
                logger.error('Category validation failed:', {
                    selectedCategory: category,
                    availableCategories: this.categories
                });
                this.showFieldError('task-category', 'Categoria inválida');
                return;
            }

            // Validação adicional de prioridade
            const validPriorities = ['low', 'medium', 'high'];
            if (!validPriorities.includes(priority)) {
                this.showFieldError('task-priority', 'Prioridade inválida');
                return;
            }

            const taskData = {
                title,
                description,
                category: category || 'Tarefas', // Garantir que sempre tenha categoria
                priority,
                dueDate,
            };

            // Validar data futura
            if (taskData.dueDate) {
                const dueDate = new Date(taskData.dueDate);
                const now = new Date();
                if (dueDate <= now) {
                    this.showFieldError('task-dueDate', 'A data deve ser futura');
                    return;
                }
            }

            // Criar tarefa usando TaskStorage
            const newTask = await taskStorage.add(taskData);

            if (newTask) {
                // Feedback de sucesso
                this.showFeedback('Tarefa criada com sucesso!', 'success');

                // Fechar modal após breve delay
                setTimeout(() => {
                    this.close();

                    // Disparar evento de criação - o app.js cuidará de atualizar o estado
                    // para evitar atualizações duplas que causam duplicatas
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent(STATE_EVENTS.TASK_CREATED, {
                            detail: { task: newTask }
                        }));
                    }, 100);
                }, 400);

                logger.info('Task created successfully', { taskId: newTask.id });
            } else {
                throw new Error('Failed to create task');
            }
        } catch (error) {
            logger.error('Failed to submit form', error);
            this.showFeedback('Erro ao criar tarefa. Tente novamente.', 'error');
        } finally {
            // Remover loading state
            submitBtn.disabled = false;
            submitText.style.display = 'inline';
            submitLoading.style.display = 'none';
        }
    }

    /**
     * Valida o formulário
     */
    validateForm() {
        let isValid = true;

        // Validar título (obrigatório)
        const titleInput = this.formElement.querySelector('#task-title');
        if (!this.validateField(titleInput)) {
            isValid = false;
        }

        // Validar dueDate se preenchido
        const dueDateInput = this.formElement.querySelector('#task-dueDate');
        if (dueDateInput.value && !this.validateField(dueDateInput)) {
            isValid = false;
        }

        return isValid;
    }

    /**
     * Valida um campo específico
     */
    validateField(field) {
        const fieldName = field.name;
        const value = field.value.trim();

        // Limpar erro anterior
        this.clearFieldError(field.id);

        switch (fieldName) {
            case 'title':
                if (!value) {
                    this.showFieldError(field.id, 'O título é obrigatório');
                    return false;
                }
                if (value.length > 100) {
                    this.showFieldError(field.id, 'Máximo de 100 caracteres');
                    return false;
                }
                break;

            case 'description':
                if (value.length > 500) {
                    this.showFieldError(field.id, 'Máximo de 500 caracteres');
                    return false;
                }
                break;

            case 'dueDate':
                if (value) {
                    const dueDate = new Date(value);
                    const now = new Date();
                    if (dueDate <= now) {
                        this.showFieldError(field.id, 'A data deve ser futura');
                        return false;
                    }
                }
                break;
        }

        return true;
    }

    /**
     * Mostra erro de campo
     */
    showFieldError(fieldId, message) {
        const field = this.formElement.querySelector(`#${fieldId}`);
        const errorElement = this.formElement.querySelector(`#${fieldId}-error`);

        if (field && errorElement) {
            field.classList.add('task-form__input--error');
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    /**
     * Limpa erro de campo
     */
    clearFieldError(fieldId) {
        const field = this.formElement.querySelector(`#${fieldId}`);
        const errorElement = this.formElement.querySelector(`#${fieldId}-error`);

        if (field && errorElement) {
            field.classList.remove('task-form__input--error');
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    /**
     * Limpa todas as validações
     */
    clearValidation() {
        const errorElements = this.formElement.querySelectorAll('.task-form__error');
        const inputElements = this.formElement.querySelectorAll('.task-form__input, .task-form__textarea');

        errorElements.forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });

        inputElements.forEach(el => {
            el.classList.remove('task-form__input--error');
        });
    }

    /**
     * Mostra feedback visual
     */
    showFeedback(message, type = 'success') {
        const feedbackElement = this.modalElement.querySelector('#task-form-feedback');
        feedbackElement.textContent = message;
        feedbackElement.className = `task-form__feedback task-form__feedback--${type}`;
        feedbackElement.style.display = 'block';

        // Auto-hide após 3 segundos
        setTimeout(() => {
            feedbackElement.style.display = 'none';
        }, 3000);
    }

    /**
     * Sanitiza input contra XSS
     */
    sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    /**
     * Destrói o componente
     */
    destroy() {
        if (this.fabElement) {
            this.fabElement.remove();
            this.fabElement = null;
        }

        if (this.modalElement) {
            this.modalElement.remove();
            this.modalElement = null;
            this.formElement = null;
        }

        this.isOpen = false;
        document.removeEventListener('keydown', this.handleKeydown);
        if (this.originalBodyOverflow) {
            document.body.style.overflow = this.originalBodyOverflow;
            this.originalBodyOverflow = '';
        }

        logger.debug('TaskForm destroyed');
    }
}

// Exportar instância padrão
export const taskForm = new TaskForm();