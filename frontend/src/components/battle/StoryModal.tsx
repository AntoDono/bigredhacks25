import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Sparkles, BookOpen } from "lucide-react";

interface Element {
  id: string;
  text: string;
  emoji: string;
  spanish: string;
  english: string;
}

interface StoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  elements: Element[];
  playerWon: boolean;
  targetWord: string;
}

const StoryModal = ({ open, onOpenChange, elements, playerWon, targetWord }: StoryModalProps) => {
  // Generate a simple story using the elements
  const generateStory = () => {
    if (elements.length === 0) {
      return {
        spanish: "No hay elementos para crear una historia.",
        english: "There are no elements to create a story."
      };
    }

    // Create a simple story template using the elements
    const elementTexts = elements.slice(0, 5); // Use first 5 elements
    
    let spanish = "En un mundo mágico, ";
    let english = "In a magical world, ";

    if (elementTexts.length >= 2) {
      spanish += `había ${elementTexts[0].spanish.toLowerCase()} y ${elementTexts[1].spanish.toLowerCase()}. `;
      english += `there was ${elementTexts[0].english.toLowerCase()} and ${elementTexts[1].english.toLowerCase()}. `;
    }

    if (elementTexts.length >= 3) {
      spanish += `Un día, ${elementTexts[2].spanish.toLowerCase()} apareció y cambió todo. `;
      english += `One day, ${elementTexts[2].english.toLowerCase()} appeared and changed everything. `;
    }

    if (playerWon) {
      spanish += `¡El héroe creó ${targetWord.toLowerCase()} y ganó la batalla!`;
      english += `The hero created ${targetWord.toLowerCase()} and won the battle!`;
    } else {
      spanish += "La aventura continúa...";
      english += "The adventure continues...";
    }

    return { spanish, english };
  };

  const story = generateStory();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            {playerWon ? (
              <>
                <Trophy className="w-6 h-6 text-success" />
                ¡Victoria! (Victory!)
              </>
            ) : (
              <>
                <BookOpen className="w-6 h-6 text-primary" />
                Tu Historia (Your Story)
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {playerWon 
              ? "Congratulations! Here's your victory story in Spanish."
              : "Here's a story created from your battle elements."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Battle Result */}
          <Card className={`p-4 ${playerWon ? 'bg-success/5 border-success/20' : 'bg-muted/5'}`}>
            <div className="text-center">
              <div className="text-4xl mb-2">
                {playerWon ? '🏆' : '⏰'}
              </div>
              <h3 className="font-bold text-lg">
                {playerWon 
                  ? `¡Encontraste "${targetWord}"! (You found "${targetWord}"!)` 
                  : 'Time\'s up! Keep practicing.'
                }
              </h3>
            </div>
          </Card>

          {/* Elements Used */}
          {elements.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Elementos Usados (Elements Used)
              </h4>
              <div className="flex flex-wrap gap-2">
                {elements.map((element) => (
                  <div key={element.id} className="story-word">
                    <span className="mr-1">{element.emoji}</span>
                    {element.spanish}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated Story */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Tu Historia (Your Story)
            </h4>
            
            <Card className="p-4 space-y-4">
              {/* Spanish Version */}
              <div>
                <h5 className="font-medium text-primary mb-2">Español:</h5>
                <p className="text-lg leading-relaxed">{story.spanish}</p>
              </div>
              
              {/* English Version */}
              <div className="border-t pt-4">
                <h5 className="font-medium text-muted-foreground mb-2">English:</h5>
                <p className="text-muted-foreground leading-relaxed">{story.english}</p>
              </div>
            </Card>
          </div>

          {/* Learning Tip */}
          <Card className="p-4 bg-accent/5 border-accent/20">
            <h4 className="font-semibold text-accent mb-2 flex items-center gap-2">
              💡 Consejo de Aprendizaje (Learning Tip)
            </h4>
            <p className="text-sm text-muted-foreground">
              Practice these Spanish words in real conversations! 
              Try using them in sentences to improve your fluency.
            </p>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar (Close)
            </Button>
            <Button onClick={() => window.location.reload()}>
              Nueva Batalla (New Battle)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoryModal;