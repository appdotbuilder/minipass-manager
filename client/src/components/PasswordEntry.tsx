import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Copy, Edit, Trash2, Eye, EyeOff, ExternalLink, User, Globe, Calendar, FileText } from 'lucide-react';
import type { PasswordEntry as PasswordEntryType } from '../../../server/src/schema';

interface PasswordEntryProps {
  entry: PasswordEntryType;
  onEdit: (entry: PasswordEntryType) => void;
  onDelete: (id: number) => void;
}

export function PasswordEntry({ entry, onEdit, onDelete }: PasswordEntryProps) {
  const [showPassword, setShowPassword] = useState(false);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (error) {
      console.error(`Failed to copy ${type}:`, error);
    }
  };

  const openWebsite = () => {
    if (entry.website_url) {
      const url = entry.website_url.startsWith('http') 
        ? entry.website_url 
        : `https://${entry.website_url}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Work': 'bg-blue-100 text-blue-800 border-blue-200',
      'Personal': 'bg-green-100 text-green-800 border-green-200',
      'Social Media': 'bg-purple-100 text-purple-800 border-purple-200',
      'Finance': 'bg-red-100 text-red-800 border-red-200',
      'Shopping': 'bg-orange-100 text-orange-800 border-orange-200',
      'Entertainment': 'bg-pink-100 text-pink-800 border-pink-200',
      'Education': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Travel': 'bg-teal-100 text-teal-800 border-teal-200',
      'Health': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Other': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[category as keyof typeof colors] || colors['Other'];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <Card className="glass-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-lg text-gray-900">{entry.title}</h3>
              <Badge variant="outline" className={getCategoryColor(entry.category)}>
                {entry.category}
              </Badge>
            </div>
            
            {entry.website_url && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                <Globe className="h-3 w-3" />
                <button
                  onClick={openWebsite}
                  className="hover:text-blue-600 hover:underline flex items-center space-x-1"
                >
                  <span>{entry.website_url}</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            )}
            
            {entry.username && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-3 w-3" />
                <span>{entry.username}</span>
              </div>
            )}
          </div>

          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(entry)}
              className="text-gray-600 hover:text-blue-600"
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Password Entry</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{entry.title}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(entry.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Password Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-600 hover:text-blue-600 h-8 w-8 p-0"
              >
                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(entry.password, 'password')}
                className="text-gray-600 hover:text-blue-600 h-8 w-8 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="font-mono text-sm bg-gray-50 rounded-md px-3 py-2 border">
            {showPassword ? (
              <span className="break-all">{entry.password}</span>
            ) : (
              <span className="password-hidden">{'•'.repeat(Math.min(entry.password.length, 20))}</span>
            )}
          </div>
        </div>

        {/* Additional Info Buttons */}
        <div className="flex flex-wrap gap-2">
          {entry.username && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(entry.username || '', 'username')}
              className="text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy Username
            </Button>
          )}
          
          {entry.website_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(entry.website_url || '', 'website URL')}
              className="text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy URL
            </Button>
          )}
        </div>

        {/* Notes */}
        {entry.notes && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <FileText className="h-3 w-3 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Notes</label>
            </div>
            <div className="text-sm text-gray-600 bg-gray-50 rounded-md px-3 py-2 border">
              {entry.notes}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>Created: {formatDate(entry.created_at)}</span>
          </div>
          {entry.updated_at.getTime() !== entry.created_at.getTime() && (
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Updated: {formatDate(entry.updated_at)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}