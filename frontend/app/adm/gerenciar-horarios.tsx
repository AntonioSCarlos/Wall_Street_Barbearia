import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../../src/lib/supabase";

// Dias da semana para os botões
const DIAS_DA_SEMANA = [
  { label: "Dom", valor: 0 },
  { label: "Seg", valor: 1 },
  { label: "Ter", valor: 2 },
  { label: "Qua", valor: 3 },
  { label: "Qui", valor: 4 },
  { label: "Sex", valor: 5 },
  { label: "Sáb", valor: 6 },
];

const GerenciarHorarios: React.FC = () => {
  // Estados do formulário
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null);
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFim, setHoraFim] = useState("18:00");
  const [intervalo, setIntervalo] = useState("30");
  const [loading, setLoading] = useState(false);

  const parseTime = (timeStr: string): number => {
    if (!/^\d{2}:\d{2}$/.test(timeStr)) return NaN;
    const [horas, minutos] = timeStr.split(":").map(Number);
    if (isNaN(horas) || isNaN(minutos)) return NaN;
    return horas * 60 + minutos;
  };

  const formatTime = (totalMinutes: number): string => {
    const horas = Math.floor(totalMinutes / 60)
      .toString()
      .padStart(2, "0");
    const minutos = (totalMinutes % 60).toString().padStart(2, "0");
    return `${horas}:${minutos}:00`;
  };

  const handleGerarHorarios = async () => {
    if (diaSelecionado === null) {
      Alert.alert("Erro", "Por favor, selecione um dia da semana.");
      return;
    }
    const minInicio = parseTime(horaInicio);
    const minFim = parseTime(horaFim);
    const int = parseInt(intervalo, 10);

    if (isNaN(minInicio) || isNaN(minFim)) {
      Alert.alert("Erro", "Formato de hora inválido. Use HH:MM (ex: 09:00).");
      return;
    }
    if (isNaN(int) || int <= 0) {
      Alert.alert("Erro", "O intervalo deve ser um número positivo.");
      return;
    }
    if (minInicio >= minFim) {
      Alert.alert("Erro", "A hora de início deve ser anterior à hora de fim.");
      return;
    }

    setLoading(true);

    try {
      const horariosParaInserir = [];
      for (let m = minInicio; m < minFim; m += int) {
        horariosParaInserir.push({
          dia_da_semana: diaSelecionado,
          horario: formatTime(m),
        });
      }

      if (horariosParaInserir.length === 0) {
        Alert.alert(
          "Aviso",
          "Nenhum horário foi gerado. Verifique o início/fim e o intervalo."
        );
        setLoading(false);
        return;
      }

      const { error: deleteError } = await supabase
        .from("horarios_disponiveis")
        .delete()
        .eq("dia_da_semana", diaSelecionado);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from("horarios_disponiveis")
        .insert(horariosParaInserir);

      if (insertError) throw insertError;

      Alert.alert(
        "Sucesso!",
        `${horariosParaInserir.length} horários foram gerados para ${DIAS_DA_SEMANA[diaSelecionado].label}.`
      );

      // Limpa o formulário após o sucesso
      setDiaSelecionado(null);
      setHoraInicio("09:00");
      setHoraFim("18:00");
      setIntervalo("30");
    } catch (error: any) {
      Alert.alert("Erro ao gerar horários", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* O Título "Gerador de Horários" é tratado pelo _layout.tsx da pasta /admin */}

      {/* 1. Seleção do Dia da Semana */}
      <Text style={styles.label}>1. Escolha o Dia da Semana</Text>
      <View style={styles.diasContainer}>
        {DIAS_DA_SEMANA.map((dia) => (
          <TouchableOpacity
            key={dia.valor}
            style={[
              styles.diaButton,
              diaSelecionado === dia.valor && styles.diaButtonSelected,
            ]}
            onPress={() => setDiaSelecionado(dia.valor)}
          >
            <Text
              style={[
                styles.diaButtonText,
                diaSelecionado === dia.valor && styles.diaButtonTextSelected,
              ]}
            >
              {dia.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 2. Inputs de Hora e Intervalo */}
      <Text style={styles.label}>2. Defina o Período</Text>
      <TextInput
        style={styles.input}
        value={horaInicio}
        onChangeText={setHoraInicio}
        placeholder="Hora de Início (ex: 09:00)"
        placeholderTextColor="#999"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        value={horaFim}
        onChangeText={setHoraFim}
        placeholder="Hora de Fim (ex: 18:00)"
        placeholderTextColor="#999"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        value={intervalo}
        onChangeText={setIntervalo}
        placeholder="Intervalo (em minutos, ex: 30)"
        placeholderTextColor="#999"
        keyboardType="numeric"
      />

      {/* 3. Botão de Gerar */}
      <TouchableOpacity
        style={[styles.gerarButton, loading && styles.gerarButtonDisabled]}
        onPress={handleGerarHorarios}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.gerarButtonText}>Gerar Horários</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    padding: 20,
  },
  label: {
    color: "#E0E0E0",
    fontWeight: "500",
    fontSize: 14,
    marginBottom: 10,
    marginTop: 15,
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
    marginBottom: 15,
  },
  diasContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  diaButton: {
    backgroundColor: "#252525",
    paddingVertical: 10,
    borderRadius: 5,
    width: "12%",
    alignItems: "center",
    borderColor: "#333",
    borderWidth: 1,
  },
  diaButtonSelected: {
    backgroundColor: "#4D8AFF",
    borderColor: "#4D8AFF",
  },
  diaButtonText: {
    color: "#FFFFFF",
  },
  diaButtonTextSelected: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  gerarButton: {
    backgroundColor: "#7A5FFF",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    marginTop: 20,
  },
  gerarButtonDisabled: {
    backgroundColor: "#333",
  },
  gerarButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default GerenciarHorarios;
