import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { CartesianChart, Line, Area } from "victory-native";
import { LinearGradient, useFont, vec } from "@shopify/react-native-skia";
import { useState, useEffect } from "react";
import { api, REGION_NAME_MAP } from "../services/api";
import { ChartCardSkeleton } from "../shared/components/SkeletonLoader";
import EmptyState from "../shared/components/EmptyState";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type YearData = { year: number; value: number };

const REGIOES = [
  { id: "mata", label: "Mata" },
  { id: "agreste", label: "Agreste" },
  { id: "borborema", label: "Borborema" },
  { id: "sertao", label: "Sertão" },
];

export default function MesoregionAnalysis() {
  const insets = useSafeAreaInsets();

  const [selectedRegion, setSelectedRegion] = useState<
    "mata" | "agreste" | "borborema" | "sertao"
  >("mata");
  const [lineChartData, setLineChartData] = useState<YearData[]>([]);
  const [carregandoLinhas, setCarregandoLinhas] = useState(false);

  // Métricas resumidas calculadas a partir dos dados
  const [potencialTotal, setPotencialTotal] = useState<number | null>(null);
  const [variacao, setVariacao] = useState<number | null>(null);
  const [mediaAnual, setMediaAnual] = useState<number | null>(null);
  const [anoBase, setAnoBase] = useState<number | null>(null);

  const carregarDadosLinhas = async () => {
    setCarregandoLinhas(true);
    try {
      const nomeMesoReal = REGION_NAME_MAP[selectedRegion];
      const serieRes = await api.getEnergiaMesorregioSerie(nomeMesoReal, undefined);

      if (!serieRes || !serieRes.dados || serieRes.dados.length === 0) {
        setLineChartData([]);
        setPotencialTotal(null);
        setVariacao(null);
        setMediaAnual(null);
        setAnoBase(null);
        return;
      }

      const resultados = serieRes.dados.map((item: any) => ({
        year: item.ano,
        value: parseFloat(item.potencial_tj.toFixed(2)),
      }));
      setLineChartData(resultados);

      // Calcular métricas
      const ultimo = resultados[resultados.length - 1];
      const penultimo = resultados[resultados.length - 2];
      const media =
        resultados.reduce((acc: number, d: YearData) => acc + d.value, 0) /
        resultados.length;

      setPotencialTotal(ultimo?.value ?? null);
      setAnoBase(ultimo?.year ?? null);
      setMediaAnual(parseFloat(media.toFixed(2)));

      if (penultimo && ultimo) {
        const pct = ((ultimo.value - penultimo.value) / penultimo.value) * 100;
        setVariacao(parseFloat(pct.toFixed(1)));
      } else {
        setVariacao(null);
      }
    } catch (error) {
      console.error("[MesoregionAnalysis] Erro:", error);
    } finally {
      setCarregandoLinhas(false);
    }
  };

  useEffect(() => {
    carregarDadosLinhas();
  }, [selectedRegion]);

  const fonts = useFont(require("./../../assets/static/Inter_18pt-Regular.ttf"));

  const valuesY = lineChartData.map((d) => d.value);
  const minY = valuesY.length > 0 ? Math.min(...valuesY) : 0;
  const maxY = valuesY.length > 0 ? Math.max(...valuesY) : 100;
  const paddingY = (maxY - minY) * 0.1 || 10;
  const domainY = [Math.max(0, minY - paddingY), maxY + paddingY] as [
    number,
    number
  ];

  const formatValue = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M TJ`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K TJ`;
    return `${v.toFixed(0)} TJ`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* ── PILL CHIPS DE MESORREGIÃO ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsRow}
          >
            {REGIOES.map((item) => {
              const isSelected = selectedRegion === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedRegion(item.id as any)}
                  style={[styles.pill, isSelected && styles.pillSelected]}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.pillText,
                      isSelected && styles.pillTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── GRÁFICO HISTÓRICO ── */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Evolução histórica (TJ)</Text>
            <View style={styles.chartArea}>
              {carregandoLinhas ? (
                <ChartCardSkeleton />
              ) : lineChartData.length === 0 ? (
                <EmptyState
                  icon="show-chart"
                  title="Sem dados históricos"
                  description="Não há dados suficientes para a região selecionada."
                />
              ) : (
                <CartesianChart
                  data={lineChartData}
                  xKey="year"
                  yKeys={["value"]}
                  domain={{ y: domainY }}
                  axisOptions={{
                    tickCount: { x: 5, y: 6 },
                    font: fonts,
                    formatYLabel: (v) => {
                      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                      if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
                      return `${v.toFixed(0)}`;
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
                        animate={{ type: "timing", duration: 300 }}
                        curveType="natural"
                      />
                      <Line
                        points={points.value}
                        color="#16A34A"
                        strokeWidth={3}
                        animate={{ type: "timing", duration: 300 }}
                        curveType="natural"
                      />
                    </>
                  )}
                </CartesianChart>
              )}
            </View>
          </View>

          {/* ── RESUMO DA MESORREGIÃO ── */}
          {!carregandoLinhas && potencialTotal !== null && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>
                Resumo da mesorregião ({anoBase})
              </Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Potencial total</Text>
                  <Text style={styles.summaryValue}>
                    {potencialTotal.toLocaleString("pt-BR")} TJ
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>
                    Variação (vs. {(anoBase ?? 0) - 1})
                  </Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      variacao !== null && variacao >= 0
                        ? styles.positiveText
                        : styles.negativeText,
                    ]}
                  >
                    {variacao !== null
                      ? `${variacao >= 0 ? "+" : ""}${variacao}%`
                      : "—"}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Média anual</Text>
                  <Text style={styles.summaryValue}>
                    {mediaAnual !== null
                      ? `${mediaAnual.toLocaleString("pt-BR")} TJ`
                      : "—"}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },
  // Pills
  pillsRow: {
    gap: 8,
    paddingVertical: 4,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  pillSelected: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  pillTextSelected: {
    color: "#FFFFFF",
  },
  // Chart card
  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  chartArea: {
    height: 300,
    width: "100%",
  },
  // Summary card
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#F1F5F9",
  },
  summaryLabel: {
    fontSize: 11,
    color: "#94A3B8",
    marginBottom: 4,
    textAlign: "center",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
  },
  positiveText: {
    color: "#10B981",
  },
  negativeText: {
    color: "#EF4444",
  },
});
