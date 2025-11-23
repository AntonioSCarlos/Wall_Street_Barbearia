import React, { createContext, useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { supabase } from "../../src/lib/supabase";
import { Session, User } from "@supabase/supabase-js";

type Profile = {
  nome: string;
  tipo_usuario: "adm" | "cliente"; // Só pode ser um desses dois, onde terá a separação de usuários
};

// 2. Definir o que o Contexto vai guardar
type AuthContextData = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
};

// 3. Criação do Contexto
const AuthContext = createContext<AuthContextData | null>(null);

// 4. Criação do provedor
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // 5. Função para buscar o perfil (nome, tipo_usuario)
  const fetchProfile = async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
    }
  };

  // 6. O Coração: Roda quando o app abre e quando o usuário loga/desloga
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setLoading(true);
        setSession(newSession);
        const newUser = newSession?.user ?? null;
        setUser(newUser);

        // Se um usuário logou, busca o perfil dele
        if (newUser) {
          await fetchProfile(newUser);
        } else {
          // Se deslogou, limpa o perfil
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Limpa o "ouvinte" quando o componente é desmontado
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // 7. Fornece os dados (session, user, profile, loading) para o app
  return (
    <AuthContext.Provider value={{ session, user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// 8. O "Atalho" (Hook): Facilita para as telas pegarem os dados
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

// Componente principal para gerenciar horários
export const GerenciarHorarios: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Gerenciar horários</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    padding: 20,
  },
  header: {
    color: "#E0E0E0",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 10,
  },
});
