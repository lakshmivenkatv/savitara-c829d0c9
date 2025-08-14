import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, X, FileSpreadsheet, FileJson } from 'lucide-react';
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
    const supportedFiles = acceptedFiles.filter(file => 
      file.type === 'application/pdf' || 
      file.type === 'application/json' ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')
    );
    
    if (supportedFiles.length !== acceptedFiles.length) {
      toast({
        title: "Some files not supported",
        description: "Only PDF, JSON, Excel (.xlsx, .xls) files are supported",
        variant: "destructive"
      });
    }

    if (supportedFiles.length > 0) {
      onDocumentsChange([...uploadedDocuments, ...supportedFiles]);
      toast({
        title: "Documents uploaded",
        description: `${supportedFiles.length} file(s) uploaded successfully`,
      });
    }
  }, [uploadedDocuments, onDocumentsChange, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/json': ['.json'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
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
          AI Knowledge Base Documents
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
            <p>Drop files here...</p>
          ) : (
            <div>
              <p>Drag & drop PDF, JSON, or Excel files here, or click to select</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload documents to enhance the AI knowledge base with your data
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
                  {getFileIcon(file)}
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

// Helper function to get appropriate file icon
const getFileIcon = (file: File) => {
  if (file.type === 'application/pdf') {
    return <FileText className="w-4 h-4" />;
  } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
    return <FileJson className="w-4 h-4" />;
  } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    return <FileSpreadsheet className="w-4 h-4" />;
  }
  return <FileText className="w-4 h-4" />;
};