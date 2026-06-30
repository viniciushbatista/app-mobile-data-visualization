# Briefing Resumido do App (para UX PILOT)

**Objetivo:** Propor melhorias visuais, usabilidade e redesign para um aplicativo móvel híbrido (React Native/Expo) de análise de potencial energético da biomassa animal na Paraíba (Projeto PIBIC/UFPB/LASTER).

---

## 1. Estilo Visual Atual
* **Cores:** Fundo branco (`#FFFFFF`) e cinza claro (`#F8FAFC`). Destaques e botões em Azul (`#2D6EFF`). Badges informativos em Verde (`#10B981`), Roxo (`#7C3AED`) e Amarelo (`#F59E0B`).
* **Tipografia:** Fonte **Inter** (Regular/Bold).
* **Componentes:** Baseado em cartões (`react-native-paper`), gráficos (`victory-native`) e mapa interativo SVG.

---

## 2. Estrutura de Navegação e Telas
Navegação por **Abas Inferiores (Tab Bar)** com 4 telas principais e **2 telas secundárias** (fluxo em pilha):

### Aba 1: Mapa (Home)
* **Card de Destaque Superior:** Exibe o potencial energético total em Terajoules (`TJ`) da região selecionada (borda esquerda destaca-se em azul quando ativo).
* **Filtro de Ano:** Dropdown (anos 1973 a 2024).
* **Mapa SVG Interativo:** Divisão das 4 mesorregiões da Paraíba (clicáveis para carregar dados).
* **Barra de Pesquisa + Lista de Cidades (Accordion):** Ao tocar numa cidade, abre um painel dinâmico revelando seu potencial específico (TJ) no ano selecionado.
* **Ação:** Botão de exportação do mapa.

### Aba 2: Dashboard
* **Filtros (Scroll Horizontal):** Chips de seleção rápida de animais (*Todos, Ovino, Bovino, Caprino, Suíno, Equino, Galináceo*).
* **Dropdown de Anos:** Seleção de anos recentes (2020-2022).
* **Gráfico 1 (Barras):** Colunas verticais comparando potencial (TJ) por mesorregião (Mata, Agreste, Borborema, Sertão), com legenda e botão de exportação.
* **Filtro de Região + Gráfico 2 (Área/Linha):** Gráfico histórico do potencial total ao longo do tempo para a mesorregião selecionada (eixo Y dinâmico ex: `1.2M TJ`).

### Aba 3: Simulação
* **Botão Histórico:** Atalho para ver registros passados.
* **Formulário de Entrada:**
  * Dropdown para o Substrato (dejeto animal).
  * Inputs numéricos com botões de alternância "Lápis/Check" (para evitar travas de teclado móvel): **Incremento do Rebanho (%)** e **Ano Alvo da Projeção** (até 2035).
  * Seleção de Local: **Mesorregião** OU **Município** (seletor dinâmico: ao escolher um, o outro é desativado).
* **Ações:** Botões horizontais "Simular" e "Limpar".

### Aba 4: Sobre
* Layout em lista vertical de cards com bordas coloridas (*Sobre o Projeto, Base de Dados com badges verdes e Créditos institucionais com ícones UFPB/CEAR/LASTER*).

### Tela Secundária: Histórico
* Lista vertical de cards de simulações salvas localmente. Exibe localidade (ícone cidade/mapa), data/hora, tags dos parâmetros (*Biomassa, Ano, % Incremento*), resultado final em TJ e botão "Repetir" (que preenche o formulário automaticamente). Botão de lixeira para limpar tudo.

### Tela Secundária: Resultado da Simulação (Output)
* **Card de Parâmetros:** Resumo com badges cinzas e tag *"🤖 Prophet (IA)"*.
* **Tabela de Cenários:** Compara em 3 colunas (*Baseline Prophet*, *Cenário com Incremento +X%* [fundo azul] e *Diferença* [texto verde]) a quantidade de cabeças e energia em TJ. Exibe o resultado final em destaque gigante (ex: `150.32 TJ`).
* **Card de Estatísticas:** Métricas detalhadas (Média, Desvio Padrão, Intervalo de Confiança e badges de tolerâncias $\pm1\sigma$ e $\pm2\sigma$).
* **Gráfico de Predição (Linha/Área):** Histórico recente + projeção até o ano alvo, com suporte a tooltips interativos ao deslizar o dedo e exportação.

---

## 3. Diretrizes de Redesign para o UX PILOT
1. **Visual Premium:** Visual moderno com sombras suaves, cantos arredondados (`borderRadius: 12-16`), estilo *Clean/Glassmorphic* ou opção de *Dark Mode*.
2. **Dashboard Sofisticado:** Gráficos com paletas gradientes refinadas e tooltips limpos.
3. **Simplificação do Formulário:** Otimizar visualmente o seletor "Mesorregião OU Município" e os inputs numéricos de forma mais intuitiva.
4. **Legibilidade Estatística:** Organizar a tabela comparativa e dados de erro do modelo de IA de forma limpa e em grid legível.
