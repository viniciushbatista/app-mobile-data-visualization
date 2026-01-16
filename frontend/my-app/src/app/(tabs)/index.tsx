import { View, Text } from "react-native";
import { Card } from "react-native-paper";
import {Header} from "../../shared/components/header/Header";
import MapaParaiba from "../../shared/components/map/PbMap";
import Constants from 'expo-constants'
import { Tabs } from "expo-router";

const staturBarHeight = Constants.statusBarHeight;

export default function MapaScreen() {
  return (
    <View className="flex-1 bg-white">

      <View className="p-4 pt-6" >
          <View style={{ height: 450 }}>
            <MapaParaiba />
          </View>
      </View>
    </View>
  );
}
