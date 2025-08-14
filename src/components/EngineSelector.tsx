import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EngineSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

const engines = [
  { value: 'azure', label: 'Azure OpenAI', description: 'General purpose AI' },
  { value: 'indic', label: 'Indic NLP', description: 'Specialized for Indic languages' },
];

export const EngineSelector = ({ value, onValueChange }: EngineSelectorProps) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Select AI Engine" />
      </SelectTrigger>
      <SelectContent>
        {engines.map((engine) => (
          <SelectItem key={engine.value} value={engine.value}>
            <div className="flex flex-col">
              <span className="font-medium">{engine.label}</span>
              <span className="text-sm text-muted-foreground">{engine.description}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};