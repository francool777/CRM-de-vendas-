import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Conteúdo inicial do playbook. A planilha original não estava disponível no
// repositório, então os textos abaixo são versões iniciais bem estruturadas —
// tudo é 100% editável pela tela /playbook (basta substituir pelo texto real).

const categorias: {
  nome: string
  ordem: number
  criavelPeloUsuario: boolean
  scripts: { titulo: string; conteudo: string; ordem: number }[]
}[] = [
  {
    nome: 'ICP',
    ordem: 1,
    criavelPeloUsuario: false,
    scripts: [
      {
        titulo: 'Perfil de Cliente Ideal (ICP)',
        ordem: 1,
        conteudo: `**Quem é o cliente ideal:**

- Clínicas e profissionais da saúde/estética (odontologia, dermatologia, estética, nutrição)
- Perfil ativo no Instagram, postando com frequência, mas com identidade visual amadora ou inconsistente
- Entre 1 mil e 50 mil seguidores (já investe em presença digital, mas ainda tem muito a ganhar)
- Atendimento particular / ticket médio que justifica investir em design

**Sinais de que vale abordar:**

- Posts com artes genéricas (Canva sem personalização) ou sem padrão de cores
- Bio confusa ou sem chamada para ação
- Stories frequentes (perfil vivo, dono presente)

**Sinais de que NÃO vale abordar:**

- Perfil parado há mais de 3 meses
- Já tem identidade visual claramente profissional e consistente
- Conta grande demais com equipe de marketing interna`,
      },
    ],
  },
  {
    nome: 'Script de Abordagem',
    ordem: 2,
    criavelPeloUsuario: false,
    scripts: [
      {
        titulo: '1ª mensagem',
        ordem: 1,
        conteudo: `Oi [NOME], tudo bem? 👋

Encontrei seu perfil aqui no Instagram e passei um tempo vendo seu conteúdo — dá pra ver o cuidado que você tem com o seu trabalho.

Eu sou designer e ajudo perfis como o seu a transformar essa qualidade em uma presença visual à altura: identidade consistente, posts que passam autoridade e um feed que converte seguidor em cliente.

Reparei em alguns pontos do seu perfil que dariam um salto rápido com pequenos ajustes. Posso te mandar 2 ou 3 observações rápidas, sem compromisso?`,
      },
    ],
  },
  {
    nome: 'Follow-up 1',
    ordem: 3,
    criavelPeloUsuario: false,
    scripts: [
      {
        titulo: 'Follow-up 1 (4 dias depois)',
        ordem: 1,
        conteudo: `Oi [NOME]! Passando aqui rapidinho 🙂

Sei que a rotina aí deve ser corrida, então só quero deixar de novo à disposição aquelas observações sobre o seu perfil que comentei — coisa de 2 minutos de leitura.

Se fizer sentido, é só me responder com um "pode mandar" que eu envio ainda hoje.`,
      },
    ],
  },
  {
    nome: 'Follow-up 2',
    ordem: 4,
    criavelPeloUsuario: false,
    scripts: [
      {
        titulo: 'Follow-up 2 (última tentativa)',
        ordem: 1,
        conteudo: `Oi [NOME], última mensagem pra não virar chato, prometo! 😄

Vou deixar a porta aberta: se em algum momento você quiser dar um upgrade na identidade visual do seu perfil e transformar mais seguidores em clientes, é só me chamar aqui.

Sucesso por aí! 🚀`,
      },
    ],
  },
  {
    nome: 'Objeções',
    ordem: 5,
    criavelPeloUsuario: false,
    scripts: [
      {
        titulo: 'Tá caro',
        ordem: 1,
        conteudo: `Entendo, [NOME]! E é justo pensar assim quando a gente enxerga design como custo.

Mas olha por esse ângulo: um único cliente novo que chegar pelo seu Instagram já paga o investimento — e a identidade fica sua pra sempre, em todos os posts.

O que eu posso fazer é montar um escopo enxuto pra começar (só o essencial de maior impacto) e a gente evolui conforme o retorno aparecer. Quer que eu monte essa versão?`,
      },
      {
        titulo: 'Vou pensar',
        ordem: 2,
        conteudo: `Claro, [NOME], sem pressa!

Só pra eu te ajudar a pensar: normalmente quando alguém me fala isso, é por um de três motivos — valor, momento, ou dúvida se vai dar resultado. Qual desses pesa mais pra você?

Assim consigo te dar uma resposta direta em vez de te deixar com a dúvida.`,
      },
      {
        titulo: 'Já tenho quem faça meus posts',
        ordem: 3,
        conteudo: `Que bom, [NOME]! Ter alguém cuidando disso já te coloca na frente de muita gente.

Meu trabalho entra numa camada diferente: não é só "fazer o post", é construir a identidade visual — o padrão de cores, tipografia e layout que faz qualquer post ser reconhecido como SEU em 1 segundo.

Inclusive, quem já produz seus posts trabalharia muito mais rápido com esse material em mãos. Posso te mostrar um antes/depois de um caso parecido?`,
      },
      {
        titulo: 'Agora não é um bom momento',
        ordem: 4,
        conteudo: `Tranquilo, [NOME], momento é tudo mesmo.

Posso te perguntar só uma coisa? Quando você imagina que seria o momento ideal — mês que vem, próximo trimestre?

Te pergunto porque posso te chamar de novo perto dessa data, já com uma proposta pronta, sem você precisar se preocupar com nada até lá.`,
      },
    ],
  },
  {
    nome: 'Perguntas-guia',
    ordem: 6,
    criavelPeloUsuario: false,
    scripts: [
      {
        titulo: 'Pergunta 1 — Origem dos clientes',
        ordem: 1,
        conteudo: `Hoje, de onde vêm a maioria dos seus clientes, [NOME]? Indicação, Instagram, Google...?

(Objetivo: entender o quanto o Instagram já é — ou pode ser — canal de aquisição.)`,
      },
      {
        titulo: 'Pergunta 2 — Percepção da marca',
        ordem: 2,
        conteudo: `Se um cliente ideal cair no seu perfil hoje, você sente que a primeira impressão está à altura do seu trabalho?

(Objetivo: fazer o lead verbalizar a dor da identidade visual atual.)`,
      },
      {
        titulo: 'Pergunta 3 — Objetivo com o perfil',
        ordem: 3,
        conteudo: `Qual é o principal objetivo do seu Instagram nos próximos meses: atrair mais pacientes/clientes, aumentar o ticket, ou fortalecer autoridade?

(Objetivo: ancorar a proposta no objetivo declarado pelo próprio lead.)`,
      },
    ],
  },
]

const segmentosIniciais = ['ODONTO', 'DERMATOLOGIA', 'ESTÉTICA']
const plataformasIniciais = ['Instagram', 'WhatsApp', 'LinkedIn']

async function main() {
  for (const nome of segmentosIniciais) {
    await prisma.opcaoSegmento.upsert({ where: { nome }, update: {}, create: { nome } })
  }
  for (const nome of plataformasIniciais) {
    await prisma.opcaoPlataforma.upsert({ where: { nome }, update: {}, create: { nome } })
  }

  const jaTemPlaybook = await prisma.playbookCategoria.count()
  if (jaTemPlaybook === 0) {
    for (const cat of categorias) {
      await prisma.playbookCategoria.create({
        data: {
          nome: cat.nome,
          ordem: cat.ordem,
          criavelPeloUsuario: cat.criavelPeloUsuario,
          scripts: { create: cat.scripts },
        },
      })
    }
  }

  console.log('Seed concluído: playbook, segmentos e plataformas iniciais.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
