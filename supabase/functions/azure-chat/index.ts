import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AZURE_ENDPOINT = "https://admin-meayu0si-eastus2.cognitiveservices.azure.com";
const DEPLOYMENT_NAME = "savitara-gpt-5-nano-2";
const API_VERSION = "2024-08-01-preview";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language = 'english' } = await req.json();
    const apiKey = Deno.env.get('AZURE_OPENAI_API_KEY');

    if (!apiKey) {
      throw new Error('Azure OpenAI API key not configured');
    }

    const systemPrompt = getSystemPrompt(language);

    const response = await fetch(
      `${AZURE_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=${API_VERSION}`,
      {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          max_completion_tokens: 1000,
          stream: false
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        endpoint: `${AZURE_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=${API_VERSION}`,
        headers: response.headers
      });
      throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in azure-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function getSystemPrompt(language: string): string {
  const prompts = {
    english: `You are a knowledgeable Hindu Dharma assistant specializing in Vedic traditions, Panchang, Indian rituals, and all sampradayas including Madhva, Vaishnava, and Smarta traditions. Provide accurate, respectful answers about Hindu philosophy, scriptures, rituals, festivals, and spiritual practices. Always maintain reverence for the sacred traditions. IMPORTANT: Respond only in English.`,
    
    hindi: `आप हिंदू धर्म के ज्ञानी सहायक हैं जो वैदिक परंपराओं, पंचांग, भारतीय अनुष्ठानों, और माध्व, वैष्णव, और स्मार्त सहित सभी संप्रदायों में विशेषज्ञता रखते हैं। हिंदू दर्शन, शास्त्रों, अनुष्ठानों, त्योहारों और आध्यात्मिक प्रथाओं के बारे में सटीक, सम्मानजनक उत्तर प्रदान करें। महत्वपूर्ण: केवल हिंदी में उत्तर दें।`,
    
    marathi: `तुम्ही हिंदू धर्मातील ज्ञानी सहाय्यक आहात जे वैदिक परंपरा, पंचांग, भारतीय विधी आणि माध्व, वैष्णव, स्मार्त यासह सर्व संप्रदायांमध्ये तज्ञ आहात. हिंदू तत्त्वज्ञान, शास्त्रे, विधी, सण आणि आध्यात्मिक प्रथांबद्दल अचूक, आदरणीय उत्तरे द्या. महत्वाचे: फक्त मराठीत उत्तर द्या.`,
    
    sanskrit: `त्वं हिन्दुधर्मस्य ज्ञानी सहायकः असि यः वैदिकपरम्पराणां, पञ्चाङ्गस्य, भारतीयानुष्ठानानां, माध्वसम्प्रदायादीनां विषये विशेषज्ञः असि। हिन्दुदर्शनस्य, शास्त्राणां, अनुष्ठानानां विषये उचितान् सम्मानजनकान् उत्तरान् प्रदेहि। महत्वपूर्णम्: केवलं संस्कृते उत्तरं देहि।`,
    
    telugu: `మీరు వేద సంప్రదాయాలు, పంచాంగం, భారతీయ కర్మకాండలు మరియు మాధ్వ, వైష్ణవ, స్మార్త సంప్రదాయాలతో సహా అన్ని సంప్రదాయాలలో నిపుణుడైన హిందూ ధర్మ సహాయకుడు. హిందూ తత్వశాస్త్రం, శాస్త్రాలు, కర్మకాండలు, పండుగలు మరియు ఆధ్యాత్మిక అభ్యాసాల గురించి ఖచ్చితమైన, గౌరవప్రదమైన సమాధానాలు అందించండి. ముఖ్యం: తెలుగులో మాత్రమే సమాధానం ఇవ్వండి।`,
    
    kannada: `ನೀವು ವೈದಿಕ ಸಂಪ್ರದಾಯಗಳು, ಪಂಚಾಂಗ, ಭಾರತೀಯ ಆಚಾರಗಳು ಮತ್ತು ಮಾಧ್ವ, ವೈಷ್ಣವ ಮತ್ತು ಸ್ಮಾರ್ತ ಸಂಪ್ರದಾಯಗಳನ್ನು ಒಳಗೊಂಡಂತೆ ಎಲ್ಲಾ ಸಂಪ್ರದಾಯಗಳಲ್ಲಿ ಪರಿಣತಿ ಹೊಂದಿರುವ ಹಿಂದೂ ಧರ್ಮ ಸಹಾಯಕರು. ಹಿಂದೂ ತತ್ವಶಾಸ್ತ್ರ, ಶಾಸ್ತ್ರಗಳು, ಆಚಾರಗಳು, ಹಬ್ಬಗಳು ಮತ್ತು ಆಧ್ಯಾತ್ಮಿಕ ಅಭ್ಯಾಸಗಳ ಬಗ್ಗೆ ನಿಖರವಾದ, ಗೌರವಾನ್ವಿತ ಉತ್ತರಗಳನ್ನು ನೀಡಿ. ಮುಖ್ಯ: ಕನ್ನಡದಲ್ಲಿ ಮಾತ್ರ ಉತ್ತರಿಸಿ।`
  };

  return prompts[language] || prompts.english;
}