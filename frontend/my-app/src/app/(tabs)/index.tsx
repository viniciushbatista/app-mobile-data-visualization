import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import MapaParaiba, { MapaParaibaRef } from "../../shared/components/map/PbMap";
import { useRef, useState, useEffect } from "react";
import { Dropdown } from "react-native-element-dropdown";
import { api } from "../../services/api";
import { useRouter } from "expo-router";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const anosDisponiveis = Array.from({ length: 2024 - 1974 + 1 }, (_, i) => {
  const ano = String(1974 + i);
  return { label: ano, value: ano };
});

export default function MapaScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const mapaRef = useRef<MapaParaibaRef>(null);

  const [anoSelecionado, setAnoSelecionado] = useState("2021");
  const [regiaoSelecionada, setRegiaoSelecionada] = useState<{
    nome: string;
    valor: number;
  } | null>(null);
  const [potencialTotal, setPotencialTotal] = useState<number | null>(null);
  const [carregandoTotal, setCarregandoTotal] = useState(false);

  // Carrega potencial total da Paraíba (soma de todas as mesorregiões)
  useEffect(() => {
    let isMounted = true;
    const carregarTotal = async () => {
      setCarregandoTotal(true);
      try {
        const totaisMeso = await api.getEnergiaMesorregioesTotais(
          Number(anoSelecionado)
        );
        if (!isMounted) return;
        const total = totaisMeso.reduce(
          (acc, item) => acc + item.potencial_tj,
          0
        );
        setPotencialTotal(parseFloat(total.toFixed(3)));

        const dadosFormatados = totaisMeso.map((item) => ({
          name: item.mesorregiao,
          value: item.potencial_tj,
        }));
        mapaRef.current?.atualizarDados(dadosFormatados);

        if (regiaoSelecionada) {
          const mesoAtualizada = totaisMeso.find(
            (r) => r.mesorregiao === regiaoSelecionada.nome
          );
          if (mesoAtualizada) {
            setRegiaoSelecionada({
              nome: mesoAtualizada.mesorregiao,
              valor: mesoAtualizada.potencial_tj,
            });
          }
        }
      } catch (error) {
        console.error("[MapaScreen] Erro ao carregar dados:", error);
      } finally {
        if (isMounted) setCarregandoTotal(false);
      }
    };
    carregarTotal();
    return () => {
      isMounted = false;
    };
  }, [anoSelecionado]);

  const valorExibido = regiaoSelecionada?.valor ?? potencialTotal;
  const labelExibido = regiaoSelecionada
    ? regiaoSelecionada.nome
    : "Paraíba (total)";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>

        {/* ── CARD HERO VERDE ── */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={["#14532D", "#16A34A", "#22C55E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            {/* Círculo decorativo de fundo */}
            <View style={styles.heroCircle} />

            <View style={styles.heroContent}>
              <View style={styles.heroLeft}>
                <Text style={styles.heroLabel}>Potencial energético total</Text>
                {carregandoTotal && potencialTotal === null ? (
                  <ActivityIndicator color="#FFFFFF" size="small" style={{ marginTop: 8 }} />
                ) : (
                  <Text style={styles.heroValue}>
                    {valorExibido != null
                      ? `${valorExibido.toLocaleString("pt-BR")} TJ`
                      : "—"}
                  </Text>
                )}
                <View style={styles.heroLocationRow}>
                  <MaterialIcons name="place" size={12} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.heroLocationText}>{labelExibido}</Text>
                </View>
              </View>
              <View style={styles.heroBadge}>
                <MaterialIcons name="bolt" size={28} color="#FFFFFF" />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── DROPDOWN DE ANO ── */}
        <View style={styles.dropdownRow}>
          <Dropdown
            data={anosDisponiveis}
            labelField="label"
            valueField="value"
            value={anoSelecionado}
            onChange={(item) => {
              setAnoSelecionado(item.value);
              mapaRef.current?.atualizarAno(item.value);
            }}
            placeholderStyle={{ fontSize: 13, color: "#94A3B8" }}
            selectedTextStyle={{ fontSize: 13, fontWeight: "700", color: "#1E293B" }}
            style={styles.dropdown}
          />
        </View>

        {/* ── MAPA ── */}
        <View style={styles.mapContainer}>
          <MapaParaiba
            ref={mapaRef}
            onRegionPress={(nome, valor) =>
              setRegiaoSelecionada({ nome, valor })
            }
          />
        </View>

        {/* ── CARDS DE ATALHO ── */}
        <View style={styles.shortcutsRow}>
          <TouchableOpacity
            style={styles.shortcutCard}
            activeOpacity={0.78}
            onPress={() => router.push("/cities")}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: "#F0FDF4" }]}>
              <MaterialIcons name="location-city" size={18} color="#16A34A" />
            </View>
            <View style={styles.shortcutText}>
              <Text style={styles.shortcutTitle}>Explorar cidades</Text>
              <Text style={styles.shortcutSub}>Veja o potencial por cidade</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutCard}
            activeOpacity={0.78}
            onPress={() => router.push("/(tabs)/dashboard")}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: "#F0FDF4" }]}>
              <MaterialCommunityIcons name="chart-bar" size={18} color="#16A34A" />
            </View>
            <View style={styles.shortcutText}>
              <Text style={styles.shortcutTitle}>Dashboard</Text>
              <Text style={styles.shortcutSub}>Visualize análises e gráficos</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── BOTÃO EXPORTAR ── */}
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={() => mapaRef.current?.exportarMapa()}
          activeOpacity={0.75}
        >
          <MaterialIcons name="download" size={16} color="#64748B" />
          <Text style={styles.exportText}>Exportar mapa</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  // Header
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
  // Card hero
  heroContainer: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  heroCard: {
    borderRadius: 16,
    padding: 20,
    overflow: "hidden",
    position: "relative",
  },
  heroCircle: {
    position: "absolute",
    right: -30,
    top: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroLeft: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  heroValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
    letterSpacing: -0.5,
  },
  heroLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 6,
  },
  heroLocationText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  heroBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  // Dropdown
  dropdownRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    alignItems: "flex-start",
  },
  dropdown: {
    width: 110,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 34,
    backgroundColor: "#FFFFFF",
  },
  // Mapa
  mapContainer: {
    height: 340,
    marginTop: 4,
  },
  // Atalhos
  shortcutsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 12,
  },
  shortcutCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  shortcutIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutText: {
    flex: 1,
  },
  shortcutTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  shortcutSub: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 1,
  },
  // Export
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 12,
    marginLeft: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  exportText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
});
