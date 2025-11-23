import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Calendar, LocaleConfig, DateData } from "react-native-calendars";
import { supabase } from "@/src/lib/supabase";

// --- Configuração do Calendári
LocaleConfig.locales["pt-br"] = {
  monthNames: [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ],
  monthNamesShort: [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ],
  dayNames: [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ],
  dayNamesShort: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
  today: "Hoje",
};
LocaleConfig.defaultLocale = "pt-br";

type HorarioSlot = {
  horario: string;
  isOcupado: boolean;
};

const Reagendar: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const agendamentoId = params.agendamentoId
    ? String(params.agendamentoId)
    : null;

  const [selectedDate, setSelectedDate] = useState<DateData | null>(null);
  const [horarios, setHorarios] = useState<HorarioSlot[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [loadingAgendamento, setLoadingAgendamento] = useState(true);
  const [agendamentoAtual, setAgendamentoAtual] = useState<any>(null);

  useEffect(() => {
    const fetchAgendamentoAtual = async () => {
      if (!agendamentoId) {
        setLoadingAgendamento(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("agendamentos")
          .select(
            `
            id,
            data_hora_inicio,
            servicos ( nome )
          `
          )
          .eq("id", agendamentoId)
          .single();

        if (error) throw error;

        if (data) {
          setAgendamentoAtual(data);
          const dataAtual = new Date(data.data_hora_inicio);
          const dataFormatada = dataAtual.toISOString().split("T")[0];
          setSelectedDate({
            dateString: dataFormatada,
            day: dataAtual.getDate(),
            month: dataAtual.getMonth() + 1,
            year: dataAtual.getFullYear(),
            timestamp: dataAtual.getTime(),
          });
          fetchHorariosDisponiveis({
            dateString: dataFormatada,
            day: dataAtual.getDate(),
            month: dataAtual.getMonth() + 1,
            year: dataAtual.getFullYear(),
            timestamp: dataAtual.getTime(),
          });
        }
      } catch (error: any) {
        Alert.alert(
          "Erro",
          "Não foi possível carregar os dados do agendamento."
        );
        console.error(error);
      } finally {
        setLoadingAgendamento(false);
      }
    };

    fetchAgendamentoAtual();
  }, [agendamentoId]);

  const fetchHorariosDisponiveis = async (day: DateData) => {
    setLoadingHorarios(true);
    setHorarios([]);
    try {
      // 1. Preparar as datas (Correção de fusohorário)
      const dataSelecionadaObj = new Date(day.dateString + "T12:00:00");
      const dia_da_semana = dataSelecionadaObj.getDay();
      const dataISO = day.dateString;

      // 2. Obter "Agora" (Data e Hora local do dispositivo)
      const agora = new Date();
      const ano = agora.getFullYear();
      const mes = String(agora.getMonth() + 1).padStart(2, "0");
      const diaHoje = String(agora.getDate()).padStart(2, "0");
      const dataHojeString = `${ano}-${mes}-${diaHoje}`;

      const horaAtual = agora.getHours();
      const minutoAtual = agora.getMinutes();
      const minutosTotaisAgora = horaAtual * 60 + minutoAtual;

      // 3. BUSCAR O "CARDÁPIO"
      const { data: dataMenu, error: errorMenu } = await supabase
        .from("horarios_disponiveis")
        .select("horario")
        .eq("dia_da_semana", dia_da_semana)
        .order("horario");

      if (errorMenu) throw errorMenu;
      if (!dataMenu || dataMenu.length === 0) {
        setLoadingHorarios(false);
        setHorarios([]);
        return;
      }

      // 4. BUSCAR AS "COMANDAS" (Agendamentos existentes)
      const inicioDoDia = `${dataISO}T00:00:00Z`;
      const fimDoDia = `${dataISO}T23:59:59Z`;

      const { data: dataOcupados, error: errorOcupados } = await supabase
        .from("agendamentos")
        .select("data_hora_inicio")
        .gte("data_hora_inicio", inicioDoDia)
        .lte("data_hora_inicio", fimDoDia)
        .neq("id", agendamentoId); // Excluir o agendamento atual da lista de ocupados

      if (errorOcupados) throw errorOcupados;

      // Converter agendamentos para strings de hora local "HH:MM:SS"
      const horariosOcupados = dataOcupados.map((agendamento) => {
        const dataUTC = new Date(agendamento.data_hora_inicio);
        const dataLocal = new Date(dataUTC.getTime());
        const h = dataLocal.getHours().toString().padStart(2, "0");
        const m = dataLocal.getMinutes().toString().padStart(2, "0");
        const s = dataLocal.getSeconds().toString().padStart(2, "0");
        return `${h}:${m}:${s}`;
      });

      // 5. LÓGICA FINAL (Mapear e Bloquear Passados)
      const horariosCompletos: HorarioSlot[] = dataMenu.map((item) => {
        const ocupadoPorAgendamento = horariosOcupados.includes(item.horario);
        let ocupadoPorHorarioPassado = false;

        if (dataISO === dataHojeString) {
          const [slotH, slotM] = item.horario.split(":").map(Number);
          const minutosTotaisSlot = slotH * 60 + slotM;
          if (minutosTotaisSlot < minutosTotaisAgora) {
            ocupadoPorHorarioPassado = true;
          }
        }

        return {
          horario: item.horario,
          isOcupado: ocupadoPorAgendamento || ocupadoPorHorarioPassado,
        };
      });

      setHorarios(horariosCompletos);
    } catch (error: any) {
      Alert.alert("Erro ao buscar horários", error.message);
    } finally {
      setLoadingHorarios(false);
    }
  };

  const handleDateSelect = (day: DateData) => {
    setSelectedDate(day);
    fetchHorariosDisponiveis(day);
  };

  const handleTimeSelect = (horario: string) => {
    if (!selectedDate) return;

    const dataFormatada = selectedDate.dateString;
    const horaFormatada = horario.substring(0, 5);

    // Navegação para escolher-servico com dados do reagendamento
    router.push(
      `/escolher-servico?data=${dataFormatada}&hora=${horaFormatada}&agendamentoId=${agendamentoId}`
    );
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  if (loadingAgendamento) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7A5FFF" />
        <Text style={styles.loadingText}>Carregando agendamento...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: "Reagendar Horário" }} />

      {agendamentoAtual && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Agendamento Atual</Text>
          <Text style={styles.infoText}>
            Serviço: {agendamentoAtual.servicos.nome}
          </Text>
          <Text style={styles.infoText}>
            Data:{" "}
            {new Date(agendamentoAtual.data_hora_inicio).toLocaleDateString(
              "pt-BR"
            )}
          </Text>
          <Text style={styles.infoText}>
            Horário:{" "}
            {new Date(agendamentoAtual.data_hora_inicio).toLocaleTimeString(
              "pt-BR",
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            )}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Escolha a Nova Data</Text>
        <Calendar
          onDayPress={handleDateSelect}
          markedDates={{
            [selectedDate?.dateString || ""]: {
              selected: true,
              disableTouchEvent: true,
              selectedColor: "#7A5FFF",
              selectedTextColor: "white",
            },
          }}
          theme={{
            backgroundColor: "#1A1A1A",
            calendarBackground: "#1A1A1A",
            textSectionTitleColor: "#A0A0A0",
            selectedDayBackgroundColor: "#7A5FFF",
            selectedDayTextColor: "#ffffff",
            todayTextColor: "#7A5FFF",
            dayTextColor: "#E0E0E0",
            textDisabledColor: "#444",
            arrowColor: "#7A5FFF",
            monthTextColor: "white",
            textDayFontWeight: "300",
            textMonthFontWeight: "bold",
            textDayHeaderFontWeight: "300",
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14,
          }}
          minDate={new Date().toISOString().split("T")[0]}
        />
      </View>

      {loadingHorarios && (
        <ActivityIndicator
          size="large"
          color="#7A5FFF"
          style={{ marginTop: 20 }}
        />
      )}

      {!loadingHorarios && selectedDate && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Escolha o Novo Horário</Text>
          <Text style={styles.subTitle}>
            Horários disponíveis para {selectedDate?.dateString}:
          </Text>

          <View style={styles.timeSlotsContainer}>
            {horarios.length > 0 ? (
              horarios.map((item) => (
                <TouchableOpacity
                  key={item.horario}
                  style={[
                    styles.timeSlotBase,
                    item.isOcupado
                      ? styles.timeSlotOcupado
                      : styles.timeSlotLivre,
                  ]}
                  disabled={item.isOcupado}
                  onPress={() => handleTimeSelect(item.horario)}
                >
                  <Text
                    style={[
                      styles.timeSlotTextBase,
                      item.isOcupado
                        ? styles.timeSlotTextOcupado
                        : styles.timeSlotTextLivre,
                    ]}
                  >
                    {formatTime(item.horario)}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noTimeText}>
                Nenhum horário disponível neste dia.
              </Text>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    padding: 20,
  },
  loadingText: {
    color: "#A0A0A0",
    textAlign: "center",
    marginTop: 10,
  },
  infoContainer: {
    backgroundColor: "#252525",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#7A5FFF",
  },
  infoTitle: {
    color: "#7A5FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  infoText: {
    color: "#E0E0E0",
    fontSize: 14,
    marginBottom: 4,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: "#E0E0E0",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  subTitle: {
    color: "#A0A0A0",
    fontSize: 16,
    marginBottom: 15,
  },
  timeSlotsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  timeSlotBase: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 5,
    minWidth: "30%",
    alignItems: "center",
  },
  timeSlotLivre: {
    backgroundColor: "#7A5FFF",
  },
  timeSlotOcupado: {
    backgroundColor: "#252525",
    borderColor: "#444",
    borderWidth: 1,
  },
  timeSlotTextBase: {
    fontSize: 16,
  },
  timeSlotTextLivre: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  timeSlotTextOcupado: {
    color: "#555",
    textDecorationLine: "line-through",
  },
  noTimeText: {
    color: "#A0A0A0",
    fontSize: 16,
    padding: 20,
    textAlign: "center",
    width: "100%",
  },
});

export default Reagendar;
