import { View, Text, ScrollView } from "react-native";
import Constants from "expo-constants";
import { CartesianChart, Bar, Line, useChartPressState } from "victory-native";
import Animated, { useAnimatedProps } from 'react-native-reanimated'
import { LinearGradient, useFont, vec } from '@shopify/react-native-skia'
import { Button, Card } from 'react-native-paper'
import { useState } from "react";
import { Dropdown } from 'react-native-element-dropdown'


const staturBarHeight = Constants.statusBarHeight;


type Item = {
    meso: string;
    value: number;
};

type DataType = {
    ovino: Item[];
    bovino: Item[];
    caprino: Item[];
};

// DADOS 2020
const data2020: DataType = {
    ovino: [
        {meso: "0", value: 0},
        { meso: "M", value: 20 },
        { meso: "A", value: 30 },
        { meso: "B", value: 40 },
        { meso: "S", value: 45 },
    ],
    bovino: [
        {meso: "0", value: 0},
        { meso: "M", value: 10 },
        { meso: "A", value: 20 },
        { meso: "B", value: 50 },
        { meso: "S", value: 70 },
    ],
    caprino: [
        {meso: "0", value: 0},
        { meso: "M", value: 15 },
        { meso: "A", value: 25 },
        { meso: "B", value: 60 },
        { meso: "S", value: 80 },
    ],
};

//DADOS 2021
const data2021: DataType = {
    ovino: [
        { meso: "0", value: 0 },
        { meso: "M", value: 7 },
        { meso: "A", value: 35 },
        { meso: "B", value: 45 },
        { meso: "S", value: 50 },
    ],
    bovino: [
        { meso: "0", value: 0 },
        { meso: "M", value: 12 },
        { meso: "A", value: 25 },
        { meso: "B", value: 55 },
        { meso: "S", value: 75 },
    ],
    caprino: [
        { meso: "0", value: 0 },
        { meso: "M", value: 5 },
        { meso: "A", value: 30 },
        { meso: "B", value: 65 },
        { meso: "S", value: 85 },
    ],
};

//DADOS 2022
const data2022: DataType = {
    ovino: [
        { meso: "0", value: 0 },
        { meso: "M", value: 10 },
        { meso: "A", value: 40 },
        { meso: "B", value: 50 },
        { meso: "S", value: 55 },
    ],
    bovino: [
        { meso: "0", value: 0 },
        { meso: "M", value: 15 },
        { meso: "A", value: 30 },
        { meso: "B", value: 60 },
        { meso: "S", value: 80 },
    ],
    caprino: [
        { meso: "0", value: 0 },
        { meso: "M", value: 8 },
        { meso: "A", value: 35 },
        { meso: "B", value: 70 },
        { meso: "S", value: 90 },
    ],
};

// OBJETO QUE AGRUPA TODOS OS ANOS
const dataByYear: Record<number, DataType> = {
    2020: data2020,
    2021: data2021,
    2022: data2022,
};

// ANOS DISPONÍVEIS
const availableYears = [2020, 2021, 2022];
const mostRecentYear = Math.max(...availableYears); // 2022

// PASSO 1: Definir o tipo dos dados
type YearData = {
    year: string;
    value: number;
};

// PASSO 2: Definir o tipo das regiões disponíveis
type RegionDataType = {
    mata: YearData[];
    agreste: YearData[];
    borborema: YearData[];
    sertao: YearData[];
};

// PASSO 3: Criar o objeto com todos os dados
const regionData: RegionDataType = {
    mata: [
        { year: "2019", value: 120 },
        { year: "2020", value: 135 },
        { year: "2021", value: 100 },
        { year: "2022", value: 165 },
        { year: "2023", value: 90 },
        { year: "2024", value: 195 },
    ],
    agreste: [
        { year: "2019", value: 200 },
        { year: "2020", value: 95 },
        { year: "2021", value: 110 },
        { year: "2022", value: 125 },
        { year: "2023", value: 140 },
        { year: "2024", value: 155 },
    ],
    borborema: [
        { year: "2019", value: 45 },
        { year: "2020", value: 52 },
        { year: "2021", value: 55 },
        { year: "2022", value: 68 },
        { year: "2023", value: 100 },
        { year: "2024", value: 82 },
    ],
    sertao: [
        { year: "2019", value: 20 },
        { year: "2020", value: 63 },
        { year: "2021", value: 72 },
        { year: "2022", value: 58 },
        { year: "2023", value: 88 },
        { year: "2024", value: 200 },
    ],
};

const dataDrop = [
    { label: '2020', value: 2020 },
    { label: '2021', value: 2021 },
    { label: '2022', value: 2022 },
];



export default function Dashboard() {

    const [selectedAnimal, setSelectedAnimal] = useState<"ovino" | "bovino" | "caprino" | "todos">("todos");

    const [selectedYear, setSelectedYear] = useState<number>(mostRecentYear);

    const getChartData = (): Item[] => {
        // SELECIONA OS DADOS DO ANO
        const data = dataByYear[selectedYear]; // MUDANÇA AQUI!

        if (selectedAnimal === "todos") {
            const result: Record<string, number> = {};

            // USA OS DADOS DO ANO SELECIONADO
            const all: Item[] = [...data.ovino, ...data.bovino, ...data.caprino];

            all.forEach((item: Item) => {
                if (!result[item.meso]) result[item.meso] = 0;
                result[item.meso] += item.value;
            });

            return Object.entries(result).map(([meso, value]) => ({
                meso,
                value,
            }));
        }

        return data[selectedAnimal];
    };

    const [selectedRegion, setSelectedRegion] = useState<"mata" | "agreste" | "borborema" | "sertao">("mata");

    const fonts = useFont(require("./../../../assets/static/Inter_18pt-Regular.ttf"));

    // PASSO 6: Criar função que retorna os dados da região selecionada
    const getData = () => {
        // Retorna apenas os dados da região selecionada
        return regionData[selectedRegion];
    };


    const font = useFont(require("./../../../assets/static/Inter_18pt-Regular.ttf"))

    //constalue, setValue] = useState<string | null>(null);

    return (
        <View className="flex-1 bg-white ">
            <ScrollView>
                <View className="gap-4 p-4">
                    <View className="bottom-1">
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 12, paddingHorizontal: 10 }}
                            className="mt-8"
                        >
                            <Button
                                theme={{ colors: { primary: 'black', elevation: { level1: '#EBEBEB' } } }}
                                mode={selectedAnimal === "todos" ? "contained" : "elevated"}
                                onPress={() => setSelectedAnimal("todos")}>Todos</Button>
                            <Button
                                theme={{ colors: { primary: 'black', elevation: { level1: '#EBEBEB' } } }}
                                mode={selectedAnimal === "ovino" ? "contained" : "elevated"}
                                onPress={() => setSelectedAnimal("ovino")}>Ovino</Button>
                            <Button
                                theme={{ colors: { primary: 'black', elevation: { level1: '#EBEBEB' } } }}
                                mode={selectedAnimal === "bovino" ? "contained" : "elevated"}
                                onPress={() => setSelectedAnimal("bovino")}>Bovino</Button>
                            <Button
                                theme={{ colors: { primary: 'black', elevation: { level1: '#EBEBEB' } } }}
                                mode={selectedAnimal === "caprino" ? "contained" : "elevated"}
                                onPress={() => setSelectedAnimal("caprino")}>Caprino</Button>
                        </ScrollView>
                    </View>
                    <View style={{ height: 400, width: '95%' }} className="mt-1">
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

                        <CartesianChart
                            data={getChartData()}
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
                                >
                                </Bar>
                            )}
                        </CartesianChart>
                        <View className="m-4">
                            <Text>M = Mata Paraibana</Text>
                            <Text>A = Agreste</Text>
                            <Text>B = Borborema</Text>
                            <Text>S = Sertão</Text>
                        </View>
                    </View>
                </View>
                <View className="flex-row justify-between items-center p-4">
                    <Button icon="download" mode="text" textColor="#000000">
                        Baixar
                    </Button>
                    <Button
                        mode="text"
                        textColor="#2D6EFF"
                    >
                        Ir para dados
                    </Button>
                </View>
                <View className="gap-4 p-4">
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 12, paddingHorizontal: 10 }}
                        className="mt-8"
                    >
                        {/* Cada botão muda o estado selectedRegion quando clicado */}
                        <Button
                            theme={{ colors: { primary: 'black', elevation: { level1: '#EBEBEB' } } }}
                            mode={selectedRegion === "mata" ? "contained" : "elevated"}
                            onPress={() => setSelectedRegion("mata")}
                        >
                            Mata
                        </Button>
                        <Button
                            theme={{ colors: { primary: 'black', elevation: { level1: '#EBEBEB' } } }}
                            mode={selectedRegion === "agreste" ? "contained" : "elevated"}
                            onPress={() => setSelectedRegion("agreste")}
                        >
                            Agreste
                        </Button>
                        <Button
                            theme={{ colors: { primary: 'black', elevation: { level1: '#EBEBEB' } } }}
                            mode={selectedRegion === "borborema" ? "contained" : "elevated"}
                            onPress={() => setSelectedRegion("borborema")}
                        >
                            Borborema
                        </Button>
                        <Button
                            theme={{ colors: { primary: 'black', elevation: { level1: '#EBEBEB' } } }}
                            mode={selectedRegion === "sertao" ? "contained" : "elevated"}
                            onPress={() => setSelectedRegion("sertao")}
                        >
                            Sertão
                        </Button>
                    </ScrollView>
                </View>

                {/* PASSO 8: Criar o gráfico */}
                <View style={{ height: 400, width: '95%' }} className="mt-6 px-2">
                    <CartesianChart
                        data={getData()}

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
                        {({ points }) => (
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
                        )}
                    </CartesianChart>
                </View>
                <View className="flex-row justify-between items-center p-4">
                    <Button icon="download" mode="text" textColor="#000000">
                        Baixar
                    </Button>
                    <Button
                        mode="text"
                        textColor="#2D6EFF"
                    >
                        Ir para dados
                    </Button>
                </View>
            </ScrollView>
        </View>
    );
}   
