# Fluxo 1 — comparação sonora guiada do clima

Etapa concluída em 15/11/2026, na branch local `feat/guided-climate-comparison`, criada a partir de `main` em `5932505`. A `main` e os remotos não recebem as alterações desta etapa.

## Como abrir

Com o projeto em execução, abra `/experiences/climate` e use **Comparar períodos pelo som**. A página nova é `/experiences/climate/compare`.

O percurso tem quatro passos:

1. Conhecer a escala, ouvir a referência de 440 Hz e, opcionalmente, as instruções em voz alta.
2. Escolher períodos de 5, 10, 20 ou 30 anos, sempre com a mesma duração em A e B.
3. Ouvir A e B, pausar, retomar, parar, ajustar velocidade/volume, navegar por ano pelo teclado e ouvir o ano selecionado.
4. Consultar a diferença das médias, ouvir o resultado, ver o gráfico com eixo compartilhado e consultar a tabela completa.

As opções e as instruções existem em português e inglês. A leitura em voz alta usa a API do navegador, mediante pedido do usuário. O texto permanece disponível quando esse recurso não existe ou falha.

## Dados e método

A comparação reutiliza os dados GISTEMP já carregados pelo AppProvider; não adiciona uma fonte nem uma consulta externa separada. Usa apenas anos com exatamente um valor finito para cada um dos 12 meses. Duplicatas e anos incompletos são excluídos, sem preencher lacunas.

Cada nota representa a média aritmética dos 12 valores mensais de um ano. A média de cada período dá o mesmo peso aos anos completos. Os valores são anomalias em °C em relação a 1951–1980. A diferença apresentada é **B menos A**.

A frequência permanece `440 × 2^(anomalia / 4)` em ambos os períodos, sem normalização individual. Uma mesma anomalia gera a mesma frequência em A e B. O gráfico também compartilha o eixo vertical; o eixo horizontal representa a posição relativa do ano no período.

O recorte padrão verificado foi **1880–1889 / 2016–2025**, com diferença calculada de **1,22625 °C**. O fim de 2026 não entra na comparação porque o arquivo verificado ainda não tem os 12 meses desse ano. Os intervalos padrão acompanham os anos completos dos dados disponíveis, sem fixar 2025 no código.

## Validação executada

- Os dez scripts de `npm test` passaram, incluindo o novo teste de médias, lacunas, duplicatas, períodos iguais e aplicação da escala sonora aos dados GISTEMP publicados.
- Build de produção passou, com compilação e verificação de tipos. Foi executado em uma cópia isolada para não disputar `.next` com o desenvolvimento. A rota nova tem 8,71 kB e 129 kB de primeiro carregamento segundo esse build.
- Dezesseis cenários funcionais passaram no Chrome: entrada pelo clima e encerramento do player anterior, ausência de autoplay, referência real de 440 Hz, comparação das frequências reais dos osciladores com um cálculo independente dos valores mensais recebidos, conclusão de A/B, cálculo da diferença, teclado, foco visível, navegação por ano, equivalência de frequências entre períodos, parada imediata de reprodução pendente, troca de idioma, cancelamento na saída e tratamento de falhas de dados.
- Dois cenários adicionais passaram: falha de AudioContext com mensagem de recuperação e valores fora da faixa sonora. Frequências indisponíveis aparecem como traço, nunca como zero inventado.
- Quatro estados passaram pelo axe nos critérios automatizáveis WCAG 2 A/AA, 2.1 AA e 2.2 AA: português e inglês em desktop, português em 390 px e português em 320 px com texto a 200%, alto contraste e movimento reduzido. Nenhuma violação detectada e nenhuma rolagem horizontal da página. A tabela mantém sua própria área de rolagem, acessível por teclado.
- Sem erros de JavaScript registrados nos cenários funcionais e de auditoria.

A ampliação testada foi o tamanho do texto via CSS, não o zoom nativo do navegador. A síntese de fala foi instrumentada para verificar conteúdo, idioma e cancelamento. Não foi um teste de pronúncia nem de VoiceOver/NVDA real. O SDK externo do VLibras foi simulado durante a auditoria desta funcionalidade; os resultados não são uma auditoria do próprio tradutor. Falhas de rede, dados incompletos e valores extremos foram simulados e estão marcados como `fixture` nos resultados.

Esta é uma validação técnica reproduzível, não certificação WCAG nem validação de compreensão com pessoas cegas ou com baixa visão.

## Evidências

- [Cenários funcionais](../../artifacts/comparison-flow/functional.json)
- [Cenários extremos](../../artifacts/comparison-flow/edge-cases.json)
- [Auditoria automática](../../artifacts/comparison-flow/accessibility.json)
- [Árvore acessível em português](../../artifacts/comparison-flow/aria-pt.yml) e [em inglês](../../artifacts/comparison-flow/aria-en.yml)
- [Print desktop PT](../../artifacts/comparison-flow/pt-desktop.png), [desktop EN](../../artifacts/comparison-flow/en-desktop.png), [celular](../../artifacts/comparison-flow/pt-mobile.png) e [320 px com texto a 200%](../../artifacts/comparison-flow/pt-320-text-200.png)
- [Saída do build](../../artifacts/comparison-flow/build.txt) e [dos testes](../../artifacts/comparison-flow/tests.txt)

## Repetir os testes

`npm test` executa os testes do repositório. `npm run build` gera a versão de produção. Evite executar build e dev usando o mesmo `.next` ao mesmo tempo.

Os scripts de navegador em `artifacts/comparison-flow` requerem Playwright e `@axe-core/playwright`. Nesta sessão eles já estavam instalados fora do projeto, em `/tmp/sulco-browser/node_modules`.

```sh
NODE_PATH=/tmp/sulco-browser/node_modules COMPARE_ORIGIN=http://localhost:3000 node artifacts/comparison-flow/verify.cjs
NODE_PATH=/tmp/sulco-browser/node_modules COMPARE_ORIGIN=http://localhost:3000 COMPARE_AUDIT=1 node artifacts/comparison-flow/verify.cjs
NODE_PATH=/tmp/sulco-browser/node_modules COMPARE_ORIGIN=http://localhost:3000 node artifacts/comparison-flow/verify-edge.cjs
```

`CHROME_PATH` permite indicar outro executável do Chrome. As credenciais locais não foram copiadas para a prévia de validação nem incluídas nos artefatos.

## Retomada

O próximo fluxo não foi iniciado. Retomar desta branch e ler este registro antes de mudar o escopo. Manter a restrição do usuário: **não publicar na main**. O material anterior de vídeo, em `artifacts/video-tour`, já estava sem rastreamento antes desta etapa e não faz parte deste commit.
