# Estado do SULCO

Branch: `feat/nasa-discover-earth`. A main não foi alterada. Orientações de engenharia consultadas no plugin do usuário: https://github.com/KauaMarques-js/plugin-CODEX (commit `851633f3bcfe3708fde3d632069f082f8bdc462e`).

## Pedidos e decisões atuais

- Trabalhar na branch de funcionalidade e publicar mudanças para revisão antes de qualquer merge na main.
- Usar dados reais e deixar a interface mais direta e dinâmica.
- Retirar Descobrir Terra: somente Experiências reúne as ferramentas. `/discover` redireciona; navegação, categorias sem ferramenta e integrações EONET/EPIC foram removidas.
- Integrar primeiro `origin/api-key-map`: pull realizado com merge `ce0ca23`, preservando o trabalho em andamento. A branch trouxe configuração de ambiente, não um dataset numérico. Credenciais permanecem em arquivos locais ignorados pelo Git; o exemplo versionado tem valor vazio. A chave que já constava no histórico da outra branch precisa ser substituída pelo responsável.

## Funcionamento

- Clima: NASA GISS GISTEMP v4 consultado por HTTP, com reserva local identificada. A variante atual SVS 5190 permite toda a série disponível; a variante 5057 continua limitada a 2022. Seleção por período, gráfico e linha do tempo controla o mesmo registro e sua nota. O catálogo mostra o gráfico dos dados carregados.
- Queimadas: NASA FIRMS autenticado no servidor. `/api/nasa/fires/availability` informa as datas publicadas de SNPP e NOAA-21. Sem data manual, a interface consulta até a data mais recente comum aos produtos selecionados, apresentada na tela; não presume que a data do calendário tenha registros disponíveis.
- Mapa: OpenStreetMap como base, coordenadas reais FIRMS. Mostra o dia selecionado ou sua janela móvel de cinco dias e informa o tamanho da amostra. Amostragem de até 2.000 pontos para o mapa; totais e sonificação usam todos os registros. Coordenadas acessíveis em tabela.
- Gráficos permitem selecionar o registro sem iniciar áudio automaticamente. Animação de onda respeita movimento reduzido.

## Limites

Detecções não equivalem a número de incêndios únicos ou perímetros queimados. FRP é potência radiativa, em MW. Status científico e mapeamentos de sonificação foram preservados; validar correspondência com SVS 5113 segue pendente. A disponibilidade de dados da NASA pode estar atrasada em relação ao calendário.

## Evidências

- Testes automatizados de parser, player, seleção e APIs aprovados, incluindo disponibilidade, coordenadas inválidas, amostragem, sigilo da chave nas respostas e reserva local.
- Checagem TypeScript e build de produção aprovados em cópia isolada.
- Consulta autenticada real SNPP em Mato Grosso: 602 detecções e 602 coordenadas, de 2026-10-29 a 2026-11-02. A consulta anterior até 2026-11-15 havia retornado vazia; o endpoint de disponibilidade identificou a data publicada correta. Esses valores são evidência da sessão, não constantes do produto.
- Chrome/Playwright, com APIs reais e sem mocks: 6.594 detecções na consulta inicial combinada de 2026-10-24 a 2026-11-02, amostra de 1.961 pontos no mapa, e 1.762 meses GISTEMP obtidos remotamente. Verificados redirecionamento de `/discover`, catálogo com duas experiências, disponibilidade, agregação, mapa e tiles, seleção por teclado/gráfico, áudio, layout móvel e ausência da chave em dados/requisições do cliente. Nenhum erro JavaScript de página observado.
