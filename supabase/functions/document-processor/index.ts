import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { documentId, fileContent, fileName, fileType } = await req.json();

    console.log(`Processing document: ${fileName}, type: ${fileType}`);

    let extractedText = '';

    // Extract text based on file type
    if (fileType === 'json') {
      try {
        const jsonData = JSON.parse(fileContent);
        extractedText = extractTextFromJSON(jsonData, fileName);
      } catch (error) {
        console.error('Failed to parse JSON:', error);
        extractedText = fileContent; // Fallback to raw content
      }
    } else if (fileType === 'excel') {
      // For Excel files, the content should already be extracted on client-side
      extractedText = fileContent;
    } else if (fileType === 'pdf') {
      // PDF processing would go here - for now using placeholder
      extractedText = `PDF Content from ${fileName}\n\n${fileContent}`;
    } else {
      extractedText = fileContent;
    }

    // Split text into chunks
    const chunks = chunkText(extractedText, 500);
    console.log(`Created ${chunks.length} chunks from ${fileName}`);

    // Store chunks in database
    const chunkPromises = chunks.map((chunk, index) => 
      supabase
        .from('document_chunks')
        .insert({
          document_id: documentId,
          user_id: user.id,
          chunk_text: chunk,
          chunk_index: index,
          metadata: {
            filename: fileName,
            fileType: fileType,
            totalChunks: chunks.length
          }
        })
    );

    await Promise.all(chunkPromises);

    // Update document with chunk count
    await supabase
      .from('documents')
      .update({ processed_chunks: chunks.length })
      .eq('id', documentId);

    console.log(`Successfully processed ${chunks.length} chunks for ${fileName}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        chunksProcessed: chunks.length,
        message: `Processed ${chunks.length} chunks from ${fileName}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in document-processor:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractTextFromJSON(obj: any, filename: string): string {
  const texts: string[] = [];
  
  function traverse(current: any, path: string = '') {
    if (typeof current === 'string' && current.trim().length > 0) {
      texts.push(`${path}: ${current}`);
    } else if (typeof current === 'number' || typeof current === 'boolean') {
      texts.push(`${path}: ${current}`);
    } else if (Array.isArray(current)) {
      current.forEach((item, index) => {
        traverse(item, `${path}[${index}]`);
      });
    } else if (typeof current === 'object' && current !== null) {
      Object.entries(current).forEach(([key, value]) => {
        const newPath = path ? `${path}.${key}` : key;
        traverse(value, newPath);
      });
    }
  }
  
  traverse(obj, filename);
  return texts.join('\n');
}

function chunkText(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (currentChunk.length + trimmedSentence.length + 1 <= maxLength) {
      currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk + '.');
      }
      currentChunk = trimmedSentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk + '.');
  }
  
  return chunks.filter(chunk => chunk.trim().length > 0);
}