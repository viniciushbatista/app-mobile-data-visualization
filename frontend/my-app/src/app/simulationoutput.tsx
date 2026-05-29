import { View, Text, ScrollView } from "react-native";
import { CartesianChart, Line, Area, useChartPressState } from "victory-native";
import { useFont, Circle, Text as SkiaText } from '@shopify/react-native-skia'
import { Button, Card, ActivityIndicator } from 'react-native-paper'
import { useRef, useState, useEffect } from "react";
import * as Sharing from 'expo-sharing'
import { makeImageFromView } from '@shopify/react-native-skia';
import { File as ExpoFile, Paths } from 'expo-file-system';
import { useLocalSearchParams } from "expo-router";
import type { SharedValue } from "react-native-reanimated";
import { useDerivedValue } from "react-native-reanimated";
import { api, SUBSTRATO_LABEL_MAP } from "../services/api";

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
  const { substrato, quantidade, ano, regiao, codigoIbge, municipioNome } = useLocalSearchParams<{
    substrato: string;
    quantidade: string;
    ano: string;
    regiao: string;
    codigoIbge?: string;
    municipioNome?: string;
  }>();

  const viewRef = useRef(null);
  const font = useFont(require("./../../assets/static/Inter_18pt-Regular.ttf"));
  const tooltipFont = useFont(require("./../../assets/static/Inter_18pt-Bold.ttf"), 11);

  const [carregando, setCarregando] = useState(true);
  const [dadosPredicao, setDadosPredicao] = useState<{ ano: number; value: number }[]>([]);
  const [resultadoFinal, setResultadoFinal] = useState<number>(0);
  const [anoInicio, setAnoInicio] = useState<number>(2020);
  const anoAlvo = Number(ano) || 2026;

  useEffect(() => {
    let isMounted = true;

    const executarSimulacao = async () => {
      setCarregando(true);
      try {
        // Normaliza chaves dos parâmetros selecionados
        const substratoDb = SUBSTRATO_LABEL_MAP[substrato] || substrato;

        let historicoReais: { ano: number; value: number }[] = [];

        if (codigoIbge) {
          // Simulação por município: buscar série histórica completa de potencial energético do município em 1 chamada única!
          const serieRes = await api.getEnergiaMunicipioSerie(Number(codigoIbge), substratoDb);
          if (!isMounted) return;

          if (!serieRes || !serieRes.dados || serieRes.dados.length === 0) {
            throw new Error('Sem dados históricos para o município e substrato selecionados.');
          }

          // Mapear para o formato do gráfico
          historicoReais = serieRes.dados.map(item => ({
            ano: item.ano,
            value: parseFloat(item.potencial_tj.toFixed(2))
          })).sort((a, b) => a.ano - b.ano);

        } else {
          // Simulação por mesorregião (fluxo original)
          let nomeMesoReal = regiao;
          if (regiao === 'Agreste') nomeMesoReal = 'Agreste Paraibano';
          if (regiao === 'Sertão') nomeMesoReal = 'Sertão Paraibano';

          // 1. Busca anos disponíveis históricos
          const serieRes = await api.getMesorregiaoSerie(nomeMesoReal, substratoDb);
          if (!isMounted) return;

          if (!serieRes || !serieRes.dados || serieRes.dados.length === 0) {
            throw new Error('Sem dados históricos para a mesorregião e substrato selecionados.');
          }

          const anosDisponiveis = serieRes.dados.map(d => d.ano).sort((a, b) => a - b);

          // 2. Carrega potentials em TJ históricos
          const promessas = anosDisponiveis.map(async (a) => {
            const res = await api.getEnergiaMesorregiao(nomeMesoReal, a, substratoDb);
            return { ano: a, value: parseFloat(res.potencial_tj.toFixed(2)) };
          });

          historicoReais = await Promise.all(promessas);
        }

        if (!isMounted) return;

        const latestHistoric = historicoReais[historicoReais.length - 1];
        const valorBase = latestHistoric.value;
        const baselineYear = latestHistoric.ano;

        const targetYear = Math.max(anoAlvo, baselineYear + 1);

        // 3. Aplica o incremento (%) sobre o último ano histórico
        const incrementoPercent = Number(quantidade) || 0;
        const valorSimulado = valorBase * (1 + incrementoPercent / 100);

        // 4. Interpolação linear entre o último ano histórico e o ano alvo
        const numAnosProjetar = targetYear - baselineYear;
        const projecao = [];
        for (let i = 1; i <= numAnosProjetar; i++) {
          const anoProj = baselineYear + i;
          const fator = i / numAnosProjetar;
          const valorProj = valorBase + (valorSimulado - valorBase) * fator;
          projecao.push({
            ano: anoProj,
            value: parseFloat(valorProj.toFixed(2))
          });
        }

        const dadosCompletos = [
          ...historicoReais,
          ...projecao
        ];

        setDadosPredicao(dadosCompletos);
        setResultadoFinal(parseFloat(valorSimulado.toFixed(2)));
        setAnoInicio(historicoReais[0].ano);
      } catch (err) {
        console.error('[SimulationOutput] Erro na simulação:', err);
        // Fallback matemático se falhar totalmente
        const baseTJ = 100;
        const targetYear = Math.max(anoAlvo, 2025);
        const simVal = baseTJ * (1 + (Number(quantidade) || 0) / 100);
        const fbData = Array.from({ length: 5 }, (_, i) => ({
          ano: targetYear - 4 + i,
          value: parseFloat((baseTJ + (simVal - baseTJ) * (i / 4)).toFixed(2))
        }));
        setDadosPredicao(fbData);
        setResultadoFinal(parseFloat(simVal.toFixed(2)));
        setAnoInicio(targetYear - 4);
      } finally {
        if (isMounted) setCarregando(false);
      }
    };

    executarSimulacao();

    return () => {
      isMounted = false;
    };
  }, [substrato, quantidade, ano, regiao]);

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
      {carregando ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <ActivityIndicator size="large" color="#2D6EFF" />
          <Text style={{ marginTop: 16, color: "#4B5563", fontSize: 16 }}>
            Processando simulação com dados históricos...
          </Text>
        </View>
      ) : (
        <ScrollView>
          <View className="p-4 gap-4">

            <Card 
              mode="elevated" 
              style={{ 
                backgroundColor: '#FFFFFF', 
                borderRadius: 12,
                borderLeftWidth: 5,
                borderLeftColor: '#9CA3AF',
                elevation: 2,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8
              }}
            >
              <Card.Content style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 }}>
                  Parâmetros da Simulação
                </Text>
                
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
                    <Text style={{ fontSize: 12, color: '#4B5563', fontWeight: '500' }}>Biomassa: {substrato}</Text>
                  </View>
                  <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
                    <Text style={{ fontSize: 12, color: '#4B5563', fontWeight: '500' }}>Incremento: {quantidade}%</Text>
                  </View>
                  <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
                    <Text style={{ fontSize: 12, color: '#4B5563', fontWeight: '500' }}>Ano Alvo: {ano}</Text>
                  </View>
                  <View style={{ backgroundColor: '#E0F2FE', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
                    <Text style={{ fontSize: 12, color: '#0369A1', fontWeight: '600' }}>
                      {codigoIbge ? `Município: ${municipioNome}` : `Região: ${regiao}`}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            <Card 
              mode="elevated" 
              style={{ 
                backgroundColor: '#FFFFFF', 
                borderRadius: 12,
                borderLeftWidth: 5,
                borderLeftColor: '#2D6EFF',
                elevation: 2,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8
              }}
            >
              <Card.Content style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 4 }}>
                  Resultado da Projeção
                </Text>
                <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#2D6EFF' }}>
                  {resultadoFinal.toFixed(2)} <Text style={{ fontSize: 20, color: '#4B5563', fontWeight: '600' }}>TJ</Text>
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: '500' }}>
                  Potencial energético total estimado para o ano de {ano}
                </Text>
              </Card.Content>
            </Card>

            <View 
              ref={viewRef} 
              collapsable={false} 
              style={{ 
                backgroundColor: '#ffffff',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#F1F5F9',
                padding: 12,
                elevation: 1,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.02,
                shadowRadius: 4
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12, paddingHorizontal: 4 }}>
                Série de Projeção Histórica ({anoInicio} → {anoAlvo})
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
      )}
    </View>
  );
}