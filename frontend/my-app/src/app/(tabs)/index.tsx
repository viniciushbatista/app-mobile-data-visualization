import { View, ScrollView, TouchableOpacity, KeyboardAvoidingView } from "react-native";
import { Card, Button, Text, Searchbar, Surface } from "react-native-paper";
import MapaParaiba, { MapaParaibaRef } from "../../shared/components/map/PbMap";
import { useRef, useState, useEffect } from 'react'
import { Dropdown } from 'react-native-element-dropdown'

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

const cidadesPB = [
  { nome: "João Pessoa", mesorregiao: "Mata Paraibana", potencial: 1200 },
  { nome: "Campina Grande", mesorregiao: "Agreste Paraibano", potencial: 980 },
  { nome: "Patos", mesorregiao: "Sertão Paraibano", potencial: 760 },
  { nome: "Sousa", mesorregiao: "Sertão Paraibano", potencial: 540 },
  { nome: "Cajazeiras", mesorregiao: "Sertão Paraibano", potencial: 430 },

  { nome: "Santa Rita", mesorregiao: "Mata Paraibana", potencial: 670 },
  { nome: "Bayeux", mesorregiao: "Mata Paraibana", potencial: 610 },
  { nome: "Cabedelo", mesorregiao: "Mata Paraibana", potencial: 580 },
  { nome: "Guarabira", mesorregiao: "Agreste Paraibano", potencial: 520 },
  { nome: "Mamanguape", mesorregiao: "Mata Paraibana", potencial: 490 },

  { nome: "Itabaiana", mesorregiao: "Agreste Paraibano", potencial: 470 },
  { nome: "Sapé", mesorregiao: "Mata Paraibana", potencial: 450 },
  { nome: "Monteiro", mesorregiao: "Borborema", potencial: 440 },
  { nome: "Sumé", mesorregiao: "Borborema", potencial: 420 },
  { nome: "Esperança", mesorregiao: "Agreste Paraibano", potencial: 400 },

  { nome: "Pombal", mesorregiao: "Sertão Paraibano", potencial: 390 },
  { nome: "Catolé do Rocha", mesorregiao: "Sertão Paraibano", potencial: 370 },
  { nome: "Princesa Isabel", mesorregiao: "Sertão Paraibano", potencial: 350 },
  { nome: "Alagoa Grande", mesorregiao: "Agreste Paraibano", potencial: 330 },
  { nome: "Areia", mesorregiao: "Agreste Paraibano", potencial: 310 },

  { nome: "Picuí", mesorregiao: "Borborema", potencial: 300 },
  { nome: "Queimadas", mesorregiao: "Agreste Paraibano", potencial: 290 },
  { nome: "Solânea", mesorregiao: "Agreste Paraibano", potencial: 270 },
  { nome: "Remígio", mesorregiao: "Agreste Paraibano", potencial: 260 },
  { nome: "Araruna", mesorregiao: "Agreste Paraibano", potencial: 250 },
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
  const [filteredCities, setFilteredCities] = useState<typeof cidadesPB>(cidadesPB.slice(0, 20));
  const [selectedCity, setSelectedCity] = useState<typeof cidadesPB[0] | null>(null);

  useEffect(() => {
    if (searchQuery.length === 0) {
      setFilteredCities(cidadesPB.slice(0, 20));
      return;
    }

    const filtered = cidadesPB.filter(cidade =>
      cidade.nome.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredCities(filtered.slice(0, 10));
  }, [searchQuery]);

  return (
    <View className="flex-1 bg-white">
      <ScrollView ref={scrollRef}>

        {/* CARD REGIÃO */}
        <View className="p-4 pt-2">
          <Card mode="elevated" theme={{ colors: { elevation: { level1: '#FFFFFF' } } }}>
            <Card.Content>
              <Text
                variant="titleLarge"
                style={{ fontWeight: 'bold', color: regiaoSelecionada ? '#2D6EFF' : '#000000' }}
              >
                {regiaoSelecionada?.valor != null
                  ? `${regiaoSelecionada.valor.toLocaleString('pt-BR')} TJ`
                  : 'Sem dados para este ano'}
              </Text>
              <Text style={{ color: '#6B7280' }}>
                {regiaoSelecionada
                  ? `Potencial energético — ${regiaoSelecionada.nome}`
                  : 'Potencial energético — selecione uma região'}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* DROPDOWN */}
        <View className="px-4 items-end">
          <Dropdown
            data={anosDisponiveis}
            labelField="label"
            valueField="value"
            value={anoSelecionado}
            onChange={item => {
              setAnoSelecionado(item.value);
              mapaRef.current?.atualizarAno(item.value);
            }}
            style={{
              width: 150,
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 8,
              paddingHorizontal: 8,
              height: 35,
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
            <ScrollView nestedScrollEnabled>
              {filteredCities.map((item) => {
                const isSelected = selectedCity?.nome === item.nome;

                return (
                  <TouchableOpacity
                    key={item.nome}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedCity(null);
                      } else {
                        setSelectedCity(item);
                      }
                    }}
                    style={{
                      padding: 12,
                      borderBottomWidth: 0.5,
                      borderColor: "#ccc",
                      backgroundColor: isSelected ? "#F3F4F6" : "#FFFFFF"
                    }}
                  >
                    <Text style={{ fontWeight: "bold" }}>
                      {item.nome} {isSelected ? "▲" : "▼"}
                    </Text>

                    <Text style={{ fontSize: 12, color: "gray" }}>
                      {item.mesorregiao}
                    </Text>

                    {isSelected && (
                      <View style={{ marginTop: 8 }}>
                        <Text>Potencial: {item.potencial} TJ</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}