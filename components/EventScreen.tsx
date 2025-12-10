
import React from 'react';
import { HelpCircle } from 'lucide-react';

interface EventOption {
    text: string;
    action: () => void;
    label: string;
}

interface EventScreenProps {
    title: string;
    description: string;
    options: EventOption[];
    image?: string;
}

const EventScreen: React.FC<EventScreenProps> = ({ title, description, options, image }) => {
  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative items-center justify-center p-8">
        <div className="absolute inset-0 bg-black/50 z-0"></div>
        {image && <div className="absolute inset-0 bg-cover bg-center opacity-20 z-0" style={{ backgroundImage: `url(${image})` }}></div>}

        <div className="z-10 max-w-2xl w-full bg-gray-800 border-2 border-gray-600 p-8 rounded-lg shadow-2xl">
            <div className="flex items-center mb-6 border-b border-gray-700 pb-4">
                <div className="bg-purple-900 p-3 rounded-full mr-4 border border-purple-500">
                    <HelpCircle size={32} className="text-purple-300" />
                </div>
                <h2 className="text-3xl font-bold text-purple-100">{title}</h2>
            </div>
            
            <p className="text-lg text-gray-300 mb-8 leading-relaxed whitespace-pre-wrap">
                {description}
            </p>

            <div className="flex flex-col gap-4">
                {options.map((opt, idx) => (
                    <button 
                        key={idx}
                        onClick={opt.action}
                        className="w-full text-left p-4 bg-black/40 hover:bg-purple-900/40 border border-gray-600 hover:border-purple-400 rounded transition-colors group"
                    >
                        <span className="font-bold text-yellow-400 block mb-1 group-hover:text-yellow-200">
                            {opt.label}
                        </span>
                        <span className="text-sm text-gray-400 group-hover:text-gray-200">
                            {opt.text}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    </div>
  );
};

export default EventScreen;
