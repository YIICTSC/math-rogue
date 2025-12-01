import React, { useEffect, useRef, useState } from 'react';
import { MapNode, NodeType, Player } from '../types';
import { Swords, Skull, BedDouble, ShoppingBag, HelpCircle, AlertTriangle, PlayCircle, Coins, Heart, Layers, X } from 'lucide-react';
import { MAP_WIDTH, MAP_HEIGHT } from '../services/mapGenerator';
import Card from './Card';

interface MapScreenProps {
  nodes: MapNode[];
  currentNodeId: string | null;
  onNodeSelect: (node: MapNode) => void;
  player: Player;
}

const MapScreen: React.FC<MapScreenProps> = ({ nodes, currentNodeId, onNodeSelect, player }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showDeck, setShowDeck] = useState(false);

  // Auto scroll to current node logic
  useEffect(() => {
    if (scrollRef.current) {
        const currentNode = nodes.find(n => n.id === currentNodeId);
        const totalHeight = MAP_HEIGHT * 80 + 100;
        let targetScroll = totalHeight; 

        if (currentNode) {
             const nodeBottom = currentNode.y * 80 + 50;
             targetScroll = totalHeight - nodeBottom - (scrollRef.current.clientHeight / 2);
        } else {
            targetScroll = scrollRef.current.scrollHeight;
        }
        
        scrollRef.current.scrollTop = targetScroll;
    }
  }, [currentNodeId, nodes]);

  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case NodeType.COMBAT: return <Swords size={16} />;
      case NodeType.ELITE: return <Skull size={16} className="text-red-500" />;
      case NodeType.REST: return <BedDouble size={16} />;
      case NodeType.SHOP: return <ShoppingBag size={16} />;
      case NodeType.EVENT: return <HelpCircle size={16} />;
      case NodeType.BOSS: return <AlertTriangle size={24} className="text-red-600 animate-pulse" />;
      case NodeType.START: return <PlayCircle size={16} />;
      default: return <div className="w-2 h-2 rounded-full bg-white" />;
    }
  };

  const getGridPosition = (node: MapNode) => {
    const left = `${((node.x + 0.5) / MAP_WIDTH) * 100}%`;
    const bottom = `${node.y * 80 + 50}px`; // Fixed height per floor
    return { left, bottom };
  };

  // Determine available nodes
  let availableNodeIds: string[] = [];
  if (!currentNodeId) {
    // Standard start: Type START
    const startNodes = nodes.filter(n => n.type === NodeType.START).map(n => n.id);
    if (startNodes.length > 0) {
        availableNodeIds = startNodes;
    } else {
        // Special case (e.g. Act 4 Boss Rush start): If no START nodes, enable all nodes at y=0 (or just enable the only node if count is 1)
        availableNodeIds = nodes.filter(n => n.y === 0).map(n => n.id);
    }
  } else {
    const currentNode = nodes.find(n => n.id === currentNodeId);
    if (currentNode && currentNode.completed) {
      availableNodeIds = currentNode.nextNodes;
    }
  }

  // Draw connections (lines)
  const connections = [];
  nodes.forEach(node => {
      node.nextNodes.forEach(nextId => {
          const nextNode = nodes.find(n => n.id === nextId);
          if (nextNode) {
              connections.push({ from: node, to: nextNode });
          }
      });
  });

  const sortedDeck = [...player.deck].sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    if (a.cost !== b.cost) return a.cost - b.cost;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 relative">
        
        {/* Status Header - Compact for Mobile */}
        <div className="p-2 bg-black border-b border-gray-700 z-20 flex justify-between items-center shadow-lg shrink-0">
             <div className="flex gap-2 text-xs md:text-sm">
                 <div className="flex items-center text-red-400 border border-red-500 bg-red-900/20 px-2 py-1 rounded">
                     <Heart size={14} className="mr-1" />
                     <span className="font-bold">{player.currentHp}/{player.maxHp}</span>
                 </div>
                 <div className="flex items-center text-yellow-400 border border-yellow-500 bg-yellow-900/20 px-2 py-1 rounded">
                     <Coins size={14} className="mr-1" />
                     <span className="font-bold">{player.gold}</span>
                 </div>
             </div>

             <h2 className="text-sm md:text-xl text-yellow-400 font-bold tracking-widest truncate mx-2">MAP</h2>

             <button 
                onClick={() => setShowDeck(true)}
                className="flex items-center text-blue-300 border border-blue-500 bg-blue-900/20 px-2 py-1 rounded hover:bg-blue-900/50 cursor-pointer text-xs md:text-sm"
             >
                 <Layers size={14} className="mr-1" />
                 <span>({player.deck.length})</span>
             </button>
        </div>

        {/* Map Content */}
        <div ref={scrollRef} className="flex-grow overflow-y-auto relative custom-scrollbar z-10" style={{ scrollBehavior: 'smooth' }}>
            <div className="relative w-full max-w-2xl mx-auto" style={{ height: `${MAP_HEIGHT * 80 + 100}px` }}>
                
                {/* Connections SVG Layer */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    {connections.map((conn, idx) => {
                        const x1 = ((conn.from.x + 0.5) / MAP_WIDTH) * 100;
                        const y1 = (conn.from.y * 80 + 70); 
                        const x2 = ((conn.to.x + 0.5) / MAP_WIDTH) * 100;
                        const y2 = (conn.to.y * 80 + 30); 
                        
                        const totalH = MAP_HEIGHT * 80 + 100;
                        const svgY1 = totalH - y1;
                        const svgY2 = totalH - y2;

                        let strokeColor = "#374151"; 
                        const isVisited = conn.from.completed;
                        if (isVisited && currentNodeId === conn.from.id && availableNodeIds.includes(conn.to.id)) {
                             strokeColor = "#FBBF24"; 
                        } else if (conn.from.completed && conn.to.completed) {
                             strokeColor = "#4B5563"; 
                        }

                        return (
                            <line 
                                key={`${conn.from.id}-${conn.to.id}`}
                                x1={`${x1}%`} y1={svgY1}
                                x2={`${x2}%`} y2={svgY2}
                                stroke={strokeColor}
                                strokeWidth="2"
                                strokeDasharray="4 2"
                            />
                        );
                    })}
                </svg>

                {/* Nodes */}
                {nodes.map(node => {
                    const isAvailable = availableNodeIds.includes(node.id);
                    const isCurrent = currentNodeId === node.id;
                    const isCompleted = node.completed;
                    const { left, bottom } = getGridPosition(node);
                    
                    let bgClass = "bg-gray-800 border-gray-600 text-gray-500";
                    if (isCompleted) bgClass = "bg-gray-600 border-gray-400 text-gray-300 opacity-50";
                    if (isCurrent) bgClass = "bg-yellow-600 border-yellow-300 text-white shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-pulse";
                    if (isAvailable) bgClass = "bg-white border-blue-500 text-black animate-bounce shadow-lg cursor-pointer hover:bg-blue-100";

                    return (
                        <div 
                            key={node.id}
                            className={`absolute w-12 h-12 -ml-6 flex items-center justify-center rounded-full border-2 transition-all duration-300 z-10 ${bgClass}`}
                            style={{ left, bottom }}
                            onClick={() => isAvailable ? onNodeSelect(node) : null}
                        >
                            {getNodeIcon(node.type)}
                            {node.type === NodeType.BOSS && <span className="absolute -top-6 text-red-500 font-bold text-xs">BOSS</span>}
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Deck View Modal */}
        {showDeck && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDeck(false)}>
                <div className="bg-gray-800 border-4 border-white w-full max-w-md h-[80vh] flex flex-col relative shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="bg-black border-b-2 border-gray-600 p-4 flex justify-between items-center">
                        <h2 className="text-white text-xl font-bold flex items-center">
                            <Layers className="mr-2"/> デッキ
                        </h2>
                        <button onClick={() => setShowDeck(false)} className="text-gray-400 hover:text-white p-1">
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="p-4 overflow-y-auto flex-grow bg-gray-900/90 custom-scrollbar">
                        <div className="grid grid-cols-3 gap-2 justify-items-center">
                            {sortedDeck.map((card) => (
                                <div key={card.id} className="scale-75 origin-top-left w-24 h-36">
                                    <Card card={card} onClick={() => {}} disabled={false} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default MapScreen;