import React, { createContext, useContext, useEffect, useState } from "react";
// Importação do caminho correto (relativo)
import { supabase } from "../lib/supabase";
import { Session, User } from "@supabase/supabase-js";

// 1. Definição do Perfil
type Profile = {
  nome: string;
  tipo_usuario: "adm" | "cliente";
};

// 2. Definição dos Dados do Contexto
type AuthContextData = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
};

// 3. Criação do Contexto
const AuthContext = createContext<AuthContextData | null>(null);

// 4. O Provedor
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // 5. Função Robusta para buscar o perfil
  const fetchProfile = async (currentUser: User) => {
    try {
      // BACKEND MINDSET: Usamos .maybeSingle() em vez de .single()
      // Isso evita o erro PGRST116 quando o perfil ainda não existe (ex: no cadastro)
      const { data, error } = await supabase
        .from("profiles")
        .select("nome, tipo_usuario")
        .eq("id", currentUser.id)
        .maybeSingle(); // <--- A SOLUÇÃO ESTÁ AQUI

      if (error) {
        // Se for um erro real de conexão, mostramos no console
        console.error("Erro técnico ao buscar perfil:", error.message);
        return;
      }

      if (data) {
        // Cenário Ideal: O perfil existe
        setProfile(data as Profile);
      } else {
        // Cenário de Corrida: O usuário logou, mas o perfil ainda não foi gravado.
        // Não fazemos nada (ou definimos null), sem gerar erro para o usuário.
        setProfile(null);
      }
    } catch (error) {
      console.error("Exceção ao buscar perfil:", error);
    }
  };

  // 6. O "Ouvinte" de Autenticação
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setLoading(true);
        setSession(newSession);
        const newUser = newSession?.user ?? null;
        setUser(newUser);

        if (newUser) {
          await fetchProfile(newUser);
        } else {
          // Se deslogou, limpa tudo
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // 7. Fornecer os dados
  return (
    <AuthContext.Provider value={{ session, user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// 8. Hook Personalizado
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
