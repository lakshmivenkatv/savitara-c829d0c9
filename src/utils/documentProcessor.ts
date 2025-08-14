import { pipeline } from '@huggingface/transformers';

interface DocumentChunk {
  text: string;
  embedding: number[];
  metadata: {
    filename: string;
    page?: number;
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
        const text = await this.extractTextFromPDF(file);
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
    // Simple text extraction - in a real implementation, you'd use pdf-lib or similar
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        // This is a simplified extraction - real PDF parsing would be more complex
        const text = `Content from ${file.name}\n\nThis is extracted text content that would normally come from PDF parsing. In a real implementation, this would use a proper PDF parsing library.`;
        resolve(text);
      };
      reader.readAsText(file);
    });
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

  findRelevantContext(query: string, language: string, maxChunks: number = 3): string[] {
    if (this.documentChunks.length === 0) {
      return [];
    }

    // Simple keyword-based matching as fallback
    const queryWords = query.toLowerCase().split(/\s+/);
    
    const scoredChunks = this.documentChunks.map(chunk => {
      let score = 0;
      const chunkText = chunk.text.toLowerCase();
      
      // Keyword matching
      for (const word of queryWords) {
        if (chunkText.includes(word)) {
          score += 1;
        }
      }
      
      // Bonus for language-specific terms
      const indicTerms = ['dharma', 'karma', 'yoga', 'वेद', 'धर्म', 'కర్మ', 'ಧರ್ಮ'];
      for (const term of indicTerms) {
        if (chunkText.includes(term.toLowerCase())) {
          score += 2;
        }
      }
      
      return { chunk, score };
    });

    return scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, maxChunks)
      .filter(item => item.score > 0)
      .map(item => item.chunk.text);
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
}

export const documentProcessor = DocumentProcessor.getInstance();