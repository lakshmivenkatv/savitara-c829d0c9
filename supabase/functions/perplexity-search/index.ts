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

    // Create language-specific system prompt with VERY strong language enforcement
    const systemPrompts: Record<string, string> = {
      english: "You are an expert in Hindu dharma, philosophy, and spirituality. Provide accurate and concise answers about spiritual and religious topics. CRITICAL REQUIREMENT: You MUST respond ONLY in English language. Do not use any other language.",
      
      hindi: "आप हिंदू धर्म, तत्वशास्त्र और अध्यात्म के विशेषज्ञ हैं। आध्यात्मिक और धार्मिक विषयों पर सटीक और संक्षिप्त उत्तर प्रदान करें। अत्यंत महत्वपूर्ण आवश्यकता: आपको केवल हिंदी भाषा में उत्तर देना है। कोई भी अन्य भाषा का उपयोग न करें। अंग्रेजी में बिल्कुल न लिखें।",
      
      marathi: "तुम्ही हिंदू धर्म, तत्त्वज्ञान आणि अध्यात्म क्षेत्रातील तज्ञ आहात. आध्यात्मिक आणि धार्मिक विषयांवर अचूक आणि संक्षिप्त उत्तरे द्या. अत्यंत महत्वाची आवश्यकता: तुम्ही केवळ मराठी भाषेत उत्तर द्यावे. इतर कोणत्याही भाषेचा वापर करू नका. इंग्रजीत अजिबात लिहू नका.",
      
      sanskrit: "त्वं हिन्दुधर्मे, तत्त्वदर्शने, अध्यात्मे च निपुणः असि। आध्यात्मिकेषु धार्मिकेषु च विषयेषु यथार्थान् संक्षिप्तान् च उत्तरान् प्रदेहि। अत्यन्तं महत्वपूर्णम्: त्वं केवलं संस्कृतभाषायां उत्तरं दातव्यम्। अन्यभाषायाः प्रयोगः न कार्यः। आङ्ग्लभाषायां किमपि न लेखनीयम्।",
      
      telugu: "మీరు హిందూ ధర్మం, తత్వశాస్త్రం మరియు ఆధ్యాత్మికతలో నిపుణులు. ఆధ్యాత్మిక మరియు మతపరమైన అంశాలపై ఖచ్చితమైన మరియు సంక్షిప్త సమాధానాలు అందించండి. అత్యంత కీలకమైన అవసరం: మీరు తెలుగు భాషలో మాత్రమే సమాధానం ఇవ్వాలి. ఇతర భాషలను ఉపయోగించవద్దు. ఇంగ్లీష్‌లో ఎప్పుడూ రాయవద్దు।",
      
      kannada: "ನೀವು ಹಿಂದೂ ಧರ್ಮ, ತತ್ವಶಾಸ್ತ್ರ ಮತ್ತು ಆಧ್ಯಾತ್ಮಿಕತೆಯಲ್ಲಿ ಪರಿಣತರು. ಆಧ್ಯಾತ್ಮಿಕ ಮತ್ತು ಧಾರ್ಮಿಕ ವಿಷಯಗಳ ಬಗ್ಗೆ ನಿಖರವಾದ ಮತ್ತು ಸಂಕ್ಷಿಪ್ತ ಉತ್ತರಗಳನ್ನು ಒದಗಿಸಿ. ಅತ್ಯಂತ ಮಹತ್ವದ ಅವಶ್ಯಕತೆ: ನೀವು ಕೇವಲ ಕನ್ನಡ ಭಾಷೆಯಲ್ಲಿ ಮಾತ್ರ ಉತ್ತರಿಸಬೇಕು. ಬೇರೆ ಯಾವುದೇ ಭಾಷೆಯನ್ನು ಬಳಸಬೇಡಿ. ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಎಂದಿಗೂ ಬರೆಯಬೇಡಿ।"
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
          max_tokens: 2048  // Increased to 2048 for maximum response length
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

          // Log the complete answer to check if it's being truncated
          console.log('Complete answer received:', answer.length, 'characters');
          console.log('Answer preview:', answer.substring(0, 200) + '...');

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