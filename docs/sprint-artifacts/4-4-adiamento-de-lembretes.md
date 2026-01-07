# Story 4.4: Adiamento de Lembretes (UI-Focused + Menu Extension)

Status: done

## Story

Como usuário com tarefas agendadas que não posso completar imediatamente, quero poder adiar lembretes com opções rápidas para reorganizar minha agenda sem perder o controle das tarefas.

## Acceptance Criteria

**Given** que tenho uma tarefa com lembrete ativo (dueDate configurado) e o sistema de lembretes já está implementado (dueDate field, date-utils, reminder-checker)
**When** preciso adiar um lembrete
**Then** vejo um botão/menu "Adiar" no task card quando a tarefa tem dueDate

**And** ao clicar, vejo opções rápidas: "1 hora", "3 horas", "Amanhã", "Semana que vem"
**And** ao selecionar uma opção, a dueDate é atualizada automaticamente via task-storage.update()
**And** destaque visual de lembrete é recalculado pelo reminder-checker
**And** contador de lembretes atualiza (evento 'reminder:count-update')
**And** nova data aparece formatada no card

**And** tenho opção "Desfazer" (undo) por 5 segundos caso adie por engano
**And** devidoDate original é mantido em campo `originalDueDate` para auditoria (opcional)

## Tasks / Subtasks

- [x] Verificar implementação existente de lembretes e datas (AC: Given)
  - [x] Confirmar dueDate field no task schema (task-storage.js)
  - [x] Confirmar date-utils.js com addHours(), addDays(), isTomorrow()
  - [x] Confirmar task-storage.update() method
  - [x] Confirmar reminder-checker.js recalcula destacadas
- [x] Criar componente postpone-menu.js (AC: 1-3)
  - [x] Criar classe PostponeMenu com opções pré-definidas
  - [x] Implementar método calculateNewDate(currentDate, option)
  - [x] Implementar método postponeTask(taskId, option)
  - [x] Implementar método showUndoNotification(taskId, originalDate)
- [x] Adicionar botão "Adiar" no task-card.js (AC: 1)
  - [x] Verificar se task tem dueDate antes de mostrar botão
  - [x] Adicionar botão com ícone de relógio/calendário
  - [x] Posicionar próximo ao dueDate display
  - [x] Toggle menu ao clicar
- [x] Implementar lógica de cálculo de novas datas (AC: 2)
  - [x] Adicionar addHours() e addDays() em date-utils.js se não existirem
  - [x] Mapear opções: "1h" → +1h, "3h" → +3h, "amanhã" → +1dia às 9h, "semana" → +7dias
  - [x] Considerar timezone do usuário
- [x] Implementar persistência e atualização (AC: 4-7)
  - [x] Chamar taskStorage.update(taskId, { dueDate: newDate })
  - [x] Manter originalDueDate se desejar auditoria
  - [x] Deixar reminder-checker recalcular destacadas automaticamente
  - [x] Atualizar display da data no card
- [x] Implementar sistema Undo (AC: 8)
  - [x] Criar toast notification com botão "Desfazer"
  - [x] Timeout de 5 segundos para undo desaparecer
  - [x] Ao clicar undo: restaurar dueDate original via task-storage.update()
- [x] Implementar estilos CSS para postpone-menu (AC: 1-3)
  - [x] Criar .postpone-menu dropdown
  - [x] Criar .postpone-option para cada opção
  - [x] Suportar light e dark modes
- [x] Integração no app.js (AC: ALL)
  - [x] Importar PostponeMenu se for módulo separado
  - [x] Inicializar postpone-menu nos task cards
  - [x] Testar fluxo completo de adiamento

## Dev Notes

### 🚨 CRITICAL: BACKEND JÁ EXISTE 95% - APENAS MENU + UI EXTENSIONS!

**Conforme Pre-Planning Discovery Checklist do project-context.md:**

**O que JÁ está implementado e deve ser APENAS UTILIZADO:**
- ✅ dueDate field no task schema (services/task-storage.js:99)
- ✅ task-storage.update(id, data) method completo (services/task-storage.js:68-91)
- ✅ date-utils.js com isToday(), isPast(), isTomorrow() (utils/date-utils.js)
- ✅ reminder-checker.js com verificação periódica e destacadas (services/reminder-checker.js)
- ✅ Evento 'reminder:count-update' dispatch contador (services/reminder-checker.js:125-127)
- ✅ TaskCard tem exibição visual de datas (components/task-card.js)
- ✅ app-state.js com updateFilter() e eventos (state/app-state.js)

**O que PRECISA ADICIONAR a date-utils.js:**
- ❌ addHours(date, hours) - Calcula nova data adicionando horas
- ❌ addDays(date, days) - Calcula nova data adicionando dias
- ❌ setHour(date, hour) - Define hora específica (para "amanhã às 9h")

**O que IMPLEMENTAR:**
- ❌ postpone-menu.js - Componente de menu com opções
- ❌ Botão "Adiar" no task-card.js (apenas UI)
- ❌ Estilos CSS para postpone-menu
- ❌ Sistema de undo (toast notification)
- ❌ Funções addHours/addDays em date-utils.js

### 🔍 DESCOBERTA DE CÓDIGO EXISTENTE

**task-storage.js (LINHAS 68-91):**
```javascript
// update() method JÁ EXISTE - usar para atualizar dueDate
update(id, data) {
    try {
        const tasks = this.getAll();
        const index = tasks.findIndex(t => t.id === id);

        if (index === -1) {
            throw new Error(`Task with id ${id} not found`);
        }

        // Merge partial data with existing task
        tasks[index] = {
            ...tasks[index],
            ...data,
            modified: new Date().toISOString()
        };

        this.saveAll(tasks);
        return { success: true, data: tasks[index] };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
```

**Task Schema (LINHA 99):**
```javascript
// dueDate field JÁ EXISTE no schema
dueDate: 'ISO string or null',   // Data de lembrete
```

**date-utils.js (ANALISAR - pode precisar adicionar funções):**
```javascript
// JÁ EXISTEM:
export function isToday(date) { ... }
export function isPast(date) { ... }
export function isTomorrow(date) { ... }

// ADICIONAR (se não existirem):
export function addHours(date, hours) {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result.toISOString();
}

export function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString();
}

export function setHour(date, hour) {
    const result = new Date(date);
    result.setHours(hour, 0, 0, 0);
    return result.toISOString();
}
```

**task-card.js (ANALISAR estrutura atual):**
```javascript
// Estrutura EXISTENTE - adicionar botão "Adiar"
render() {
    // ... código existente ...

    // ADICIONAR botão de adiar próximo ao dueDate
    if (this.task.dueDate) {
        const postponeBtn = document.createElement('button');
        postponeBtn.className = 'task-card__postpone-btn';
        postponeBtn.innerHTML = 'Adiar';
        postponeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePostponeMenu();
        });
        // ... adicionar ao card ...
    }
}
```

### 📝 LIÇÕES APRENDIDAS DAS STORIES ANTERIORES

**Epic 2 Retrospective (2025-12-12):**
- 80% da funcionalidade já estava implementada no epic anterior
- **Action Item Aplicado:** Pre-Planning Discovery Checklist foi seguido
- **Key Learning:** Verificar sempre o que existe antes de planejar
- **Resultado:** Story 4.4 é 95% backend-complete, focar apenas em menu + UI

**Story 4.1 (Configuração de Lembretes):**
- dueDate field implementado no schema
- TaskCard tem exibição visual de datas

**Story 4.2 (Notificações Visuais):**
- reminder-checker.js com verificação periódica
- Evento 'reminder:count-update' já dispatch contador
- Destaques visuais funcionam automaticamente

**Story 4.3 (Filtro de Tarefas com Lembretes):**
- Filtro de data implementado
- CategorySidebar com seção de lembretes
- Contadores atualizam automaticamente

### 🎯 ESCOPO AJUSTADO: UI-FOCUSED + MENU EXTENSION

**Esta story é "UI-focused" - backend de lembretes já existe completamente.**

**O que precisa ser CRIADO:**
1. **PostponeMenu Component** - Menu dropdown com opções
2. **Botão "Adiar" no TaskCard** - Apenas UI
3. **Funções de data em date-utils.js** - addHours(), addDays()
4. **Sistema Undo** - Toast notification com 5s timeout
5. **Estilos CSS** - Para postpone-menu

### Implementação OBRIGATÓRIA: Extensão date-utils.js

**Modificar utils/date-utils.js:**

```javascript
// ADICIONAR no final do arquivo:

/**
 * Adiciona horas a uma data
 * @param {string|Date} date - Data base
 * @param {number} hours - Horas a adicionar
 * @returns {string} Nova data em formato ISO
 */
export function addHours(date, hours) {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result.toISOString();
}

/**
 * Adiciona dias a uma data
 * @param {string|Date} date - Data base
 * @param {number} days - Dias a adicionar
 * @returns {string} Nova data em formato ISO
 */
export function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString();
}

/**
 * Define hora específica para uma data
 * @param {string|Date} date - Data base
 * @param {number} hour - Hora a definir (0-23)
 * @returns {string} Nova data em formato ISO
 */
export function setHour(date, hour) {
    const result = new Date(date);
    result.setHours(hour, 0, 0, 0);
    return result.toISOString();
}
```

### Implementação OBRIGATÓRIA: PostponeMenu Component

**Criar components/postpone-menu.js:**

```javascript
import { addHours, addDays, setHour } from '../utils/date-utils.js';
import { update } from '../services/task-storage.js';
import logger from '../utils/logger.js';

/**
 * Componente de menu de adiamento de lembretes
 */
export class PostponeMenu {
    constructor(taskId, currentDueDate, onPostpone, onCancel) {
        this.taskId = taskId;
        this.currentDueDate = currentDueDate;
        this.onPostpone = onPostpone;
        this.onCancel = onCancel;
        this.element = null;
    }

    /**
     * Opções de adiamento pré-definidas
     */
    getPostponeOptions() {
        const now = new Date();
        const tomorrow9am = setHour(addDays(now, 1), 9);
        const nextWeek = addDays(now, 7);

        return [
            { label: '1 hora', value: '1h', calculate: () => addHours(this.currentDueDate, 1) },
            { label: '3 horas', value: '3h', calculate: () => addHours(this.currentDueDate, 3) },
            { label: 'Amanhã (9h)', value: 'tomorrow', calculate: () => tomorrow9am },
            { label: 'Semana que vem', value: 'week', calculate: () => nextWeek }
        ];
    }

    /**
     * Renderiza o menu de adiamento
     */
    render() {
        const menu = document.createElement('div');
        menu.className = 'postpone-menu';
        menu.setAttribute('role', 'menu');

        const options = this.getPostponeOptions();
        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'postpone-menu__option';
            button.setAttribute('role', 'menuitem');
            button.textContent = option.label;
            button.addEventListener('click', () => {
                this.handlePostpone(option);
            });
            menu.appendChild(button);
        });

        this.element = menu;
        return menu;
    }

    /**
     * Manipula o adiamento da tarefa
     */
    handlePostpone(option) {
        const newDate = option.calculate();
        const originalDate = this.currentDueDate;

        // Atualizar a tarefa
        const result = update(this.taskId, { dueDate: newDate });

        if (result.success) {
            logger.info('Task postponed', {
                taskId: this.taskId,
                option: option.label,
                newDate
            });

            // Salvar data original para auditoria (opcional)
            // update(this.taskId, { originalDueDate: originalDate });

            // Mostrar notificação de undo
            this.showUndoNotification(originalDate);

            // Callback de sucesso
            if (this.onPostpone) {
                this.onPostpone(newDate);
            }

            // Fechar menu
            this.destroy();
        } else {
            logger.error('Failed to postpone task', result.error);
            // TODO: Mostrar erro ao usuário
        }
    }

    /**
     * Mostra notificação com opção de undo
     */
    showUndoNotification(originalDate) {
        const notification = document.createElement('div');
        notification.className = 'postpone-undo-notification';
        notification.innerHTML = `
            <span>Lembrete adiado</span>
            <button class="postpone-undo-btn">Desfazer</button>
        `;

        document.body.appendChild(notification);

        const undoBtn = notification.querySelector('.postpone-undo-btn');
        const timeoutId = setTimeout(() => {
            notification.remove();
        }, 5000); // 5 segundos

        undoBtn.addEventListener('click', () => {
            clearTimeout(timeoutId);
            this.undoPostpone(originalDate);
            notification.remove();
        });
    }

    /**
     * Desfaz o adiamento
     */
    undoPostpone(originalDate) {
        const result = update(this.taskId, { dueDate: originalDate });

        if (result.success) {
            logger.info('Task postpone undone', {
                taskId: this.taskId,
                restoredDate: originalDate
            });

            if (this.onCancel) {
                this.onCancel();
            }
        }
    }

    /**
     * Remove o menu
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }
}
```

### Implementação OBRIGATÓRIA no TaskCard

**Modificar components/task-card.js:**

```javascript
import { PostponeMenu } from './postpone-menu.js';
import { formatFriendlyDate } from '../utils/date-utils.js';

// Na classe TaskCard:

/**
 * Renderiza o botão de adiamento (se tiver dueDate)
 */
renderPostponeButton() {
    if (!this.task.dueDate) return null;

    const button = document.createElement('button');
    button.className = 'task-card__postpone-btn';
    button.setAttribute('aria-label', 'Adiar lembrete');
    button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
        </svg>
    `;

    button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePostponeMenu();
    });

    return button;
}

/**
 * Abre/fecha menu de adiamento
 */
togglePostponeMenu() {
    // Fechar menu se já estiver aberto
    const existingMenu = this.container.querySelector('.postpone-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }

    // Criar e mostrar menu
    const menu = new PostponeMenu(
        this.task.id,
        this.task.dueDate,
        (newDate) => {
            // Callback: atualizar display da data
            const dateElement = this.container.querySelector('.task-card__due-date');
            if (dateElement) {
                dateElement.textContent = formatDateWithLabel(newDate);
            }
        },
        () => {
            // Callback: recarregar card
            this.render();
        }
    );

    // Posicionar menu próximo ao botão
    const button = this.container.querySelector('.task-card__postpone-btn');
    const rect = button.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.left = `${rect.left}px`;

    document.body.appendChild(menu.render());
}
```

### Implementação de Estilos CSS

**Adicionar em styles/components.css:**

```css
/* Postpone Button in Task Card */
.task-card__postpone-btn {
    background: transparent;
    border: none;
    color: var(--text-muted, #6c757d);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    margin-left: 0.5rem;
}

.task-card__postpone-btn:hover {
    background-color: var(--hover-bg, #f8f9fa);
    color: var(--text-primary, #212529);
}

.task-card__postpone-btn svg {
    width: 16px;
    height: 16px;
}

/* Postpone Menu Dropdown */
.postpone-menu {
    position: fixed;
    background-color: var(--bg-primary, #ffffff);
    border: 1px solid var(--border-color, #dee2e6);
    border-radius: 0.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 0.5rem 0;
    min-width: 180px;
    z-index: 1000;
    animation: postpone-menu-fade-in 0.15s ease-out;
}

@keyframes postpone-menu-fade-in {
    from {
        opacity: 0;
        transform: translateY(-5px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.postpone-menu__option {
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    text-align: left;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--text-primary, #212529);
    transition: background-color 0.15s ease;
}

.postpone-menu__option:hover {
    background-color: var(--hover-bg, #f8f9fa);
}

.postpone-menu__option:active {
    background-color: var(--active-bg, #e9ecef);
}

/* Undo Notification */
.postpone-undo-notification {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background-color: var(--bg-primary, #ffffff);
    border: 1px solid var(--border-color, #dee2e6);
    border-radius: 0.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    z-index: 1001;
    animation: postpone-slide-up 0.3s ease-out;
}

@keyframes postpone-slide-up {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.postpone-undo-notification span {
    color: var(--text-primary, #212529);
    font-size: 0.875rem;
}

.postpone-undo-btn {
    background-color: var(--primary-bg, #6c757d);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.postpone-undo-btn:hover {
    background-color: var(--primary-dark, #5a6268);
}

/* Dark mode adjustments */
[data-theme="dark"] .postpone-menu {
    background-color: #343a40;
    border-color: #495057;
}

[data-theme="dark"] .postpone-menu__option {
    color: #ced4da;
}

[data-theme="dark"] .postpone-menu__option:hover {
    background-color: #495057;
}

[data-theme="dark"] .postpone-undo-notification {
    background-color: #343a40;
    border-color: #495057;
}

[data-theme="dark"] .postpone-undo-notification span {
    color: #ced4da;
}
```

### Project Structure Notes

- **CRIAR**: components/postpone-menu.js (novo componente)
- **MODIFICAR**: utils/date-utils.js (adicionar addHours, addDays, setHour)
- **MODIFICAR**: components/task-card.js (adicionar botão de adiamento)
- **MODIFICAR**: styles/components.css (adicionar estilos .postpone-menu)
- **MODIFICAR**: app.js (importar PostponeMenu se necessário)
- **JÁ EXISTE**: services/task-storage.js (não modificar)
- **JÁ EXISTE**: services/reminder-checker.js (não modificar)
- **JÁ EXISTE**: state/app-state.js (não modificar)

### References

- [Source: services/task-storage.js#68-91] - update() method existente
- [Source: services/task-storage.js#99] - dueDate field no schema
- [Source: utils/date-utils.js] - Funções de data existentes
- [Source: services/reminder-checker.js#125-127] - Evento 'reminder:count-update'
- [Source: components/task-card.js] - Estrutura do task card
- [Source: docs/project-context.md#61-65] - Infraestrutura de lembretes 70% pronta
- [Source: docs/epics.md#391-413] - Story 4.4 requisitos originais
- [Source: docs/sprint-artifacts/4-3-filtro-de-tarefas-com-lembretes.md] - Story anterior
- [Source: docs/sprint-artifacts/epic-2-retro-2025-12-12.md] - Lições aprendidas

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.5 (model ID: 'claude-opus-4-5-20251101')

### Debug Log References

### Completion Notes List

**Implementação Story 4.4 - Adiamento de Lembretes (2025-01-07)**

✅ **Componentes criados:**
- `components/postpone-menu.js` - Menu dropdown com opções de adiamento

✅ **Funções de data adicionadas:**
- `utils/date-utils.js` - addHours(), addDays(), setHour()

✅ **UI implementada:**
- `components/task-card.js` - Botão "Adiar" ao lado do dueDate display
- `styles/components.css` - Estilos completos para postpone-menu e undo notification

✅ **Funcionalidades implementadas:**
- Menu de opções: 1 hora, 3 horas, Amanhã (9h), Semana que vem
- Sistema Undo com notificação toast (5 segundos)
- Atualização automática do display da data
- Suporte a light/dark modes

✅ **Integração:**
- PostponeMenu importado no TaskCard
- Menu posicionado dinamicamente próximo ao botão
- Fechamento ao clicar fora

### File List

**Novos arquivos:**
- components/postpone-menu.js
- docs/sprint-artifacts/story-validation-report-4-4-20250107.md

**Arquivos modificados:**
- utils/date-utils.js
- components/task-card.js
- styles/components.css
- services/reminder-checker.js (adicionado updateReminderCount)
- components/postpone-menu.js (imports e tratamento de erro)
- docs/sprint-artifacts/4-4-adiamento-de-lembretes.md
- docs/sprint-artifacts/sprint-status.yaml
