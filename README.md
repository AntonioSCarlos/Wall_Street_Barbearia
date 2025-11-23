# 💈 Barbearia Wall Street - Projeto Móvel

## Sobre o Projeto

**Barbearia Wall Street** é um aplicativo móvel desenvolvido com React Native que oferece uma solução completa de gestão para barbearias, combinando estilo premium com funcionalidades inteligentes de agendamento e administração.

## 🎯 O Problema

### Desafios Atuais Enfrentados pelas Barbearias

- **📱 Caos Manual**: Agendamentos via WhatsApp e papel geram erros, esquecimentos e conflitos de horário
- **📊 Falta de Dados**: Sem métricas claras sobre faturamento ou serviços mais populares para tomada de decisão estratégica

## 💡 A Solução

### Um Ecossistema Gerencial Completo

Um aplicativo móvel integrado com dois perfis distintos para resolver as dores de ambos os lados:

- **👤 Cliente**: Autonomia para agendar, ver preços e histórico de serviços
- **👑 Administrador**: Controle total da agenda, horários e relatórios financeiros

## 🛠 Stack Tecnológica

### **Front-end**
- ⚛️ React Native (Expo)
- 🧭 Expo Router

### **Back-end**
- 🗄️ Supabase (PostgreSQL)
- 🔐 Sistema de Autenticação
- 🛡️ Row Level Security (RLS)

## 🎨 Identidade Visual

### Conceito "Wall Street"

Design moderno, escuro e focado na usabilidade com uma paleta de cores profissional:

- ** Grafite** (`#1A1A1A`) - Cor de fundo principal
- ** Roxo** (`#7A5FFF`) - Cor de acento principal
- ** Branco** (`#E0E0E0`) - Cor de texto

## 📱 Funcionalidades

### **Para Clientes**
- ✅ Cadastro e Login seguros
- ✅ Visualização de serviços e agendamentos diponsíveis
- ✅ Calendário inteligente (bloqueia horários passados 24h automaticamente)
- ✅ Gestão completa de "Meus Agendamentos" (agendar/cancelar/reagendar)

### **Para Administradores**
- 🛠 Gerador de Horários: Criação automática de slots em massa
- 📊 Gráficos dinâmicos: Visualização dos serviços mais populares
- 📅 Gestão do Dia: Marcar como concluído ou cancelar reservas

## 🔒 Destaque Técnico - Segurança

### Implementação de Row Level Security (RLS)

Segurança implementada diretamente no banco de dados garantindo proteção máxima:

```sql
auth.uid() = cliente_id
