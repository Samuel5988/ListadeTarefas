/**
 * Theme Manager - Componente de gerenciamento de temas
 * @author Lista de Tarefas App
 * @version 1.0.0
 */

import { logger } from '../utils/logger.js';

export class ThemeManager {
    constructor(appState) {
        this.appState = appState;
        this.themeToggle = null;
        this.isInitialized = false;
        this.init();
    }

    /**
     * Inicializa o ThemeManager
     */
    init() {
        try {
            logger.info('Initializing ThemeManager');
            this.createThemeToggle();
            this.attachEventListeners();
            this.loadInitialTheme();
            this.isInitialized = true;
            logger.info('ThemeManager initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize ThemeManager', error);
        }
    }

    /**
     * Cria o botão de toggle de tema
     */
    createThemeToggle() {
        if (!this.themeToggle) {
            this.themeToggle = document.createElement('label');
            this.themeToggle.className = 'theme-toggle';
            this.themeToggle.setAttribute('aria-label', 'Alternar tema');
            this.themeToggle.innerHTML = `
                <input type="checkbox" id="theme-toggle-checkbox">
                <span class="theme-slider"></span>
            `;

            // Adicionar classe de transição suave
            this.themeToggle.classList.add('theme-transition');
        }
        return this.themeToggle;
    }

    /**
     * Anexa listeners de eventos
     */
    attachEventListeners() {
        if (!this.themeToggle) return;

        // Obter o input checkbox
        const checkbox = this.themeToggle.querySelector('#theme-toggle-checkbox');
        if (!checkbox) return;

        // Listener para clique no label (para melhor experiência do usuário)
        this.themeToggle.addEventListener('click', (e) => {
            // Prevenir comportamento padrão para controlar manualmente
            e.preventDefault();
            this.toggleTheme();
        });

        // Listener para mudanças de estado
        this.appState.subscribe('theme-manager', (newState, changes) => {
            // Verificar se changes é um array ou objeto
            const changesArray = Array.isArray(changes) ? changes : [];

            // Procurar por mudança de tema no array
            const themeChange = changesArray.find(c =>
                typeof c === 'object' && c.path && (
                    c.path === 'ui.theme' ||
                    c.path === 'preferences.theme'
                )
            );

            // Se não encontrou no array, verificar se o changes (quando objeto) tem tema
            const themeFromObject = !Array.isArray(changes) && typeof changes === 'object' ?
                (changes.ui?.theme || changes.preferences?.theme) : null;

            const newTheme = themeChange?.newValue || themeFromObject || newState.ui?.theme || newState.preferences?.theme;

            if (newTheme) {
                this.updateToggleState(newTheme);
            }
        });
    }

    /**
     * Carrega o tema inicial
     */
    loadInitialTheme() {
        const savedTheme = this.appState.getState('ui.theme') ||
                          this.appState.getState('preferences.theme') ||
                          this.detectSystemTheme();

        this.applyTheme(savedTheme);
        this.updateToggleState(savedTheme);
    }

    /**
     * Detecta o tema do sistema operacional
     */
    detectSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    /**
     * Alterna entre os temas
     */
    toggleTheme() {
        const currentTheme = this.appState.getState('ui.theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        logger.info('Toggling theme', { from: currentTheme, to: newTheme });

        // Atualizar estado diretamente - o listener do checkbox será atualizado pelo estado
        this.appState.updateUI({ theme: newTheme });
    }

    /**
     * Aplica o tema visualmente
     */
    applyTheme(theme) {
        if (typeof document === 'undefined') return;

        // Adicionar classe de transição ao body
        document.body.classList.add('theme-transition');

        // Aplicar atributo data-theme
        document.documentElement.setAttribute('data-theme', theme);

        // Remover classe de transição após a animação
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 300);

        logger.debug('Theme applied visually', { theme });
    }

    /**
     * Atualiza o estado visual do botão toggle
     */
    updateToggleState(theme) {
        if (!this.themeToggle) return;

        const isDark = theme === 'dark';
        const checkbox = this.themeToggle.querySelector('#theme-toggle-checkbox');

        if (checkbox) {
            // Forçar atualização do estado do checkbox
            if (checkbox.checked !== isDark) {
                checkbox.checked = isDark;
            }
        }

        // Atualizar ARIA label
        const ariaLabel = isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro';
        this.themeToggle.setAttribute('aria-label', ariaLabel);

        logger.debug('Toggle state updated', { theme, isDark });
    }

    /**
     * Obtém o botão de toggle para adicionar ao DOM
     */
    getToggleElement() {
        return this.themeToggle;
    }

    /**
     * Destrói o ThemeManager
     */
    destroy() {
        if (this.appState) {
            this.appState.unsubscribe('theme-manager');
        }

        if (this.themeToggle) {
            this.themeToggle.removeEventListener('click', this.toggleTheme);
            this.themeToggle = null;
        }

        this.isInitialized = false;
        logger.info('ThemeManager destroyed');
    }
}

export default ThemeManager;