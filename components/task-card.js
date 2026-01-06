/**
 * Task Card Component - Componente visual para exibir tarefas individuais
 * @author Lista de Tarefas App
 * @version 1.0.0
 */

import { taskStorage } from '../services/task-storage.js';
import { STATE_EVENTS } from '../state/app-state.js';
import { logger } from '../utils/logger.js';
import { formatDateWithLabel, isToday, isTomorrow, isPast } from '../utils/date-utils.js';

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
            ...Object.values(PRIORITY_CLASSES)
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
        this.contentWrapper = document.createElement('div');
        this.contentWrapper.className = 'task-card__content-wrapper';

        // Criar checkbox
        this.createCheckbox(this.contentWrapper);

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

        // Criar exibição de data de lembrete (se existir)
        if (this.task.dueDate) {
            this.createDueDateDisplay(mainContent);
        }

        this.contentWrapper.appendChild(mainContent);

        // Adicionar contentWrapper ao DOM PRIMEIRO
        this.element.appendChild(this.contentWrapper);

        // CRIAR PRIORITY INDICATOR DEPOIS (agora contentWrapper já é filho de this.element)
        this.createPriorityIndicator();

        // Criar menu de ações
        this.createActionMenu();
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
     * Cria exibição da data de lembrete
     * @param {HTMLElement} parent - Elemento pai onde será inserido
     */
    createDueDateDisplay(parent) {
        const dueDateContainer = document.createElement('div');
        dueDateContainer.className = 'task-card__due-date';

        // Aplicar classes de estado
        if (isToday(this.task.dueDate)) {
            dueDateContainer.classList.add('task-card__due-date--today');
        } else if (isTomorrow(this.task.dueDate)) {
            dueDateContainer.classList.add('task-card__due-date--tomorrow');
        } else if (isPast(this.task.dueDate)) {
            dueDateContainer.classList.add('task-card__due-date--past');
        }

        // Ícone de calendário
        dueDateContainer.innerHTML = `
            <svg class="task-card__due-date-icon" width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                <path d="M16 2v6M8 2v6M3 10h18" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span class="task-card__due-date-text">${formatDateWithLabel(this.task.dueDate)}</span>
        `;

        parent.appendChild(dueDateContainer);
    }

    /**
     * Cria o indicador de prioridade clicável (borda esquerda)
     */
    createPriorityIndicator() {
        const priorityIndicator = document.createElement('div');
        priorityIndicator.className = 'task-card__priority-indicator';

        // CORREÇÃO: Adicionar cor inline imediatamente para garantir que apareça no carregamento
        const priorityColor = PRIORITY_COLORS[this.task.priority] || PRIORITY_COLORS.medium;
        priorityIndicator.style.backgroundColor = priorityColor;

        priorityIndicator.setAttribute('role', 'button');
        priorityIndicator.setAttribute('aria-label', `Prioridade ${this.getPriorityLabel(this.task.priority)}, clique para alterar para ${this.getNextPriorityLabel(this.task.priority)}`);
        priorityIndicator.setAttribute('title', `Clique para alterar prioridade (atual: ${this.getPriorityLabel(this.task.priority)})`);

        // Adicionar tooltip visual no hover
        priorityIndicator.addEventListener('mouseenter', () => {
            priorityIndicator.setAttribute('title', `Clique para: ${this.getNextPriorityLabel(this.task.priority)}`);
        });

        // Click handler para ciclar prioridade
        const handlePriorityClick = (e) => {
            e.stopPropagation(); // Prevenir outros eventos do card
            e.preventDefault(); // Prevenir comportamento padrão em touch
            this.cyclePriority();
        };

        // Suporta tanto mouse click quanto touch/pointer events
        priorityIndicator.addEventListener('click', handlePriorityClick);
        priorityIndicator.addEventListener('pointerdown', (e) => {
            // Melhor responsividade em dispositivos touch
            if (e.pointerType === 'touch') {
                handlePriorityClick(e);
            }
        });

        // Inserir antes do conteúdo
        this.element.insertBefore(priorityIndicator, this.contentWrapper);

        // Adicionar classe ao card para remover borda padrão
        this.element.classList.add('task-card--with-priority-indicator');
    }

    /**
     * Cicla entre prioridades: low → medium → high → low
     * @returns {Promise<string>} Nova prioridade aplicada
     */
    async cyclePriority() {
        const priorityCycle = {
            'low': 'medium',
            'medium': 'high',
            'high': 'low'
        };

        const currentPriority = this.task.priority || 'medium';
        const newPriority = priorityCycle[currentPriority] || 'medium';

        try {
            // Atualizar no storage
            const updatedTask = await taskStorage.update(this.task.id, {
                priority: newPriority
            });

            if (updatedTask) {
                // Atualizar dados locais
                const oldPriority = this.task.priority;
                this.task = updatedTask;

                // Atualizar UI
                this.updatePriorityUI(oldPriority, newPriority);

                // Disparar evento para AppState
                this.dispatch('task:priority-changed', {
                    taskId: this.task.id,
                    oldPriority,
                    newPriority
                });

                logger.info('Task priority cycled', {
                    taskId: this.task.id,
                    oldPriority,
                    newPriority
                });

                return newPriority;
            }
        } catch (error) {
            logger.error('Failed to cycle task priority:', error);
            console.error('Failed to cycle task priority:', error);
            throw error;
        }
    }

    /**
     * Atualiza apenas a UI de prioridade com transição suave
     * @param {string} oldPriority - Prioridade anterior
     * @param {string} newPriority - Nova prioridade
     */
    updatePriorityUI(oldPriority, newPriority) {
        if (!this.element) return;

        // Remover classe antiga com transição
        const oldClass = PRIORITY_CLASSES[oldPriority];
        const newClass = PRIORITY_CLASSES[newPriority];

        if (oldClass) {
            this.element.classList.remove(oldClass);
        }

        if (newClass) {
            this.element.classList.add(newClass);
        }

        // Atualizar aria-label do indicador com próxima prioridade
        const priorityIndicator = this.element.querySelector('.task-card__priority-indicator');
        if (priorityIndicator) {
            const currentLabel = this.getPriorityLabel(newPriority);
            const nextLabel = this.getNextPriorityLabel(newPriority);
            priorityIndicator.setAttribute('aria-label', `Prioridade ${currentLabel}, clique para alterar para ${nextLabel}`);
            priorityIndicator.setAttribute('title', `Clique para alterar prioridade (atual: ${currentLabel})`);

            // CORREÇÃO: Atualizar cor inline imediatamente
            const newColor = PRIORITY_COLORS[newPriority] || PRIORITY_COLORS.medium;
            priorityIndicator.style.backgroundColor = newColor;
        }
    }

    /**
     * Retorna label amigável da prioridade
     * @param {string} priority - Valor da prioridade
     * @returns {string} Label em português
     */
    getPriorityLabel(priority) {
        const labels = {
            'low': 'Baixa',
            'medium': 'Média',
            'high': 'Alta'
        };
        return labels[priority] || 'Média';
    }

    /**
     * Retorna label da próxima prioridade no ciclo
     * @param {string} currentPriority - Prioridade atual
     * @returns {string} Label da próxima prioridade
     */
    getNextPriorityLabel(currentPriority) {
        const nextPriority = {
            'low': 'Média',
            'medium': 'Alta',
            'high': 'Baixa'
        };
        return nextPriority[currentPriority] || 'Média';
    }

    /**
     * Cria o menu de ações do card
     */
    createActionMenu() {
        // Container das ações
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'task-card__actions';

        // Botão do menu (três pontos)
        const menuButton = document.createElement('button');
        menuButton.className = 'task-card__menu-button';
        menuButton.setAttribute('data-task-id', this.task.id);
        menuButton.setAttribute('aria-label', 'Menu de ações');
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.innerHTML = `
            <span class="task-card__menu-dots"></span>
            <span class="task-card__menu-dots"></span>
            <span class="task-card__menu-dots"></span>
        `;

        // Dropdown menu
        const menu = document.createElement('div');
        menu.className = 'task-card__menu';
        menu.setAttribute('data-task-id', this.task.id);
        menu.innerHTML = `
            <button class="task-card__menu-item task-card__menu-item--edit"
                    data-task-id="${this.task.id}"
                    type="button">
                <svg class="task-card__menu-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Editar
            </button>
            <button class="task-card__menu-item task-card__menu-item--delete"
                    data-task-id="${this.task.id}"
                    type="button">
                <svg class="task-card__menu-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Remover
            </button>
        `;

        actionsContainer.appendChild(menuButton);
        actionsContainer.appendChild(menu);
        this.contentWrapper.appendChild(actionsContainer);

        // Adicionar listener para toggle do menu
        menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });
    }

    /**
     * Adiciona os event listeners necessários
     */
    addEventListeners() {
        if (!this.element) return;

        // Listener para checkbox com stopPropagation para prevenir duplo toggle
        this.checkboxElement.addEventListener('change', this.handleCheckboxChange);

        // Listener para clique no checkbox para prevenir bubbling para o card
        this.checkboxElement.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevenir que click chegue no card listener
        });

        // Listeners para hover
        this.element.addEventListener('mouseenter', this.handleMouseEnter);
        this.element.addEventListener('mouseleave', this.handleMouseLeave);

        // Listener para clique no card (exceto checkbox, menu E priority indicator)
        this.element.addEventListener('click', (e) => {
            const menuButton = this.element.querySelector('.task-card__menu-button');
            const menu = this.element.querySelector('.task-card__menu');
            const priorityIndicator = this.element.querySelector('.task-card__priority-indicator');

            if (e.target !== this.checkboxElement &&
                !this.checkboxElement.contains(e.target) &&
                e.target !== menuButton &&
                !menuButton.contains(e.target) &&
                e.target !== menu &&
                !menu.contains(e.target) &&
                e.target !== priorityIndicator &&
                !priorityIndicator?.contains(e.target)) {
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
     * Alterna a visibilidade do menu de ações
     */
    toggleMenu() {
        const menu = this.element.querySelector('.task-card__menu');
        const menuButton = this.element.querySelector('.task-card__menu-button');

        if (!menu || !menuButton) return;

        // Fechar outros menus primeiro
        TaskCard.closeAllMenus();

        // Toggle do menu atual
        const isOpen = menu.classList.contains('task-card__menu--open');

        if (!isOpen) {
            menu.classList.add('task-card__menu--open');
            menuButton.setAttribute('aria-expanded', 'true');
        } else {
            menu.classList.remove('task-card__menu--open');
            menuButton.setAttribute('aria-expanded', 'false');
        }
    }

    /**
     * Fecha o menu de ações
     */
    closeMenu() {
        const menu = this.element.querySelector('.task-card__menu');
        const menuButton = this.element.querySelector('.task-card__menu-button');

        if (menu && menuButton) {
            menu.classList.remove('task-card__menu--open');
            menuButton.setAttribute('aria-expanded', 'false');
        }
    }

    /**
     * Fecha todos os menus de ações na página
     */
    static closeAllMenus() {
        document.querySelectorAll('.task-card__menu--open').forEach(menu => {
            menu.classList.remove('task-card__menu--open');
        });
        document.querySelectorAll('.task-card__menu-button').forEach(button => {
            button.setAttribute('aria-expanded', 'false');
        });
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