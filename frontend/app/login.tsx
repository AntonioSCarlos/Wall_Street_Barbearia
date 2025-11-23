import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/src/lib/supabase";
// 1. Import de bliblioteca de ícones
import { Ionicons } from "@expo/vector-icons";

interface LoginForm {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

const { width: screenWidth } = Dimensions.get("window");

const Login: React.FC = () => {
  const router = useRouter();

  const [formData, setFormData] = useState<LoginForm>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.email) {
      newErrors.email = "Email é obrigatório";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }
    if (!formData.password) {
      newErrors.password = "Senha é obrigatória";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof LoginForm, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) throw error;
      router.replace("/home");
    } catch (error: any) {
      Alert.alert(
        "Erro no Login",
        error.message || "E-mail ou senha incorretos!"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push("/forgotPassword");
  };

  const handleSignUp = () => {
    router.push("/signUp");
  };

  const toggleRememberMe = () => {
    setRememberMe(!rememberMe);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.titlePurple}>BARBEARIA</Text>
      <Text style={styles.titleWhite}>WALL STREET</Text>
      <Text style={styles.subtitle}>Faça seu login para continuar</Text>
    </View>
  );

  const renderForm = () => (
    <View style={styles.form}>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          value={formData.email}
          onChangeText={(value) => handleInputChange("email", value)}
          placeholder="Digite seu e-mail"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Senha</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[
              styles.input,
              styles.passwordInput,
              errors.password && styles.inputError,
            ]}
            value={formData.password}
            onChangeText={(value) => handleInputChange("password", value)}
            placeholder="Digite sua senha"
            placeholderTextColor="#999"
            secureTextEntry={!isPasswordVisible}
            editable={!isLoading}
          />

          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            disabled={isLoading}
          >
            <Ionicons
              name={isPasswordVisible ? "eye-off" : "eye"}
              size={24}
              color="#E0E0E0"
            />
          </TouchableOpacity>
        </View>
        {errors.password && (
          <Text style={styles.errorText}>{errors.password}</Text>
        )}
      </View>

      {renderOptions()}
      {renderSubmitButton()}
    </View>
  );

  const renderOptions = () => (
    <View style={styles.options}>
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={toggleRememberMe}
        disabled={isLoading}
      >
        <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
          {rememberMe && <Text style={styles.checkboxIcon}>✓</Text>}
        </View>
        <Text style={styles.checkboxText}>Lembrar-me</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleForgotPassword} disabled={isLoading}>
        <Text style={styles.linkText}>Esqueci minha senha</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSubmitButton = () => (
    <TouchableOpacity
      style={[styles.button, isLoading && styles.buttonDisabled]}
      onPress={handleSubmit}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.buttonText}>Entrar</Text>
      )}
    </TouchableOpacity>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        Não tem uma conta?{" "}
        <Text style={styles.linkText} onPress={handleSignUp}>
          Cadastre-se
        </Text>
      </Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        {renderHeader()}
        {renderForm()}
        {renderFooter()}
      </View>
    </ScrollView>
  );
};

// --- ESTILOS ATUALIZADOS ---
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
    fontSize: 24,
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
  inputError: {
    borderColor: "#E74C3C",
  },
  errorText: {
    color: "#E74C3C",
    fontSize: 14,
    marginTop: 5,
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
    right: 0, // Alinhado à direita
    top: 0, // Alinhado ao topo
    height: "100%",
    width: 60, // Largura fixa para o ícone
    justifyContent: "center", // Centra o ícone verticalmente
    alignItems: "center", // Centra o ícone horizontalmente
  },

  options: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#333",
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
  },
  checkboxChecked: {
    backgroundColor: "#7A5FFF",
    borderColor: "#7A5FFF",
  },
  checkboxIcon: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  checkboxText: {
    fontSize: 14,
    color: "#E0E0E0",
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
});

export default Login;
