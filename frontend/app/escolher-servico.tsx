import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "@/src/lib/supabase";

type Servico = {
  id: number;
  nome: string;
  descricao: string | null;
  preco: number;
  duracao_minutos: number | null;
};

const EscolherServico: React.FC = () => {
  const router = useRouter();
  const {
    data: dataParam,
    hora: horaParam,
    agendamentoId,
  } = useLocalSearchParams<{
    data: string;
    hora: string;
    agendamentoId?: string;
  }>();

  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loadingServicos, setLoadingServicos] = useState(true);
  const [loadingConfirmar, setLoadingConfirmar] = useState<number | null>(null);

  const fetchServicos = async () => {
    try {
      const { data, error } = await supabase
        .from("servicos")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;
      if (data) setServicos(data);
    } catch (error: any) {
      Alert.alert("Erro ao buscar serviços", error.message);
    } finally {
      setLoadingServicos(false);
    }
  };

  useEffect(() => {
    fetchServicos();
  }, []);

  const handleConfirmAgendamento = async (servico: Servico) => {
    setLoadingConfirmar(servico.id);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");
      if (!dataParam || !horaParam)
        throw new Error("Data ou hora não fornecida.");

      const dataHoraISO = `${dataParam}T${horaParam}:00`;
      const dataHoraUTC = new Date(dataHoraISO).toISOString();

      const duracao = servico.duracao_minutos || 30;
      const dataFim = new Date(
        new Date(dataHoraISO).getTime() + duracao * 60000
      );
      const dataHoraFimUTC = dataFim.toISOString();

      if (agendamentoId) {
        const { error } = await supabase
          .from("agendamentos")
          .update({
            servico_id: servico.id,
            data_hora_inicio: dataHoraUTC,
            data_hora_fim: dataHoraFimUTC,
            status: "agendado",
          })
          .eq("id", agendamentoId)
          .eq("cliente_id", user.id);

        if (error) throw error;

        Alert.alert(
          "Reagendamento Confirmado!",
          `Serviço: ${servico.nome}\nNova data: ${dataParam} às ${horaParam}\n\nReagendamento realizado com sucesso!`,
          [{ text: "OK", onPress: () => router.replace("/home") }]
        );
      } else {
        const novoAgendamento = {
          cliente_id: user.id,
          servico_id: servico.id,
          data_hora_inicio: dataHoraUTC,
          data_hora_fim: dataHoraFimUTC,
          status: "agendado",
        };

        const { error } = await supabase
          .from("agendamentos")
          .insert(novoAgendamento);
        if (error) throw error;

        Alert.alert(
          "Agendamento Confirmado!",
          `Serviço: ${servico.nome}\nData: ${dataParam} às ${horaParam}\n\nNos vemos lá!`,
          [{ text: "OK", onPress: () => router.replace("/home") }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        agendamentoId ? "Erro ao Reagendar" : "Erro ao Agendar",
        error.message
      );
    } finally {
      setLoadingConfirmar(null);
    }
  };

  const renderItem = ({ item }: { item: Servico }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handleConfirmAgendamento(item)}
      disabled={loadingConfirmar === item.id}
    >
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemNome}>{item.nome}</Text>
        <Text style={styles.itemDescricao}>
          {item.descricao || "Sem descrição"}
        </Text>
      </View>
      <View style={styles.itemValoresContainer}>
        {loadingConfirmar === item.id ? (
          <ActivityIndicator color={styles.itemPreco.color} />
        ) : (
          <>
            <Text style={styles.itemPreco}>
              {Number(item.preco).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </Text>
            <Text style={styles.itemDuracao}>
              {item.duracao_minutos ? `${item.duracao_minutos} min` : ""}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Configura o título da tela (O _layout.tsx já o deixa preto/branco) */}
      <Stack.Screen
        options={{
          title: agendamentoId
            ? `Reagendar para ${dataParam} às ${horaParam}`
            : `Agendar Horário`,
        }}
      />

      {loadingServicos ? (
        // ATUALIZADO: Cor do loading para o roxo da marca
        <ActivityIndicator size="large" color="#7A5FFF" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={servicos}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.list}
          ListHeaderComponent={
            <Text style={styles.listTitle}>
              {agendamentoId
                ? "3. Escolha o Novo Serviço"
                : "3. Escolha o Serviço"}
            </Text>
          }
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>Nenhum serviço cadastrado.</Text>
          )}
        />
      )}
    </SafeAreaView>
  );
};

// --- ESTILOS ATUALIZADOS PARA O DESIGN "WALL STREET" ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A", // Fundo grafite
  },
  listTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#E0E0E0", // Texto claro
    padding: 20,
    paddingBottom: 10,
  },
  list: {
    flex: 1,
  },
  emptyText: {
    color: "#A0A0A0", // Texto secundário
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
  },
  itemContainer: {
    backgroundColor: "#252525", // Fundo do "Card"
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333", // Borda sutil
  },
  itemTextContainer: {
    flex: 1,
  },
  itemNome: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF", // Texto branco
  },
  itemDescricao: {
    fontSize: 14,
    color: "#A0A0A0", // Texto secundário
    marginTop: 4,
  },
  itemValoresContainer: {
    alignItems: "flex-end",
    marginLeft: 10,
    minWidth: 60,
  },
  itemPreco: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4D8AFF", // Verde (padrão de preço da Home)
  },
  itemDuracao: {
    fontSize: 14,
    color: "#A0A0A0", // Texto secundário
    marginTop: 4,
    minHeight: 16,
  },
});

export default EscolherServico;
