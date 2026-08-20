import "./../global.css";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import AppSplash from "../shared/components/AppSplash";
import {
  useFonts,
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import * as SplashScreen from "expo-splash-screen";

// Mantém a native splash visível enquanto as fontes carregam
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [splashVisible, setSplashVisible] = useState(true);
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      // Esconde a native splash assim que as fontes estiverem prontas
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Aguarda fontes antes de renderizar (a native splash cobre enquanto isso)
  if (!fontsLoaded) return null;

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
        <Stack.Screen
          name="cities"
          options={{
            headerShown: true,
            headerTitle: "Explorar Cidades",
            headerTitleAlign: "center",
            animation: "slide_from_right",
            headerTintColor: "#16A34A",
            headerStyle: { backgroundColor: "#FFFFFF" },
            headerTitleStyle: { fontWeight: "700", color: "#1E293B" },
          }}
        />
        <Stack.Screen
          name="mesoregion-analysis"
          options={{
            headerShown: true,
            headerTitle: "Análises por Mesorregião",
            headerTitleAlign: "center",
            animation: "slide_from_right",
            headerTintColor: "#16A34A",
            headerStyle: { backgroundColor: "#FFFFFF" },
            headerTitleStyle: { fontWeight: "700", color: "#1E293B" },
          }}
        />
      </Stack>

      {/* Overlay de splash in-app — renderizado por cima de tudo */}
      {splashVisible && <AppSplash onFinish={() => setSplashVisible(false)} />}
    </SafeAreaProvider>
  );
}