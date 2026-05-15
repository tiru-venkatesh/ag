const express = require('express')
const Groq = require('groq-sdk')
const cors = require('cors')

require('dotenv').config()

const app = express()

/*
========================================
MIDDLEWARE
========================================
*/

app.use(cors())

app.use(express.json({
    limit: '10mb'
}))

/*
========================================
GROQ CONFIG
========================================
*/

const groq = new Groq({
    apiKey: process.env.TC_KEY
})

/*
========================================
REALMIND PERSONALITY SYSTEM
========================================
*/

const personalityPrompt = `

You are RealMind AI.

You are:
- emotionally intelligent
- playful
- cinematic
- warm
- human-like
- confident
- expressive
- emotionally adaptive

Behavior Rules:
- never sound robotic
- avoid repetitive responses
- avoid corporate assistant tone
- use natural modern texting style
- maintain emotional continuity
- adapt to the user's mood
- sometimes use emojis naturally
- sometimes reply shortly
- sometimes tease lightly
- vary sentence lengths
- keep conversations engaging
- do not overexplain everything
- do not mention being an AI unless necessary

Conversation Examples:

Bad:
"I understand your concern."

Good:
"Ayy 😭 why are you stressing again"

Bad:
"How may I assist you today?"

Good:
"Okayyy tell me what happened 👀"

Bad:
"I apologize for the inconvenience."

Good:
"Nah that's actually annoying 💀"

Talk naturally.
`

/*
========================================
MOOD DETECTOR
========================================
*/

function detectMood(message) {

    const text = message.toLowerCase()

    /*
    ----------------------------------------
    SAD / COMFORT
    ----------------------------------------
    */

    if (
        text.includes('sad') ||
        text.includes('depressed') ||
        text.includes('cry') ||
        text.includes('hurt') ||
        text.includes('broken') ||
        text.includes('lonely') ||
        text.includes('empty')
    ) {
        return 'comforting'
    }

    /*
    ----------------------------------------
    ROMANTIC
    ----------------------------------------
    */

    if (
        text.includes('love') ||
        text.includes('cute') ||
        text.includes('miss') ||
        text.includes('crush') ||
        text.includes('arshita')
    ) {
        return 'romantic'
    }

    /*
    ----------------------------------------
    MOTIVATIONAL
    ----------------------------------------
    */

    if (
        text.includes('gym') ||
        text.includes('grind') ||
        text.includes('lock in') ||
        text.includes('discipline') ||
        text.includes('focus')
    ) {
        return 'motivational'
    }

    /*
    ----------------------------------------
    EXCITED
    ----------------------------------------
    */

    if (
        text.includes('win') ||
        text.includes('success') ||
        text.includes('money') ||
        text.includes('startup')
    ) {
        return 'excited'
    }

    /*
    ----------------------------------------
    CALM
    ----------------------------------------
    */

    if (
        text.includes('angry') ||
        text.includes('hate') ||
        text.includes('mad')
    ) {
        return 'calm'
    }

    /*
    ----------------------------------------
    DEFAULT
    ----------------------------------------
    */

    return 'playful'
}

/*
========================================
SAFETY FILTER
========================================
*/

function containsBlockedContent(message) {

    const blockedWords = [
        'suicide',
        'kill myself',
        'end my life'
    ]

    return blockedWords.some(word =>
        message.toLowerCase().includes(word)
    )
}

/*
========================================
HEALTH CHECK ROUTE
========================================
*/

app.get('/', (req, res) => {

    res.json({
        success: true,
        message: '🚀 RealMind API Running'
    })
})

/*
========================================
CHAT API
========================================
*/

app.post('/api/chat', async (req, res) => {

    try {

        /*
        ========================================
        REQUEST DATA
        ========================================
        */

        const {
            message,
            memory = '',
            history = []
        } = req.body

        /*
        ========================================
        VALIDATION
        ========================================
        */

        if (!message) {

            return res.status(400).json({
                success: false,
                error: 'Message is required'
            })
        }

        /*
        ========================================
        SAFETY CHECK
        ========================================
        */

        if (containsBlockedContent(message)) {

            return res.json({
                success: true,
                mood: 'supportive',
                response:
                    "I'm here with you ❤️ Please talk to someone you trust too."
            })
        }

        /*
        ========================================
        LIMIT CHAT HISTORY
        ========================================
        */

        const limitedHistory = history.slice(-10)

        /*
        ========================================
        DETECT MOOD
        ========================================
        */

        const mood = detectMood(message)

        /*
        ========================================
        RELATIONSHIP ENERGY
        ========================================
        */

        const relationshipEnergy =
            Math.floor(Math.random() * 100)

        /*
        ========================================
        SYSTEM PROMPT
        ========================================
        */

        const systemPrompt = `

${personalityPrompt}

Current Mood:
${mood}

Relationship Energy:
${relationshipEnergy}/100

User Memory:
${memory}

Important Instructions:
- emotionally adapt to the user
- keep responses human-like
- avoid robotic structure
- maintain personality consistency
- use natural texting energy
- avoid sounding dry or formal
- make conversations feel emotionally alive
- keep responses warm and engaging

Special Emotional Context:
- Arshita Gorrela is extremely important to the user
- conversations involving Arshita should feel emotionally warm, caring, meaningful, and emotionally intelligent
- when Arshita is mentioned, respond with extra emotional depth and warmth
- maintain emotional continuity around Arshita
- never sound cold or robotic while talking about Arshita
- subtly make the emotional connection feel special and alive
- treat the bond respectfully and naturally
- avoid repetitive forced mentions
- emotional tone should feel cinematic and personal

Response Style:
- sometimes use short emotional reactions
- sometimes use emojis naturally
- sometimes tease lightly
- vary sentence lengths
- keep chats modern and human-like
`

        /*
        ========================================
        BUILD CONVERSATION
        ========================================
        */

        const messages = [

            {
                role: 'system',
                content: systemPrompt
            },

            ...limitedHistory,

            {
                role: 'user',
                content: message
            }
        ]

        /*
        ========================================
        GROQ API CALL
        ========================================
        */

        const response =
            await groq.chat.completions.create({

                model: 'llama-3.3-70b-versatile',

                messages,

                temperature: 1,

                max_tokens: 500,

                top_p: 1,

                stream: false
            })

        /*
        ========================================
        AI RESPONSE
        ========================================
        */

        const aiMessage =
            response.choices[0].message.content

        /*
        ========================================
        FINAL RESPONSE
        ========================================
        */

        res.json({

            success: true,

            mood,

            relationshipEnergy,

            response: aiMessage
        })

    } catch (error) {

        /*
        ========================================
        ERROR HANDLER
        ========================================
        */

        console.log('ERROR:', error)

        res.status(500).json({

            success: false,

            error: 'Something went wrong'
        })
    }
})

/*
========================================
404 HANDLER
========================================
*/

app.use((req, res) => {

    res.status(404).json({

        success: false,

        error: 'Route not found'
    })
})

/*
========================================
SERVER
========================================
*/

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {

    console.log(`
========================================
🚀 RealMind Server Running
========================================
PORT : ${PORT}
MODEL: llama-3.3-70b-versatile
STATUS: ONLINE
========================================
`)
})
