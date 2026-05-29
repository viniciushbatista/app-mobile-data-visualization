import { Tabs } from "expo-router";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSimulationHistory } from "../../shared/hooks/useSimulationHistory";

export default function TabsLayout() {
  const { history } = useSimulationHistory();
  const historyCount = history.length > 0 ? history.length : undefined;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "#2D6EFF",
        tabBarInactiveTintColor: "#9CA3AF",
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
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="map" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
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
            backgroundColor: "#2D6EFF",
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
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="info-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
