// MapaParaiba.tsx
import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';

interface MapaParaibaProps {
  onRegionPress?: (regionName: string, regionValue: number) => void;
}

// 1. Exporta o tipo do ref para usar no outro arquivo
export interface MapaParaibaRef {
  exportarMapa: () => void;
  atualizarAno: (ano: string) => void;
}

// 2. Troca React.FC por forwardRef
const MapaParaiba = forwardRef<MapaParaibaRef, MapaParaibaProps>(
  ({ onRegionPress }, ref) => {
    const webViewRef = useRef<WebView>(null);

    // 3. Expõe a função exportarMapa para o componente pai
    useImperativeHandle(ref, () => ({
      exportarMapa: () => {
        webViewRef.current?.injectJavaScript('exportarMapa(); true;');
      },
      atualizarAno: (ano: string) => {
        // Envia o ano para dentro do WebView
        webViewRef.current?.injectJavaScript(`atualizarMapa('${ano}'); true;`);
      }
    }));

    const handleMessage = async (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        if (data.type === 'regionClick' && onRegionPress) {
          onRegionPress(data.name, data.value);
        }

        if (data.type === 'exportMap') {
          const base64Data = data.base64.replace('data:image/jpeg;base64,', '');

          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const file = new File(Paths.cache, 'mapa_paraiba.jpg');
          file.create({ overwrite: true });
          file.write(bytes);

          await Sharing.shareAsync(file.uri, {
            mimeType: 'image/jpeg',
            dialogTitle: 'Salvar mapa',
          });
        }

      } catch (err) {
        console.error('Erro:', err);
      }
    };

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>Mapa da Paraíba</title>
      <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: hidden; position: relative; }
        #main { width: 100%; height: 100%; }

        #filtro {
          position: absolute;
          top: 10px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          gap: 8px;
          z-index: 100;
        }

        .btn-ano {
          padding: 4px 12px;
          border: 1.5px solid #1976d2;
          border-radius: 20px;
          background: #fff;
          color: #1976d2;
          font-size: 12px;
          cursor: pointer;
        }

        .btn-ano.ativo {
          background: #1976d2;
          color: #fff;
        }
      </style>
    </head>
    <body>

      <div id="main"></div>

      <script>
        const colorSchemes = {
          blue: ['#e3f2fd', '#90caf9', '#42a5f5', '#1976d2', '#0d47a1']
        };

        const dadosPorAno = {
          '2021': [
            { name: 'Mata Paraibana', value: 1200000 },
            { name: 'Agreste Paraibano', value: 800000 },
            { name: 'Borborema', value: 350000 },
            { name: 'Sertão Paraibano', value: 400000 }
          ],
          '2022': [
            { name: 'Mata Paraibana', value: 1300000 },
            { name: 'Agreste Paraibano', value: 850000 },
            { name: 'Borborema', value: 370000 },
            { name: 'Sertão Paraibano', value: 420000 }
          ],
          '2023': [
            { name: 'Mata Paraibana', value: 1400000 },
            { name: 'Agreste Paraibano', value: 900000 },
            { name: 'Borborema', value: 400000 },
            { name: 'Sertão Paraibano', value: 450000 }
          ]
        };

        const mapaCodigosNomes = {
          '2501': 'Mata Paraibana',
          '2502': 'Agreste Paraibano', 
          '2503': 'Borborema',
          '2504': 'Sertão Paraibano'
        };

        let chart = null;
        let selectedRegion = null;
        let anoAtual = '2021';

        function atualizarMapa(ano) {
          anoAtual = ano;

          document.querySelectorAll('.btn-ano').forEach(btn => {
            btn.classList.toggle('ativo', btn.dataset.ano === ano);
          });

          if (chart) {
            selectedRegion = null;
            chart.setOption({
              series: [{ data: dadosPorAno[ano] }]
            });
          }
        }

        function exportarMapa() {
          if (chart) {
            const base64 = chart.getDataURL({
              type: 'jpeg',
              pixelRatio: 2,
              backgroundColor: '#fff'
            });

            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'exportMap',
                base64: base64
              }));
            }
          }
        }

        async function init() {
          try {
            const res = await fetch(
              'https://servicodados.ibge.gov.br/api/v3/malhas/estados/25?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=mesorregiao'
            );
            
            if (!res.ok) throw new Error('Falha ao buscar dados do IBGE');
            
            const geoJSON = await res.json();

            geoJSON.features.forEach(feature => {
              const codigo = feature.properties.codarea;
              feature.properties.name = mapaCodigosNomes[codigo] || 'Região ' + codigo;
            });

            chart = echarts.init(document.getElementById('main'));
            echarts.registerMap('PB', geoJSON);

            const option = {
              grid: { top: 10, bottom: 60, left: 10, right: 10 },
              tooltip: {
                trigger: 'item',
                formatter: '{b}: {c}',
                backgroundColor: 'rgba(0,0,0,0.7)',
                borderColor: '#1976d2',
                borderWidth: 1,
                textStyle: { color: '#fff' }
              },
              visualMap: {
                min: 0,
                max: Math.max(...dadosPorAno[anoAtual].map(d => d.value)),
                text: ['Alto', 'Baixo'],
                inRange: { color: colorSchemes.blue },
                orient: 'horizontal',
                left: 'center',
                bottom: 5,
                calculable: false
              },
              series: [{
                type: 'map',
                map: 'PB',
                roam: false,
                scaleLimit: { min: 1, max: 1 },
                emphasis: { 
                  focus: 'self',
                  label: {
                    show: true,
                    color: '#8f5b14',
                    fontWeight: 'bold',
                    fontSize: 14
                  },
                  itemStyle: { 
                    areaColor: '#fadb37',
                    borderColor: 'transparent',
                    borderWidth: 0,
                    shadowBlur: 10,
                    shadowColor: 'rgba(0,0,0,0.5)'
                  }
                },
                label: { show: false },
                itemStyle: {
                  areaColor: '#e3f2fd',
                  borderColor: '#fff',
                  borderWidth: 1.5
                },
                data: dadosPorAno[anoAtual]
              }]
            };

            chart.setOption(option);

            chart.on('click', function(params) {
              if (params.componentType === 'series') {
                if (selectedRegion === params.name) {
                  chart.dispatchAction({
                    type: 'downplay',
                    seriesIndex: 0,
                    name: params.name
                  });
                  selectedRegion = null;
                } else {
                  if (selectedRegion) {
                    chart.dispatchAction({
                      type: 'downplay',
                      seriesIndex: 0,
                      name: selectedRegion
                    });
                  }
                  chart.dispatchAction({
                    type: 'highlight',
                    seriesIndex: 0,
                    name: params.name
                  });
                  selectedRegion = params.name;
                }

                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'regionClick',
                    name: params.name,
                    value: params.value,
                    ano: anoAtual
                  }));
                }
              }
            });

            window.addEventListener('resize', function() {
              if (chart) chart.resize();
            });
            
          } catch (error) {
            console.error('Erro ao carregar o mapa:', error);
            const mainDiv = document.getElementById('main');
            if (mainDiv) {
              mainDiv.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-family:sans-serif;text-align:center;padding:20px;"><div><p>❌ Erro ao carregar o mapa</p><p style="font-size:12px;margin-top:10px;">Verifique sua conexão com a internet</p></div></div>';
            }
          }
        }

        document.addEventListener('gesturestart', function(e) { e.preventDefault(); });
        document.addEventListener('touchmove', function(e) {
          if (e.scale !== 1) e.preventDefault();
        }, { passive: false });

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', init);
        } else {
          init();
        }
      </script>
    </body>
    </html>
  `;

    return (
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scrollEnabled={false}
          bounces={false}
          scalesPageToFit={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          style={styles.webview}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
  botaoExportar: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#1976d2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
});

export default MapaParaiba;