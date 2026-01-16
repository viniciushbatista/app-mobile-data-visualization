// MapaParaiba.tsx - COM HTML INLINE (SEM HOSPEDAR)
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

  // HTML completo inline
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mapa da Paraíba</title>
      <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
      <style>
        * { margin: 0; padding: 0; }
        html, body, #main { width: 100%; height: 100%; }
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

        async function init() {
          try {
            const res = await fetch(
              'https://servicodados.ibge.gov.br/api/v3/malhas/estados/25?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=mesorregiao'
            );
            const geoJSON = await res.json();

            geoJSON.features.forEach(feature => {
              const codigo = feature.properties.codarea;
              feature.properties.name = mapaCodigosNomes[codigo] || 'Região ' + codigo;
            });

            const chart = echarts.init(document.getElementById('main'));
            echarts.registerMap('PB', geoJSON);

            chart.setOption({
              tooltip: {
                trigger: 'item',
                formatter: '{b}: {c}'
              },
              visualMap: {
                min: 0,
                max: Math.max(...dadosRegioes.map(d => d.value)),
                text: ['Alto', 'Baixo'],
                inRange: { color: colorSchemes.blue },
                left: 20,
                bottom: 20
              },
              series: [{
                type: 'map',
                map: 'PB',
                roam: true,
                selectedMode: 'single',
                emphasis: { 
                  focus: 'self',
                  itemStyle: { areaColor: '#ffd54f' }
                },
                select: { 
                  itemStyle: { areaColor: '#1976d2' }
                },
                data: dadosRegioes
              }]
            });

            chart.on('click', params => {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'regionClick',
                  name: params.name,
                  value: params.value
                }));
              }
            });

            window.addEventListener('resize', () => chart.resize());
            
          } catch (error) {
            console.error('Erro:', error);
          }
        }

        init();
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