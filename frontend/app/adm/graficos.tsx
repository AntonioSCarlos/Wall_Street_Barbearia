import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { supabase } from "../../src/lib/supabase";

type GraficoData = {
  nome: string;
  count: number;
  faturamento: number;
};

type FaturamentoData = {
  data: string;
  valor: number;
  agendamentos: number;
};

type HorarioData = {
  horario: string;
  count: number;
  faturamento: number;
};

type MetricasFinanceiras = {
  faturamentoTotal: number;
  faturamentoMesAtual: number;
  faturamentoSemanal: number;
  agendamentosConcluidos: number;
  taxaConclusao: number;
  clientesFieis: number;
};

type RelatorioMensal = {
  mes: string;
  faturamento: number;
  crescimento: number;
};

const GraficosAdmin: React.FC = () => {
  const [dataGrafico, setDataGrafico] = useState<GraficoData[]>([]);
  const [faturamentoData, setFaturamentoData] = useState<FaturamentoData[]>([]);
  const [horariosData, setHorariosData] = useState<HorarioData[]>([]);
  const [statusData, setStatusData] = useState<GraficoData[]>([]);
  const [relatorioMensal, setRelatorioMensal] = useState<RelatorioMensal[]>([]);
  const [metricas, setMetricas] = useState<MetricasFinanceiras>({
    faturamentoTotal: 0,
    faturamentoMesAtual: 0,
    faturamentoSemanal: 0,
    agendamentosConcluidos: 0,
    taxaConclusao: 0,
    clientesFieis: 0,
  });
  const [loading, setLoading] = useState(true);
  const [totalAgendamentos, setTotalAgendamentos] = useState(0);

  //Função para buscar e processar os dados
  const fetchGraficoServicos = async () => {
    try {
      const { data: agendamentosData, error } = await supabase
        .from("agendamentos")
        .select("*, servicos ( nome, preco ), profiles ( id )");

      if (error) throw error;
      if (!agendamentosData) {
        setLoading(false);
        return;
      }

      setTotalAgendamentos(agendamentosData.length);

      // Processar todos os dados
      processarTodosDados(agendamentosData);
    } catch (error: any) {
      Alert.alert("Erro ao buscar dados do gráfico", error.message);
    } finally {
      setLoading(false);
    }
  };

  const processarTodosDados = (data: any[]) => {
    const servicosComFaturamento = processarServicosComFaturamento(data);
    setDataGrafico(servicosComFaturamento);

    const ultimos7Dias = processarFaturamentoDetalhado(data);
    setFaturamentoData(ultimos7Dias);

    const horariosPopulares = processarHorariosComFaturamento(data);
    setHorariosData(horariosPopulares);

    const statusAgendamentos = processarStatus(data);
    setStatusData(statusAgendamentos);

    const metricasCalculadas = calcularMetricasFinanceirasCompletas(data);
    setMetricas(metricasCalculadas);

    const relatorio = processarRelatorioMensal(data);
    setRelatorioMensal(relatorio);
  };

  const processarServicosComFaturamento = (data: any[]): GraficoData[] => {
    const servicos: { [key: string]: { count: number; faturamento: number } } =
      {};

    data.forEach((item) => {
      const nomeServico = item.servicos?.nome || "Removido";
      const preco = item.servicos?.preco || 0;

      if (!servicos[nomeServico]) {
        servicos[nomeServico] = { count: 0, faturamento: 0 };
      }

      servicos[nomeServico].count += 1;

      if (item.status === "concluido") {
        servicos[nomeServico].faturamento += preco;
      }
    });

    return Object.keys(servicos)
      .map((nome) => ({
        nome,
        count: servicos[nome].count,
        faturamento: servicos[nome].faturamento,
      }))
      .sort((a, b) => b.faturamento - a.faturamento);
  };

  const processarFaturamentoDetalhado = (data: any[]): FaturamentoData[] => {
    const ultimos7Dias: FaturamentoData[] = [];
    const hoje = new Date();

    for (let i = 6; i >= 0; i--) {
      const dataAtual = new Date(hoje);
      dataAtual.setDate(hoje.getDate() - i);

      if (isNaN(dataAtual.getTime())) {
        console.warn("Data inválida encontrada, pulando...");
        continue;
      }

      const dataString = dataAtual.toISOString().split("T")[0];

      const agendamentosDia = data.filter((item) => {
        if (!item.data_hora_inicio) return false;

        try {
          const itemData = new Date(item.data_hora_inicio);
          if (isNaN(itemData.getTime())) return false;

          const itemDataString = itemData.toISOString().split("T")[0];
          return itemDataString === dataString;
        } catch (error) {
          console.warn("Erro ao processar data do agendamento:", error);
          return false;
        }
      });

      const faturamento = agendamentosDia.reduce((total, item) => {
        if (item.status === "concluido") {
          return total + (item.servicos?.preco || 0);
        }
        return total;
      }, 0);

      const agendamentosConcluidos = agendamentosDia.filter(
        (item) => item.status === "concluido"
      ).length;

      ultimos7Dias.push({
        data: formatarData(dataAtual),
        valor: faturamento,
        agendamentos: agendamentosConcluidos,
      });
    }

    return ultimos7Dias;
  };

  const processarHorariosComFaturamento = (data: any[]): HorarioData[] => {
    const horarios: { [key: string]: { count: number; faturamento: number } } =
      {};

    data.forEach((item) => {
      if (item.data_hora_inicio) {
        try {
          const hora = new Date(item.data_hora_inicio).getHours();
          const horario = `${hora}:00`;
          const preco = item.servicos?.preco || 0;

          if (!horarios[horario]) {
            horarios[horario] = { count: 0, faturamento: 0 };
          }

          horarios[horario].count += 1;

          if (item.status === "concluido") {
            horarios[horario].faturamento += preco;
          }
        } catch (error) {
          console.warn("Erro ao processar horário:", error);
        }
      }
    });

    return Object.keys(horarios)
      .map((horario) => ({
        horario,
        count: horarios[horario].count,
        faturamento: horarios[horario].faturamento,
      }))
      .sort((a, b) => b.faturamento - a.faturamento)
      .slice(0, 5);
  };

  const processarStatus = (data: any[]): GraficoData[] => {
    const status: { [key: string]: number } = {};

    data.forEach((item) => {
      try {
        const statusAtual = item.status || "pendente";
        status[statusAtual] = (status[statusAtual] || 0) + 1;
      } catch (error) {
        console.warn("Erro ao processar status:", error);
      }
    });

    return Object.keys(status).map((nome) => ({
      nome: nome.charAt(0).toUpperCase() + nome.slice(1),
      count: status[nome],
      faturamento: 0,
    }));
  };

  const calcularMetricasFinanceirasCompletas = (
    data: any[]
  ): MetricasFinanceiras => {
    const agendamentosConcluidos = data.filter(
      (item) => item.status === "concluido"
    );

    // Faturamento total (histórico)
    const faturamentoTotal = agendamentosConcluidos.reduce((total, item) => {
      return total + (item.servicos?.preco || 0);
    }, 0);

    // Faturamento do mês atual
    const mesAtual = new Date().getMonth();
    const anoAtual = new Date().getFullYear();

    const faturamentoMesAtual = agendamentosConcluidos.reduce((total, item) => {
      const dataAgendamento = new Date(item.data_hora_inicio);
      if (
        dataAgendamento.getMonth() === mesAtual &&
        dataAgendamento.getFullYear() === anoAtual
      ) {
        return total + (item.servicos?.preco || 0);
      }
      return total;
    }, 0);

    // Faturamento semanal (últimos 7 dias)
    const umaSemanaAtras = new Date();
    umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);

    const faturamentoSemanal = agendamentosConcluidos.reduce((total, item) => {
      const dataAgendamento = new Date(item.data_hora_inicio);
      if (dataAgendamento >= umaSemanaAtras) {
        return total + (item.servicos?.preco || 0);
      }
      return total;
    }, 0);

    // Clientes fiéis (que fizeram mais de 1 agendamento)
    const clientesAgendamentos: { [key: string]: number } = {};

    agendamentosConcluidos.forEach((item) => {
      const clienteId = item.profiles?.id;
      if (clienteId) {
        clientesAgendamentos[clienteId] =
          (clientesAgendamentos[clienteId] || 0) + 1;
      }
    });

    const clientesFieis = Object.values(clientesAgendamentos).filter(
      (count) => count > 1
    ).length;

    const taxaConclusao =
      totalAgendamentos > 0
        ? (agendamentosConcluidos.length / totalAgendamentos) * 100
        : 0;

    return {
      faturamentoTotal,
      faturamentoMesAtual,
      faturamentoSemanal,
      agendamentosConcluidos: agendamentosConcluidos.length,
      taxaConclusao,
      clientesFieis,
    };
  };

  // Processar relatório mensal
  const processarRelatorioMensal = (data: any[]): RelatorioMensal[] => {
    const meses: { [key: string]: number } = {};
    const agendamentosConcluidos = data.filter(
      (item) => item.status === "concluido"
    );

    agendamentosConcluidos.forEach((item) => {
      const dataAgendamento = new Date(item.data_hora_inicio);
      const mesAno = `${
        dataAgendamento.getMonth() + 1
      }/${dataAgendamento.getFullYear()}`;
      const preco = item.servicos?.preco || 0;

      if (!meses[mesAno]) {
        meses[mesAno] = 0;
      }
      meses[mesAno] += preco;
    });

    const relatorio = Object.keys(meses)
      .map((mes) => ({
        mes,
        faturamento: meses[mes],
        crescimento: 0,
      }))
      .sort((a, b) => {
        const [mesA, anoA] = a.mes.split("/").map(Number);
        const [mesB, anoB] = b.mes.split("/").map(Number);
        return anoB - anoA || mesB - mesA;
      })
      .slice(0, 6);

    // Calcular crescimento
    for (let i = 1; i < relatorio.length; i++) {
      const atual = relatorio[i].faturamento;
      const anterior = relatorio[i - 1].faturamento;
      relatorio[i].crescimento =
        anterior > 0 ? ((atual - anterior) / anterior) * 100 : 0;
    }

    return relatorio;
  };

  const formatarData = (data: Date): string => {
    try {
      if (isNaN(data.getTime())) {
        return "Data inválida";
      }
      return data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
    } catch (error) {
      console.warn("Erro ao formatar data:", error);
      return "Erro";
    }
  };

  useEffect(() => {
    fetchGraficoServicos();
  }, []);

  const MetricasFinanceiras = () => (
    <View style={styles.metricasContainer}>
      <Text style={styles.metricasTitle}>Visão Geral do Negócio</Text>

      <View style={styles.metricasGrid}>
        <View style={styles.metricaItem}>
          <Text style={styles.metricaValor}>
            {metricas.faturamentoMesAtual.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </Text>
          <Text style={styles.metricaLabel}>Faturamento Mensal</Text>
        </View>

        <View style={styles.metricaItem}>
          <Text style={styles.metricaValor}>
            {metricas.faturamentoSemanal.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </Text>
          <Text style={styles.metricaLabel}>Faturamento Semanal</Text>
        </View>

        <View style={styles.metricaItem}>
          <Text style={styles.metricaValor}>
            {metricas.agendamentosConcluidos}
          </Text>
          <Text style={styles.metricaLabel}>Serviços Concluídos</Text>
        </View>

        <View style={styles.metricaItem}>
          <Text style={styles.metricaValor}>{metricas.clientesFieis}</Text>
          <Text style={styles.metricaLabel}>Clientes Fiéis</Text>
        </View>
      </View>
    </View>
  );

  const BarraGrafico = ({ item }: { item: GraficoData }) => {
    const percentagem =
      totalAgendamentos > 0 ? (item.count / totalAgendamentos) * 100 : 0;

    return (
      <View style={styles.barraContainer}>
        <View style={styles.barraLabels}>
          <Text style={styles.barraNome}>{item.nome}</Text>
          <View style={styles.barraInfo}>
            <Text style={styles.barraCount}>{item.count} agend.</Text>
            <Text style={styles.barraFaturamento}>
              {item.faturamento.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </Text>
          </View>
        </View>
        <View style={styles.barraFundo}>
          <View
            style={[styles.barraPreenchimento, { width: `${percentagem}%` }]}
          />
        </View>
        <Text style={styles.barraPercent}>{percentagem.toFixed(1)}%</Text>
      </View>
    );
  };

  const GraficoFaturamento = () => {
    if (faturamentoData.length === 0) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.emptyText}>
            Sem dados de faturamento disponíveis.
          </Text>
        </View>
      );
    }

    const valores = faturamentoData.map((item) => item.valor);
    const maxFaturamento = Math.max(...valores);
    const minFaturamento = Math.min(...valores);
    const range = maxFaturamento - minFaturamento || 1;

    return (
      <View style={styles.graficoContainer}>
        <View style={styles.graficoHeader}>
          <Text style={styles.graficoTitle}>Faturamento Diário</Text>
          <Text style={styles.graficoSubtitle}>Últimos 7 dias</Text>
        </View>
        <View style={styles.graficoLinhas}>
          {faturamentoData.map((item, index) => {
            const altura =
              range > 0 ? ((item.valor - minFaturamento) / range) * 80 : 40;
            return (
              <View key={index} style={styles.pontoContainer}>
                <View style={[styles.pontoLinha, { height: altura }]}>
                  <View style={styles.ponto} />
                </View>
                <Text style={styles.eixoXTexto}>{item.data}</Text>
                <Text style={styles.eixoYTexto}>
                  R$ {item.valor.toFixed(0)}
                </Text>
                <Text style={styles.agendamentosTexto}>
                  {item.agendamentos} serv.
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const GraficoStatus = () => {
    if (statusData.length === 0) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.emptyText}>Sem dados de status disponíveis.</Text>
        </View>
      );
    }

    const getCorPorStatus = (status: string) => {
      switch (status.toLowerCase()) {
        case "concluido":
          return "#4D8AFF";
        case "confirmado":
          return "#7A5FFF";
        case "pendente":
          return "#FFA502";
        case "cancelado":
          return "#E74C3C";
        default:
          return "#7A5FFF";
      }
    };

    return (
      <View style={styles.pizzaContainer}>
        <View style={styles.pizzaHeader}>
          <Text style={styles.pizzaTitle}>Status Atuais</Text>
        </View>
        <View style={styles.pizzaGrafico}>
          {statusData.map((item, index) => {
            const percentagem =
              totalAgendamentos > 0
                ? (item.count / totalAgendamentos) * 100
                : 0;

            return (
              <View key={index} style={styles.pizzaItem}>
                <View style={styles.pizzaLegenda}>
                  <View
                    style={[
                      styles.pizzaCor,
                      { backgroundColor: getCorPorStatus(item.nome) },
                    ]}
                  />
                  <Text style={styles.pizzaTexto}>
                    {item.nome}: {item.count} ({percentagem.toFixed(1)}%)
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const GraficoHorarios = () => {
    if (horariosData.length === 0) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.emptyText}>
            Sem dados de horários disponíveis.
          </Text>
        </View>
      );
    }

    const maxFaturamento = Math.max(
      ...horariosData.map((item) => item.faturamento)
    );

    return (
      <View style={styles.horariosContainer}>
        <View style={styles.horariosHeader}>
          <Text style={styles.horariosTitle}>Horários Mais Rentáveis</Text>
        </View>
        {horariosData.map((item, index) => {
          const percentagem =
            maxFaturamento > 0 ? (item.faturamento / maxFaturamento) * 100 : 0;

          return (
            <View key={index} style={styles.horarioItem}>
              <View style={styles.horarioLabels}>
                <Text style={styles.horarioTexto}>{item.horario}</Text>
                <View style={styles.horarioInfo}>
                  <Text style={styles.horarioCount}>{item.count} agend.</Text>
                  <Text style={styles.horarioFaturamento}>
                    {item.faturamento.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </Text>
                </View>
              </View>
              <View style={styles.horarioBarraFundo}>
                <View
                  style={[styles.horarioBarra, { width: `${percentagem}%` }]}
                />
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  //Relatório Mensal
  const RelatorioMensal = () => {
    if (relatorioMensal.length === 0) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.emptyText}>Sem dados para relatório mensal.</Text>
        </View>
      );
    }

    return (
      <View style={styles.relatorioContainer}>
        <View style={styles.relatorioHeader}>
          <Text style={styles.relatorioTitle}>Relatório dos Meses</Text>
          <Text style={styles.relatorioSubtitle}>Últimos 6 meses</Text>
        </View>
        {relatorioMensal.map((item, index) => (
          <View key={index} style={styles.relatorioItem}>
            <View style={styles.relatorioInfo}>
              <Text style={styles.relatorioMes}>{item.mes}</Text>
              <Text style={styles.relatorioCrescimento}>
                {item.crescimento > 0 ? "" : item.crescimento < 0 ? "" : ""}
                {item.crescimento !== 0 &&
                  `${Math.abs(item.crescimento).toFixed(1)}%`}
              </Text>
            </View>
            <Text style={styles.relatorioValor}>
              {item.faturamento.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Dashboard Financeiro</Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#7A5FFF"
          style={styles.loading}
        />
      ) : (
        <>
          {/* Métricas Financeiras */}
          <MetricasFinanceiras />

          {/* Gráfico de Faturamento */}
          <Text style={styles.title}>Faturamento Diário</Text>
          <GraficoFaturamento />

          {/* Relatório Mensal */}
          <Text style={styles.title}>Evolução Mensal</Text>
          <RelatorioMensal />

          {/* Gráfico de Serviços Mais Rentáveis */}
          <Text style={styles.title}>Serviços Mais Rentáveis</Text>
          {dataGrafico.length > 0 ? (
            dataGrafico.map((item) => (
              <BarraGrafico key={item.nome} item={item} />
            ))
          ) : (
            <Text style={styles.emptyText}>
              Sem dados suficientes para mostrar o gráfico.
            </Text>
          )}

          {/* Gráfico de Horários Mais Populares */}
          <Text style={styles.title}>Horários de Pico</Text>
          <GraficoHorarios />

          {/* Gráfico de Status dos Agendamentos */}
          <Text style={styles.title}>Status dos Agendamentos</Text>
          <GraficoStatus />
        </>
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
  header: {
    color: "#E0E0E0",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 300,
  },
  title: {
    color: "#E0E0E0",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    marginTop: 10,
  },
  emptyText: {
    color: "#A0A0A0",
    textAlign: "center",
    padding: 20,
    fontSize: 16,
  },
  placeholder: {
    backgroundColor: "#252525",
    borderRadius: 8,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  metricasContainer: {
    backgroundColor: "#252525",
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  metricasTitle: {
    color: "#E0E0E0",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  metricasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricaItem: {
    width: "48%",
    backgroundColor: "#1A1A1A",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  metricaValor: {
    color: "#7A5FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  metricaLabel: {
    color: "#A0A0A0",
    fontSize: 12,
    textAlign: "center",
  },

  barraContainer: {
    marginBottom: 20,
  },
  barraLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  barraNome: {
    color: "#E0E0E0",
    fontSize: 16,
    flex: 1,
  },
  barraInfo: {
    alignItems: "flex-end",
  },
  barraCount: {
    color: "#A0A0A0",
    fontSize: 12,
  },
  barraFaturamento: {
    color: "#4D8AFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  barraFundo: {
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
    overflow: "hidden",
    marginVertical: 5,
  },
  barraPreenchimento: {
    height: "100%",
    backgroundColor: "#7A5FFF",
    borderRadius: 4,
  },
  barraPercent: {
    color: "#A0A0A0",
    fontSize: 10,
    textAlign: "right",
  },

  graficoContainer: {
    backgroundColor: "#252525",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  graficoHeader: {
    marginBottom: 15,
  },
  graficoTitle: {
    color: "#E0E0E0",
    fontSize: 16,
    fontWeight: "bold",
  },
  graficoSubtitle: {
    color: "#A0A0A0",
    fontSize: 12,
  },
  graficoLinhas: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
    paddingVertical: 10,
  },
  pontoContainer: {
    alignItems: "center",
    flex: 1,
  },
  pontoLinha: {
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 5,
  },
  ponto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#7A5FFF",
  },
  eixoXTexto: {
    color: "#A0A0A0",
    fontSize: 10,
    marginTop: 5,
  },
  eixoYTexto: {
    color: "#E0E0E0",
    fontSize: 9,
    marginTop: 2,
  },
  agendamentosTexto: {
    color: "#4D8AFF",
    fontSize: 8,
    marginTop: 2,
  },

  pizzaContainer: {
    backgroundColor: "#252525",
    borderRadius: 8,
    padding: 20,
    paddingBottom: 50,
  },
  pizzaHeader: {
    marginBottom: 15,
  },
  pizzaTitle: {
    color: "#E0E0E0",
    fontSize: 16,
    fontWeight: "bold",
  },
  pizzaGrafico: {
    flexDirection: "column",
  },
  pizzaItem: {
    marginBottom: 10,
  },
  pizzaLegenda: {
    flexDirection: "row",
    alignItems: "center",
  },
  pizzaCor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  pizzaTexto: {
    color: "#E0E0E0",
    fontSize: 14,
  },

  horariosContainer: {
    backgroundColor: "#252525",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  horariosHeader: {
    marginBottom: 15,
  },
  horariosTitle: {
    color: "#E0E0E0",
    fontSize: 16,
    fontWeight: "bold",
  },
  horarioItem: {
    marginBottom: 15,
  },
  horarioLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  horarioTexto: {
    color: "#E0E0E0",
    fontSize: 14,
  },
  horarioInfo: {
    alignItems: "flex-end",
  },
  horarioCount: {
    color: "#A0A0A0",
    fontSize: 12,
  },
  horarioFaturamento: {
    color: "#4D8AFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  horarioBarraFundo: {
    height: 6,
    backgroundColor: "#333",
    borderRadius: 3,
    overflow: "hidden",
  },
  horarioBarra: {
    height: "100%",
    backgroundColor: "#4D8AFF",
    borderRadius: 3,
  },

  relatorioContainer: {
    backgroundColor: "#252525",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  relatorioHeader: {
    marginBottom: 15,
  },
  relatorioTitle: {
    color: "#E0E0E0",
    fontSize: 16,
    fontWeight: "bold",
  },
  relatorioSubtitle: {
    color: "#A0A0A0",
    fontSize: 12,
  },
  relatorioItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  relatorioInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  relatorioMes: {
    color: "#E0E0E0",
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 10,
  },
  relatorioCrescimento: {
    color: "#A0A0A0",
    fontSize: 12,
  },
  relatorioValor: {
    color: "#7A5FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default GraficosAdmin;
