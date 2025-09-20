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
  spanish: string;
  english: string;
}

interface ElementSidebarProps {
  availableElements: Element[];
  discoveries: Element[];
  onElementDragStart: (element: Element) => void;
}

const ElementSidebar = ({ availableElements, discoveries, onElementDragStart }: ElementSidebarProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredElements = availableElements.filter(element =>
    element.spanish.toLowerCase().includes(searchTerm.toLowerCase()) ||
    element.english.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDragStart = (e: React.DragEvent, element: Element) => {
    e.dataTransfer.setData('application/json', JSON.stringify(element));
    onElementDragStart(element);
  };

  const renderElement = (element: Element) => (
    <div
      key={element.id}
      className="discovery-item battle-element cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={(e) => handleDragStart(e, element)}
    >
      <span className="text-lg">{element.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{element.spanish}</div>
        <div className="text-xs text-muted-foreground truncate">{element.english}</div>
      </div>
    </div>
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="w-5 h-5" />
          Elements
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search elements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <Tabs defaultValue="all" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-3 mb-3">
            <TabsTrigger value="all" className="text-xs">
              All ({filteredElements.length})
            </TabsTrigger>
            <TabsTrigger value="discoveries" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              New ({discoveries.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="all" className="h-full overflow-y-auto px-3 pb-3 mt-0">
              <div className="space-y-2">
                {filteredElements.length > 0 ? (
                  filteredElements.map(renderElement)
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No elements found</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="discoveries" className="h-full overflow-y-auto px-3 pb-3 mt-0">
              <div className="space-y-2">
                {discoveries.length > 0 ? (
                  discoveries.map((element) => (
                    <div key={element.id} className="relative">
                      {renderElement(element)}
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No discoveries yet</p>
                    <p className="text-xs">Combine elements to discover new words!</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>

      {/* Quick Stats */}
      <div className="border-t p-3">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{availableElements.length} Total</span>
          <span>{discoveries.length} Discovered</span>
        </div>
      </div>
    </Card>
  );
};

export default ElementSidebar;