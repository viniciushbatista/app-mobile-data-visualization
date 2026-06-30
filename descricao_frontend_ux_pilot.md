# Descrição Detalhada do Front-end para Design (UX PILOT)

Este documento descreve detalhadamente o front-end, a arquitetura de telas, componentes e fluxos do aplicativo móvel de **Visualização e Projeção de Potencial Energético de Biomassa Animal (Paraíba)**. O objetivo é fornecer um briefing completo para que a ferramenta **UX PILOT** (ou um designer de interfaces) possa propor melhorias visuais e de usabilidade para o aplicativo.

---

## 1. Visão Geral do Aplicativo
* **Plataforma:** Aplicativo móvel híbrido (iOS e Android), desenvolvido com **React Native** e **Expo (Router)**.
* **Proposta do App:** Uma ferramenta de apoio à tomada de decisão para pesquisadores, gestores públicos e investidores. Ela calcula e projeta o potencial energético gerado a partir de resíduos de biomassa de animais (rebanhos da Paraíba) em nível municipal e regional.
* **Escopo Científico:** Projeto de Iniciação Científica (PIBIC) vinculado ao **CEAR** (Centro de Energias Alternativas e Renováveis) e ao **LASTER** (Laboratório de Sistemas Térmicos) da **UFPB**.

---

## 2. Identidade Visual e Estilo Atual
* **Paleta de Cores Atual:**
  * **Fundo:** Branco (`#FFFFFF`) e cinza claro (`#F8FAFC` / `#F1F5F9`) para superfícies neutras.
  * **Cor Primária:** Azul Dinâmico (`#2D6EFF`) - usado em botões ativos, badges de destaque, bordas de cards selecionados, chips ativos e linhas de gráficos.
  * **Cores de Acordo com Seções (Badges/Status):**
    * Verde (`#10B981` ou `#059669` com fundo `#ECFDF5`): Usado na seção de bases de dados (IBGE) ou variações positivas.
    * Amarelo/Laranja (`#F59E0B`): Usado nos créditos institucionais.
    * Roxo (`#7C3AED` ou `#5B21B6`): Usado para as estatísticas e limites de erro do modelo Prophet (IA).
    * Neutros/Bordas/Desativados: Cinza (`#9CA3AF`, `#E2E8F0`, `#6B7280`).
* **Tipografia:** Fonte sans-serif **Inter** (estilos Regular e Bold).
* **Biblioteca de Componentes Visuais:** Utiliza componentes adaptados do `react-native-paper` (Cards, Inputs, Searchbar, HelperText e Buttons) e gráficos renderizados com `victory-native` (Skia-based) e ECharts (para o mapa SVG).

---

## 3. Estrutura de Navegação
O aplicativo é dividido em uma navegação por **Abas Inferiores (Tab Bar)** de 4 telas, além de **2 Telas Secundárias** que rodam em pilha (stack navigation com botão físico ou lógico de voltar).

* **Abas Principais:**
  1. **Mapa (`index.tsx`):** Exibição do mapa interativo da Paraíba.
  2. **Dashboard (`dashboard.tsx`):** Gráficos analíticos e série histórica.
  3. **Simulação (`simulation.tsx`):** Formulário de projeções.
  4. **Sobre (`sobre.tsx`):** Informações sobre o projeto e créditos.
* **Telas Secundárias:**
  5. **Histórico (`simulation-history.tsx`):** Lista de simulações passadas.
  6. **Resultado da Simulação (`simulationoutput.tsx`):** Gráfico de projeção Prophet, estatísticas detalhadas e tabela comparativa.

---

## 4. Detalhamento Tela por Tela

### 1. Aba: Mapa (`(tabs)/index.tsx`)
Esta tela funciona como a página inicial (Home) e fornece uma visão espacial do potencial energético no estado da Paraíba.
* **Componentes e Layout (Organizados de cima para baixo):**
  1. **Card de Destaque Superior:** Exibe em fonte bem grande o potencial energético da região selecionada no formato `X.XXX,XX TJ` (Terajoules). 
     * Se nenhuma região for tocada, exibe o texto instrutivo *"Toque em uma mesorregião no mapa para carregar o potencial"*.
     * Possui uma borda esquerda grossa em destaque que fica **azul** se houver uma região selecionada, ou **cinza** se estiver neutro.
  2. **Seletor de Ano (Dropdown):** Localizado no canto superior direito, acima do mapa. Permite selecionar anos históricos entre **1973 e 2024** para atualizar a escala do mapa.
  3. **Mapa Interativo (Regiões):** Um mapa SVG da Paraíba dividido em suas 4 mesorregiões: *Mata Paraibana, Agreste Paraibano, Borborema e Sertão Paraibano*. O mapa é dinâmico (com gradiente de cores baseado no potencial de cada região) e permite clicar para selecionar uma mesorregião específica.
  4. **Botão de Exportação:** Um botão sutil no rodapé do mapa com ícone de download (`download`) escrito *"Exportar"*, que gera a imagem do mapa atual para compartilhamento.
  5. **Barra de Pesquisa (Searchbar):** Uma barra redonda com a frase de busca *"Buscar cidade da Paraíba"*.
  6. **Lista de Municípios (Expansível):** Exibe resultados de cidades com base na pesquisa ou na lista geral.
     * Cada linha da lista mostra o **Nome da Cidade** e a **Mesorregião** pertencente.
     * Ao clicar na cidade, ela expande em formato sanfona (accordion), disparando uma chamada de API para carregar o potencial energético daquele município no ano selecionado.
     * A área expandida mostra o valor em azul (ex: `X,XX TJ`), o ano de referência, ou exibe *"Dado não disponível para [Ano]"* se não houver dados históricos daquela cidade para a data.

---

### 2. Aba: Dashboard (`(tabs)/dashboard.tsx`)
Focada em análises comparativas rápidas através de representações gráficas.
* **Componentes e Layout (Organizados de cima para baixo):**
  1. **Chips de Filtragem de Animal (Scroll Horizontal):** Filtros em formato de cápsulas (chips) que deslizam horizontalmente para escolher a origem dos resíduos: *"Todos", "Ovino", "Bovino", "Caprino", "Suíno", "Equino", "Galináceo"*. O chip selecionado ganha cor de fundo azul e texto branco.
  2. **Seletor de Ano (Dropdown):** Dropdown que permite selecionar anos específicos (atualmente 2020, 2021, 2022).
  3. **Gráfico 1: Potencial por Mesorregião (Gráfico de Barras):**
     * Gráfico de colunas verticais exibindo o potencial de cada mesorregião usando abreviações no eixo X (*M, A, B, S*).
     * Apresenta uma legenda de apoio logo abaixo: *M = Mata Paraibana, A = Agreste, B = Borborema, S = Sertão*.
     * Botão de exportação de imagem abaixo do gráfico.
  4. **Chips de Seleção de Região (Scroll Horizontal):** Filtros cápsula para selecionar a mesorregião específica para o próximo gráfico: *"Mata", "Agreste", "Borborema", "Sertão"*.
  5. **Gráfico 2: Série Histórica (Gráfico de Linha com Área):**
     * Um gráfico de linha com área preenchida suavemente por baixo (azul translúcido).
     * Exibe o comportamento histórico do potencial total somando todos os animais ao longo dos anos.
     * Eixo Y formatado de maneira compacta e inteligente (ex: `1.2M TJ` para milhões, `15K TJ` para milhares).
     * Botão de exportação de imagem abaixo do gráfico.

---

### 3. Aba: Simulação (`(tabs)/simulation.tsx`)
Tela onde o usuário configura as variáveis para rodar projeções futuras usando o algoritmo Prophet (Inteligência Artificial).
* **Componentes e Layout (Organizados de cima para baixo):**
  1. **Botão de Acesso ao Histórico:** Posicionado no canto superior direito, com ícone de relógio e o texto *"Histórico"*, servindo de link para a tela correspondente.
  2. **Seletor de Substrato (Dropdown):** Campo obrigatório para escolher a biomassa animal (*Suíno, Bovino, Caprino, Ovino, Equino, Galináceo*).
  3. **Campo de Incremento do Rebanho (%):** Entrada de texto numérica onde o usuário digita a porcentagem de crescimento fictício ou planejado para o rebanho (ex: `15` para +15%).
     * *Detalhe de UX do App:* Devido a um problema comum de teclados numéricos travados em sistemas móveis, este campo possui um botão de "Lápis/Check" ao lado. O campo é editável apenas após o usuário tocar no ícone do Lápis, e trava as edições tocando em Check (reduzindo erros de input).
  4. **Campo de Ano Alvo da Projeção:** Entrada numérica para definir até qual ano futuro a projeção deve rodar (intervalo validado entre o ano atual e o limite máximo de **2035**). Também possui o mecanismo de segurança "Lápis/Check" ao lado.
  5. **Seletor de Localização (Mesorregião OU Município):**
     * O usuário pode simular uma região inteira ou uma cidade isolada.
     * **Opção A - Mesorregião (Dropdown):** Permite selecionar uma das 4 regiões. Se o usuário escolher um município, este dropdown é visualmente desativado (com opacidade reduzida).
     * **Divisor Visual:** Uma linha horizontal fina com o texto *"OU"* centralizado.
     * **Opção B - Município (Dropdown com Busca):** Caixa de busca para selecionar o município. Se o usuário escolher uma mesorregião no campo anterior, este seletor de município é desativado.
  6. **Botões de Rodapé:** Dois botões alinhados horizontalmente:
     * Botão *"Simular"* (botão maior em azul, inicia a validação e abre a tela de resultados).
     * Botão *"Limpar"* (botão menor em azul, limpa todos os campos do formulário de simulação).

---

### 4. Aba: Sobre (`(tabs)/sobre.tsx`)
Tela institucional de caráter acadêmico.
* **Componentes e Layout (Organizados de cima para baixo):**
  * Tela de rolagem vertical contendo cards minimalistas, cada um com uma cor de borda esquerda específica para organizar as seções:
    1. **Card "Sobre o Projeto" (Borda Azul):** Parágrafos descrevendo a origem acadêmica do aplicativo como pesquisa PIBIC da UFPB.
    2. **Card "Base de Dados" (Borda Verde):** Badges verdes em destaque com rótulos como *"Fonte: IBGE / PPM"*, *"Cobertura: Paraíba"* e *"Dados disponíveis: 1974 - 2024"*. Conta com um box de nota informativo com ícone de alerta sobre a metodologia de projeções.
    3. **Card "Créditos" (Borda Amarela/Laranja):** Listagem com ícones temáticos destacando a Universidade (UFPB), o Centro Acadêmico (CEAR) e o laboratório científico (LASTER).
  * Rodapé com textos de direitos autorais e versão do app.

---

### 5. Tela Secundária: Histórico de Simulações (`simulation-history.tsx`)
Tela de histórico de simulações, armazenada localmente na memória do celular.
* **Componentes e Layout (Organizados de cima para baixo):**
  1. **Cabeçalho Fixo:** Exibe o título *"Histórico de Simulações"* e a contagem de itens sob o título (ex: *"3 simulações salvas"*). À direita, um botão de lixeira vermelho (`delete-outline`) para limpar todo o histórico local.
  2. **Lista de Simulações Realizadas:**
     * Cada simulação é apresentada em um card com borda esquerda azul.
     * No topo do card, exibe um badge azul com ícone representando se o cálculo foi regional (ícone de mapa) ou municipal (ícone de cidade), exibindo o nome do local. À direita do card, a data e a hora da simulação formatada.
     * Uma linha central de tags minimalistas em cinza exibindo os parâmetros: Biomassa (ex: `🌿 Suíno`), Ano Alvo (ex: `📅 2030`) e Incremento (ex: `📈 +15%`).
     * A parte inferior do card exibe à esquerda o resultado final em destaque (ex: `150.32 TJ`) e à direita um botão *"Repetir"* (com ícone de recarga). Ao clicar, o usuário é levado de volta à tela de simulação com os campos já preenchidos.

---

### 6. Tela Secundária: Resultado da Simulação (`simulationoutput.tsx`)
Exibe o processamento realizado pelo modelo Prophet de IA com os dados simulados pelo usuário.
* **Componentes e Layout (Organizados de cima para baixo):**
  1. **Card de Parâmetros Aplicados (Borda Cinza):** Badges resumindo os valores passados para a simulação: biomassa, porcentagem de incremento, ano alvo, localização (município ou região) e uma tag em destaque *"🤖 Prophet (IA)"*.
  2. **Card de Resultados Comparativos (Borda Azul):**
     * Contem uma tabela com três colunas (*Rótulo, Cabeças de Rebanho e Energia em TJ*).
     * Linha 1: **Baseline Prophet** (mostra o número de animais e o potencial energético previsto pela IA no ano alvo se nada for alterado).
     * Linha 2: **Cenário (+X%)** (destacado com fundo azul claro, mostrando o número de animais e potencial energético resultante do incremento aplicado pelo usuário).
     * Linha 3: **Diferença** (exibido em texto verde, calculando o ganho bruto que o incremento trará).
     * Destaque Gigante no Centro: O potencial total do cenário em fonte grande azul (ex: `150.32 TJ`) com um subtítulo explicativo.
  3. **Card de Estatísticas da Previsão (Borda Roxa):**
     * Apresenta dados estatísticos complexos fornecidos pela modelagem Prophet:
       * *Média (Valor Central)*
       * *Desvio Padrão (σ)*
       * *Intervalo de Confiança a 80% (Faixa Mínima e Máxima esperada)*
       * *Tolerâncias (Badges roxos de ±1σ e ±2σ)*
  4. **Seção de Gráfico Principal (Série Histórica + Previsão):**
     * Exibe o histórico real do rebanho nos últimos 15 anos combinado com a linha de predição futura do Prophet até o ano alvo (com a alteração do incremento aplicada se houver).
     * Gráfico de linha azul com área preenchida suavemente abaixo.
     * Interação: Ao pressionar e arrastar o dedo sobre o gráfico, ele exibe um círculo guia (tooltip) sobre os pontos com o valor daquele ano.
  5. **Botão de Rodapé:** Botão *"Exportar"* com ícone de download para compartilhar a imagem gerada do gráfico de previsão.

---

## 5. Fluxos de Uso do Aplicativo

1. **Exploração de Dados Reais:**
   * O usuário entra no app e visualiza o potencial regional da Paraíba diretamente no mapa. Ele pode usar o seletor de ano para comparar o histórico.
   * Ele usa a barra de pesquisa para detalhar o potencial energético em municípios específicos, abrindo os cards expansíveis.
   * Ele confere a aba de Dashboard para visualizar a série histórica de produção total em um gráfico contínuo de área e a contribuição por mesorregião em gráfico de barras, filtrados pelo tipo de animal.

2. **Criação de Projeções de Cenários Futuros:**
   * O usuário acessa a aba "Simulação".
   * Escolhe a biomassa (ex: Bovino).
   * Define o incremento esperado no rebanho (ex: +25% de animais).
   * Escolhe o ano alvo futuro (ex: 2030).
   * Define a escala regional (ex: Mesorregião "Sertão") ou seleciona uma cidade específica.
   * Clica em "Simular".
   * A tela de saída (Simulation Output) calcula a projeção combinando a inteligência artificial do modelo Prophet com a taxa de acréscimo fictícia do rebanho, exibindo um relatório interativo, comparativo e estatístico com o gráfico futuro da região.
   * O usuário pode baixar a imagem do gráfico gerado.
   * A simulação é gravada localmente na tela de Histórico para permitir repetir o processo rapidamente a qualquer momento.

---

## 6. Diretrizes para Criação de Design no UX PILOT

* **Objetivo Geral:** Propor um visual premium e moderno, preferencialmente usando conceitos contemporâneos como Dark Mode (ou um Light Mode com alto contraste, limpo e profissional), sombras suaves, elementos de Glassmorphism (efeito vidro fosco) e cantos arredondados (borderRadius consistentes).
* **Otimização do Dashboard:** Recomendar gráficos modernos com cores mais sofisticadas (usar tons gradientes no lugar de cores sólidas e chapadas) e tooltips informativos bonitos.
* **Refinamento de Inputs:** Repensar a interface de formulário da tela de Simulação para torná-la atraente, facilitando o preenchimento de inputs numéricos e resolvendo de forma elegante a seleção de alternativas ("Mesorregião OU Município").
* **Visualização Estatística:** Apresentar as tabelas comparativas e dados complexos (desvio padrão, limites de confiança) do Prophet de forma limpa, transformando a visualização de dados pesados em blocos informativos (cards de estatística) visivelmente leves e bem diagramados.
