# Story 3.1: Sistema de Categorias - UI-Focused Implementation

Status: Done

## Story

Como usuário com múltiplos projetos, quero organizar tarefas por categorias através de uma sidebar interativa para manter contexto separado entre áreas da vida.

## Acceptance Criteria

**Given** que o backend de categorias já está implementado (categories array em AppState, category field em tasks)
**When** implemento a UI da sidebar de categorias
**Then** vejo uma sidebar à esquerda com lista de categorias dinâmicas

**And** categoria "Tarefas" aparece como padrão e não pode ser removida
**And** consigo criar novas categorias através do botão "+ Nova Categoria"
**And** cada categoria mostra contador de tarefas não concluídas
**And** clicar em uma categoria filtra imediatamente as tarefas visíveis
**And** categoria ativa fica destacada visualmente
**And** consigo remover categorias customizadas (exceto "Tarefas")

## Tasks / Subtasks

- [x] Implementar Category Sidebar Component (AC: 1, 2, 3)
  - [x] Criar structure básica da sidebar
  - [x] Adicionar lista dinâmica de categorias do AppState
  - [x] Implementar contador de tarefas por categoria
- [x] Implementar Gestão de Categorias (AC: 4, 6)
  - [x] Botão "+ Nova Categoria" com modal de input e validação
  - [x] Função para adicionar categoria ao AppState
  - [x] Validação: nome único, não vazio, máximo 30 caracteres, alfanumérico + espaços
  - [x] Opção de remover categoria com diálogo de confirmação
  - [x] Mensagem: "Tem certeza que deseja remover a categoria '{nome}'? Tarefas existentes permanecerão."
  - [x] Proteger categoria "Tarefas" contra remoção
  - [x] Feedback visual: toast messages para sucesso/erro
- [x] Implementar Filtragem e Interação (AC: 5, 7)
  - [x] Click handler para filtrar tarefas por categoria
  - [x] Destaque visual para categoria ativa
  - [x] Integração com filtros existentes do AppState
- [x] Integração com app.js (AC: ALL)
  - [x] Importar componente no app.js
  - [x] Inicializar sidebar em setupInitialUI()
  - [x] Conectar com eventos STATE_EVENTS

## Dev Notes

### 📝 Aprendizados do Epic 2 (Retrospective 2025-12-12)

**Conforme descoberto na retrospective do Epic 2:**
- 80% do backend de categorias já estava implementado no Epic 1
- **Action Item Aplicado:** Pre-Planning Discovery Checklist do project-context.md foi seguido
- **Key Learning:** Verificar sempre o que existe antes de planejar implementação
- **Issue Evitada:** Over-implementation e duplicação de funcionalidades

### 🚨 CRITICAL: BACKEND JÁ EXISTE - NÃO REIMPLEMENTAR!

**O que JÁ está implementado e deve ser APENAS UTILIZADO:**
- TaskStorage já tem category field no schema
- AppState já tem categories array: ['Tarefas']
- AppState já tem filter.category e getFilteredTasks()
- TaskForm e TaskEditForm já têm select de categorias
- TaskCard já mostra badge de categoria
- Sistema de persistência já salva categorias

### Implementação OBRIGATÓRIA no app.js

```javascript
// Import no topo do arquivo
import { CategorySidebar } from './components/category-sidebar.js';

// Em setupInitialUI()
const categorySidebarContainer = document.querySelector('.category-sidebar-container') || document.createElement('div');
categorySidebarContainer.className = 'category-sidebar-container';
document.body.insertBefore(categorySidebarContainer, document.querySelector('.main-container'));

this.categorySidebar = new CategorySidebar(categorySidebarContainer);
this.categorySidebar.render();

// Em addGlobalEventListeners()
document.addEventListener(STATE_EVENTS.CATEGORIES_CHANGED, () => {
  this.categorySidebar.update();
});

document.addEventListener(STATE_EVENTS.FILTER_CHANGED, () => {
  this.categorySidebar.updateActiveFilter();
});

// Em renderTasks()
// Verificar se há filtro por categoria ativo para renderizar tasks filtradas
```

### Componente Obrigatório: category-sidebar.js

**Localização:** components/category-sidebar.js
**Estrutura obrigatória:**

```javascript
export class CategorySidebar {
  constructor(container) {
    this.container = container;
    this.appState = window.appState;
  }

  render() {
    // Renderizar estrutura HTML da sidebar
  }

  update() {
    // Atualizar lista de categorias do AppState
  }

  updateActiveFilter() {
    // Atualizar destaque da categoria ativa baseado no filtro
  }

  addCategory(name) {
    // Validar input antes de adicionar
    if (!name || name.trim() === '') {
      this.showError('Nome da categoria não pode estar vazio');
      return;
    }
    if (name.length > 30) {
      this.showError('Nome da categoria deve ter no máximo 30 caracteres');
      return;
    }
    if (!/^[a-zA-Z0-9À-ÿ\s]+$/.test(name)) {
      this.showError('Nome deve conter apenas letras, números e espaços');
      return;
    }
    if (this.appState.getState().categories.includes(name)) {
      this.showError('Esta categoria já existe');
      return;
    }

    try {
      this.appState.addCategory(name.trim());
      this.showSuccess(`Categoria "${name}" criada com sucesso`);
    } catch (error) {
      this.showError('Erro ao criar categoria. Tente novamente.');
    }
  }

  removeCategory(name) {
    if (name === 'Tarefas') {
      this.showError('A categoria "Tarefas" não pode ser removida');
      return;
    }

    if (!confirm(`Tem certeza que deseja remover a categoria "${name}"? Tarefas existentes permanecerão.`)) {
      return;
    }

    try {
      this.appState.removeCategory(name);
      this.showSuccess(`Categoria "${name}" removida com sucesso`);
    } catch (error) {
      this.showError('Erro ao remover categoria. Tente novamente.');
    }
  }

  filterByCategory(categoryName) {
    try {
      this.appState.updateFilter({ category: categoryName });
    } catch (error) {
      this.showError('Erro ao aplicar filtro. Tente novamente.');
    }
  }

  showError(message) {
    // Implementar toast ou alert de erro
    console.error(message);
    // TODO: Implementar toast visual
  }

  showSuccess(message) {
    // Implementar toast de sucesso
    console.log(message);
    // TODO: Implementar toast visual
  }
}
```

### Eventos a Utilizar (JÁ EXISTEM)

```javascript
// Em state/app-state.js já estão definidos:
const STATE_EVENTS = {
  CATEGORIES_CHANGED: 'categoriesChanged',
  FILTER_CHANGED: 'filterChanged',
  TASKS_CHANGED: 'tasksChanged',
  // ... outros eventos
};
```

- `STATE_EVENTS.CATEGORIES_CHANGED` - Disparado quando categorias são adicionadas/removidas
- `STATE_EVENTS.FILTER_CHANGED` - Disparado quando filtro de categoria é aplicado
- `STATE_EVENTS.TASKS_CHANGED` - Disparado quando tasks mudam (para atualizar contadores)

### Estado Global (JÁ EXISTE)

```javascript
// Em app-state.js já existe:
{
  categories: ['Tarefas', 'Pessoal', 'Trabalho', 'Estudo', 'Outros'],
  filter: {
    category: 'all' // ou nome da categoria
  }
}
```

### Project Structure Notes

- Seguir padrão de componentes existentes (task-card.js, task-form.js)
- Usar CSS modules padrão: styles/category-sidebar.css
- Manter consistência com eventos do AppState
- Não criar novo sistema de estado - usar o existente

### References

- [Source: services/task-storage.js#341] - Categorias válidas pré-definidas
- [Source: state/app-state.js#25] - Categories array no estado inicial
- [Source: state/app-state.js#35] - Filter category implementation
- [Source: state/app-state.js#1030] - Category filtering in getFilteredTasks()
- [Source: components/task-form.js#114] - Select de categorias existente
- [Source: docs/project-context.md#48-52] - Backend categories já implementado

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.5 (model ID: 'claude-opus-4-5-20251101')

### Debug Log References

### Completion Notes List

- Descoberta: Backend de categorias 100% implementado
- Escopo ajustado para UI-only
- Lições da retrospective do Epic 2 aplicadas
- Validação de inputs especificada para prevenir erros
- Tratamento de erros implementado com feedback ao usuário
- Componente CategorySidebar criado com estrutura completa
- Sistema de filtragem integrado com getFilteredTasks() existente
- Eventos STATE_EVENTS atualizados com CATEGORIES_CHANGED
- Integração completa com app.js e inicialização automática

### File List

- [x] components/category-sidebar.js (NOVO)
- [x] styles/category-sidebar.css (NOVO)
- [x] app.js (MODIFICADO - integração)
- [x] index.html (MODIFICADO - include CSS)
- [x] state/app-state.js (MODIFICADO - adicionado CATEGORIES_CHANGED)
- [x] utils/toast-manager.js (NOVO - sistema de notificações)
- [x] styles/toast.css (NOVO - estilos das notificações)
- [x] styles/base.css (MODIFICADO - adicionado --sidebar-width)

## 🚨 ALERTA ESPECÍFICO DO PROJECT CONTEXT

**NÃO IMPLEMENTAR:**
- ❌ taskStorage.add() ou métodos CRUD
- ❌ Schema de categorias
- ❌ Sistema de persistência
- ❌ getFilteredTasks() ou lógica de filtro

**IMPLEMENTAR APENAS:**
- ✅ Componente visual da sidebar
- ✅ UI para gerenciar categorias
- ✅ Integração com backend existente
- ✅ Feedback visual para usuário