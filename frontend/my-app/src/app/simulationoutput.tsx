import { View, Text, ScrollView, StyleSheet } from "react-native";
import { CartesianChart, Line, Area, useChartPressState } from "victory-native";
import { useFont, Circle, Text as SkiaText } from '@shopify/react-native-skia'
import { Button, Card } from 'react-native-paper'
import { useRef, useState, useEffect } from "react";
import * as Sharing from 'expo-sharing'
import { makeImageFromView } from '@shopify/react-native-skia';
import { File as ExpoFile, Paths } from 'expo-file-system';
import { useLocalSearchParams } from "expo-router";
import type { SharedValue } from "react-native-reanimated";
import { useDerivedValue } from "react-native-reanimated";
import { MaterialIcons } from '@expo/vector-icons';
import { api, SUBSTRATO_LABEL_MAP, PrevisaoResponse } from "../services/api";
import { useSimulationHistory } from "../shared/hooks/useSimulationHistory";
import { ChartCardSkeleton, ResultCardSkeleton } from "../shared/components/SkeletonLoader";
import EmptyState from "../shared/components/EmptyState";

// Componente tooltip com círculo + label de valor
function ToolTip({
  x,
  y,
  value,
  color,
  font,
}: {
  x: SharedValue<number>;
  y: SharedValue<number>;
  value: SharedValue<number>;
  color: string;
  font: any;
}) {
  const label = useDerivedValue(() => {
    const v = value.value;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return `${v.toFixed(0)}`;
  });

  const textX = useDerivedValue(() => x.value - 20);
  const textY = useDerivedValue(() => y.value - 12);

  return (
    <>
      <Circle cx={x} cy={y} r={6} color={color} />
      {font && (
        <SkiaText
          x={textX}
          y={textY}
          text={label}
          font={font}
          color={color}
        />
      )}
    </>
  );
}

// Converte nome curto da mesorregião para nome completo da API
function normalizarMesorregiao(regiao: string): string {
  if (regiao === 'Agreste') return 'Agreste Paraibano';
  if (regiao === 'Sertão') return 'Sertão Paraibano';
  return regiao;
}

export default function SimulationOutput() {
  const { substrato, quantidade, ano, regiao, codigoIbge, municipioNome } = useLocalSearchParams<{
    substrato: string;
    quantidade: string;
    ano: string;
    regiao: string;
    codigoIbge?: string;
    municipioNome?: string;
  }>();

  const viewRef = useRef(null);
  const font = useFont(require("./../../assets/static/Inter_18pt-Regular.ttf"));
  const tooltipFont = useFont(require("./../../assets/static/Inter_18pt-Bold.ttf"), 11);
  const { saveSimulation } = useSimulationHistory();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [dadosGrafico, setDadosGrafico] = useState<{ ano: number; value: number }[]>([]);
  const [anoInicio, setAnoInicio] = useState<number>(2020);

  // Resultado Prophet
  const [baselineCabecas, setBaselineCabecas] = useState<number>(0);
  const [baselineTJ, setBaselineTJ] = useState<number>(0);
  const [cenarioCabecas, setCenarioCabecas] = useState<number>(0);
  const [cenarioTJ, setCenarioTJ] = useState<number>(0);
  const [metricas, setMetricas] = useState<PrevisaoResponse['metricas']>(null);

  // Estatísticas Prophet (desvio padrão e tolerâncias)
  const [desvio, setDesvio] = useState<number | null>(null);
  const [tol1sigma, setTol1sigma] = useState<number | null>(null);
  const [tol2sigma, setTol2sigma] = useState<number | null>(null);
  const [limiteInf, setLimiteInf] = useState<number | null>(null);
  const [limiteSup, setLimiteSup] = useState<number | null>(null);

  const anoAlvo = Number(ano) || 2030;
  const incrementoPercent = Number(quantidade) || 0;

  useEffect(() => {
    let isMounted = true;

    const executarPrevisao = async () => {
      setCarregando(true);
      setErro(null);
      try {
        // 1. Normalizar substrato para nome do banco
        const substratoDb = SUBSTRATO_LABEL_MAP[substrato] || substrato;

        // 2. Chamar API Prophet
        let resultado: PrevisaoResponse;
        if (codigoIbge) {
          resultado = await api.getPrevisaoMunicipio(
            Number(codigoIbge),
            substratoDb,
            anoAlvo,
            true, // incluir energia
          );
        } else {
          const nomeMesoReal = normalizarMesorregiao(regiao);
          resultado = await api.getPrevisaoMesorregiao(
            nomeMesoReal,
            substratoDb,
            anoAlvo,
            true, // incluir energia
          );
        }

        if (!isMounted) return;

        // 3. Encontrar a previsão para o ano alvo
        const previsaoAnoAlvo = resultado.previsoes.find(p => p.ano === anoAlvo)
          || resultado.previsoes[resultado.previsoes.length - 1];

        if (!previsaoAnoAlvo) {
          throw new Error('Prophet não retornou previsão para o ano alvo.');
        }

        // 4. Baseline Prophet (sem incremento)
        const bCabecas = previsaoAnoAlvo.quantidade_prevista;
        const bTJ = previsaoAnoAlvo.potencial_tj ?? 0;

        // 5. Cenário do usuário: baseline + incremento %
        const cCabecas = bCabecas * (1 + incrementoPercent / 100);
        // TJ escala proporcionalmente com cabeças
        const cTJ = bTJ * (1 + incrementoPercent / 100);

        setBaselineCabecas(bCabecas);
        setBaselineTJ(bTJ);
        setCenarioCabecas(cCabecas);
        setCenarioTJ(cTJ);
        setMetricas(resultado.metricas);

        // Estatísticas do ano-alvo previsto
        setDesvio(previsaoAnoAlvo.desvio_padrao);
        setTol1sigma(previsaoAnoAlvo.tolerancia_1sigma);
        setTol2sigma(previsaoAnoAlvo.tolerancia_2sigma);
        setLimiteInf(previsaoAnoAlvo.limite_inferior);
        setLimiteSup(previsaoAnoAlvo.limite_superior);

        // 6. Montar dados do gráfico (cabeças)
        const historicoRecente = resultado.historico.slice(-15);
        const pontos: { ano: number; value: number }[] = [];

        // Histórico real
        for (const h of historicoRecente) {
          pontos.push({ ano: h.ano, value: h.quantidade });
        }

        // Previsões Prophet (baseline)
        for (const p of resultado.previsoes) {
          pontos.push({ ano: p.ano, value: p.quantidade_prevista });
        }

        // Ponto do cenário do usuário (destacado no ano alvo)
        // Se o incremento é diferente de 0, adiciona como último ponto
        if (incrementoPercent !== 0) {
          // Substituir o ponto do ano alvo pelo cenário do usuário
          const idx = pontos.findIndex(pt => pt.ano === anoAlvo);
          if (idx >= 0) {
            pontos[idx] = { ano: anoAlvo, value: cCabecas };
          }
        }

        setDadosGrafico(pontos);
        setAnoInicio(historicoRecente[0]?.ano ?? 2010);

        // 7. Salvar no histórico
        saveSimulation({
          substrato,
          localizacao: codigoIbge ? (municipioNome || codigoIbge) : regiao,
          tipoLocalizacao: codigoIbge ? 'municipio' : 'mesorregiao',
          anoAlvo: ano,
          resultadoTJ: parseFloat(cTJ.toFixed(2)),
          quantidade,
          regiao: regiao || '',
          codigoIbge: codigoIbge || undefined,
          municipioNome: municipioNome || undefined,
        });

      } catch (err: any) {
        console.error('[SimulationOutput] Erro na previsão Prophet:', err);
        if (isMounted) {
          setErro(err?.message || 'Erro ao gerar previsão. Verifique se a API está rodando.');
        }
      } finally {
        if (isMounted) setCarregando(false);
      }
    };

    executarPrevisao();

    return () => {
      isMounted = false;
    };
  }, [substrato, quantidade, ano, regiao, codigoIbge]);

  // Chart press state
  const { state: firstPress, isActive: isFirstActive } = useChartPressState({ x: 0, y: { value: 0 } });
  const { state: secondPress, isActive: isSecondActive } = useChartPressState({ x: 0, y: { value: 0 } });

  const exportarGrafico = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const image = await makeImageFromView(viewRef);
      if (!image) return;

      const base64 = image.encodeToBase64();
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const file = new ExpoFile(Paths.cache, 'predicao.jpg');
      file.create({ overwrite: true });
      file.write(bytes);

      await Sharing.shareAsync(file.uri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Salvar predição',
      });
    } catch (err) {
      console.error('Erro ao exportar:', err);
    }
  };

  // Formatadores
  const fmtCabecas = (v: number) =>
    v.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  const fmtTJ = (v: number) => v.toFixed(2);

  return (
    <View className="flex-1 bg-white">
      {carregando ? (
        <View style={{ flex: 1, padding: 16, gap: 12 }}>
          <ResultCardSkeleton />
          <ResultCardSkeleton />
          <ResultCardSkeleton />
          <ChartCardSkeleton />
          <Text style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>
            O modelo Prophet está treinando com os dados históricos...
          </Text>
        </View>
      ) : erro ? (
        <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
          <EmptyState
            icon="error-outline"
            title="Erro na previsão"
            description={erro}
          />
        </View>
      ) : (
        <ScrollView>
          <View className="p-4 gap-4">

            {/* Card Parâmetros */}
            <Card
              mode="elevated"
              style={[styles.card, { borderLeftColor: '#9CA3AF' }]}
            >
              <Card.Content style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 }}>
                  Parâmetros da Previsão
                </Text>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Biomassa: {substrato}</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Incremento: {quantidade}%</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Ano Alvo: {ano}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: '#E0F2FE' }]}>
                    <Text style={[styles.badgeText, { color: '#0369A1', fontWeight: '600' }]}>
                      {codigoIbge ? `Município: ${municipioNome}` : `Região: ${regiao}`}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: '#F0FDF4' }]}>
                    <Text style={[styles.badgeText, { color: '#166534', fontWeight: '600' }]}>
                      🤖 Prophet (IA)
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Card Resultado Comparativo */}
            <Card
              mode="elevated"
              style={[styles.card, { borderLeftColor: '#2D6EFF' }]}
            >
              <Card.Content style={{ paddingVertical: 14, paddingHorizontal: 16, gap: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937' }}>
                  Resultado da Previsão — {ano}
                </Text>

                {/* Tabela comparativa */}
                <View style={styles.compareTable}>
                  {/* Header */}
                  <View style={[styles.compareRow, styles.compareHeader]}>
                    <Text style={[styles.compareCell, styles.compareHeaderText, { flex: 1.5 }]}> </Text>
                    <Text style={[styles.compareCell, styles.compareHeaderText, { flex: 2 }]}>Cabeças</Text>
                    <Text style={[styles.compareCell, styles.compareHeaderText, { flex: 1.5 }]}>TJ</Text>
                  </View>

                  {/* Baseline */}
                  <View style={styles.compareRow}>
                    <Text style={[styles.compareCell, { flex: 1.5, fontSize: 12, color: '#6B7280' }]}>
                      Baseline Prophet
                    </Text>
                    <Text style={[styles.compareCell, { flex: 2, fontWeight: '600' }]}>
                      {fmtCabecas(baselineCabecas)}
                    </Text>
                    <Text style={[styles.compareCell, { flex: 1.5 }]}>
                      {fmtTJ(baselineTJ)}
                    </Text>
                  </View>

                  {/* Cenário do usuário */}
                  <View style={[styles.compareRow, { backgroundColor: '#EFF6FF' }]}>
                    <Text style={[styles.compareCell, { flex: 1.5, fontSize: 12, color: '#2D6EFF', fontWeight: '700' }]}>
                      Cenário (+{quantidade}%)
                    </Text>
                    <Text style={[styles.compareCell, { flex: 2, fontWeight: '800', color: '#2D6EFF' }]}>
                      {fmtCabecas(cenarioCabecas)}
                    </Text>
                    <Text style={[styles.compareCell, { flex: 1.5, fontWeight: '800', color: '#2D6EFF' }]}>
                      {fmtTJ(cenarioTJ)}
                    </Text>
                  </View>

                  {/* Diferença */}
                  <View style={styles.compareRow}>
                    <Text style={[styles.compareCell, { flex: 1.5, fontSize: 12, color: '#10B981' }]}>
                      Diferença
                    </Text>
                    <Text style={[styles.compareCell, { flex: 2, color: '#10B981', fontWeight: '600' }]}>
                      +{fmtCabecas(cenarioCabecas - baselineCabecas)}
                    </Text>
                    <Text style={[styles.compareCell, { flex: 1.5, color: '#10B981', fontWeight: '600' }]}>
                      +{fmtTJ(cenarioTJ - baselineTJ)}
                    </Text>
                  </View>
                </View>

                {/* Resultado destaque */}
                <View style={{ alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#2D6EFF' }}>
                    {fmtTJ(cenarioTJ)} <Text style={{ fontSize: 20, color: '#4B5563', fontWeight: '600' }}>TJ</Text>
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: '500' }}>
                    Potencial energético estimado com +{quantidade}% no rebanho
                  </Text>
                </View>
              </Card.Content>
            </Card>

            {/* Card Qualidade do Modelo — ocultado para o usuário final, usar apenas em testes */}
            {/* {metricas && (
              <Card
                mode="elevated"
                style={[styles.card, { borderLeftColor: '#10B981' }]}
              >
                <Card.Content style={{ paddingVertical: 14, paddingHorizontal: 16, gap: 8 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937' }}>
                    <MaterialIcons name="analytics" size={16} color="#10B981" /> Qualidade do Modelo
                  </Text>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    <View style={styles.metricBadge}>
                      <Text style={styles.metricLabel}>MAPE</Text>
                      <Text style={[
                        styles.metricValue,
                        { color: metricas.mape < 10 ? '#10B981' : metricas.mape < 20 ? '#F59E0B' : '#EF4444' }
                      ]}>
                        {metricas.mape.toFixed(1)}%
                      </Text>
                    </View>
                    <View style={styles.metricBadge}>
                      <Text style={styles.metricLabel}>MAE</Text>
                      <Text style={styles.metricValue}>
                        {metricas.mae.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </Text>
                    </View>
                    <View style={styles.metricBadge}>
                      <Text style={styles.metricLabel}>RMSE</Text>
                      <Text style={styles.metricValue}>
                        {metricas.rmse.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </Text>
                    </View>
                    <View style={styles.metricBadge}>
                      <Text style={styles.metricLabel}>Treino</Text>
                      <Text style={styles.metricValue}>{metricas.n_pontos_treino} pts</Text>
                    </View>
                  </View>

                  <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                    {metricas.mape < 10
                      ? '✅ Excelente precisão — erro médio abaixo de 10%'
                      : metricas.mape < 20
                      ? '⚠️ Precisão aceitável — erro médio entre 10-20%'
                      : '❌ Precisão baixa — considere usar mesorregião para séries mais estáveis'}
                  </Text>
                </Card.Content>
              </Card>
            )} */}

            {/* Card Estatísticas da Previsão Prophet */}
            {desvio !== null && (
              <Card
                mode="elevated"
                style={[styles.card, { borderLeftColor: '#7C3AED' }]}
              >
                <Card.Content style={{ paddingVertical: 14, paddingHorizontal: 16, gap: 10 }}>
                  {/* Título */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialIcons name="bar-chart" size={18} color="#7C3AED" />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937' }}>
                      Estatísticas da Previsão
                    </Text>
                  </View>

                  {/* Média */}
                  <View style={styles.statRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.statLabel}>Média (valor central)</Text>
                      <Text style={styles.statSubLabel}>Estimativa Prophet para {ano}</Text>
                    </View>
                    <Text style={[styles.statValue, { color: '#2D6EFF' }]}>
                      {fmtCabecas(baselineCabecas)}
                    </Text>
                  </View>

                  <View style={styles.statDivider} />

                  {/* Desvio Padrão */}
                  <View style={styles.statRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.statLabel}>Desvio Padrão (σ)</Text>
                      <Text style={styles.statSubLabel}>Derivado do intervalo de confiança 80%</Text>
                    </View>
                    <Text style={[styles.statValue, { color: '#7C3AED' }]}>
                      {fmtCabecas(desvio)}
                    </Text>
                  </View>

                  <View style={styles.statDivider} />

                  {/* Intervalo de Confiança */}
                  <View style={styles.statRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.statLabel}>Intervalo de Confiança (80%)</Text>
                      <Text style={styles.statSubLabel}>Faixa de variação esperada</Text>
                    </View>
                    <Text style={[styles.statValue, { color: '#6B7280', fontSize: 12 }]}>
                      {fmtCabecas(limiteInf ?? 0)} – {fmtCabecas(limiteSup ?? 0)}
                    </Text>
                  </View>

                  <View style={styles.statDivider} />

                  {/* Tolerâncias */}
                  <View style={{ gap: 6 }}>
                    <Text style={styles.statLabel}>Tolerâncias</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={[styles.tolBadge, { backgroundColor: '#F3E8FF' }]}>
                        <Text style={[styles.tolLabel, { color: '#7C3AED' }]}>±1σ (~68%)</Text>
                        <Text style={[styles.tolValue, { color: '#7C3AED' }]}>
                          ±{fmtCabecas(tol1sigma ?? 0)}
                        </Text>
                      </View>
                      <View style={[styles.tolBadge, { backgroundColor: '#EDE9FE' }]}>
                        <Text style={[styles.tolLabel, { color: '#5B21B6' }]}>±2σ (~95%)</Text>
                        <Text style={[styles.tolValue, { color: '#5B21B6' }]}>
                          ±{fmtCabecas(tol2sigma ?? 0)}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
                      Interpretação: a previsão central pode variar em ±1σ com 68% de probabilidade e ±2σ com 95%.
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            )}

            {/* Gráfico */}
            <View
              ref={viewRef}
              collapsable={false}
              style={styles.chartContainer}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 4 }}>
                Série Histórica + Previsão Prophet
              </Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>
                Cabeças de {substrato} — {anoInicio} → {anoAlvo}
              </Text>

              <View style={{ flexDirection: 'row', gap: 16, marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 16, height: 3, backgroundColor: '#2D6EFF', borderRadius: 2 }} />
                  <Text style={{ fontSize: 11, color: '#6B7280' }}>
                    {incrementoPercent !== 0 ? 'Histórico + Cenário' : 'Histórico + Previsão'}
                  </Text>
                </View>
              </View>

              {dadosGrafico.length > 0 ? (
                <View style={{ height: 300 }}>
                  <CartesianChart
                    data={dadosGrafico}
                    xKey="ano"
                    yKeys={["value"]}
                    chartPressState={[firstPress, secondPress]}
                    axisOptions={{
                      font,
                      tickCount: { x: 5, y: 5 },
                      formatYLabel: (v) => {
                        if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                        if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
                        return String(Math.round(v));
                      },
                      formatXLabel: (v) => String(v),
                    }}
                    domainPadding={{ right: 20, top: 30, left: 20 }}
                  >
                    {({ points, chartBounds }) => (
                      <>
                        <Area
                          points={points.value}
                          y0={chartBounds.bottom}
                          color="rgba(45, 110, 255, 0.12)"
                          animate={{ type: "timing", duration: 300 }}
                          curveType="natural"
                        />
                        <Line
                          points={points.value}
                          color="#2D6EFF"
                          strokeWidth={3}
                          animate={{ type: "timing", duration: 300 }}
                          curveType="natural"
                        />

                        {isFirstActive && (
                          <ToolTip
                            x={firstPress.x.position}
                            y={firstPress.y.value.position}
                            value={firstPress.y.value.value}
                            color="#2D6EFF"
                            font={tooltipFont}
                          />
                        )}

                        {isSecondActive && (
                          <ToolTip
                            x={secondPress.x.position}
                            y={secondPress.y.value.position}
                            value={secondPress.y.value.value}
                            color="#FF6B2D"
                            font={tooltipFont}
                          />
                        )}
                      </>
                    )}
                  </CartesianChart>
                </View>
              ) : (
                <EmptyState
                  icon="show-chart"
                  title="Sem dados"
                  description="Não foi possível gerar o gráfico."
                />
              )}
            </View>

            <View className="flex-row justify-between items-center">
              <Button icon="download" mode="text" textColor="#000000" onPress={exportarGrafico}>
                Exportar
              </Button>
            </View>

          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#9CA3AF',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  badge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  compareTable: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  compareRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  compareHeader: {
    backgroundColor: '#F8FAFC',
    borderBottomColor: '#E2E8F0',
  },
  compareHeaderText: {
    fontWeight: '700',
    color: '#4B5563',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  compareCell: {
    fontSize: 13,
    color: '#1F2937',
  },
  metricBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 70,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 2,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 12,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  // --- Estatísticas da Previsão ---
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  statSubLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'right',
  },
  statDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  tolBadge: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 2,
  },
  tolLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tolValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
});