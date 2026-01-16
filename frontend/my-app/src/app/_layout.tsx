
import "./../global.css"

import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Header } from "../shared/components/header/Header";
import { white } from "react-native-paper/lib/typescript/styles/themes/v2/colors";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false}} />
    </SafeAreaProvider>
  );
}
