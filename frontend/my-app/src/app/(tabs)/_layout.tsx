import { Tabs } from "expo-router";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "#0077cc",
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
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
          title: "Simulation",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="show-chart" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
