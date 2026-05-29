import { View, ScrollView, TouchableOpacity, KeyboardAvoidingView } from "react-native";
import { Card, Button, Text, Searchbar, Surface, ActivityIndicator } from "react-native-paper";
import MapaParaiba, { MapaParaibaRef } from "../../shared/components/map/PbMap";
import { useRef, useState, useEffect } from 'react';
import { Dropdown } from 'react-native-element-dropdown';
import { api } from "../../services/api";

const anosDisponiveis = [
  { label: '2013', value: '2013' },
  { label: '2014', value: '2014' },
  { label: '2015', value: '2015' },
  { label: '2016', value: '2016' },
  { label: '2017', value: '2017' },
  { label: '2018', value: '2018' },
  { label: '2019', value: '2019' },
  { label: '2020', value: '2020' },
  { label: '2021', value: '2021' },
  { label: '2022', value: '2022' },
  { label: '2023', value: '2023' },
  { label: '2024', value: '2024' },
];

export default function MapaScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const mapaRef = useRef<MapaParaibaRef>(null);

  const [anoSelecionado, setAnoSelecionado] = useState('2021');
  const [regiaoSelecionada, setRegiaoSelecionada] = useState<{
    nome: string;
    valor: number;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [cidades, setCidades] = useState<any[]>([]);
  const [filteredCities, setFilteredCities] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<any | null>(null);
  const [carregandoCidades, setCarregandoCidades] = useState(false);

  // 1. Efeito para carregar potenciais das mesorregiões do mapa
  useEffect(() => {
    let isMounted = true;
    
    const carregarDadosMapa = async () => {
      try {
        const totaisMeso = await api.getEnergiaMesorregioesTotais(Number(anoSelecionado));
        
        if (!isMounted) return;

        // Mapeia para o formato esperado pelo ECharts
        const dadosFormatados = totaisMeso.map(item => ({
          name: item.mesorregiao,
          value: item.potencial_tj
        }));

        // Injeta os dados reais no mapa
        mapaRef.current?.atualizarDados(dadosFormatados);
        
        // Se já tiver uma região selecionada, atualiza seu potencial
        if (regiaoSelecionada) {
          const mesoAtualizada = totaisMeso.find(r => r.mesorregiao === regiaoSelecionada.nome);
          if (mesoAtualizada) {
            setRegiaoSelecionada({
              nome: mesoAtualizada.mesorregiao,
              valor: mesoAtualizada.potencial_tj
            });
          }
        }
      } catch (error) {
        console.error('[MapaScreen] Erro ao carregar dados de energia do mapa:', error);
      }
    };

    carregarDadosMapa();
    
    return () => {
      isMounted = false;
    };
  }, [anoSelecionado]);

  // 2. Efeito para carregar a lista de cidades com dados de rebanho reais
  useEffect(() => {
    let isMounted = true;

    const carregarMunicipios = async () => {
      setCarregandoCidades(true);
      try {
        const res = await api.getMunicipiosTotais(Number(anoSelecionado));
        if (!isMounted) return;

        const listaCidades = res.dados.map(item => ({
          codigo_ibge: item.codigo_ibge,
          nome: item.municipio,
          mesorregiao: item.mesorregiao,
          potencial: null as number | null, // Carregado sob demanda ao expandir
        }));

        setCidades(listaCidades);
      } catch (error) {
        console.error('[MapaScreen] Erro ao carregar municípios:', error);
      } finally {
        if (isMounted) setCarregandoCidades(false);
      }
    };

    carregarMunicipios();

    return () => {
      isMounted = false;
    };
  }, [anoSelecionado]);

  // 3. Efeito para filtrar cidades de acordo com a busca
  useEffect(() => {
    if (searchQuery.length === 0) {
      setFilteredCities(cidades.slice(0, 20));
      return;
    }

    const filtered = cidades.filter(cidade =>
      cidade.nome.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredCities(filtered.slice(0, 10));
  }, [searchQuery, cidades]);

  return (
    <View className="flex-1 bg-white">
      <ScrollView ref={scrollRef}>

        {/* CARD REGIÃO */}
        <View className="p-4 pt-2">
          <Card 
            mode="elevated" 
            style={{ 
              backgroundColor: '#FFFFFF', 
              borderRadius: 12,
              borderLeftWidth: 5,
              borderLeftColor: regiaoSelecionada ? '#2D6EFF' : '#9CA3AF',
              elevation: 2,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8
            }}
          >
            <Card.Content style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
              <Text
                style={{ 
                  fontWeight: 'bold', 
                  fontSize: 26, 
                  color: regiaoSelecionada ? '#2D6EFF' : '#1F2937' 
                }}
              >
                {regiaoSelecionada?.valor != null
                  ? `${regiaoSelecionada.valor.toLocaleString('pt-BR')} TJ`
                  : 'Selecione uma região'}
              </Text>
              <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 4, fontWeight: '500' }}>
                {regiaoSelecionada
                  ? `Potencial energético total — ${regiaoSelecionada.nome}`
                  : 'Toque em uma mesorregião no mapa para carregar o potencial'}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* DROPDOWN */}
        <View className="px-4 items-end mt-1 mb-2">
          <Dropdown
            data={anosDisponiveis}
            labelField="label"
            valueField="value"
            value={anoSelecionado}
            onChange={item => {
              setAnoSelecionado(item.value);
              mapaRef.current?.atualizarAno(item.value);
            }}
            placeholderStyle={{ fontSize: 13, color: '#9CA3AF' }}
            selectedTextStyle={{ fontSize: 13, fontWeight: 'bold', color: '#1F2937' }}
            style={{
              width: 120,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              borderRadius: 20,
              paddingHorizontal: 12,
              height: 32,
              backgroundColor: '#F8FAFC'
            }}
          />
        </View>

        {/* MAPA */}
        <View style={{ height: 450 }}>
          <MapaParaiba
            ref={mapaRef}
            onRegionPress={(nome, valor) => {
              setRegiaoSelecionada({ nome, valor });
            }}
          />
        </View>

        {/* BOTÃO */}
        <View className="flex-row justify-between items-center p-4">
          <Button icon="download" mode="text" textColor="#000000" onPress={() => mapaRef.current?.exportarMapa()}>
            Exportar
          </Button>
        </View>

        {/* SEARCH */}
        <View className="p-4">
          <Surface style={{ borderRadius: 35 }}>
            <Searchbar
              placeholder="Buscar cidade da Paraíba"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ backgroundColor: '#FFFFFF' }}
              onFocus={() => {
                setTimeout(() => {
                  scrollRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
            />
          </Surface>

          {searchQuery.length === 0 && (
            <Text style={{ marginTop: 5, color: "gray" }}>
              Cidades
            </Text>
          )}

          {searchQuery.length > 0 && (
            <Text style={{ marginTop: 5, color: "gray" }}>
              Resultados
            </Text>
          )}

          {/* LISTA EXPANSÍVEL */}
          <View style={{ height: 300 }}>
            {carregandoCidades && cidades.length === 0 ? (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#2D6EFF" />
              </View>
            ) : (
              <ScrollView nestedScrollEnabled>
                {filteredCities.map((item) => {
                  const isSelected = selectedCity?.nome === item.nome;

                  return (
                    <TouchableOpacity
                      key={item.nome}
                      onPress={async () => {
                        if (isSelected) {
                          setSelectedCity(null);
                        } else {
                          setSelectedCity(item);

                          // Se ainda não buscou o potencial, busca sob demanda
                          if (item.potencial === null) {
                            try {
                              const res = await api.getEnergiaMunicipio(item.codigo_ibge, Number(anoSelecionado));
                              const potencialTotal = res.resultados.reduce((acc, curr) => acc + curr.potencial_tj, 0);
                              const potencialFormatado = parseFloat(potencialTotal.toFixed(2));

                              // Atualiza na lista local
                              setCidades(prev => prev.map(c => c.codigo_ibge === item.codigo_ibge ? { ...c, potencial: potencialFormatado } : c));

                              // Atualiza o estado selecionado para mostrar na hora
                              setSelectedCity({
                                ...item,
                                potencial: potencialFormatado
                              });
                            } catch (error) {
                              console.error('[MapaScreen] Erro ao carregar potencial do município:', error);
                            }
                          }
                        }
                      }}
                      style={{
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        borderLeftWidth: 4,
                        borderLeftColor: isSelected ? "#2D6EFF" : "transparent",
                        backgroundColor: isSelected ? "#F8FAFC" : "#FFFFFF",
                        borderBottomWidth: 1,
                        borderColor: "#F1F5F9",
                        marginVertical: 2,
                        borderRadius: 6,
                        shadowColor: isSelected ? "#000000" : "transparent",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: isSelected ? 1 : 0
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontWeight: "700", fontSize: 15, color: isSelected ? "#2D6EFF" : "#1F2937" }}>
                          {item.nome}
                        </Text>
                        <Text style={{ fontSize: 12, color: isSelected ? "#2D6EFF" : "#9CA3AF" }}>
                          {isSelected ? "▲" : "▼"}
                        </Text>
                      </View>

                      <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                        {item.mesorregiao}
                      </Text>

                      {isSelected && (
                        <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                          {item.potencial === null ? (
                            <ActivityIndicator size="small" color="#2D6EFF" style={{ alignSelf: 'flex-start' }} />
                          ) : (
                            <View>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>
                                Potencial: <Text style={{ color: '#2D6EFF', fontWeight: 'bold' }}>{item.potencial} TJ</Text>
                              </Text>
                              <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                                Ano de referência: {anoSelecionado}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}