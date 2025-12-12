# Story 2.3: Edição e Remoção de Tarefas

Status: Done

## 🎯 Contexto Crítico do Projeto

### OVER-IMPLEMENTATION DETECTADA - ESTRATÉGIA PIVOT
**AVISO IMPORTANTE:** O Epic 1 já implementou toda a infraestrutura de backend planejada para stories futuras!

**Já Implementado (NÃO REIMPLEMENTAR):**
- ✅ TaskStorage service completo com métodos update() e remove()
- ✅ AppState system completo com eventos customizados
- ✅ Theme system completo
- ✅ Storage schema unificado com chave: 'listaDeTarefas_tasks'

**Impacto para esta Story:**
- ❌ **NÃO** implementar lógica de persistência
- ✅ **APENAS** criar componentes visuais UI (modal de edição, diálogo de confirmação)
- ✅ Usar TaskStorage.update() para editar tarefas
- ✅ Usar TaskStorage.remove() para excluir tarefas
- ✅ Integrar com eventos do AppState existentes

## Story

Como um usuário organizado,
quero poder editar e remover tarefas existentes,
para manter minha lista de tarefas atualizada e relevante.

## Acceptance Criteria

**Given** que estou visualizando minhas tarefas
**When** clico no menu de ações de uma tarefa
**Then** opções de Editar e Remover aparecem

**And** clicar em Editar abre modal com dados preenchidos
**And** clicar em Remover mostra diálogo de confirmação
**And** edição mantém ID original e atualiza timestamps
**And** remoção é permanente após confirmação
**And** feedback visual confirma operações
**And** estados de loading previnem ações duplicadas

## Tasks / Subtasks

- [x] Criar menu de ações no TaskCard (AC: 1)
  - [x] Implementar botão "..." (three dots) no card
  - [x] Criar dropdown menu com Editar e Remover
  - [x] Adicionar efeito de dropdown com click-outside para fechar
  - [x] Implementar menu positioning responsivo

- [x] Criar modal de edição (TaskEditForm) (AC: 2,3,4)
  - [x] Criar componente TaskEditForm baseado no TaskForm
  - [x] Prepopulate campos com dados da tarefa existente
  - [x] Implementar validação de título obrigatório
  - [x] Manter ID original da tarefa
  - [x] Atualizar campo modified no objeto da tarefa

- [x] Implementar diálogo de confirmação de remoção (AC: 5)
  - [x] Criar componente ConfirmDialog
  - [x] Mostrar título e descrição da tarefa a ser removida
  - [x] Botões Confirmar (danger) e Cancelar (secondary)
  - [x] Adicionar opção "Não perguntar novamente" (checkbox)

- [x] Integrar com sistema existente (Integração Crítica)
  - [x] Usar TaskStorage.update(id, data) para edição
  - [x] Usar TaskStorage.remove(id) para exclusão
  - [x] Disparar eventos STATE_EVENTS.TASK_UPDATED e TASK_DELETED
  - [x] Implementar loading states durante operações

- [x] Implementar feedback visual e UX
  - [x] Loading spinner no botão durante operações
  - [x] Mensagem de sucesso/erro temporária
  - [x] Animações suaves para modal e diálogo
  - [x] Foco no primeiro campo do modal de edição

## Dev Notes

### 🔥 REGRAS CRÍTICAS - NÃO VIOLAR

1. **NÃO criar novo sistema de persistência** - usar TaskStorage.update()/remove() existente
2. **NÃO modificar o schema** - usar schema existente
3. **Storage key existente:** 'listaDeTarefas_tasks'
4. **Manter ID original** da tarefa ao editar
5. **SEMPRE disparar eventos** após operações bem-sucedidas

### Schema de Tarefa (JÁ IMPLEMENTADO)
```javascript
{
    id: 'task_timestamp_random',     // NÃO MUDAR na edição
    title: 'string (required)',      // Pode ser editado
    description: 'string',           // Pode ser editado
    completed: 'boolean',            // Pode ser alterado
    priority: 'number (1,3,5)',     // Pode ser alterado
    category: 'string',              // Pode ser alterado
    dueDate: 'ISO string or null',   // Pode ser alterado
    created: 'ISO string',           // NÃO MUDAR
    modified: 'ISO string'           // ATUALIZAR na edição
}
```

### Eventos do AppState (JÁ IMPLEMENTADOS)
```javascript
STATE_EVENTS = {
    TASK_UPDATED: 'task:updated',
    TASK_DELETED: 'task:deleted'
}
```

### Arquitetura de Componentes

**Localização:**
- components/task-edit-form.js
- components/confirm-dialog.js
- Update em: components/task-card.js (menu de ações)

**Pattern:** ES6 Module com named export
**Nomenclatura:** BEM methodology para CSS classes
**Eventos:** Custom events para comunicação com AppState

### Padrão de Implementação - TaskEditForm

```javascript
// components/task-edit-form.js
export class TaskEditForm {
    constructor(container) {
        this.container = container;
        this.task = null;
        this.modalElement = null;
        this.formElement = null;
        this.isOpen = false;
    }

    open(taskId) {
        // Buscar tarefa do TaskStorage
        // Preencher formulário com dados
        // Auto-focus no campo título
    }

    async handleSubmit(event) {
        // Prevenir default
        // Validar formulário
        // Criar objeto com dados atualizados
        // Manter ID e created originais
        // Adicionar modified: new Date().toISOString()
        // Usar TaskStorage.update(id, data)
        // Disparar evento TASK_UPDATED
    }
}
```

### Padrão de Implementação - ConfirmDialog

```javascript
// components/confirm-dialog.js
export class ConfirmDialog {
    constructor(container) {
        this.container = container;
        this.onConfirm = null;
        this.taskData = null;
    }

    show(taskData, onConfirm) {
        // Mostrar diálogo com detalhes
        // Configurar callback de confirmação
        // Adicionar event listeners
    }

    async confirm() {
        // Executar callback de remoção
        // TaskStorage.remove(this.taskData.id)
        // Disparar evento TASK_DELETED
    }
}
```

### Integração com TaskCard

**Menu de Ações:**
- Posicionamento: top-right do card
- Trigger: click no botão "..."
- Opções: Editar, Remover
- Comportamento: fecha ao clicar fora
- HTML gerado dinamicamente via app.js (ver seção de integração)

**Update necessário em TaskCard:**
- O menu de ações é injetado automaticamente pelo app.js
- TaskCard só precisa ter data-task-id para identificação
- Event delegation é handled no app.js para performance
- Manter responsividade com CSS media queries

### Validação e Sanitização

**Na Edição:**
- Título: required, trim, max 100 chars, sanitizado
- Descrição: optional, trim, max 500 chars, sanitizada
- Categoria: deve existir no array de categorias
- Prioridade: valores válidos (1, 3, 5)
- dueDate: data futura se preenchida

### Estilos CSS Segundo UX Specification

**Menu de Ações:**
- Botão "..." com 3 pontos verticais
- Dropdown: background branco, sombra, border-radius: 4px
- Item hover: background #f8f9fa
- Z-index: 10 (acima dos cards)

**Modal de Edição:**
- Igual ao TaskForm mas com título "Editar Tarefa"
- Botão primary: "Salvar Alterações"

**Diálogo de Confirmação:**
- Overlay: rgba(0, 0, 0, 0.5)
- Dialog: background branco, max-width: 400px
- Título da tarefa em destaque
- Botão Confirmar: vermelho (danger)
- Botão Cancelar: cinza (secondary)

## 📁 Project Structure Notes

### Arquivos a Criar/Atualizar
- **components/task-edit-form.js** - Componente de edição (NOVO)
- **components/confirm-dialog.js** - Diálogo de confirmação (NOVO)
- **components/task-card.js** - Adicionar menu de ações (UPDATE)

### Integração com Arquitetura Existente
- **services/task-storage.js** - Para update() e remove() (JÁ EXISTE)
- **state/app-state.js** - Para eventos STATE_EVENTS (JÁ EXISTE)
- **styles/components.css** - Para estilos dos novos componentes

### Padrões a Seguir
- **ES6 Modules:** import/export nomed
- **Error Handling:** Try-catch com logger
- **Event Naming:** seguir STATE_EVENTS existentes
- **CSS Classes:** BEM methodology
- **Accessibility:** ARIA labels e keyboard navigation

## 🔥 Integração OBRIGATÓRIA no app.js

### Import Statements (Topo do arquivo app.js)
```javascript
// Importar novos componentes
import { TaskEditForm } from './components/task-edit-form.js';
import { ConfirmDialog } from './components/confirm-dialog.js';
```

### Inicialização (Dentro do constructor do App)
```javascript
constructor() {
    // ... código existente ...

    // Inicializar componentes de edição/remoção
    this.taskEditForm = new TaskEditForm(document.body);
    this.confirmDialog = new ConfirmDialog(document.body);
}
```

### setupInitialUI() Method (Adicionar após initializações existentes)
```javascript
setupInitialUI() {
    // ... código existente ...

    // Configurar listeners globais para ações de edição/remoção
    this.setupEditDeleteListeners();
}
```

### setupEditDeleteListeners() Method (Novo método)
```javascript
setupEditDeleteListeners() {
    // Event delegation para menus de ação em todos os cards
    document.addEventListener('click', (e) => {
        // Menu dropdown toggle
        if (e.target.matches('.task-card__menu-button') || e.target.closest('.task-card__menu-button')) {
            e.stopPropagation();
            const button = e.target.closest('.task-card__menu-button');
            const taskId = button.dataset.taskId;
            this.toggleTaskMenu(taskId);
            return;
        }

        // Editar tarefa
        if (e.target.matches('.task-card__menu-item--edit') || e.target.closest('.task-card__menu-item--edit')) {
            e.stopPropagation();
            const menuItem = e.target.closest('.task-card__menu-item--edit');
            const taskId = menuItem.dataset.taskId;
            this.editTask(taskId);
            return;
        }

        // Remover tarefa
        if (e.target.matches('.task-card__menu-item--delete') || e.target.closest('.task-card__menu-item--delete')) {
            e.stopPropagation();
            const menuItem = e.target.closest('.task-card__menu-item--delete');
            const taskId = menuItem.dataset.taskId;
            this.deleteTask(taskId);
            return;
        }

        // Fechar menus ao clicar fora
        if (!e.target.closest('.task-card__menu')) {
            this.closeAllTaskMenus();
        }
    });

    // Listener para tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            this.closeAllTaskMenus();
            if (this.taskEditForm.isOpen) {
                this.taskEditForm.close();
            }
            if (this.confirmDialog.isOpen) {
                this.confirmDialog.close();
            }
        }
    });
}
```

### Métodos de Ação (Novos métodos)
```javascript
toggleTaskMenu(taskId) {
    // Fechar outros menus
    this.closeAllTaskMenus();

    // Abrir/fechar menu da tarefa
    const menu = document.querySelector(`.task-card__menu[data-task-id="${taskId}"]`);
    if (menu) {
        menu.classList.toggle('task-card__menu--open');
    }
}

closeAllTaskMenus() {
    document.querySelectorAll('.task-card__menu--open').forEach(menu => {
        menu.classList.remove('task-card__menu--open');
    });
}

async editTask(taskId) {
    try {
        // Buscar tarefa do TaskStorage
        const tasks = TaskStorage.getAll();
        const task = tasks.find(t => t.id === taskId);

        if (!task) {
            logger.error(`Task ${taskId} not found`);
            return;
        }

        // Abrir modal de edição com dados da tarefa
        await this.taskEditForm.open(task.id);

    } catch (error) {
        logger.error('Error opening edit form:', error);
        this.showFeedback('Erro ao abrir edição', 'error');
    }
}

async deleteTask(taskId) {
    try {
        // Buscar tarefa do TaskStorage
        const tasks = TaskStorage.getAll();
        const task = tasks.find(t => t.id === taskId);

        if (!task) {
            logger.error(`Task ${taskId} not found`);
            return;
        }

        // Verificar preferência "Não perguntar novamente"
        const skipConfirm = localStorage.getItem('skipDeleteConfirm') === 'true';

        if (skipConfirm) {
            // Deletar diretamente
            await this.performTaskDelete(taskId);
        } else {
            // Mostrar diálogo de confirmação
            await this.confirmDialog.show(task, async (dontAskAgain) => {
                if (dontAskAgain) {
                    localStorage.setItem('skipDeleteConfirm', 'true');
                }
                await this.performTaskDelete(taskId);
            });
        }

    } catch (error) {
        logger.error('Error deleting task:', error);
        this.showFeedback('Erro ao deletar tarefa', 'error');
    }
}

async performTaskDelete(taskId) {
    try {
        // Usar loading state no card
        const card = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
        if (card) {
            card.classList.add('task-card--loading');
        }

        // Remover do TaskStorage
        const result = TaskStorage.remove(taskId);

        if (result.success) {
            // Disparar evento de atualização
            document.dispatchEvent(new CustomEvent(STATE_EVENTS.TASK_DELETED, {
                detail: { taskId }
            }));

            // Remover card com animação
            if (card) {
                card.classList.add('task-card--removing');
                setTimeout(() => {
                    card.remove();
                }, 300);
            }

            this.showFeedback('Tarefa removida com sucesso', 'success');
        } else {
            throw new Error(result.error);
        }

    } catch (error) {
        logger.error('Error performing task delete:', error);
        this.showFeedback('Erro ao remover tarefa', 'error');

        // Remover loading state em caso de erro
        const card = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
        if (card) {
            card.classList.remove('task-card--loading');
        }
    }
}
```

### updateTaskCard() Method (Atualizar método existente)
```javascript
// Se já existe, adicionar menu de ações ao renderizar
updateTaskCard(task) {
    const card = document.querySelector(`.task-card[data-task-id="${task.id}"]`);
    if (card) {
        // Atualizar conteúdo existente
        // ... código existente ...

        // Adicionar menu de ações se não existir
        if (!card.querySelector('.task-card__actions')) {
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'task-card__actions';
            actionsContainer.innerHTML = `
                <button class="task-card__menu-button" data-task-id="${task.id}"
                        aria-label="Menu de ações" aria-expanded="false">
                    <span class="task-card__menu-dots"></span>
                    <span class="task-card__menu-dots"></span>
                    <span class="task-card__menu-dots"></span>
                </button>
                <div class="task-card__menu" data-task-id="${task.id}">
                    <button class="task-card__menu-item task-card__menu-item--edit"
                            data-task-id="${task.id}" type="button">
                        Editar
                    </button>
                    <button class="task-card__menu-item task-card__menu-item--delete"
                            data-task-id="${task.id}" type="button">
                        Remover
                    </button>
                </div>
            `;
            card.appendChild(actionsContainer);
        }
    }
}
```

## 🔧 Technical Requirements

### Dependências do Sistema
```javascript
// Importar serviços existentes
import { TaskStorage } from '../services/task-storage.js';
import { STATE_EVENTS } from '../state/app-state.js';
import { logger } from '../utils/logger.js';
```

### Browser Support
- **Minimum:** Safari 16.4+, Chrome 111+, Firefox 128+
- **Features usados:** ES6 Modules, CSS Variables, RequestAnimationFrame
- **Form features:** HTML5 form validation, datetime-local input

### Performance Considerations
- **Modal rendering:** Usar requestAnimationFrame para animações
- **Event delegation:** Para menus de múltiplos cards
- **Debounce:** Prevenir cliques duplicados
- **Memory cleanup:** Remover listeners ao destruir componentes

## References

- [Source: docs/epics.md#Epic-2] - Definição completa da Story 2.3
- [Source: docs/architecture.md#Project-Structure] - Estrutura de arquivos e padrões
- [Source: docs/ux-design-specification.md#Task-Cards] - Especificação visual de cards
- [Source: docs/project-context.md] - Contexto atual do projeto com over-implementation
- [Source: docs/sprint-artifacts/2-1-componente-task-card.md] - Componente TaskCard base
- [Source: docs/sprint-artifacts/2-2-formulario-de-criacao-de-tarefas.md] - TaskForm de referência

## 🎨 UI/UX Requirements

### Visual Design System
- **Design System:** shadcn/ui + Tailwind CSS v4.0
- **Typography:** System fonts (Roboto, Segoe UI)
- **Spacing:** 8px grid system
- **Colors:** Seguir paleta definida, usar vermelho para ações destrutivas

### Interaction Patterns
- **Edit Modal:** Igual ao TaskForm mas com dados preenchidos
- **Confirm Dialog:** Overlay com diálogo centralizado
- **Menu Actions:** Dropdown que fecha ao clicar fora
- **Loading States:** Indicadores visuais durante operações

### Accessibility
- **ARIA labels:** Para todos os botões e inputs
- **Keyboard Navigation:** Tab, Enter, Escape suportados
- **Focus Management:** Focus trap dentro de modais
- **Screen Reader:** Anúncios de ações concluídas
- **Contrast Ratio:** Mínimo 4.5:1 para texto

## ⚠️ Common Pitfalls to Avoid

1. **Reimplementar persistência** - Usar TaskStorage.update()/remove() existente
2. **Modificar schema ou ID** - Manter ID e created originais
3. **Esquecer eventos** - Disparar TASK_UPDATED/TASK_DELETED
4. **Não validar edição** - Aplicar mesma validação do TaskForm
5. **Ignorar loading states** - Prevenir cliques duplicados
6. **Não sanitizar inputs** - Prevenção de XSS
7. **Esquecer feedback visual** - Usuário precisa saber se funcionou

## Dev Agent Record

### Context Reference

<!-- Context workflow adicionará XML de contexto aqui -->

### Agent Model Used

Claude Sonnet (glm-4.6)

### Implementation Plan

1. **Fase GREEN:** Implementar componentes básicos
   - Criar TaskEditForm baseado no TaskForm
   - Implementar ConfirmDialog simples
   - Adicionar menu de ações ao TaskCard
   - Integrar com TaskStorage para operações CRUD

2. **Fase REFACTOR:** Adicionar features avançadas
   - Implementar loading states
   - Adicionar animações suaves
   - Melhorar acessibilidade
   - Adicionar opção "Não perguntar novamente"

### Completion Notes List

1. ✅ Story criada com contexto completo de over-implementation
2. ✅ Requisitos técnicos alinhados com arquitetura existente
3. ✅ Especificações UX detalhadas para modais e diálogos
4. ✅ Instruções claras de integração com TaskStorage
5. ✅ Padrões de código seguindo componentes anteriores
6. ✅ Considerações de performance e acessibilidade
7. ✅ Exemplos de implementação e anti-padrões
8. ✅ Integração completa no app.js detalhada com imports e métodos
9. ✅ Event delegation pattern implementado para performance
10. ✅ Exemplo de como o menu de ações é injetado no TaskCard
11. ✅ Persistência de "Não perguntar novamente" especificada
12. ✅ Feedback visual e loading states implementados
13. ✅ TaskEditForm implementado com pré-preenchimento e validação
14. ✅ ConfirmDialog implementado com opção de não perguntar novamente
15. ✅ Menu de ações com ícones SVG e animações suaves
16. ✅ Integração completa com TaskStorage.update/remove()
17. ✅ Eventos STATE_EVENTS.TASK_UPDATED/DELETED disparados
18. ✅ Toast notifications para feedback de sucesso/erro
19. ✅ Animações de removing e loading states nos cards
20. ✅ Acessibilidade com ARIA labels e navegação por teclado

### File List

- [x] components/task-edit-form.js (Criado - Modal de edição de tarefas)
- [x] components/confirm-dialog.js (Criado - Diálogo de confirmação)
- [x] components/task-card.js (Atualizado - Adicionado menu de ações)
- [x] app.js (Atualizado - Integração dos novos componentes)
- [x] styles/components.css (Atualizado - Estilos para novos componentes)
- [x] docs/sprint-artifacts/2-3-edicao-e-remocao-de-tarefas.md (Este arquivo)