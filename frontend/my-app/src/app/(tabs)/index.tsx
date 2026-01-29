import { View, ScrollView } from "react-native";
import { Card, Button, Text } from "react-native-paper";
import { Header } from "../../shared/components/header/Header";
import MapaParaiba from "../../shared/components/map/PbMap";
import Constants from 'expo-constants'
import { Tabs } from "expo-router";

const staturBarHeight = Constants.statusBarHeight;

export default function MapaScreen() {

  const cardsData = [
    { id: 1, valor: "578.540 KJ", descricao: "Potencial energético (Agreste)" },
    { id: 2, valor: "123.456 KJ", descricao: "Potencial energético (solar)" },
    { id: 3, valor: "234.567 KJ", descricao: "Potencial energético (eólico)" },
    { id: 4, valor: "345.678 KJ", descricao: "Potencial energético (hídrico)" },
    { id: 5, valor: "456.789 KJ", descricao: "Potencial energético (biomassa)" },
    { id: 6, valor: "567.890 KJ", descricao: "Potencial energético (outro)" },
  ];

  return (
    <View className="flex-1 bg-white">
      <ScrollView>
        <View className="p-4 pt-6" >
          <Card
            mode="elevated"
            theme={{ colors: { elevation: { level1: '#FFFFFF' } } }}
          >
            <Card.Content className="">
              <Text variant="titleLarge" className="mb-2">
                578.540 KJ
              </Text>
              <Text variant="bodyMedium">
                Potencial energético (total)
              </Text>
            </Card.Content>
          </Card>
        </View>
        <View style={{ height: 450 }}>
          <MapaParaiba />
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
         {cardsData.map((card) => (
          <View key={card.id} className="p-4 pt-2">
            <Card
              mode="elevated"
              theme={{ colors: { elevation: { level1: '#FFFFFF' } } }}
            >
              <Card.Content>
                <Text variant="titleLarge" className="mb-2">
                  {card.valor}
                </Text>
                <Text variant="bodyMedium">
                  {card.descricao}
                </Text>
              </Card.Content>
            </Card>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
