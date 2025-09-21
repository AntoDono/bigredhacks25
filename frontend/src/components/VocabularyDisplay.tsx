import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Book, Play, Volume2, ChevronDown, ChevronUp, Mic, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import SpeechRecognitionModal from "@/components/battle/SpeechRecognitionModal";
import { GAME_CONFIG } from "@/lib/gameConfig";

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

  // Convert language code to simple format for voice analysis
  const getSimpleLanguageCode = (fullLanguageCode: string): string => {
    const langMap: { [key: string]: string } = {
      'en-US': 'en',
      'es-ES': 'es', 
      'fr-FR': 'fr',
      'de-DE': 'de',
      'it-IT': 'it',
      'pt-BR': 'pt',
      'ja-JP': 'ja',
      'ko-KR': 'ko',
      'zh-CN': 'zh'
    };
    return langMap[fullLanguageCode] || 'en';
  };
  
  // Speech recognition state
  const [showSpeechModal, setShowSpeechModal] = useState(false);
  const [selectedVocabItem, setSelectedVocabItem] = useState<VocabularyItem | null>(null);
  
  // Flashcard review state
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [reviewWords, setReviewWords] = useState<VocabularyItem[]>([]);

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

  const handlePracticePronunciation = (vocabItem: VocabularyItem) => {
    if (!vocabItem.audio_b64) {
      toast.error("No audio available for this word");
      return;
    }
    
    setSelectedVocabItem(vocabItem);
    setShowSpeechModal(true);
  };

  const handleSpeechRecognitionSuccess = () => {
    console.log('Speech recognition success');
    toast.success("Great pronunciation! Well done! 🎉");
    setShowSpeechModal(false);
    setSelectedVocabItem(null);
  };

  const handleSpeechRecognitionClose = () => {
    console.log('Speech recognition modal closed');
    setShowSpeechModal(false);
    setSelectedVocabItem(null);
  };

  const startReviewSession = () => {
    const wordsWithAudio = vocabulary.filter(item => item.audio_b64);
    if (wordsWithAudio.length === 0) {
      toast.error("No words with audio available for review");
      return;
    }
    
    setReviewWords(wordsWithAudio);
    setCurrentCardIndex(0);
    setIsReviewMode(true);
  };

  const exitReviewMode = () => {
    setIsReviewMode(false);
    setCurrentCardIndex(0);
    setReviewWords([]);
    setShowSpeechModal(false);
    setSelectedVocabItem(null);
  };

  const goToNextCard = () => {
    if (currentCardIndex < reviewWords.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowSpeechModal(false);
      setSelectedVocabItem(null);
    }
  };

  const goToPreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setShowSpeechModal(false);
      setSelectedVocabItem(null);
    }
  };

  const practiceCurrentCard = () => {
    const currentWord = reviewWords[currentCardIndex];
    console.log('Practice button clicked', { currentWord, hasAudio: !!currentWord?.audio_b64 });
    
    if (currentWord && currentWord.audio_b64) {
      setSelectedVocabItem(currentWord);
      setShowSpeechModal(true);
      console.log('Speech modal should open');
    } else {
      toast.error("No audio available for this word");
    }
  };

  const getCurrentCard = () => {
    return reviewWords[currentCardIndex] || null;
  };

  // Render flashcard review mode
  if (isReviewMode) {
    const currentCard = getCurrentCard();
    const wordsWithAudio = vocabulary.filter(item => item.audio_b64);
    
    return (
      <div className="bg-black/50 flex items-center justify-center z-[9999] p-4" style={{ position: 'fixed', top: -100, left: 0, right: 0, bottom: 0, width: '100vw', height: '110vh' }}>
        <Card className="w-full max-w-2xl bg-white shadow-2xl ">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl text-gray-900">
                Vocabulary Review
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={exitReviewMode}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <CardDescription className="text-gray-600">
              Card {currentCardIndex + 1} of {reviewWords.length} • {getLanguageName(selectedLanguage)}
            </CardDescription>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentCardIndex + 1) / reviewWords.length) * 100}%` }}
              />
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            {currentCard ? (
              <div className="text-center space-y-6">
                {/* Word Display */}
                <div className="space-y-4">
                  <div className="text-6xl">{currentCard.emoji}</div>
                  <div className="text-3xl font-bold text-gray-900">{currentCard.element}</div>
                  {currentCard.element !== currentCard.en_text && (
                    <div className="text-lg text-gray-500">{currentCard.en_text}</div>
                  )}
                  <div className="text-sm text-gray-400">
                    Learned {formatDate(currentCard.learnedAt)}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={() => playAudio(currentCard.audio_b64!, currentCard.element)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    Play Audio
                  </Button>
                  
                  <Button
                    onClick={practiceCurrentCard}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Practice Pronunciation
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">No word to display</div>
            )}
          </CardContent>
          
          {/* Navigation */}
          <div className="flex justify-between items-center p-6 border-t bg-gray-50 rounded-b-lg">
            <Button
              variant="outline"
              onClick={goToPreviousCard}
              disabled={currentCardIndex === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <span className="text-sm text-gray-600">
              {currentCardIndex + 1} / {reviewWords.length}
            </span>
            
            <Button
              variant="outline"
              onClick={goToNextCard}
              disabled={currentCardIndex === reviewWords.length - 1}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
        
        {/* Speech Recognition Modal for Flashcard Practice */}
        {selectedVocabItem && (
          <SpeechRecognitionModal
            isOpen={showSpeechModal}
            onClose={handleSpeechRecognitionClose}
            onSuccess={handleSpeechRecognitionSuccess}
            elementName={selectedVocabItem.element}
            elementEmoji={selectedVocabItem.emoji}
            groundTruthAudio={selectedVocabItem.audio_b64!}
            language={getSimpleLanguageCode(selectedLanguage)}
            token={token}
          />
        )}
      </div>
    );
  }

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
                    
                    <div className="flex items-center gap-1">
                      {item.audio_b64 && (
                        <>
                          {/* Play Audio Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => playAudio(item.audio_b64!, item.element)}
                            className="h-8 w-8 p-0 hover:bg-purple-100"
                            title="Play pronunciation"
                          >
                            <Volume2 className="w-4 h-4 text-purple-600" />
                          </Button>
                          
                          {/* Practice Pronunciation Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePracticePronunciation(item)}
                            className="h-8 w-8 p-0 hover:bg-blue-100"
                            title="Practice pronunciation"
                          >
                            <Mic className="w-4 h-4 text-blue-600" />
                          </Button>
                        </>
                      )}
                    </div>
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

          {/* Action Buttons */}
          <div className="space-y-2">
            {/* Review Button - only show if there are words with audio */}
            {vocabulary.filter(item => item.audio_b64).length > 0 && (
              <Button
                onClick={startReviewSession}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <Mic className="w-4 h-4 mr-2" />
                Review {vocabulary.filter(item => item.audio_b64).length} words
              </Button>
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
          </div>
        </CardContent>
      )}
      
      {/* Speech Recognition Modal for Vocabulary Practice */}
      {selectedVocabItem && (
        <SpeechRecognitionModal
          isOpen={showSpeechModal}
          onClose={handleSpeechRecognitionClose}
          onSuccess={handleSpeechRecognitionSuccess}
          elementName={selectedVocabItem.element}
          elementEmoji={selectedVocabItem.emoji}
          groundTruthAudio={selectedVocabItem.audio_b64!}
          language={getSimpleLanguageCode(selectedLanguage)}
          token={token}
        />
      )}
    </Card>
  );
};

export default VocabularyDisplay;
