# Base de trabalho e verificação

A pedido do usuário, `api-key-map` passa a ser a base de trabalho. Atualizada integralmente de `origin/api-key-map`, a partir de `b665985`. Fontes, recortes, frequências e cálculos de clima/FIRMS/CoastWatch preservados.

Skill consultada: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill, `.claude/skills/ui-ux-pro-max/SKILL.md`. Aplicadas recomendações específicas para foco em modais e semântica/anúncios de leitores de tela; não foi aplicado um redesenho genérico.

## Desempenho

- FIRMS: até três consultas simultâneas, preservando a ordem e todos os registros. Não aumenta o intervalo permitido por consulta externa.
- Cache em memória por processo: usa o mesmo TTL informado à função de consulta, com limite de 32 entradas/16 MiB e no máximo 4 MiB por resposta. Compartilha requisições idênticas em andamento. Não armazena falhas; TTL zero ignora o cache. Reinícios e novas instâncias começam sem cache.
- Erros HTTP 4xx, exceto 429, não são repetidos automaticamente. Falhas transitórias mantêm uma nova tentativa.
- Oceanos no Explorador só consulta quando sua aba está aberta. Alterações de região/período cancelam a requisição anterior no cliente. Mensagem de atualização acessível acompanha a consulta.

Medições locais em produção, na sessão: FIRMS 2,644 s na primeira consulta e 0,090 s na repetição; oceanos 0,792 s e 0,021 s. As duas respostas de cada par tinham dados diários idênticos. São comparações de cache frio/quente, não garantia de latência em produção ou comparação controlada com a versão anterior.

## Acessibilidade

- Preferências salvas não são sobrescritas durante a inicialização. Foco visível, controles de pelo menos 44 px, escala de texto na raiz e ajuda associada aos switches.
- Movimento reduzido desativa a animação do canvas nas três experiências. A legenda visual de oceanos não anuncia cada atualização automaticamente; o canal de leitor de tela segue a preferência de verbosidade.
- Menu móvel fecha com Escape e devolve foco ao botão. Diálogo usa o mecanismo modal nativo.
- Português: VLibras carregado somente quando ativado, com estado de falha e tentativa posterior. Oculto e inerte no inglês ou enquanto o diálogo está aberto.
- Inglês: Hand Talk configurado para ASL (`en-ase`), carregado somente por opção do usuário e com token do domínio em `NEXT_PUBLIC_HANDTALK_TOKEN`. O token é do widget de navegador, não a chave NASA. Sem configuração, a interface informa indisponibilidade. Não foi contratado serviço nem inventado token; ativação real de ASL segue pendente.
- ASL e Libras são línguas diferentes. Traduções automáticas são complementares; não se declara equivalência a intérprete humano.

Fontes de integração: https://www.vlibras.gov.br/doc/widget/installation/webpageintegration.html e https://docs.handtalk.me/en/docs/8/tradutor-de-sites/multiplos-servicos-traducao/ .

Verificação: testes de parser/player/seleção/FIRMS/oceanos e novo teste de concorrência/cache aprovados; build de produção e tipos aprovados. Chrome/Playwright confirmou ausência de consultas oceânicas na aba de clima, persistência de preferências, carga real do script VLibras e ocultação ao mudar idioma, estado ASL sem token e modal no celular. Axe não encontrou violações WCAG A/AA na análise do diálogo. Isso não certifica o site inteiro nem substitui testes com usuários, NVDA, JAWS, VoiceOver ou validação linguística.

Verificação final dos controles na versão de desenvolvimento: Escape fecha o menu móvel e restaura foco; a aba de clima não dispara consultas de oceanos; região oceânica selecionada permanece ao alternar abas. Testes de rede dessa verificação usaram fixture isolada, enquanto as medições de latência anteriores usaram os serviços reais.
