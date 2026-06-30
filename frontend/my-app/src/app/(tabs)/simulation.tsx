import { View, Text, TouchableOpacity, Keyboard } from "react-native";
import { Dropdown } from 'react-native-element-dropdown';
import { Button, TextInput, HelperText } from "react-native-paper";
import { useState, useEffect, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from '@expo/vector-icons';
import { api } from "../../services/api";

const dataWaste = [
  { label: 'Suíno', value: '1' },
  { label: 'Bovino', value: '2' },
  { label: 'Caprino', value: '3' },
  { label: 'Ovino', value: '4' },
  { label: 'Equino', value: '5' },
  { label: 'Galináceo', value: '6' },
];

const dataRegion = [
  { label: 'Borborema', value: '1' },
  { label: 'Agreste', value: '2' },
  { label: 'Sertão', value: '3' },
  { label: 'Mata Paraibana', value: '4' },
];

const anoAtual = new Date().getFullYear();
const anoAtualStr = String(anoAtual);
const ANO_MAX_PROPHET = 2035;

export default function Simulation() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    prefill_substrato?: string;
    prefill_quantidade?: string;
    prefill_ano?: string;
    prefill_regiao?: string;
    prefill_codigoIbge?: string;
    prefill_municipioNome?: string;
  }>();

  const [substrato, setSubstrato] = useState(params.prefill_substrato || '');
  const [quantidade, setQuantidade] = useState(params.prefill_quantidade || '');
  const [ano, setAno] = useState(params.prefill_ano || '');
  const [regiao, setRegiao] = useState(params.prefill_regiao || '');

  const [cidadesList, setCidadesList] = useState<{ label: string; value: string }[]>([]);
  const [selectedCity, setSelectedCity] = useState<{ label: string; value: string } | null>(
    params.prefill_codigoIbge && params.prefill_municipioNome
      ? { label: params.prefill_municipioNome, value: params.prefill_codigoIbge }
      : null
  );
  const [carregandoCidades, setCarregandoCidades] = useState(false);

  const [tentouSimular, setTentouSimular] = useState(false);

  // Estados e refs para toggle dos campos numéricos (fix teclado iOS)
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

  const anoInvalido: boolean = !ano || Number(ano) < anoAtual || Number(ano) > ANO_MAX_PROPHET;
  const semLocalizacao = !regiao && !selectedCity;

  useEffect(() => {
    let isMounted = true;
    const fetchCidades = async () => {
      setCarregandoCidades(true);
      try {
        const res = await api.getMunicipiosTotais(2021); // Usando ano base padrão para listar municípios
        if (!isMounted) return;
        const formatadas = res.dados.map(item => ({
          label: item.municipio,
          value: String(item.codigo_ibge)
        }));
        setCidadesList(formatadas);
      } catch (error) {
        console.error("Erro ao buscar municípios para a simulação:", error);
      } finally {
        if (isMounted) setCarregandoCidades(false);
      }
    };
    fetchCidades();
    return () => {
      isMounted = false;
    };
  }, []);

  const limpar = () => {
    setSubstrato('');
    setQuantidade('');
    setAno('');
    setRegiao('');
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
      pathname: '/simulationoutput',
      params: { 
        substrato, 
        quantidade, 
        ano, 
        regiao,
        codigoIbge: selectedCity ? selectedCity.value : '',
        municipioNome: selectedCity ? selectedCity.label : ''
      }
    });
  };


  return (
    <View className="flex-1 bg-white">
      {/* Barra de ações do topo */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 12 }}>
        <TouchableOpacity
          onPress={() => router.push('/simulation-history')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 12,
            paddingVertical: 7,
            backgroundColor: '#EFF6FF',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#BFDBFE',
          }}
          activeOpacity={0.75}
        >
          <MaterialIcons name="history" size={16} color="#2D6EFF" />
          <Text style={{ fontSize: 13, color: '#2D6EFF', fontWeight: '600' }}>Histórico</Text>
        </TouchableOpacity>
      </View>

      <View className="mt-3 gap-4 p-6">

        {/* SUBSTRATO */}
        <View>
          <Text style={{ fontWeight: '700', color: '#374151', marginBottom: 6, fontSize: 14 }}>
            Substrato <Text style={{ color: '#9CA3AF', fontWeight: 'normal', fontSize: 12 }}>(origem da biomassa) ⓘ</Text>
          </Text>
          <Dropdown
            data={dataWaste}
            style={{
              backgroundColor: tentouSimular && !substrato ? '#FFF0F0' : '#F8FAFC',
              borderWidth: 1,
              borderColor: tentouSimular && !substrato ? '#B00020' : '#E2E8F0',
              width: '100%',
              height: 42,
              borderRadius: 8,
              paddingHorizontal: 12,
            }}
            placeholderStyle={{ fontSize: 14, color: '#9CA3AF' }}
            selectedTextStyle={{ fontSize: 14, color: '#1F2937' }}
            labelField="label"
            valueField="value"
            placeholder="Selecione o tipo de dejeto"
            value={dataWaste.find(item => item.label === substrato)?.value ?? null}
            onChange={(item: { label: string; value: string }) => setSubstrato(item.label)}
          />
          <HelperText type="error" visible={tentouSimular && !substrato}>
            Selecione um substrato
          </HelperText>
        </View>

        {/* QUANTIDADE */}
        <View>
          <Text style={{ fontWeight: '700', color: '#374151', marginBottom: 6, fontSize: 14 }}>
            Incremento do Rebanho <Text style={{ color: '#9CA3AF', fontWeight: 'normal', fontSize: 12 }}>(%) ⓘ</Text>
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <TextInput
                ref={quantidadeRef}
                placeholder="Ex: 15 (para +15% de rebanho)"
                value={quantidade}
                onChangeText={setQuantidade}
                keyboardType="numeric"
                mode="outlined"
                outlineColor={quantidadeAtiva ? '#2D6EFF' : '#E2E8F0'}
                activeOutlineColor="#2D6EFF"
                style={{
                  backgroundColor: quantidadeAtiva ? '#F0F5FF' : '#F1F3F6',
                  height: 42,
                  fontSize: 14,
                  opacity: quantidadeAtiva ? 1 : 0.6,
                }}
                editable={quantidadeAtiva}
                error={tentouSimular && !quantidade}
              />
            </View>
            <TouchableOpacity
              onPress={toggleQuantidade}
              activeOpacity={0.75}
              style={{
                width: 42,
                height: 42,
                borderRadius: 8,
                backgroundColor: quantidadeAtiva ? '#2D6EFF' : '#E2E8F0',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons
                name={quantidadeAtiva ? 'check' : 'edit'}
                size={20}
                color={quantidadeAtiva ? '#FFFFFF' : '#6B7280'}
              />
            </TouchableOpacity>
          </View>
          <HelperText type="error" visible={tentouSimular && !quantidade}>
            Informe a quantidade
          </HelperText>
        </View>

        {/* ANO */}
        <View>
          <Text style={{ fontWeight: '700', color: '#374151', marginBottom: 6, fontSize: 14 }}>
            Ano Alvo da Projeção <Text style={{ color: '#9CA3AF', fontWeight: 'normal', fontSize: 12 }}>ⓘ</Text>
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
                outlineColor={anoAtivo ? '#2D6EFF' : '#E2E8F0'}
                activeOutlineColor="#2D6EFF"
                style={{
                  backgroundColor: anoAtivo ? '#F0F5FF' : '#F1F3F6',
                  height: 42,
                  fontSize: 14,
                  opacity: anoAtivo ? 1 : 0.6,
                }}
                editable={anoAtivo}
                error={tentouSimular && anoInvalido}
              />
            </View>
            <TouchableOpacity
              onPress={toggleAno}
              activeOpacity={0.75}
              style={{
                width: 42,
                height: 42,
                borderRadius: 8,
                backgroundColor: anoAtivo ? '#2D6EFF' : '#E2E8F0',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons
                name={anoAtivo ? 'check' : 'edit'}
                size={20}
                color={anoAtivo ? '#FFFFFF' : '#6B7280'}
              />
            </TouchableOpacity>
          </View>
          <HelperText type="error" visible={tentouSimular && anoInvalido}>
            Informe um ano entre {anoAtualStr} e {ANO_MAX_PROPHET}
          </HelperText>
        </View>

        {/* MESORREGIÃO */}
        <View>
          <Text style={{ fontWeight: '700', color: '#374151', marginBottom: 6, fontSize: 14 }}>Mesorregião</Text>
          <Dropdown
            data={dataRegion}
            style={{
              backgroundColor: tentouSimular && semLocalizacao ? '#FFF0F0' : '#F8FAFC',
              borderWidth: 1,
              borderColor: tentouSimular && semLocalizacao ? '#B00020' : '#E2E8F0',
              width: '100%',
              height: 42,
              borderRadius: 8,
              paddingHorizontal: 12,
              opacity: selectedCity ? 0.5 : 1,
            }}
            placeholderStyle={{ fontSize: 14, color: '#9CA3AF' }}
            selectedTextStyle={{ fontSize: 14, color: '#1F2937' }}
            labelField="label"
            valueField="value"
            placeholder={selectedCity ? "Desativado (Município selecionado)" : "Selecione a Mesorregião"}
            value={dataRegion.find(item => item.label === regiao)?.value ?? null}
            onChange={(item: { label: string; value: string }) => {
              setRegiao(item.label);
              setSelectedCity(null);
            }}
            disable={!!selectedCity}
          />
        </View>

        {/* SEPARADOR COM LINHAS LATERAIS */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
          <Text style={{ color: '#9CA3AF', fontSize: 12, fontWeight: '700', paddingHorizontal: 12 }}>OU</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
        </View>

        {/* MUNICÍPIO */}
        <View>
          <Text style={{ fontWeight: '700', color: '#374151', marginBottom: 6, fontSize: 14 }}>Município</Text>
          <Dropdown
            data={cidadesList}
            search
            searchPlaceholder="Pesquisar município..."
            style={{
              backgroundColor: tentouSimular && semLocalizacao ? '#FFF0F0' : '#F8FAFC',
              borderWidth: 1,
              borderColor: tentouSimular && semLocalizacao ? '#B00020' : '#E2E8F0',
              width: '100%',
              height: 42,
              borderRadius: 8,
              paddingHorizontal: 12,
              opacity: regiao ? 0.5 : 1,
            }}
            placeholderStyle={{ fontSize: 14, color: '#9CA3AF' }}
            selectedTextStyle={{ fontSize: 14, color: '#1F2937' }}
            labelField="label"
            valueField="value"
            placeholder={regiao ? "Desativado (Mesorregião selecionada)" : (carregandoCidades ? "Carregando..." : "Pesquisar e selecionar município")}
            value={selectedCity?.value ?? null}
            onChange={(item: { label: string; value: string }) => {
              setSelectedCity(item);
              setRegiao('');
            }}
            disable={!!regiao || carregandoCidades}
          />
          <HelperText type="error" visible={tentouSimular && semLocalizacao}>
            Selecione uma Mesorregião ou um Município
          </HelperText>
        </View>

        {/* BOTÕES */}
        <View className="flex-row justify-between items-center">
          <Button mode="contained" buttonColor="#2D6EFF" className="w-60" onPress={simular}>
            Simular
          </Button>
          <Button mode="contained" buttonColor="#2D6EFF" className="w-30" onPress={limpar}>
            Limpar
          </Button>
        </View>

      </View>
    </View>
  );
}