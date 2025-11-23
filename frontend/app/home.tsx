import { supabase } from "@/src/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../src/context/AuthContext";

// --- Tipos de Dados ---
type Servico = {
  id: number;
  nome: string;
  descricao?: string | null;
  preco: number;
  duracao_minutos?: number | null;
};

type AgendamentoAdmin = {
  id: number;
  data_hora_inicio: string;
  status: string;
  profiles: {
    nome: string | null;
  } | null;
  servicos: {
    nome: string | null;
    preco: number;
  } | null;
};

// Type para o agendament do cliente
type MeuAgendamento = {
  id: number;
  data_hora_inicio: string;
  status: string;
  servicos: {
    nome: string;
  };
};

const ClienteHome: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loadingServicos, setLoadingServicos] = useState(true);
  const [meusAgendamentos, setMeusAgendamentos] = useState<MeuAgendamento[]>(
    []
  );
  const [loadingAgendamentos, setLoadingAgendamentos] = useState(true);

  const fetchServicos = async () => {
    try {
      const { data, error } = await supabase
        .from("servicos")
        .select("id, nome, preco")
        .order("id", { ascending: true });

      if (error) throw error;
      if (data) setServicos(data);
    } catch (error: any) {
      console.error("Erro ao buscar serviços:", error.message);
    } finally {
      setLoadingServicos(false);
    }
  };

  const fetchMeusAgendamentos = async () => {
    if (!user) return;

    setLoadingAgendamentos(true);
    try {
      const { data, error } = await supabase
        .from("agendamentos")
        .select(
          `
          id,
          data_hora_inicio,
          status,
          servicos ( nome )
        `
        )
        .eq("cliente_id", user.id)
        .order("data_hora_inicio", { ascending: true });

      if (error) throw error;
      if (data) {
        console.log("Agendamentos do cliente:", data);
        setMeusAgendamentos(data as unknown as MeuAgendamento[]);
      }
    } catch (error: any) {
      console.error("Erro ao buscar agendamentos:", error.message);
    } finally {
      setLoadingAgendamentos(false);
    }
  };

  useEffect(() => {
    fetchServicos();
    fetchMeusAgendamentos();
  }, [user]);

  // Função de verificação das 24h entes de possíveis alterações
  const podeEditarOuCancelar = (
    dataHoraAgendamento: string,
    status: string
  ) => {
    if (status === "concluido") {
      return false;
    }

    const agora = new Date();
    const dataAgendamento = new Date(dataHoraAgendamento);
    const diferencaMs = dataAgendamento.getTime() - agora.getTime();
    const diferencaHoras = diferencaMs / (1000 * 60 * 60);

    // Permite editar/cancelar apenas se faltar mais de 24 horas
    return diferencaHoras > 24;
  };

  // Função para editar o agendamento
  const handleEditarAgendamento = (agendamento: MeuAgendamento) => {
    if (
      !podeEditarOuCancelar(agendamento.data_hora_inicio, agendamento.status)
    ) {
      Alert.alert(
        "Edição não permitida",
        agendamento.status === "concluido"
          ? "Este serviço já foi concluído e não pode ser editado."
          : "Sinto muito! O cancelamento ou reagendamento só pode ser feito em torno de 24 horas antes do horário agendado. Caso",
        [{ text: "Entendi" }]
      );
      return;
    }

    router.push(`/reagendar?agendamentoId=${agendamento.id}`);
  };

  // Função de cancelamento
  const handleCancelarAgendamento = (agendamento: MeuAgendamento) => {
    if (
      !podeEditarOuCancelar(agendamento.data_hora_inicio, agendamento.status)
    ) {
      Alert.alert(
        "Cancelamento não permitido",
        agendamento.status === "concluido"
          ? "Este serviço já foi concluído e não pode ser cancelado."
          : "Sinto muito! O cancelamento ou reagendamento só pode ser feito em torno de 24 horas antes do horário agendado. Caso preciso cancelar ou reagendar emtre em contato com o seu barbeiro",
        [{ text: "Entendi" }]
      );
      return;
    }

    Alert.alert(
      "Cancelar Agendamento",
      `Tem certeza que deseja cancelar o agendamento de ${agendamento.servicos.nome}?`,
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim, Cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("agendamentos")
                .delete()
                .eq("id", agendamento.id);

              if (error) throw error;

              setMeusAgendamentos((listaAtual) =>
                listaAtual.filter((ag) => ag.id !== agendamento.id)
              );
              Alert.alert("Sucesso", "Agendamento cancelado.");
            } catch (error: any) {
              Alert.alert("Erro ao Cancelar", error.message);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Servico }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemNome}>{item.nome}</Text>
      </View>
      <View style={styles.itemValoresContainer}>
        <Text style={styles.itemPreco}>
          {Number(item.preco).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </Text>
      </View>
    </View>
  );

  const formatDateTime = (dateTimeString: string) => {
    const data = new Date(dateTimeString);
    return data.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmado":
        return "#4CAF50";
      case "pendente":
        return "#FF9800";
      case "concluido":
        return "#4CAF50";
      case "cancelado":
        return "#F44336";
      default:
        return "#A0A0A0";
    }
  };

  return (
    <FlatList
      data={servicos}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      style={styles.list}
      ListHeaderComponent={() => (
        <>
          {/* SEÇÃO DE BOAS-VINDAS E APRESENTAÇÃO */}
          <View style={styles.welcomeContainer}>
            <ImageBackground
              source={{
                uri: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80",
              }}
              style={styles.backgroundImage}
              imageStyle={styles.backgroundImageStyle}
            >
              <View style={styles.overlay}>
                <Text style={styles.welcomeTitle}>Barbearia Wall Street</Text>
                <Text style={styles.welcomeText}>
                  Agende Seu Corte. Autoestima Garantida.
                </Text>

                <View style={styles.featuresContainer}>
                  <View style={styles.featureItem}>
                    <Ionicons name="time-outline" size={20} color="#7A5FFF" />
                    <Text style={styles.featureText}>Agendamento Rápido</Text>
                  </View>

                  <View style={styles.featureItem}>
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color="#7A5FFF"
                    />
                    <Text style={styles.featureText}>
                      Localização Privilegiada
                    </Text>
                  </View>
                </View>
              </View>
            </ImageBackground>
          </View>

          {/* BOTÃO DE AGENDAMENTO */}
          <View style={styles.ctaContainer}>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push("/agendar")}
            >
              <Ionicons name="calendar-outline" size={24} color="white" />
              <Text style={styles.ctaButtonText}>Agendar um Horário</Text>
            </TouchableOpacity>
          </View>

          {/* SEÇÃO: MEUS AGENDAMENTOS */}
          <View style={styles.meusAgendamentosContainer}>
            <Text style={styles.meusAgendamentosTitle}>Meus Agendamentos</Text>

            {loadingAgendamentos ? (
              <ActivityIndicator
                size="small"
                color="#7A5FFF"
                style={styles.loadingAgendamentos}
              />
            ) : meusAgendamentos.length === 0 ? (
              <Text style={styles.emptyAgendamentosText}>
                Você ainda não possui agendamentos.
              </Text>
            ) : (
              <View style={styles.agendamentosList}>
                {meusAgendamentos.map((agendamento) => (
                  <View
                    key={agendamento.id}
                    style={[
                      styles.agendamentoItem,
                      agendamento.status === "concluido" &&
                        styles.concluidoContainer,
                    ]}
                  >
                    <View style={styles.agendamentoInfo}>
                      <Text style={styles.agendamentoServico}>
                        {agendamento.servicos.nome}
                      </Text>
                      <Text style={styles.agendamentoData}>
                        {formatDateTime(agendamento.data_hora_inicio)}
                      </Text>
                    </View>
                    <View style={styles.agendamentoActions}>
                      <View style={styles.agendamentoStatusContainer}>
                        <Text
                          style={[
                            styles.agendamentoStatus,
                            { color: getStatusColor(agendamento.status) },
                            agendamento.status === "concluido" &&
                              styles.statusConcluido,
                          ]}
                        >
                          {agendamento.status.charAt(0).toUpperCase() +
                            agendamento.status.slice(1)}
                        </Text>
                      </View>

                      {/* BOTÕES APENAS SE NÃO ESTIVER CONCLUÍDO */}
                      {agendamento.status !== "concluido" && (
                        <View style={styles.agendamentoButtons}>
                          <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => handleEditarAgendamento(agendamento)}
                          >
                            <Ionicons
                              name="create-outline"
                              size={18}
                              color="#7A5FFF"
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() =>
                              handleCancelarAgendamento(agendamento)
                            }
                          >
                            <Ionicons
                              name="trash-outline"
                              size={18}
                              color="#E74C3C"
                            />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* SEÇÃO DE SERVIÇOS */}
          <View style={styles.servicesHeader}>
            <Text style={styles.listTitle}>Nossos Serviços</Text>
            <Text style={styles.servicesSubtitle}>
              Confira nossa tabela de preços e escolha o serviço ideal para
              você.
            </Text>
          </View>
        </>
      )}
      ListEmptyComponent={() => (
        <Text style={styles.emptyText}>Nenhum serviço cadastrado.</Text>
      )}
      ListFooterComponent={() => (
        <View style={styles.footerContainer}>
          <Text style={styles.footerTitle}>Horário de Funcionamento</Text>
          <Text style={styles.footerText}>Segunda a Sexta: 08:00 - 19:00</Text>
          <Text style={styles.footerText}>Sábado: 09:00 - 20:00</Text>
          <Text style={styles.footerText}>Domingo: Fechado</Text>

          <View style={styles.contactInfo}>
            <Text style={styles.footerTitles}>Contato</Text>
            <View style={styles.contactItem}>
              <Ionicons name="logo-whatsapp" size={20} color="#7A5FFF" />
              <Text style={styles.footerText}>(19) 992472138</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="logo-instagram" size={20} color="#7A5FFF" />
              <Text style={styles.footerText}>barbeariawallstreet_</Text>
            </View>
          </View>
        </View>
      )}
    />
  );
};

const AdminHome: React.FC = () => {
  const router = useRouter();
  const [agendamentos, setAgendamentos] = useState<AgendamentoAdmin[]>([]);
  const [loadingAgendamentos, setLoadingAgendamentos] = useState(true);

  const fetchAgendamentosHoje = async () => {
    setLoadingAgendamentos(true);
    try {
      const hoje = new Date();
      const inicioDoDia = new Date(hoje.setHours(0, 0, 0, 0)).toISOString();
      const fimDoDia = new Date(hoje.setHours(23, 59, 59, 999)).toISOString();

      console.log("Buscando agendamentos de:", inicioDoDia, "até", fimDoDia);

      const { data, error } = await supabase
        .from("agendamentos")
        .select(
          `
          id,
          data_hora_inicio,
          status,
          profiles ( nome ), 
          servicos ( nome, preco )
        `
        )
        .gte("data_hora_inicio", inicioDoDia)
        .lte("data_hora_inicio", fimDoDia)
        .order("data_hora_inicio", { ascending: true });

      if (error) throw error;
      if (data) {
        console.log("Agendamentos encontrados:", data);
        setAgendamentos(data as unknown as AgendamentoAdmin[]);
      } else {
        console.log("Nenhum agendamento encontrado");
      }
    } catch (error: any) {
      console.error("Erro ao buscar agendamentos:", error.message);
    } finally {
      setLoadingAgendamentos(false);
    }
  };

  useEffect(() => {
    fetchAgendamentosHoje();
  }, []);

  const handleCancelamento = (agendamento: AgendamentoAdmin) => {
    // BLOQUEAR CANCELAMENTO SE JÁ ESTIVER CONCLUÍDO
    if (agendamento.status === "concluido") {
      Alert.alert(
        "Ação não permitida",
        "Este serviço já foi concluído e não pode ser cancelado."
      );
      return;
    }

    Alert.alert(
      "Cancelar Agendamento",
      `Tem certeza que deseja cancelar o agendamento de ${
        agendamento.profiles?.nome ?? "Cliente"
      } às ${formatTime(agendamento.data_hora_inicio)}?`,
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim, Cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("agendamentos")
                .delete()
                .eq("id", agendamento.id);

              if (error) throw error;

              setAgendamentos((listaAtual) =>
                listaAtual.filter((ag) => ag.id !== agendamento.id)
              );
              Alert.alert("Sucesso", "Agendamento cancelado.");
            } catch (error: any) {
              Alert.alert("Erro ao Cancelar", error.message);
            }
          },
        },
      ]
    );
  };

  const handleConclusao = async (agendamento: AgendamentoAdmin) => {
    if (agendamento.status === "concluido") {
      Alert.alert("Ação não permitida", "Este serviço já foi concluído.");
      return;
    }

    Alert.alert(
      "Concluir Serviço",
      `Deseja marcar o serviço de ${
        agendamento.profiles?.nome ?? "Cliente"
      } como concluído?`,
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim, Concluir",
          style: "default",
          onPress: async () => {
            try {
              console.log(
                "Atualizando agendamento:",
                agendamento.id,
                "para status: concluido"
              );

              const { error } = await supabase
                .from("agendamentos")
                .update({ status: "concluido" })
                .eq("id", agendamento.id);

              if (error) {
                console.error("Erro ao atualizar:", error);
                throw error;
              }

              console.log("Agendamento atualizado com sucesso");

              // Atualizar a lista local
              setAgendamentos((listaAtual) =>
                listaAtual.map((ag) =>
                  ag.id === agendamento.id ? { ...ag, status: "concluido" } : ag
                )
              );

              Alert.alert("Sucesso", "Serviço marcado como concluído!");

              // Recarregar os dados para garantir sincronização
              setTimeout(() => {
                fetchAgendamentosHoje();
              }, 500);
            } catch (error: any) {
              console.error("Erro completo:", error);
              Alert.alert("Erro ao Concluir", error.message);
            }
          },
        },
      ]
    );
  };

  const formatTime = (dateTimeString: string) => {
    const data = new Date(dateTimeString);
    return data.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <ScrollView style={styles.adminContainer}>
      <Text style={styles.listTitleadm}>Agendamentos de Hoje</Text>

      {loadingAgendamentos ? (
        <ActivityIndicator size="large" color="#7A5FFF" />
      ) : (
        <View>
          {agendamentos.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum agendamento para hoje.</Text>
          ) : (
            agendamentos.map((ag) => (
              <View
                key={ag.id}
                style={[
                  styles.itemContainer,
                  ag.status === "concluido" && styles.concluidoContainer,
                ]}
              >
                <View style={styles.itemTextContainer}>
                  <Text
                    style={[
                      styles.itemNome,
                      ag.status === "concluido" && styles.textoConcluido,
                    ]}
                  >
                    {formatTime(ag.data_hora_inicio)} -{" "}
                    {ag.servicos?.nome ?? "Serviço Removido"}
                  </Text>
                  <Text
                    style={[
                      styles.itemDescricao,
                      ag.status === "concluido" && styles.textoConcluido,
                    ]}
                  >
                    Cliente: {ag.profiles?.nome ?? "Cliente Removido"}
                  </Text>
                  {/* NOVO: PREÇO DO SERVIÇO */}
                  <Text
                    style={[
                      styles.itemPreco,
                      ag.status === "concluido" && styles.textoConcluido,
                    ]}
                  >
                    {ag.servicos?.preco
                      ? Number(ag.servicos.preco).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })
                      : "Preço não disponível"}
                  </Text>
                </View>

                <View style={styles.adminItemActions}>
                  <Text
                    style={[
                      styles.itemStatus,
                      ag.status === "concluido" && styles.statusConcluido,
                    ]}
                  >
                    {ag.status.toUpperCase()}
                  </Text>

                  {/* BOTÕES APENAS SE NÃO ESTIVER CONCLUÍDO */}
                  {ag.status !== "concluido" && (
                    <View style={styles.buttonsColumn}>
                      <TouchableOpacity
                        style={styles.completeButton}
                        onPress={() => handleConclusao(ag)}
                      >
                        <Ionicons
                          name="checkmark-outline"
                          size={24}
                          color="#4D8AFF"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleCancelamento(ag)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={24}
                          color="#E74C3C"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      )}

      <View style={styles.adminCtaContainer}>
        <TouchableOpacity
          style={styles.adminCtaButton}
          onPress={() => router.push("/adm/gerenciar-horarios")}
        >
          <Text style={styles.adminCtaText}>Gerenciar Horários</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.adminCtaButton}
          onPress={() => router.push("/adm/graficos")}
        >
          <Text style={styles.adminCtaText}>Ver Graficos</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const Home: React.FC = () => {
  const { profile, loading, user } = useAuth();
  const [loadingLogout, setLoadingLogout] = useState(false);

  const onLogout = async () => {
    setLoadingLogout(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      Alert.alert("Erro ao Sair", error.message);
    } finally {
      setLoadingLogout(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#7A5FFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>
            Bem-vindo(a), {profile?.nome ?? user?.email}!
          </Text>
        </View>
        {loadingLogout ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Sair</Text>
          </TouchableOpacity>
        )}
      </View>

      {profile?.tipo_usuario === "adm" ? <AdminHome /> : <ClienteHome />}
    </SafeAreaView>
  );
};
// Estilo msclado para ambos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E0E0E0",
    marginTop: 35,
  },
  subtitle: {
    fontSize: 14,
    color: "#A0A0A0",
  },
  logoutButton: {
    backgroundColor: "#333",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    marginTop: 30,
  },
  logoutButtonText: {
    color: "#E74C3C",
    fontSize: 14,
    fontWeight: "bold",
  },

  // --- Estilos do CLIENTE ---
  welcomeContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  backgroundImage: {
    width: "100%",
    height: 250,
    justifyContent: "center",
  },
  backgroundImageStyle: {
    opacity: 0.3,
    borderRadius: 0,
  },
  overlay: {
    backgroundColor: "rgba(26, 26, 26, 0.7)",
    padding: 20,
    height: "100%",
    justifyContent: "center",
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#7A5FFF",
    marginBottom: 20,
    textAlign: "center",
  },
  welcomeText: {
    fontSize: 18,
    color: "#E0E0E0",
    lineHeight: 22,
    marginBottom: 20,
  },
  featuresContainer: {
    gap: 12,
    marginTop: 10,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: "#A0A0A0",
  },
  servicesHeader: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  servicesSubtitle: {
    fontSize: 14,
    color: "#A0A0A0",
    marginTop: 5,
  },
  ctaContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  ctaButton: {
    backgroundColor: "#7A5FFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  ctaButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  // ESTILOS PARA "MEUS AGENDAMENTOS"
  meusAgendamentosContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  meusAgendamentosTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#E0E0E0",
    marginBottom: 15,
  },
  loadingAgendamentos: {
    marginVertical: 10,
  },
  emptyAgendamentosText: {
    color: "#A0A0A0",
    textAlign: "center",
    fontStyle: "italic",
  },
  agendamentosList: {
    gap: 10,
  },
  agendamentoItem: {
    backgroundColor: "#252525",
    padding: 15,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  agendamentoInfo: {
    flex: 1,
  },
  agendamentoServico: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  agendamentoData: {
    fontSize: 14,
    color: "#A0A0A0",
  },
  agendamentoActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 0.4,
  },
  agendamentoStatusContainer: {
    marginLeft: 10,
  },
  agendamentoStatus: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  agendamentoButtons: {
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
  },
  editButton: {
    padding: 6,
    borderRadius: 4,
  },
  cancelButton: {
    padding: 6,
    borderRadius: 4,
  },

  listTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#E0E0E0",
    padding: 20,
    paddingBottom: 10,
    textAlign: "center",
  },

  listTitleadm: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#E0E0E0",
    padding: 20,
    paddingBottom: 10,
    textAlign: "center",
  },
  list: {
    flex: 1,
  },
  emptyText: {
    color: "#A0A0A0",
    textAlign: "center",
    padding: 20,
    fontSize: 16,
  },
  footerContainer: {
    padding: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#333",
    gap: 15,
    marginBottom: 30,
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#7A5FFF",
    marginTop: 10,
  },

  footerTitles: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#7A5FFF",
    marginTop: 10,
    marginBottom: 20,
  },

  footerText: {
    fontSize: 14,
    color: "#A0A0A0",
  },
  contactInfo: {
    marginTop: 10,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },

  // Estilo de Item (usado por Cliente e ADM)
  itemContainer: {
    backgroundColor: "#252525",
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  itemTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  itemNome: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  itemDescricao: {
    fontSize: 14,
    color: "#A0A0A0",
    marginTop: 4,
  },
  itemValoresContainer: {
    alignItems: "flex-end",
    marginLeft: 10,
  },
  itemPreco: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#7A5FFF",
  },
  itemDuracao: {
    fontSize: 14,
    color: "#A0A0A0",
    marginTop: 4,
    minHeight: 16,
  },

  // --- Estilos do ADM ---
  adminContainer: {
    flex: 1,
  },
  adminItemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  buttonsColumn: {
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
  },
  itemStatus: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#E0E0E0",
  },
  completeButton: {},
  deleteButton: {},
  adminCtaContainer: {
    padding: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#333",
    gap: 10,
    marginBottom: 28,
  },
  adminCtaButton: {
    backgroundColor: "#7A5FFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  adminCtaText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  // --- NOVOS ESTILOS ADICIONADOS ---
  concluidoContainer: {
    backgroundColor: "#252525",
    borderColor: "#4D8AFF",
    opacity: 0.8,
  },
  statusConcluido: {
    color: "#4D8AFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  textoConcluido: {
    color: "#A0A0A0",
  },
});

export default Home;
