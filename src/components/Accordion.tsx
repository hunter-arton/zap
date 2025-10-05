// src/components/Accordion.tsx - SIMPLE & CLEAN
import React, { useState } from "react";

interface AccordionItem {
    id: string;
    title: React.ReactNode;
    content: React.ReactNode;
    subtitle?: React.ReactNode;
    rightContent?: React.ReactNode;
}

interface AccordionProps {
    items: AccordionItem[];
    className?: string;
    allowMultiple?: boolean;
}

export const Accordion: React.FC<AccordionProps> = ({
    items,
    className = "",
    allowMultiple = false,
}) => {
    const [openIds, setOpenIds] = useState<Set<string>>(new Set());

    const toggleItem = (id: string) => {
        const newOpenIds = new Set(openIds);

        if (newOpenIds.has(id)) {
            newOpenIds.delete(id);
        } else {
            if (!allowMultiple) {
                newOpenIds.clear();
            }
            newOpenIds.add(id);
        }

        setOpenIds(newOpenIds);
    };

    const isOpen = (id: string) => openIds.has(id);

    return (
        <div className={`space-y-3 ${className}`}>
            {items.map((item) => {
                const open = isOpen(item.id);

                return (
                    <div
                        key={item.id}
                        className="bg-gray-900 border border-gray-700 hover:border-gray-500 rounded-lg transition-all overflow-hidden"
                    >
                        {/* Header */}
                        <button
                            onClick={() => toggleItem(item.id)}
                            className="w-full p-4 text-left hover:bg-gray-800 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    {typeof item.title === 'string' ? (
                                        <h3 className="font-medium text-white font-mono text-sm">
                                            {item.title}
                                        </h3>
                                    ) : (
                                        item.title
                                    )}
                                </div>

                                {item.rightContent && (
                                    <div className="ml-4 flex-shrink-0">
                                        {item.rightContent}
                                    </div>
                                )}
                            </div>
                        </button>

                        {/* Content */}
                        {open && (
                            <div className="border-t border-gray-700 bg-black p-4">
                                {typeof item.content === 'string' ? (
                                    <div className="text-gray-300 font-mono text-sm whitespace-pre-wrap">
                                        {item.content}
                                    </div>
                                ) : (
                                    item.content
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};