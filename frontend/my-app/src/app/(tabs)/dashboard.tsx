import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { CartesianChart, Bar, useChartPressState } from "victory-native";
import { useFont } from "@shopify/react-native-skia";
import { useState, useRef, useEffect } from "react";
import { Dropdown } from "react-native-element-dropdown";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { makeImageFromView } from "@shopify/react-native-skia";
import { File, Paths } from "expo-file-system";
import { api, SUBSTRATO_MAP } from "../../services/api";
import { ChartCardSkeleton } from "../../shared/components/SkeletonLoader";
import EmptyState from "../../shared/components/EmptyState";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Item = { meso: string; value: number };

const mostRecentYear = 2022;

const dataDrop = Array.from({ length: 2024 - 1974 + 1 }, (_, i) => ({
  label: String(1974 + i),
  value: 1974 + i,
}));

const ANIMAIS = [
  { id: "todos", label: "Todos" },
  { id: "ovino", label: "Ovino" },
  { id: "bovino", label: "Bovino" },
  { id: "caprino", label: "Caprino" },
  { id: "suino", label: "Suíno" },
];

const LEGENDA = [
  { sigla: "M", nome: "Mata Paraibana" },
  { sigla: "A", nome: "Agreste" },
  { sigla: "B", nome: "Borborema" },
  { sigla: "S", nome: "Sertão" },
];

export default function Dashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const viewRef1 = useRef(null);

  const exportarGrafico = async (ref: React.RefObject<any>, nomeArquivo: string) => {
    try {
      const image = await makeImageFromView(ref);
      if (!image) return;
      const base64 = image.encodeToBase64();
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const file = new File(Paths.cache, nomeArquivo);
      file.create({ overwrite: true });
      file.write(bytes);
      await Sharing.shareAsync(file.uri, {
        mimeType: "image/jpeg",
        dialogTitle: "Salvar gráfico",
      });
    } catch (err) {
      console.error("Erro ao exportar:", err);
    }
  };

  const [selectedAnimal, setSelectedAnimal] = useState<
    "ovino" | "bovino" | "caprino" | "galinaceo" | "suino" | "equino" | "todos"
  >("todos");
  const [selectedYear, setSelectedYear] = useState<number>(mostRecentYear);

  const [barChartData, setBarChartData] = useState<Item[]>([
    { meso: "0", value: 0 },
    { meso: "M", value: 0 },
    { meso: "A", value: 0 },
    { meso: "B", value: 0 },
    { meso: "S", value: 0 },
  ]);
  const [carregandoBarras, setCarregandoBarras] = useState(false);

  const carregarDadosGraficoBarras = async () => {
    setCarregandoBarras(true);
    try {
      const substratoDb =
        selectedAnimal === "todos" ? undefined : SUBSTRATO_MAP[selectedAnimal];

      const mapaLabel: Record<string, string> = {
        "Mata Paraibana": "M",
        "Agreste Paraibano": "A",
        Borborema: "B",
        "Sertão Paraibano": "S",
      };

      if (selectedAnimal === "todos") {
        const totais = await api.getEnergiaMesorregioesTotais(selectedYear);
        const resultados = totais.map((item) => ({
          meso: mapaLabel[item.mesorregiao] ?? item.mesorregiao,
          value: parseFloat(item.potencial_tj.toFixed(2)),
        }));
        setBarChartData([{ meso: "0", value: 0 }, ...resultados]);
      } else {
        const regioes = [
          { key: "Mata Paraibana", label: "M" },
          { key: "Agreste Paraibano", label: "A" },
          { key: "Borborema", label: "B" },
          { key: "Sertão Paraibano", label: "S" },
        ];
        const promessas = regioes.map(async (r) => {
          try {
            const res = await api.getEnergiaMesorregiao(r.key, selectedYear, substratoDb);
            return { meso: r.label, value: parseFloat(res.potencial_tj.toFixed(2)) };
          } catch {
            return { meso: r.label, value: 0 };
          }
        });
        const resultados = await Promise.all(promessas);
        setBarChartData([{ meso: "0", value: 0 }, ...resultados]);
      }
    } catch (error) {
      console.error("[Dashboard] Erro ao carregar dados:", error);
    } finally {
      setCarregandoBarras(false);
    }
  };

  useEffect(() => {
    carregarDadosGraficoBarras();
  }, [selectedAnimal, selectedYear]);

  const font = useFont(require("./../../../assets/static/Inter_18pt-Regular.ttf"));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIcon}>
            <MaterialIcons name="menu" size={22} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <TouchableOpacity style={styles.headerIcon}>
            <MaterialIcons name="tune" size={22} color="#1E293B" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* ── PILL CHIPS DE SUBSTRATO ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsRow}
          >
            {ANIMAIS.map((item) => {
              const isSelected = selectedAnimal === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedAnimal(item.id as any)}
                  style={[styles.pill, isSelected && styles.pillSelected]}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── DROPDOWN DE ANO ── */}
          <View style={styles.yearRow}>
            <Dropdown
              data={dataDrop}
              labelField="label"
              valueField="value"
              placeholder="Selecione..."
              value={selectedYear}
              onChange={(item) => setSelectedYear(item.value)}
              placeholderStyle={{ fontSize: 13, color: "#94A3B8" }}
              selectedTextStyle={{ fontSize: 13, fontWeight: "700", color: "#1E293B" }}
              style={styles.yearDropdown}
            />
          </View>

          {/* ── SEÇÃO: GRÁFICO DE BARRAS ── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              Potencial energético por mesorregião (TJ)
            </Text>

            <View ref={viewRef1} collapsable={false} style={{ backgroundColor: "#FFFFFF" }}>
              <View style={styles.chartArea}>
                {carregandoBarras ? (
                  <ChartCardSkeleton />
                ) : (
                  <CartesianChart
                    data={barChartData}
                    xKey="meso"
                    yKeys={["value"]}
                    axisOptions={{
                      tickCount: 6,
                      font,
                      formatYLabel: (value) => `${value}TJ`,
                    }}
                    domainPadding={{ right: 50, top: 30 }}
                  >
                    {({ points, chartBounds }) => (
                      <Bar
                        color="#2563EB"
                        chartBounds={chartBounds}
                        points={points.value}
                        barWidth={35}
                        animate={{ type: "timing" }}
                      />
                    )}
                  </CartesianChart>
                )}
              </View>
            </View>

            {/* Legenda */}
            <View style={styles.legendRow}>
              {LEGENDA.map((l) => (
                <View key={l.sigla} style={styles.legendItem}>
                  <View style={styles.legendDot} />
                  <Text style={styles.legendText}>
                    {l.sigla} = {l.nome}
                  </Text>
                </View>
              ))}
            </View>

            {/* Exportar */}
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={() => exportarGrafico(viewRef1, "grafico_barras.png")}
              activeOpacity={0.75}
            >
              <MaterialIcons name="download" size={15} color="#64748B" />
              <Text style={styles.exportText}>Exportar gráfico</Text>
            </TouchableOpacity>
          </View>

          {/* ── CARD "ANÁLISES POR MESORREGIÃO" ── */}
          <TouchableOpacity
            style={styles.analysisCard}
            activeOpacity={0.78}
            onPress={() => router.push("/mesoregion-analysis")}
          >
            <View style={styles.analysisIconWrap}>
              <MaterialIcons name="history" size={20} color="#2563EB" />
            </View>
            <View style={styles.analysisText}>
              <Text style={styles.analysisTitle}>Análises por mesorregião</Text>
              <Text style={styles.analysisSub}>
                Veja a evolução histórica de cada região
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#CBD5E1" />
          </TouchableOpacity>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F8FAFC",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E293B",
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    paddingHorizontal: 16,
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
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  pillTextSelected: {
    color: "#FFFFFF",
  },
  // Year dropdown
  yearRow: {
    alignItems: "flex-end",
  },
  yearDropdown: {
    width: 110,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 34,
    backgroundColor: "#FFFFFF",
  },
  // Section card
  sectionCard: {
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  chartArea: {
    height: 280,
    width: "100%",
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563EB",
  },
  legendText: {
    fontSize: 12,
    color: "#64748B",
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  exportText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  // Analysis card
  analysisCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  analysisIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  analysisText: {
    flex: 1,
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  analysisSub: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
});
