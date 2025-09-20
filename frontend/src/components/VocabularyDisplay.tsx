import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Book, Play, Volume2, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface VocabularyItem {
  elementKey: string;
  element: string;
  en_text: string;
  emoji: string;
  audio_b64?: string;
  learnedAt: string;
}

const VocabularyDisplay = () => {
  const { user, token } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  // Available languages
  const languages = [
    { code: "en-US", name: "English (US)" },
    { code: "es-ES", name: "Spanish (Spain)" },
    { code: "fr-FR", name: "French" },
    { code: "de-DE", name: "German" },
    { code: "it-IT", name: "Italian" },
    { code: "pt-BR", name: "Portuguese (Brazil)" },
    { code: "ja-JP", name: "Japanese" },
    { code: "ko-KR", name: "Korean" },
    { code: "zh-CN", name: "Chinese (Mandarin)" }
  ];

  const fetchVocabulary = async (languageCode: string) => {
    if (!user?.id || !token) return;

    setLoading(true);
    try {
      const result = await api.getUserVocabulary(user.id, languageCode, token);
      setVocabulary(result.vocabulary);
    } catch (error) {
      console.error('Failed to fetch vocabulary:', error);
      setVocabulary([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVocabulary(selectedLanguage);
  }, [selectedLanguage, user?.id, token]);

  const playAudio = async (audio_b64: string, elementName: string) => {
    if (!audio_b64) {
      toast.error('No audio available for this element');
      return;
    }

    try {
      const audio = new Audio(`data:audio/mp3;base64,${audio_b64}`);
      audio.volume = 0.7;
      await audio.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
      toast.error(`Failed to play pronunciation for ${elementName}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getLanguageName = (code: string) => {
    return languages.find(lang => lang.code === code)?.name || code;
  };

  return (
    <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <CardTitle className="flex items-center justify-between text-xl text-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Book className="w-5 h-5 text-purple-600" />
            </div>
            Learned Vocabulary
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </CardTitle>
        <CardDescription className="text-gray-600">
          Your collected words across languages
        </CardDescription>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Language Selector */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Language</label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vocabulary Count */}
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
              {vocabulary.length} words learned
            </Badge>
            <span className="text-sm text-gray-500">
              in {getLanguageName(selectedLanguage)}
            </span>
          </div>

          {/* Vocabulary List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : vocabulary.length > 0 ? (
            <ScrollArea className="h-64 pr-4">
              <div className="space-y-2">
                {vocabulary.map((item, index) => (
                  <div
                    key={`${item.elementKey}-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-xl">{item.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {item.element}
                        </div>
                        {item.element !== item.en_text && (
                          <div className="text-xs text-gray-500 truncate">
                            {item.en_text}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(item.learnedAt)}
                      </div>
                    </div>
                    
                    {item.audio_b64 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => playAudio(item.audio_b64!, item.element)}
                        className="ml-2 h-8 w-8 p-0 hover:bg-purple-100"
                      >
                        <Volume2 className="w-4 h-4 text-purple-600" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Book className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No vocabulary learned yet in {getLanguageName(selectedLanguage)}</p>
              <p className="text-xs mt-1">Play some games to start building your vocabulary!</p>
            </div>
          )}

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchVocabulary(selectedLanguage)}
            disabled={loading}
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </CardContent>
      )}
    </Card>
  );
};

export default VocabularyDisplay;
