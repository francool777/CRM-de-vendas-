# Arthur Franco Design — CRM

CRM de vendas **local e pessoal** para gerenciar prospecção de clientes via Instagram.
Sem login, sem multiusuário, sem nuvem: os dados ficam num arquivo SQLite dentro do
próprio projeto (`prisma/dev.db`).

## Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS (componentes no padrão shadcn/ui)
- **Banco:** SQLite local via Prisma (servido por uma pequena API Express que sobe junto com o `npm run dev`)
- **Drag-and-drop:** @dnd-kit/core · **Animações:** framer-motion · **Gráficos:** recharts

## Como rodar

```bash
npm install
npx prisma migrate dev   # cria o banco prisma/dev.db e roda o seed do playbook
npm run dev              # sobe a API local (porta 3001) + o app (porta 5173)
```

Abra **http://localhost:5173**. Pronto — tudo roda na sua máquina.

> O seed (playbook com ICP, scripts, follow-ups, objeções e perguntas-guia, além dos
> segmentos e plataformas iniciais) roda automaticamente no `migrate dev`. Para rodar
> de novo manualmente: `npx prisma db seed`. Os textos do playbook são conteúdo
> inicial — edite tudo pela tela **/playbook** e substitua pelo texto real da sua planilha.

## Como importar o CSV inicial

1. Vá em **Leads** → botão **Importar**.
2. Escolha o arquivo `.csv`, `.xlsx` ou `.xls` (sem limite de linhas).
3. Na tela de mapeamento, escolha qual coluna do arquivo corresponde a cada campo do
   sistema (o sistema tenta adivinhar pelos nomes das colunas). Colunas sem
   correspondência podem ficar como "ignorar".
4. Clique em **Importar**. Datas em `dd/mm/aaaa`, valores como `R$ 1.500,00` e
   status/temperatura com acentos são normalizados automaticamente. Segmentos e
   plataformas novos são criados na hora.

Para exportar, use o botão **Exportar CSV** na mesma tela (exporta o que estiver filtrado).

## Páginas

| Rota | O que faz |
|---|---|
| `/` | Dashboard: leads ativos, reuniões dos próximos 7 dias, taxa de conversão, funil por status, follow-ups atrasados e fechamento mensal com comparativo ▲/▼ |
| `/kanban` | Tela principal: colunas por status com drag-and-drop. Soltar em "Reunião agendada" abre o seletor de data/hora; a 1ª saída de "Lead" confirma o 1º contato e sugere follow-ups (+4 dias e +6 dias depois), ajustáveis pelo toast |
| `/leads` | Tabela com todas as colunas, filtros (status, segmento, temperatura, plataforma, período), busca, edição inline, importação e exportação CSV |
| `/semana` | Visão semanal: navegação por setas, total da semana, leads contatados por dia com chips de segmento; clique num dia para expandir |
| `/playbook` | Scripts 100% editáveis por categoria. Botão "Copiar" substitui `[NOME]` pelo lead selecionado (vindo do card do Kanban ou do seletor no topo) |

## Estrutura de pastas

```
prisma/
  schema.prisma        # modelo de dados (leads, interações, opções, playbook)
  seed.ts              # conteúdo inicial do playbook + segmentos/plataformas
server/
  index.ts             # API Express local (porta 3001) — CRUD via Prisma
src/
  components/
    ui/                # componentes base (button, dialog, popover, accordion…)
    LeadCard.tsx       # card do Kanban (segmento, temperatura, dias sem contato, alerta)
    TemperatureSelector.tsx  # ❄️ / ☀️ / 🔥 com popover e animação
    StatusBadge.tsx
    PlaybookScriptCard.tsx
    NewLeadModal.tsx   # cadastro rápido (cola o link → extrai o @usuario)
    LeadDetailDialog.tsx
    ImportDialog.tsx   # importação CSV/Excel com mapeamento de colunas
    Toast.tsx
  pages/
    Dashboard.tsx  Kanban.tsx  LeadsTable.tsx  Weekly.tsx  Playbook.tsx
  store/DataContext.tsx  # estado global (leads, opções, playbook)
  lib/                   # tipos, API client, utilidades de lead/datas
```

## Identidade visual

Cores da marca (Tailwind): `cream #FFFCF2` (fundo), `ink #252422` (texto),
`paprika #E85E28` (ações/alerta de follow-up), `amber #FFBA08` (morno/urgência),
`charcoal #403D39` (secundário), `dust #CCC5B9` (divisores).

Fontes (Google Fonts, registradas no Tailwind): `font-heading` (Anton),
`font-serif-accent` (Playfair Display), `font-body` (Inter), `font-script` (Lobster).
