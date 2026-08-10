# Painel de Contratos — Cabo Eleitoral (100% navegador)

Versão do painel que roda **inteiramente no navegador**, sem servidor. Ideal para hospedar de graça no GitHub Pages.

## O que muda em relação à versão com Flask

- **Sem PDF automático.** A geração do PDF dependia do Word instalado no servidor (via COM), o que só funciona no Windows. Aqui você gera o **Word (.docx)** e, se precisar do PDF, abre o arquivo e usa "Salvar como PDF" no Word, Google Docs ou LibreOffice.
- **Nenhum dado sai do seu computador.** Todo o preenchimento do modelo e a leitura da planilha acontecem em JavaScript, direto no navegador de quem estiver usando.
- **Sem servidor para manter ligado.** Uma vez publicado no GitHub Pages, o link funciona 24/7 sozinho.

## Estrutura

```
painel-web/
  index.html          → a página do painel
  app.js               → toda a lógica (preenchimento, planilha, download)
  modelo/
    modelo_contrato.docx   → modelo do contrato com os marcadores {{ }}
  libs/                 → bibliotecas de terceiros (já incluídas, não precisa baixar nada)
    pizzip.min.js
    docxtemplater.js
    jszip.min.js
    xlsx.full.min.js
```

## Como testar localmente antes de publicar

Não dá para abrir o `index.html` direto clicando duas vezes (o navegador bloqueia o carregamento do modelo por segurança). É preciso servir os arquivos por http. Com Python instalado:

```bash
cd painel-web
python -m http.server 8090
```

Depois abra `http://127.0.0.1:8090` no navegador.

## Como publicar no GitHub Pages (grátis, para sempre)

1. Crie um repositório novo no GitHub (pode ser privado ou público).
2. Suba a pasta `painel-web` inteira para esse repositório (pode ser só o conteúdo dela na raiz, ou numa subpasta — ajuste o passo 4 conforme escolher).
3. No repositório, vá em **Settings → Pages**.
4. Em "Build and deployment", escolha **Deploy from a branch**, selecione a branch `main` e a pasta (`/root` ou `/painel-web`, dependendo de onde você colocou os arquivos).
5. Salve. Em alguns minutos o GitHub mostra o link (algo como `https://seu-usuario.github.io/nome-do-repo/`).

Pronto — esse link funciona para qualquer pessoa, a qualquer hora, sem precisar do seu computador ligado.

## Atualizando o modelo do contrato

Se o modelo do Word mudar, é só substituir `modelo/modelo_contrato.docx` (mantendo os mesmos marcadores `{{ nome }}`, `{{ cpf }}` etc.) e subir a alteração pro GitHub — o site atualiza sozinho.

## Sobre dados sensíveis (CPF, RG, título de eleitor)

Como o formulário coleta dados sensíveis, se for publicar num link público, considere:
- Deixar o repositório **privado** no GitHub (o GitHub Pages de repositório privado exige um plano pago para ser público mesmo sendo privado — nesse caso avalie um link "não listado" e não divulgado, já que não há login).
- Ou restringir o acesso por fora (ex.: só compartilhar o link com quem precisa, sem indexação em buscadores).

Nenhum dado é enviado a servidores — a única "saída" de dados é o próprio arquivo Word que o navegador baixa na máquina de quem preencheu.
