import React, { useEffect } from "react";
import { Stack, useRouter, SplashScreen } from "expo-router";

import { AuthProvider, useAuth } from "../src/context/AuthContext";

SplashScreen.preventAutoHideAsync();

function RootNavigation() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }

    SplashScreen.hideAsync();

    if (!user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: "slide_from_right",

        contentStyle: { backgroundColor: "#1A1A1A" },

        headerStyle: { backgroundColor: "#7A5FFF" },

        headerTintColor: "#fff",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signUp" options={{ title: "Criar Conta" }} />
      <Stack.Screen
        name="forgotPassword"
        options={{ title: "Recuperar Senha" }}
      />

      <Stack.Screen name="home" options={{ headerShown: false }} />

      <Stack.Screen
        name="agendar"
        options={{ title: "Escolher Data e Hora" }}
      />
      <Stack.Screen
        name="escolher-servico"
        options={{ title: "Escolher Serviço" }}
      />
      <Stack.Screen
        name="adm/gerenciar-horarios"
        options={{ title: "Gerenciar Horários" }}
      />
      <Stack.Screen name="adm/graficos" options={{ title: "Gráficos" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}
