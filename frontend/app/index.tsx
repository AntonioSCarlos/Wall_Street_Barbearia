import { Redirect } from "expo-router";

export default function StartPage() {
  // Esta página (index.tsx) é a rota raiz "/".
  // Estou usando o componente "Redirect" do Expo Router para
  // enviar o usuário imediatamente para a rota "/login".

  // No futuro, quando tivermos possíveis melhoras funcionando, poderemos adiciona-la aqui

  // Mas por enquanto, vamos sempre começar pelo login:
  return <Redirect href="/login" />;
}
