import "./../global.css";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useState } from "react";
import AppSplash from "../shared/components/AppSplash";

export default function RootLayout() {
  const [splashVisible, setSplashVisible] = useState(true);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="simulationoutput"
          options={{
            headerShown: true,
            headerTitle: "Resultado da Simulação",
            presentation: "modal",
            headerTitleAlign: "center",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="simulation-history"
          options={{
            headerShown: true,
            headerTitle: "Histórico",
            headerTitleAlign: "center",
            animation: "slide_from_right",
          }}
        />
      </Stack>

      {/* Overlay de splash in-app — renderizado por cima de tudo */}
      {splashVisible && <AppSplash onFinish={() => setSplashVisible(false)} />}
    </SafeAreaProvider>
  );
}