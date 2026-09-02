# 🎀 Organize Ateliê - Luccy Ribeiro

Sistema completo e profissional de gestão para ateliês de papelaria personalizada, cartonagem, festas e artesanato.

---

## 🚀 Funcionalidades

- 📋 **Gestão de Pedidos:** Controle completo de pedidos, status, datas de entrega, pagamentos, fotos e comprovantes.
- 🎨 **Catálogo de Produtos:** Cadastro com fotos, categorias, especificações e precificação.
- 💰 **Gerador de Orçamentos:** Criação rápida de propostas com exportação em PDF e compartilhamento.
- 📅 **Agenda e Calendário:** Visualização dos prazos e compromissos do ateliê.
- 👥 **Gestão de Clientes:** Histórico, contatos e preferências dos clientes.
- ⚙️ **Configurações Personalizadas:** Identidade visual, logotipo, chaves PIX e redes sociais.
- ☁️ **Sincronização Nuvem (Supabase):** Autenticação segura, banco de dados em tempo real e backup.

---

## 🛠️ Instalação e Execução Local

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- Gerenciador de pacotes `npm`, `yarn` ou `pnpm`

### Passo a Passo

1. **Instalar as dependências:**
   ```bash
   npm install
   ```

2. **Configurar as Variáveis de Ambiente:**
   Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
   Abra o arquivo `.env` e preencha suas chaves do Supabase:
   ```env
   VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
   VITE_SUPABASE_ANON_KEY="sua_chave_anonima_supabase"
   ```

3. **Configurar o Banco de Dados (Supabase):**
   - Acesse o painel do seu projeto no [Supabase](https://supabase.com).
   - Vá em **SQL Editor**.
   - Abra o arquivo `supabase_schema.sql` deste projeto, copie todo o conteúdo e execute no SQL Editor para criar as tabelas e políticas de segurança RLS.

4. **Executar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse a aplicação em seu navegador (geralmente em `http://localhost:3000`).

---

## 📦 Build para Produção & Deploy

Para gerar o pacote otimizado para produção:
```bash
npm run build
```

O projeto está pronto para publicação em plataformas como **Vercel**, **Netlify** ou qualquer hospedagem estática.
Basta configurar as mesmas variáveis de ambiente (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`) no painel da sua hospedagem.
