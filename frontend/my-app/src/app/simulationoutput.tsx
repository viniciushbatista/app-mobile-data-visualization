import { View, Text, ScrollView } from "react-native";
import { CartesianChart, Line, Area, useChartPressState } from "victory-native";
import { useFont, Circle, Text as SkiaText, useFont as useSkiaFont } from '@shopify/react-native-skia'
import { Button, Card } from 'react-native-paper'
import { useRef } from "react";
import * as Sharing from 'expo-sharing'
import { makeImageFromView } from '@shopify/react-native-skia';
import { File as ExpoFile, Paths } from 'expo-file-system';
import { useLocalSearchParams } from "expo-router";
import type { SharedValue } from "react-native-reanimated";
import { useDerivedValue } from "react-native-reanimated";

const ANO_REFERENCIA = 2024;

const gerarPredicao = (quantidade: number, anoAlvo: number) => {
  const variacoes = [0, 0.08, -0.03, 0.12, 0.05, -0.02, 0.15, 0.09, -0.04, 0.18, 0.11, 0.07, -0.05, 0.20, 0.13, 0.22, 0.17, -0.06, 0.25, 0.19];

  const anoInicio = anoAlvo <= ANO_REFERENCIA + 5
    ? anoAlvo - 5
    : ANO_REFERENCIA;

  return Array.from({ length: anoAlvo - anoInicio + 1 }, (_, i) => ({
    ano: anoInicio + i,
    value: parseFloat((quantidade * (1 + (variacoes[i] ?? i * 0.08))).toFixed(2))
  }));
};

// Componente tooltip com círculo + label de valor
function ToolTip({
  x,
  y,
  value,
  color,
  font,
}: {
  x: SharedValue<number>;
  y: SharedValue<number>;
  value: SharedValue<number>;
  color: string;
  font: any;
}) {
  // Formata o valor para exibir no label
  const label = useDerivedValue(() => `${value.value.toFixed(1)}TJ`);

  // Posiciona o texto acima do círculo
  const textX = useDerivedValue(() => x.value - 20);
  const textY = useDerivedValue(() => y.value - 12);

  return (
    <>
      <Circle cx={x} cy={y} r={6} color={color} />
      {font && (
        <SkiaText
          x={textX}
          y={textY}
          text={label}
          font={font}
          color={color}
        />
      )}
    </>
  );
}

export default function SimulationOutput() {
  const { substrato, quantidade, ano, regiao } = useLocalSearchParams<{
    substrato: string;
    quantidade: string;
    ano: string;
    regiao: string;
  }>();

  const viewRef = useRef(null);
  const font = useFont(require("./../../assets/static/Inter_18pt-Regular.ttf"));
  const tooltipFont = useFont(require("./../../assets/static/Inter_18pt-Bold.ttf"), 11);

  const anoAlvo = Number(ano) || 2028;
  const anoInicio = anoAlvo <= ANO_REFERENCIA + 5
    ? anoAlvo - 5
    : ANO_REFERENCIA;
  const dadosPredicao = gerarPredicao(Number(quantidade) || 100, anoAlvo);
  const resultadoFinal = dadosPredicao[dadosPredicao.length - 1].value;

  // Multipress suave usando SharedValues diretamente
  const { state: firstPress, isActive: isFirstActive } = useChartPressState({ x: 0, y: { value: 0 } });
  const { state: secondPress, isActive: isSecondActive } = useChartPressState({ x: 0, y: { value: 0 } });

  const exportarGrafico = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const image = await makeImageFromView(viewRef);
      if (!image) return;

      const base64 = image.encodeToBase64();
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const file = new ExpoFile(Paths.cache, 'predicao.jpg');
      file.create({ overwrite: true });
      file.write(bytes);

      await Sharing.shareAsync(file.uri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Salvar predição',
      });
    } catch (err) {
      console.error('Erro ao exportar:', err);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView>
        <View className="p-4 gap-4">

          <Card mode="elevated" theme={{ colors: { elevation: { level1: '#FFFFFF' } } }}>
            <Card.Content className="gap-2">
              <Text className="text-lg font-bold mb-2">Parâmetros da Simulação</Text>
              <Text>Substrato: {substrato}</Text>
              <Text>Quantidade: {quantidade}%</Text>
              <Text>Ano alvo: {ano}</Text>
              <Text>Região: {regiao}</Text>
            </Card.Content>
          </Card>

          <Card mode="elevated" theme={{ colors: { elevation: { level1: '#FFFFFF' } } }}>
            <Card.Content>
              <Text className="text-lg font-bold mb-2">Resultado da Predição</Text>
              <Text className="text-3xl font-bold text-blue-600">
                {resultadoFinal.toFixed(2)} TJ
              </Text>
              <Text className="text-gray-500 mt-1">
                Potencial energético estimado para {ano}
              </Text>
            </Card.Content>
          </Card>

          <View ref={viewRef} collapsable={false} style={{ backgroundColor: '#ffffff' }}>
            <Text className="text-lg font-bold mb-2 px-2">
              Projeção {anoInicio} → {anoAlvo}
            </Text>
            <View style={{ height: 300 }}>
              <CartesianChart
                data={dadosPredicao}
                xKey="ano"
                yKeys={["value"]}
                chartPressState={[firstPress, secondPress]}
                axisOptions={{
                  font,
                  tickCount: { x: 5, y: 5 },
                  formatYLabel: (v) => `${v.toFixed(0)}TJ`,
                  formatXLabel: (v) => String(v),
                }}
                domainPadding={{ right: 20, top: 30, left: 20 }}
              >
                {({ points, chartBounds }) => (
                  <>
                    <Area
                      points={points.value}
                      y0={chartBounds.bottom}
                      color="rgba(45, 110, 255, 0.15)"
                      animate={{ type: "timing", duration: 300 }}
                      curveType="natural"
                    />
                    <Line
                      points={points.value}
                      color="#2D6EFF"
                      strokeWidth={3}
                      animate={{ type: "timing", duration: 300 }}
                      curveType="natural"
                    />

                    {/* Primeiro toque com valor */}
                    {isFirstActive && (
                      <ToolTip
                        x={firstPress.x.position}
                        y={firstPress.y.value.position}
                        value={firstPress.y.value.value}
                        color="#2D6EFF"
                        font={tooltipFont}
                      />
                    )}

                    {/* Segundo toque com valor */}
                    {isSecondActive && (
                      <ToolTip
                        x={secondPress.x.position}
                        y={secondPress.y.value.position}
                        value={secondPress.y.value.value}
                        color="#FF6B2D"
                        font={tooltipFont}
                      />
                    )}
                  </>
                )}
              </CartesianChart>
            </View>
          </View>

          <View className="flex-row justify-between items-center">
            <Button icon="download" mode="text" textColor="#000000" onPress={exportarGrafico}>
              Exportar
            </Button>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}