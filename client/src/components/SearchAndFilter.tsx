import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Category } from '../../../server/src/schema';

interface SearchAndFilterProps {
  onSearch: (query: string, category?: string) => void;
  totalEntries: number;
  filteredEntries: number;
}

export function SearchAndFilter({ onSearch, totalEntries, filteredEntries }: SearchAndFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await trpc.getCategories.query();
        setCategories(result);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Trigger search when query or category changes
  useEffect(() => {
    onSearch(searchQuery, selectedCategory === 'all' ? undefined : selectedCategory);
  }, [searchQuery, selectedCategory, onSearch]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  const hasActiveFilters = searchQuery.length > 0 || selectedCategory !== 'all';

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search passwords by title, website, or username..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10 transition-all focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="text-gray-400 h-4 w-4 sm:hidden" />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px] transition-all focus:ring-2 focus:ring-blue-500/20">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories
                .sort((a, b) => b.count - a.count)
                .map((category) => (
                  <SelectItem key={category.name} value={category.name}>
                    <div className="flex items-center justify-between w-full">
                      <span>{category.name}</span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {category.count}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="sm:w-auto"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          {hasActiveFilters ? (
            <span>
              Showing {filteredEntries} of {totalEntries} entries
            </span>
          ) : (
            <span>{totalEntries} total entries</span>
          )}
          
          {searchQuery && (
            <Badge variant="outline" className="text-xs">
              Search: "{searchQuery}"
            </Badge>
          )}
          
          {selectedCategory !== 'all' && (
            <Badge variant="outline" className="text-xs">
              Category: {selectedCategory}
            </Badge>
          )}
        </div>

        {hasActiveFilters && filteredEntries === 0 && (
          <span className="text-orange-600 font-medium">No matches found</span>
        )}
      </div>
    </div>
  );
}