# Guia de Desenvolvimento - Lista de Tarefas

## Setup do Ambiente

### Pré-requisitos
- Git instalado
- Editor de código (recomendado: VS Code)
- Navegador moderno com suporte a ES6+
- Node.js (opcional, para live server)

### Configuração Inicial

1. **Clone o repositório:**
   ```bash
   git clone <url-do-repositorio>
   cd ListadeTarefas
   ```

2. **Abra no editor de código**
   ```bash
   code .
   ```

3. **Inicie um servidor local:**

   **Opção A - VS Code Live Server:**
   - Instale a extensão "Live Server"
   - Clique com o botão direito em `index.html`
   - Selecione "Open with Live Server"

   **Opção B - Python:**
   ```bash
   python -m http.server 8000
   # Acesse http://localhost:8000
   ```

   **Opção C - Node.js (se instalado):**
   ```bash
   npx serve .
   # Acesse http://localhost:3000
   ```

## Estrutura do Projeto

```
ListadeTarefas/
├── index.html          # Página principal
├── css/
│   └── styles.css      # Estilos com Tailwind
├── js/
│   ├── app.js          # Lógica principal da aplicação
│   ├── storage.js      # Funções do LocalStorage
│   └── ui.js           # Manipulação do DOM
├── docs/               # Documentação
│   ├── API.md          # Documentação da API interna
│   └── DEVELOPMENT.md  # Este arquivo
└── README.md           # README do projeto
```

## Tecnologias Utilizadas

### HTML5
- Tags semânticas (`<header>`, `<main>`, `<section>`, `<article>`)
- Formulários com validação nativa
- Data attributes para referências de elementos

### CSS3 com Tailwind V4
- Framework de utility-first CSS
- CDN via `<script>` (não requer build)
- Classes responsivas e de design

### JavaScript Vanilla (ES6+)
- Módulos com `import/export`
- Async/await para operações assíncronas
- Arrow functions e template literals
- Classes para organização do código

## Fluxo de Desenvolvimento

### 1. Desenvolvimento Local
```bash
# 1. Crie uma branch para sua feature
git checkout -b feature/nova-funcionalidade

# 2. Faça as alterações no código
# Edite os arquivos necessários

# 3. Teste no navegador
# Abra http://localhost:8000 e verifique as mudanças

# 4. Commit das mudanças
git add .
git commit -m "feat: adicionar nova funcionalidade"

# 5. Push para o repositório
git push origin feature/nova-funcionalidade
```

### 2. Code Review
- Abra um Pull Request no GitHub
- Aguarde review e aprovação
- Faça os ajustes necessários
- Mergie na branch `main`

### 3. Deploy Automático
- Com o GitHub Pages configurado, o deploy é automático
- A cada push para `main`, o site é atualizado

## Convenções de Código

### JavaScript
```javascript
// Use const/let, nunca var
const API_URL = 'https://api.example.com';
let currentFilter = 'all';

// Funções com nomes descritivos
function createTaskElement(task) {
  // implementação
}

// Classes com PascalCase
class TaskManager {
  constructor() {
    this.tasks = [];
  }

  addTask(task) {
    // implementação
  }
}
```

### Comentários
```javascript
/**
 * Calcula a prioridade de uma tarefa baseado na data e importância
 * @param {Object} task - Objeto da tarefa
 * @param {Date} task.dueDate - Data de vencimento
 * @param {string} task.importance - Nível de importância
 * @returns {number} Pontuação de prioridade (0-10)
 */
function calculatePriority(task) {
  // TODO: Implementar lógica de cálculo
  // FIXME: Corrigir edge case com datas passadas
}
```

## Boas Práticas

### Performance
- Evite manipulações diretas e excessivas do DOM
- Use `debounce` para eventos frequentes (scroll, resize)
- Cache elementos DOM quando utilizados múltiplas vezes

### Segurança
- Não armazene dados sensíveis no LocalStorage
- Valide sempre dados de entradas do usuário
- Use `textContent` em vez de `innerHTML` quando possível

### Acessibilidade
- Use elementos semânticos HTML5
- Adicione ARIA labels quando necessário
- Garanta navegação por teclado

## Debug

### Console Errors
Sempre verifique o console do navegador (F12) por erros:

```javascript
// Debug logging
console.log('Estado atual:', tasks);
console.error('Erro ao salvar tarefa:', error);
console.warn('Aviso: Storage quase cheio');
```

### Chrome DevTools
- **Elements**: Inspecione e modifique DOM/CSS
- **Console**: Execute JavaScript e visualize erros
- **Application**: Inspecione LocalStorage, SessionStorage, Cookies
- **Network**: Monitore requisições (se adicionadas)

### Ferramentas Úteis
- **Vue.js devtools**: Para debugging de reatividade (se usar Vue)
- **React Developer Tools**: Se usar React
- **Prettier**: Para formatação de código
- **ESLint**: Para linting e identificação de erros

## Contribuição

### Antes de Contribuir
1. Leia a documentação existente
2. Entenda o fluxo de trabalho do projeto
3. Verifique issues abertas para evitar duplicação

### Criando uma Nova Feature
1. Abra uma issue descrevendo a feature
2. Crie uma branch a partir de `main`
3. Implemente com testes (se aplicável)
4. Atualize a documentação
5. Abra um Pull Request

### Reportando Bugs
1. Verifique se o bug já foi reportado
2. Crie uma issue com:
   - Passos para reproduzir
   - Comportamento esperado vs atual
   - Screenshots se aplicável
   - Informações do navegador/OS

## Recursos Adicionais

### Documentação
- [MDN Web Docs](https://developer.mozilla.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [JavaScript Info](https://javascript.info/)

### Ferramentas Online
- [CodePen](https://codepen.io/) - Para experimentos rápidos
- [JSFiddle](https://jsfiddle.net/) - Testes de código
- [Can I Use](https://caniuse.com/) - Suporte de browser

### Extensões Recomendadas (VS Code)
- Live Server
- Prettier
- ESLint
- Tailwind CSS IntelliSense
- Auto Rename Tag
- Bracket Pair Colorizer