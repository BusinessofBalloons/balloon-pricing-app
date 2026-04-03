import { useState, useEffect, useCallback, useRef } from 'react';
import { client } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLogo } from '@/lib/logo-context';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import CurrencyInput from '@/components/CurrencyInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Save,
  Upload,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Pencil,
  Check,
} from 'lucide-react';

interface BalloonSize {
  id: number;
  size_name: string;
  price_per_balloon: number;
  sort_order?: number;
}

interface SettingsData {
  id?: number;
  hourly_labor_rate: number;
  overhead_percent: number;
  markup_percent: number;
  logo_object_key?: string;
}

export default function SettingsPage() {
  const { user, loading, login, logout } = useAuth();
  const { logoUrl, refreshLogo } = useLogo();

  const [settings, setSettings] = useState<SettingsData>({
    hourly_labor_rate: 25,
    overhead_percent: 15,
    markup_percent: 30,
  });
  const [settingsId, setSettingsId] = useState<number | null>(null);
  const [sizes, setSizes] = useState<BalloonSize[]>([]);
  const [newSizeName, setNewSizeName] = useState('');
  const [newSizePrice, setNewSizePrice] = useState<number>(0);
  const [savingSettings, setSavingSettings] = useState(false);
  const [addingSize, setAddingSize] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Collapsible items list state
  const [itemsExpanded, setItemsExpanded] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const settingsRes = await client.entities.balloon_settings.query({
        query: {},
        limit: 1,
      });
      if (settingsRes?.data?.items?.length > 0) {
        const s = settingsRes.data.items[0];
        setSettings({
          hourly_labor_rate: s.hourly_labor_rate ?? 25,
          overhead_percent: s.overhead_percent ?? 15,
          markup_percent: s.markup_percent ?? 30,
          logo_object_key: s.logo_object_key ?? undefined,
        });
        setSettingsId(s.id);
      }

      const sizesRes = await client.entities.balloon_sizes.query({
        query: {},
        sort: 'sort_order',
        limit: 200,
      });
      if (sizesRes?.data?.items) {
        setSizes(sizesRes.data.items);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveSettings = async () => {
    if (!user) return;
    setSavingSettings(true);
    try {
      if (settingsId) {
        await client.entities.balloon_settings.update({
          id: String(settingsId),
          data: {
            hourly_labor_rate: settings.hourly_labor_rate,
            overhead_percent: settings.overhead_percent,
            markup_percent: settings.markup_percent,
          },
        });
      } else {
        const res = await client.entities.balloon_settings.create({
          data: {
            hourly_labor_rate: settings.hourly_labor_rate,
            overhead_percent: settings.overhead_percent,
            markup_percent: settings.markup_percent,
          },
        });
        if (res?.data?.id) setSettingsId(res.data.id);
      }
      toast.success('Settings saved!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (PNG, JPG, GIF, WebP, or SVG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const objectKey = `logo_${user.id}_${Date.now()}.${ext}`;

      // Upload the file
      await client.storage.upload({
        bucket_name: 'logos',
        object_key: objectKey,
        file: file,
      });

      // Save or create settings with logo key
      if (settingsId) {
        await client.entities.balloon_settings.update({
          id: String(settingsId),
          data: {
            logo_object_key: objectKey,
          },
        });
      } else {
        const res = await client.entities.balloon_settings.create({
          data: {
            hourly_labor_rate: settings.hourly_labor_rate,
            overhead_percent: settings.overhead_percent,
            markup_percent: settings.markup_percent,
            logo_object_key: objectKey,
          },
        });
        if (res?.data?.id) setSettingsId(res.data.id);
      }

      setSettings((s) => ({ ...s, logo_object_key: objectKey }));
      await refreshLogo();
      toast.success('Logo uploaded successfully!');
    } catch (err) {
      console.error('Logo upload failed:', err);
      toast.error('Failed to upload logo. Please try again.');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeLogo = async () => {
    if (!settingsId) return;
    setUploadingLogo(true);
    try {
      await client.entities.balloon_settings.update({
        id: String(settingsId),
        data: {
          logo_object_key: '',
        },
      });
      setSettings((s) => ({ ...s, logo_object_key: undefined }));
      await refreshLogo();
      toast.success('Logo removed');
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const addSize = async () => {
    if (!user) return;
    if (!newSizeName.trim()) {
      toast.error('Enter an item name');
      return;
    }
    if (newSizePrice <= 0) {
      toast.error('Enter a valid price');
      return;
    }
    setAddingSize(true);
    try {
      const res = await client.entities.balloon_sizes.create({
        data: {
          size_name: newSizeName.trim(),
          price_per_balloon: newSizePrice,
          sort_order: sizes.length + 1,
        },
      });
      if (res?.data) {
        setSizes((prev) => [...prev, res.data]);
      }
      setNewSizeName('');
      setNewSizePrice(0);
      toast.success('Item added!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add item');
    } finally {
      setAddingSize(false);
    }
  };

  const deleteSize = async (id: number) => {
    try {
      await client.entities.balloon_sizes.delete({ id: String(id) });
      setSizes((prev) => prev.filter((s) => s.id !== id));
      toast.success('Item removed');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete item');
    }
  };

  const startEditPrice = (size: BalloonSize) => {
    setEditingId(size.id);
    setEditPrice(size.price_per_balloon);
  };

  const saveEditPrice = async (id: number) => {
    if (editPrice <= 0) {
      toast.error('Enter a valid price');
      return;
    }
    try {
      await client.entities.balloon_sizes.update({
        id: String(id),
        data: { price_per_balloon: editPrice },
      });
      setSizes((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, price_per_balloon: editPrice } : s
        )
      );
      setEditingId(null);
      toast.success('Price updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update price');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  // Filter items by search
  const filteredSizes = sizes.filter((s) =>
    s.size_name.toLowerCase().includes(itemSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#D4A017]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={null} onLogin={login} onLogout={logout} />
        <div className="flex flex-col items-center justify-center px-6 pt-24 text-center">
          <p className="text-muted-foreground mb-4">
            Please sign in to manage your settings.
          </p>
          <Button onClick={login} className="golden-gradient text-white">
            Sign In
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
      <Header user={user} onLogin={login} onLogout={logout} />

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Logo Upload */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Business Logo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Upload your logo to display across the app header.
            </p>

            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {logoUrl ? (
                  <div className="relative">
                    <img
                      src={logoUrl}
                      alt="Business Logo"
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#D4A017]/30"
                    />
                    <button
                      onClick={removeLogo}
                      disabled={uploadingLogo}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/80 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full golden-gradient flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">B</span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadingLogo ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
                </Button>
                <p className="text-[10px] text-muted-foreground mt-1">
                  PNG, JPG, GIF, WebP, or SVG. Max 5MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Default Rates */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Default Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">
                Hourly Labor Rate ($)
              </Label>
              <CurrencyInput
                value={settings.hourly_labor_rate}
                onChange={(val) =>
                  setSettings((s) => ({ ...s, hourly_labor_rate: val }))
                }
                placeholder="25.00"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Overhead %
                </Label>
                <CurrencyInput
                  value={settings.overhead_percent}
                  onChange={(val) =>
                    setSettings((s) => ({ ...s, overhead_percent: val }))
                  }
                  placeholder="15"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Markup %
                </Label>
                <CurrencyInput
                  value={settings.markup_percent}
                  onChange={(val) =>
                    setSettings((s) => ({ ...s, markup_percent: val }))
                  }
                  placeholder="30"
                  className="mt-1"
                />
              </div>
            </div>
            <Button
              onClick={saveSettings}
              disabled={savingSettings}
              className="w-full golden-gradient text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>

        {/* Balloon Sizes & Other Items */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Balloon Sizes &amp; Other Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Add new item */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Item name"
                  value={newSizeName}
                  onChange={(e) => setNewSizeName(e.target.value)}
                />
                <CurrencyInput
                  value={newSizePrice}
                  onChange={(val) => setNewSizePrice(val)}
                  placeholder="Price ($)"
                />
              </div>
              <Button
                variant="outline"
                className="w-full text-sm"
                onClick={addSize}
                disabled={addingSize}
              >
                <Plus className="mr-1.5 h-4 w-4 shrink-0" />
                <span className="truncate">
                  {addingSize ? 'Adding...' : 'Add Item'}
                </span>
              </Button>
            </div>

            {/* Collapsible existing items */}
            {sizes.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setItemsExpanded(!itemsExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/50 hover:bg-muted transition-colors text-sm font-medium"
                >
                  <span>
                    Manage Items ({sizes.length})
                  </span>
                  {itemsExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {itemsExpanded && (
                  <div className="border-t border-border">
                    {/* Search filter */}
                    {sizes.length > 5 && (
                      <div className="px-3 py-2 border-b border-border">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            placeholder="Search items..."
                            value={itemSearch}
                            onChange={(e) => setItemSearch(e.target.value)}
                            className="pl-8 h-8 text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {/* Items list */}
                    <div className="max-h-64 overflow-y-auto">
                      {filteredSizes.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {itemSearch ? 'No items match your search.' : 'No items yet.'}
                        </p>
                      ) : (
                        filteredSizes.map((size) => (
                          <div
                            key={size.id}
                            className="flex items-center justify-between px-3 py-2 border-b border-border last:border-0 hover:bg-muted/30"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {size.size_name}
                              </p>
                              {editingId === size.id ? (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-xs text-muted-foreground">$</span>
                                  <CurrencyInput
                                    value={editPrice}
                                    onChange={(val) => setEditPrice(val)}
                                    className="w-20 h-6 text-xs px-1.5"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveEditPrice(size.id);
                                      if (e.key === 'Escape') cancelEdit();
                                    }}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-green-600 hover:text-green-700"
                                    onClick={() => saveEditPrice(size.id)}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground"
                                    onClick={cancelEdit}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  ${size.price_per_balloon.toFixed(2)} each
                                </p>
                              )}
                            </div>
                            {editingId !== size.id && (
                              <div className="flex items-center gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  onClick={() => startEditPrice(size)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => deleteSize(size.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {sizes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                No items yet. Add your first item above.
              </p>
            )}
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}