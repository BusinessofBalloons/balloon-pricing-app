import { useState, useEffect, useCallback } from 'react';
import { client } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import CurrencyInput from '@/components/CurrencyInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Minus, Save, RotateCcw, Trash2 } from 'lucide-react';

interface BalloonSize {
  id: number;
  size_name: string;
  price_per_balloon: number;
  sort_order?: number;
}

interface BalloonEntry {
  sizeId: number;
  sizeName: string;
  priceEach: number;
  qty: number;
}

export default function CalculatorPage() {
  const { user, loading, login, logout } = useAuth();

  const [sizes, setSizes] = useState<BalloonSize[]>([]);
  const [entries, setEntries] = useState<BalloonEntry[]>([]);
  const [laborHours, setLaborHours] = useState<number>(1);
  const [hourlyRate, setHourlyRate] = useState<number>(25);

  const [overheadPercent, setOverheadPercent] = useState<number>(15);
  const [markupPercent, setMarkupPercent] = useState<number>(30);
  const [customFinalPrice, setCustomFinalPrice] = useState<number | null>(null);
  const [designName, setDesignName] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [selectedSizeId, setSelectedSizeId] = useState<string>('');

  // Load user settings and balloon sizes
  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      // Load settings
      const settingsRes = await client.entities.balloon_settings.query({
        query: {},
        limit: 1,
      });
      if (settingsRes?.data?.items?.length > 0) {
        const s = settingsRes.data.items[0];
        setHourlyRate(s.hourly_labor_rate ?? 25);
        setOverheadPercent(s.overhead_percent ?? 15);
        setMarkupPercent(s.markup_percent ?? 30);
      }

      // Load balloon sizes
      const sizesRes = await client.entities.balloon_sizes.query({
        query: {},
        sort: 'sort_order',
        limit: 200,
      });
      if (sizesRes?.data?.items) {
        setSizes(sizesRes.data.items);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculations
  const materialsCost = entries.reduce((sum, e) => sum + e.qty * e.priceEach, 0);
  const laborCost = laborHours * hourlyRate;
  const subtotal = materialsCost + laborCost;
  const overheadAmount = subtotal * (overheadPercent / 100);
  const markupAmount = (subtotal + overheadAmount) * (markupPercent / 100);
  const msrp = subtotal + overheadAmount + markupAmount;
  const finalPrice = customFinalPrice !== null ? customFinalPrice : msrp;

  const addItemFromDropdown = () => {
    if (!selectedSizeId) {
      toast.error('Select an item first');
      return;
    }
    const sizeIdNum = parseInt(selectedSizeId);
    // Check if already added
    if (entries.some((e) => e.sizeId === sizeIdNum)) {
      toast.error('Item already added to this design');
      return;
    }
    const size = sizes.find((s) => s.id === sizeIdNum);
    if (!size) return;

    setEntries((prev) => [
      ...prev,
      {
        sizeId: size.id,
        sizeName: size.size_name,
        priceEach: size.price_per_balloon,
        qty: 1,
      },
    ]);
    setSelectedSizeId('');
  };

  const updateQty = (index: number, delta: number) => {
    setEntries((prev) =>
      prev.map((e, i) =>
        i === index ? { ...e, qty: Math.max(0, e.qty + delta) } : e
      )
    );
  };

  const setQty = (index: number, val: number) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, qty: Math.max(0, val) } : e))
    );
  };

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setEntries([]);
    setLaborHours(1);
    setCustomFinalPrice(null);
    setDesignName('');
    setSelectedSizeId('');
  };

  const saveDesign = async () => {
    if (!user) {
      toast.error('Please sign in to save designs');
      return;
    }
    if (!designName.trim()) {
      toast.error('Please enter a design name');
      return;
    }
    setSaving(true);
    try {
      const balloonDetails = JSON.stringify(
        entries
          .filter((e) => e.qty > 0)
          .map((e) => ({
            size: e.sizeName,
            qty: e.qty,
            priceEach: e.priceEach,
            total: e.qty * e.priceEach,
          }))
      );

      await client.entities.saved_designs.create({
        data: {
          design_name: designName,
          labor_hours: laborHours,
          hourly_rate: hourlyRate,
          hardware_cost: 0,
          overhead_percent: overheadPercent,
          markup_percent: markupPercent,
          balloon_cost: materialsCost,
          labor_cost: laborCost,
          subtotal,
          overhead_amount: overheadAmount,
          markup_amount: markupAmount,
          msrp,
          perceived_value_add: customFinalPrice !== null ? customFinalPrice - msrp : 0,
          final_price: finalPrice,
          balloon_details: balloonDetails,
          notes: '',
        },
      });
      toast.success('Design saved!');
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save design');
    } finally {
      setSaving(false);
    }
  };

  // Items available in dropdown (not yet added)
  const availableItems = sizes.filter(
    (s) => !entries.some((e) => e.sizeId === s.id)
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
        <div className="flex flex-col items-center justify-center px-6 pt-16 text-center">
          <div className="w-20 h-20 rounded-full golden-gradient flex items-center justify-center mb-6 shadow-lg">
            <span className="text-white text-3xl font-bold">B</span>
          </div>
          <h2 className="text-2xl font-bold mb-2 golden-text">
            BalloonPricer
          </h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Professional balloon design pricing calculator. Sign in to create
            estimates, manage your settings, and save your designs.
          </p>
          <Button
            onClick={login}
            className="golden-gradient text-white font-semibold px-8 py-3 text-base mb-10"
          >
            Get Started
          </Button>

          {/* Feature highlights */}
          <div className="w-full max-w-sm space-y-3">
            <Card className="text-left border-[#D4A017]/20">
              <CardContent className="pt-4 pb-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg golden-gradient flex items-center justify-center shrink-0">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Smart Calculator</p>
                  <p className="text-xs text-muted-foreground">
                    Add materials, labor costs with automatic MSRP calculation and custom final pricing.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="text-left border-[#D4A017]/20">
              <CardContent className="pt-4 pb-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg golden-gradient flex items-center justify-center shrink-0">
                  <Save className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Save &amp; Search Designs</p>
                  <p className="text-xs text-muted-foreground">
                    Save your pricing estimates and search through your design history anytime.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="text-left border-[#D4A017]/20">
              <CardContent className="pt-4 pb-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg golden-gradient flex items-center justify-center shrink-0">
                  <RotateCcw className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Custom Branding</p>
                  <p className="text-xs text-muted-foreground">
                    Upload your business logo in Settings to personalize the app across all pages.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
      <Header user={user} onLogin={login} onLogout={logout} />

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Design Name */}
        <Card>
          <CardContent className="pt-4 pb-3">
            <Label className="text-sm font-medium text-muted-foreground">
              Design Name
            </Label>
            <Input
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              placeholder="e.g. Wedding Arch, Birthday Column"
              className="mt-1"
            />
          </CardContent>
        </Card>

        {/* Balloons & Hardware/Accessories */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Balloons &amp; Hardware/Accessories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Dropdown to add items */}
            <div className="flex gap-2">
              <Select value={selectedSizeId} onValueChange={setSelectedSizeId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select an item to add..." />
                </SelectTrigger>
                <SelectContent>
                  {availableItems.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      {sizes.length === 0
                        ? 'No items configured — go to Settings'
                        : 'All items already added'}
                    </SelectItem>
                  ) : (
                    availableItems.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.size_name} — ${s.price_per_balloon.toFixed(2)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={addItemFromDropdown}
                disabled={!selectedSizeId}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Added items list */}
            {entries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">
                Use the dropdown above to add items to this design.
              </p>
            ) : (
              entries.map((entry, idx) => (
                <div
                  key={entry.sizeId}
                  className="flex items-center justify-between py-1"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {entry.sizeName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ${entry.priceEach.toFixed(2)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQty(idx, -1)}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={entry.qty}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setQty(idx, 0);
                        } else if (/^\d+$/.test(val)) {
                          setQty(idx, parseInt(val));
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-14 h-8 text-center text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQty(idx, 1)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeEntry(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Labor */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Labor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Labor Hours
                </Label>
                <CurrencyInput
                  value={laborHours}
                  onChange={(val) => setLaborHours(val)}
                  placeholder="1"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Rate ($/hr)
                </Label>
                <CurrencyInput
                  value={hourlyRate}
                  onChange={(val) => setHourlyRate(val)}
                  placeholder="25.00"
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overhead & Markup */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Overhead &amp; Markup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Overhead %
                </Label>
                <CurrencyInput
                  value={overheadPercent}
                  onChange={(val) => setOverheadPercent(val)}
                  placeholder="15"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Markup %
                </Label>
                <CurrencyInput
                  value={markupPercent}
                  onChange={(val) => setMarkupPercent(val)}
                  placeholder="30"
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Breakdown */}
        <Card className="border-[#D4A017]/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold golden-text">
              Price Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Materials</span>
              <span className="font-medium">${materialsCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Labor ({laborHours}h × ${hourlyRate.toFixed(2)})
              </span>
              <span className="font-medium">${laborCost.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Overhead ({overheadPercent}%)
              </span>
              <span className="font-medium">
                +${overheadAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Markup ({markupPercent}%)
              </span>
              <span className="font-medium">
                +${markupAmount.toFixed(2)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-base">
              <span className="font-semibold">MSRP</span>
              <span className="font-bold">${msrp.toFixed(2)}</span>
            </div>

            <div className="pt-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Perceived Value Final Price ($) — override or leave blank to use MSRP
              </Label>
              <CurrencyInput
                value={customFinalPrice ?? 0}
                onChange={(val) => setCustomFinalPrice(val)}
                allowEmpty
                onEmptyValue={() => setCustomFinalPrice(null)}
                placeholder={msrp.toFixed(2)}
                className="mt-1"
              />
            </div>

            <Separator />
            <div className="flex justify-between text-lg pt-1">
              <span className="font-bold golden-text">Final Price</span>
              <span className="font-bold golden-text">
                ${finalPrice.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={resetForm}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            className="flex-1 golden-gradient text-white"
            onClick={saveDesign}
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Design'}
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}