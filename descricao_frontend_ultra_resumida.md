# Briefing Ultra-Resumido (para UX PILOT)

**Objetivo:** Redesign moderno (premium, clean ou dark mode) para aplicativo móvel de visualização e simulação (IA Prophet) do potencial energético de biomassa animal na Paraíba (UFPB/CEAR/LASTER). 

* **Cores atuais:** Azul primário (`#2D6EFF`), fundos claros (`#FFFFFF` e `#F8FAFC`), detalhes em verde, roxo e amarelo.

---

## Estrutura de Telas e Layouts

1. **Aba Mapa (Home):** 
   * Card de destaque com potencial total em Terajoules (`TJ`) da região selecionada.
   * Dropdown de Ano (1973-2024).
   * Mapa SVG interativo da Paraíba dividido em 4 mesorregiões clicáveis.
   * Barra de busca + Lista de municípios expansível (exibe potencial em TJ da cidade após expandir).

2. **Aba Dashboard:** 
   * Chips horizontais de filtragem de animais (*Todos, Ovino, Bovino, Caprino, Suíno, Equino, Galináceo*).
   * Dropdown de Ano.
   * Gráfico 1 (Barras): Potencial (TJ) por Mesorregião.
   * Chips de Mesorregião + Gráfico 2 (Área/Linha): Evolução histórica da região selecionada.

3. **Aba Simulação:** 
   * Formulário para prever o futuro:
     * Dropdown do tipo de dejeto.
     * Inputs numéricos de *% de Incremento* e *Ano Alvo* (até 2035).
     * Seleção mutuamente exclusiva de local: dropdown de Mesorregião **OU** dropdown com busca de Município.
   * Botões de rodapé: "Simular" e "Limpar".
   * Link no topo para acessar a tela de **Histórico**.

4. **Aba Sobre:** 
   * Layout vertical de cards informativos com bordas esquerdas coloridas (Azul, Verde, Amarelo).

5. **Tela Histórico:** 
   * Lista vertical de cards contendo simulações salvas (cidade/região, data, parâmetros, resultado final em TJ e botão "Repetir" para reutilizar os dados).

6. **Tela Resultado da Simulação:** 
   * Resumo de filtros em badges.
   * Tabela comparativa de colunas (Baseline da IA vs Cenário com Incremento vs Diferença) e valor final em destaque gigante (ex: `150.32 TJ`).
   * Card com estatísticas (Média, Desvio Padrão e Margens de Erro).
   * Gráfico de predição interativo (linha/área) que exibe valores ao deslizar o dedo (tooltip).

---

## O que melhorar no design?
* **Modernização:** Visual moderno com cantos arredondados, sombras suaves e gradientes refinados nos gráficos.
* **Simplificação:** Interface de formulário (Simulação) mais fluida e intuitiva, facilitando os inputs numéricos e seleções excludentes.
* **Leitura de Dados:** Apresentação mais leve e organizada para tabelas de cenários e cards de estatísticas.
