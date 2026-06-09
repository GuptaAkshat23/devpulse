import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGitHubAccessToken } from '@/lib/get-access-token'
import { getPRDiff, formatDiffForAI } from '@/lib/github-diff'
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { NextRequest, NextResponse } from 'next/server'

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }


  const body = await req.json()
  const { owner, repo, prNumber, prTitle } =
    typeof body.prompt === 'string' ? JSON.parse(body.prompt) : body

  if (!owner || !repo || !prNumber) {
    return new Response('Missing required fields', { status: 400 })
  }

  try {
    const accessToken = await getGitHubAccessToken(session.user.id)
    const files = await getPRDiff(accessToken, owner, repo, prNumber)
    const diff = formatDiffForAI(files)

    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: `You are an expert code reviewer. Analyze the given PR diff and respond with a JSON object in this exact format:
{
  "summary": "2-3 sentence summary of what this PR does",
  "riskLevel": "low",
  "riskReason": "one sentence explaining the risk level",
  "reviewPoints": [
    "specific actionable review comment 1",
    "specific actionable review comment 2"
  ],
  "positives": [
    "something done well in this PR"
  ]
}
riskLevel must be exactly one of: low, medium, high
Respond ONLY with the JSON object, no markdown, no extra text.`,
      messages: [
        {
          role: 'user',
          content: `PR Title: ${prTitle}\n\nDiff:\n${diff}`,
        },
      ],
    })

    return NextResponse.json({ result: text })
  } catch (error) {
    console.error('AI review error:', error)
    return new Response('Failed to generate review', { status: 500 })
  }
}