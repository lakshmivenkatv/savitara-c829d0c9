import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface DocumentUploadProps {
  onDocumentsChange: (documents: File[]) => void;
  uploadedDocuments: File[];
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onDocumentsChange,
  uploadedDocuments
}) => {
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdfFiles = acceptedFiles.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== acceptedFiles.length) {
      toast({
        title: "Invalid files",
        description: "Only PDF files are supported",
        variant: "destructive"
      });
    }

    if (pdfFiles.length > 0) {
      onDocumentsChange([...uploadedDocuments, ...pdfFiles]);
      toast({
        title: "Documents uploaded",
        description: `${pdfFiles.length} PDF(s) uploaded successfully`,
      });
    }
  }, [uploadedDocuments, onDocumentsChange, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const removeDocument = (index: number) => {
    const newDocuments = uploadedDocuments.filter((_, i) => i !== index);
    onDocumentsChange(newDocuments);
    toast({
      title: "Document removed",
      description: "Document removed from knowledge base",
    });
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Knowledge Base Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/10'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          {isDragActive ? (
            <p>Drop PDF files here...</p>
          ) : (
            <div>
              <p>Drag & drop PDF files here, or click to select</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload PDFs to enhance the Indic NLP knowledge base
              </p>
            </div>
          )}
        </div>

        {uploadedDocuments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Uploaded Documents:</h4>
            {uploadedDocuments.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-muted rounded-md"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeDocument(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};