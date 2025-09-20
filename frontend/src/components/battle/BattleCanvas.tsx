import { useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface CanvasElement {
  id: string;
  text: string;
  emoji: string;
  x: number;
  y: number;
  isDragging?: boolean;
}

interface BattleCanvasProps {
  elements: CanvasElement[];
  onElementsChange: (elements: CanvasElement[]) => void;
  onCombination: (element1: CanvasElement, element2: CanvasElement, placeholderId?: string) => void;
  isActive: boolean;
  onElementDrag?: (elementText: string) => void;
}

const BattleCanvas = ({ elements, onElementsChange, onCombination, isActive, onElementDrag }: BattleCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedElement, setDraggedElement] = useState<CanvasElement | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragOver, setIsDragOver] = useState(false);

  // Handle drag from sidebar (HTML5 drag and drop)
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (!isActive) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    try {
      const elementData = e.dataTransfer.getData('application/json');
      if (!elementData) return;

      const element = JSON.parse(elementData);
      
      // Calculate drop position relative to canvas
      const dropX = e.clientX - rect.left - 50; // Approximate center for dynamic width
      const dropY = e.clientY - rect.top - 25; // Approximate center for dynamic height

      // Check if dropping on top of an existing element for combination
      const getElementDimensions = (element: CanvasElement) => {
        const textLength = element.text.length;
        const estimatedWidth = Math.max(80, Math.min(200, 40 + textLength * 8));
        return { width: estimatedWidth, height: 50 };
      };

      const targetElement = elements.find(el => {
        const elDims = getElementDimensions(el);
        const elRect = {
          x: el.x,
          y: el.y,
          width: elDims.width,
          height: elDims.height
        };

        // Check if drop position overlaps with existing element
        return (
          dropX >= elRect.x &&
          dropX <= elRect.x + elRect.width &&
          dropY >= elRect.y &&
          dropY <= elRect.y + elRect.height
        );
      });

      if (targetElement) {
        // Combine with existing element
        const tempElement: CanvasElement = {
          ...element,
          id: `temp-${Date.now()}`,
          x: dropX,
          y: dropY,
          isDragging: false,
        };

        // Create placeholder for combination
        const newX = (dropX + targetElement.x) / 2;
        const newY = (dropY + targetElement.y) / 2;
        
        const elementsWithoutTarget = elements.filter(el => el.id !== targetElement.id);
        
        const placeholderElement: CanvasElement = {
          id: `combining-${Date.now()}`,
          text: "Combining...",
          emoji: "⚡",
          x: newX,
          y: newY,
          isDragging: false
        };
        
        onElementsChange([...elementsWithoutTarget, placeholderElement]);
        
        // Store placeholder info and trigger combination
        const placeholderInfo = {
          id: placeholderElement.id,
          element1: tempElement,
          element2: targetElement
        };
        (window as any).pendingCombination = placeholderInfo;
        
        // Trigger combination
        onCombination(tempElement, targetElement, placeholderElement.id);
        
        console.log('Combining elements:', tempElement.text, '+', targetElement.text);
      } else {
        // Regular drop - no combination
        const boundedX = Math.max(10, Math.min(dropX, rect.width - 150));
        const boundedY = Math.max(10, Math.min(dropY, rect.height - 50));

        const uniqueId = `canvas-${element.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newElement: CanvasElement = {
          ...element,
          id: uniqueId,
          x: boundedX,
          y: boundedY,
          isDragging: false,
        };
        
        // Play audio for the element being dropped
        if (onElementDrag) {
          onElementDrag(element.text);
        }
        
        onElementsChange([...elements, newElement]);
        console.log('Element dropped on canvas:', newElement);
      }
    } catch (error) {
      console.error('Error parsing dropped element:', error);
    }
  }, [elements, onElementsChange, onCombination, isActive]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only set drag over to false if we're leaving the canvas entirely
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  }, []);

  // Handle dragging existing elements on canvas (mouse events)
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

    // Prevent text selection
    e.preventDefault();
  }, [elements, onElementsChange, isActive]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggedElement || !isActive) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    // Keep element within canvas bounds (with padding for dynamic width)
    const boundedX = Math.max(10, Math.min(x, rect.width - 150));
    const boundedY = Math.max(10, Math.min(y, rect.height - 50));

    onElementsChange(elements.map(el => 
      el.id === draggedElement.id ? { ...el, x: boundedX, y: boundedY } : el
    ));
  }, [draggedElement, dragOffset, elements, onElementsChange, isActive]);

  const handleMouseUp = useCallback(() => {
    if (!draggedElement) return;

    // Get the current position of the dragged element
    const currentDraggedElement = elements.find(el => el.id === draggedElement.id);
    if (!currentDraggedElement) return;

    // Check for collisions with other elements using estimated dimensions
    const getElementDimensions = (element: CanvasElement) => {
      // Estimate width based on text length (rough approximation)
      const textLength = element.text.length;
      const estimatedWidth = Math.max(80, Math.min(200, 40 + textLength * 8)); // Min 80px, max 200px
      return { width: estimatedWidth, height: 50 };
    };

    const draggedDims = getElementDimensions(currentDraggedElement);
    const draggedRect = {
      x: currentDraggedElement.x,
      y: currentDraggedElement.y,
      width: draggedDims.width,
      height: draggedDims.height
    };

    const collisionElement = elements.find(el => {
      if (el.id === draggedElement.id) return false;
      
      const elDims = getElementDimensions(el);
      const elRect = {
        x: el.x,
        y: el.y,
        width: elDims.width,
        height: elDims.height
      };

      // Check for overlap with some tolerance
      const tolerance = 20; // Pixels of overlap needed for collision
      return (
        draggedRect.x < elRect.x + elRect.width - tolerance &&
        draggedRect.x + draggedRect.width > elRect.x + tolerance &&
        draggedRect.y < elRect.y + elRect.height - tolerance &&
        draggedRect.y + draggedRect.height > elRect.y + tolerance
      );
    });

    if (collisionElement) {
      // Calculate position for new combined element (between the two colliding elements)
      const newX = (currentDraggedElement.x + collisionElement.x) / 2;
      const newY = (currentDraggedElement.y + collisionElement.y) / 2;
      
      // Remove the two colliding elements and add a placeholder for the new element
      const elementsWithoutCollided = elements.filter(el => 
        el.id !== currentDraggedElement.id && el.id !== collisionElement.id
      );
      
      // Create a temporary placeholder element while waiting for backend response
      const placeholderElement: CanvasElement = {
        id: `combining-${Date.now()}`,
        text: "Combining...",
        emoji: "⚡",
        x: newX,
        y: newY,
        isDragging: false
      };
      
      onElementsChange([...elementsWithoutCollided, placeholderElement]);
      
      // Trigger combination with callback to replace placeholder
      onCombination(currentDraggedElement, collisionElement, placeholderElement.id);
    } else {
      // Remove dragging state if no collision
      onElementsChange(elements.map(el => ({ ...el, isDragging: false })));
    }

    setDraggedElement(null);
  }, [draggedElement, elements, onCombination, onElementsChange]);

  const clearCanvas = () => {
    onElementsChange([]);
  };

  return (
    <Card className="battle-canvas h-full relative overflow-hidden">
      <div
        ref={canvasRef}
        className="w-full h-full relative min-h-[600px]"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >

        {/* Canvas Elements */}
        {elements.map((element) => (
          <div
            key={element.id}
            className={`
              absolute cursor-grab active:cursor-grabbing flex items-center gap-2 px-3 py-2
              bg-card border-2 rounded-lg shadow-sm transition-all duration-200
              min-w-fit max-w-xs whitespace-nowrap
              ${element.isDragging ? 'z-50' : ''}
              ${!isActive ? 'cursor-not-allowed opacity-50' : ''}
              ${element.id.startsWith('combining-') 
                ? 'border-yellow-400 bg-yellow-50 animate-pulse' 
                : 'border-border hover:border-primary hover:shadow-md'
              }
            `}
            style={{
              left: element.x,
              top: element.y,
              userSelect: 'none',
              transform: element.isDragging ? 'scale(1.05) rotate(2deg)' : 'scale(1)',
              transition: element.isDragging ? 'none' : 'transform 0.2s ease',
            }}
            onMouseDown={(e) => handleMouseDown(e, element)}
            draggable={false}
          >
            <span className="text-xl">{element.emoji}</span>
            <div className="flex flex-col justify-center min-w-0">
              <div className="font-medium text-sm">{element.text}</div>
            </div>
          </div>
        ))}


        {/* Clear Button */}
        {elements.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="absolute top-4 right-4 z-20"
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
