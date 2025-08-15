import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Cpu, Cloud } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { EngineSelector } from './EngineSelector';
import { DocumentUpload } from './DocumentUpload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { indicNLP } from '@/utils/indicNLP';
import { documentProcessor } from '@/utils/documentProcessor';
import { useIsMobile } from '@/hooks/use-mobile';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatInterfaceProps {
  engine?: string;
  onEngineChange?: (engine: string) => void;
  onDocumentsProcessed?: () => void;
  documentsProcessedCount?: number;
}

export const ChatInterface = ({ 
  engine: externalEngine, 
  onEngineChange, 
  onDocumentsProcessed,
  documentsProcessedCount 
}: ChatInterfaceProps = {}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('english');
  const [engine, setEngine] = useState(externalEngine || 'azure');
  const [isInitializingIndic, setIsInitializingIndic] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Sync external engine state
  React.useEffect(() => {
    if (externalEngine && externalEngine !== engine) {
      setEngine(externalEngine);
    }
  }, [externalEngine, engine]);

  // Handle engine changes
  const handleEngineChange = (newEngine: string) => {
    setEngine(newEngine);
    if (onEngineChange) {
      onEngineChange(newEngine);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize Indic NLP when engine switches to indic
  useEffect(() => {
    if (engine === 'indic' && !isInitializingIndic) {
      setIsInitializingIndic(true);
      toast({
        title: "Loading Advanced AI Engine",
        description: "Initializing multilingual BERT model for better contextual understanding...",
      });
      
      indicNLP.initialize()
        .then(() => {
          toast({
            title: "Advanced Indic NLP Ready",
            description: "Enhanced contextual AI engine with document learning is now active",
          });
        })
        .catch((error) => {
          console.error('Failed to initialize Indic NLP:', error);
          toast({
            title: "Engine Loading Issue",
            description: "Using enhanced template system with document context as fallback",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsInitializingIndic(false);
        });
    }
  }, [engine, toast, isInitializingIndic]);

  // Handle document processing updates
  const handleDocumentsProcessed = useCallback(async () => {
    // The document processor will automatically reload from database when needed
    console.log('Documents updated, clearing local cache');
    documentProcessor.clearDocuments();
    if (onDocumentsProcessed) {
      onDocumentsProcessed();
    }
  }, [onDocumentsProcessed]);

  // Function to validate if question is related to Hindu Dharma
  const isHinduDharmaRelated = (question: string): boolean => {
    const hinduDharmaKeywords = [
      // Core concepts
      'dharma', 'vedic', 'veda', 'vedas', 'hindu', 'hinduism', 'sanatan', 'sanatana',
      'sampradaya', 'tradition', 'ritual', 'ceremony', 'puja', 'yajna', 'yagna',
      'mantra', 'shloka', 'sanskrit', 'yoga', 'meditation', 'dhyana',
      
      // Scriptures and texts
      'ramayana', 'mahabharata', 'bhagavad', 'gita', 'purana', 'puranas',
      'upanishad', 'upanishads', 'smriti', 'shruti', 'agama', 'tantra',
      
      // Specific scriptures and texts
      'vishnu', 'purana', 'shiva', 'purana', 'brahma', 'purana', 'skanda',
      'garuda', 'varaha', 'kurma', 'matsya', 'vamana', 'narada', 'markandeya',
      'brahmanda', 'bhavishya', 'linga', 'padma', 'agni', 'vayu', 'bhagavata',
      'isha', 'kena', 'katha', 'prashna', 'mundaka', 'mandukya', 'taittiriya',
      'aitareya', 'chandogya', 'brihadaranyaka', 'svetasvatara', 'kaushitaki',
      
      // Itihasas and Kavyas
      'itihasa', 'itihasas', 'epic', 'kavya', 'kavyas', 'raghuvamsha',
      'kumarasambhava', 'meghaduta', 'ritusamhara', 'kalidasa', 'bhartrhari',
      'jayadeva', 'gita', 'govinda', 'gitagovinda', 'kadamba', 'kadambas',
      
      // Samhitas and Vedic texts
      'samhita', 'samhitas', 'rig', 'sama', 'yajur', 'atharva', 'brahmana',
      'aranyaka', 'kalpa', 'sutra', 'grihya', 'dharma', 'shrauta',
      
      // Vedic hymns and mantras
      'purusha', 'suktam', 'sukta', 'hymn', 'shri', 'rudram', 'chamakam',
      'gayatri', 'mahamrityunjaya', 'vishnu', 'sahasranama', 'lalita',
      'sahasranama', 'hanuman', 'chalisa', 'aditya', 'hridayam', 'durga',
      'kavach', 'stotram', 'stotra', 'ashtak', 'ashtakam', 'aarti', 'bhajan',
      'mantra', 'shloka', 'sloka', 'verse', 'chant', 'recitation', 'parayana',
      
      // Prayers and devotional practices
      'prayer', 'prayers', 'prarthana', 'supplication', 'invocation', 'vandana',
      'namaskara', 'prostration', 'aradhana', 'upasana', 'bhakti', 'devotion',
      'sandhya', 'vandanam', 'nitya', 'karma', 'daily', 'routine', 'worship',
      
      // Madhva sampradaya scriptures and texts
      'madhva', 'madhwa', 'dvaita', 'raghavendra', 'stotram', 'rayaru',
      'anuvyakhyana', 'brahma', 'sutra', 'bhashya', 'gita', 'bhashya',
      'bhagavata', 'tatparya', 'nirnaya', 'mahabharata', 'tatparya', 'nirnaya',
      'vishnu', 'tattva', 'vinirnaya', 'karma', 'nirnaya', 'pramana', 'lakshana',
      'upadhi', 'khandana', 'mayavada', 'khandana', 'tattvodyota', 'nyayavivarana',
      'anu', 'taratamya', 'stotra', 'dvadasha', 'stotra', 'narasimha', 'nakha',
      'raghavendra', 'vijaya', 'guru', 'raghavendra', 'charitra', 'mantralaya',
      'panchamukhi', 'hanuman', 'kavach', 'vayu', 'stuti', 'hari', 'vayu', 'stuti',
      
      // Deities and divine
      'krishna', 'rama', 'shiva', 'vishnu', 'brahma', 'devi', 'ganesha',
      'hanuman', 'lakshmi', 'saraswati', 'durga', 'kali', 'parvati',
      'indra', 'surya', 'yama', 'vayu', 'bhagavan', 'bhagwan', 'ishwar', 'paramatma',
      'kesava', 'keshava', 'govinda', 'madhava', 'narayana', 'vasudeva',
      'nama', 'nam', 'namam', 'japa', 'kirtan', 'bhajan', 'chanting',
      
      // Festivals and observances
      'diwali', 'deepavali', 'holi', 'navratri', 'dussehra', 'dasara', 'dussera', 'janmashtami', 'shivaratri',
      'karva', 'chauth', 'ekadashi', 'amavasya', 'purnima', 'vrat', 'vratam',
      'chaturmasya', 'caturmasya', 'sankranti', 'makar', 'sankrant', 'uttarayan',
      'pongal', 'bihu', 'baisakhi', 'onam', 'gudi', 'padwa', 'ugadi',
      'mukkoti', 'vaikunta', 'mokshada', 'nirjala', 'devshayani', 'prabodhini',
      'vijaya', 'dasami', 'dashami', 'ashatami', 'ashtami', 'maha', 'navami',
      
      // Vratas and religious observances
      'teej', 'hartalika', 'navaratri', 'durga', 'kali', 'lakshmi', 'saraswati',
      'vinayaka', 'chaturthi', 'gokulashtami', 'rama', 'navami', 'vijaya', 'dashami',
      'pradosh', 'masik', 'shivaratri', 'mahashivaratri', 'sawan', 'shravan',
      'monday', 'somvar', 'mangalwar', 'tuesday', 'thursday', 'brihaspativar',
      'friday', 'shukravar', 'saturday', 'shanivar', 'fast', 'fasting', 'upvas',
      'solah', 'somvar', 'mangala', 'gauri', 'santoshi', 'mata', 'jagran',
      'jagrata', 'aarti', 'puja', 'archana', 'abhishek', 'rudrabhishek',
      
      // Vedic Astrology and Jyotish
      'jyotish', 'astrology', 'horoscope', 'kundli', 'kundali', 'birth', 'chart',
      'panchang', 'tithi', 'vara', 'nakshatra', 'yoga', 'karana', 'muhurat',
      'planets', 'graha', 'sun', 'surya', 'moon', 'chandra', 'mars', 'mangal',
      'mercury', 'budh', 'jupiter', 'guru', 'brihaspati', 'venus', 'shukra',
      'saturn', 'shani', 'rahu', 'ketu', 'zodiac', 'rashi', 'sign',
      'aries', 'mesha', 'taurus', 'vrishabha', 'gemini', 'mithuna',
      'cancer', 'karka', 'leo', 'simha', 'virgo', 'kanya', 'libra', 'tula',
      'scorpio', 'vrishchika', 'sagittarius', 'dhanu', 'capricorn', 'makara',
      'aquarius', 'kumbha', 'pisces', 'meena', 'lagna', 'ascendant', 'house',
      'bhava', 'dasha', 'antardasha', 'mahadasha', 'transit', 'gochar',
      'manglik', 'kuja', 'dosha', 'yoga', 'raj', 'gaja', 'kesari', 'neecha',
      'uchcha', 'exalted', 'debilitated', 'combust', 'retrograde', 'vakri',
      'gemstone', 'ratna', 'rudraksha', 'yantra', 'remedy', 'upay', 'donation',
      
      // Philosophical concepts
      'karma', 'moksha', 'samsara', 'atman', 'brahman', 'ahimsa',
      'dharana', 'samadhi', 'pranayama', 'asana', 'chakra',
      
      // Practices and customs
      'ashram', 'guru', 'disciple', 'satsang', 'bhajan', 'kirtan',
      'pilgrimage', 'tirtha', 'yatra', 'kumbh', 'ganga', 'ganges',
      'ayurveda', 'jyotish', 'astrology', 'vastu',
      
      // Religious institutions and monasteries
      'math', 'matha', 'mutt', 'monastery', 'uttaradi', 'dvaita', 'advaita',
      'madhva', 'shankara', 'ramanuja', 'chaitanya', 'iskcon', 'arya samaj',
      
      // Life stages and social
      'grihastha', 'brahmachari', 'vanaprastha', 'sannyasa',
      'varna', 'ashrama', 'samskar', 'sanskar',
      
      // Languages and cultural
      'tamil', 'telugu', 'kannada', 'malayalam', 'bengali', 'gujarati',
      'marathi', 'punjabi', 'oriya', 'assamese', 'hindi'
    ];

    const questionLower = question.toLowerCase();
    
    // Check if question contains any Hindu Dharma related keywords
    const hasKeywords = hinduDharmaKeywords.some(keyword => 
      questionLower.includes(keyword)
    );
    
    // Additional pattern matching for Indian cultural context
    const culturalPatterns = [
      /\b(indian|bharat|hindustan)\s+(culture|tradition|custom|ritual)/i,
      /\b(spiritual|religious)\s+(practice|tradition|custom)/i,
      /\b(ancient|traditional)\s+(indian|hindu|vedic)/i,
      /\b(temple|mandir|shrine)/i,
      /\b(priest|pandit|acharya|swami|maharaj)/i,
      /\b(blessing|bless|grace|divine)/i
    ];
    
    const hasPatterns = culturalPatterns.some(pattern => pattern.test(question));
    
    return hasKeywords || hasPatterns;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Validate if question is related to Hindu Dharma
      if (!isHinduDharmaRelated(currentInput)) {
        const getOffTopicResponse = (lang: string): string => {
          const responses = {
            english: `🙏 Namaste! I'm specifically designed to help with questions about Hindu Dharma, Vedic traditions, rituals, sampradayas, and related spiritual wisdom.

Your question seems to be outside this scope. I'd be happy to help you with:
• Vedic scriptures and their teachings
• Hindu festivals and their significance  
• Spiritual practices and rituals
• Sampradayas and traditions
• Dharmic philosophy and concepts
• Sanskrit texts and mantras

Please feel free to ask anything related to Hindu Dharma, and I'll do my best to provide helpful guidance! 🕉️`,

            hindi: `🙏 नमस्ते! मैं विशेष रूप से हिंदू धर्म, वैदिक परंपराओं, अनुष्ठानों, संप्रदायों और संबंधित आध्यात्मिक ज्ञान के बारे में प्रश्नों में सहायता करने के लिए बनाया गया हूं।

आपका प्रश्न इस क्षेत्र से बाहर लगता है। मैं आपकी सहायता करने में खुश हूंगा:
• वैदिक शास्त्र और उनकी शिक्षाएं
• हिंदू त्योहार और उनका महत्व
• आध्यात्मिक प्रथाएं और अनुष्ठान
• संप्रदाय और परंपराएं
• धार्मिक दर्शन और अवधारणाएं
• संस्कृत ग्रंथ और मंत्र

कृपया हिंदू धर्म से संबंधित कुछ भी पूछने में संकोच न करें, मैं सहायक मार्गदर्शन प्रदान करने की पूरी कोशिश करूंगा! 🕉️`,

            tamil: `🙏 வணக்கம்! நான் குறிப்பாக இந்து தர்மம், வேத மரபுகள், சடங்குகள், சம்பிரதாயங்கள் மற்றும் தொடர்புடைய ஆன்மீக ஞானம் பற்றிய கேள்விகளுக்கு உதவ வடிவமைக்கப்பட்டுள்ளேன்.

உங்கள் கேள்வி இந்த எல்லைக்கு வெளியே இருப்பது போல் தெரிகிறது. நான் உங்களுக்கு உதவ மகிழ்ச்சியாக இருப்பேன்:
• வேத நூல்கள் மற்றும் அவற்றின் போதனைகள்
• இந்து திருவிழாங்கள் மற்றும் அவற்றின் முக்கியத்துவம்
• ஆன்மீக நடைமுறைகள் மற்றும் சடங்குகள்
• சம்பிரதாயங்கள் மற்றும் மரபுகள்
• தர்ம தத்துவம் மற்றும் கருத்துக்கள்
• சமஸ்கிருத நூல்கள் மற்றும் மந்திரங்கள்

தயவுசெய்து இந்து தர்மம் தொடர்பான எதையும் கேட்க தயங்க வேண்டாம், நான் பயனுள்ள வழிகாட்டுதலை வழங்க முயல்வேன்! 🕉️`,

            telugu: `🙏 నమస్కారం! నేను ప్రత్యేకంగా హిందూ ధర్మం, వేద సంప్రదాయాలు, ఆచారాలు, సంప్రదాయాలు మరియు సంబంధిత ఆధ్యాత్మిక జ్ఞానం గురించిన ప్రశ్నలకు సహాయం చేయడానికి రూపొందించబడ్డాను.

మీ ప్రశ్న ఈ పరిధికి వెలుపల ఉన్నట్లు కనిపిస్తోంది. నేను మీకు సహాయం చేయడంలో సంతోషిస్తాను:
• వేద గ్రంథాలు మరియు వాటి బోధనలు
• హిందూ పండుగలు మరియు వాటి ప్రాముఖ్యత
• ఆధ్యాత్మిక అభ్యాసాలు మరియు ఆచారాలు
• సంప్రదాయాలు మరియు సంప్రదాయాలు
• ధర్మ తత్వశాస్త్రం మరియు భావనలు
• సంస్కృత గ్రంథాలు మరియు మంత్రాలు

దయచేసి హిందూ ధర్మానికి సంబంధించిన ఏదైనా అడగడానికి సంకోచించకండి, నేను సహాయకరమైన మార్గదర్శకత్వం అందించడానికి నా వంతు కృషి చేస్తాను! 🕉️`,

            kannada: `🙏 ನಮಸ್ಕಾರ! ನಾನು ವಿಶೇಷವಾಗಿ ಹಿಂದೂ ಧರ್ಮ, ವೈದಿಕ ಸಂಪ್ರದಾಯಗಳು, ಆಚಾರಗಳು, ಸಂಪ್ರದಾಯಗಳು ಮತ್ತು ಸಂಬಂಧಿತ ಆಧ್ಯಾತ್ಮಿಕ ಜ್ಞಾನದ ಬಗ್ಗೆ ಪ್ರಶ್ನೆಗಳಿಗೆ ಸಹಾಯ ಮಾಡಲು ವಿನ್ಯಾಸಗೊಳಿಸಲಾಗಿದೆ.

ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಈ ವ್ಯಾಪ್ತಿಯ ಹೊರಗಿದೆ ಎಂದು ತೋರುತ್ತದೆ. ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ಸಂತೋಷಪಡುತ್ತೇನೆ:
• ವೈದಿಕ ಗ್ರಂಥಗಳು ಮತ್ತು ಅವುಗಳ ಬೋಧನೆಗಳು
• ಹಿಂದೂ ಹಬ್ಬಗಳು ಮತ್ತು ಅವುಗಳ ಮಹತ್ವ
• ಆಧ್ಯಾತ್ಮಿಕ ಅಭ್ಯಾಸಗಳು ಮತ್ತು ಆಚಾರಗಳು
• ಸಂಪ್ರದಾಯಗಳು ಮತ್ತು ಸಂಪ್ರದಾಯಗಳು
• ಧರ್ಮ ತತ್ವಶಾಸ್ತ್ರ ಮತ್ತು ಪರಿಕಲ್ಪನೆಗಳು
• ಸಂಸ್ಕೃತ ಗ್ರಂಥಗಳು ಮತ್ತು ಮಂತ್ರಗಳು

ದಯವಿಟ್ಟು ಹಿಂದೂ ಧರ್ಮಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಯಾವುದನ್ನಾದರೂ ಕೇಳಲು ಮುಜುಗರಪಡಬೇಡಿ, ನಾನು ಸಹಾಯಕ ಮಾರ್ಗದರ್ಶನ ನೀಡಲು ಪ್ರಯತ್ನಿಸುತ್ತೇನೆ! 🕉️`,

            malayalam: `🙏 നമസ്കാരം! ഞാൻ പ്രത്യേകമായി ഹിന്ദു ധർമ്മം, വൈദിക പാരമ്പര്യങ്ങൾ, ആചാരങ്ങൾ, സമ്പ്രദായങ്ങൾ, അനുബന്ധ ആത്മീയ ജ്ഞാനം എന്നിവയെക്കുറിച്ചുള്ള ചോദ്യങ്ങൾക്ക് സഹായിക്കാൻ രൂപകൽപ്പന ചെയ്തിട്ടുള്ളതാണ്.

നിങ്ങളുടെ ചോദ്യം ഈ പരിധിക്ക് പുറത്തുള്ളതായി തോന്നുന്നു. ഞാൻ നിങ്ങളെ സഹായിക്കാൻ സന്തോഷിക്കുന്നു:
• വൈദിക ഗ്രന്ഥങ്ങളും അവയുടെ പഠിപ്പിക്കലുകളും
• ഹിന്ദു ഉത്സവങ്ങളും അവയുടെ പ്രാധാന്യവും
• ആത്മീയ അഭ്യാസങ്ങളും ആചാരങ്ങളും
• സമ്പ്രദായങ്ങളും പാരമ്പര്യങ്ങളും
• ധർമ്മ ദർശനവും ആശയങ്ങളും
• സംസ്കൃത ഗ്രന്ഥങ്ങളും മന്ത്രങ്ങളും

ദയവായി ഹിന്ദു ധർമ്മവുമായി ബന്ധപ്പെട്ട എന്തും ചോദിക്കാൻ മടിക്കരുത്, ഞാൻ സഹായകരമായ മാർഗ്ഗനിർദ്ദേശം നൽകാൻ ശ്രമിക്കും! 🕉️`,

            bengali: `🙏 নমস্কার! আমি বিশেষভাবে হিন্দু ধর্ম, বৈদিক ঐতিহ্য, আচার-অনুষ্ঠান, সম্প্রদায় এবং সংশ্লিষ্ট আধ্যাত্মিক জ্ঞান সম্পর্কে প্রশ্নগুলিতে সহায়তা করার জন্য ডিজাইন করা হয়েছে।

আপনার প্রশ্নটি এই সীমার বাইরে বলে মনে হচ্ছে। আমি আপনাকে সাহায্য করতে খুশি হব:
• বৈদিক শাস্ত্র এবং তাদের শিক্ষা
• হিন্দু উৎসব এবং তাদের তাৎপর্য
• আধ্যাত্মিক অনুশীলন এবং আচার
• সম্প্রদায় এবং ঐতিহ্য
• ধর্মীয় দর্শন এবং ধারণা
• সংস্কৃত গ্রন্থ এবং মন্ত্র

অনুগ্রহ করে হিন্দু ধর্মের সাথে সম্পর্কিত যেকোনো কিছু জিজ্ঞাসা করতে দ্বিধা করবেন না, আমি সহায়ক নির্দেশনা প্রদানের জন্য আমার সেরা চেষ্টা করব! 🕉️`,

            gujarati: `🙏 નમસ્તે! હું ખાસ કરીને હિન્દુ ધર્મ, વૈદિક પરંપરાઓ, ધાર્મિક વિધિઓ, સંપ્રદાયો અને સંબંધિત આધ્યાત્મિક જ્ઞાન વિશેના પ્રશ્નોમાં મદદ કરવા માટે બનાવાયેલ છું.

તમારો પ્રશ્ન આ ક્ષેત્રની બહાર લાગે છે. હું તમારી મદદ કરવામાં ખુશ થઈશ:
• વૈદિક શાસ્ત્રો અને તેમના શિક્ષણો
• હિન્દુ તહેવારો અને તેમનું મહત્વ
• આધ્યાત્મિક પ્રથાઓ અને વિધિઓ
• સંપ્રદાયો અને પરંપરાઓ
• ધર્મ દર્શન અને ખ્યાલો
• સંસ્કૃત ગ્રંથો અને મંત્રો

કૃપા કરીને હિન્દુ ધર્મ સંબંધિત કંઈપણ પૂછવામાં સંકોચ ન કરો, હું મદદરૂપ માર્ગદર્શન આપવાનો શ્રેષ્ઠ પ્રયાસ કરીશ! 🕉️`,

            marathi: `🙏 नमस्कार! मी विशेषतः हिंदू धर्म, वैदिक परंपरा, विधी, संप्रदाय आणि संबंधित आध्यात्मिक ज्ञान याविषयीच्या प्रश्नांमध्ये मदत करण्यासाठी तयार केले आहे.

तुमचा प्रश्न या व्याप्तीच्या बाहेर वाटतो. मी तुम्हाला मदत करण्यास आनंदित आहे:
• वैदिक शास्त्रे आणि त्यांची शिकवण
• हिंदू सण आणि त्यांचे महत्त्व
• आध्यात्मिक प्रथा आणि विधी
• संप्रदाय आणि परंपरा
• धर्म तत्त्वज्ञान आणि संकल्पना
• संस्कृत ग्रंथ आणि मंत्र

कृपया हिंदू धर्माशी संबंधित काहीही विचारण्यास संकोच करू नका, मी सहाय्यक मार्गदर्शन देण्याचा सर्वोत्तम प्रयत्न करेन! 🕉️`,

            punjabi: `🙏 ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਖਾਸ ਤੌਰ 'ਤੇ ਹਿੰਦੂ ਧਰਮ, ਵੈਦਿਕ ਪਰੰਪਰਾਵਾਂ, ਰੀਤੀ-ਰਿਵਾਜਾਂ, ਸੰਪ੍ਰਦਾਇਆਂ ਅਤੇ ਸੰਬੰਧਿਤ ਆਧਿਆਤਮਿਕ ਗਿਆਨ ਬਾਰੇ ਸਵਾਲਾਂ ਵਿੱਚ ਮਦਦ ਕਰਨ ਲਈ ਤਿਆਰ ਕੀਤਾ ਗਿਆ ਹਾਂ।

ਤੁਹਾਡਾ ਸਵਾਲ ਇਸ ਦਾਇਰੇ ਤੋਂ ਬਾਹਰ ਲਗਦਾ ਹੈ। ਮੈਂ ਤੁਹਾਡੀ ਮਦਦ ਕਰਨ ਵਿੱਚ ਖੁਸ਼ ਹੋਵਾਂਗਾ:
• ਵੈਦਿਕ ਸ਼ਾਸਤਰ ਅਤੇ ਉਨ੍ਹਾਂ ਦੀਆਂ ਸਿੱਖਿਆਵਾਂ
• ਹਿੰਦੂ ਤਿਉਹਾਰ ਅਤੇ ਉਨ੍ਹਾਂ ਦਾ ਮਹੱਤਵ
• ਆਧਿਆਤਮਿਕ ਅਭਿਆਸ ਅਤੇ ਰੀਤੀ-ਰਿਵਾਜ
• ਸੰਪ੍ਰਦਾਇਆਂ ਅਤੇ ਪਰੰਪਰਾਵਾਂ
• ਧਰਮ ਦਰਸ਼ਨ ਅਤੇ ਸੰਕਲਪਨਾਵਾਂ
• ਸੰਸਕ੍ਰਿਤ ਗ੍ਰੰਥ ਅਤੇ ਮੰਤਰ

ਕਿਰਪਾ ਕਰਕੇ ਹਿੰਦੂ ਧਰਮ ਨਾਲ ਸੰਬੰਧਿਤ ਕੋਈ ਵੀ ਗੱਲ ਪੁੱਛਣ ਤੋਂ ਝਿਜਕੋ ਨਾ, ਮੈਂ ਮਦਦਗਾਰ ਮਾਰਗਦਰਸ਼ਨ ਦੇਣ ਦੀ ਪੂਰੀ ਕੋਸ਼ਿਸ਼ ਕਰਾਂਗਾ! 🕉️`
          };
          
          return responses[lang as keyof typeof responses] || responses.english;
        };

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: getOffTopicResponse(language),
          role: 'assistant',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      let assistantContent: string;

      if (engine === 'indic') {
        // Use Indic NLP engine
        assistantContent = await indicNLP.generateResponse(currentInput, {
          language,
          context: messages.slice(-2).map(m => `${m.role}: ${m.content}`).join('\n')
        });
      } else {
        // Use Azure OpenAI
        const { data, error } = await supabase.functions.invoke('azure-chat', {
          body: {
            messages: [{ role: 'user', content: currentInput }],
            language
          }
        });

        if (error) throw error;
        assistantContent = data.message;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: assistantContent,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: `Failed to send message using ${engine === 'indic' ? 'Indic NLP' : 'Azure OpenAI'}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className={`w-full ${isMobile ? 'h-[calc(100vh-8rem)]' : 'h-[600px]'} flex flex-col`}>
      <CardHeader className={`flex flex-col ${isMobile ? 'space-y-2 pb-2' : 'space-y-4 pb-4'}`}>
        <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'flex-row'} items-center ${isMobile ? '' : 'justify-between'}`}>
          <CardTitle className={`${isMobile ? 'text-lg text-center' : 'text-2xl'} font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent`}>
            Hindu Dharma AI Assistant
          </CardTitle>
          <div className="flex items-center gap-2">
            {engine === 'azure' ? <Cloud className="w-5 h-5 text-blue-500" /> : <Cpu className="w-5 h-5 text-green-500" />}
            <span className="text-sm text-muted-foreground">
              {engine === 'azure' ? 'Azure OpenAI' : 'Indic NLP'}
            </span>
          </div>
        </div>
        
        {isMobile && (
          <>
            <div className="flex flex-row items-center justify-center">
              <EngineSelector value={engine} onValueChange={handleEngineChange} />
            </div>
            <DocumentUpload onDocumentsProcessed={handleDocumentsProcessed} />
          </>
        )}
        
        {isInitializingIndic && (
          <div className="text-sm text-muted-foreground flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="w-4 h-4 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
            <div className="flex flex-col">
              <span className="font-medium">Initializing Advanced Indic NLP Engine...</span>
              <span className="text-xs text-orange-600">This may take 20-30 seconds to load the multilingual BERT model</span>
            </div>
          </div>
        )}
        {engine === 'indic' && !isInitializingIndic && documentsProcessedCount && documentsProcessedCount > 0 && (
          <div className="text-sm text-green-600 flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
            📚 Knowledge enhanced with uploaded documents
          </div>
        )}
      </CardHeader>
      <CardContent className={`flex-1 flex flex-col ${isMobile ? 'space-y-2' : 'space-y-4'}`}>
        <ScrollArea className={`flex-1 ${isMobile ? 'pr-2' : 'pr-4'} w-full overflow-hidden`} ref={scrollAreaRef}>
          <div className="space-y-4 w-full max-w-full">
            {messages.length === 0 && (
              <div className={`text-center ${isMobile ? 'py-4 px-2' : 'py-8'} text-muted-foreground w-full`}>
                <Bot className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} mx-auto ${isMobile ? 'mb-2' : 'mb-4'} text-orange-500`} />
                <p className={`${isMobile ? 'text-base' : 'text-lg'} break-words`}>Welcome to the Hindu Dharma AI Assistant</p>
                <p className={`${isMobile ? 'text-sm px-2' : ''} break-words max-w-full`}>Ask questions about Vedic traditions, rituals, sampradayas, and more.</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-orange-600" />
                  </div>
                )}
                
                <div
                  className={`${isMobile ? 'max-w-[85%]' : 'max-w-[70%]'} rounded-lg ${isMobile ? 'px-3 py-2' : 'px-4 py-2'} ${
                    message.role === 'user'
                      ? 'bg-orange-600 text-white'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 opacity-70`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-orange-600" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center space-x-2'}`}>
          <div className={`${isMobile ? 'w-full' : ''}`}>
            <LanguageSelector value={language} onValueChange={setLanguage} />
          </div>
          <div className={`flex ${isMobile ? 'space-x-2' : 'flex-1 space-x-2'}`}>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isMobile ? "Ask about Hindu Dharma..." : "Ask about Hindu Dharma, rituals, sampradayas..."}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={isLoading || !input.trim()}
              className={`${isMobile ? 'h-10 px-3' : ''}`}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};