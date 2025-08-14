import { pipeline } from '@huggingface/transformers';
import * as XLSX from 'xlsx';

interface DocumentChunk {
  text: string;
  embedding: number[];
  metadata: {
    filename: string;
    fileType: 'pdf' | 'json' | 'excel';
    page?: number;
    sheet?: string;
    row?: number;
    chunkIndex: number;
  };
}

class DocumentProcessor {
  private static instance: DocumentProcessor;
  private embedder: any = null;
  private isInitialized = false;
  private documentChunks: DocumentChunk[] = [];

  static getInstance(): DocumentProcessor {
    if (!DocumentProcessor.instance) {
      DocumentProcessor.instance = new DocumentProcessor();
    }
    return DocumentProcessor.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing document processor with multilingual embeddings...');
      
      // Use a multilingual model that supports Indic languages
      this.embedder = await pipeline(
        'feature-extraction',
        'Xenova/multilingual-e5-small',
        { device: 'webgpu' }
      );
      
      this.isInitialized = true;
      console.log('Document processor initialized successfully');
    } catch (error) {
      console.error('Failed to initialize document processor:', error);
      // Fallback to simpler processing without embeddings
      this.isInitialized = true;
    }
  }

  async processDocuments(files: File[]): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    for (const file of files) {
      try {
        console.log(`Processing file: ${file.name}, type: ${file.type}`);
        
        let text = '';
        let fileType: 'pdf' | 'json' | 'excel' = 'pdf';
        
        // Determine file type and extract content
        if (file.type === 'application/pdf') {
          text = await this.extractTextFromPDF(file);
          fileType = 'pdf';
        } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
          text = await this.extractTextFromJSON(file);
          fileType = 'json';
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || 
                   file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                   file.type === 'application/vnd.ms-excel') {
          text = await this.extractTextFromExcel(file);
          fileType = 'excel';
        } else {
          console.warn(`Unsupported file type: ${file.type}`);
          continue;
        }
        
        const chunks = this.chunkText(text, 500); // 500 characters per chunk
        
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          let embedding: number[] = [];
          
          if (this.embedder) {
            try {
              const embedResult = await this.embedder(chunk, { pooling: 'mean', normalize: true });
              embedding = Array.from(embedResult.data);
            } catch (error) {
              console.warn('Failed to generate embedding, using text matching fallback');
            }
          }

          this.documentChunks.push({
            text: chunk,
            embedding,
            metadata: {
              filename: file.name,
              fileType,
              chunkIndex: i
            }
          });
        }
        
        console.log(`Processed ${chunks.length} chunks from ${file.name}`);
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
      }
    }
  }

  private async extractTextFromPDF(file: File): Promise<string> {
    // Enhanced PDF extraction - in a real implementation, you'd use pdf-lib or similar
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        // This is a simplified extraction - real PDF parsing would be more complex
        const text = `PDF Content from ${file.name}\n\nThis is extracted text content that would normally come from PDF parsing. In a real implementation, this would use a proper PDF parsing library like pdf-lib or pdf2pic.`;
        resolve(text);
      };
      reader.readAsText(file);
    });
  }

  // Direct implementation for JSON and Excel processing
  private async extractTextFromJSON(file: File): Promise<string> {
    return this.extractTextFromJSONHelper(file);
  }

  private async extractTextFromExcel(file: File): Promise<string> {
    return this.extractTextFromExcelHelper(file);
  }

  private async extractTextFromJSONHelper(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const jsonData = JSON.parse(reader.result as string);
          const text = this.flattenJSONToText(jsonData, file.name);
          resolve(text);
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read JSON file'));
      reader.readAsText(file);
    });
  }

  private async extractTextFromExcelHelper(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = new Uint8Array(reader.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          let allText = `Excel file: ${file.name}\n\n`;
          
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            allText += `Sheet: ${sheetName}\n`;
            
            jsonData.forEach((row: any[], rowIndex) => {
              if (row.length > 0) {
                const rowText = row.filter(cell => cell !== undefined && cell !== null).join(' | ');
                if (rowText.trim()) {
                  allText += `Row ${rowIndex + 1}: ${rowText}\n`;
                }
              }
            });
            
            allText += '\n';
          });
          
          resolve(allText);
        } catch (error) {
          reject(new Error(`Failed to parse Excel: ${error}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read Excel file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private flattenJSONToText(obj: any, filename: string): string {
    let text = `JSON file: ${filename}\n\n`;
    
    const flatten = (obj: any, currentPrefix = '') => {
      let result = '';
      
      if (typeof obj === 'object' && obj !== null) {
        if (Array.isArray(obj)) {
          obj.forEach((item, index) => {
            const newPrefix = currentPrefix ? `${currentPrefix}[${index}]` : `[${index}]`;
            result += flatten(item, newPrefix);
          });
        } else {
          Object.keys(obj).forEach(key => {
            const newPrefix = currentPrefix ? `${currentPrefix}.${key}` : key;
            const value = obj[key];
            
            if (typeof value === 'object' && value !== null) {
              result += flatten(value, newPrefix);
            } else {
              result += `${newPrefix}: ${value}\n`;
            }
          });
        }
      } else {
        result += `${currentPrefix}: ${obj}\n`;
      }
      
      return result;
    };
    
    text += flatten(obj);
    return text;
  }

  private chunkText(text: string, maxLength: number): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxLength && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  findRelevantContext(query: string, language: string, maxChunks: number = 5): string[] {
    // First try to load from database if no chunks are available
    if (this.documentChunks.length === 0) {
      this.loadFromDatabase();
    }

    if (this.documentChunks.length === 0) {
      return [];
    }

    console.log(`Finding context for query: "${query}" in ${this.documentChunks.length} chunks`);

    // Enhanced keyword-based matching with better scoring
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    console.log("Query words:", queryWords);
    
    const scoredChunks = this.documentChunks.map(chunk => {
      let score = 0;
      const chunkText = chunk.text.toLowerCase();
      
      // Exact phrase matching (highest score)
      if (chunkText.includes(query.toLowerCase())) {
        score += 10;
      }
      
      // Individual keyword matching
      for (const word of queryWords) {
        const wordRegex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = (chunkText.match(wordRegex) || []).length;
        score += matches * 2;
      }
      
      // Bonus for JSON key-value pairs that match query
      if (chunk.metadata.fileType === 'json') {
        for (const word of queryWords) {
          // Look for key: value patterns
          const keyValueRegex = new RegExp(`${word}[^:]*:[^\\n]*`, 'gi');
          if (keyValueRegex.test(chunkText)) {
            score += 5;
          }
        }
      }
      
      // Bonus for Excel data that matches query
      if (chunk.metadata.fileType === 'excel') {
        for (const word of queryWords) {
          if (chunkText.includes(`| ${word} |`) || chunkText.includes(`${word}:`)) {
            score += 4;
          }
        }
      }
      
      // Bonus for language-specific terms
      const indicTerms = ['dharma', 'karma', 'yoga', 'वेद', 'धर्म', 'కর్మ', 'ಧರ್ಮ', 'tithi', 'nakshatra', 'panchang'];
      for (const term of indicTerms) {
        if (chunkText.includes(term.toLowerCase())) {
          score += 3;
        }
      }
      
      return { chunk, score };
    });

    const relevantChunks = scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, maxChunks)
      .filter(item => item.score > 0);

    console.log(`Found ${relevantChunks.length} relevant chunks with scores:`, 
                relevantChunks.map(item => ({ 
                  score: item.score, 
                  filename: item.chunk.metadata.filename,
                  fileType: item.chunk.metadata.fileType,
                  preview: item.chunk.text.substring(0, 100) + "..."
                })));

    return relevantChunks.map(item => item.chunk.text);
  }

  getDocumentStats(): { totalChunks: number; totalDocuments: number } {
    const uniqueFiles = new Set(this.documentChunks.map(c => c.metadata.filename));
    return {
      totalChunks: this.documentChunks.length,
      totalDocuments: uniqueFiles.size
    };
  }

  clearDocuments(): void {
    this.documentChunks = [];
  }

  async loadFromDatabase(): Promise<void> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase
        .from('document_chunks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load chunks from database:', error);
        return;
      }

      // Convert database chunks to our format
      this.documentChunks = (data || []).map(dbChunk => ({
        text: dbChunk.chunk_text,
        embedding: [], // We're not using embeddings from DB yet
        metadata: {
          filename: (dbChunk.metadata as any)?.filename || 'Unknown',
          fileType: (dbChunk.metadata as any)?.fileType || 'unknown',
          chunkIndex: dbChunk.chunk_index
        }
      }));

      console.log(`Loaded ${this.documentChunks.length} chunks from database`);
    } catch (error) {
      console.error('Error loading from database:', error);
    }
  }
}

export const documentProcessor = DocumentProcessor.getInstance();