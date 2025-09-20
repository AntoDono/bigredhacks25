import { useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface CanvasElement {
  id: string;
  text: string;
  emoji: string;
  spanish: string;
  english: string;
  x: number;
  y: number;
  isDragging?: boolean;
}

interface BattleCanvasProps {
  elements: CanvasElement[];
  onElementsChange: (elements: CanvasElement[]) => void;
  onCombination: (element1: CanvasElement, element2: CanvasElement) => void;
  isActive: boolean;
}

const BattleCanvas = ({ elements, onElementsChange, onCombination, isActive }: BattleCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedElement, setDraggedElement] = useState<CanvasElement | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent, element: CanvasElement) => {
    if (!isActive) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const offsetX = e.clientX - rect.left - element.x;
    const offsetY = e.clientY - rect.top - element.y;

    setDraggedElement(element);
    setDragOffset({ x: offsetX, y: offsetY });

    // Mark element as dragging
    onElementsChange(elements.map(el => 
      el.id === element.id ? { ...el, isDragging: true } : el
    ));
  }, [elements, onElementsChange, isActive]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggedElement || !isActive) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    // Keep element within canvas bounds
    const boundedX = Math.max(0, Math.min(x, rect.width - 120));
    const boundedY = Math.max(0, Math.min(y, rect.height - 60));

    onElementsChange(elements.map(el => 
      el.id === draggedElement.id ? { ...el, x: boundedX, y: boundedY } : el
    ));
  }, [draggedElement, dragOffset, elements, onElementsChange, isActive]);

  const handleMouseUp = useCallback(() => {
    if (!draggedElement) return;

    // Check for collisions with other elements
    const draggedRect = {
      x: draggedElement.x,
      y: draggedElement.y,
      width: 120,
      height: 60
    };

    const collisionElement = elements.find(el => {
      if (el.id === draggedElement.id) return false;
      
      const elRect = {
        x: el.x,
        y: el.y,
        width: 120,
        height: 60
      };

      return (
        draggedRect.x < elRect.x + elRect.width &&
        draggedRect.x + draggedRect.width > elRect.x &&
        draggedRect.y < elRect.y + elRect.height &&
        draggedRect.y + draggedRect.height > elRect.y
      );
    });

    if (collisionElement) {
      // Trigger combination
      onCombination(draggedElement, collisionElement);
    }

    // Remove dragging state
    onElementsChange(elements.map(el => ({ ...el, isDragging: false })));
    setDraggedElement(null);
  }, [draggedElement, elements, onCombination, onElementsChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    if (!isActive) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const elementData = e.dataTransfer.getData('application/json');
    if (!elementData) return;

    try {
      const element = JSON.parse(elementData);
      const x = e.clientX - rect.left - 60; // Center the element
      const y = e.clientY - rect.top - 30;

      // Ensure element isn't already on canvas
      if (!elements.find(el => el.id === element.id)) {
        const newElement = {
          ...element,
          x: Math.max(0, Math.min(x, rect.width - 120)),
          y: Math.max(0, Math.min(y, rect.height - 60)),
        };
        onElementsChange([...elements, newElement]);
      }
    } catch (error) {
      console.error('Error parsing dropped element:', error);
    }
  }, [elements, onElementsChange, isActive]);

  const clearCanvas = () => {
    onElementsChange([]);
  };

  return (
    <Card className="battle-canvas h-full relative overflow-hidden">
      <div
        ref={canvasRef}
        className="w-full h-full relative"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Canvas Elements */}
        {elements.map((element) => (
          <div
            key={`${element.id}-${element.x}-${element.y}`}
            className={`
              battle-element absolute cursor-grab active:cursor-grabbing
              ${element.isDragging ? 'dragging' : ''}
              ${!isActive ? 'cursor-not-allowed opacity-50' : ''}
            `}
            style={{
              left: element.x,
              top: element.y,
              width: '120px',
              height: '60px',
              userSelect: 'none',
            }}
            onMouseDown={(e) => handleMouseDown(e, element)}
            draggable={false}
          >
            <div className="flex items-center gap-2 h-full px-3">
              <span className="text-xl">{element.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{element.spanish}</div>
                <div className="text-xs text-muted-foreground truncate">{element.english}</div>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <p className="text-lg font-medium">Drag elements here to start crafting!</p>
              <p className="text-sm">Combine Spanish words to discover new vocabulary</p>
            </div>
          </div>
        )}

        {/* Clear Button */}
        {elements.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="absolute top-4 right-4 z-10"
            onClick={clearCanvas}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </Card>
  );
};

export default BattleCanvas;
