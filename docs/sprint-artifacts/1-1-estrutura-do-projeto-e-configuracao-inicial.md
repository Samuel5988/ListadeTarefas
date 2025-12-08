# Story 1.1: Estrutura do Projeto e Configuração Inicial

Status: Done

## Story

Como desenvolvedor iniciante,
Quero configurar a estrutura básica do projeto com HTML, CSS e JavaScript,
Para ter uma base organizada para o desenvolvimento.

## Acceptance Criteria

1. **Given** que estou começando um novo projeto
   **When** crio a estrutura de pastas e arquivos iniciais
   **Then** tenho uma organização clara seguindo a arquitetura definida

2. **And** todos os arquivos básicos estão criados (index.html, app.js, estrutura de pastas)

3. **And** o projeto abre no navegador sem erros

4. **And** Live Server está configurado para desenvolvimento

## Tasks / Subtasks

- [x] Task 1: Criar estrutura de pastas (AC: 1)
  - [x] Subtask 1.1: Criar pasta styles/ com arquivos CSS base
  - [x] Subtask 1.2: Criar pasta components/ para futuros componentes
  - [x] Subtask 1.3: Criar pasta services/ para lógica de negócio
  - [x] Subtask 1.4: Criar pasta state/ para gerenciamento de estado
  - [x] Subtask 1.5: Criar pasta utils/ para utilitários
  - [x] Subtask 1.6: Criar pasta assets/icons/ para recursos estáticos

- [x] Task 2: Implementar index.html (AC: 2, 3)
  - [x] Subtask 2.1: Criar estrutura HTML5 semântica
  - [x] Subtask 2.2: Adicionar links para arquivos CSS
  - [x] Subtask 2.3: Configurar script tag com type="module"
  - [x] Subtask 2.4: Adicionar Tailwind CSS via CDN

- [x] Task 3: Implementar arquivos CSS base (AC: 2, 3)
  - [x] Subtask 3.1: Criar styles/base.css com variáveis CSS e reset
  - [x] Subtask 3.2: Criar styles/components.css para estilos de componentes
  - [x] Subtask 3.3: Criar styles/themes.css para sistema de temas
  - [x] Subtask 3.4: Criar styles/responsive.css para media queries

- [x] Task 4: Implementar módulos JavaScript (AC: 2, 3)
  - [x] Subtask 4.1: Criar app.js como ponto de entrada principal
  - [x] Subtask 4.2: Criar state/app-state.js para gerenciamento de estado
  - [x] Subtask 4.3: Criar services/task-storage.js para persistência
  - [x] Subtask 4.4: Criar utils/logger.js para sistema de logging

- [x] Task 5: Configurar ambiente de desenvolvimento (AC: 4)
  - [x] Subtask 5.1: Instalar e configurar Live Server no VS Code
  - [x] Subtask 5.2: Testar auto-refresh funcionalidade
  - [x] Subtask 5.3: Verificar console do navegador para erros

## Dev Notes

### Requisitos Técnicos Críticos
- **HTML5**: Semântico, acessível, com atributos ARIA
- **CSS3**: Variáveis customizadas, Flexbox/Grid, transições suaves
- **JavaScript**: ES6+ modules, async/await, error handling robusto
- **Tailwind CSS**: v4.0-alpha via CDN (https://cdn.tailwindcss.com)
- **Design System**: Seguir referência shadcn/ui

### Padrões de Código
- **Nomenclatura**:
  - Arquivos: kebab-case (ex: task-card.js)
  - Funções/Variáveis: camelCase (ex: createTask)
  - Classes: PascalCase (ex: TaskManager)
  - CSS Classes: BEM methodology (.task-card__title)
- **Imports**: Named exports preferencialmente
- **Error Handling**: Try-catch com fallback seguro
- **Events**: Padrão verbo-substantivo (task:created)

#### Estrutura de Módulos ES6 (CRÍTICO)
- **Exports**: Cada módulo deve usar named exports (ex: `export class TaskManager`)
- **Imports**: Usar import statements desestruturados
- **Circular Dependencies**: Evitar imports circulares entre módulos
- **Module Type**: Todos os scripts devem usar `type="module"` no HTML

### Estrutura de Arquivos Obrigatória
```
lista-de-tarefas/
├── index.html                     # Ponto de entrada
├── styles/                        # Sistema visual
│   ├── base.css                  # Fundamentos (cores, tipografia)
│   ├── components.css            # Estilos dos componentes
│   ├── themes.css               # Variáveis de tema (light/dark)
│   └── responsive.css           # Media queries
├── components/                    # UI Components (vazio por enquanto)
├── services/                      # Lógica de negócio
│   └── task-storage.js           # Camada de persistência
├── state/                         # Gerenciamento de estado
│   └── app-state.js              # Estado centralizado
├── utils/                         # Utilitários
│   └── logger.js                 # Sistema de logging
├── assets/                        # Recursos estáticos
│   └── icons/                    # Ícones SVG (vazio por enquanto)
└── app.js                        # Orquestrador principal
```

### Sistema de Cores (CSS Variables)
```css
:root {
    --primary: #6c757d;
    --primary-dark: #495057;
    --primary-light: #868e96;
    --success: #28a745;
    --warning: #ffc107;
    --error: #dc3545;
    --gray-1: #ffffff;
    --gray-2: #f8f9fa;
    --gray-3: #e9ecef;
    --gray-4: #dee2e6;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.12);
    --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
    --transition: all 0.3s ease;
}
```

### Implementação de app.js
- Deve usar ES6 modules para imports
- Implementar classe TaskApp como orchestrator
- Configurar tratamento global de erros
- Adicionar logging para debug
- Disparar inicialização apenas quando DOM estiver ready

### Testes Necessários
1. Abrir index.html no navegador (deve funcionar sem erros)
2. Verificar console do navegador (nenhum erro)
3. Validar HTML no W3C Validator
4. Testar responsividade em diferentes tamanhos
5. Verificar se Live Server atualiza automaticamente

### Considerações de Performance
- Usar requestAnimationFrame para atualizações de DOM
- Implementar lazy loading para módulos futuros
- Minimizar reflows e repaints
- Usar CSS transforms para animações

### Segurança
- Sanitizar todos os inputs futuros
- Usar Content Security Policy headers
- Evitar inline scripts e styles
- Implementar XSS prevention

### Acessibilidade
- Usar elementos semânticos HTML5
- Adicionar atributos ARIA apropriados
- Garantir contraste de cores WCAG AA
- Suportar navegação por teclado

### Project Structure Notes

- **Alinhamento Estrito**: Seguir exatamente a estrutura definida em architecture.md
- **Consistência**: Manter padrões de nomenclatura em todos os arquivos
- **Modularidade**: Cada módulo deve ter responsabilidade única
- **Extensibilidade**: Estrutura deve suportar crescimento futuro

### References

- [Source: docs/epics.md#Epic-1]
- [Source: docs/architecture.md#Stack-Tecnológico]
- [Source: docs/architecture.md#Estrutura-de-Arquivos]
- [Source: docs/ux-design-specification.md#Cores-e-Tipografia]

## Code Review Summary

**Data da Review:** 2025-12-07
**Reviewer:** Dev Agent (Code Review Workflow)
 **Status:** APROVADO

### Issues Encontradas
- **Medium (2):**
  1. Versão do Tailwind CSS não específica no CDN
  2. Data inconsistente no footer (2024 vs 2025)
- **Low (1):** Magic number em timeout de inicialização

### Action Items Criados
- [ ] [CI/LOW] Atualizar footer para © 2025 [index.html:44]
- [ ] [CI/MED] Especificar versão do Tailwind CSS no CDN [index.html:10]
- [ ] [CI/LOW] Extrair timeout para constante configurável [app.js:110]

### Notas da Review
- Todos os Acceptance Criteria implementados ✓
- Tasks/Subtasks completadas com sucesso ✓
- Qualidade do código sólida, bem estruturada
- Arquivos todos commitados e versionados
- Projeta pronta para próxima story

## Dev Agent Record

### Context Reference

<!-- N/A - Esta é a primeira história, não há contexto prévio -->

### Agent Model Used

glm-4.6 (Claude Code)

### Debug Log References

N/A

### Completion Notes List

- Estrutura base criada conforme especificação da arquitetura
- Todos os arquivos inicializados com comentários explicativos
- Configuração ES6 modules implementada
- Sistema de logging básico funcional
- Tratamento de erros globais configurado
- Sistema de temas light/dark implementado
- Gerenciamento de estado centralizado funcional
- Camada de persistência local configurada
- Design system baseado em Tailwind CSS implementado
- Layout responsivo preparado para diferentes dispositivos

### File List

Arquivos criados/alterados:
- `index.html` (novo) - Página principal com estrutura semântica HTML5
- `styles/base.css` (novo) - CSS reset, variáveis customizadas e estilos base
- `styles/components.css` (novo) - Componentes UI reutilizáveis
- `styles/themes.css` (novo) - Sistema de temas light/dark com toggle
- `styles/responsive.css` (novo) - Media queries para todos os breakpoints
- `app.js` (novo) - Orquestrador principal com tratamento de erros
- `state/app-state.js` (novo) - Gerenciamento centralizado de estado
- `services/task-storage.js` (novo) - Camada de persistência com validação
- `utils/logger.js` (novo) - Sistema de logging configurável
- `assets/icons/` (nova pasta, vazia por enquanto) - Diretório para ícones SVG

### Change Log

- 2025-12-07: Estrutura inicial do projeto implementada
  - Criada estrutura de pastas conforme arquitetura definida
  - Implementados todos os arquivos CSS base com sistema de temas
  - Desenvolvida estrutura modular JavaScript com ES6 modules
  - Configurado ambiente de desenvolvimento com Live Server

**IMPORTANTE**: Cada arquivo .js deve usar:
```javascript
// Exportar classes/funções
export class MinhaClasse {}
export function minhaFuncao() {}

// Importar em outros arquivos
import { MinhaClasse, minhaFuncao } from './state/app-state.js'
```