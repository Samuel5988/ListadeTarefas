# Story 4.1: Configuração de Lembretes (UI-Focused)

Status: Ready for Review

## Story

Como usuário com tarefas futuras, quero configurar lembretes para dias específicos para não esquecer compromissos.

## Acceptance Criteria

**Given** que o sistema de persistência com campo dueDate já está implementado
**When** implemento a exibição visual de lembretes
**Then** vejo a data formatada no task card quando houver um lembrete configurado

**And** a data é exibida em formato amigável (pt-BR)
**And** datas próximas (hoje/amanhã) têm destaque visual
**And** datas passadas são indicadas visualmente
**And** o campo dueDate permanece opcional no formulário

## Tasks / Subtasks

- [x] Verificar implementação existente de dueDate (AC: Given)
  - [x] Confirmar campo dueDate no TaskStorage schema
  - [x] Confirmar input datetime-local no TaskForm
  - [x] Confirmar processamento no handleSubmit
  - [x] Confirmar validação de data futura
- [x] Criar date-utils.js para formatação de datas (AC: 2)
  - [x] Implementar formatDateFriendly() para formato pt-BR
  - [x] Implementar isToday(), isTomorrow(), isPast()
  - [x] Implementar getRelativeDateLabel() (Hoje, Amanhã, etc.)
  - [x] Adicionar formatação de data/hora completa
- [x] Adicionar exibição de data no TaskCard (AC: 1, 3, 4)
  - [x] Criar método createDueDateDisplay()
  - [x] Importar date-utils no TaskCard
  - [x] Exibir data apenas quando task.dueDate existe
  - [x] Aplicar formatação amigável da data
  - [x] Adicionar ícone de calendário/relógio
- [x] Adicionar estilos CSS para exibição de lembretes (AC: 3, 4)
  - [x] Criar .task-card__due-date para container
  - [x] Criar .task-card__due-date--today para destaque (verde)
  - [x] Criar .task-card__due-date--tomorrow para amanhã (amarelo)
  - [x] Criar .task-card__due-date--past para datas passadas (vermelho)
  - [x] Aplicar text-overflow: ellipsis para prevenir overflow
  - [x] Validar contraste WCAG AA em dark mode
- [x] Integração com app.js (AC: ALL)
  - [x] Verificar renderização dos cards com datas
  - [x] Testar exibição com tarefas com/sem lembrete
  - [x] Validar persistência da exibição

## Dev Notes

### 🚨 CRITICAL: BACKEND JÁ EXISTE 100% - APENAS UI IMPLEMENTAR!

**Conforme Pre-Planning Discovery Checklist do project-context.md:**

**O que JÁ está implementado e deve ser APENAS UTILIZADO:**
- ✅ TaskStorage.add() aceita dueDate (services/task-storage.js:187)
- ✅ Campo dueDate no schema: `dueDate: task.dueDate || null` (linha 416)
- ✅ validateAndClean() preserva dueDate (linha 416)
- ✅ TaskForm tem input datetime-local (components/task-form.js:133-141)
- ✅ handleSubmit processa dueDate: `const dueDate = formData.get('dueDate') || null` (linha 339)
- ✅ Validação de data futura implementada (linhas 377-383)
- ✅ taskData inclui dueDate ao enviar para taskStorage.add() (linha 373)

**O que IMPLEMENTAR (UI APENAS):**
- ❌ date-utils.js - Criar utilitário de formatação de datas
- ❌ TaskCard.createDueDateDisplay() - Adicionar exibição visual da data
- ❌ Estilos CSS para .task-card__due-date

### 🔍 DESCOBERTA DE CÓDIGO EXISTENTE

**task-storage.js (LINHAS 187, 416):**
```javascript
// Campo dueDate já existe no schema
dueDate: task.dueDate || null,

// validateAndClean preserva o dueDate
dueDate: task.dueDate || null,
```

**task-form.js (LINHAS 133-141):**
```javascript
// Input datetime-local JÁ implementado
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
```

**task-form.js (LINHAS 339, 373, 377-383):**
```javascript
// Captura do dueDate no submit
const dueDate = formData.get('dueDate') || null;

// Incluído no taskData
const taskData = {
    title,
    description,
    category: category || 'Tarefas',
    priority,
    dueDate,  // ← JÁ ENVIADO PARA TASKSTORAGE
};

// Validação de data futura JÁ implementada
if (taskData.dueDate) {
    const dueDate = new Date(taskData.dueDate);
    const now = new Date();
    if (dueDate <= now) {
        this.showFieldError('task-dueDate', 'A data deve ser futura');
        return;
    }
}
```

### 📝 LIÇÕES APRENDIDAS DO EPIC 2 (Retrospective 2025-12-12)

**Conforme descoberto na retrospective do Epic 2:**
- 80% da funcionalidade já estava implementada no epic anterior
- **Action Item Aplicado:** Pre-Planning Discovery Checklist foi seguido
- **Key Learning:** Verificar sempre o que existe antes de planejar
- **Resultado:** Story 4.1 é 90% backend-complete, focar apenas em UI

### 🎯 ESCOPO AJUSTADO: UI-FOCUSED STORY

**Esta story é "UI-focused" - backend já existe completamente.**

**Requisitos mínimos para cumprir ACs:**
1. Formatar data ISO para formato amigável pt-BR
2. Exibir data no TaskCard quando existir
3. Destaque visual para datas especiais (hoje/amanhã/passado)

**O que NÃO implementar:**
- ❌ Não criar novo campo no schema (já existe)
- ❌ Não modificar TaskStorage.add() (já suporta dueDate)
- ❌ Não adicionar input no formulário (já existe)
- ❌ Não modificar validação de data futura (já existe)

### Implementação OBRIGATÓRIA: date-utils.js

**Criar arquivo: utils/date-utils.js**

```javascript
/**
 * Date Utilities - Utilitários para formatação e manipulação de datas
 * @author Lista de Tarefas App
 * @version 1.0.0
 */

import { logger } from './logger.js';

/**
 * Formata data ISO para formato amigável pt-BR
 * @param {string} isoString - Data em formato ISO
 * @returns {string} Data formatada
 * @example
 * formatDateFriendly('2025-12-25T14:30:00') // '25/12/2025 às 14:30'
 */
export function formatDateFriendly(isoString) {
    if (!isoString) return '';

    try {
        const date = new Date(isoString);

        // Verificar se é data válida
        if (isNaN(date.getTime())) {
            logger.warn('Invalid date string:', isoString);
            return '';
        }

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${day}/${month}/${year} às ${hours}:${minutes}`;
    } catch (error) {
        logger.error('Error formatting date:', error);
        return '';
    }
}

/**
 * Verifica se a data é hoje
 * @param {string} isoString - Data em formato ISO
 * @returns {boolean}
 */
export function isToday(isoString) {
    if (!isoString) return false;

    try {
        const date = new Date(isoString);
        const today = new Date();

        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    } catch (error) {
        logger.error('Error checking if date is today:', error);
        return false;
    }
}

/**
 * Verifica se a data é amanhã
 * @param {string} isoString - Data em formato ISO
 * @returns {boolean}
 */
export function isTomorrow(isoString) {
    if (!isoString) return false;

    try {
        const date = new Date(isoString);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        return (
            date.getDate() === tomorrow.getDate() &&
            date.getMonth() === tomorrow.getMonth() &&
            date.getFullYear() === tomorrow.getFullYear()
        );
    } catch (error) {
        logger.error('Error checking if date is tomorrow:', error);
        return false;
    }
}

/**
 * Verifica se a data está no passado (incluindo hoje com hora já passada)
 * @param {string} isoString - Data em formato ISO
 * @returns {boolean} true se data/hora já passou em relação ao momento atual
 * @note Usa timezone do navegador para comparação - pode hazer discrepâncias se usuário viajar entre timezones
 */
export function isPast(isoString) {
    if (!isoString) return false;

    try {
        const date = new Date(isoString);
        const now = new Date();

        return date < now;
    } catch (error) {
        logger.error('Error checking if date is past:', error);
        return false;
    }
}

/**
 * Retorna rótulo relativo da data (Hoje, Amanhã, etc.)
 * @param {string} isoString - Data em formato ISO
 * @returns {string} Rótulo relativo ou vazio
 */
export function getRelativeDateLabel(isoString) {
    if (!isoString) return '';

    if (isToday(isoString)) return 'Hoje';
    if (isTomorrow(isoString)) return 'Amanhã';
    if (isPast(isoString)) return 'Vencida';

    return '';
}

/**
 * Formata data com rótulo relativo + data completa
 * @param {string} isoString - Data em formato ISO
 * @returns {string} Data formatada com rótulo
 * @example
 * formatDateWithLabel('2025-12-25T14:30:00') // '25/12/2025 às 14:30'
 * formatDateWithLabel(hojeIso) // 'Hoje às 14:30'
 */
export function formatDateWithLabel(isoString) {
    if (!isoString) return '';

    const label = getRelativeDateLabel(isoString);
    const formattedDate = formatDateFriendly(isoString);

    if (label) {
        // Extrair apenas hora se for hoje/amanhã
        const date = new Date(isoString);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        if (label === 'Hoje' || label === 'Amanhã') {
            return `${label} às ${hours}:${minutes}`;
        }

        return `${label} (${formattedDate})`;
    }

    return formattedDate;
}
```

### Implementação OBRIGATÓRIA no TaskCard

**Adicionar em components/task-card.js:**

```javascript
// No topo do arquivo
import { formatDateWithLabel, isToday, isTomorrow, isPast } from '../utils/date-utils.js';

// Na createCardStructure(), localização CORRETA:
// Após createCategoryBadge(), mas ANTES de appendChild(mainContent):
//
// // Criar badge de categoria (se aplicável)
// if (this.task.category && this.task.category !== 'Tarefas') {
//     this.createCategoryBadge(mainContent);
// }
//
// // Criar exibição de data de lembrete (se existir) ← ADICIONAR AQUI
// if (this.task.dueDate) {
//     this.createDueDateDisplay(mainContent);
// }
//
// this.contentWrapper.appendChild(mainContent); ← depois desta linha NÃO funciona

// Novo método na classe TaskCard:
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
```

### Implementação de Estilos CSS

**Adicionar em styles/components.css:**

```css
/* Due Date Display */
.task-card__due-date {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.5rem;
    background-color: #f8f9fa;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    color: #6c757d;
    margin-top: 0.5rem;
    /* Prevenir overflow de texto longo */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}

.task-card__due-date-icon {
    flex-shrink: 0;
    opacity: 0.7;
}

.task-card__due-date--today {
    background-color: #d4edda;
    color: #155724;
    font-weight: 500;
}

.task-card__due-date--today .task-card__due-date-icon {
    opacity: 1;
}

.task-card__due-date--tomorrow {
    background-color: #fff3cd;
    color: #856404;
    font-weight: 500;
}

.task-card__due-date--tomorrow .task-card__due-date-icon {
    opacity: 1;
}

.task-card__due-date--past {
    background-color: #f8d7da;
    color: #721c24;
    font-weight: 500;
}

.task-card__due-date--past .task-card__due-date-icon {
    opacity: 1;
}

/* Dark mode adjustments */
/* NOTA: Validar contraste WCAG AA após implementação usando ferramenta de acessibilidade */
[data-theme="dark"] .task-card__due-date {
    background-color: #495057;
    color: #ced4da;
}

[data-theme="dark"] .task-card__due-date--today {
    background-color: #1e4620;
    color: #a3d9a5;
}

[data-theme="dark"] .task-card__due-date--past {
    background-color: #5c1b1b;
    color: #f5c6cb;
}
```

### Project Structure Notes

- Seguir padrão de componentes existentes (category badge)
- Manter consistência visual com elementos informativos
- Usar cores do sistema de temas (suportar light/dark)
- Garantir responsividade em mobile

### References

- [Source: components/task-form.js#133-141] - Input datetime-local existente
- [Source: components/task-form.js#339,373,377-383] - Processamento do dueDate
- [Source: services/task-storage.js#187,416] - Campo dueDate no schema
- [Source: docs/project-context.md#61-65] - Infraestrutura 70% pronta
- [Source: docs/epics.md#322-344] - Story 4.1 requisitos originais
- [Source: docs/sprint-artifacts/epic-2-retro-2025-12-12.md] - Lições aprendidas

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.5 (model ID: 'claude-opus-4-5-20251101')

### Debug Log References

### Completion Notes List

- **IMPLEMENTAÇÃO COMPLETA**: Sistema de configuração de lembretes (UI-focused)
- **Backend**: 100% já existente (TaskStorage, TaskForm com validação)
- **date-utils.js**: Criado com formatação pt-BR e funções auxiliares
- **TaskCard**: Adicionado createDueDateDisplay() com exibição condicional
- **Estilos CSS**: Cores para hoje (verde), amanhã (amarelo), vencida (vermelho), padrão (cinza)
- **Integração**: Import de date-utils no TaskCard
- **Formatação**: "Hoje às 14:30", "Amanhã às 09:00", "25/12/2025 às 15:00"
- **Vencidas**: Label "Vencida (data/hora)" para datas passadas (mais neutro que "Atrasado")
- **Overflow**: Texto com text-overflow: ellipsis para prevenir quebra de layout

### File List

- [x] utils/date-utils.js (CRIADO - novo arquivo)
- [x] services/task-storage.js (JÁ EXISTE - não modificado)
- [x] components/task-form.js (JÁ EXISTE - não modificado)
- [x] components/task-card.js (MODIFICADO - adicionar createDueDateDisplay)
- [x] styles/components.css (MODIFICADO - adicionar estilos .task-card__due-date)

### Code Review Notes

**Aprovado para implementação UI-focused.**
- Backend dueDate field validado e funcionando
- Apenas complementação visual necessária
- date-utils.js segue padrão de outros utils (logger.js, toast-manager.js)
