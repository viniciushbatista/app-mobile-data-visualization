import { View, Text, ScrollView } from "react-native";
import { Header } from "../../shared/components/header/Header";
import Constants from "expo-constants";
import { CartesianChart, Bar, Line, useChartPressState } from "victory-native";
import Animated, { useAnimatedProps } from 'react-native-reanimated'
import { LinearGradient, useFont, vec } from '@shopify/react-native-skia'
import { Button, Card } from 'react-native-paper'
import FiltrosHorizontais from "../../shared/components/dashboard/Filter";
import { useState } from "react";

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

const data: DataType = {
    ovino: [
        { meso: "0", value: 0 },
        { meso: "M", value: 5 },
        { meso: "A", value: 30 },
        { meso: "B", value: 40 },
        { meso: "S", value: 45 },
    ],
    bovino: [
        { meso: "0", value: 0 },
        { meso: "M", value: 10 },
        { meso: "A", value: 20 },
        { meso: "B", value: 50 },
        { meso: "S", value: 70 },
    ],
    caprino: [
        { meso: "0", value: 0 },
        { meso: "M", value: 3 },
        { meso: "A", value: 25 },
        { meso: "B", value: 60 },
        { meso: "S", value: 80 },
    ],
};


export default function Dashboard() {

    const [selectedAnimal, setSelectedAnimal] = useState<"ovino" | "bovino" | "caprino" | "todos">("todos");

    const getChartData = () => {
        if (selectedAnimal === "todos") {

            // agrupa as mesorregiões e soma os valores
            const result: Record<string, number> = {};

            const all = [...data.ovino, ...data.bovino, ...data.caprino];

            all.forEach(item => {
                if (!result[item.meso]) result[item.meso] = 0;
                result[item.meso] += item.value;
            });

            // converte para o formato que o Victory entende
            return Object.entries(result).map(([meso, value]) => ({
                meso,
                value,
            }));
        }

        return data[selectedAnimal];
    };


    const font = useFont(require("./../../../assets/static/Inter_18pt-Regular.ttf"))

    return (
        <View className="flex-1 bg-white">
            <View className="m-4 gap-6" >
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 12, paddingHorizontal: 10 }}
                    className="mt-8"
                >
                    <Button mode={selectedAnimal === "todos" ? "elevated" : "contained"} onPress={() => setSelectedAnimal("todos")}>Todos</Button>
                    <Button mode={selectedAnimal === "ovino" ? "elevated" : "contained"} onPress={() => setSelectedAnimal("ovino")}>Ovino</Button>
                    <Button mode={selectedAnimal === "bovino" ? "elevated" : "contained"} onPress={() => setSelectedAnimal("bovino")}>Bovino</Button>
                    <Button mode={selectedAnimal === "caprino" ? "elevated" : "contained"} onPress={() => setSelectedAnimal("caprino")}>Caprino</Button>
                </ScrollView>
                <Card mode="elevated" style={{ backgroundColor: "white", borderRadius: 12, shadowOpacity: 0}}>
                    <View style={{ height: 450, width: '95%' }} className="mt-4">
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
                                    color="#D9D9D9"
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
                </Card>
                <Button icon="arrow-collapse-down" mode="contained" onPress={() => console.log("Download")} className="mt-10">Download</Button>
            </View>
        </View>
    );
}
