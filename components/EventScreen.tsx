
import React from 'react';
import { HelpCircle, ArrowRight } from 'lucide-react';

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
    resultLog: string | null;
    onContinue: () => void;
}

const EventScreen: React.FC<EventScreenProps> = ({ title, description, options, image, resultLog, onContinue }) => {
  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative items-center justify-center p-8">
        
        <div className="z-10 max-w-2xl w-full bg-gray-800 border-2 border-gray-600 p-8 rounded-lg shadow-2xl">
            <div className="flex items-center mb-6 border-b border-gray-700 pb-4">
                <div className="bg-purple-900 p-3 rounded-full mr-4 border border-purple-500">
                    <HelpCircle size={32} className="text-purple-300" />
                </div>
                <h2 className="text-3xl font-bold text-purple-100">{title}</h2>
            </div>
            
            <div className="text-lg text-gray-300 mb-8 leading-relaxed whitespace-pre-wrap min-h-[6rem]">
                {resultLog ? (
                    <div className="animate-in fade-in duration-500">
                        <p className="text-yellow-300 font-bold mb-2">結果:</p>
                        {resultLog}
                    </div>
                ) : (
                    description
                )}
            </div>

            <div className="flex flex-col gap-4">
                {!resultLog ? (
                    // Options Mode: 選択肢のラベル(label)のみを表示し、詳細な結果(text)は非表示にする
                    options.map((opt, idx) => (
                        <button 
                            key={idx}
                            onClick={opt.action}
                            className="w-full text-center p-5 bg-black/40 hover:bg-purple-900/40 border border-gray-600 hover:border-purple-400 rounded transition-colors group"
                        >
                            <span className="font-bold text-yellow-400 block group-hover:text-yellow-200 text-xl tracking-widest">
                                {opt.label}
                            </span>
                        </button>
                    ))
                ) : (
                    // Result Mode
                    <button 
                        onClick={onContinue}
                        className="w-full text-center p-4 bg-blue-900/40 hover:bg-blue-800/60 border border-blue-500 hover:border-blue-300 rounded transition-colors flex items-center justify-center font-bold text-xl animate-bounce"
                    >
                        進む <ArrowRight className="ml-2" />
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};

export default EventScreen;
