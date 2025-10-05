// src/components/ItemList.tsx
import React, { useState } from "react";
import { Search } from "lucide-react";

interface ItemListProps<T> {
    items: T[];
    isLoading?: boolean;

    // Search
    searchable?: boolean;
    searchPlaceholder?: string;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;

    // Selection (for bulk operations)
    selectable?: boolean;
    selectedIds?: string[];
    onSelectionChange?: (selectedIds: string[]) => void;
    getItemId: (item: T) => string;

    // Rendering
    renderItem: (item: T, isSelected?: boolean, onToggleSelect?: () => void) => React.ReactNode;

    // Empty state
    emptyIcon?: React.ReactNode;
    emptyTitle?: string;
    emptyDescription?: string;
    emptyAction?: React.ReactNode;

    // Layout
    columns?: 1 | 2 | 3 | 4;
    className?: string;
}

export function ItemList<T>({
    items,
    isLoading = false,
    searchable = false,
    searchPlaceholder = "Search...",
    searchQuery = "",
    onSearchChange,
    selectable = false,
    selectedIds = [],
    onSelectionChange,
    getItemId,
    renderItem,
    emptyIcon,
    emptyTitle = "No items",
    emptyDescription = "No items to display",
    emptyAction,
    columns = 1,
    className = "",
}: ItemListProps<T>) {
    const [internalSearchQuery, setInternalSearchQuery] = useState("");

    // Use external search query if provided, otherwise internal
    const currentSearchQuery = onSearchChange ? searchQuery : internalSearchQuery;
    const handleSearchChange = onSearchChange || setInternalSearchQuery;

    // Selection handlers
    const isItemSelected = (item: T) => selectedIds.includes(getItemId(item));

    const toggleItemSelection = (item: T) => {
        if (!onSelectionChange) return;

        const itemId = getItemId(item);
        const newSelection = isItemSelected(item)
            ? selectedIds.filter(id => id !== itemId)
            : [...selectedIds, itemId];

        onSelectionChange(newSelection);
    };

    const toggleSelectAll = () => {
        if (!onSelectionChange) return;

        if (selectedIds.length === items.length) {
            onSelectionChange([]);
        } else {
            onSelectionChange(items.map(getItemId));
        }
    };

    // Grid columns class
    const getGridClass = () => {
        const colMap = {
            1: "grid-cols-1",
            2: "grid-cols-1 lg:grid-cols-2",
            3: "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3",
            4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        };
        return colMap[columns];
    };

    return (
        <div className={`h-full flex flex-col ${className}`}>
            {/* Search Section */}
            {searchable && (
                <div className="border-b border-gray-700 p-4 flex-shrink-0">
                    <div className="relative">
                        <div className="relative bg-black border-2 border-gray-600 rounded-lg hover:border-gray-400 transition-all duration-200 focus-within:border-white focus-within:shadow-lg focus-within:shadow-gray-400/20">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={currentSearchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full pl-12 pr-4 py-3 bg-transparent text-white placeholder-gray-400 outline-none font-mono text-sm"
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck={false}
                            />
                            {currentSearchQuery && (
                                <button
                                    onClick={() => handleSearchChange("")}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-sm font-mono transition-colors"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Search Results Info */}
                    {currentSearchQuery && (
                        <div className="text-sm text-gray-400 font-mono mt-3">
                            Found {items.length} item{items.length !== 1 ? 's' : ''}
                            {currentSearchQuery && ` for "${currentSearchQuery}"`}
                        </div>
                    )}
                </div>
            )}

            {/* Selection Header */}
            {selectable && items.length > 0 && !isLoading && (
                <div className="border-b border-gray-700 p-4 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div
                            className={`w-4 h-4 border-2 rounded cursor-pointer ${selectedIds.length === items.length ? 'border-white' : 'border-gray-600'}`}
                            onClick={toggleSelectAll}
                        />
                        <span className="text-sm text-gray-400 font-mono">
                            {selectedIds.length} of {items.length} selected
                        </span>
                    </div>
                    {selectedIds.length > 0 && (
                        <button
                            onClick={() => onSelectionChange?.([])}
                            className="text-sm text-blue-400 hover:text-blue-300 font-mono"
                        >
                            Clear selection
                        </button>
                    )}
                </div>
            )}

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {/* Loading */}
                {isLoading && (
                    <div className="text-center py-8">
                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <div className="text-white font-mono">Loading...</div>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && items.length === 0 && (
                    <div className="text-center py-16">
                        {emptyIcon && <div className="mb-4">{emptyIcon}</div>}
                        <h3 className="text-lg font-bold text-white mb-2 font-mono">{emptyTitle}</h3>
                        <p className="text-gray-400 mb-6 font-mono">{emptyDescription}</p>
                        {emptyAction}
                    </div>
                )}

                {/* Items Grid */}
                {!isLoading && items.length > 0 && (
                    <div className={`grid ${getGridClass()} gap-4`}>
                        {items.map((item) => {
                            const isSelected = selectable ? isItemSelected(item) : false;
                            const onToggleSelect = selectable ? () => toggleItemSelection(item) : undefined;

                            return (
                                <div key={getItemId(item)} className="relative">
                                    {renderItem(item, isSelected, onToggleSelect)}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
