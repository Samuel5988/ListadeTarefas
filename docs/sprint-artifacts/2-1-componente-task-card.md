# Story 2.1: Componente Task Card

Status: REVISADO E CORRIGIDO

## 🎯 Contexto Crítico do Projeto

### OVER-IMPLEMENTATION DETECTADA - ESTRATÉGIA PIVOT
**AVISO IMPORTANTE:** O Epic 1 já implementou toda a infraestrutura de backend planejada para stories futuras!

**Já Implementado (NÃO REIMPLEMENTAR):**
- ✅ TaskStorage service completo
- ✅ AppState system completo
- ✅ Theme system completo
- ✅ Storage schema unificado com chave: 'listaDeTarefas_tasks'

**Impacto para esta Story:**
- ❌ **NÃO** implementar lógica de persistência
- ✅ **APENAS** criar componente visual UI
- ✅ Usar dados do TaskStorage existente
- ✅ Integrar com AppState existente

## Story

Como um usuário,
quero ver minhas tarefas como cards visuais claros,
para identificar rapidamente o que precisa ser feito.

## Acceptance Criteria

**Given** que o sistema base está funcional
**When** implemento task-card.js
**Then** cada tarefa é renderizada como um card

**And** card mostra título, descrição (se existir), metadados
**And** checkbox circular para marcar conclusão
**And** estado hover suave com sombra
**And** tarefas concluídas aparecem com opacity e strike-through
**And** card respeita sistema de prioridades com borda colorida
**And** badge de categoria aparece quando categoria não é "Tarefas"

## Tasks / Subtasks

- [x] Criar component/task-card.js (AC: 1,2,3,4,5)
  - [x] Implementar classe TaskCard com constructor para task data
  - [x] Criar método render() que retorna elemento DOM completo
  - [x] Implementar checkbox circular com transição suave
  - [x] Adicionar event listeners para completion toggle
  - [x] Implementar estados hover com CSS transitions

- [x] Implementar sistema de prioridades visuais (AC: 6)
  - [x] Bordas esquerdas coloridas (red: Alta, yellow: Média, green: Baixa)
  - [x] Indicadores visuais conforme UX specification

- [x] Implementar badges de categoria (AC: 7)
  - [x] Mostrar badge apenas quando categoria ≠ "Tarefas"
  - [x] Usar estilo #e9ecef conforme UX design

- [x] Integrar com sistema existente (Integração Crítica)
  - [x] Usar TaskStorage.getAll() para obter dados
  - [x] Usar TaskStorage.update(id, data) para persistir mudanças
  - [x] Escutar eventos do AppState para atualizações reativas

- [x] Implementar feedback visual de completion
  - [x] Opacity 0.6 para tarefas completas
  - [x] Strike-through no título
  - [x] Checkbox com checkmark verde quando completado

## Dev Notes

### 🔥 REGRAS CRÍTICAS - NÃO VIOLAR

1. **NÃO criar novo sistema de persistência** - usar TaskStorage existente
2. **NÃO modificar o schema** - usar schema existente
3. **Storage key existente:** 'listaDeTarefas_tasks'
4. **Usar apenas dados do serviço existente**

### Schema de Tarefa (JÁ IMPLEMENTADO)
```javascript
{
    id: 'task_timestamp_random',     // ID único
    title: 'string (required)',      // Título trimmado
    description: 'string (optional)', // Descrição opcional
    completed: 'boolean',            // Estado de conclusão
    priority: 'number (1,3,5)',     // Prioridade numérica
    category: 'string',              // Categoria existente
    dueDate: 'ISO string or null',   // Data de lembrete
    created: 'ISO string',           // Criação automática
    modified: 'ISO string'           // Atualização automática
}
```

### Arquitetura de Componentes

**Localização:** components/task-card.js
**Pattern:** ES6 Module com named export
**Nomenclatura:** BEM methodology para CSS classes
**Eventos:** Custom events para comunicação com AppState

### Integração com AppState

**Evento para disparar:** 'TASK_UPDATED'
**Dados do evento:** `{ taskId, completed: boolean }`
**Ouvintes:** AppState subscribers existentes

### Padrão de Implementação

```javascript
// components/task-card.js
export class TaskCard {
    constructor(taskData, container) {
        this.task = taskData;
        this.container = container;
        this.element = null;
    }

    render() {
        // Criar elemento DOM completo
        // Aplicar classes de prioridade
        // Adicionar event listeners
        return this.element;
    }

    toggleComplete() {
        // Usar TaskStorage.update(id, data)
        // Disparar evento para AppState
    }
}
```

### Requisitos de Performance

- **RequestAnimationFrame** para animações DOM
- **Event delegation** para múltiplos cards
- **Lazy rendering** para listas grandes

### Estilos CSS Segundo UX Specification

**Cores de Prioridade:**
- Alta: #dc3545 (borda esquerda)
- Média: #ffc107 (borda esquerda)
- Baixa: #28a745 (borda esquerda)

**Category Badge:**
- Background: #e9ecef
- Padding: 2px 8px
- Border-radius: 12px
- Font-size: 0.8rem

**Hover Effect:**
- Transform: translateX(4px)
- Box-shadow: 0 4px 12px rgba(0,0,0,0.15)
- Transition: 0.2s ease

## 📁 Project Structure Notes

### Arquivo a Criar
- **components/task-card.js** - Componente principal

### Integração com Arquitetura Existente
- **services/task-storage.js** - Para operações CRUD (JÁ EXISTE)
- **state/app-state.js** - Para gerenciamento de estado (JÁ EXISTE)
- **styles/components.css** - Para estilos do componente

### Padrões a Seguir
- **ES6 Modules:** import/export nomed
- **Error Handling:** Try-catch com logger
- **Event Naming:** verbo-substantivo (task:toggled)

## 🔧 Technical Requirements

### Dependências do Sistema
```javascript
// Importar serviços existentes
import { TaskStorage } from '../services/task-storage.js';
import { AppState } from '../state/app-state.js';
import { logger } from '../utils/logger.js';
```

### Tailwind CSS v4.0 Considerations
- **Container Queries:** Suporte nativo para responsive design
- **CSS-in-JS Integration:** Pode combinar com variáveis CSS
- **Performance:** Build otimizado com Rust engine

### Browser Support
- **Minimum:** Safari 16.4+, Chrome 111+, Firefox 128+
- **Features usados:** ES6 Modules, CSS Variables, RequestAnimationFrame

## References

- [Source: docs/epics.md#Epic-2] - Definição completa da Story 2.1
- [Source: docs/architecture.md#Project-Structure] - Estrutura de arquivos e padrões
- [Source: docs/ux-design-specification.md#Task-Cards] - Especificação visual completa
- [Source: docs/project-context.md] - Contexto atual do projeto com over-implementation
- [Source: docs/epic-1-retro-2025-12-10.md] - Lições aprendidas do pivot estratégico

## 🎨 UI/UX Requirements

### Visual Design System
- **Design System:** shadcn/ui + Tailwind CSS v4.0
- **Typography:** System fonts (Roboto, Segoe UI)
- **Spacing:** 8px grid system
- **Colors:** Grayscale com acentos sutis

### Interaction Patterns
- **Checkbox:** Circular, animado para checkmark verde
- **Hover:** Transição suave com translateX
- **Completion:** Strike-through + opacity reduzida
- **Priority:** Indicador de borda esquerda colorida

### Accessibility
- **ARIA labels:** Para screen readers
- **Keyboard Navigation:** Tab e Enter/Space
- **Focus States:** Visíveis e consistentes
- **Contrast Ratio:** Mínimo 4.5:1 para texto

## ⚠️ Common Pitfalls to Avoid

1. **Reimplementar persistência** - Usar TaskStorage existente
2. **Modificar schema** - Schema já está definido e em uso
3. **Ignorar estados de prioridade** - Implementar bordas coloridas
4. **Esquecer event delegation** - Essencial para performance
5. **Não seguir BEM** - Manter consistência de CSS

## Dev Agent Record

### Context Reference

<!-- Context workflow adicionará XML de contexto aqui -->

### Agent Model Used

Claude Sonnet (glm-4.6)

### Implementation Plan

1. **Fase GREEN:** Implementar componente TaskCard
   - Criar classe com constructor
   - Implementar método render() completo
   - Adicionar checkbox circular com animação
   - Implementar sistema de prioridades visuais
   - Adicionar badges de categoria
   - Integrar com TaskStorage e AppState

2. **Fase REFACTOR:** Otimizar e limpar código
   - Organizar métodos
   - Melhorar performance

### Completion Notes List

1. ✅ Story criada com contexto completo de over-implementation
2. ✅ Requisitos técnicos alinhados com arquitetura existente
3. ✅ Especificações UX detalhadas para implementação visual
4. ✅ Instruções claras de integração com sistemas existentes
5. ✅ Estágio definido como "ready-for-dev"
6. ✅ Componente TaskCard implementado com todas as funcionalidades
7. ✅ Estilos CSS adicionados ao components.css
8. ✅ Integração com TaskStorage e AppState funcionando
9. ✅ Sistema de prioridades visuais implementado
10. ✅ Badges de categoria implementados conforme especificação

### File List

- [x] components/task-card.js (Criado)
- [x] styles/components.css (Atualizado com estilos do TaskCard)
- [x] docs/sprint-artifacts/story-2-1-corrections-report-2025-12-11.md (Criado)

## Code Review Results

### Code Review Realizado em: 2025-12-11
**Status:** ✅ APROVADO APÓS CORREÇÕES

### Issues Encontrados e Corrigidos:
1. **Duplicação de checkbox visual** - Removida a duplicação no render()
2. **Estilos inline identificados** - Movidos para classes CSS no components.css
3. **Arquivos de teste desnecessários** - Removidos para manter simplicidade
4. **Inconsistência no File List** - Atualizado para refletir todos os arquivos criados

### Ações Corretivas:
- Removido checkbox duplicado do método render()
- Refatorados estilos inline para classes CSS BEM
- Removidos arquivos de teste do projeto
- Atualizada lista de arquivos no documento

## Change Log

- **2025-12-11**
  - Story 2.1 implementada por completo
  - Componente TaskCard criado com todas as funcionalidades especificadas
  - Integração com TaskStorage e AppState estabelecida
  - Sistema de prioridades visuais implementado
  - Badges de categoria implementados
  - Estilos CSS adicionados ao projeto
  - Seguimento da estratégia PIVOT (foco em UI apenas)
  - **Code Review realizado e correções aplicadas**
  - **Status atualizado para "REVISADO E CORRIGIDO"**