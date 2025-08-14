import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LanguageSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

const languages = [
  { value: 'english', label: 'English', nativeLabel: 'English' },
  { value: 'hindi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { value: 'marathi', label: 'Marathi', nativeLabel: 'मराठी' },
  { value: 'sanskrit', label: 'Sanskrit', nativeLabel: 'संस्कृतम्' },
  { value: 'telugu', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { value: 'kannada', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
];

export const LanguageSelector = ({ value, onValueChange }: LanguageSelectorProps) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select Language" />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.value} value={lang.value}>
            <span className="flex items-center gap-2">
              {lang.label} ({lang.nativeLabel})
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};