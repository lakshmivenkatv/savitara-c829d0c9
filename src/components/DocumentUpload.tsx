import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, X, FileSpreadsheet, FileJson, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';
import * as XLSX from 'xlsx';

interface DocumentUploadProps {
  onDocumentsProcessed: () => void;
}

interface UploadedDocument {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  processedChunks: number;
  createdAt: string;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onDocumentsProcessed
}) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [processedFileName, setProcessedFileName] = useState('');

  // Load user's documents on component mount
  React.useEffect(() => {
    loadUserDocuments();
  }, []);

  const loadUserDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map database fields to interface
      const mappedDocuments: UploadedDocument[] = (data || []).map(doc => ({
        id: doc.id,
        filename: doc.filename,
        fileType: doc.file_type,
        fileSize: doc.file_size,
        processedChunks: doc.processed_chunks,
        createdAt: doc.created_at
      }));
      
      setUploadedDocuments(mappedDocuments);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Only allow single file
    if (acceptedFiles.length > 1) {
      toast({
        title: "Multiple files not allowed",
        description: "Please upload only one file at a time",
        variant: "destructive"
      });
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    // Check if file type is supported
    const isSupported = file.type === 'application/pdf' || 
      file.type === 'application/json' ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls');
    
    if (!isSupported) {
      toast({
        title: "File not supported",
        description: "Only PDF, JSON, Excel (.xlsx, .xls) files are supported",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      await processFile(file);
      await loadUserDocuments();
      onDocumentsProcessed();
      
      setProcessedFileName(file.name);
      setShowSuccess(true);
    } catch (error) {
      console.error('Failed to process file:', error);
      toast({
        title: "Processing failed",
        description: "File couldn't be processed",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast, onDocumentsProcessed]);

  const processFile = async (file: File) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Determine file type
      let fileType = 'pdf';
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        fileType = 'json';
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        fileType = 'excel';
      }

      // Upload file to storage
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          filename: file.name,
          file_type: fileType,
          file_size: file.size,
          storage_path: filePath,
        })
        .select()
        .single();

      if (docError) throw docError;

      // Extract text content from file
      let fileContent = '';
      
      if (fileType === 'json') {
        fileContent = await file.text();
      } else if (fileType === 'excel') {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const texts: string[] = [];
        
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          jsonData.forEach((row: any, rowIndex) => {
            if (Array.isArray(row) && row.length > 0) {
              texts.push(`Sheet ${sheetName}, Row ${rowIndex + 1}: ${row.join(', ')}`);
            }
          });
        });
        
        fileContent = texts.join('\n');
      } else if (fileType === 'pdf') {
        // For now, PDF processing is limited - would need a proper PDF parser
        fileContent = `PDF content from ${file.name} - actual text extraction would require PDF parsing library`;
      }

      // Process document with edge function
      const { error: processError } = await supabase.functions.invoke('document-processor', {
        body: {
          documentId: document.id,
          fileContent,
          fileName: file.name,
          fileType
        }
      });

      if (processError) throw processError;

    } catch (error) {
      console.error(`Failed to process ${file.name}:`, error);
      throw error;
    }
  };

  const removeDocument = async (documentId: string) => {
    try {
      // Delete chunks first
      const { error: chunksError } = await supabase
        .from('document_chunks')
        .delete()
        .eq('document_id', documentId);

      if (chunksError) throw chunksError;

      // Delete document record
      const { error: docError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (docError) throw docError;

      // Reload documents
      await loadUserDocuments();
      onDocumentsProcessed();

      toast({
        title: "Document removed",
        description: "Document removed from knowledge base",
      });
    } catch (error) {
      console.error('Failed to remove document:', error);
      toast({
        title: "Removal failed",
        description: "Failed to remove document",
        variant: "destructive"
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/json': ['.json'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    disabled: isProcessing
  });

  return (
    <Card className={`${isMobile ? 'mb-2' : 'mb-4'} w-full overflow-hidden`}>
      <CardHeader className={isMobile ? 'pb-3' : ''}>
        <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
          <FileText className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
          AI Knowledge Base Documents
        </CardTitle>
      </CardHeader>
      <CardContent className={`${isMobile ? 'space-y-3 px-3' : 'space-y-4'}`}>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg ${isMobile ? 'p-4' : 'p-6'} text-center cursor-pointer transition-colors w-full ${
            isDragActive
              ? 'border-primary bg-primary/10'
              : isProcessing 
                ? 'border-muted-foreground/25 bg-muted/50 cursor-not-allowed'
                : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          {isProcessing ? (
            <div className="flex flex-col items-center">
              <Loader2 className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} mx-auto ${isMobile ? 'mb-1' : 'mb-2'} text-primary animate-spin`} />
              <p className={`${isMobile ? 'text-sm' : ''}`}>Processing documents...</p>
            </div>
          ) : (
            <>
              <Upload className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} mx-auto ${isMobile ? 'mb-1' : 'mb-2'} text-muted-foreground`} />
              {isDragActive ? (
                <p className={`${isMobile ? 'text-sm' : ''}`}>Drop files here...</p>
              ) : (
                <div className="w-full">
                  <p className={`${isMobile ? 'text-sm' : ''} break-words`}>
                    {isMobile ? 'Tap to select PDF, JSON, or Excel file' : 'Drag & drop a PDF, JSON, or Excel file here, or click to select'}
                  </p>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mt-1 break-words`}>
                    Upload one document to enhance the AI knowledge base with your data
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {uploadedDocuments.length > 0 && (
          <div className="space-y-2 w-full">
            <h4 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>Uploaded Documents:</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {uploadedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className={`flex items-center justify-between ${isMobile ? 'p-2' : 'p-2'} bg-muted rounded-md w-full min-w-0`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {getFileIcon(doc.fileType)}
                    <span className={`${isMobile ? 'text-xs' : 'text-sm'} truncate flex-1`} title={doc.filename}>
                      {doc.filename}
                    </span>
                    <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground whitespace-nowrap`}>
                      ({(doc.fileSize / 1024 / 1024).toFixed(1)} MB)
                    </span>
                    <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-primary whitespace-nowrap`}>
                      {doc.processedChunks} chunks
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeDocument(doc.id)}
                    disabled={isProcessing}
                    className="ml-2 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {showSuccess && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 w-full">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
            <AlertDescription className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'}`}>
              <span className={`text-green-800 dark:text-green-200 ${isMobile ? 'text-sm break-words' : ''}`}>
                File "{processedFileName}" uploaded and processed successfully!
              </span>
              <Button 
                size="sm" 
                variant="outline"
                className={`${isMobile ? 'w-full' : 'ml-4'} border-green-200 text-green-800 hover:bg-green-100 dark:border-green-700 dark:text-green-200 dark:hover:bg-green-900 shrink-0`}
                onClick={() => setShowSuccess(false)}
              >
                OK
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to get appropriate file icon
const getFileIcon = (fileType: string) => {
  if (fileType === 'pdf') {
    return <FileText className="w-4 h-4" />;
  } else if (fileType === 'json') {
    return <FileJson className="w-4 h-4" />;
  } else if (fileType === 'excel') {
    return <FileSpreadsheet className="w-4 h-4" />;
  }
  return <FileText className="w-4 h-4" />;
};