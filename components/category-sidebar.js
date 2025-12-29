/**
 * Componente Category Sidebar
 * Gerencia a sidebar de categorias com criação, remoção e filtragem
 * @author Lista de Tarefas App
 * @version 1.0.0
 */

import { logger } from '../utils/logger.js';
import { toast } from '../utils/toast-manager.js';
import { STATE_EVENTS } from '../state/app-state.js';

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
            <aside class="category-sidebar">
                <div class="category-sidebar__header">
                    <h2 class="category-sidebar__title">Categorias</h2>
                    <button class="category-sidebar__add-btn" id="add-category-btn">
                        <span class="icon">+</span>
                        Nova Categoria
                    </button>
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
}