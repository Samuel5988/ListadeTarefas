/**
 * Lista de Tarefas - Aplicativo Principal
 * Ponto de entrada e orquestrador da aplicação
 * @author Lista de Tarefas App
 * @version 1.0.0
 */

import { logger } from './utils/logger.js';
import { appState, STATE_EVENTS } from './state/app-state.js';
import { taskStorage } from './services/task-storage.js';
import { ThemeManager } from './components/theme-manager.js';

/**
 * Classe principal da aplicação
 */
class TaskApp {
    constructor() {
        this.initialized = false;
        this.components = new Map();
        this.eventListeners = new Map();
        this.themeManager = null;

        // Bind métodos
        this.handleDOMLoaded = this.handleDOMLoaded.bind(this);
        this.handleError = this.handleError.bind(this);
        this.handleTaskEvents = this.handleTaskEvents.bind(this);

        // Inicialização
        this.initialize();
    }

    /**
     * Inicializa a aplicação
     */
    async initialize() {
        try {
            logger.info('Initializing Task App...');

            // Configurar tratamento global de erros
            this.setupErrorHandling();

            // Aguardar DOM estar pronto
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', this.handleDOMLoaded);
            } else {
                await this.handleDOMLoaded();
            }

            logger.info('Task App initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Task App', error);
            this.showError('Erro ao inicializar aplicação. Tente recarregar a página.');
        }
    }

    /**
     * Configura tratamento global de erros
     */
    setupErrorHandling() {
        // Capturar erros não tratados
        window.addEventListener('error', this.handleError);

        // Capturar rejeições de Promise não tratadas
        window.addEventListener('unhandledrejection', (event) => {
            logger.error('Unhandled promise rejection', {
                reason: event.reason,
                promise: event.promise
            });
            event.preventDefault();
        });
    }

    /**
     * Manipula carregamento do DOM
     */
    async handleDOMLoaded() {
        try {
            logger.info('DOM loaded, setting up application...');

            // Aguardar estado estar inicializado
            await this.waitForStateInitialization();

            // Carregar tarefas do storage
            await this.loadTasks();

            // Configurar UI inicial
            this.setupInitialUI();

            // Adicionar event listeners globais
            this.addGlobalEventListeners();

            // Exibir UI
            this.showApp();

            // Marcar como inicializado
            this.initialized = true;

            logger.info('Application ready');
        } catch (error) {
            logger.error('Failed to setup application', error);
            this.showError('Erro ao configurar aplicação. Tente recarregar a página.');
        }
    }

    /**
     * Aguarda inicialização do estado
     */
    async waitForStateInitialization() {
        const maxWait = 5000; // 5 segundos
        const startTime = Date.now();

        while (!appState.initialized && (Date.now() - startTime) < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (!appState.initialized) {
            throw new Error('State initialization timeout');
        }
    }

    /**
     * Carrega tarefas do storage
     */
    async loadTasks() {
        try {
            logger.info('Loading tasks from storage...');
            const tasks = await taskStorage.getAll();

            if (tasks.length > 0) {
                appState.updateTasks(tasks);
                logger.info(`Loaded ${tasks.length} tasks`);
            } else {
                logger.info('No tasks found, starting with empty list');
            }
        } catch (error) {
            logger.error('Failed to load tasks', error);
            // Continuar com estado vazio
        }
    }

    /**
     * Configura UI inicial
     */
    setupInitialUI() {
        // Adicionar classe ao body para estilização
        document.body.classList.add('app-initialized');

        // Configurar tema
        const theme = appState.getState('ui.theme');
        document.documentElement.setAttribute('data-theme', theme);

        // Inicializar ThemeManager
        this.initializeThemeManager();

        // Esconder mensagem de carregamento se existir
        const loadingEl = document.querySelector('.loading-message');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }

    /**
     * Inicializa o ThemeManager
     */
    initializeThemeManager() {
        try {
            logger.info('Initializing ThemeManager...');

            // Criar instância do ThemeManager
            this.themeManager = new ThemeManager(appState);

            // Adicionar botão ao container no header
            const toggleContainer = document.getElementById('theme-toggle-container');
            if (toggleContainer && this.themeManager.getToggleElement()) {
                toggleContainer.appendChild(this.themeManager.getToggleElement());
                logger.info('Theme toggle button added to header');
            }

            // Armazenar referência
            this.components.set('themeManager', this.themeManager);

            logger.info('ThemeManager initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize ThemeManager', error);
        }
    }

    /**
     * Adiciona event listeners globais
     */
    addGlobalEventListeners() {
        // Eventos de estado
        window.addEventListener(STATE_EVENTS.TASK_CREATED, this.handleTaskEvents);
        window.addEventListener(STATE_EVENTS.TASK_UPDATED, this.handleTaskEvents);
        window.addEventListener(STATE_EVENTS.TASK_DELETED, this.handleTaskEvents);
        window.addEventListener(STATE_EVENTS.TASK_COMPLETED, this.handleTaskEvents);
        window.addEventListener(STATE_EVENTS.THEME_CHANGED, this.handleThemeChange);

        // Eventos de storage (para sincronização entre abas)
        window.addEventListener('storage', (e) => {
            if (e.key === taskStorage.config.key) {
                logger.info('Storage changed in another tab, reloading...');
                this.loadTasks();
            }
        });

        // Eventos de visibilidade da página
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                logger.debug('Page became visible, checking for updates...');
                this.loadTasks();
            }
        });

        // Atalhos de teclado
        document.addEventListener('keydown', this.handleKeyboardShortcuts);
    }

    /**
     * Manipula eventos de tarefas
     * @param {CustomEvent} event - Evento customizado
     */
    handleTaskEvents(event) {
        logger.debug('Task event received', {
            type: event.type,
            detail: event.detail
        });

        // Aqui futuramente atualizaremos a UI
        // Por enquanto, apenas logamos
        switch (event.type) {
            case STATE_EVENTS.TASK_CREATED:
                this.showNotification('Tarefa criada com sucesso', 'success');
                break;
            case STATE_EVENTS.TASK_COMPLETED:
                this.showNotification('Tarefa concluída!', 'success');
                break;
            case STATE_EVENTS.TASK_DELETED:
                this.showNotification('Tarefa removida', 'info');
                break;
        }
    }

    /**
     * Manipula mudança de tema
     * @param {CustomEvent} event - Evento de mudança de tema
     */
    handleThemeChange(event) {
        const theme = event.detail;
        document.documentElement.setAttribute('data-theme', theme);

        logger.info('Theme changed', { theme });
    }

    /**
     * Manipula atalhos de teclado
     * @param {KeyboardEvent} event - Evento de teclado
     */
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + K para busca rápida (futuro)
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            logger.debug('Quick search shortcut triggered');
            // Implementar busca rápida
        }

        // Ctrl/Cmd + N para nova tarefa (futuro)
        if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
            event.preventDefault();
            logger.debug('New task shortcut triggered');
            // Implementar criação rápida de tarefa
        }

        // Esc para fechar modais (futuro)
        if (event.key === 'Escape') {
            logger.debug('Escape key pressed');
            // Implementar fechamento de modais
        }
    }

    /**
     * Manipula erros globais
     * @param {ErrorEvent} event - Evento de erro
     */
    handleError(event) {
        logger.error('Global error caught', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
        });

        // Mostrar erro amigável para o usuário
        this.showError('Ocorreu um erro inesperado. Tente recarregar a página.');
    }

    /**
     * Exibe a aplicação
     */
    showApp() {
        // Remover classe de loading se existir
        document.body.classList.remove('loading');

        // Adicionar classe de pronto
        document.body.classList.add('app-ready');

        // Animar entrada dos elementos
        this.animateEntrance();
    }

    /**
     * Anima a entrada dos elementos
     */
    animateEntrance() {
        const elements = document.querySelectorAll('.card, header, footer');
        elements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('fade-in');
            }, index * 50);
        });
    }

    /**
     * Exibe mensagem de erro
     * @param {string} message - Mensagem de erro
     */
    showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        errorEl.textContent = message;

        document.body.appendChild(errorEl);

        // Remover após 5 segundos
        setTimeout(() => {
            errorEl.remove();
        }, 5000);
    }

    /**
     * Exibe notificação
     * @param {string} message - Mensagem
     * @param {string} type - Tipo (success, info, warning, error)
     */
    showNotification(message, type = 'info') {
        const colors = {
            success: 'bg-green-500',
            info: 'bg-blue-500',
            warning: 'bg-yellow-500',
            error: 'bg-red-500',
        };

        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 fade-in`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remover após 3 segundos
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    /**
     * Recarrega a aplicação
     */
    async reload() {
        logger.info('Reloading application...');
        try {
            // Limpar caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }

            // Recarregar página
            window.location.reload();
        } catch (error) {
            logger.error('Failed to reload application', error);
            window.location.reload();
        }
    }

    /**
     * Obtém informações da aplicação
     * @returns {Object}
     */
    getInfo() {
        return {
            name: 'Lista de Tarefas',
            version: '1.0.0',
            initialized: this.initialized,
            stateInitialized: appState.initialized,
            storageAvailable: taskStorage.isAvailable,
            browser: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                online: navigator.onLine,
            },
            features: {
                localStorage: typeof Storage !== 'undefined',
                modules: typeof window.importShim === 'undefined', // ES6 modules nativos
                customElements: 'customElements' in window,
                intersectionObserver: 'IntersectionObserver' in window,
            },
        };
    }

    /**
     * Destrói a aplicação (cleanup)
     */
    destroy() {
        logger.info('Destroying application...');

        // Destruir ThemeManager se existir
        if (this.themeManager) {
            this.themeManager.destroy();
            this.themeManager = null;
        }

        // Remover event listeners
        window.removeEventListener('error', this.handleError);
        document.removeEventListener('DOMContentLoaded', this.handleDOMLoaded);

        // Limpar estados
        this.components.clear();
        this.eventListeners.clear();

        // Salvar estado final
        if (appState.initialized) {
            appState.saveToStorage();
        }

        this.initialized = false;
        logger.info('Application destroyed');
    }
}

// Iniciar aplicação imediatamente
const taskApp = new TaskApp();

// Tornar disponível globalmente para debug
window.taskApp = taskApp;

// Exportar para uso em módulos
export default taskApp;
export { TaskApp };