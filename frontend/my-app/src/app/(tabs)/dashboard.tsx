import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import Constants from "expo-constants";
import { CartesianChart, Bar, Line, Area, useChartPressState } from "victory-native";
import { LinearGradient, useFont, vec } from '@shopify/react-native-skia'
import { Button, Card } from 'react-native-paper'
import { useState, useRef, useEffect } from "react";
import { Dropdown } from 'react-native-element-dropdown'
import ViewShot, { captureRef } from 'react-native-view-shot'
import * as Sharing from 'expo-sharing'
import { makeImageFromView } from '@shopify/react-native-skia';
import { File, Paths } from 'expo-file-system';
import { api, SUBSTRATO_MAP, REGION_NAME_MAP } from "../../services/api";
import { ChartCardSkeleton } from "../../shared/components/SkeletonLoader";
import EmptyState from "../../shared/components/EmptyState";

const staturBarHeight = Constants.statusBarHeight;

type Item = {
    meso: string;
    value: number;
};

type YearData = {
    year: string;
    value: number;
};

const availableYears = [2020, 2021, 2022];
const mostRecentYear = Math.max(...availableYears); // 2022

const dataDrop = [
    { label: '2020', value: 2020 },
    { label: '2021', value: 2021 },
    { label: '2022', value: 2022 },
];

export default function Dashboard() {

    const viewRef1 = useRef(null);
    const viewRef2 = useRef(null);

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
                mimeType: 'image/jpeg',
                dialogTitle: 'Salvar gráfico',
            });
        } catch (err) {
            console.error('Erro ao exportar:', err);
        }
    };

    const [selectedAnimal, setSelectedAnimal] = useState<"ovino" | "bovino" | "caprino" | "galinaceo" | "suino" | "equino" | "todos">("todos");
    const [selectedYear, setSelectedYear] = useState<number>(mostRecentYear);
    const [selectedRegion, setSelectedRegion] = useState<"mata" | "agreste" | "borborema" | "sertao">("mata");

    const [barChartData, setBarChartData] = useState<Item[]>([
        { meso: "0", value: 0 },
        { meso: "M", value: 0 },
        { meso: "A", value: 0 },
        { meso: "B", value: 0 },
        { meso: "S", value: 0 },
    ]);
    const [lineChartData, setLineChartData] = useState<YearData[]>([]);

    const [carregandoBarras, setCarregandoBarras] = useState(false);
    const [carregandoLinhas, setCarregandoLinhas] = useState(false);

    // Carrega dados do Gráfico de Barras (Mesorregiões do ano/substrato)
    const carregarDadosGraficoBarras = async () => {
        setCarregandoBarras(true);
        try {
            const substratoDb = selectedAnimal === "todos" ? undefined : SUBSTRATO_MAP[selectedAnimal];

            const mapaLabel: Record<string, string> = {
                'Mata Paraibana': 'M',
                'Agreste Paraibano': 'A',
                'Borborema': 'B',
                'Sertão Paraibano': 'S',
            };

            if (selectedAnimal === "todos") {
                // Modo "todos": 1 única chamada retorna todas as regiões
                const totais = await api.getEnergiaMesorregioesTotais(selectedYear);
                const resultados = totais.map(item => ({
                    meso: mapaLabel[item.mesorregiao] ?? item.mesorregiao,
                    value: parseFloat(item.potencial_tj.toFixed(2))
                }));
                setBarChartData([{ meso: "0", value: 0 }, ...resultados]);
            } else {
                // Substrato específico: 4 chamadas em paralelo
                const regioes = [
                    { key: 'Mata Paraibana', label: 'M' },
                    { key: 'Agreste Paraibano', label: 'A' },
                    { key: 'Borborema', label: 'B' },
                    { key: 'Sertão Paraibano', label: 'S' }
                ];

                const promessas = regioes.map(async (r) => {
                    try {
                        const res = await api.getEnergiaMesorregiao(r.key, selectedYear, substratoDb);
                        return { meso: r.label, value: parseFloat(res.potencial_tj.toFixed(2)) };
                    } catch (err) {
                        console.error(`Erro ao carregar dados do gráfico de barras para ${r.key}:`, err);
                        return { meso: r.label, value: 0 };
                    }
                });

                const resultados = await Promise.all(promessas);
                setBarChartData([{ meso: "0", value: 0 }, ...resultados]);
            }
        } catch (error) {
            console.error('[Dashboard] Erro geral ao carregar dados do gráfico de barras:', error);
        } finally {
            setCarregandoBarras(false);
        }
    };

    // Carrega dados do Gráfico de Linhas (Série histórica de potencial energético da mesorregião)
    // O gráfico de linha sempre exibe o TOTAL (soma de todos os substratos) — independente do filtro de pill chips
    const carregarDadosGraficoLinhas = async () => {
        setCarregandoLinhas(true);
        try {
            const nomeMesoReal = REGION_NAME_MAP[selectedRegion];

            // Sempre passa undefined para buscar o total de todos os substratos
            const serieRes = await api.getEnergiaMesorregioSerie(nomeMesoReal, undefined);

            if (!serieRes || !serieRes.dados || serieRes.dados.length === 0) {
                setLineChartData([]);
                return;
            }

            const resultados = serieRes.dados.map(item => ({
                year: String(item.ano),
                value: parseFloat(item.potencial_tj.toFixed(2)),
            }));
            setLineChartData(resultados);
        } catch (error) {
            console.error('[Dashboard] Erro geral ao carregar dados do gráfico de linhas:', error);
        } finally {
            setCarregandoLinhas(false);
        }
    };

    useEffect(() => {
        carregarDadosGraficoBarras();
    }, [selectedAnimal, selectedYear]);

    useEffect(() => {
        carregarDadosGraficoLinhas();
    }, [selectedRegion]); // Apenas a região — o filtro de substrato NÃO afeta o gráfico de linha

    const fonts = useFont(require("./../../../assets/static/Inter_18pt-Regular.ttf"));
    const font = useFont(require("./../../../assets/static/Inter_18pt-Regular.ttf"));

    return (
        <View className="flex-1 bg-white ">
            <ScrollView>
                <View className="gap-4 p-4">
                    <View className="bottom-1">
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 10, paddingHorizontal: 4 }}
                            className="mt-8"
                        >
                            {[
                                { id: "todos", label: "Todos" },
                                { id: "ovino", label: "Ovino" },
                                { id: "bovino", label: "Bovino" },
                                { id: "caprino", label: "Caprino" },
                                { id: "suino", label: "Suíno" },
                                { id: "equino", label: "Equino" },
                                { id: "galinaceo", label: "Galináceo" },
                            ].map((item) => {
                                const isSelected = selectedAnimal === item.id;
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        onPress={() => setSelectedAnimal(item.id as any)}
                                        style={{
                                            backgroundColor: isSelected ? "#2D6EFF" : "#F1F5F9",
                                            paddingHorizontal: 16,
                                            paddingVertical: 8,
                                            borderRadius: 20,
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: isSelected ? "#FFFFFF" : "#4B5563",
                                                fontWeight: isSelected ? "bold" : "500",
                                                fontSize: 14,
                                            }}
                                        >
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                    <View className="items-end">
                        <Dropdown
                            data={dataDrop}            // dados do dropdown
                            labelField="label"             // o campo que mostra texto
                            valueField="value"             // o campo que guarda valor
                            placeholder="Selecione..."     // texto quando nada selecionado
                            value={selectedYear}                  // valor selecionado
                            onChange={item => {
                                setSelectedYear(item.value);        // atualiza o estado ao selecionar
                                console.log("Selecionado:", item);
                            }}
                            style={{
                                width: 150,
                                borderWidth: 1,
                                borderColor: "#ccc",
                                borderRadius: 8,
                                paddingHorizontal: 8,
                                height: 30,
                            }}
                        />
                    </View>
                    <View ref={viewRef1} collapsable={false} style={{ backgroundColor: '#ffffff' }}>
                        <View style={{ height: 400, width: '95%' }} className="mt-1 justify-center">
                            {carregandoBarras ? (
                            <ChartCardSkeleton />
                        ) : (
                                <>
                                    <CartesianChart
                                        data={barChartData}
                                        xKey="meso"
                                        yKeys={["value"]}
                                        axisOptions={{
                                            tickCount: 6,
                                            font,
                                            formatYLabel: (value) => `${value}TJ`
                                        }}
                                        domainPadding={{ right: 50, top: 30 }}
                                    >
                                        {({ points, chartBounds }) => (
                                            <Bar
                                                color="#2D6EFF"
                                                chartBounds={chartBounds}
                                                points={points.value}
                                                barWidth={35}
                                                animate={{
                                                    type: "timing"
                                                }}
                                            />
                                        )}
                                    </CartesianChart>
                                    <View className="m-4">
                                        <Text>M = Mata Paraibana</Text>
                                        <Text>A = Agreste</Text>
                                        <Text>B = Borborema</Text>
                                        <Text>S = Sertão</Text>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                </View>
                <View className="flex-row justify-between items-center p-4">
                    <Button icon="download" mode="text" textColor="#000000" onPress={() => exportarGrafico(viewRef1, 'grafico1.png')}>
                        Exportar
                    </Button>
                </View>
                <View className="gap-4 p-4">
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 10, paddingHorizontal: 4 }}
                        className="mt-8"
                    >
                        {[
                            { id: "mata", label: "Mata" },
                            { id: "agreste", label: "Agreste" },
                            { id: "borborema", label: "Borborema" },
                            { id: "sertao", label: "Sertão" },
                        ].map((item) => {
                            const isSelected = selectedRegion === item.id;
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => setSelectedRegion(item.id as any)}
                                    style={{
                                        backgroundColor: isSelected ? "#2D6EFF" : "#F1F5F9",
                                        paddingHorizontal: 16,
                                        paddingVertical: 8,
                                        borderRadius: 20,
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={{
                                            color: isSelected ? "#FFFFFF" : "#4B5563",
                                            fontWeight: isSelected ? "bold" : "500",
                                            fontSize: 14,
                                        }}
                                    >
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
                <View ref={viewRef2} collapsable={false} style={{ backgroundColor: '#ffffff' }}>
                    <View style={{ height: 400, width: '95%' }} className="mt-6 px-2 justify-center">
                        {carregandoLinhas ? (
                            <ChartCardSkeleton />
                        ) : lineChartData.length === 0 ? (
                            <EmptyState
                              icon="show-chart"
                              title="Sem dados históricos"
                              description="Não há dados suficientes para o substrato e região selecionados."
                            />
                        ) : (
                            <CartesianChart
                                data={lineChartData}

                                // xKey: qual campo do objeto será usado no eixo X (horizontal)
                                xKey="year"

                                // yKeys: quais campos serão usados no eixo Y (vertical)
                                // Aqui usamos um array porque pode ter múltiplas linhas
                                // Mas nesse caso, só temos "value"
                                yKeys={["value"]}

                                // axisOptions: configurações dos eixos
                                axisOptions={{
                                    tickCount: 6,              // Número de marcadores no eixo Y
                                    font: fonts,                       // Fonte para os labels
                                    formatYLabel: (value) => `${value}TJ`, // Formata os valores do eixo Y
                                }}

                                // domainPadding: espaçamento extra ao redor do gráfico
                                domainPadding={{ right: 20, top: 30, left: 20 }}
                            >
                                {/* PASSO 9: Renderizar a linha */}
                                {/* Esta função recebe "points" que contém os pontos calculados */}
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
                                            // points.value porque definimos yKeys={["value"]}
                                            points={points.value}

                                            // Cor da linha
                                            color="#2D6EFF"

                                            // Espessura da linha
                                            strokeWidth={3}

                                            // Animação ao renderizar
                                            animate={{
                                                type: "timing",
                                                duration: 300
                                            }}

                                            // Tipo de curva (pode ser: "linear", "natural", "step")
                                            curveType="natural"
                                        />
                                    </>
                                )}
                            </CartesianChart>
                        )}
                    </View>
                </View>
                <View className="flex-row justify-between items-center p-4">
                    <Button icon="download" mode="text" textColor="#000000" onPress={() => exportarGrafico(viewRef2, 'grafico2.png')}>
                        Exportar
                    </Button>
                </View>
            </ScrollView>
        </View>
    );
}   
