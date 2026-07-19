import {
  View,
  Text,
  TouchableOpacity,
  Keyboard,
  ScrollView,
  StyleSheet,
  StatusBar,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { TextInput, HelperText } from "react-native-paper";
import { useState, useEffect, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { api } from "../../services/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const dataWaste = [
  { label: "Suíno", value: "1" },
  { label: "Bovino", value: "2" },
  { label: "Caprino", value: "3" },
  { label: "Ovino", value: "4" },
  { label: "Equino", value: "5" },
  { label: "Galináceo", value: "6" },
];

const dataRegion = [
  { label: "Borborema", value: "1" },
  { label: "Agreste", value: "2" },
  { label: "Sertão", value: "3" },
  { label: "Mata Paraibana", value: "4" },
];

const anoAtual = new Date().getFullYear();
const anoAtualStr = String(anoAtual);
const ANO_MAX_PROPHET = 2035;

export default function Simulation() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    prefill_substrato?: string;
    prefill_quantidade?: string;
    prefill_ano?: string;
    prefill_regiao?: string;
    prefill_codigoIbge?: string;
    prefill_municipioNome?: string;
  }>();

  const [substrato, setSubstrato] = useState(params.prefill_substrato || "");
  const [quantidade, setQuantidade] = useState(params.prefill_quantidade || "");
  const [ano, setAno] = useState(params.prefill_ano || "");
  const [regiao, setRegiao] = useState(params.prefill_regiao || "");

  const [cidadesList, setCidadesList] = useState<{ label: string; value: string }[]>([]);
  const [selectedCity, setSelectedCity] = useState<{ label: string; value: string } | null>(
    params.prefill_codigoIbge && params.prefill_municipioNome
      ? { label: params.prefill_municipioNome, value: params.prefill_codigoIbge }
      : null
  );
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [tentouSimular, setTentouSimular] = useState(false);

  const [quantidadeAtiva, setQuantidadeAtiva] = useState(false);
  const [anoAtivo, setAnoAtivo] = useState(false);
  const quantidadeRef = useRef<any>(null);
  const anoRef = useRef<any>(null);

  const toggleQuantidade = () => {
    if (quantidadeAtiva) {
      Keyboard.dismiss();
      setQuantidadeAtiva(false);
    } else {
      setQuantidadeAtiva(true);
      setTimeout(() => quantidadeRef.current?.focus(), 80);
    }
  };

  const toggleAno = () => {
    if (anoAtivo) {
      Keyboard.dismiss();
      setAnoAtivo(false);
    } else {
      setAnoAtivo(true);
      setTimeout(() => anoRef.current?.focus(), 80);
    }
  };

  const anoInvalido: boolean =
    !ano || Number(ano) < anoAtual || Number(ano) > ANO_MAX_PROPHET;
  const semLocalizacao = !regiao && !selectedCity;

  useEffect(() => {
    let isMounted = true;
    const fetchCidades = async () => {
      setCarregandoCidades(true);
      try {
        const res = await api.getMunicipiosTotais(2021);
        if (!isMounted) return;
        const formatadas = res.dados.map((item: any) => ({
          label: item.municipio,
          value: String(item.codigo_ibge),
        }));
        setCidadesList(formatadas);
      } catch (error) {
        console.error("Erro ao buscar municípios:", error);
      } finally {
        if (isMounted) setCarregandoCidades(false);
      }
    };
    fetchCidades();
    return () => { isMounted = false; };
  }, []);

  const limpar = () => {
    setSubstrato("");
    setQuantidade("");
    setAno("");
    setRegiao("");
    setSelectedCity(null);
    setTentouSimular(false);
    setQuantidadeAtiva(false);
    setAnoAtivo(false);
    Keyboard.dismiss();
  };

  const simular = () => {
    setTentouSimular(true);
    if (!substrato || !quantidade || anoInvalido || semLocalizacao) return;
    router.push({
      pathname: "/simulationoutput",
      params: {
        substrato,
        quantidade,
        ano,
        regiao,
        codigoIbge: selectedCity ? selectedCity.value : "",
        municipioNome: selectedCity ? selectedCity.label : "",
      },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Simulação</Text>
        <TouchableOpacity
          onPress={() => router.push("/simulation-history")}
          style={styles.historyBtn}
          activeOpacity={0.75}
        >
          <MaterialIcons name="history" size={16} color="#16A34A" />
          <Text style={styles.historyText}>Histórico</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── SUBSTRATO ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            Substrato{" "}
            <Text style={styles.fieldHint}>(origem da biomassa)</Text>
          </Text>
          <Dropdown
            data={dataWaste}
            style={[
              styles.dropdown,
              tentouSimular && !substrato && styles.dropdownError,
            ]}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownSelected}
            labelField="label"
            valueField="value"
            placeholder="Selecione o tipo de dejeto"
            value={dataWaste.find((item) => item.label === substrato)?.value ?? null}
            onChange={(item) => setSubstrato(item.label)}
          />
          <HelperText type="error" visible={tentouSimular && !substrato}>
            Selecione um substrato
          </HelperText>
        </View>

        {/* ── QUANTIDADE ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            Incremento do Rebanho{" "}
            <Text style={styles.fieldHint}>(%)</Text>
          </Text>
          <View style={styles.inputRow}>
            <View style={{ flex: 1 }}>
              <TextInput
                ref={quantidadeRef}
                placeholder="Ex: 15 (para +15% de rebanho)"
                value={quantidade}
                onChangeText={setQuantidade}
                keyboardType="numeric"
                mode="outlined"
                outlineColor={quantidadeAtiva ? "#16A34A" : "#E2E8F0"}
                activeOutlineColor="#16A34A"
                style={[styles.textInput, { opacity: quantidadeAtiva ? 1 : 0.6 }]}
                editable={quantidadeAtiva}
                error={tentouSimular && !quantidade}
              />
            </View>
            <TouchableOpacity
              onPress={toggleQuantidade}
              activeOpacity={0.75}
              style={[
                styles.editBtn,
                { backgroundColor: quantidadeAtiva ? "#16A34A" : "#E2E8F0" },
              ]}
            >
              <MaterialIcons
                name={quantidadeAtiva ? "check" : "edit"}
                size={20}
                color={quantidadeAtiva ? "#FFFFFF" : "#6B7280"}
              />
            </TouchableOpacity>
          </View>
          <HelperText type="error" visible={tentouSimular && !quantidade}>
            Informe a quantidade
          </HelperText>
        </View>

        {/* ── ANO ALVO ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            Ano Alvo da Projeção{" "}
            <Text style={styles.fieldHint}>ⓘ</Text>
          </Text>
          <View style={styles.inputRow}>
            <View style={{ flex: 1 }}>
              <TextInput
                ref={anoRef}
                placeholder="Digite o ano futuro da simulação"
                value={ano}
                onChangeText={setAno}
                onBlur={() => {
                  if (Number(ano) < anoAtual) setAno(anoAtualStr);
                  if (Number(ano) > ANO_MAX_PROPHET) setAno(String(ANO_MAX_PROPHET));
                }}
                keyboardType="numeric"
                mode="outlined"
                outlineColor={anoAtivo ? "#16A34A" : "#E2E8F0"}
                activeOutlineColor="#16A34A"
                style={[styles.textInput, { opacity: anoAtivo ? 1 : 0.6 }]}
                editable={anoAtivo}
                error={tentouSimular && anoInvalido}
              />
            </View>
            <TouchableOpacity
              onPress={toggleAno}
              activeOpacity={0.75}
              style={[
                styles.editBtn,
                { backgroundColor: anoAtivo ? "#16A34A" : "#E2E8F0" },
              ]}
            >
              <MaterialIcons
                name={anoAtivo ? "check" : "edit"}
                size={20}
                color={anoAtivo ? "#FFFFFF" : "#6B7280"}
              />
            </TouchableOpacity>
          </View>
          <HelperText type="error" visible={tentouSimular && anoInvalido}>
            Informe um ano entre {anoAtualStr} e {ANO_MAX_PROPHET}
          </HelperText>
        </View>

        {/* ── MESORREGIÃO e MUNICÍPIO lado a lado ── */}
        <View style={styles.locationRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Mesorregião</Text>
            <Dropdown
              data={dataRegion}
              style={[
                styles.dropdown,
                tentouSimular && semLocalizacao && styles.dropdownError,
                { opacity: selectedCity ? 0.45 : 1 },
              ]}
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownSelected}
              labelField="label"
              valueField="value"
              placeholder={
                selectedCity ? "Desativado" : "Selecione a mesorregião"
              }
              value={dataRegion.find((item) => item.label === regiao)?.value ?? null}
              onChange={(item) => {
                setRegiao(item.label);
                setSelectedCity(null);
              }}
              disable={!!selectedCity}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Município</Text>
            <Dropdown
              data={cidadesList}
              search
              searchPlaceholder="Pesquisar município..."
              style={[
                styles.dropdown,
                tentouSimular && semLocalizacao && styles.dropdownError,
                { opacity: regiao ? 0.45 : 1 },
              ]}
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownSelected}
              labelField="label"
              valueField="value"
              placeholder={
                regiao
                  ? "Desativado"
                  : carregandoCidades
                  ? "Carregando..."
                  : "Pesquisar município"
              }
              value={selectedCity?.value ?? null}
              onChange={(item) => {
                setSelectedCity(item);
                setRegiao("");
              }}
              disable={!!regiao || carregandoCidades}
            />
          </View>
        </View>
        <HelperText type="error" visible={tentouSimular && semLocalizacao}>
          Selecione uma Mesorregião ou um Município
        </HelperText>

        {/* ── SEPARADOR ── */}
        <View style={styles.separator}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>OU</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* ── BOTÕES ── */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={styles.btnSimular}
            onPress={simular}
            activeOpacity={0.85}
          >
            <MaterialIcons name="play-arrow" size={20} color="#FFFFFF" />
            <Text style={styles.btnSimularText}>Simular</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnLimpar}
            onPress={limpar}
            activeOpacity={0.75}
          >
            <MaterialIcons name="refresh" size={18} color="#16A34A" />
            <Text style={styles.btnLimparText}>Limpar</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
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
    paddingVertical: 14,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E293B",
  },
  historyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  historyText: {
    fontSize: 13,
    color: "#16A34A",
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 4,
  },
  // Field
  fieldGroup: {
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  fieldHint: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "400",
  },
  dropdown: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  dropdownError: {
    backgroundColor: "#FFF5F5",
    borderColor: "#FCA5A5",
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: "#94A3B8",
  },
  dropdownSelected: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    height: 46,
    fontSize: 14,
  },
  editBtn: {
    width: 46,
    height: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  // Location row
  locationRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  // Separator
  separator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    gap: 12,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  separatorText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
  },
  // Buttons
  buttonsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  btnSimular: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#16A34A",
    borderRadius: 12,
    height: 50,
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnSimularText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  btnLimpar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 18,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#16A34A",
    backgroundColor: "#FFFFFF",
  },
  btnLimparText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16A34A",
  },
});