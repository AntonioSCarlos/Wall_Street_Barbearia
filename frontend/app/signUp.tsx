import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/src/lib/supabase";
import { Ionicons } from "@expo/vector-icons";

export default function SignUp() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const router = useRouter();

  async function handleSignUp() {
    if (!nome.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        Alert.alert(
          "Verifique seu E-mail",
          "Enviamos um link de confirmação para seu e-mail. Por favor, confirme para continuar."
        );
        router.push("/login");
        return;
      }

      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id, // O ID que o Auth acabou de criar
        nome: nome,
        tipo_usuario: "cliente", // Padrão para novos cadastros
      });

      if (profileError) {
        throw profileError; // Joga o erro para o catch
      }

      // Se tudo deu certo
      Alert.alert("Sucesso!", "Conta criada com sucesso.");
      router.push("/login"); // Navega para o login
    } catch (error: any) {
      // Pega qualquer erro (do Auth ou do Profiles)
      Alert.alert(
        "Erro no Cadastro",
        error.message || "Não foi possível criar a conta."
      );
    } finally {
      // Independentemente de sucesso ou falha, para o loading
      setLoading(false);
    }
  }

  // --- Funções de Renderização (para bater com o login.tsx) ---
  const renderHeader = () => (
    <View style={styles.header}>
      {/* Título idêntico ao do login para consistência */}
      <Text style={styles.titleWhite}>Crie sua Conta</Text>
      {/* Subtítulo específico desta tela */}
      <Text style={styles.subtitle}>Para acessar nossos serviços</Text>
    </View>
  );

  const renderForm = () => (
    <View style={styles.form}>
      {/* Campo Nome Completo */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Nome Completo</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu nome completo"
          value={nome}
          onChangeText={setNome}
          placeholderTextColor="#999"
          editable={!loading}
        />
      </View>

      {/* Campo Email */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu e-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#999"
          editable={!loading}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Senha</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!isPasswordVisible}
            placeholderTextColor="#999"
            editable={!loading}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            disabled={loading}
          >
            <Ionicons
              name={isPasswordVisible ? "eye-off" : "eye"}
              size={24}
              color="#E0E0E0"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Botão de Criar Conta */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Criar Conta</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        Já tem uma conta?{" "}
        <Text
          style={styles.linkText}
          onPress={() => router.push("/login")}
          disabled={loading}
        >
          Faça login
        </Text>
      </Text>
    </View>
  );
  // --- Fim das Funções de Renderização ---

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
    backgroundColor: "#1A1A1A",
    padding: 20,
  },
  card: {
    backgroundColor: "#252525",
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
  titlePurple: {
    color: "#7A5FFF",
    fontSize: 32,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  titleWhite: {
    color: "#E0E0E0",
    fontSize: 30,
    fontWeight: "bold",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  subtitle: {
    color: "#A0A0A0",
    fontSize: 16,
    marginBottom: 20,
  },
  form: {
    gap: 20,
  },
  formGroup: {
    gap: 5,
  },
  label: {
    color: "#E0E0E0",
    fontWeight: "500",
    fontSize: 14,
  },
  input: {
    borderWidth: 2,
    borderColor: "#333",
    borderRadius: 5,
    padding: 12,
    fontSize: 16,
    color: "#E0E0E0",
    backgroundColor: "#1A1A1A",
    height: 48,
  },
  linkText: {
    color: "#7A5FFF",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  button: {
    backgroundColor: "#7A5FFF",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#333",
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
    borderTopColor: "#333",
  },
  footerText: {
    color: "#A0A0A0",
    fontSize: 14,
  },
  passwordContainer: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 60,
  },
  eyeButton: {
    position: "absolute",
    right: 0,
    top: 0,
    height: "100%",
    width: 60,
    justifyContent: "center",
    alignItems: "center",
  },
});
