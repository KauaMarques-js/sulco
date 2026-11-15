# Auditoria de APIs, áudio e acessibilidade — 15/11/2026

A `main` local e `origin/main` estavam em `d3f0b01`, sem divergência, na consulta ao GitHub. Essa base foi incorporada à branch de trabalho `feat/nasa-discover-earth`. As alterações desta auditoria são feitas nessa branch.

## O que mudou

- Respostas das fontes passam pelo parser antes de entrar no cache. Um HTTP 200 com HTML, JSON inválido ou conteúdo incompatível não bloqueia a recuperação durante o TTL.
- A chamada externa usa `no-store`: o cache da aplicação só admite dados validados, evitando que uma segunda camada retenha uma resposta inválida. Os TTLs permanecem iguais. O cache é limitado a 32 entradas/16 MB e reúne consultas simultâneas ao mesmo endereço; reinícios e novas instâncias precisam consultar as fontes novamente.
- Datas de obtenção permanecem estáveis quando a resposta vem do cache. Para FIRMS, `sourceFetchedAt` identifica a obtenção mais antiga dos lotes usados; `collectedAt` continua identificando a montagem da consulta.
- Consultas de clima e metadados anteriores são canceladas ao recarregar, trocar a versão da espiral ou sair da página. Uma resposta antiga não substitui a seleção atual.
- Pausar, parar e navegar cancelam também notas já agendadas. Uma inicialização de áudio pendente não reinicia a reprodução depois de pausar/parar.
- O painel de acessibilidade fecha com Escape, devolve o foco e agora mantém a navegação Tab/Shift+Tab entre seus controles. O teste encontrou uma passagem do último controle para a barra do navegador e confirmou a correção.
- O carregamento de FIRMS anuncia seu estado. Campos numéricos vazios da NOAA, datas impossíveis e coordenadas inválidas são descartados, sem criar valores zero.
- `npm run dev` impede um segundo servidor no mesmo checkout. Foram encontrados dois servidores compartilhando `.next`; a proteção foi verificada com a recusa da segunda inicialização.

Os recortes científicos, as fórmulas de agregação, as frequências musicais, os limites de pontos do mapa e os produtos consultados foram preservados.

## Consultas reais e tempos observados

Build de produção isolado, Chrome headless, português, horário de Cuiabá. Valores de uma execução local; não são percentis de produção nem garantia de latência. As capturas foram feitas depois das consultas, com o cache aquecido.

| Fonte/recorte | Primeira consulta nesta execução | Repetição com cache | Registros/amostras |
| --- | ---: | ---: | ---: |
| GISTEMP remoto | 1.273 ms | 18 ms | 1.762 meses |
| Disponibilidade FIRMS | 845 ms | 8 ms | 2 produtos |
| FIRMS MT, SNPP + NOAA21, 10 dias | 2.218 ms | 59 ms | 6.594 detecções |
| NOAA global, 7 dias | 709 ms | 14 ms | 287 |
| NOAA costa brasileira, 7 dias | 303 ms | 11 ms | 686 |
| NOAA Niño 3.4, 7 dias | 212 ms | 10 ms | 1.092 |
| NASA SVS 5057 | 1.488 ms | 6 ms | metadados |
| NASA SVS 5190 | 565 ms | 7 ms | metadados |
| NASA SVS 5101 | 1.580 ms | 11 ms | metadados |

FIRMS retornou o período **24/10–02/11/2026**, determinado pela disponibilidade dos produtos, e NOAA retornou **07/11–13/11/2026**. São datas dos dados disponíveis, não a data de hoje. Os hashes SHA-256 dos agregados diários de fogo e dos três recortes de oceano foram idênticos antes e depois: [comparação](after/data-comparison.json).

As medições anteriores estão em [before/api.json](before/api.json); as novas, em [after/api.json](after/api.json). A execução anterior tinha cache de disco do Next aquecido e condições de CPU diferentes. **Não é uma comparação controlada de ganho percentual**, especialmente para a primeira consulta. O tempo das fontes externas continua sendo o principal custo sem cache.

Também passaram consultas reais aos outros dois recortes NOAA, Atlântico Norte (1.757 amostras) e Índico (840), às opções GISTEMP local e remoto, ao proxy de imagem NASA (HTTP 200, JPEG), aos parâmetros inválidos (400), ao bloqueio de host externo no proxy (403) e ao redirecionamento `/discover` → `/experiences` (307). [Resultados adicionais](after/api-extra.json).

## Navegador e acessibilidade

- Sete páginas retornaram HTTP 200 e passaram pelo axe nos critérios automatizáveis WCAG 2 A/AA, 2.1 AA e 2.2 AA, sem violações detectadas. O diálogo foi analisado em WCAG 2/2.1 A/AA.
- As quatro telas móveis verificadas não apresentaram rolagem horizontal em 390 px.
- Clima passou em 320 px com texto a 140%, alto contraste, alvos ampliados e movimento reduzido, sem rolagem horizontal nem violações axe detectadas.
- Passaram tocar/pausar/retomar/parar, Tab e Shift+Tab no modal, Escape e retorno ao botão de abertura, controles em inglês e idioma do documento.
- Testes com respostas simuladas verificaram troca rápida de metadados e falha HTTP 502 com alerta e recuperação pelo botão “Tentar de novo”. Esses cenários estão marcados como `fixture` no JSON; as consultas e os demais prints usam dados reais.

[Resultado das páginas](after/browser.json) · [interações](after/interactions.json) · [build de produção](build-production.txt) · [nove scripts de testes](tests.txt).

Essas verificações não substituem testes manuais com VoiceOver/NVDA e pessoas cegas ou com baixa visão, nem constituem certificação WCAG. O teste de ampliação usou a preferência de 140% do produto; não afirma cobrir zoom de navegador a 200%.

## Erro `[object Event]`

A página informada foi `http://localhost:3000/experiences/climate`. Na observação de 20 segundos, com português e VLibras habilitado, não houve `pageerror`, falhas de requisição registradas nem rejeições não tratadas: [registro](after/runtime-climate.json). O erro original **não foi reproduzido e sua causa não está confirmada**. A existência de dois servidores na mesma pasta foi corrigida como um conflito independente; não se afirma que fosse a origem daquele evento. Não foi adicionado um supressor global de erros.

## Prints

| Página | Antes | Depois | Celular depois |
| --- | --- | --- | --- |
| Início | [desktop](before/home-desktop.png) | [desktop](after/home-desktop.png) | — |
| Experiências | [desktop](before/experiences-desktop.png) | [desktop](after/experiences-desktop.png) | [celular](after/experiences-mobile.png) |
| Clima | [desktop](before/climate-desktop.png) | [desktop](after/climate-desktop.png) | [celular](after/climate-mobile.png) |
| Incêndios | [desktop](before/fires-desktop.png) | [desktop](after/fires-desktop.png) | [celular](after/fires-mobile.png) |
| Oceanos | [desktop](before/oceans-desktop.png) | [desktop](after/oceans-desktop.png) | [celular](after/oceans-mobile.png) |
| Explorador | [desktop](before/data-desktop.png) | [desktop](after/data-desktop.png) | — |
| Sobre | [desktop](before/about-desktop.png) | [desktop](after/about-desktop.png) | — |
| Acessibilidade | [painel](before/accessibility.png) | [painel](after/accessibility.png) | [clima ampliado em 320 px](after/climate-low-vision-320.png) |

[Alerta de indisponibilidade simulado](after/climate-error.png).

## Repetir a verificação

`npm test` executa os testes do repositório. `npm run build` valida tipos e gera produção. Execute o build em outra cópia do projeto se houver uma prévia de desenvolvimento ativa.

Os scripts `audit.cjs`, `interactions.cjs` e `api-extra.cjs` registram a inspeção. Os dois primeiros requerem Playwright e `@axe-core/playwright` resolvíveis por Node (nesta execução foram instalados fora do projeto, em `/tmp/sulco-browser/node_modules`). O caminho do Chrome está configurado para macOS. `AUDIT_ORIGIN` seleciona o servidor; `AUDIT_STAGE=before|after` seleciona o diretório; `API_ONLY=1` mede somente APIs; `BROWSER_ONLY=1` atualiza somente as capturas e a análise axe. Uma execução sem essas opções atualiza as duas partes. As credenciais ficam apenas no servidor e não estão nos artefatos.
