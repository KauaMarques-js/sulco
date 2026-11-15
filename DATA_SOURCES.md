# DATA_SOURCES — SULCO
Projeto independente, sem endosso da NASA. Campos "Não verificado" precisam ser conferidos pela equipe. Nenhum dado deste repositório foi inventado.
A relação de cada visualização com o NASA Earth Information Center (EIC) vem do briefing do projeto e **ainda não foi verificada na galeria**.

## 1. Climate — Climate Spiral
| Campo | Valor |
|---|---|
| Visualização NASA / ID SVS | NASA Climate Spiral, SVS 5057 (1880–2022); versão mais recente SVS 5190 |
| Relação com o EIC | Não verificado (citada como item do Main Dashboard) |
| Dataset original | NASA GISS GISTEMP v4, Global-mean monthly Land-Ocean Temperature Index |
| URL | https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv · https://data.giss.nasa.gov/gistemp/ |
| Variável / unidade | Anomalia de temperatura, °C |
| Linha de base | 1951–1980 |
| Período | 5057: 1880–2022 (o site limita os dados a esse intervalo). 5190: atualizada ~2 semanas após cada mês |
| Atualização | Mensal |
| Acesso | CSV público. Cópia local: `npm.cmd run update-data` → `public/data/climate/` (CSV, metadata.json com URL, data, SHA-256) |
| Chave de API | Não |
| Data de obtenção | Registrada em `public/data/climate/metadata.json` quando você roda o script (nenhum arquivo foi baixado na construção deste pacote) |
| Créditos | NASA GISS; NASA Scientific Visualization Studio |
| Limitações | Média global esconde diferenças regionais; meses ausentes (`***`) são ignorados, nunca preenchidos |
| Sonificação (escolha do SULCO) | 1 mês = 1 nota senoidal; frequência = 440 × 2^(anomalia/4) Hz; 0 °C = 440 Hz. Não é relação física |

## 2. Wildfires — DISPONÍVEL
| Campo | Valor |
|---|---|
| Visualização NASA / ID SVS | Active Fires (VIIRS), SVS 5113 |
| Relação com o EIC | Verificada na API do NASA SVS: SVS 5113 (`Earth Information Center` nas palavras-chave) e SVS 40531 (`Wildland Fires Dashboard`) |
| Dataset original | NASA FIRMS, produtos VIIRS_SNPP_NRT e VIIRS_NOAA21_NRT |
| URL | https://firms.modaps.eosdis.nasa.gov/ · https://firms.modaps.eosdis.nasa.gov/api/ |
| Variável / unidade | Detecções e FRP (potência radiativa do fogo), MW |
| Período | Dias recentes (near real time) |
| Atualização | Diária (validado na API FIRMS até a data corrente) |
| Acesso | API de área, só no servidor (`/api/nasa/fires`), janelas de até 5 dias por requisição |
| Chave de API | **Sim**: MAP_KEY gratuita em `FIRMS_MAP_KEY` (ver `.env.example`). Nunca no navegador |
| Data de obtenção | Registrada em cada resposta (`collectedAt`) e versão do dado (`versions`) |
| Limitações | Área é um retângulo (não divisa de estado); contagem de detecções não mede tamanho nem intensidade; dias sem detecção não são preenchidos; em validação de 2026-11-15, `VIIRS_SNPP_NRT` não retornou registros após 2026-11-02 (enquanto `VIIRS_NOAA21_NRT` e `SNPP + NOAA-21` retornaram normalmente) |
| Janela temporal | Opção de janela móvel de 5 dias, alinhada à descrição da visualização SVS 5113 |
| Sonificação (escolha do SULCO) | 1 dia = 1 passo; altura (220–880 Hz, escala log no período) = FRP médio; nº de pulsos (1–6) = nº de detecções |
| Validação | Testado em 2026-11-15 via `/api/nasa/fires` com `FIRMS_MAP_KEY` real nas áreas `mt`, `br` e `world` |

## 3. Oceans — DISPONÍVEL
| Campo | Valor |
|---|---|
| Visualização NASA / ID SVS | Sea Surface Temperature (SST) - Near Real Time, SVS 5101 |
| Relação com o EIC | Verificada na API do NASA SVS 5101 (`Earth Information Center` nas palavras-chave; cita MUR SST / JPL PO DAAC) |
| Dataset numérico | NOAA NESDIS CoastWatch ERDDAP — Geo-Polar Blended Sea Surface Temperature 5 km NRT (`noaacwBLENDEDCsstDaily`, `analysed_sst`) |
| URL | https://coastwatch.noaa.gov/erddap/griddap/noaacwBLENDEDCsstDaily.html · https://svs.gsfc.nasa.gov/5101/ |
| Variável / unidade | Temperatura da superfície do mar (TSM / SST), °C |
| Período | Últimos 7, 15 ou 30 dias até o `time_coverage_end` mais recente do servidor (cobertura histórica desde 2002-09-01) |
| Atualização | Diária |
| Acesso | CSV público do ERDDAP, consultado no servidor (`/api/nasa/oceans`), em 5 recortes espaciais (`global`, `br`, `nino34`, `natlan`, `indian`) |
| Chave de API | Não |
| Data de obtenção | Registrada em cada resposta (`collectedAt`) e na janela `start → end` |
| Limitações | Limites geográficos retangulares; amostragem em grade uniforme espaçada (2°–30° dependendo da bacia) para garantir resposta confiável em 30 dias; células continentais/gelo (`NaN`) são ignoradas sem interpolação |
| Sonificação (escolha do SULCO) | 1 dia = 1 nota senoidal suave entre 220 Hz e 880 Hz (2 oitavas), escalada exponencialmente do mínimo ao máximo da TSM média diária do recorte ativo. Escolha artística, não é lei física |

## Observações
- SVS API fornece metadados e links de mídia, não os dados numéricos. GIBS fornece imagens/mapas, não dados para sonificação. Não são misturados.
- Os IDs 40529, 40531, 40477 e 40479 aparecem como referência em Discover Earth (dos quais 40531 / 5113 para Incêndios e 5101 para Oceanos já estão verificados).
