import { useState, useEffect, useCallback } from 'react';
import { client } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Trash2, ChevronRight, Search, X } from 'lucide-react';

interface SavedDesign {
  id: number;
  design_name: string;
  labor_hours: number;
  hourly_rate: number;
  hardware_cost: number;
  overhead_percent: number;
  markup_percent: number;
  balloon_cost: number;
  labor_cost: number;
  subtotal: number;
  overhead_amount: number;
  markup_amount: number;
  msrp: number;
  perceived_value_add: number;
  final_price: number;
  balloon_details: string;
  notes: string;
  created_at: string;
}

interface BalloonDetail {
  size: string;
  qty: number;
  priceEach: number;
  total: number;
}

export default function HistoryPage() {
  const { user, loading, login, logout } = useAuth();
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [selected, setSelected] = useState<SavedDesign | null>(null);
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDesigns = designs.filter((d) =>
    d.design_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const loadDesigns = useCallback(async () => {
    if (!user) return;
    setLoadingDesigns(true);
    try {
      const res = await client.entities.saved_designs.query({
        query: {},
        sort: '-created_at',
        limit: 100,
      });
      if (res?.data?.items) {
        setDesigns(res.data.items);
      }
    } catch (err) {
      console.error('Failed to load designs:', err);
    } finally {
      setLoadingDesigns(false);
    }
  }, [user]);

  useEffect(() => {
    loadDesigns();
  }, [loadDesigns]);

  const deleteDesign = async (id: number) => {
    try {
      await client.entities.saved_designs.delete({ id: String(id) });
      setDesigns((prev) => prev.filter((d) => d.id !== id));
      setSelected(null);
      toast.success('Design deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete design');
    }
  };

  const parseBalloonDetails = (json: string): BalloonDetail[] => {
    try {
      return JSON.parse(json) || [];
    } catch {
      return [];
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

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
            Please sign in to view your saved designs.
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

      <main className="max-w-lg mx-auto px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Saved Designs</h2>
          {designs.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {filteredDesigns.length} of {designs.length}
            </span>
          )}
        </div>

        {/* Search Bar */}
        {designs.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search designs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {loadingDesigns ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4A017]" />
          </div>
        ) : designs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No saved designs yet. Create your first design in the
                Calculator!
              </p>
            </CardContent>
          </Card>
        ) : filteredDesigns.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No designs match &ldquo;{searchQuery}&rdquo;
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDesigns.map((design) => (
            <Card
              key={design.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelected(design)}
            >
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{design.design_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(design.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#D4A017]">
                    ${design.final_price?.toFixed(2) ?? '0.00'}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.design_name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <p className="text-xs text-muted-foreground">
                  {formatDate(selected.created_at)}
                </p>

                {/* Balloon Details */}
                {parseBalloonDetails(selected.balloon_details).length > 0 && (
                  <div>
                    <p className="font-medium mb-1">Balloons</p>
                    {parseBalloonDetails(selected.balloon_details).map(
                      (b, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span>
                            {b.size} × {b.qty}
                          </span>
                          <span>${b.total?.toFixed(2)}</span>
                        </div>
                      )
                    )}
                  </div>
                )}

                <Separator />

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Materials
                    </span>
                    <span>${(selected.balloon_cost ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Labor ({selected.labor_hours ?? 0}h × $
                      {(selected.hourly_rate ?? 0).toFixed(2)})
                    </span>
                    <span>${(selected.labor_cost ?? 0).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${(selected.subtotal ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Overhead ({selected.overhead_percent ?? 0}%)
                    </span>
                    <span>
                      +${(selected.overhead_amount ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Markup ({selected.markup_percent ?? 0}%)
                    </span>
                    <span>+${(selected.markup_amount ?? 0).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>MSRP</span>
                    <span>${(selected.msrp ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Perceived Value Add
                    </span>
                    <span>
                      +${(selected.perceived_value_add ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-bold">
                    <span className="golden-text">Final Price</span>
                    <span className="golden-text">
                      ${(selected.final_price ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  variant="destructive"
                  className="w-full mt-4"
                  onClick={() => deleteDesign(selected.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Design
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}