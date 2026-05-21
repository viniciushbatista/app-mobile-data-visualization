import "./../global.css";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="simulationoutput"
          options={{
            headerShown: true,
            headerTitle: "Resultado da Simulação",
            presentation: 'modal', // abre como modal com X no canto
            headerTitleAlign: 'center',
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}