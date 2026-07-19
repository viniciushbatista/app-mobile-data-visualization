import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { Text, Searchbar, ActivityIndicator } from "react-native-paper";
import { Dropdown } from "react-native-element-dropdown";
import { useState, useEffect } from "react";
import { api } from "../services/api";
import { ListRowSkeleton } from "../shared/components/SkeletonLoader";
import EmptyState from "../shared/components/EmptyState";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const anosDisponiveis = Array.from({ length: 2024 - 1974 + 1 }, (_, i) => {
  const ano = String(1974 + i);
  return { label: ano, value: ano };
});

export default function CitiesScreen() {
  const insets = useSafeAreaInsets();

  const [anoSelecionado, setAnoSelecionado] = useState("2021");

  // Ao trocar o ano: limpa cache de potenciais e cidade selecionada
  const handleAnoChange = (novoAno: string) => {
    setAnoSelecionado(novoAno);
    setSelectedCity(null);
    // Reseta os potenciais já carregados para forçar novo fetch com o ano correto
    setCidades((prev) => prev.map((c) => ({ ...c, potencial: null })));
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [cidades, setCidades] = useState<any[]>([]);
  const [filteredCities, setFilteredCities] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<any | null>(null);
  const [carregandoCidades, setCarregandoCidades] = useState(false);

  // Carrega lista de municípios
  useEffect(() => {
    let isMounted = true;
    const carregarMunicipios = async () => {
      setCarregandoCidades(true);
      try {
        const res = await api.getMunicipiosTotais(Number(anoSelecionado));
        if (!isMounted) return;
        const listaCidades = res.dados.map((item: any) => ({
          codigo_ibge: item.codigo_ibge,
          nome: item.municipio,
          mesorregiao: item.mesorregiao,
          potencial: null as number | null | "sem_dado",
        }));
        setCidades(listaCidades);
      } catch (error) {
        console.error("[CitiesScreen] Erro ao carregar municípios:", error);
      } finally {
        if (isMounted) setCarregandoCidades(false);
      }
    };
    carregarMunicipios();
    return () => { isMounted = false; };
  }, [anoSelecionado]);

  // Filtra cidades conforme busca
  useEffect(() => {
    if (searchQuery.length === 0) {
      setFilteredCities(cidades.slice(0, 30));
      return;
    }
    const filtered = cidades.filter((cidade) =>
      cidade.nome.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCities(filtered.slice(0, 15));
  }, [searchQuery, cidades]);

  // Carrega potencial da cidade ao selecionar
  const handleSelectCity = async (item: any) => {
    if (selectedCity?.nome === item.nome) {
      setSelectedCity(null);
      return;
    }
    setSelectedCity(item);

    if (item.potencial === null) {
      try {
        const res = await api.getEnergiaMunicipio(
          item.codigo_ibge,
          Number(anoSelecionado)
        );
        if (!res.resultados || res.resultados.length === 0) {
          const updated = { ...item, potencial: "sem_dado" as const };
          setCidades((prev) =>
            prev.map((c) => (c.codigo_ibge === item.codigo_ibge ? updated : c))
          );
          setSelectedCity(updated);
        } else {
          const potencialTotal = res.resultados.reduce(
            (acc: number, curr: any) => acc + curr.potencial_tj,
            0
          );
          const potencialFormatado = parseFloat(potencialTotal.toFixed(2));
          const updated = { ...item, potencial: potencialFormatado };
          setCidades((prev) =>
            prev.map((c) => (c.codigo_ibge === item.codigo_ibge ? updated : c))
          );
          setSelectedCity(updated);
        }
      } catch {
        const updated = { ...item, potencial: "sem_dado" as const };
        setCidades((prev) =>
          prev.map((c) => (c.codigo_ibge === item.codigo_ibge ? updated : c))
        );
        setSelectedCity(updated);
      }
    }
  };

  const renderCityItem = (item: any) => {
    const isSelected = selectedCity?.nome === item.nome;
    const hasPotential =
      item.potencial !== null && item.potencial !== "sem_dado";

    return (
      <TouchableOpacity
        key={item.nome}
        onPress={() => handleSelectCity(item)}
        activeOpacity={0.75}
        style={[styles.cityRow, isSelected && styles.cityRowSelected]}
      >
        {/* Borda esquerda azul quando selecionado */}
        {isSelected && <View style={styles.cityRowAccent} />}

        <View style={styles.cityInfo}>
          <Text
            style={[styles.cityName, isSelected && styles.cityNameSelected]}
          >
            {item.nome}
          </Text>
          <Text style={styles.cityMeso}>{item.mesorregiao}</Text>

          {isSelected && (
            <View style={styles.cityDetail}>
              {item.potencial === null ? (
                <ActivityIndicator size="small" color="#16A34A" />
              ) : item.potencial === "sem_dado" ? (
                <Text style={styles.cityNoData}>
                  Dado não disponível para {anoSelecionado}
                </Text>
              ) : (
                <Text style={styles.cityPotencialLabel}>
                  Potencial:{" "}
                  <Text style={styles.cityPotencialValue}>
                    {item.potencial.toLocaleString("pt-BR")} TJ
                  </Text>
                </Text>
              )}
              <Text style={styles.cityYear}>Ref. {anoSelecionado}</Text>
            </View>
          )}
        </View>

        <View style={styles.cityRight}>
          {hasPotential && !isSelected && (
            <Text style={styles.cityTJ}>
              {item.potencial.toLocaleString("pt-BR")} TJ
            </Text>
          )}
          {hasPotential && !isSelected && (
            <Text style={styles.cityYearSmall}>{anoSelecionado}</Text>
          )}
          <MaterialIcons
            name={isSelected ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            size={18}
            color={isSelected ? "#16A34A" : "#CBD5E1"}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Barra de busca */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar cidade da Paraíba"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
          inputStyle={{ fontSize: 14, color: "#1E293B" }}
          iconColor="#94A3B8"
          placeholderTextColor="#94A3B8"
          elevation={0}
        />
        <Dropdown
          data={anosDisponiveis}
          labelField="label"
          valueField="value"
          value={anoSelecionado}
          onChange={(item) => handleAnoChange(item.value)}
          placeholder="Ano"
          placeholderStyle={{ fontSize: 13, color: "#94A3B8" }}
          selectedTextStyle={{ fontSize: 13, fontWeight: "700", color: "#1E293B" }}
          style={styles.yearDropdown}
          iconStyle={{ width: 16, height: 16 }}
        />
      </View>

      {/* Label da seção */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>
          {searchQuery.length > 0 ? "Resultados" : "Cidades"}
        </Text>
        {!carregandoCidades && (
          <Text style={styles.sectionCount}>{filteredCities.length} cidades</Text>
        )}
      </View>

      {/* Lista */}
      {carregandoCidades && cidades.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ListRowSkeleton />
          <ListRowSkeleton />
          <ListRowSkeleton />
          <ListRowSkeleton />
          <ListRowSkeleton />
        </View>
      ) : filteredCities.length === 0 && searchQuery.length > 0 ? (
        <EmptyState
          icon="search-off"
          title="Nenhuma cidade encontrada"
          description={`Nenhum resultado para "${searchQuery}". Verifique o nome e tente novamente.`}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {filteredCities.map(renderCityItem)}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  searchBar: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    height: 46,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  yearDropdown: {
    width: 76,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 12,
    color: "#94A3B8",
  },
  loadingContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  // City row
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
    position: "relative",
    overflow: "hidden",
  },
  cityRowSelected: {
    backgroundColor: "#F0F7FF",
    borderBottomColor: "#DBEAFE",
  },
  cityRowAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "#16A34A",
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  cityNameSelected: {
    color: "#16A34A",
  },
  cityMeso: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  cityDetail: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#DBEAFE",
  },
  cityNoData: {
    fontSize: 13,
    color: "#94A3B8",
    fontStyle: "italic",
  },
  cityPotencialLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  cityPotencialValue: {
    color: "#16A34A",
    fontWeight: "800",
  },
  cityYear: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 4,
  },
  cityRight: {
    alignItems: "flex-end",
    gap: 2,
    marginLeft: 8,
  },
  cityTJ: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16A34A",
  },
  cityYearSmall: {
    fontSize: 11,
    color: "#94A3B8",
  },
});
