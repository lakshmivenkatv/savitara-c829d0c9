import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, language } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) {
      console.error('PERPLEXITY_API_KEY is not set');
      return new Response(
        JSON.stringify({ error: 'Perplexity API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching for:', message, 'in language:', language);

    // Create language-specific system prompt
    const systemPrompts: Record<string, string> = {
      hindi: "आपको हिंदू धर्म, दर्शन, और आध्यात्म के विषयों में विशेषज्ञता है। सटीक और संक्षिप्त उत्तर दें। हिंदी में उत्तर दें।",
      marathi: "तुम्ही हिंदू धर्म, तत्त्वज्ञान आणि अध्यात्म या विषयांमध्ये तज्ञ आहात। अचूक आणि संक्षिप्त उत्तर द्या। मराठीत उत्तर द्या।",
      english: "You are an expert in Hindu dharma, philosophy, and spirituality. Provide accurate and concise answers about spiritual and religious topics.",
      sanskrit: "त्वं हिन्दुधर्मे दर्शने च आध्यात्मे च विशेषज्ञः असि। सटीकं संक्षिप्तं च उत्तरं ददातु।",
      telugu: "మీరు హిందూ ధర్మం, తత్వశాస్త్రం మరియు ఆధ్యాత్మికతలో నిపుణులు. ఆధ్యాత్మిక మరియు మతపరమైన అంశాలపై ఖచ్చితమైన మరియు సంక్షిప్త సమాధానాలు అందించండి.",
      kannada: "ನೀವು ಹಿಂದೂ ಧರ್ಮ, ತತ್ವಶಾಸ್ತ್ರ ಮತ್ತು ಆಧ್ಯಾತ್ಮಿಕತೆಯಲ್ಲಿ ಪರಿಣತರು. ಆಧ್ಯಾತ್ಮಿಕ ಮತ್ತು ಧಾರ್ಮಿಕ ವಿಷಯಗಳ ಬಗ್ಗೆ ನಿಖರವಾದ ಮತ್ತು ಸಂಕ್ಷಿಪ್ತ ಉತ್ತರಗಳನ್ನು ಒದಗಿಸಿ."
    };

    const systemPrompt = systemPrompts[language] || systemPrompts.english;

    // Try different models in order of preference
    const models = [
      'llama-3.1-sonar-small-128k-online',
      'llama-3.1-sonar-large-128k-online',
      'sonar-small-online',
      'sonar-medium-online',
      'sonar'
    ];

    let lastError: string = '';
    
    for (const model of models) {
      try {
        console.log(`Trying model: ${model}`);
        
        const requestBody = {
          model: model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.2,
          max_tokens: 500
        };

        // Add online-specific parameters only for online models
        if (model.includes('online')) {
          Object.assign(requestBody, {
            return_images: false,
            return_related_questions: false,
            search_recency_filter: 'month'
          });
        }

        console.log('Request body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const responseText = await response.text();
        console.log(`Response for model ${model}:`, response.status, responseText);

        if (response.ok) {
          const data = JSON.parse(responseText);
          console.log('Perplexity response successful with model:', model);
          
          const answer = data.choices?.[0]?.message?.content;
          if (!answer) {
            throw new Error('No answer received from Perplexity');
          }

          return new Response(
            JSON.stringify({ answer }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          lastError = `${model}: ${response.status} - ${responseText}`;
          console.log(`Model ${model} failed:`, lastError);
          continue;
        }
      } catch (error) {
        lastError = `${model}: ${error.message}`;
        console.log(`Model ${model} error:`, error.message);
        continue;
      }
    }

    // If all models failed
    console.error('All Perplexity models failed. Last error:', lastError);
    throw new Error(`All Perplexity models failed. Last error: ${lastError}`);

  } catch (error) {
    console.error('Error in perplexity-search function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});