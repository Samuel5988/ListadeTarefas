/**
 * Task Edit Form Component - Modal para edição de tarefas
 * @author Lista de Tarefas App
 * @version 1.0.0
 */

import { taskStorage } from '../services/task-storage.js';
import { STATE_EVENTS } from '../state/app-state.js';
import { logger } from '../utils/logger.js';

/**
 * Classe para gerenciar o formulário de edição de tarefas
 */
export class TaskEditForm {
    constructor() {
        this.modalElement = null;
        this.formElement = null;
        this.isOpen = false;
        this.currentTaskId = null;
        this.originalBodyOverflow = '';
        this.categories = ['Tarefas']; // Valor inicial padrão

        // Bind de métodos
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
        this.handleBackdropClick = this.handleBackdropClick.bind(this);
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
        const categorySelect = this.formElement.querySelector('#edit-task-category');
        if (categorySelect && this.categories) {
            // Salvar valor atual selecionado
            const currentValue = categorySelect.value;

            // Limpar opções existentes
            categorySelect.innerHTML = '';

            // Adicionar novas opções
            this.categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                categorySelect.appendChild(option);
            });

            // Restaurar valor selecionado se ainda existir
            if (this.categories.includes(currentValue)) {
                categorySelect.value = currentValue;
            }

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
     * Abre o modal de edição com os dados da tarefa
     * @param {string} taskId - ID da tarefa a ser editada
     */
    async open(taskId) {
        try {
            // Carregar categorias do AppState antes de abrir
            await this.loadCategories();

            // Buscar tarefa do storage
            const tasks = await taskStorage.getAll();
            const task = tasks.find(t => t.id === taskId);

            if (!task) {
                logger.error(`Task ${taskId} not found`);
                return;
            }

            this.currentTaskId = taskId;

            // Criar modal se não existir
            if (!this.modalElement) {
                this.createModal();
            }

            // Atualizar o select de categorias com as categorias carregadas
            this.updateCategorySelect();

            // Preencher formulário com dados da tarefa
            this.populateForm(task);

            // Abrir modal
            this.showModal();

            logger.debug('TaskEditForm opened', { taskId });
        } catch (error) {
            logger.error('Error opening edit form:', error);
        }
    }

    /**
     * Cria o modal do formulário de edição
     */
    createModal() {
        // Modal overlay
        this.modalElement = document.createElement('div');
        this.modalElement.className = 'task-edit-form__overlay';
        this.modalElement.setAttribute('role', 'dialog');
        this.modalElement.setAttribute('aria-modal', 'true');
        this.modalElement.setAttribute('aria-label', 'Editar tarefa');
        this.modalElement.style.display = 'none';

        // Modal content
        this.modalElement.innerHTML = `
            <div class="task-edit-form__modal" role="document">
                <div class="task-edit-form__header">
                    <h2 class="task-edit-form__title">Editar Tarefa</h2>
                    <button type="button" class="task-edit-form__close" aria-label="Fechar">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>

                <form class="task-edit-form__form" novalidate>
                    <div class="task-edit-form__field">
                        <label for="edit-task-title" class="task-edit-form__label">Título *</label>
                        <input
                            type="text"
                            id="edit-task-title"
                            name="title"
                            class="task-edit-form__input"
                            placeholder="Ex: Estudar JavaScript"
                            required
                            maxlength="100"
                            autocomplete="off"
                        />
                        <div class="task-edit-form__error" id="edit-task-title-error"></div>
                    </div>

                    <div class="task-edit-form__field">
                        <label for="edit-task-description" class="task-edit-form__label">Descrição</label>
                        <textarea
                            id="edit-task-description"
                            name="description"
                            class="task-edit-form__textarea"
                            placeholder="Adicione detalhes sobre a tarefa..."
                            rows="3"
                            maxlength="500"
                        ></textarea>
                        <div class="task-edit-form__error" id="edit-task-description-error"></div>
                    </div>

                    <div class="task-edit-form__row">
                        <div class="task-edit-form__field">
                            <label for="edit-task-category" class="task-edit-form__label">Categoria</label>
                            <select id="edit-task-category" name="category" class="task-edit-form__select">
                                <!-- Categorias serão carregadas dinamicamente do AppState -->
                            </select>
                        </div>

                        <div class="task-edit-form__field">
                            <label for="edit-task-priority" class="task-edit-form__label">Prioridade</label>
                            <select id="edit-task-priority" name="priority" class="task-edit-form__select">
                                <option value="1">Baixa</option>
                                <option value="3">Média</option>
                                <option value="5">Alta</option>
                            </select>
                        </div>
                    </div>

                    <div class="task-edit-form__field">
                        <label for="edit-task-dueDate" class="task-edit-form__label">Lembrete (opcional)</label>
                        <input
                            type="datetime-local"
                            id="edit-task-dueDate"
                            name="dueDate"
                            class="task-edit-form__input"
                        />
                        <div class="task-edit-form__error" id="edit-task-dueDate-error"></div>
                    </div>

                    <div class="task-edit-form__actions">
                        <button type="button" class="btn btn--secondary task-edit-form__cancel">
                            Cancelar
                        </button>
                        <button type="submit" class="btn btn--primary task-edit-form__submit">
                            <span class="task-edit-form__submit-text">Salvar Alterações</span>
                            <span class="task-edit-form__submit-loading" style="display: none;">
                                <span class="spinner"></span>
                                Salvando...
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Adicionar ao DOM
        document.body.appendChild(this.modalElement);

        // Obter referência do formulário
        this.formElement = this.modalElement.querySelector('.task-edit-form__form');

        // Adicionar event listeners
        this.addEventListeners();

        logger.debug('TaskEditForm modal created');
    }

    /**
     * Preenche o formulário com os dados da tarefa
     * @param {Object} task - Dados da tarefa
     */
    populateForm(task) {
        // Preencher campos
        this.formElement.title.value = task.title || '';
        this.formElement.description.value = task.description || '';
        this.formElement.category.value = task.category || 'Tarefas';

        // Mapear prioridade do formato low/medium/high para o formato 1/3/5 do formulário
        const priorityMapping = {
            'low': '1',
            'medium': '3',
            'high': '5'
        };
        this.formElement.priority.value = priorityMapping[task.priority] || '3';

        // Formatar data para datetime-local
        if (task.dueDate) {
            const date = new Date(task.dueDate);
            const offset = date.getTimezoneOffset();
            date.setMinutes(date.getMinutes() - offset);
            this.formElement.dueDate.value = date.toISOString().slice(0, 16);
        } else {
            this.formElement.dueDate.value = '';
        }
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

        this.modalElement.classList.add('task-edit-form__overlay--open');
        this.isOpen = true;

        // Foco no campo título
        setTimeout(() => {
            this.formElement.title.focus();
        }, 100);
    }

    /**
     * Esconde o modal com animação
     */
    hideModal() {
        if (!this.isOpen) return;

        this.modalElement.classList.remove('task-edit-form__overlay--open');

        setTimeout(() => {
            this.modalElement.style.display = 'none';
            document.body.style.overflow = this.originalBodyOverflow;
            this.isOpen = false;
            this.currentTaskId = null;
        }, 200);
    }

    /**
     * Adiciona os event listeners
     */
    addEventListeners() {
        // Submit do formulário
        this.formElement.addEventListener('submit', this.handleSubmit);

        // Botão cancelar
        this.cancelButton = this.modalElement.querySelector('.task-edit-form__cancel');
        this.cancelButton.addEventListener('click', () => this.close());

        // Botão fechar
        this.closeButton = this.modalElement.querySelector('.task-edit-form__close');
        this.closeButton.addEventListener('click', () => this.close());

        // Escape para fechar
        document.addEventListener('keydown', this.handleKeydown);

        // Click no backdrop para fechar
        this.modalElement.addEventListener('click', this.handleBackdropClick);
    }

    /**
     * Manipula o submit do formulário
     */
    async handleSubmit(event) {
        event.preventDefault();

        if (!this.validateForm()) {
            return;
        }

        try {
            // Mostrar loading
            this.setLoading(true);

            // Coletar dados do formulário
            const formData = new FormData(this.formElement);

            // Mapear prioridade do formato 1/3/5 para o formato low/medium/high do storage
            const priorityMapping = {
                '1': 'low',
                '3': 'medium',
                '5': 'high'
            };

            const updateData = {
                title: formData.get('title').trim(),
                description: formData.get('description').trim(),
                category: formData.get('category'),
                priority: priorityMapping[formData.get('priority')] || 'medium',
                dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate')).toISOString() : null,
                modified: new Date().toISOString()
            };

            // Atualizar tarefa no storage mantendo ID original
            const updatedTask = await taskStorage.update(this.currentTaskId, updateData);

            if (updatedTask) {
                // Disparar evento de atualização com taskId
                window.dispatchEvent(new CustomEvent(STATE_EVENTS.TASK_UPDATED, {
                    detail: { taskId: this.currentTaskId, task: updatedTask }
                }));

                // Fechar modal
                this.close();

                logger.info('Task updated successfully', { taskId: this.currentTaskId });
            } else {
                throw new Error('Failed to update task');
            }

        } catch (error) {
            logger.error('Error updating task:', error);
            this.showError('Erro ao atualizar tarefa. Tente novamente.');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Valida o formulário
     */
    validateForm() {
        let isValid = true;

        // Limpar errors anteriores
        this.clearErrors();

        // Validar título (obrigatório)
        const title = this.formElement.title.value.trim();
        if (!title) {
            this.showFieldError('title', 'O título é obrigatório');
            isValid = false;
        } else if (title.length > 100) {
            this.showFieldError('title', 'O título deve ter no máximo 100 caracteres');
            isValid = false;
        }

        // Validar descrição
        const description = this.formElement.description.value.trim();
        if (description.length > 500) {
            this.showFieldError('description', 'A descrição deve ter no máximo 500 caracteres');
            isValid = false;
        }

        // Validar data se preenchida
        const dueDate = this.formElement.dueDate.value;
        if (dueDate) {
            const date = new Date(dueDate);
            if (isNaN(date.getTime())) {
                this.showFieldError('dueDate', 'Data inválida');
                isValid = false;
            } else if (date < new Date()) {
                this.showFieldError('dueDate', 'A data deve ser futura');
                isValid = false;
            }
        }

        return isValid;
    }

    /**
     * Mostra erro de campo específico
     */
    showFieldError(fieldName, message) {
        const errorElement = this.modalElement.querySelector(`#edit-task-${fieldName}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            this.formElement[fieldName].classList.add('task-edit-form__input--error');
        }
    }

    /**
     * Limpa todos os erros
     */
    clearErrors() {
        const errorElements = this.modalElement.querySelectorAll('.task-edit-form__error');
        errorElements.forEach(el => el.textContent = '');

        const inputs = this.modalElement.querySelectorAll('.task-edit-form__input, .task-edit-form__textarea');
        inputs.forEach(input => input.classList.remove('task-edit-form__input--error'));
    }

    /**
     * Mostra mensagem de erro geral
     */
    showError(message) {
        // Criar toast de erro
        const toast = document.createElement('div');
        toast.className = 'toast toast--error';
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.zIndex = '9999';

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    /**
     * Define estado de loading
     */
    setLoading(loading) {
        const submitButton = this.modalElement.querySelector('.task-edit-form__submit');
        const submitText = submitButton.querySelector('.task-edit-form__submit-text');
        const submitLoading = submitButton.querySelector('.task-edit-form__submit-loading');

        if (loading) {
            submitButton.disabled = true;
            submitText.style.display = 'none';
            submitLoading.style.display = 'inline-flex';
        } else {
            submitButton.disabled = false;
            submitText.style.display = 'inline';
            submitLoading.style.display = 'none';
        }
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
        this.clearErrors();
        // Limpar formulário para evitar cache
        if (this.formElement) {
            this.formElement.reset();
        }
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

        logger.debug('TaskEditForm destroyed');
    }
}