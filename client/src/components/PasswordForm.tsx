import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, Plus, Wand2 } from 'lucide-react';
import { PasswordGenerator } from './PasswordGenerator';
import { trpc } from '@/utils/trpc';
import type { CreatePasswordEntryInput, PasswordEntry, Category } from '../../../server/src/schema';

interface PasswordFormProps {
  onSubmit: (data: CreatePasswordEntryInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  editEntry?: PasswordEntry | null;
}

const commonCategories = [
  'Work',
  'Personal',
  'Social Media',
  'Finance',
  'Shopping',
  'Entertainment',
  'Education',
  'Travel',
  'Health',
  'Other'
];

export function PasswordForm({ onSubmit, onCancel, isLoading = false, editEntry }: PasswordFormProps) {
  const [formData, setFormData] = useState<CreatePasswordEntryInput>({
    title: '',
    website_url: null,
    username: null,
    password: '',
    category: '',
    notes: null
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
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

  // Populate form for editing
  useEffect(() => {
    if (editEntry) {
      setFormData({
        title: editEntry.title,
        website_url: editEntry.website_url,
        username: editEntry.username,
        password: editEntry.password,
        category: editEntry.category,
        notes: editEntry.notes
      });
    }
  }, [editEntry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      if (!editEntry) {
        // Reset form only for new entries
        setFormData({
          title: '',
          website_url: null,
          username: null,
          password: '',
          category: '',
          notes: null
        });
      }
    } catch (error) {
      console.error('Failed to submit form:', error);
    }
  };

  const handlePasswordGenerated = (password: string) => {
    setFormData(prev => ({ ...prev, password }));
    setShowGenerator(false);
  };

  const allCategories = [
    ...new Set([
      ...categories.map(c => c.name),
      ...commonCategories
    ])
  ].sort();

  return (
    <Card className="glass-card">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreatePasswordEntryInput) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g., Gmail Account, Work VPN"
              required
              className="transition-all focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Website URL */}
          <div className="space-y-2">
            <Label htmlFor="website" className="text-sm font-medium">Website URL</Label>
            <Input
              id="website"
              type="url"
              value={formData.website_url || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreatePasswordEntryInput) => ({
                  ...prev,
                  website_url: e.target.value || null
                }))
              }
              placeholder="https://example.com"
              className="transition-all focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">Username/Email</Label>
            <Input
              id="username"
              value={formData.username || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreatePasswordEntryInput) => ({
                  ...prev,
                  username: e.target.value || null
                }))
              }
              placeholder="john.doe@example.com"
              className="transition-all focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Password with Generator */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password <span className="text-red-500">*</span>
            </Label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePasswordEntryInput) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Enter or generate a strong password"
                  required
                  className="pr-10 transition-all focus:ring-2 focus:ring-blue-500/20"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              
              <Dialog open={showGenerator} onOpenChange={setShowGenerator}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="icon" className="shrink-0">
                    <Wand2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Generate Strong Password</DialogTitle>
                  </DialogHeader>
                  <PasswordGenerator 
                    onPasswordGenerated={handlePasswordGenerated}
                    inline={true}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.category || 'Personal'}
              onValueChange={(value) => setFormData((prev: CreatePasswordEntryInput) => ({ ...prev, category: value }))}
              required
            >
              <SelectTrigger className="transition-all focus:ring-2 focus:ring-blue-500/20">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {allCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                    {categories.find(c => c.name === category) && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({categories.find(c => c.name === category)?.count})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreatePasswordEntryInput) => ({
                  ...prev,
                  notes: e.target.value || null
                }))
              }
              placeholder="Additional notes or recovery information..."
              rows={3}
              className="resize-none transition-all focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading || !formData.title || !formData.password || !formData.category}
              className="flex-1"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editEntry ? 'Updating...' : 'Saving...'}
                </div>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {editEntry ? 'Update Entry' : 'Save Entry'}
                </>
              )}
            </Button>
            
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} size="lg">
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}