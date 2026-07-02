import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '20mb' }))

const TEXT_FIELDS = [
  'nomePerfil',
  'linkPerfil',
  'plataformaContato',
  'segmentoNicho',
  'status',
  'temperatura',
  'observacoes',
] as const

const DATE_FIELDS = ['dataPrimeiroContato', 'followup1Data', 'followup2Data', 'dataReuniao'] as const

// Converte o corpo da requisição em dados aceitos pelo Prisma
// (datas chegam como string ISO ou null)
function parseLeadBody(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {}
  for (const k of TEXT_FIELDS) {
    if (k in body) data[k] = body[k] === '' ? null : body[k]
  }
  for (const k of DATE_FIELDS) {
    if (k in body) data[k] = body[k] ? new Date(String(body[k])) : null
  }
  if ('propostaEnviada' in body) data.propostaEnviada = Boolean(body.propostaEnviada)
  if ('valorProposta' in body) {
    const v = body.valorProposta
    data.valorProposta = v === null || v === '' || v === undefined ? null : Number(v)
  }
  return data
}

const leadInclude = { interacoes: { orderBy: { data: 'desc' as const } } }

// ---------- Leads ----------

app.get('/api/leads', async (_req, res) => {
  const leads = await prisma.lead.findMany({ include: leadInclude, orderBy: { criadoEm: 'desc' } })
  res.json(leads)
})

app.post('/api/leads', async (req, res) => {
  const data = parseLeadBody(req.body)
  if (!data.nomePerfil || !data.linkPerfil) {
    res.status(400).json({ error: 'nomePerfil e linkPerfil são obrigatórios' })
    return
  }
  const lead = await prisma.lead.create({ data: data as never, include: leadInclude })
  res.json(lead)
})

app.patch('/api/leads/:id', async (req, res) => {
  const id = Number(req.params.id)
  const data = parseLeadBody(req.body)
  const lead = await prisma.lead.update({ where: { id }, data: data as never, include: leadInclude })
  res.json(lead)
})

app.delete('/api/leads/:id', async (req, res) => {
  await prisma.lead.delete({ where: { id: Number(req.params.id) } })
  res.json({ ok: true })
})

// Exclusão em massa — usada pela seleção múltipla e pelo "excluir todos" na tabela de leads
app.delete('/api/leads', async (req, res) => {
  const ids: number[] = Array.isArray(req.body?.ids)
    ? req.body.ids.map(Number).filter((n: number) => !Number.isNaN(n))
    : []
  if (ids.length === 0) {
    res.status(400).json({ error: 'ids é obrigatório' })
    return
  }
  const { count } = await prisma.lead.deleteMany({ where: { id: { in: ids } } })
  res.json({ deleted: count })
})

// Importação em massa (CSV/Excel) — cria opções de segmento/plataforma novas automaticamente
app.post('/api/leads/import', async (req, res) => {
  const rows: Record<string, unknown>[] = req.body.rows ?? []
  let count = 0
  for (const row of rows) {
    const data = parseLeadBody(row)
    if (!data.nomePerfil && !data.linkPerfil) continue
    if (!data.nomePerfil) data.nomePerfil = String(data.linkPerfil)
    if (!data.linkPerfil) data.linkPerfil = ''
    if (data.segmentoNicho) {
      await prisma.opcaoSegmento.upsert({
        where: { nome: String(data.segmentoNicho) },
        update: {},
        create: { nome: String(data.segmentoNicho) },
      })
    }
    if (data.plataformaContato) {
      await prisma.opcaoPlataforma.upsert({
        where: { nome: String(data.plataformaContato) },
        update: {},
        create: { nome: String(data.plataformaContato) },
      })
    }
    await prisma.lead.create({ data: data as never })
    count++
  }
  res.json({ imported: count })
})

// ---------- Interações ----------

app.post('/api/leads/:id/interacoes', async (req, res) => {
  const leadId = Number(req.params.id)
  const { tipo, descricao, data } = req.body
  const interacao = await prisma.interacao.create({
    data: { leadId, tipo, descricao: descricao || null, data: data ? new Date(data) : new Date() },
  })
  res.json(interacao)
})

app.delete('/api/interacoes/:id', async (req, res) => {
  await prisma.interacao.delete({ where: { id: Number(req.params.id) } })
  res.json({ ok: true })
})

// ---------- Opções (segmentos / plataformas) ----------

app.get('/api/segmentos', async (_req, res) => {
  res.json(await prisma.opcaoSegmento.findMany({ orderBy: { nome: 'asc' } }))
})

app.post('/api/segmentos', async (req, res) => {
  const nome = String(req.body.nome ?? '').trim()
  if (!nome) {
    res.status(400).json({ error: 'nome é obrigatório' })
    return
  }
  const seg = await prisma.opcaoSegmento.upsert({ where: { nome }, update: {}, create: { nome } })
  res.json(seg)
})

app.get('/api/plataformas', async (_req, res) => {
  res.json(await prisma.opcaoPlataforma.findMany({ orderBy: { nome: 'asc' } }))
})

app.post('/api/plataformas', async (req, res) => {
  const nome = String(req.body.nome ?? '').trim()
  if (!nome) {
    res.status(400).json({ error: 'nome é obrigatório' })
    return
  }
  const plat = await prisma.opcaoPlataforma.upsert({ where: { nome }, update: {}, create: { nome } })
  res.json(plat)
})

// ---------- Playbook ----------

app.get('/api/playbook', async (_req, res) => {
  const categorias = await prisma.playbookCategoria.findMany({
    orderBy: { ordem: 'asc' },
    include: { scripts: { orderBy: { ordem: 'asc' } } },
  })
  res.json(categorias)
})

app.post('/api/playbook/categorias', async (req, res) => {
  const nome = String(req.body.nome ?? '').trim()
  if (!nome) {
    res.status(400).json({ error: 'nome é obrigatório' })
    return
  }
  const max = await prisma.playbookCategoria.aggregate({ _max: { ordem: true } })
  const cat = await prisma.playbookCategoria.create({
    data: { nome, ordem: (max._max.ordem ?? 0) + 1, criavelPeloUsuario: true },
  })
  res.json({ ...cat, scripts: [] })
})

app.delete('/api/playbook/categorias/:id', async (req, res) => {
  await prisma.playbookCategoria.delete({ where: { id: Number(req.params.id) } })
  res.json({ ok: true })
})

app.post('/api/playbook/scripts', async (req, res) => {
  const { categoriaId, titulo, conteudo } = req.body
  const max = await prisma.playbookScript.aggregate({
    _max: { ordem: true },
    where: { categoriaId: Number(categoriaId) },
  })
  const script = await prisma.playbookScript.create({
    data: {
      categoriaId: Number(categoriaId),
      titulo: String(titulo ?? 'Novo script'),
      conteudo: String(conteudo ?? ''),
      ordem: (max._max.ordem ?? 0) + 1,
    },
  })
  res.json(script)
})

app.patch('/api/playbook/scripts/:id', async (req, res) => {
  const { titulo, conteudo } = req.body
  const script = await prisma.playbookScript.update({
    where: { id: Number(req.params.id) },
    data: {
      ...(titulo !== undefined ? { titulo: String(titulo) } : {}),
      ...(conteudo !== undefined ? { conteudo: String(conteudo) } : {}),
    },
  })
  res.json(script)
})

app.delete('/api/playbook/scripts/:id', async (req, res) => {
  await prisma.playbookScript.delete({ where: { id: Number(req.params.id) } })
  res.json({ ok: true })
})

// Garante que as opções padrão sempre existam, mesmo que o seed não tenha
// rodado — assim os dropdowns de plataforma/segmento nunca aparecem vazios.
const PLATAFORMAS_PADRAO = ['Instagram', 'WhatsApp', 'LinkedIn']
const SEGMENTOS_PADRAO = ['ODONTO', 'DERMATOLOGIA', 'ESTÉTICA']

async function ensureDefaults() {
  for (const nome of PLATAFORMAS_PADRAO) {
    await prisma.opcaoPlataforma.upsert({ where: { nome }, update: {}, create: { nome } })
  }
  for (const nome of SEGMENTOS_PADRAO) {
    await prisma.opcaoSegmento.upsert({ where: { nome }, update: {}, create: { nome } })
  }
}

ensureDefaults()
  .catch((e) => console.error('Falha ao garantir opções padrão:', e))
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`API local rodando em http://localhost:${PORT}`)
    })
  })
