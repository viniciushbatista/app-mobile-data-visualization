import { Tabs, useRouter } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSimulationHistory } from "../../shared/hooks/useSimulationHistory";

function InfoButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push("/(tabs)/sobre")}
      activeOpacity={0.7}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        marginRight: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <MaterialIcons name="info-outline" size={22} color="#16A34A" />
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  const { history } = useSimulationHistory();
  const historyCount = history.length > 0 ? history.length : undefined;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#16A34A",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarStyle: {
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: "#F1F5F9",
          backgroundColor: "#FFFFFF",
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        animation: "fade",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Mapa",
          headerShown: true,
          headerTitleAlign: "center",
          headerTitleStyle: { fontWeight: "700", color: "#1E293B", fontSize: 17 },
          headerStyle: { backgroundColor: "#F8FAFC" },
          headerShadowVisible: false,
          headerRight: () => <InfoButton />,
          headerLeft: () => <View style={{ width: 36, marginLeft: 16 }} />,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="map" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          headerShown: true,
          headerTitleAlign: "center",
          headerTitleStyle: { fontWeight: "700", color: "#1E293B", fontSize: 17 },
          headerStyle: { backgroundColor: "#F8FAFC" },
          headerShadowVisible: false,
          headerRight: () => <InfoButton />,
          headerLeft: () => <View style={{ width: 36, marginLeft: 16 }} />,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-bar" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="simulation"
        options={{
          title: "Simulação",
          tabBarBadge: historyCount,
          tabBarBadgeStyle: {
            backgroundColor: "#16A34A",
            fontSize: 10,
            minWidth: 18,
            height: 18,
          },
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="show-chart" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="sobre"
        options={{
          title: "Sobre",
          headerShown: true,
          headerTitleAlign: "center",
          headerTitleStyle: { fontWeight: "700", color: "#1E293B", fontSize: 17 },
          headerStyle: { backgroundColor: "#F8FAFC" },
          headerShadowVisible: false,
          headerLeft: () => <View style={{ width: 36, marginLeft: 16 }} />,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="info-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
