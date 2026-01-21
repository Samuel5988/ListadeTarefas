/**
 * Sound Toggle - Componente de controle de alertas sonoros
 * @author Lista de Tarefas App
 * @version 1.0.0
 */

import { logger } from '../utils/logger.js';
import { soundService } from '../services/sound-service.js';

export class SoundToggle {
    constructor(appState) {
        this.appState = appState;
        this.soundToggle = null;
        this.isInitialized = false;
        this.init();
    }

    /**
     * Inicializa o SoundToggle
     */
    init() {
        try {
            logger.info('Initializing SoundToggle');
            this.createSoundToggle();
            this.attachEventListeners();
            this.loadInitialSoundState();
            this.isInitialized = true;
            logger.info('SoundToggle initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize SoundToggle', error);
        }
    }

    /**
     * Cria o botão de toggle de som
     */
    createSoundToggle() {
        if (!this.soundToggle) {
            this.soundToggle = document.createElement('button');
            this.soundToggle.className = 'sound-toggle';
            this.soundToggle.setAttribute('aria-label', 'Alternar som');
            this.soundToggle.setAttribute('type', 'button');
            this.soundToggle.innerHTML = `
                <span class="sound-toggle__icon sound-toggle__icon--on">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                </span>
                <span class="sound-toggle__icon sound-toggle__icon--off">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <line x1="23" y1="9" x2="17" y2="15"></line>
                        <line x1="17" y1="9" x2="23" y2="15"></line>
                    </svg>
                </span>
            `;
        }
        return this.soundToggle;
    }

    /**
     * Anexa listeners de eventos
     */
    attachEventListeners() {
        if (!this.soundToggle) return;

        // Listener para clique no botão
        this.soundToggle.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleSound();
        });

        // Listener para mudanças de estado
        this.appState.subscribe('sound-toggle', (newState) => {
            const soundEnabled = newState.settings?.soundEnabled ?? true;
            this.updateToggleState(soundEnabled);
        });

        // Listener para evento de mudança de som
        window.addEventListener('sound:setting:changed', (e) => {
            this.updateToggleState(e.detail.enabled);
            // Sincronizar com SoundService
            soundService.setEnabled(e.detail.enabled);
        });
    }

    /**
     * Carrega o estado inicial do som
     */
    loadInitialSoundState() {
        const soundEnabled = this.appState.getState('settings.soundEnabled') ?? true;
        this.updateToggleState(soundEnabled);

        // Sincronizar com SoundService
        soundService.setEnabled(soundEnabled);

        logger.debug('Initial sound state loaded', { soundEnabled });
    }

    /**
     * Alterna entre som ativado/desativado
     */
    async toggleSound() {
        const currentEnabled = this.appState.getState('settings.soundEnabled') ?? true;
        const newEnabled = !currentEnabled;

        logger.info('Toggling sound', { from: currentEnabled, to: newEnabled });

        // IMPORTANTE: Inicializar AudioContext antes de qualquer operação de som
        // Isso é necessário porque navegadores exigem interação do usuário
        soundService.init();

        // Atualizar estado através do AppState
        this.appState.updateSoundSetting(newEnabled);

        // Sincronizar com SoundService
        soundService.setEnabled(newEnabled);

        // Tocar som de teste se estiver ativando
        if (newEnabled) {
            // Pequeno delay para garantir que o AudioContext está pronto
            await new Promise(resolve => setTimeout(resolve, 100));
            await soundService.test();
        }

        // Mostrar feedback visual
        this.showFeedback(newEnabled);
    }

    /**
     * Mostra feedback visual sobre a mudança
     */
    showFeedback(enabled) {
        const message = enabled ? 'Som ativado' : 'Som desativado';
        const type = enabled ? 'success' : 'info';

        // Dispatch evento para o app.js mostrar toast
        window.dispatchEvent(new CustomEvent('app:show-notification', {
            detail: { message, type }
        }));
    }

    /**
     * Atualiza o estado visual do botão toggle
     */
    updateToggleState(enabled) {
        if (!this.soundToggle) return;

        // Atualizar classes
        this.soundToggle.classList.toggle('sound-toggle--on', enabled);
        this.soundToggle.classList.toggle('sound-toggle--off', !enabled);

        // Atualizar ARIA label
        const ariaLabel = enabled ? 'Desativar som' : 'Ativar som';
        this.soundToggle.setAttribute('aria-label', ariaLabel);

        // Atualizar título
        this.soundToggle.title = ariaLabel;

        logger.debug('Sound toggle state updated', { enabled });
    }

    /**
     * Obtém o botão de toggle para adicionar ao DOM
     */
    getToggleElement() {
        return this.soundToggle;
    }

    /**
     * Destrói o SoundToggle
     */
    destroy() {
        if (this.appState) {
            this.appState.unsubscribe('sound-toggle');
        }

        if (this.soundToggle) {
            this.soundToggle.removeEventListener('click', this.toggleSound);
            this.soundToggle = null;
        }

        this.isInitialized = false;
        logger.info('SoundToggle destroyed');
    }
}

export default SoundToggle;
