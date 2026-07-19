import { View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity } from "react-native";
import { CartesianChart, Line, Area, useChartPressState } from "victory-native";
import { useFont, Circle, Text as SkiaText } from '@shopify/react-native-skia'
import { Card } from 'react-native-paper'
import { useRef, useState, useEffect } from "react";
import * as Sharing from 'expo-sharing'
import { makeImageFromView } from '@shopify/react-native-skia';
import { File as ExpoFile, Paths } from 'expo-file-system';
import { useLocalSearchParams } from "expo-router";
import type { SharedValue } from "react-native-reanimated";
import { useDerivedValue } from "react-native-reanimated";
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

  // Calcular variação % do cenário vs baseline
  const variacaoPct = baselineTJ > 0
    ? ((cenarioTJ - baselineTJ) / baselineTJ) * 100
    : 0;
  const variacaoStr = variacaoPct >= 0
    ? `+${variacaoPct.toFixed(1)}%`
    : `${variacaoPct.toFixed(1)}%`;

  // Data de execução
  const dataExecucao = new Date().toLocaleDateString('pt-BR') + ' – ' +
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={newStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
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
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={newStyles.content}>

            {/* ── CARD HERO COM GRADIENTE ── */}
            <View style={newStyles.heroContainer}>
              <LinearGradient
                colors={['#14532D', '#15803D', '#16A34A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={newStyles.heroCard}
              >
                <View style={newStyles.heroCircle} />
                <Text style={newStyles.heroSmallLabel}>Resultado da simulação</Text>
                <Text style={newStyles.heroDate}>Executado em {dataExecucao}</Text>

                <View style={newStyles.heroMetrics}>
                  <View style={newStyles.heroMetricMain}>
                    <Text style={newStyles.heroMetricLabel}>Potencial estimado</Text>
                    <Text style={newStyles.heroMetricValue}>{fmtTJ(cenarioTJ)} TJ</Text>
                  </View>
                  <View style={newStyles.heroDivider} />
                  <View style={newStyles.heroMetricItem}>
                    <Text style={newStyles.heroMetricLabel}>Variação vs. atual</Text>
                    <Text style={[newStyles.heroMetricMid, { color: variacaoPct >= 0 ? '#6EE7B7' : '#FCA5A5' }]}>
                      {variacaoStr}
                    </Text>
                  </View>
                  <View style={newStyles.heroDivider} />
                  <View style={newStyles.heroMetricItem}>
                    <Text style={newStyles.heroMetricLabel}>Ano alvo</Text>
                    <Text style={newStyles.heroMetricMid}>{ano}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* ── GRÁFICO: EVOLUÇÃO PROJETADA ── */}
            <View style={newStyles.sectionCard}>
              <Text style={newStyles.sectionTitle}>Evolução projetada (TJ)</Text>
              <Text style={newStyles.sectionSub}>
                Cabeças de {substrato} — {anoInicio} → {anoAlvo}
              </Text>

              <View
                ref={viewRef}
                collapsable={false}
                style={{ backgroundColor: '#FFFFFF' }}
              >
                {dadosGrafico.length > 0 ? (
                  <View style={{ height: 280 }}>
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
                            color="rgba(22, 163, 74, 0.10)"
                            animate={{ type: 'timing', duration: 300 }}
                            curveType="natural"
                          />
                          <Line
                            points={points.value}
                            color="#16A34A"
                            strokeWidth={3}
                            animate={{ type: 'timing', duration: 300 }}
                            curveType="natural"
                          />
                          {isFirstActive && (
                            <ToolTip
                              x={firstPress.x.position}
                              y={firstPress.y.value.position}
                              value={firstPress.y.value.value}
                              color="#16A34A"
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
            </View>

            {/* ── PARÂMETROS USADOS ── */}
            <View style={newStyles.sectionCard}>
              <Text style={newStyles.sectionTitle}>Parâmetros utilizados</Text>
              <View style={newStyles.paramsGrid}>
                <View style={newStyles.paramChip}>
                  <Text style={newStyles.paramLabel}>Substrato</Text>
                  <Text style={newStyles.paramValue}>{substrato}</Text>
                </View>
                <View style={newStyles.paramChip}>
                  <Text style={newStyles.paramLabel}>
                    {codigoIbge ? 'Cidade' : 'Mesorregião'}
                  </Text>
                  <Text style={newStyles.paramValue}>
                    {codigoIbge ? (municipioNome || '—') : (regiao || '—')}
                  </Text>
                </View>
                <View style={newStyles.paramChip}>
                  <Text style={newStyles.paramLabel}>Incremento do rebanho</Text>
                  <Text style={newStyles.paramValue}>{quantidade}%</Text>
                  <Text style={[newStyles.paramLabel, { marginTop: 4, color: '#64748B' }]}>
                    → {fmtCabecas(cenarioCabecas)} cabeças
                  </Text>
                </View>
                <View style={newStyles.paramChip}>
                  <Text style={newStyles.paramLabel}>Ano alvo</Text>
                  <Text style={newStyles.paramValue}>{ano}</Text>
                </View>
              </View>
            </View>

            {/* ── ESTATÍSTICAS (se disponíveis) ── */}
            {desvio !== null && (
              <View style={newStyles.sectionCard}>
                <Text style={newStyles.sectionTitle}>Estatísticas da Previsão</Text>

                <View style={styles.statRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.statLabel}>Média (valor central)</Text>
                    <Text style={styles.statSubLabel}>Estimativa Prophet para {ano}</Text>
                  </View>
                  <Text style={[styles.statValue, { color: '#16A34A' }]}>
                    {fmtCabecas(baselineCabecas)}
                  </Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.statLabel}>Intervalo de Confiança (80%)</Text>
                    <Text style={styles.statSubLabel}>Faixa de variação esperada</Text>
                  </View>
                  <Text style={[styles.statValue, { color: '#6B7280', fontSize: 12 }]}>
                    {fmtCabecas(limiteInf ?? 0)} – {fmtCabecas(limiteSup ?? 0)}
                  </Text>
                </View>
              </View>
            )}

            {/* ── BOTÃO SALVAR ── */}
            <TouchableOpacity
              style={newStyles.saveBtn}
              onPress={exportarGrafico}
              activeOpacity={0.85}
            >
              <MaterialIcons name="download" size={18} color="#FFFFFF" />
              <Text style={newStyles.saveBtnText}>Salvar resultado</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      )}
    </View>
  );
}

const newStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    gap: 14,
  },
  // Hero
  heroContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroCard: {
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  heroCircle: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroSmallLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.3,
  },
  heroDate: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
    marginBottom: 16,
  },
  heroMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroMetricMain: {
    flex: 2,
  },
  heroMetricItem: {
    flex: 1.2,
    alignItems: 'center',
  },
  heroDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 10,
  },
  heroMetricLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  heroMetricValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  heroMetricMid: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
    textAlign: 'center',
  },
  // Section card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: -4,
    marginBottom: 8,
  },
  // Params grid
  paramsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  paramChip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 100,
  },
  paramLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  paramValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  // Save button
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    height: 50,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

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