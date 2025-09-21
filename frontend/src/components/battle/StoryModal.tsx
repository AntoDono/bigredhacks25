import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Sparkles, BookOpen } from "lucide-react";

interface Element {
  id: string;
  text: string;
  emoji: string;
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
      return "No elements to create a story.";
    }

    // Create a simple story template using the elements
    const elementTexts = elements.slice(0, 5); // Use first 5 elements
    
    let story = "In a magical world, ";

    if (elementTexts.length >= 2) {
      story += `there was ${elementTexts[0].text.toLowerCase()} and ${elementTexts[1].text.toLowerCase()}. `;
    }

    if (elementTexts.length >= 3) {
      story += `One day, ${elementTexts[2].text.toLowerCase()} appeared and changed everything. `;
    }

    if (playerWon) {
      story += `The hero created ${targetWord.toLowerCase()} and won the battle!`;
    } else {
      story += "The adventure continues...";
    }

    return story;
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
                Victory!
              </>
            ) : (
              <>
                <BookOpen className="w-6 h-6 text-primary" />
                Your Story
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {playerWon 
              ? "Congratulations! Here's your victory story."
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
                Elements Used
              </h4>
              <div className="flex flex-wrap gap-2">
                {elements.map((element) => (
                  <div key={element.id} className="story-word">
                    <span className="mr-1">{element.emoji}</span>
                    {element.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated Story */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Your Adventure Story
            </h4>
            
            <Card className="p-4">
              <p className="text-lg leading-relaxed">{story}</p>
            </Card>
          </div>

          {/* Creative Tip */}
          <Card className="p-4 bg-accent/5 border-accent/20">
            <h4 className="font-semibold text-accent mb-2 flex items-center gap-2">
              💡 Creative Tip
            </h4>
            <p className="text-sm text-muted-foreground">
              Try combining different elements to discover new creations! 
              Each combination tells a unique story.
            </p>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => window.location.href = '/home'}>
              Return to Lobby
            </Button>
            <Button onClick={() => window.location.reload()}>
              New Battle
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoryModal;