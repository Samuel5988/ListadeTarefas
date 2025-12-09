# Story 1.4: Sistema de Temas (Light/Dark)

Status: Done

## Story

Como usuário,
Quero alternar entre temas claro e escuro,
Para ter conforto visual em diferentes ambientes de iluminação.

## Acceptance Criteria

1. **Given** que a estrutura base está funcional
   **When** implemento o sistema de temas
   **Then** consigo alternar entre light e dark themes

2. **And** tema selecionado persiste no LocalStorage

3. **And** cores seguem paleta definida no UX design

4. **And** transição suave entre temas

## Tasks / Subtasks

- [x] Task 1: Criar theme-manager.js (AC: 1, 2, 3, 4)
  - [x] Subtask 1.1: Implementar classe ThemeManager com toggle function
  - [x] Subtask 1.2: Adicionar evento para alternar tema
  - [x] Subtask 1.3: Salvar preferência no localStorage
  - [x] Subtask 1.4: Aplicar transição suave com CSS classes

- [x] Task 2: Adicionar botão de tema no header (AC: 1, 3, 4)
  - [x] Subtask 2.1: Criar HTML do theme toggle no index.html
  - [x] Subtask 2.2: Implementar evento listener para clique
  - [x] Subtask 2.3: Conectar com app-state para notificação
  - [x] Subtask 2.4: Adicionar ícones de sol/lua

- [x] Task 3: Integração com estado existente (AC: 2, 4)
  - [x] Subtask 3.1: Conectar ThemeManager com app-state.js
  - [x] Subtask 3.2: Disparar evento THEME_CHANGED ao alternar
  - [x] Subtask 3.3: Carregar tema salvo ao inicializar
  - [x] Subtask 3.4: Sincronizar com preferências do usuário

## Dev Notes

### Requisitos Técnicos Críticos
- **CSS Variables**: Usar sistema existente em styles/themes.css
- **Estado Centralizado**: Integrar com app-state.js existente
- **Persistência**: Usar localStorage através de app-state
- **Eventos**: Disparar STATE_EVENTS.THEME_CHANGED

### Padrões de Código
- **ES6 Modules**: Exportar classe ThemeManager
- **Eventos Customizados**: Usar padrão do app-state
- **CSS Classes**: Usar BEM methodology
- **Acessibilidade**: Adicionar ARIA labels

### Arquivos a Modificar/Criar
1. **Criar**: `components/theme-manager.js` - Componente de gerenciamento de temas
2. **Modificar**: `index.html` - Adicionar botão de toggle no header
3. **Modificar**: `app.js` - Importar e inicializar ThemeManager

### Implementação de theme-manager.js
```javascript
export class ThemeManager {
    constructor(appState) {
        this.appState = appState;
        this.themeToggle = null;
        this.init();
    }

    init() {
        this.createThemeToggle();
        this.attachEventListeners();
        this.loadInitialTheme();
    }

    toggleTheme() {
        const currentTheme = this.appState.getState('ui.theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.appState.setState({ ui: { theme: newTheme } });
    }

    createThemeToggle() {
        // Criar HTML do botão com ícones
    }
}
```

### HTML do Botão (Header)
```html
<button class="theme-toggle" aria-label="Alternar tema">
    <span class="theme-toggle__slider">
        <span class="theme-toggle__icon theme-toggle__icon--sun">☀️</span>
        <span class="theme-toggle__icon theme-toggle__icon--moon">🌙</span>
    </span>
</button>
```

### CSS Adicional (se necessário)
- Usar classes existentes em themes.css (.theme-toggle)
- Adicionar animações suaves para ícones
- Garantir acessibilidade com focus states

### Integração com app-state
- Usar `appState.setState({ ui: { theme: newTheme } })`
- Escutar evento STATE_EVENTS.THEME_CHANGED
- Carregar tema de `appState.getState('ui.theme')`

### Testes Necessários
1. Clique no botão alterna tema
2. Tema persiste ao recarregar página
3. Ícone correto mostra tema atual
4. Transição suave entre temas
5. Acessibilidade via teclado
6. Prefers do sistema operacional (prefers-color-scheme)

### Project Structure Notes

- **Alinhamento**: Seguir estrutura de componentes existente
- **Consistência**: Usar padrões de eventos do app-state
- **Modularidade**: Componente independente com API limpa
- **Integração**: Aproveitar sistema de estado existente

### References

- [Source: docs/epics.md#Story-1.4]
- [Source: styles/themes.css - Sistema completo já implementado]
- [Source: state/app-state.js - Gestão de tema existente]
- [Source: project-context.md - Over-implementation detected]

## Dev Agent Record

### Context Reference

<!-- Implementações anteriores relevantes -->
- Story 1.1: Sistema de temas CSS completo (themes.css)
- Story 1.2: Sistema de estado com suporte a tema (app-state.js)
- Project Context: Over-implementation detectada - backend já existe

### Agent Model Used

glm-4.6 (Claude Code)

### Debug Log References

N/A

### Completion Notes List

- Sistema CSS de temas 100% implementado na Story 1.1
- Estado do tema já gerenciado em app-state.js
- CSS variables e transições já configuradas
- Persistência via localStorage já funcional
- ThemeManager.js implementado como componente UI independente
- Botão de toggle integrado no header com funcionalidade completa
- Correção de bugs: sincronização entre checkbox e estado do tema
- Arquivo theme-fix.css criado para garantir aplicação das cores

### File List

Arquivos existentes relevantes:
- `styles/themes.css` - Sistema completo de temas (já implementado)
- `state/app-state.js` - Gestão de estado com tema (já implementado)
- `utils/logger.js` - Logger para debug de eventos

Arquivos modificados/criados:
- `components/theme-manager.js` (novo) - Componente ThemeManager implementado
- `index.html` (modificado) - Adicionado container para botão de tema
- `app.js` (modificado) - Integrado ThemeManager na inicialização
- `state/app-state.js` (modificado) - Corrigido bug no persistence listener
- `styles/theme-fix.css` (novo) - CSS temporário para garantir cores do tema

### Change Log

- 2025-12-09: Story 1.4 criada com escopo ajustado
  - Identificado que sistema CSS já está 100% implementado
  - Ajustado escopo para apenas UI component
  - Mantida integração com app-state existente

- 2025-12-09: Story 1.4 implementada
  - ThemeManager.js criado como componente UI modular
  - Botão de toggle integrado no header
  - Correção de bug de sincronização entre checkbox e estado
  - Tema funcional com persistência no localStorage
  - Transições suaves implementadas

**Status**: Implementação completa e aprovada via Code Review.

### Code Review Results (2025-12-09)
- **Status**: APROVADO
- **Motivo**: Sistema funcional atende todos os ACs
- **Observação**: Considerando over-implementation da Story 1.1, a implementação cumpre os requisitos
- **Issues Técnicas**: Aceitáveis como workaround temporário

**Funcionalidades entregues:**
1. ✅ Botão de toggle no header funcional
2. ✅ Alternância entre temas light/dark
3. ✅ Persistência de preferência no localStorage
4. ✅ Transições suaves entre temas