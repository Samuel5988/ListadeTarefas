# Como Configurar GitHub Pages

Este guia explica como configurar o deploy automático do seu projeto no GitHub Pages.

## Passo a Passo

### 1. Acesse as Configurações do Repositório

1. Abra seu repositório no GitHub
2. Clique na aba **Settings**
3. No menu lateral esquerdo, procure por **Pages** (em "Code and automation")

### 2. Configure o GitHub Pages

1. Na seção "Build and deployment", em **Source**, selecione:
   - **Deploy from a branch**

2. Em **Branch**, selecione:
   - **Branch**: `main`
   - **Folder**: `/ (root)`

3. Clique em **Save**

### 3. Aguarde o Deploy

- Após salvar, o GitHub irá mostrar: "Your site is ready to be published at..."
- O deploy inicial pode levar alguns minutos (geralmente 2-10 minutos)
- Você verá o status do deploy na mesma página

### 4. Acesse seu Site

Quando o deploy estiver concluído, seu site estará disponível em:
```
https://[seu-username].github.io/ListadeTarefas
```

## Deploy Automático

Com esta configuração:
- **Todo push** para a branch `main` acionará um novo deploy automaticamente
- **Não é necessário** fazer nenhuma configuração adicional
- **O site atualiza** em poucos minutos após cada push

## Estrutura de Arquivos Esperada

Para que o GitHub Pages funcione corretamente, garanta que seu projeto tenha:

```
ListadeTarefas/
├── index.html          # Página principal (obrigatório)
├── css/
│   └── styles.css      # Estilos
├── js/
│   └── *.js            # Scripts
├── assets/             # Imagens, icons, etc.
├── docs/               # Documentação (opcional)
└── README.md           # README do projeto
```

## Dicas Importantes

### Caminhos Relativos
Use sempre caminhos relativos nos seus arquivos:

```html
<!-- ✅ CORRETO -->
<link rel="stylesheet" href="css/styles.css">
<script src="js/app.js"></script>

<!-- ❌ ERRADO -->
<link rel="stylesheet" href="/ListadeTarefas/css/styles.css">
```

### LocalStorage e GitHub Pages
- ✅ O LocalStorage **funciona perfeitamente** no GitHub Pages
- ✅ Os dados são salvos no navegador do usuário
- ✅ Cada usuário/dispotivo tem seus próprios dados

### HTTPS
Seu site será servido automaticamente via HTTPS, o que é excelente para segurança.

## Troubleshooting

### Erro 404
Se após o deploy você receber erro 404:
1. Verifique se `index.html` existe na raiz do projeto
2. Confirme que a branch selecionada é `main`
3. Aguarde mais alguns minutos (pode haver delay)

### Site não atualiza após push
1. Verifique o status do deploy na página de Settings > Pages
2. Limpe o cache do navegador (Ctrl+F5)
3. Aguarde até 10 minutos para o deploy completar

### Recursos não carregam (CSS/JS/Imagens)
1. Verifique os caminhos no HTML (sejam relativos)
2. Confirme se os arquivos estão no repositório
3. Use o console do navegador (F12) para identificar erros 404

## Comandos Úteis

### Verificar status do último deploy
```bash
curl -I https://[seu-username].github.io/ListadeTarefas
```

### Forçar novo deploy (se necessário)
Se precisar forçar um novo deploy:
```bash
# Faça um commit trivial
git commit --allow-empty -m "trigger redeploy"
git push origin main
```

## Personalizações Avançadas

### Custom Domain (Opcional)
Se tiver um domínio próprio:

1. Adicione arquivo `CNAME` na raiz:
   ```
   www.seudominio.com
   ```

2. Configure DNS nas configurações do seu domínio

3. No GitHub Pages Settings, adicione o custom domain

### Google Analytics (Opcional)
Para adicionar analytics:
1. Crie uma conta no Google Analytics
2. Adicione o script no `index.html`:
   ```html
   <!-- Google Analytics -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'GA_MEASUREMENT_ID');
   </script>
   ```

## Resumo Rápido

1. Settings → Pages
2. Source: Deploy from a branch
3. Branch: main / (root)
4. Save
5. Aguardar deploy
6. Acessar: `https://[username].github.io/ListadeTarefas`

É isso! Seu projeto estará online e atualizando automaticamente a cada commit.