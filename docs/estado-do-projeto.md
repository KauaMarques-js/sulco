# Estado do SULCO

Trabalho solicitado por Kaua Marques na branch `feat/nasa-discover-earth`: integrar APIs reais ao Descobrir Terra, melhorar a interface e validar a implementação usando as orientações do plugin https://github.com/KauaMarques-js/plugin-CODEX (commit consultado: `851633f3bcfe3708fde3d632069f082f8bdc462e`).

## Implementado

- Descobrir Terra: EONET v3 (eventos abertos, últimos 30 dias, até 100) e EPIC (imagem mais recente disponível), sem chave, com consultas independentes e falhas explícitas.
- Painel responsivo, busca por título/local, filtro por categoria e links para os registros originais. Datas e limites da consulta visíveis; títulos originais preservados.
- Clima: consulta automática à fonte NASA, JSON para o cliente e reserva local identificada quando indisponível. A fonte NASA continua publicando a tabela em CSV por HTTP.
- FIRMS: integração oficial existente preservada; correções para datas inexistentes, dias fracionários e nomes inválidos de área/satélite.
- Testes de contrato e integração usam respostas sintéticas explicitamente isoladas dos dados exibidos no produto.

## Limites preservados

O sucesso técnico da API não valida correspondência científica nem vínculo com o Earth Information Center. Status do catálogo e mapeamentos de sonificação permanecem iguais. EONET não substitui medições FIRMS. A chave FIRMS continua necessária em `.env.local`; não foi criada nem incluída no código.

Branch de entrega: `feat/nasa-discover-earth`, renomeada a pedido do usuário para descrever a funcionalidade. Sem merge na main. A versão do `package-lock.json`, já atualizada antes deste trabalho, foi mantida em sincronia com o `package.json`.

## Evidências de verificação

- `npm test`: parsers, reprodução, seleção, FIRMS e novos testes das APIs aprovados.
- `npm run build`: compilação de produção, checagem de tipos e geração de páginas aprovadas em cópia isolada para evitar concorrência com o servidor de desenvolvimento.
- Chrome/Playwright: 37 eventos reais carregados na consulta de teste, imagem EPIC carregada, busca sem resultados e troca EN/PT funcionando; viewport de 390 px sem transbordamento horizontal e nenhum erro JavaScript de página observado.
- FIRMS: contrato testado com respostas sintéticas. Consulta autenticada real pendente de configurar `FIRMS_MAP_KEY`.
