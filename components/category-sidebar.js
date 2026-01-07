/**
 * Componente Category Sidebar
 * Gerencia a sidebar de categorias com criação, remoção e filtragem
 * @author Lista de Tarefas App
 * @version 1.0.0
 */

import { logger } from '../utils/logger.js';
import { toast } from '../utils/toast-manager.js';
import { STATE_EVENTS } from '../state/app-state.js';
import { isToday, isPast } from '../utils/date-utils.js';

export class CategorySidebar {
    constructor(container) {
        this.container = container;
        // Aguardar AppState estar disponível
        this.initializeAppState();
        this.currentCategory = 'all';
        this.categories = [];

        // Bind métodos
        this.handleCategoryClick = this.handleCategoryClick.bind(this);
        this.handleAddCategory = this.handleAddCategory.bind(this);
        this.handleRemoveCategory = this.handleRemoveCategory.bind(this);

        logger.info('CategorySidebar initialized');
    }

    /**
     * Inicializa o AppState de forma segura
     */
    initializeAppState() {
        if (window.appState) {
            this.appState = window.appState;
        } else {
            logger.warn('AppState not available during CategorySidebar initialization');
            this.appState = null;
            // Tentar novamente após um delay
            setTimeout(() => {
                if (window.appState) {
                    this.appState = window.appState;
                    this.update();
                    logger.info('AppState recovered for CategorySidebar');
                }
            }, 100);
        }
    }

    /**
     * Renderiza a estrutura HTML da sidebar
     */
    render() {
        this.container.innerHTML = `
            <!-- Botão Hamburguer Mobile -->
            <button class="mobile-menu-toggle" id="mobile-menu-toggle" aria-label="Abrir menu de categorias">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            </button>

            <!-- Overlay de fundo -->
            <div class="sidebar-overlay" id="sidebar-overlay"></div>

            <aside class="category-sidebar" id="category-sidebar">
                <div class="category-sidebar__header">
                    <div class="category-sidebar__header-top">
                        <h2 class="category-sidebar__title">Categorias</h2>
                        <button class="mobile-close-btn" id="mobile-close-btn" aria-label="Fechar menu">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <button class="category-sidebar__add-btn" id="add-category-btn">
                        <span class="icon">+</span>
                        Nova Categoria
                    </button>
                </div>

                <!-- Seção de Lembretes -->
                <div class="category-sidebar__reminders">
                    <div class="reminder-section reminder-section--highlighted"
                         id="reminder-today-section"
                         data-due-date-filter="today">
                        <div class="reminder-section__content">
                            <span class="reminder-section__icon">🔔</span>
                            <span class="reminder-section__title">Lembretes de Hoje</span>
                            <span class="reminder-section__count" id="today-reminders-count">0</span>
                        </div>
                    </div>

                    <div class="reminder-section"
                         id="reminder-overdue-section"
                         data-due-date-filter="overdue">
                        <div class="reminder-section__content">
                            <span class="reminder-section__icon">⚠️</span>
                            <span class="reminder-section__title">Vencidas</span>
                            <span class="reminder-section__count" id="overdue-reminders-count">0</span>
                        </div>
                    </div>
                </div>

                <div class="category-sidebar__list" id="category-list">
                    <!-- Categorias serão renderizadas dinamicamente -->
                </div>

                <div class="category-sidebar__footer">
                    <div class="task-summary">
                        <span class="task-summary__total" id="total-tasks">0 tarefas</span>
                        <span class="task-summary__active" id="active-tasks">0 ativas</span>
                    </div>
                </div>
            </aside>
        `;

        this.update();
        this.attachEventListeners();
        this.setupRemindersSection();
        this.setupMobileMenu();
    }

    /**
     * Atualiza a lista de categorias do AppState
     */
    update() {
        if (!this.appState) {
            logger.warn('AppState not available during update, skipping...');
            return;
        }

        try {
            // Obter categorias do estado
            this.categories = this.appState.getCategoriesFromState();
            this.currentCategory = this.appState.getState('filter.category') || 'all';

            // Renderizar categorias
            this.renderCategories();

            // Atualizar contadores
            this.updateCounters();
        } catch (error) {
            logger.error('Error during CategorySidebar update:', error);
        }
    }

    /**
     * Renderiza a lista de categorias
     */
    renderCategories() {
        const categoryList = this.container.querySelector('#category-list');
        if (!categoryList) return;

        // Limpar lista existente antes de renderizar
        categoryList.innerHTML = '';

        // Adicionar opção "Todas"
        const allItem = this.createCategoryItem({
            name: 'all',
            displayName: 'Todas',
            isDefault: true
        });
        categoryList.appendChild(allItem);

        // Renderizar categorias do estado
        this.categories.forEach(category => {
            const item = this.createCategoryItem({
                name: category,
                displayName: category,
                isDefault: category === 'Tarefas'
            });
            categoryList.appendChild(item);
        });
    }

    /**
     * Cria um elemento de categoria
     */
    createCategoryItem(category) {
        const item = document.createElement('div');
        item.className = `category-item ${category.name === this.currentCategory ? 'category-item--active' : ''}`;
        item.dataset.category = category.name;

        const count = this.getTaskCount(category.name);

        item.innerHTML = `
            <div class="category-item__content">
                <span class="category-item__name">${category.displayName}</span>
                <span class="category-item__count">${count}</span>
            </div>
            ${category.name !== 'all' && !category.isDefault ? `
                <button class="category-item__remove-btn" data-category="${category.name}" title="Remover categoria">
                    <span class="icon">×</span>
                </button>
            ` : ''}
        `;

        // Adicionar event listener para clique na categoria
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.category-item__remove-btn')) {
                this.handleCategoryClick(category.name);
            }
        });

        // Adicionar event listener para botão de remover
        const removeBtn = item.querySelector('.category-item__remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleRemoveCategory(category.name);
            });
        }

        return item;
    }

    /**
     * Obtém o contador de tarefas para uma categoria
     */
    getTaskCount(categoryName) {
        if (!this.appState) return 0;

        const tasks = this.appState.getState('tasks') || [];

        if (categoryName === 'all') {
            return tasks.filter(t => !t.completed).length;
        }

        return tasks.filter(t =>
            t.category === categoryName && !t.completed
        ).length;
    }

    /**
     * Atualiza os contadores de tarefas
     */
    updateCounters() {
        if (!this.appState) return;

        const tasks = this.appState.getState('tasks') || [];
        const totalElement = this.container.querySelector('#total-tasks');
        const activeElement = this.container.querySelector('#active-tasks');

        if (totalElement) {
            totalElement.textContent = `${tasks.length} tarefas`;
        }

        if (activeElement) {
            const activeCount = tasks.filter(t => !t.completed).length;
            activeElement.textContent = `${activeCount} ativas`;
        }
    }

    /**
     * Atualiza o destaque da categoria ativa baseado no filtro
     */
    updateActiveFilter() {
        if (!this.appState) return;

        this.currentCategory = this.appState.getState('filter.category') || 'all';

        // Remover destaque de todos os itens
        const items = this.container.querySelectorAll('.category-item');
        items.forEach(item => {
            item.classList.remove('category-item--active');
        });

        // Adicionar destaque ao item ativo
        const activeItem = this.container.querySelector(`[data-category="${this.currentCategory}"]`);
        if (activeItem) {
            activeItem.classList.add('category-item--active');
        }
    }

    /**
     * Adiciona event listeners
     */
    attachEventListeners() {
        const addBtn = this.container.querySelector('#add-category-btn');
        if (addBtn) {
            addBtn.addEventListener('click', this.handleAddCategory);
        }

        // Event listeners para botões de remover
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.category-item__remove-btn')) {
                const categoryName = e.target.closest('.category-item__remove-btn').dataset.category;
                this.handleRemoveCategory(categoryName);
            }
        });
    }

    /**
     * Manipula clique em categoria para filtrar
     */
    handleCategoryClick(categoryName) {
        logger.info('Category clicked', { categoryName });
        this.filterByCategory(categoryName);
    }

    /**
     * Manipula adição de nova categoria
     */
    handleAddCategory() {
        const categoryName = prompt('Nome da nova categoria:');
        if (!categoryName) return;

        // Sanitização XSS - escapar caracteres HTML
        const sanitizedName = this.sanitizeInput(categoryName);
        this.addCategory(sanitizedName);
    }

    /**
     * Sanitiza input para prevenir XSS
     */
    sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    /**
     * Manipula remoção de categoria
     */
    handleRemoveCategory(categoryName) {
        this.removeCategory(categoryName);
    }

    /**
     * Adiciona uma nova categoria
     */
    addCategory(name) {
        // Validar input antes de adicionar
        if (!name || name.trim() === '') {
            this.showError('Nome da categoria não pode estar vazio');
            return;
        }

        // Remover espaços extras e normalizar
        const normalized = name.trim().replace(/\s+/g, ' ');

        if (normalized.length > 30) {
            this.showError('Nome da categoria deve ter no máximo 30 caracteres');
            return;
        }

        // Validação melhor: apenas letras, números, underscores e espaços simples
        if (!/^[a-zA-Z0-9À-ÿ_]+(?:\s[a-zA-Z0-9À-ÿ_]+)*$/.test(normalized)) {
            this.showError('Nome deve conter apenas letras, números e underscores, com espaços simples entre palavras');
            return;
        }

        if (this.categories.includes(normalized)) {
            this.showError('Esta categoria já existe');
            return;
        }

        try {
            // Adicionar ao array de categorias usando nome normalizado
            const newCategories = [...this.categories, normalized];
            this.appState.setState({ categories: newCategories });

            // Disparar evento de categorias alteradas
            this.appState.notifySubscribers(STATE_EVENTS.CATEGORIES_CHANGED, { categories: newCategories });

            this.showSuccess(`Categoria "${normalized}" criada com sucesso`);
            this.update();
        } catch (error) {
            logger.error('Error adding category', error);
            this.showError('Erro ao criar categoria. Tente novamente.');
        }
    }

    /**
     * Remove uma categoria
     */
    removeCategory(name) {
        if (name === 'Tarefas') {
            this.showError('A categoria "Tarefas" não pode ser removida');
            return;
        }

        if (!confirm(`Tem certeza que deseja remover a categoria "${name}"? Tarefas existentes permanecerão.`)) {
            return;
        }

        try {
            // Remover do array de categorias
            const newCategories = this.categories.filter(c => c !== name);
            this.appState.setState({ categories: newCategories });

            // Se o filtro atual era a categoria removida, resetar para 'all'
            if (this.currentCategory === name) {
                this.appState.updateFilter({ category: 'all' });
            }

            // Disparar evento de categorias alteradas
            this.appState.notifySubscribers(STATE_EVENTS.CATEGORIES_CHANGED, { categories: newCategories });

            this.showSuccess(`Categoria "${name}" removida com sucesso`);
            this.update();
        } catch (error) {
            logger.error('Error removing category', error);
            this.showError('Erro ao remover categoria. Tente novamente.');
        }
    }

    /**
     * Filtra tarefas por categoria
     */
    filterByCategory(categoryName) {
        try {
            this.appState.updateFilter({ category: categoryName });
            this.updateActiveFilter();
        } catch (error) {
            logger.error('Error applying filter', error);
            this.showError('Erro ao aplicar filtro. Tente novamente.');
        }
    }

    /**
     * Exibe mensagem de erro
     */
    showError(message) {
        // Usar toast para feedback visual
        toast.error(message);
        logger.error(message);
    }

    /**
     * Exibe mensagem de sucesso
     */
    showSuccess(message) {
        // Usar toast para feedback visual
        toast.success(message);
        logger.info(message);
    }

    /**
     * Configura a seção de lembretes
     */
    setupRemindersSection() {
        // Listener para cliques nas seções de lembrete
        const reminderSections = this.container.querySelectorAll('[data-due-date-filter]');
        reminderSections.forEach(section => {
            section.addEventListener('click', () => {
                const filterType = section.dataset.dueDateFilter;
                this.filterByDueDate(filterType);
            });
        });

        // Listener para atualizar contador (quando tarefas mudam)
        window.addEventListener('reminder:count-update', () => {
            this.updateReminderCounters();
        });

        // Listener para quando tarefas são atualizadas/criadas/deletadas
        window.addEventListener(STATE_EVENTS.TASK_CREATED, () => {
            this.updateReminderCounters();
        });
        window.addEventListener(STATE_EVENTS.TASK_UPDATED, () => {
            this.updateReminderCounters();
        });
        window.addEventListener(STATE_EVENTS.TASK_COMPLETED, () => {
            this.updateReminderCounters();
        });

        // Listener CRÍTICO: Atualizar quando tarefas são carregadas do storage
        window.addEventListener(STATE_EVENTS.TASKS_LOADED, () => {
            logger.info('TASKS_LOADED event received, updating reminder counters...');
            this.updateReminderCounters();
        });

        // Atualizar contadores iniciais
        this.updateReminderCounters();
    }

    /**
     * Filtra tarefas por data de lembrete
     */
    filterByDueDate(filterType) {
        try {
            this.appState.updateFilter({ dueDate: filterType });
            this.updateActiveReminderFilter(filterType);
            logger.info('Due date filter applied', { filterType });
        } catch (error) {
            logger.error('Error applying due date filter', error);
            this.showError('Erro ao aplicar filtro. Tente novamente.');
        }
    }

    /**
     * Atualiza o destaque do filtro de lembrete ativo
     */
    updateActiveReminderFilter(filterType) {
        // Remover destaque de todas as seções de lembrete
        const reminderSections = this.container.querySelectorAll('.reminder-section');
        reminderSections.forEach(section => {
            section.classList.remove('reminder-section--active');
        });

        // Se não for 'all', adicionar destaque à seção ativa
        if (filterType !== 'all') {
            const activeSection = this.container.querySelector(`[data-due-date-filter="${filterType}"]`);
            if (activeSection) {
                activeSection.classList.add('reminder-section--active');
            }
        }
    }

    /**
     * Atualiza os contadores de lembretes
     * Calcula ambos os contadores manualmente para garantir precisão
     */
    updateReminderCounters() {
        if (!this.appState) return;

        const tasks = this.appState.getState('tasks') || [];

        // DEBUG: Log para verificar tarefas
        logger.info('updateReminderCounters called', {
            totalTasks: tasks.length,
            tasksWithDueDate: tasks.filter(t => t.dueDate).length,
            tasksData: tasks.map(t => ({ id: t.id, title: t.title, dueDate: t.dueDate, completed: t.completed }))
        });

        // Calcular contador "Hoje"
        const todayCount = tasks.filter(task =>
            task.dueDate &&
            isToday(task.dueDate) &&
            !task.completed
        ).length;

        const todayCountElement = this.container.querySelector('#today-reminders-count');
        if (todayCountElement) {
            todayCountElement.textContent = todayCount;
        }

        // Calcular contador "Vencidas" (overdue = past and NOT today)
        const overdueCount = tasks.filter(task =>
            task.dueDate &&
            isPast(task.dueDate) &&
            !isToday(task.dueDate) &&
            !task.completed
        ).length;

        logger.info('Reminder counters calculated', {
            today: todayCount,
            overdue: overdueCount
        });

        const overdueCountElement = this.container.querySelector('#overdue-reminders-count');
        if (overdueCountElement) {
            overdueCountElement.textContent = overdueCount;
        }

        // Highlight se houver lembretes hoje
        const todaySection = this.container.querySelector('#reminder-today-section');
        if (todaySection) {
            todaySection.classList.toggle('reminder-section--has-tasks', todayCount > 0);
        }

        // Highlight se houver lembretes vencidos
        const overdueSection = this.container.querySelector('#reminder-overdue-section');
        if (overdueSection) {
            overdueSection.classList.toggle('reminder-section--has-tasks', overdueCount > 0);
        }
    }

    /**
     * Configura o menu mobile com toggle e overlay
     */
    setupMobileMenu() {
        const menuToggle = this.container.querySelector('#mobile-menu-toggle');
        const closeBtn = this.container.querySelector('#mobile-close-btn');
        const overlay = this.container.querySelector('#sidebar-overlay');
        const sidebar = this.container.querySelector('#category-sidebar');

        if (!menuToggle || !closeBtn || !overlay || !sidebar) {
            logger.warn('Mobile menu elements not found');
            return;
        }

        // Toggle sidebar
        const toggleSidebar = () => {
            const isOpen = sidebar.classList.contains('category-sidebar--open');
            if (isOpen) {
                sidebar.classList.remove('category-sidebar--open');
                overlay.classList.remove('sidebar-overlay--active');
                document.body.style.overflow = '';
            } else {
                sidebar.classList.add('category-sidebar--open');
                overlay.classList.add('sidebar-overlay--active');
                document.body.style.overflow = 'hidden';
            }
        };

        // Event listeners
        menuToggle.addEventListener('click', toggleSidebar);
        closeBtn.addEventListener('click', toggleSidebar);
        overlay.addEventListener('click', toggleSidebar);

        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('category-sidebar--open')) {
                toggleSidebar();
            }
        });

        logger.info('Mobile menu setup complete');
    }
}