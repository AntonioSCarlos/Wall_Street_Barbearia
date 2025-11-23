import React, { useState } from "react";
import {
  View,
  TextInput,
  Alert,
  StyleSheet,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/src/lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      Alert.alert("Erro", "Por favor, digite seu e-mail.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        throw error;
      }
      Alert.alert(
        "Sucesso!",
        "Enviamos um link de redefinição para o seu e-mail. Verifique sua caixa de entrada."
      );
      router.push("/login");
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error.message || "Não foi possível enviar o e-mail de redefinição."
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Funções de Renderização (para bater com o login.tsx) ---
  const renderHeader = () => (
    <View style={styles.header}>
      {/* Título no estilo "Wall Street" */}
      <Text style={styles.titleWhite}>Recuperar Senha</Text>
      <Text style={styles.subtitle}>
        Digite seu e-mail para enviarmos um link.
      </Text>
    </View>
  );

  const renderForm = () => (
    <View style={styles.form}>
      {/* Campo Email */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input} // Estilo atualizado
          placeholder="Seu e-mail cadastrado"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#999" // Cor atualizada
          editable={!loading}
        />
      </View>

      {/* Botão de Enviar */}
      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]} // Estilo atualizado
        onPress={handlePasswordReset}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Enviar Link</Text>
        )}
      </Pressable>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        Lembrou a senha?{" "}
        <Text
          style={styles.linkText} // Estilo atualizado
          onPress={() => router.push("/login")}
          disabled={loading}
        >
          Faça login
        </Text>
      </Text>
    </View>
  );

  return (
    // Estrutura de layout idêntica ao login.tsx
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        {renderHeader()}
        {renderForm()}
        {renderFooter()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: "#1A1A1A", // Preto/Cinza Grafite (do cartão)
    padding: 20,
  },
  card: {
    backgroundColor: "#252525", // Fundo do item (mais claro)
    padding: 30,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  // ESTILOS DO TÍTULO (baseado no logo)
  titlePurple: {
    color: "#7A5FFF", // O Roxo do seu logo
    fontSize: 32, // Tamanho grande
    fontWeight: "900", // Super "pesado"
    textTransform: "uppercase", // Maiúsculas
  },
  titleWhite: {
    color: "#E0E0E0", // Texto claro
    fontSize: 30,
    fontWeight: "bold",
    letterSpacing: 2, // Espaçado (como no "WALL STREET")
    textTransform: "uppercase", // Maiúsculas
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    color: "#A0A0A0", // Texto secundário
    fontSize: 16,
    marginBottom: 20, // Espaço antes do formulário
    textAlign: "center", // Adicionado
  },
  form: {
    gap: 20,
  },
  formGroup: {
    gap: 5,
  },
  label: {
    color: "#E0E0E0", // Texto claro
    fontWeight: "500",
    fontSize: 14,
  },
  input: {
    borderWidth: 2,
    borderColor: "#333", // Borda escura
    borderRadius: 5,
    padding: 12,
    fontSize: 16,
    color: "#E0E0E0", // Texto claro
    backgroundColor: "#1A1A1A", // Fundo escuro
    height: 48,
  },
  linkText: {
    color: "#7A5FFF", // Roxo (Cor da Marca)
    fontSize: 14,
    textDecorationLine: "underline",
  },
  button: {
    backgroundColor: "#7A5FFF", // Roxo (Cor da Marca)
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    marginTop: 10, // Adiciona espaço acima do botão
  },
  buttonDisabled: {
    backgroundColor: "#333", // Cinza escuro
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#333", // Borda escura
  },
  footerText: {
    color: "#A0A0A0", // Texto secundário
    fontSize: 14,
  },
});
