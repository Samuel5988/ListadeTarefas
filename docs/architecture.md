# Arquitetura - Lista de Tarefas

## Executive Summary

Lista de Tarefas é uma aplicação web frontend minimalista construída com JavaScript vanilla, HTML5 e CSS3. A arquitetura prioriza simplicidade, performance offline e organização clara para facilitar o aprendizado técnico e a evolução gradual do sistema.

## Decision Summary

| Categoria | Decisão | Versão | Afeta Epics | Rationale |
| -------- | -------- | ------- | ------------- | --------- |
| Estrutura de Arquivos | Por Funcionalidade | 1.0 | Todos | Organização clara desde o início, facilita manutenção |
| Sistema de Módulos | ES6 Modules | 1.0 | Todos | Padrão moderno, explicit imports/exports |
| Estratégia CSS | Híbrida (Variáveis + Tailwind) | 4.0+ | UX | Aproveita design system + mantém flexibilidade |
| Gerenciamento de Estado | Centralizado Simples | 1.0 | Todos | Clareza, fácil debug e evolução |
| Sistema de Temas | Variáveis CSS | 1.0 | UX | Moderno, performático, fácil manutenção |
| Persistência | Schema Unificado | 1.0 | Todos | Melhor performance, backup/restore simples |

## Project Structure

```
lista-de-tarefas/
├── index.html                     # Ponto de entrada
├── styles/                        # Sistema visual
│   ├── base.css                  # Fundamentos (cores, tipografia)
│   ├── components.css            # Estilos dos componentes
│   ├── themes.css               # Variáveis de tema (light/dark)
│   └── responsive.css           # Media queries
├── components/                    # UI Components
│   ├── task-card.js            # Cartão de tarefa individual
│   ├── task-form.js            # Formulário de criação/edição
│   ├── category-sidebar.js     # Navegação por categorias
│   ├── priority-indicator.js   # Indicadores visuais
│   └── floating-action-btn.js  # Botão flutuante "+"
├── services/                      # Lógica de negócio
│   ├── task-storage.js         # Camada de persistência
│   ├── task-manager.js         # Regras de negócio
│   └── category-service.js     # Gestão de categorias
├── state/                         # Gerenciamento de estado
│   ├── app-state.js            # Estado centralizado
│   └── state-subscribers.js    # Sistema de notificações
├── utils/                         # Utilitários
│   ├── logger.js               # Sistema de logging
│   ├── error-handler.js        # Tratamento de erros
│   ├── formatters.js           # Formatação de dados
│   ├── theme-manager.js        # Controle de temas
│   └── date-utils.js           # Manipulação de datas
├── assets/                        # Recursos estáticos
│   ├── icons/                  # Ícones SVG
│   └── favicon.ico             # Ícone da aba
└── app.js                        # Orquestrador principal
```

## Epic to Architecture Mapping

| Epic | Componentes Principal | Serviços | Estado |
| ---- | -------------------- | -------- | ------ |
| Gerenciamento Básico | task-card.js, task-form.js | task-manager.js, task-storage.js | tasks array |
| Sistema de Prioridades | priority-indicator.js | formatters.js | priority filter |
| Organização por Categorias | category-sidebar.js | category-service.js | currentCategory |
| Sistema de Lembretes | task-card.js | date-utils.js | date filtering |

## Technology Stack Details

### Core Technologies

- **HTML5**: Semântico, acessível, estrutura base
- **CSS3**: Layout Flexbox/Grid, variáveis customizadas, transições
- **JavaScript Vanilla**: ES6+, modules, async/await, LocalStorage API
- **Tailwind CSS**: v4.0+ via Play CDN para utilitários
- **shadcn/ui**: Design system reference (cores, padrões)

### Integration Points

- **HTML ↔ JS**: Módulos ES6 com type="module"
- **CSS ↔ Theme**: Variáveis CSS com data-theme attribute
- **Components ↔ State**: Event-driven communication
- **State ↔ Storage**: Schema unificado JSON

## Implementation Patterns

Esses padrões garantem implementação consistente:

### Naming Conventions

- **Arquivos**: kebab-case (task-card.js)
- **Funções/Variáveis**: camelCase (createTask, taskList)
- **Classes**: PascalCase (TaskManager)
- **CSS Classes**: BEM methodology (.task-card__title)

### Code Organization

- **Imports**: Named exports preferencialmente
- **Error Handling**: Try-catch com fallback seguro
- **Events**: Padrão verbo-substantivo (task:created)
- **DOM Updates**: RequestAnimationFrame para performance

### Error Handling

```javascript
// Padrão de retorno consistente
function createTask(taskData) {
  try {
    const task = validateAndCreate(taskData);
    return { success: true, data: task };
  } catch (error) {
    logger.error('createTask failed', error);
    return { success: false, error: error.message };
  }
}
```

## Consistency Rules

### Data Schema

```javascript
const taskSchema = {
  id: 'task_timestamp_random',     // ID único
  title: 'string (required)',      // Título trimmado
  description: 'string (optional)', // Descrição opcional
  completed: 'boolean',            // Estado de conclusão
  priority: 'number (1,3,5)',     // Prioridade numérica
  category: 'string',              // Categoria existente
  dueDate: 'ISO string or null',   // Data de lembrete
  created: 'ISO string',           // Criação automática
  modified: 'ISO string'           // Atualização automática
};
```

### Storage Schema

```javascript
// Estrutura unificada no LocalStorage
{
  version: '1.0',
  tasks: [...],
  categories: ['Tarefas', 'Trabalho', 'Pessoal'],
  preferences: {
    theme: 'light|dark',
    defaultPriority: 3,
    showCompleted: true
  }
}
```

## Data Architecture

### Models

- **Task**: Entidade principal com todos os atributos
- **Category**: Simples string array para categorias
- **Preferences**: Objeto de configurações do usuário

### Relationships

- Tasks → Category (many-to-one via string)
- Tasks → Priority (enum: 1=Low, 3=Medium, 5=High)
- Tasks → DueDate (optional, triggers reminders)

## API Contracts

### Internal APIs (Component → Service)

```javascript
// Task Service API
taskManager.create(taskData)        → { success, data|error }
taskManager.update(id, updates)     → { success, data|error }
taskManager.delete(id)              → { success, data|error }
taskManager.getAll(filter)          → { success, data: tasks[] }

// Category Service API
categoryService.add(name)           → { success, data|error }
categoryService.getAll()             → { success, data: string[] }
categoryService.delete(name)        → { success, data|error }
```

## Security Architecture

### Considerations

- **No backend**: Zero attack surface externo
- **LocalStorage Isolation**: Sandbox do navegador
- **Input Validation**: Sanitização de dados
- **XSS Prevention**: textContent para inputs do usuário

### Proteções Implementadas

```javascript
// Sanitização de inputs
function sanitizeInput(input) {
  return input.trim().replace(/[<>]/g, '');
}

// Validação de schema
function validateTask(task) {
  const required = ['id', 'title', 'completed', 'priority'];
  return required.every(field => task[field] !== undefined);
}
```

## Performance Considerations

### Requirements atendidos

- **Carregamento < 1s**: HTML mínimo, CSS lazy load
- **Interações < 100ms**: Estado em memória
- **1000+ tasks**: Event delegation, renderização otimizada
- **Busca instantânea**: Filtros em arrays com cache

### Otimizações

```javascript
// Event delegation para múltiplos itens
document.addEventListener('click', (e) => {
  if (e.target.matches('.task-checkbox')) {
    handleTaskToggle(e.target.dataset.taskId);
  }
});

// Debounce para buscas
const debounceSearch = debounce((query) => {
  filterTasks(query);
}, 300);
```

## Deployment Architecture

### Static Deployment

- **Hosting**: Qualquer servidor estático (GitHub Pages, Netlify, Vercel)
- **Build**: Zero build process required
- **CDN**: Opcional para assets (ícones, imagens)
- **HTTPS**: Necessário para PWA features futuras

### PWA Evolution Path

```javascript
// Service Worker para cache offline
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('v1').then(cache => cache.addAll(['/']))
  );
});

// Web App Manifest
{
  "name": "Lista de Tarefas",
  "short_name": "Tarefas",
  "display": "standalone",
  "theme_color": "#6c757d"
}
```

## Development Environment

### Prerequisites

- **Browser**: Chrome/Firefox/Safari/Edge modernos
- **Editor**: VS Code (recomendado)
- **Live Server**: Para desenvolvimento local
- **Extensions**: Live Server, Prettier, ESLint (opcional)

### Setup Commands

```bash
# 1. Criar estrutura de pastas
mkdir -p lista-de-tarefas/{styles,components,services,state,utils,assets/icons}

# 2. Criar arquivos base
touch lista-de-tarefas/{index.html,app.js}

# 3. Iniciar desenvolvimento
cd lista-de-tarefas
# Abrir com live server ou python -m http.server
```

## Architecture Decision Records (ADRs)

### ADR-001: JavaScript Vanilla vs Framework

**Status**: Decided
**Context**: Projeto de aprendizagem técnico, simplicidade requerida
**Decision**: JavaScript vanilla com ES6 modules
**Consequences**: Menos abstrações, mais controle, curva de aprendizagem suave

### ADR-002: LocalStorage Schema Unificado

**Status**: Decided
**Context**: Múltiplos dados a persistir, performance crítica
**Decision**: Schema unificado em único objeto JSON
**Consequences**: Backup/restore simplificado, melhor performance, versionamento fácil

### ADR-003: CSS Híbrido Approach

**Status**: Decided
**Context**: Design system definido (shadcn/ui) mas stack vanilla
**Decision**: Variáveis CSS + Tailwind utilitários
**Consequences**: Design consistente, desenvolvimento rápido, flexibilidade mantida

---

_Generated by BMAD Decision Architecture Workflow v1.3.2_
_Date: 2025-12-04_
_For: BMad_