// MapaParaiba.tsx - Bug de Seleção Corrigido
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface MapaParaibaProps {
  onRegionPress?: (regionName: string, regionValue: number) => void;
}

const MapaParaiba: React.FC<MapaParaibaProps> = ({ onRegionPress }) => {
  
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'regionClick' && onRegionPress) {
        onRegionPress(data.name, data.value);
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
        html, body, #main { width: 100%; height: 100%; overflow: hidden; }
      </style>
    </head>
    <body>
      <div id="main"></div>

      <script>
        const colorSchemes = {
          blue: ['#e3f2fd', '#90caf9', '#42a5f5', '#1976d2', '#0d47a1']
        };

        const dadosRegioes = [
          { name: 'Mata Paraibana', value: 1400000 },
          { name: 'Agreste Paraibano', value: 900000 },
          { name: 'Borborema', value: 400000 },
          { name: 'Sertão Paraibano', value: 450000 }
        ];

        const mapaCodigosNomes = {
          '2501': 'Mata Paraibana',
          '2502': 'Agreste Paraibano', 
          '2503': 'Borborema',
          '2504': 'Sertão Paraibano'
        };

        let chart = null;
        let selectedRegion = null;

        async function init() {
          try {
            const res = await fetch(
              'https://servicodados.ibge.gov.br/api/v3/malhas/estados/25?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=mesorregiao'
            );
            
            if (!res.ok) {
              throw new Error('Falha ao buscar dados do IBGE');
            }
            
            const geoJSON = await res.json();

            // Atribuir nomes às features do GeoJSON
            geoJSON.features.forEach(feature => {
              const codigo = feature.properties.codarea;
              feature.properties.name = mapaCodigosNomes[codigo] || 'Região ' + codigo;
            });

            // Inicializar o chart
            chart = echarts.init(document.getElementById('main'));
            echarts.registerMap('PB', geoJSON);

            // Configurar opções do mapa
            const option = {
              grid: {
                top: 10,
                bottom: 60,
                left: 10,
                right: 10
              },
              tooltip: {
                trigger: 'item',
                formatter: '{b}: {c}',
                backgroundColor: 'rgba(0,0,0,0.7)',
                borderColor: '#1976d2',
                borderWidth: 1,
                textStyle: {
                  color: '#fff'
                }
              },
              visualMap: {
                min: 0,
                max: Math.max(...dadosRegioes.map(d => d.value)),
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
                roam: false, // Mapa fixo
                scaleLimit: {
                  min: 1,
                  max: 1
                },
                // REMOVIDO selectedMode para evitar travamento
                emphasis: { 
                  focus: 'self',
                  label: {
                    show: true,
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: 14
                  },
                  itemStyle: { 
                    areaColor: '#ffd54f',
                    borderColor: '#ff6f00',
                    borderWidth: 2,
                    shadowBlur: 10,
                    shadowColor: 'rgba(0,0,0,0.5)'
                  }
                },
                label: {
                  show: false
                },
                itemStyle: {
                  areaColor: '#e3f2fd',
                  borderColor: '#fff',
                  borderWidth: 1.5
                },
                data: dadosRegioes
              }]
            };

            chart.setOption(option);

            // Evento de clique - controla destaque manualmente
            chart.on('click', function(params) {
              if (params.componentType === 'series') {
                
                // Se clicar na mesma região, remove o destaque
                if (selectedRegion === params.name) {
                  chart.dispatchAction({
                    type: 'downplay',
                    seriesIndex: 0,
                    name: params.name
                  });
                  selectedRegion = null;
                } else {
                  // Remove destaque da região anterior
                  if (selectedRegion) {
                    chart.dispatchAction({
                      type: 'downplay',
                      seriesIndex: 0,
                      name: selectedRegion
                    });
                  }
                  
                  // Adiciona destaque na nova região
                  chart.dispatchAction({
                    type: 'highlight',
                    seriesIndex: 0,
                    name: params.name
                  });
                  
                  selectedRegion = params.name;
                }

                // Enviar dados para o React Native
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'regionClick',
                    name: params.name,
                    value: params.value
                  }));
                }
              }
            });

            // Redimensionar quando a janela mudar de tamanho
            window.addEventListener('resize', function() {
              if (chart) {
                chart.resize();
              }
            });
            
          } catch (error) {
            console.error('Erro ao carregar o mapa:', error);
            
            const mainDiv = document.getElementById('main');
            if (mainDiv) {
              mainDiv.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-family:sans-serif;text-align:center;padding:20px;"><div><p>❌ Erro ao carregar o mapa</p><p style="font-size:12px;margin-top:10px;">Verifique sua conexão com a internet</p></div></div>';
            }
          }
        }

        // Prevenir zoom com gestos no mobile
        document.addEventListener('gesturestart', function(e) {
          e.preventDefault();
        });

        document.addEventListener('touchmove', function(e) {
          if (e.scale !== 1) {
            e.preventDefault();
          }
        }, { passive: false });

        // Inicializar quando o DOM estiver pronto
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default MapaParaiba;