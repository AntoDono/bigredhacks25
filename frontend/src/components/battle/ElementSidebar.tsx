import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Package, Sparkles, Clock } from "lucide-react";

interface Element {
  id: string;
  text: string;
  emoji: string;
}

interface ElementSidebarProps {
  availableElements: Element[];
  discoveries: Element[];
  onElementDragStart: (element: Element) => void;
}

const ElementSidebar = ({ availableElements, discoveries, onElementDragStart }: ElementSidebarProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredElements = availableElements.filter(element =>
    element.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDragStart = (e: React.DragEvent, element: Element) => {
    e.dataTransfer.setData('application/json', JSON.stringify(element));
    e.dataTransfer.effectAllowed = 'copy';
    onElementDragStart(element);
    console.log('Drag started for element:', element);
  };

  const renderElement = (element: Element) => (
    <div
      key={element.id}
      className="discovery-item cursor-grab active:cursor-grabbing inline-flex items-center gap-1 px-2 py-1 m-1 rounded-full border border-border/50 bg-card hover:bg-muted hover:border-primary/50 transition-all duration-200 text-xs shadow-soft hover:shadow-medium"
      draggable
      onDragStart={(e) => handleDragStart(e, element)}
      title={element.text} // Show full text on hover
    >
      <span className="text-sm">{element.emoji}</span>
      <span className="font-medium truncate max-w-[80px]">{element.text}</span>
    </div>
  );

  return (
    <Card className="h-full flex flex-col min-h-[600px] max-h-[600px] shadow-medium hover:shadow-large transition-shadow duration-300">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="p-1 rounded-lg bg-gradient-primary shadow-soft">
            <Package className="w-4 h-4 text-white" />
          </div>
          Elements
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search elements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9 border-border/50 focus:border-primary shadow-soft"
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0 min-h-0">
        <Tabs defaultValue="all" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-3 mb-3 flex-shrink-0">
            <TabsTrigger value="all" className="text-xs">
              All ({filteredElements.length})
            </TabsTrigger>
            <TabsTrigger value="discoveries" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              New ({discoveries.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden min-h-0">
            <TabsContent value="all" className="h-full overflow-y-auto px-3 pb-3 mt-0">
              <div className="flex flex-wrap gap-1">
                {filteredElements.length > 0 ? (
                  filteredElements.map(renderElement)
                ) : (
                  <div className="w-full text-center text-muted-foreground py-8">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No elements found</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="discoveries" className="h-full overflow-y-auto px-3 pb-3 mt-0">
              <div className="flex flex-wrap gap-1">
                {discoveries.length > 0 ? (
                  discoveries.map((element) => (
                      <div key={element.id} className="relative">
                      {renderElement(element)}
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse shadow-soft" />
                    </div>
                  ))
                ) : (
                  <div className="w-full text-center text-muted-foreground py-8">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No discoveries yet</p>
                    <p className="text-xs">Combine elements to discover new creations!</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>

      {/* Quick Stats */}
      <div className="border-t border-border/50 p-3 flex-shrink-0 bg-muted/20">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="font-medium">{availableElements.length} Total</span>
          <span className="font-medium">{discoveries.length} Discovered</span>
        </div>
      </div>
    </Card>
  );
};

export default ElementSidebar;