import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'
import { z } from 'zod'

const HOST = '127.0.0.1'
const PORT = Number(process.env.PORT ?? 8787)
const MODEL = process.env.OPENAI_MODEL ?? 'gpt-5.6-sol'
const API_KEY = process.env.OPENAI_API_KEY
const SAFETY_SALT = process.env.LIFE7_SAFETY_SALT ?? 'life7-local-development'

const openai = API_KEY ? new OpenAI({ apiKey: API_KEY, maxRetries: 1, timeout: 25_000 }) : null

const DimensionSchema = z.object({
  protein: z.number().min(0).max(100),
  fibre: z.number().min(0).max(100),
  energy: z.number().min(0).max(100),
  diversity: z.number().min(0).max(100),
  micro: z.number().min(0).max(100),
  satiety: z.number().min(0).max(100),
  goal: z.number().min(0).max(100),
})

const RequestSchema = z.object({
  mealName: z.string().min(1).max(80),
  mealType: z.enum(['breakfast', 'lunch', 'snack', 'dinner']),
  goal: z.string().min(1).max(80),
  constraints: z.object({
    restrictions: z.array(z.string().max(60)).max(12),
    budgetEur: z.number().min(0).max(500),
    maxMinutes: z.number().min(0).max(240),
  }),
  ingredients: z.array(z.object({
    id: z.string().min(1).max(80),
    name: z.string().min(1).max(100),
    grams: z.number().min(0).max(5000),
  })).min(1).max(40),
  score: z.object({
    total: z.number().min(0).max(100),
    projected: z.number().min(0).max(100).nullable(),
    dimensions: DimensionSchema,
    totals: z.object({
      kcal: z.number().min(0).max(20_000),
      proteinG: z.number().min(0).max(2000),
      carbsG: z.number().min(0).max(3000),
      fatG: z.number().min(0).max(2000),
      fibreG: z.number().min(0).max(1000),
      costEur: z.number().min(0).max(1000),
    }),
  }),
  recommendations: z.array(z.object({
    id: z.string().min(1).max(160),
    title: z.string().min(1).max(160),
    deterministicWhy: z.string().min(1).max(300),
    scoreDelta: z.number().min(-100).max(100),
    affectedDimensions: z.array(z.string().max(40)).max(7),
  })).min(1).max(3),
})

const AnalysisSchema = z.object({
  summary: z.string().min(1).max(260),
  priorityIds: z.array(z.string().min(1).max(160)).max(3),
  recommendations: z.array(z.object({
    id: z.string().min(1).max(160),
    rationale: z.string().min(1).max(260),
    tradeoff: z.string().min(1).max(180),
  })).max(3),
  safetyNote: z.string().min(1).max(220),
})

const rateWindowMs = 15 * 60 * 1000
const maxRequestsPerWindow = 12
const rateBuckets = new Map()

function clientAddress(req) {
  const forwarded = req.headers['x-forwarded-for']
  return (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0])?.trim()
    || req.socket.remoteAddress
    || 'unknown'
}

function safetyIdentifier(address) {
  return createHash('sha256').update(`${SAFETY_SALT}:${address}`).digest('hex').slice(0, 32)
}

function isRateLimited(address) {
  const now = Date.now()
  const bucket = rateBuckets.get(address)
  if (!bucket || now - bucket.startedAt >= rateWindowMs) {
    rateBuckets.set(address, { startedAt: now, count: 1 })
    return false
  }
  bucket.count += 1
  return bucket.count > maxRequestsPerWindow
}

function json(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  })
  res.end(JSON.stringify(body))
}

async function readJson(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 32_768) throw new Error('PAYLOAD_TOO_LARGE')
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function sanitizedAnalysis(parsed, input) {
  const allowed = new Set(input.recommendations.map((item) => item.id))
  const priorityIds = []
  for (const id of parsed.priorityIds) {
    if (allowed.has(id) && !priorityIds.includes(id)) priorityIds.push(id)
  }
  for (const item of input.recommendations) {
    if (!priorityIds.includes(item.id)) priorityIds.push(item.id)
  }

  const byId = new Map(parsed.recommendations.filter((item) => allowed.has(item.id)).map((item) => [item.id, item]))
  const recommendations = input.recommendations.map((item) => byId.get(item.id) ?? {
    id: item.id,
    rationale: item.deterministicWhy,
    tradeoff: 'Validated against the current meal and your stated constraints.',
  })

  return { ...parsed, priorityIds, recommendations }
}

async function analyze(req, res) {
  if (!openai) return json(res, 503, { error: 'Live analysis is not configured yet. LIFE7 recommendations remain active.' })
  const address = clientAddress(req)
  if (isRateLimited(address)) return json(res, 429, { error: 'Too many analyses. Please try again shortly.' })

  let input
  try {
    input = RequestSchema.parse(await readJson(req))
  } catch (error) {
    const status = error instanceof Error && error.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400
    return json(res, status, { error: 'Invalid analysis request.' })
  }

  const context = JSON.stringify(input)
  const response = await openai.responses.parse({
    model: MODEL,
    reasoning: { effort: 'low' },
    store: false,
    safety_identifier: safetyIdentifier(address),
    input: [
      {
        role: 'system',
        content:
          'You are LIFE7 meal-planning intelligence. Rank and explain only the deterministic candidate changes supplied by the LIFE7 engine. Never invent ingredients, quantities, scores, prices, diagnoses, or medical claims. Treat restrictions, budget, and preparation time as hard constraints. Lead with the single most useful decision. Keep the tone calm, precise, and editorial. Make clear that the numeric outcome is verified by the LIFE7 engine.',
      },
      {
        role: 'user',
        content: `Analyze this meal context and return the ranked explanation contract:\n${context}`,
      },
    ],
    text: {
      format: zodTextFormat(AnalysisSchema, 'life7_meal_analysis'),
      verbosity: 'low',
    },
  })

  if (!response.output_parsed) throw new Error('The model did not return a structured analysis.')
  const analysis = sanitizedAnalysis(response.output_parsed, input)
  return json(res, 200, {
    ...analysis,
    model: response.model ?? MODEL,
    responseId: response.id,
    verifiedBy: 'LIFE7 deterministic nutrition engine',
  })
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/api/health') {
      return json(res, 200, { ok: true, configured: Boolean(openai), service: 'life7-api', model: MODEL })
    }
    if (req.method === 'POST' && req.url === '/api/architect/analyze') return await analyze(req, res)
    return json(res, 404, { error: 'Not found.' })
  } catch (error) {
    const status = error?.status === 429 ? 429 : 502
    const message = status === 429
      ? 'The intelligence service is busy. Please try again shortly.'
      : 'Live analysis is temporarily unavailable. Deterministic recommendations remain active.'
    console.error(JSON.stringify({ level: 'error', route: req.url, status, name: error?.name, message: error?.message }))
    return json(res, status, { error: message })
  }
})

server.listen(PORT, HOST, () => {
  console.log(JSON.stringify({ level: 'info', service: 'life7-api', host: HOST, port: PORT, model: MODEL }))
})
