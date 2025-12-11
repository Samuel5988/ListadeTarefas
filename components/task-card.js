/**
 * Task Card Component - Componente visual para exibir tarefas individuais
 * @author Lista de Tarefas App
 * @version 1.0.0
 */

import { taskStorage } from '../services/task-storage.js';
import { STATE_EVENTS } from '../state/app-state.js';
import { logger } from '../utils/logger.js';

/**
 * Mapeamento de prioridades para cores (conforme UX specification)
 */
const PRIORITY_COLORS = {
    high: '#dc3545',    // Vermelho
    medium: '#ffc107',  // Amarelo
    low: '#28a745'      // Verde
};

/**
 * Mapeamento de prioridades para classes CSS
 */
const PRIORITY_CLASSES = {
    high: 'task-card--priority-high',
    medium: 'task-card--priority-medium',
    low: 'task-card--priority-low'
};

/**
 * Classe TaskCard - Representa uma tarefa como um card visual
 */
export class TaskCard {
    /**
     * Cria uma instância de TaskCard
     * @param {Object} taskData - Dados da tarefa
     * @param {HTMLElement} container - Container onde o card será inserido
     */
    constructor(taskData, container) {
        if (!taskData || !taskData.id) {
            throw new Error('TaskCard requires valid task data with id');
        }

        this.task = taskData;
        this.container = container;
        this.element = null;
        this.checkboxElement = null;
        this.titleElement = null;
        this.descriptionElement = null;
        this.categoryBadgeElement = null;

        // Bind de métodos para manter contexto
        this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
        this.handleMouseEnter = this.handleMouseEnter.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);

        logger.debug('TaskCard created', { taskId: this.task.id });
    }

    /**
     * Renderiza o componente no DOM
     * @returns {HTMLElement} Elemento DOM do card
     */
    render() {
        // Criar elemento principal do card
        this.element = document.createElement('div');
        this.element.className = 'task-card';
        this.element.dataset.taskId = this.task.id;

        // Aplicar classes de estado e prioridade
        this.applyStateClasses();

        // Criar estrutura interna do card
        this.createCardStructure();

        // Adicionar event listeners
        this.addEventListeners();

        // Inserir no container
        if (this.container) {
            this.container.appendChild(this.element);
        }

        logger.debug('TaskCard rendered', { taskId: this.task.id });
        return this.element;
    }

    /**
     * Aplica classes CSS baseadas no estado da tarefa
     */
    applyStateClasses() {
        if (!this.element) return;

        // Remover classes de estado
        this.element.classList.remove(
            'task-card--completed',
            'task-card--not-completed',
            Object.values(PRIORITY_CLASSES)
        );

        // Adicionar classe de conclusão
        if (this.task.completed) {
            this.element.classList.add('task-card--completed');
            this.element.style.opacity = '0.6';
        } else {
            this.element.classList.add('task-card--not-completed');
            this.element.style.opacity = '1';
        }

        // Adicionar classe de prioridade
        const priorityClass = PRIORITY_CLASSES[this.task.priority] || PRIORITY_CLASSES.medium;
        this.element.classList.add(priorityClass);
    }

    /**
     * Cria a estrutura interna do card
     */
    createCardStructure() {
        // Container do checkbox e conteúdo
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'task-card__content-wrapper';

        // Criar checkbox
        this.createCheckbox(contentWrapper);

        // Criar conteúdo principal
        const mainContent = document.createElement('div');
        mainContent.className = 'task-card__main-content';

        // Criar título
        this.createTitle(mainContent);

        // Criar descrição (se existir)
        if (this.task.description) {
            this.createDescription(mainContent);
        }

        // Criar badge de categoria (se aplicável)
        if (this.task.category && this.task.category !== 'Tarefas') {
            this.createCategoryBadge(mainContent);
        }

        contentWrapper.appendChild(mainContent);
        this.element.appendChild(contentWrapper);
    }

    /**
     * Cria o checkbox circular
     * @param {HTMLElement} parent - Elemento pai onde será inserido
     */
    createCheckbox(parent) {
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'task-card__checkbox-container';

        this.checkboxElement = document.createElement('input');
        this.checkboxElement.type = 'checkbox';
        this.checkboxElement.className = 'task-card__checkbox task-card__checkbox--circular';
        this.checkboxElement.checked = this.task.completed;
        this.checkboxElement.setAttribute('aria-label', 'Marcar tarefa como concluída');

        checkboxContainer.appendChild(this.checkboxElement);
        parent.appendChild(checkboxContainer);
    }

    /**
     * Cria o elemento de título
     * @param {HTMLElement} parent - Elemento pai onde será inserido
     */
    createTitle(parent) {
        this.titleElement = document.createElement('h3');
        this.titleElement.className = 'task-card__title';
        this.titleElement.textContent = this.task.title;

        if (this.task.completed) {
            this.titleElement.style.textDecoration = 'line-through';
        }

        parent.appendChild(this.titleElement);
    }

    /**
     * Cria o elemento de descrição
     * @param {HTMLElement} parent - Elemento pai onde será inserido
     */
    createDescription(parent) {
        this.descriptionElement = document.createElement('p');
        this.descriptionElement.className = 'task-card__description';
        this.descriptionElement.textContent = this.task.description;
        parent.appendChild(this.descriptionElement);
    }

    /**
     * Cria o badge de categoria
     * @param {HTMLElement} parent - Elemento pai onde será inserido
     */
    createCategoryBadge(parent) {
        this.categoryBadgeElement = document.createElement('span');
        this.categoryBadgeElement.className = 'task-card__category-badge';
        this.categoryBadgeElement.textContent = this.task.category;
        parent.appendChild(this.categoryBadgeElement);
    }

    /**
     * Adiciona os event listeners necessários
     */
    addEventListeners() {
        if (!this.element) return;

        // Listener para checkbox
        this.checkboxElement.addEventListener('change', this.handleCheckboxChange);

        // Listeners para hover
        this.element.addEventListener('mouseenter', this.handleMouseEnter);
        this.element.addEventListener('mouseleave', this.handleMouseLeave);

        // Listener para clique no card (exceto checkbox)
        this.element.addEventListener('click', (e) => {
            if (e.target !== this.checkboxElement &&
                !this.checkboxElement.contains(e.target)) {
                this.handleCardClick();
            }
        });

        // Listener para clique duplo (exclusão)
        this.element.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.dispatch('task:delete', { taskId: this.task.id });
        });
    }

    /**
     * Manipula mudança no checkbox
     * @param {Event} event - Evento de change
     */
    async handleCheckboxChange(event) {
        event.stopPropagation();
        await this.toggleComplete();
    }

    /**
     * Manipula entrada do mouse (hover)
     */
    handleMouseEnter() {
        if (!this.element) return;

        // Usar requestAnimationFrame para animação suave
        requestAnimationFrame(() => {
            this.element.style.transform = 'translateX(4px)';
            this.element.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        });
    }

    /**
     * Manipula saída do mouse (hover end)
     */
    handleMouseLeave() {
        if (!this.element) return;

        requestAnimationFrame(() => {
            this.element.style.transform = 'translateX(0)';
            this.element.style.boxShadow = 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1))';
        });
    }

    /**
     * Manipula clique no card
     */
    handleCardClick() {
        // Toggle completion também pode ser feito clicando no card
        this.toggleComplete();
    }

    /**
     * Alterna o estado de conclusão da tarefa
     */
    async toggleComplete() {
        try {
            const newCompletedState = !this.task.completed;

            // Atualizar no storage
            const updatedTask = await taskStorage.update(this.task.id, {
                completed: newCompletedState
            });

            if (updatedTask) {
                // Atualizar dados locais
                this.task = updatedTask;

                // Atualizar UI
                this.updateUI();

                // Disparar evento para AppState
                this.dispatch('task:toggle', { taskId: this.task.id });

                logger.info('Task completion toggled', {
                    taskId: this.task.id,
                    completed: newCompletedState
                });
            }
        } catch (error) {
            logger.error('Failed to toggle task completion:', error);
            console.error('Failed to toggle task completion:', error);
        }
    }

    /**
     * Atualiza a interface do usuário
     */
    updateUI() {
        // Atualizar checkbox
        if (this.checkboxElement) {
            this.checkboxElement.checked = this.task.completed;
        }

        // Atualizar classes e estilos
        this.applyStateClasses();

        // Atualizar título
        if (this.titleElement) {
            if (this.task.completed) {
                this.titleElement.style.textDecoration = 'strike-through';
            } else {
                this.titleElement.style.textDecoration = 'none';
            }
        }
    }

    /**
     * Dispara evento customizado
     * @param {string} eventName - Nome do evento
     * @param {Object} detail - Detalhes do evento
     */
    dispatch(eventName, detail) {
        if (this.element) {
            const event = new CustomEvent(eventName, {
                bubbles: true,
                detail
            });
            this.element.dispatchEvent(event);
        }
    }

    /**
     * Atualiza os dados da tarefa e re-renderiza se necessário
     * @param {Object} newTaskData - Novos dados da tarefa
     */
    update(newTaskData) {
        this.task = { ...this.task, ...newTaskData };

        if (this.element) {
            this.updateUI();
        } else {
            this.render();
        }

        logger.debug('TaskCard updated', { taskId: this.task.id });
    }

    /**
     * Remove o card do DOM e limpa referências
     */
    destroy() {
        if (this.element && this.container) {
            this.container.removeChild(this.element);
        }

        // Remover event listeners
        if (this.checkboxElement) {
            this.checkboxElement.removeEventListener('change', this.handleCheckboxChange);
        }

        if (this.element) {
            this.element.removeEventListener('mouseenter', this.handleMouseEnter);
            this.element.removeEventListener('mouseleave', this.handleMouseLeave);
        }

        // Limpar referências
        this.task = null;
        this.container = null;
        this.element = null;
        this.checkboxElement = null;
        this.titleElement = null;
        this.descriptionElement = null;
        this.categoryBadgeElement = null;

        logger.debug('TaskCard destroyed');
    }
}

/**
 * Função factory para criar múltiplos TaskCards
 * @param {Array} tasks - Lista de tarefas
 * @param {HTMLElement} container - Container para os cards
 * @returns {Array} Lista de instâncias TaskCard
 */
export function createTaskCards(tasks, container) {
    if (!Array.isArray(tasks) || !container) {
        return [];
    }

    return tasks.map(taskData => {
        try {
            const taskCard = new TaskCard(taskData, container);
            taskCard.render();
            return taskCard;
        } catch (error) {
            logger.error('Failed to create TaskCard:', error);
            return null;
        }
    }).filter(Boolean);
}