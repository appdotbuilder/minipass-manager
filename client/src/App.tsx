import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Shield, Key, Search, Sparkles } from 'lucide-react';
import { PasswordForm } from '@/components/PasswordForm';
import { PasswordEntry } from '@/components/PasswordEntry';
import { PasswordGenerator } from '@/components/PasswordGenerator';
import { SearchAndFilter } from '@/components/SearchAndFilter';
import { trpc } from '@/utils/trpc';
import type { PasswordEntry as PasswordEntryType, CreatePasswordEntryInput } from '../../server/src/schema';
import './App.css';

function App() {
  const [passwords, setPasswords] = useState<PasswordEntryType[]>([]);
  const [filteredPasswords, setFilteredPasswords] = useState<PasswordEntryType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PasswordEntryType | null>(null);

  // Load passwords
  const loadPasswords = useCallback(async () => {
    try {
      const result = await trpc.getPasswordEntries.query();
      setPasswords(result);
      setFilteredPasswords(result);
    } catch (error) {
      console.error('Failed to load passwords:', error);
    }
  }, []);

  useEffect(() => {
    loadPasswords();
  }, [loadPasswords]);

  // Handle search and filtering
  const handleSearch = useCallback((query: string, category?: string) => {
    let filtered = passwords;

    if (query) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.title.toLowerCase().includes(lowercaseQuery) ||
        entry.website_url?.toLowerCase().includes(lowercaseQuery) ||
        entry.username?.toLowerCase().includes(lowercaseQuery) ||
        entry.notes?.toLowerCase().includes(lowercaseQuery)
      );
    }

    if (category) {
      filtered = filtered.filter(entry => entry.category === category);
    }

    setFilteredPasswords(filtered);
  }, [passwords]);

  // Create new password entry
  const handleCreatePassword = async (data: CreatePasswordEntryInput) => {
    setIsLoading(true);
    try {
      const newEntry = await trpc.createPasswordEntry.mutate(data);
      setPasswords(prev => [newEntry, ...prev]);
      setFilteredPasswords(prev => [newEntry, ...prev]);
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to create password:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update password entry
  const handleUpdatePassword = async (data: CreatePasswordEntryInput) => {
    if (!editingEntry) return;
    
    setIsLoading(true);
    try {
      const updatedEntry = await trpc.updatePasswordEntry.mutate({
        id: editingEntry.id,
        ...data
      });
      
      setPasswords(prev => prev.map(p => p.id === editingEntry.id ? updatedEntry : p));
      setFilteredPasswords(prev => prev.map(p => p.id === editingEntry.id ? updatedEntry : p));
      setEditingEntry(null);
    } catch (error) {
      console.error('Failed to update password:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete password entry
  const handleDeletePassword = async (id: number) => {
    try {
      await trpc.deletePasswordEntry.mutate({ id });
      setPasswords(prev => prev.filter(p => p.id !== id));
      setFilteredPasswords(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete password:', error);
    }
  };

  const handleEditEntry = (entry: PasswordEntryType) => {
    setEditingEntry(entry);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <Shield className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  SecureVault
                </h1>
                <p className="text-sm text-gray-600">Your passwords, secured & organized</p>
              </div>
            </div>
            
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Password
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {passwords.length === 0 ? (
          // Empty State
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <div className="p-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white inline-block">
                  <Key className="h-12 w-12" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to SecureVault! 🔐
              </h2>
              <p className="text-gray-600 mb-8">
                Start securing your digital life by adding your first password entry.
                Generate strong passwords, organize by categories, and keep everything safe in one place.
              </p>
              <div className="space-y-4">
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add Your First Password
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Main Content with Tabs
          <Tabs defaultValue="passwords" className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <TabsList className="grid w-full sm:w-auto grid-cols-2 bg-white/80 backdrop-blur-sm">
                <TabsTrigger value="passwords" className="flex items-center space-x-2">
                  <Search className="h-4 w-4" />
                  <span>My Passwords</span>
                </TabsTrigger>
                <TabsTrigger value="generator" className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Password Generator</span>
                </TabsTrigger>
              </TabsList>
              
              <div className="text-sm text-gray-600 font-medium">
                {passwords.length} {passwords.length === 1 ? 'entry' : 'entries'} total
              </div>
            </div>

            <TabsContent value="passwords" className="space-y-6">
              {/* Search and Filter */}
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <SearchAndFilter
                    onSearch={handleSearch}
                    totalEntries={passwords.length}
                    filteredEntries={filteredPasswords.length}
                  />
                </CardContent>
              </Card>

              {/* Password Entries Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPasswords.map((entry) => (
                  <PasswordEntry
                    key={entry.id}
                    entry={entry}
                    onEdit={handleEditEntry}
                    onDelete={handleDeletePassword}
                  />
                ))}
              </div>

              {filteredPasswords.length === 0 && passwords.length > 0 && (
                <Card className="glass-card">
                  <CardContent className="py-12 text-center">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
                    <p className="text-gray-600">
                      Try adjusting your search terms or clearing the filters.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="generator">
              <div className="max-w-2xl mx-auto">
                <PasswordGenerator />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Add Password Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Add New Password</DialogTitle>
          </DialogHeader>
          <PasswordForm
            onSubmit={handleCreatePassword}
            onCancel={() => setShowAddForm(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Password Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Password Entry</DialogTitle>
          </DialogHeader>
          <PasswordForm
            onSubmit={handleUpdatePassword}
            onCancel={handleCancelEdit}
            isLoading={isLoading}
            editEntry={editingEntry}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;