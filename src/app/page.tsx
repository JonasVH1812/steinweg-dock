'use client';

import React, { useEffect, useState, useRef, useTransition, useCallback } from 'react';
import { useAppStore, UserRole, AppView } from '@/lib/store';
import { t, Language, languageNames } from '@/lib/i18n';
import { signIn } from 'next-auth/react';
import {
  Ship, Truck, FileText, Shield, Clock, Warehouse, Bell, BarChart3,
  LogOut, Menu, X, ChevronRight, Package, CheckCircle2, AlertTriangle,
  AlertCircle, Info, Plus, Timer, MapPin, User, Phone, BadgeCheck,
  ClipboardList, ArrowRight, ArrowLeft, Eye, Edit, SignPlus,
  Anchor, Container, Box, CircleDot, Search, Filter, Download,
  Upload, Camera, Signature, CheckCheck, XCircle, MoreVertical,
  Play, Pause, Square, CalendarDays, Route as RouteIcon, HardHat,
  Settings, Users, FileSearch, Pen, Languages, Moon, Sun, Lock, PenLine
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

// ============ TYPES ============
interface Shift { id: string; userId: string; type: string; status: string; checkIn: string; checkOut: string | null; location: string | null; notes: string | null; user?: any; }
interface CargoOperation { id: string; operationType: string; status: string; vesselName: string | null; voyageNumber: string | null; berthNumber: string | null; warehouseId: string | null; cargoType: string | null; reference: string | null; weight: number | null; unitCount: number | null; description: string | null; assignedTo: string | null; startedAt: string | null; completedAt: string | null; warehouse?: any; assignee?: any; items?: CargoItem[]; }
interface CargoItem { id: string; cargoOpId: string; itemType: string; markOrNumber: string | null; description: string | null; quantity: number; weight: number | null; condition: string; damageNotes: string | null; storageLocation: string | null; checked: boolean; }
interface Document { id: string; docType: string; reference: string; status: string; cargoOpId: string | null; truckVisitId: string | null; content: string | null; notes: string | null; orderNumber: string | null; customerName: string | null; transportCode: string | null; lotNumber: string | null; grossWeight: number | null; netWeight: number | null; instructions: string | null; photos: string | null; createdAt: string; signatures?: any[]; }
interface SafetyChecklist { id: string; userId: string; checkType: string; status: string; location: string | null; notes: string | null; createdAt: string; user?: any; items?: SafetyCheckItem[]; }
interface SafetyCheckItem { id: string; checklistId: string; category: string; question: string; passed: boolean | null; notes: string | null; orderIndex: number; }
interface TruckVisit { id: string; driverName: string; driverLicense: string | null; company: string | null; truckPlate: string; trailerPlate: string | null; purpose: string; status: string; dockNumber: string | null; expectedArrival: string | null; arrivedAt: string | null; dockAssignedAt: string | null; completedAt: string | null; cargoDescription: string | null; blReference: string | null; bookingRef: string | null; notes: string | null; lotNumber: string | null; transportCode: string | null; grossWeight: number | null; netWeight: number | null; instructions: string | null; documents?: Document[]; }
interface Warehouse { id: string; name: string; code: string; location: string | null; type: string; capacity: number | null; area: number | null; storageLocations?: any[]; }
interface Notification { id: string; type: string; title: string; message: string; read: boolean; category: string | null; createdAt: string; }
interface Stats { activeShifts: number; pendingCargo: number; inProgressCargo: number; completedCargo: number; expectedTrucks: number; atDockTrucks: number; pendingDocs: number; activeSafetyChecks: number; unreadNotifications: number; totalWorkers: number; totalChauffeurs: number; warehouses: any[]; }

// ============ HELPER FUNCTIONS ============
const formatDate = (d: string | null) => d ? new Date(d).toLocaleString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
const formatTime = (d: string | null) => d ? new Date(d).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' }) : '-';
const timeSince = (d: string) => { const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000); if (s < 60) return `${s}s`; if (s < 3600) return `${Math.floor(s/60)}m`; if (s < 86400) return `${Math.floor(s/3600)}h`; return `${Math.floor(s/86400)}d`; };

// Translate a status value to the user's language
const statusLabel = (status: string, lang: Language): string => {
  const map: Record<string, string> = {
    pending: t('pendingCargo', lang),
    in_progress: t('inProgressCargo', lang),
    active: t('active', lang),
    completed: t('completedCargo', lang),
    approved: t('approved', lang),
    signed: t('signed', lang),
    draft: t('draft', lang),
    pending_review: t('pendingReview', lang),
    failed: t('error', lang),
    cancelled: t('cancel', lang),
    ended: t('completedCargo', lang),
    break: t('cancelling', lang),
    expected: t('expectedTrucks', lang),
    arrived: t('arrivedAt', lang),
    at_dock: t('atDockTrucks', lang),
    loading: t('loading', lang),
    archived: t('inactive', lang),
  };
  return map[status] || status.replace(/_/g, ' ');
};

const filterLabel = (f: string, lang: Language): string => {
  if (f === 'all') return t('filter', lang);
  return statusLabel(f, lang);
};

const roleLabel = (role: string, lang: Language): string => {
  const map: Record<string, string> = {
    dock_worker: t('totalWorkers', lang),
    chauffeur: t('totalChauffeurs', lang),
    admin: t('adminUsers', lang),
  };
  return map[role] || role;
};

const notifCategoryLabel = (cat: string, lang: Language): string => {
  const map: Record<string, string> = {
    safety: t('safety', lang),
    cargo: t('cargo', lang),
    truck: t('trucks', lang),
    document: t('documents', lang),
    shift: t('shifts', lang),
    system: t('settings', lang),
  };
  return map[cat] || cat;
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
  active: 'bg-green-100 text-green-800 border-green-300',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  signed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  draft: 'bg-gray-100 text-gray-800 border-gray-300',
  pending_review: 'bg-orange-100 text-orange-800 border-orange-300',
  failed: 'bg-red-100 text-red-800 border-red-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
  ended: 'bg-gray-100 text-gray-800 border-gray-300',
  break: 'bg-purple-100 text-purple-800 border-purple-300',
  expected: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  arrived: 'bg-blue-100 text-blue-800 border-blue-300',
  at_dock: 'bg-green-100 text-green-800 border-green-300',
  loading: 'bg-orange-100 text-orange-800 border-orange-300',
  archived: 'bg-gray-100 text-gray-700 border-gray-300',
};

const cargoTypeIcons: Record<string, React.ReactNode> = {
  breakbulk: <Package className="h-4 w-4" />,
  container: <Container className="h-4 w-4" />,
  roro: <Truck className="h-4 w-4" />,
  bulk: <CircleDot className="h-4 w-4" />,
};

const notifIcons: Record<string, React.ReactNode> = {
  urgent: <AlertCircle className="h-4 w-4 text-red-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
  task: <ClipboardList className="h-4 w-4 text-purple-500" />,
};

// ============ LOGIN SCREEN ============
function LoginScreen() {
  const { setCurrentUser, setCurrentRole, seeded, setSeeded, language } = useAppStore();
  const lang = language;
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) { const data = await res.json(); if (Array.isArray(data)) { setUsers(data); if (data.length > 0) setSeeded(true); } }
    } catch {}
  }, [setSeeded]);

  const [, startTransitionLogin] = useTransition();
  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        startTransitionLogin(() => { setUsers(data); if (data.length > 0) setSeeded(true); });
      }
    }).catch(() => {});
  }, [startTransitionLogin, setSeeded]);

  const seedDb = async () => {
    setSeedLoading(true);
    const res = await fetch('/api/setup', { method: 'POST' });
    if (res.ok) { setSeeded(true); await fetchUsers(); toast({ title: t('success', lang), description: t('loadDemo', lang) }); }
    setSeedLoading(false);
  };

  const loginAs = async (user: any) => {
    setLoading(true);
    // Sign in via NextAuth for session persistence
    await signIn('credentials', { email: user.email, password: 'demo123', redirect: false });
    setCurrentUser(user);
    setCurrentRole(user.role as UserRole);
    setLoading(false);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');
    
    // Authenticate via NextAuth
    const result = await signIn('credentials', { email, password, redirect: false });
    
    if (result?.ok) {
      // Fetch user data from our API
      const usersRes = await fetch('/api/users');
      if (!usersRes.ok) throw new Error('Failed to fetch users');
      if (usersRes.ok) {
        const allUsers = await usersRes.json();
        const user = allUsers.find((u: any) => u.email === email);
        if (user) {
          setCurrentUser(user);
          setCurrentRole(user.role as UserRole);
        } else {
          setLoginError(t('invalidLogin', lang));
        }
      }
    } else {
      setLoginError(t('invalidLogin', lang));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mb-4 shadow-lg shadow-orange-500/25">
            <Anchor className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">{t('appName', lang)}</h1>
          <p className="text-slate-400 mt-2">{t('appSubtitle', lang)}</p>
          <p className="text-slate-500 text-sm mt-1">{t('digitalDock', lang)}</p>
        </div>

        {!seeded ? (
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader className="text-center">
              <CardTitle className="text-white">{t('welcome', lang)}</CardTitle>
              <CardDescription className="text-slate-400">{t('loadDemo', lang)}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={seedDb} disabled={seedLoading} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white h-12 text-lg">
                {seedLoading ? t('loading', lang) : t('loadDemo', lang)}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader className="text-center">
              <CardTitle className="text-white">{t('signIn', lang)}</CardTitle>
              <CardDescription className="text-slate-400">
                {showEmailLogin ? t('enterCredentials', lang) : t('chooseProfile', lang)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {showEmailLogin ? (
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <Label className="text-slate-300">{t('email', lang)}</Label>
                    <Input type="email" placeholder="worker1@steinweg.be" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-slate-700 border-slate-600 text-white" required />
                  </div>
                  <div>
                    <Label className="text-slate-300">{t('password', lang)}</Label>
                    <Input type="password" placeholder="••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-slate-700 border-slate-600 text-white" required />
                  </div>
                  {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
                  <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
                    {loading ? t('signIn', lang) + '...' : t('signIn', lang)}
                  </Button>
                  <button type="button" onClick={() => setShowEmailLogin(false)} className="w-full text-center text-slate-400 hover:text-amber-400 text-sm">
                    {t('backToProfiles', lang)}
                  </button>
                </form>
              ) : (
                <>
                  {users.map((user) => (
                    <button key={user.id} onClick={() => loginAs(user)} disabled={loading}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-600 bg-slate-700/50 hover:bg-slate-700 hover:border-amber-500/50 transition-all duration-200 text-left group">
                      <Avatar className="h-12 w-12 border-2 border-slate-500 group-hover:border-amber-500 transition-colors">
                        <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold">
                          {user.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-white font-semibold">{user.name}</p>
                        <p className="text-slate-400 text-sm">{user.badge} — {roleLabel(user.role, lang)}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-amber-500 transition-colors" />
                    </button>
                  ))}
                  <Separator className="bg-slate-600" />
                  <button onClick={() => setShowEmailLogin(true)} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-600 text-slate-400 hover:text-white hover:border-amber-500/50 transition-all text-sm">
                    <User className="h-4 w-4" /> {t('orEmail', lang)}
                  </button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: <Shield className="h-5 w-5" />, label: t('safety', lang) },
            { icon: <FileText className="h-5 w-5" />, label: t('documents', lang) },
            { icon: <Clock className="h-5 w-5" />, label: t('recentActivity', lang) },
          ].map((f, i) => (
            <div key={i} className="text-center p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="text-amber-500 flex justify-center mb-1">{f.icon}</div>
              <p className="text-slate-400 text-xs">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ SIDEBAR NAV ============
function SidebarNav() {
  const { currentRole, currentView, setCurrentView, currentUser, logout, sidebarOpen, setSidebarOpen, language } = useAppStore();
  const lang = language;

  const workerNav: { view: AppView; icon: React.ReactNode; label: string }[] = [
    { view: 'dashboard', icon: <BarChart3 className="h-5 w-5" />, label: t('dashboard', lang) },
    { view: 'shifts', icon: <Clock className="h-5 w-5" />, label: t('shifts', lang) },
    { view: 'cargo', icon: <Ship className="h-5 w-5" />, label: t('cargo', lang) },
    { view: 'documents', icon: <FileText className="h-5 w-5" />, label: t('documents', lang) },
    { view: 'safety', icon: <Shield className="h-5 w-5" />, label: t('safety', lang) },
    { view: 'warehouses', icon: <Warehouse className="h-5 w-5" />, label: t('warehouses', lang) },
    { view: 'notifications', icon: <Bell className="h-5 w-5" />, label: t('notifications', lang) },
  ];

  const chauffeurNav: { view: AppView; icon: React.ReactNode; label: string }[] = [
    { view: 'dashboard', icon: <BarChart3 className="h-5 w-5" />, label: t('dashboard', lang) },
    { view: 'my-deliveries', icon: <Truck className="h-5 w-5" />, label: t('myDeliveries', lang) },
    { view: 'trucks', icon: <Truck className="h-5 w-5" />, label: t('trucks', lang) },
    { view: 'documents', icon: <FileText className="h-5 w-5" />, label: t('documents', lang) },
    { view: 'notifications', icon: <Bell className="h-5 w-5" />, label: t('notifications', lang) },
  ];

  const adminNav: { view: AppView; icon: React.ReactNode; label: string }[] = [
    { view: 'dashboard', icon: <BarChart3 className="h-5 w-5" />, label: t('dashboard', lang) },
    { view: 'shifts', icon: <Clock className="h-5 w-5" />, label: t('shifts', lang) },
    { view: 'cargo', icon: <Ship className="h-5 w-5" />, label: t('cargo', lang) },
    { view: 'documents', icon: <FileText className="h-5 w-5" />, label: t('documents', lang) },
    { view: 'safety', icon: <Shield className="h-5 w-5" />, label: t('safety', lang) },
    { view: 'trucks', icon: <Truck className="h-5 w-5" />, label: t('trucks', lang) },
    { view: 'warehouses', icon: <Warehouse className="h-5 w-5" />, label: t('warehouses', lang) },
    { view: 'notifications', icon: <Bell className="h-5 w-5" />, label: t('notifications', lang) },
    { view: 'admin', icon: <Users className="h-5 w-5" />, label: t('admin', lang) },
  ];

  const navItems = currentRole === 'admin' ? adminNav : currentRole === 'chauffeur' ? chauffeurNav : workerNav;

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed top-0 left-0 z-50 h-full w-72 bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 p-6 border-b border-slate-700">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
            <Anchor className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm">{t('appName', lang)}</h2>
            <p className="text-slate-500 text-xs">Port of Antwerp</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/50">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-sm font-bold">
                {currentUser?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{currentUser?.name}</p>
              <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400 bg-amber-500/10">
                {roleLabel(currentRole, lang)}
              </Badge>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-3" style={{ height: 'calc(100vh - 290px)' }}>
          <nav className="space-y-1 pb-4">
            {navItems.map((item) => (
              <button key={item.view} onClick={() => setCurrentView(item.view)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  currentView === item.view
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50 border border-transparent'
                }`}>
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-slate-700 space-y-1">
          <button onClick={() => setCurrentView('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${currentView === 'settings' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-700/50 border border-transparent'}`}>
            <Settings className="h-5 w-5" /> {t('settings', lang)}
          </button>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
            <LogOut className="h-5 w-5" /> {t('signOut', lang)}
          </button>
        </div>
      </aside>
    </>
  );
}

// ============ TOP BAR ============
function TopBar() {
  const { currentView, setSidebarOpen, language } = useAppStore();
  const lang = language;
  const viewTitles: Record<AppView, string> = {
    dashboard: t('dashboard', lang), shifts: t('shifts', lang), cargo: t('cargo', lang),
    documents: t('documents', lang), safety: t('safety', lang), trucks: t('trucks', lang),
    warehouses: t('warehouses', lang), notifications: t('notifications', lang), reports: t('reports', lang),
    admin: t('admin', lang), settings: t('settings', lang), 'my-deliveries': t('myDeliveries', lang),
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{viewTitles[currentView]}</h1>
        </div>
        <div className="flex items-center gap-2">
          <QuickNotifications />
        </div>
      </div>
    </header>
  );
}

function QuickNotifications() {
  const { language } = useAppStore();
  const lang = language;
  const [notifs, setNotifs] = useState<Notification[]>([]);
  useEffect(() => { fetch('/api/notifications').then(r => r.json()).then(setNotifs); }, []);
  const unread = notifs.filter(n => !n.read).length;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          {unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{unread}</span>}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('notifications', lang)}</DialogTitle>
          <DialogDescription>{t('recentActivity', lang)}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-80">
          {notifs.length === 0 ? <p className="text-center text-muted-foreground py-8">{t('noResults', lang)}</p> :
            notifs.map(n => (
              <div key={n.id} className={`flex gap-3 p-3 rounded-lg mb-2 ${n.read ? 'opacity-60' : 'bg-slate-50 dark:bg-slate-800'}`}>
                <div className="mt-0.5">{notifIcons[n.type] || <Info className="h-4 w-4" />}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{timeSince(n.createdAt)}</p>
                </div>
              </div>
            ))
          }
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ============ DASHBOARD ============
function Dashboard() {
  const { currentRole, language } = useAppStore();
  const lang = language;
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentCargo, setRecentCargo] = useState<CargoOperation[]>([]);
  const [trucks, setTrucks] = useState<TruckVisit[]>([]);
  const [notifs, setNotifs] = useState<Notification[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/cargo?status=in_progress').then(r => r.json()),
      fetch('/api/trucks').then(r => r.json()),
      fetch('/api/notifications').then(r => r.json()),
    ]).then(([s, c, t, n]) => { setStats(s); setRecentCargo(c); setTrucks(t); setNotifs(n); });
  }, []);

  if (!stats) return <div className="p-6"><div className="animate-pulse space-y-4"><div className="h-32 bg-slate-200 rounded-xl" /><div className="grid grid-cols-2 gap-4"><div className="h-24 bg-slate-200 rounded-xl" /><div className="h-24 bg-slate-200 rounded-xl" /><div className="h-24 bg-slate-200 rounded-xl" /><div className="h-24 bg-slate-200 rounded-xl" /></div></div></div>;

  const statCards = currentRole === 'chauffeur' ? [
    { label: t('trucks', lang), value: trucks.filter(t => t.status !== 'completed').length, icon: <Truck className="h-6 w-6" />, color: 'from-blue-500 to-cyan-500' },
    { label: t('pendingDocs', lang), value: stats.pendingDocs, icon: <FileText className="h-6 w-6" />, color: 'from-amber-500 to-orange-500' },
    { label: t('atDockTrucks', lang), value: stats.atDockTrucks, icon: <MapPin className="h-6 w-6" />, color: 'from-green-500 to-emerald-500' },
    { label: t('notifications', lang), value: stats.unreadNotifications, icon: <Bell className="h-6 w-6" />, color: 'from-red-500 to-pink-500' },
  ] : [
    { label: t('activeShifts', lang), value: stats.activeShifts, icon: <Clock className="h-6 w-6" />, color: 'from-green-500 to-emerald-500' },
    { label: t('inProgressCargo', lang), value: stats.inProgressCargo, icon: <Ship className="h-6 w-6" />, color: 'from-blue-500 to-cyan-500' },
    { label: t('atDockTrucks', lang), value: stats.atDockTrucks, icon: <Truck className="h-6 w-6" />, color: 'from-amber-500 to-orange-500' },
    { label: t('pendingDocs', lang), value: stats.pendingDocs, icon: <FileText className="h-6 w-6" />, color: 'from-purple-500 to-violet-500' },
    { label: t('activeSafety', lang), value: stats.activeSafetyChecks, icon: <Shield className="h-6 w-6" />, color: 'from-red-500 to-pink-500' },
    { label: t('notifications', lang), value: stats.unreadNotifications, icon: <Bell className="h-6 w-6" />, color: 'from-slate-500 to-slate-600' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Stats Grid */}
      <div className={`grid gap-4 ${currentRole === 'chauffeur' ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3'}`}>
        {statCards.map((card, i) => (
          <Card key={i} className="overflow-hidden border-0 shadow-lg">
            <CardContent className="p-0">
              <div className={`bg-gradient-to-br ${card.color} p-4 lg:p-5 text-white`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-xs font-medium uppercase tracking-wider">{card.label}</p>
                    <p className="text-3xl font-bold mt-1">{card.value}</p>
                  </div>
                  <div className="opacity-80">{card.icon}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Cargo Operations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2"><Ship className="h-5 w-5 text-blue-500" /> {t('cargo', lang)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentCargo.length === 0 ? <p className="text-muted-foreground text-sm py-4">{t('noResults', lang)}</p> :
              recentCargo.slice(0, 3).map(op => (
                <div key={op.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="mt-1 text-blue-500">{cargoTypeIcons[op.cargoType || ''] || <Package className="h-4 w-4" />}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{op.vesselName}</p>
                    <p className="text-xs text-muted-foreground">{op.operationType} — {t('berthNumber', lang)} {op.berthNumber}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={statusColors[op.status] || ''} variant="outline">{statusLabel(op.status, lang)}</Badge>
                      {op.weight && <span className="text-xs text-muted-foreground">{op.weight.toLocaleString()} kg</span>}
                    </div>
                  </div>
                </div>
              ))
            }
          </CardContent>
        </Card>

        {/* Today's Trucks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2"><Truck className="h-5 w-5 text-amber-500" /> {t('trucks', lang)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {trucks.length === 0 ? <p className="text-muted-foreground text-sm py-4">{t('noResults', lang)}</p> :
              trucks.slice(0, 4).map(tv => (
                <div key={tv.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{tv.driverName}</p>
                    <p className="text-xs text-muted-foreground">{tv.truckPlate} — {tv.company}</p>
                  </div>
                  <Badge className={statusColors[tv.status] || ''} variant="outline">{statusLabel(tv.status, lang)}</Badge>
                </div>
              ))
            }
          </CardContent>
        </Card>

        {/* Warehouse Overview */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2"><Warehouse className="h-5 w-5 text-emerald-500" /> {t('warehouseOverview', lang)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {stats.warehouses.map((wh: any) => {
                const pct = wh.totalSlots > 0 ? Math.round((wh.occupiedSlots / wh.totalSlots) * 100) : 0;
                return (
                  <div key={wh.id} className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">{wh.code}</Badge>
                      <span className="text-xs text-muted-foreground capitalize">{wh.type}</span>
                    </div>
                    <p className="font-semibold text-sm truncate">{wh.name}</p>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{wh.occupiedSlots}/{wh.totalSlots} {t('occupied', lang).toLowerCase()}</span>
                        <span>{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============ SHIFT MANAGEMENT ============
function ShiftManagement() {
  const { currentUser, language } = useAppStore();
  const lang = language;
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [checkInDialog, setCheckInDialog] = useState(false);
  const [newShift, setNewShift] = useState({ type: 'day', location: '' });

  const shiftsLoadedRef = useRef(false);
  const [, startTransition] = useTransition();
  const loadShifts = useCallback(async () => {
    if (!currentUser) return;
    const [allShifts, myShifts] = await Promise.all([
      fetch('/api/shifts').then(r => r.json()),
      fetch(`/api/shifts?userId=${currentUser.id}&status=active`).then(r => r.json()),
    ]);
    startTransition(() => {
      setShifts(allShifts);
      setActiveShift(myShifts.length > 0 ? myShifts[0] : null);
    });
  }, [currentUser, startTransition]);

  useEffect(() => {
    if (currentUser && !shiftsLoadedRef.current) {
      shiftsLoadedRef.current = true;
      loadShifts();
    }
  }, [currentUser, loadShifts]);

  const checkIn = async () => {
    if (!currentUser) return;
    const res = await fetch('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, type: newShift.type, location: newShift.location, status: 'active' }),
    });
    if (res.ok) { toast({ title: t('checkIn', lang), description: `Shift started at ${newShift.location}` }); setCheckInDialog(false); loadShifts(); }
  };

  const checkOut = async () => {
    if (!activeShift) return;
    const res = await fetch('/api/shifts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: activeShift.id, status: 'ended', checkOut: new Date().toISOString() }),
    });
    if (res.ok) { toast({ title: t('checkOut', lang), description: t('endShift', lang) }); loadShifts(); }
  };

  const startBreak = async () => {
    if (!activeShift) return;
    const res = await fetch('/api/shifts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: activeShift.id, status: 'break' }) });
    if (res.ok) { toast({ title: t('startShift', lang) }); loadShifts(); }
  };

  const endBreak = async () => {
    if (!activeShift) return;
    const res = await fetch('/api/shifts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: activeShift.id, status: 'active' }) });
    if (res.ok) { toast({ title: t('endShift', lang) }); loadShifts(); }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Active Shift Card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        {activeShift ? (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">{t('currentShift', lang)}</p>
                <p className="text-2xl font-bold mt-1">{activeShift.type === 'day' ? t('day', lang) : t('night', lang)} Shift</p>
                <div className="flex items-center gap-4 mt-2 text-green-100 text-sm">
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {formatTime(activeShift.checkIn)}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {activeShift.location || t('location', lang)}</span>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-white/20 text-white border-white/30 text-sm">{activeShift.status}</Badge>
                <p className="text-green-100 text-sm mt-2">Since {timeSince(activeShift.checkIn)}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              {activeShift.status === 'active' ? (
                <Button onClick={startBreak} variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
                  <Pause className="h-4 w-4 mr-2" /> Break
                </Button>
              ) : (
                <Button onClick={endBreak} variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
                  <Play className="h-4 w-4 mr-2" /> Resume
                </Button>
              )}
              <Button onClick={checkOut} variant="secondary" className="bg-red-500/80 hover:bg-red-500 text-white border-0">
                <Square className="h-4 w-4 mr-2" /> {t('checkOut', lang)}
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-slate-600 to-slate-700 p-6 text-white text-center">
            <Timer className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-semibold">{t('shifts', lang)}</p>
            <p className="text-slate-300 text-sm mt-1">{t('checkIn', lang)}</p>
            <Dialog open={checkInDialog} onOpenChange={setCheckInDialog}>
              <DialogTrigger asChild>
                <Button className="mt-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
                  <Clock className="h-4 w-4 mr-2" /> {t('checkIn', lang)}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{t('checkIn', lang)}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>{t('shiftType', lang)}</Label>
                    <Select value={newShift.type} onValueChange={(v) => setNewShift(p => ({ ...p, type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="day">{t('day', lang)} Shift (06:00-14:00)</SelectItem><SelectItem value="night">{t('night', lang)} Shift (14:00-22:00)</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>{t('location', lang)}</Label>
                    <Input placeholder="e.g. Quai 125, Berth 127" value={newShift.location} onChange={(e) => setNewShift(p => ({ ...p, location: e.target.value }))} />
                  </div>
                </div>
                <DialogFooter><Button onClick={checkIn} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">{t('startShift', lang)}</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </Card>

      {/* Shift History */}
      <Card>
        <CardHeader><CardTitle className="text-lg">{t('shiftHistory', lang)}</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {shifts.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className={`w-2 h-2 rounded-full ${s.status === 'active' ? 'bg-green-500' : s.status === 'break' ? 'bg-purple-500' : 'bg-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{s.user?.name || '—'}</p>
                  <p className="text-xs text-muted-foreground">{s.type} {t('shifts', lang)} — {s.location || t('location', lang)}</p>
                </div>
                <div className="text-right">
                  <Badge className={statusColors[s.status] || ''} variant="outline">{statusLabel(s.status, lang)}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">{formatTime(s.checkIn)} — {s.checkOut ? formatTime(s.checkOut) : '...'}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ CARGO OPERATIONS ============
function CargoOperations() {
  const { currentRole, currentUser, language } = useAppStore();
  const lang = language;
  const [operations, setOperations] = useState<CargoOperation[]>([]);
  const [filter, setFilter] = useState('all');
  const [selectedOp, setSelectedOp] = useState<CargoOperation | null>(null);
  const [newOpDialog, setNewOpDialog] = useState(false);
  const [newOp, setNewOp] = useState({ operationType: 'unloading', vesselName: '', berthNumber: '', cargoType: 'breakbulk', description: '' });

  const [, startTransitionOps] = useTransition();
  const loadOps = useCallback(async () => {
    const status = filter !== 'all' ? filter : '';
    const url = status ? `/api/cargo?status=${status}` : '/api/cargo';
    const data = await fetch(url).then(r => r.json());
    startTransitionOps(() => { setOperations(data); });
  }, [filter, startTransitionOps]);

  useEffect(() => {
    loadOps();
  }, [loadOps]);

  const createOp = async () => {
    await fetch('/api/cargo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newOp, status: 'pending', assignedTo: currentUser?.id }) });
    setNewOpDialog(false);
    toast({ title: t('success', lang), description: t('cargo', lang) });
    loadOps();
  };

  const updateStatus = async (id: string, status: string) => {
    const data: any = { id, status };
    if (status === 'in_progress') data.startedAt = new Date().toISOString();
    if (status === 'completed') data.completedAt = new Date().toISOString();
    await fetch('/api/cargo', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    toast({ title: t('success', lang) });
    loadOps();
  };

  const toggleItemCheck = async (item: CargoItem) => {
    await fetch('/api/cargo-items', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, checked: !item.checked }) });
    loadOps();
    if (selectedOp) {
      const fresh = await fetch(`/api/cargo`).then(r => r.json());
      const found = fresh.find((o: CargoOperation) => o.id === selectedOp.id);
      if (found) setSelectedOp(found);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center gap-2">
        {['all', 'pending', 'in_progress', 'completed'].map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className={filter === f ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}>
            {filterLabel(f, lang)}
          </Button>
        ))}
        <div className="flex-1" />
        <Button onClick={() => setNewOpDialog(true)} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
          <Plus className="h-4 w-4 mr-2" /> {t('add', lang)}
        </Button>
      </div>

      {selectedOp ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {cargoTypeIcons[selectedOp.cargoType || '']}{selectedOp.vesselName}
                </CardTitle>
                <CardDescription>{selectedOp.operationType} — {selectedOp.description}</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedOp(null)}><ArrowLeft className="h-4 w-4 mr-1" /> {t('details', lang)}</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: t('voyageNumber', lang), value: selectedOp.voyageNumber },
                { label: t('berthNumber', lang), value: selectedOp.berthNumber },
                { label: t('reference', lang), value: selectedOp.reference },
                { label: t('weight', lang), value: selectedOp.weight ? `${selectedOp.weight.toLocaleString()} kg` : '-' },
              ].map((d, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-muted-foreground">{d.label}</p>
                  <p className="font-semibold text-sm mt-0.5">{d.value || '-'}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              {selectedOp.status === 'pending' && <Button onClick={() => updateStatus(selectedOp.id, 'in_progress')} className="bg-blue-500 text-white"><Play className="h-4 w-4 mr-2" />{t('startOperation', lang)}</Button>}
              {selectedOp.status === 'in_progress' && <Button onClick={() => updateStatus(selectedOp.id, 'completed')} className="bg-green-500 text-white"><CheckCircle2 className="h-4 w-4 mr-2" />{t('completeOperation', lang)}</Button>}
            </div>

            {/* Cargo Items / Tally */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2"><ClipboardList className="h-4 w-4" /> {t('tally', lang)} ({selectedOp.items?.length || 0})</h3>
              <div className="space-y-2">
                {selectedOp.items?.map(item => (
                  <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border ${item.checked ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-white dark:bg-slate-800'}`}>
                    <Checkbox checked={item.checked} onCheckedChange={() => toggleItemCheck(item)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.markOrNumber} — {item.itemType}</p>
                      <p className="text-xs text-muted-foreground">{item.description} — {t('quantity', lang)}: {item.quantity}{item.weight ? ` / ${item.weight.toLocaleString()} kg` : ''}</p>
                    </div>
                    <Badge className={item.condition === 'good' ? 'bg-green-100 text-green-800 border-green-300' : item.condition === 'damaged' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-yellow-100 text-yellow-800 border-yellow-300'} variant="outline">
                      {item.condition}
                    </Badge>
                    {item.damageNotes && <span className="text-xs text-red-500">{item.damageNotes}</span>}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {operations.map(op => (
            <Card key={op.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedOp(op)}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shrink-0">
                    {cargoTypeIcons[op.cargoType || ''] || <Package className="h-6 w-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{op.vesselName || t('vesselName', lang)}</h3>
                      <Badge className={statusColors[op.status] || ''} variant="outline">{statusLabel(op.status, lang)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{op.operationType} — {op.cargoType} — {t('berthNumber', lang)} {op.berthNumber || '-'}</p>
                    <p className="text-sm text-muted-foreground truncate">{op.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{op.reference}</span>
                      {op.weight && <span>{op.weight.toLocaleString()} kg</span>}
                      {op.items && <span>{op.items.length} items</span>}
                      {op.assignee && <span>{op.assignee.name}</span>}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Operation Dialog */}
      <Dialog open={newOpDialog} onOpenChange={setNewOpDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('cargo', lang)}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{t('cargoType', lang)}</Label>
              <Select value={newOp.operationType} onValueChange={(v) => setNewOp(p => ({ ...p, operationType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unloading">{t('unloading', lang)}</SelectItem><SelectItem value="loading">{t('loading', lang)}</SelectItem>
                  <SelectItem value="tally">{t('tally', lang)}</SelectItem><SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>{t('vesselName', lang)}</Label><Input placeholder="e.g. MV ATLANTIC STAR" value={newOp.vesselName} onChange={(e) => setNewOp(p => ({ ...p, vesselName: e.target.value }))} /></div>
            <div><Label>{t('berthNumber', lang)}</Label><Input placeholder="e.g. 125" value={newOp.berthNumber} onChange={(e) => setNewOp(p => ({ ...p, berthNumber: e.target.value }))} /></div>
            <div><Label>{t('cargoType', lang)}</Label>
              <Select value={newOp.cargoType} onValueChange={(v) => setNewOp(p => ({ ...p, cargoType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakbulk">{t('breakbulk', lang)}</SelectItem><SelectItem value="container">{t('container', lang)}</SelectItem>
                  <SelectItem value="roro">{t('roro', lang)}</SelectItem><SelectItem value="bulk">{t('bulk', lang)}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>{t('description', lang)}</Label><Textarea placeholder="Cargo description..." value={newOp.description} onChange={(e) => setNewOp(p => ({ ...p, description: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={createOp} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">{t('create', lang)}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ DOCUMENTS ============
function DocumentManagement() {
  const { language } = useAppStore();
  const lang = language;
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filter, setFilter] = useState('all');
  const [newDocDialog, setNewDocDialog] = useState(false);
  const [newDoc, setNewDoc] = useState({ docType: 'bill_of_lading', reference: '', notes: '', orderNumber: '', customerName: '', transportCode: '', lotNumber: '', grossWeight: '', netWeight: '', instructions: '' });
  const [viewDoc, setViewDoc] = useState<Document | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [printDoc, setPrintDoc] = useState<Document | null>(null);

  const [, startTransitionDocs] = useTransition();
  const loadDocs = useCallback(async () => {
    const status = filter !== 'all' ? filter : '';
    const url = status ? `/api/documents?status=${status}` : '/api/documents';
    const data = await fetch(url).then(r => r.json());
    startTransitionDocs(() => { setDocuments(data); });
  }, [filter, startTransitionDocs]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const createDoc = async () => {
    const docData: any = { ...newDoc, status: 'draft', grossWeight: newDoc.grossWeight ? parseFloat(newDoc.grossWeight) : null, netWeight: newDoc.netWeight ? parseFloat(newDoc.netWeight) : null };
    if (photos.length > 0) docData.photos = JSON.stringify(photos);
    await fetch('/api/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(docData) });
    setNewDocDialog(false);
    setPhotos([]);
    setNewDoc({ docType: 'bill_of_lading', reference: '', notes: '', orderNumber: '', customerName: '', transportCode: '', lotNumber: '', grossWeight: '', netWeight: '', instructions: '' });
    toast({ title: t('success', lang), description: t('documents', lang) });
    loadDocs();
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setPhotos(prev => [...prev, data.url]);
        toast({ title: t('success', lang), description: file.name });
      } else {
        toast({ title: t('error', lang), description: file.name, variant: 'destructive' });
      }
    }
    setUploading(false);
    e.target.value = '';
  };

  const removePhoto = (url: string) => {
    setPhotos(prev => prev.filter(p => p !== url));
  };

  const signDoc = async (docId: string) => {
    const { currentUser } = useAppStore.getState();
    if (!currentUser) return;
    await fetch('/api/documents', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: docId, status: 'signed' }) });
    toast({ title: t('success', lang), description: t('signDocument', lang) });
    loadDocs();
  };

  const docTypeLabels: Record<string, string> = {
    bill_of_lading: t('billOfLading', lang), delivery_note: t('deliveryNote', lang), damage_report: t('damageReport', lang),
    customs: t('customsDoc', lang), packing_list: t('tallySheet', lang), weigh_bridge: t('tallySheet', lang),
  };

  const docTypeIcons: Record<string, React.ReactNode> = {
    bill_of_lading: <Ship className="h-4 w-4 text-blue-500" />,
    delivery_note: <Truck className="h-4 w-4 text-amber-500" />,
    damage_report: <AlertTriangle className="h-4 w-4 text-red-500" />,
    customs: <Shield className="h-4 w-4 text-purple-500" />,
    packing_list: <ClipboardList className="h-4 w-4 text-green-500" />,
    weigh_bridge: <BarChart3 className="h-4 w-4 text-cyan-500" />,
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center gap-2">
        {['all', 'draft', 'pending_review', 'approved', 'signed'].map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className={filter === f ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}>
            {filterLabel(f, lang)}
          </Button>
        ))}
        <div className="flex-1" />
        <Button onClick={() => setNewDocDialog(true)} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
          <Plus className="h-4 w-4 mr-2" /> {t('add', lang)}
        </Button>
      </div>

      <div className="grid gap-4">
        {documents.map(doc => (
          <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setViewDoc(viewDoc?.id === doc.id ? null : doc)}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  {docTypeIcons[doc.docType] || <FileText className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{docTypeLabels[doc.docType] || doc.docType}</h3>
                    <Badge className={statusColors[doc.status] || ''} variant="outline">{statusLabel(doc.status, lang)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('reference', lang)}: {doc.reference}</p>
                  {doc.content && (() => { try { const p = JSON.parse(doc.content); return <p className="text-xs text-muted-foreground mt-1 truncate max-w-lg">{Object.entries(p).slice(0,3).map(([k,v]) => `${k}: ${v}`).join(' · ')}</p>; } catch { return <p className="text-xs text-muted-foreground mt-1 truncate max-w-lg">{doc.content}</p>; } })()}
                  {doc.signatures && doc.signatures.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Signature className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">{doc.signatures.length} {t('signedBy', lang)}</span>
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">{formatDate(doc.createdAt)}</p>
                  <div className="flex gap-1 mt-2 justify-end">
                    <Button size="sm" variant="outline" className="text-xs" onClick={(e) => { e.stopPropagation(); setPrintDoc(doc); }}>
                      <Download className="h-3 w-3 mr-1" /> {t('printDocument', lang)}
                    </Button>
                    {doc.status !== 'signed' && doc.status !== 'archived' && (
                      <Button size="sm" variant="outline" className="text-xs" onClick={(e) => { e.stopPropagation(); signDoc(doc.id); }}>
                        <Signature className="h-3 w-3 mr-1" /> {t('signDocument', lang)}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              {/* Expanded view */}
              {viewDoc?.id === doc.id && doc.content && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium text-sm mb-2">{t('details', lang)}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(() => { try { const parsed = JSON.parse(doc.content); return Object.entries(parsed).map(([k, v]) => (
                      <div key={k} className="p-2 rounded bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-xs text-muted-foreground">{k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</p>
                        <p className="text-sm font-medium">{String(v)}</p>
                      </div>
                    )); } catch { return <p className="col-span-2 text-sm text-muted-foreground">{doc.content}</p>; } })()}
                  </div>
                  {doc.notes && <p className="text-sm text-muted-foreground mt-3 italic">{t('notes', lang)}: {doc.notes}</p>}
                  {/* Display attached photos */}
                  {doc.photos && (() => { try { const photoUrls: string[] = JSON.parse(doc.photos); return photoUrls.length > 0 ? (
                    <div className="mt-3">
                      <h5 className="text-xs font-medium text-muted-foreground mb-2">{t('photoEvidence', lang)}</h5>
                      <div className="grid grid-cols-3 gap-2">
                        {photoUrls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt={`Photo ${i+1}`} className="w-full h-24 object-cover rounded-lg border hover:opacity-80 transition-opacity" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null; } catch { return null; } })()}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={newDocDialog} onOpenChange={setNewDocDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('create', lang)} {t('documents', lang)}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{t('docType', lang)}</Label>
              <Select value={newDoc.docType} onValueChange={(v) => setNewDoc(p => ({ ...p, docType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(docTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>{t('reference', lang)}</Label><Input placeholder="e.g. BL-ANT-2026-5521" value={newDoc.reference} onChange={(e) => setNewDoc(p => ({ ...p, reference: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>{t('orderNumber', lang)}</Label><Input placeholder="e.g. LO-2026-0001" value={newDoc.orderNumber} onChange={(e) => setNewDoc(p => ({ ...p, orderNumber: e.target.value }))} /></div>
              <div><Label>{t('customerName', lang)}</Label><Input placeholder="Customer name" value={newDoc.customerName} onChange={(e) => setNewDoc(p => ({ ...p, customerName: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>{t('transportCode', lang)}</Label><Input placeholder="Transport code" value={newDoc.transportCode} onChange={(e) => setNewDoc(p => ({ ...p, transportCode: e.target.value }))} /></div>
              <div><Label>{t('lotNumber', lang)}</Label><Input placeholder="Lot number" value={newDoc.lotNumber} onChange={(e) => setNewDoc(p => ({ ...p, lotNumber: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>{t('grossWeightKg', lang)}</Label><Input type="number" placeholder="0" value={newDoc.grossWeight} onChange={(e) => setNewDoc(p => ({ ...p, grossWeight: e.target.value }))} /></div>
              <div><Label>{t('netWeightKg', lang)}</Label><Input type="number" placeholder="0" value={newDoc.netWeight} onChange={(e) => setNewDoc(p => ({ ...p, netWeight: e.target.value }))} /></div>
            </div>
            <div><Label>{t('instructions', lang)}</Label><Textarea placeholder="Warehouse instructions..." value={newDoc.instructions} onChange={(e) => setNewDoc(p => ({ ...p, instructions: e.target.value }))} rows={3} /></div>
            <div><Label>{t('notes', lang)}</Label><Textarea placeholder="Additional notes..." value={newDoc.notes} onChange={(e) => setNewDoc(p => ({ ...p, notes: e.target.value }))} /></div>
            
            {/* Photo Capture Section */}
            <div>
              <Label className="flex items-center gap-2"><Camera className="h-4 w-4" /> {t('photoEvidence', lang)}</Label>
              <div className="mt-2 flex items-center gap-3">
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{uploading ? t('loading', lang) + '...' : t('takePhoto', lang)}</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/heic" capture="environment" multiple className="hidden" onChange={handlePhotoCapture} disabled={uploading} />
                </label>
              </div>
              {photos.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {photos.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt={`Photo ${i+1}`} className="w-full h-24 object-cover rounded-lg border" />
                      <button onClick={() => removePhoto(url)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter><Button onClick={createDoc} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">{t('create', lang)}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      <Dialog open={!!printDoc} onOpenChange={() => setPrintDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('printLoadingOrder', lang)}</DialogTitle></DialogHeader>
          <DocumentPrintView doc={printDoc} truck={null} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintDoc(null)}>{t('close', lang)}</Button>
            <Button onClick={() => window.print()} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
              <Download className="h-4 w-4 mr-2" /> {t('printDocument', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ SAFETY CHECKLISTS ============
function SafetyChecklists() {
  const { language, currentUser } = useAppStore();
  const lang = language;
  const [checklists, setChecklists] = useState<SafetyChecklist[]>([]);
  const [selectedCl, setSelectedCl] = useState<SafetyChecklist | null>(null);
  const [newClDialog, setNewClDialog] = useState(false);
  const [newCl, setNewCl] = useState({ checkType: 'pre_shift', location: '' });

  const safetyLoadedRef = useRef(false);
  const [, startTransitionSafety] = useTransition();
  const loadChecklists = useCallback(async () => {
    const data = await fetch('/api/safety').then(r => r.json());
    startTransitionSafety(() => { setChecklists(data); });
  }, [startTransitionSafety]);

  useEffect(() => {
    if (!safetyLoadedRef.current) {
      safetyLoadedRef.current = true;
      loadChecklists();
    }
  }, [loadChecklists]);

  const createChecklist = async () => {
    if (!currentUser) return;
    const items = getChecklistTemplate(newCl.checkType, lang);
    await fetch('/api/safety', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.id, checkType: newCl.checkType, location: newCl.location, status: 'pending', items }) });
    setNewClDialog(false);
    toast({ title: t('success', lang), description: t('safety', lang) });
    loadChecklists();
  };

  const answerItem = async (itemId: string, passed: boolean) => {
    if (!selectedCl) return;
    const updatedItems = selectedCl.items?.map(i => i.id === itemId ? { ...i, passed } : i);
    await fetch('/api/safety', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedCl.id, items: updatedItems?.map(i => ({ id: i.id, passed: i.passed, notes: i.notes })) }) });
    loadChecklists();
    const fresh = await fetch('/api/safety').then(r => r.json());
    const found = fresh.find((c: SafetyChecklist) => c.id === selectedCl.id);
    if (found) setSelectedCl(found);
  };

  const completeChecklist = async () => {
    if (!selectedCl) return;
    const allAnswered = selectedCl.items?.every(i => i.passed !== null);
    const anyFailed = selectedCl.items?.some(i => i.passed === false);
    await fetch('/api/safety', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedCl.id, status: anyFailed ? 'failed' : 'completed' }) });
    toast({ title: t('completeCheck', lang), variant: anyFailed ? 'destructive' : 'default' });
    loadChecklists();
    setSelectedCl(null);
  };

  const clTypeLabels: Record<string, string> = {
    pre_shift: t('preShift', lang), dock_safety: t('safety', lang), equipment: t('equipment', lang),
    hazardous_cargo: t('safety', lang), crane_lift: t('safety', lang),
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('safety', lang)}</h2>
        <Dialog open={newClDialog} onOpenChange={setNewClDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-red-500 to-pink-600 text-white">
              <Plus className="h-4 w-4 mr-2" /> {t('add', lang)}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('startCheck', lang)}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t('checkType', lang)}</Label>
                <Select value={newCl.checkType} onValueChange={(v) => setNewCl(p => ({ ...p, checkType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(clTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{t('location', lang)}</Label><Input placeholder="e.g. Quai 125" value={newCl.location} onChange={(e) => setNewCl(p => ({ ...p, location: e.target.value }))} /></div>
            </div>
            <DialogFooter><Button onClick={createChecklist} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">{t('startCheck', lang)}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {selectedCl ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><HardHat className="h-5 w-5 text-orange-500" /> {clTypeLabels[selectedCl.checkType] || selectedCl.checkType}</CardTitle>
                <CardDescription>{selectedCl.location} — {formatDate(selectedCl.createdAt)}</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedCl(null)}><ArrowLeft className="h-4 w-4 mr-1" /> {t('details', lang)}</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {(() => {
              const categories = [...new Set(selectedCl.items?.map(i => i.category) || [])];
              return categories.map(cat => (
                <div key={cat}>
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><Shield className="h-4 w-4 text-slate-500" /> {cat}</h4>
                  <div className="space-y-2">
                    {selectedCl.items?.filter(i => i.category === cat).map(item => (
                      <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
                        item.passed === true ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                        item.passed === false ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                        'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}>
                        <p className="flex-1 text-sm">{item.question}</p>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" variant={item.passed === true ? 'default' : 'outline'} className={item.passed === true ? 'bg-green-500 text-white' : ''} onClick={() => answerItem(item.id, true)}>
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant={item.passed === false ? 'default' : 'outline'} className={item.passed === false ? 'bg-red-500 text-white' : ''} onClick={() => answerItem(item.id, false)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={completeChecklist} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <CheckCheck className="h-4 w-4 mr-2" /> {t('completeCheck', lang)}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {checklists.map(cl => {
            const total = cl.items?.length || 0;
            const answered = cl.items?.filter(i => i.passed !== null).length || 0;
            const failed = cl.items?.filter(i => i.passed === false).length || 0;
            return (
              <Card key={cl.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCl(cl)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      cl.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                      cl.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                      'bg-orange-100 dark:bg-orange-900/30 text-orange-600'
                    }`}>
                      <Shield className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{clTypeLabels[cl.checkType] || cl.checkType}</h3>
                        <Badge className={statusColors[cl.status] || ''} variant="outline">{statusLabel(cl.status, lang)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{cl.location} — {cl.user?.name}</p>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{answered}/{total} answered {failed > 0 && `(${failed} failed)`}</span>
                          <span>{total > 0 ? Math.round((answered / total) * 100) : 0}%</span>
                        </div>
                        <Progress value={total > 0 ? (answered / total) * 100 : 0} className="h-2" />
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getChecklistTemplate(type: string, lang: Language): { category: string; question: string }[] {
  const templates: Record<string, { category: string; question: string }[]> = {
    pre_shift: [
      { category: t('personalProtective', lang), question: t('hardHat', lang) },
      { category: t('personalProtective', lang), question: t('safetyBoots', lang) },
      { category: t('personalProtective', lang), question: t('highViz', lang) },
      { category: t('personalProtective', lang), question: t('safetyGlasses', lang) },
      { category: t('personalProtective', lang), question: 'Hearing protection available?' },
      { category: t('equipment', lang), question: t('craneInspection', lang) },
      { category: t('equipment', lang), question: t('slingsInspection', lang) },
      { category: t('equipment', lang), question: t('forkliftCheck', lang) },
      { category: t('workArea', lang), question: t('dockClear', lang) },
      { category: t('workArea', lang), question: t('warningSigns', lang) },
      { category: t('workArea', lang), question: t('adequateLighting', lang) },
      { category: t('emergency', lang), question: t('fireExtinguishers', lang) },
      { category: t('emergency', lang), question: t('emergencyExits', lang) },
      { category: t('emergency', lang), question: t('firstAidKit', lang) },
    ],
    dock_safety: [
      { category: 'Dock Edge', question: 'Dock edge protection in place?' },
      { category: 'Dock Edge', question: 'Life rings and throw lines available?' },
      { category: 'Dock Edge', question: 'Gangway/bridge properly secured?' },
      { category: 'Vehicle Safety', question: 'Wheel chocks in place for trailers?' },
      { category: 'Vehicle Safety', question: 'Dock levellers functioning correctly?' },
      { category: 'Vehicle Safety', question: 'Traffic management plan active?' },
      { category: 'Weather', question: 'Weather conditions safe for operations?' },
      { category: 'Weather', question: 'Wind speed within limits for crane ops?' },
    ],
    equipment: [
      { category: 'Crane', question: 'Wire ropes inspected - no visible damage?' },
      { category: 'Crane', question: 'Load indicators working?' },
      { category: 'Crane', question: 'Emergency stop tested?' },
      { category: 'Forklift', question: 'Fluid levels checked (oil, hydraulic, coolant)?' },
      { category: 'Forklift', question: 'Tyres in good condition?' },
      { category: 'Forklift', question: 'Horn and lights working?' },
      { category: 'Lifting Gear', question: 'All slings tagged and within inspection date?' },
      { category: 'Lifting Gear', question: 'Shackles and hooks with valid certificates?' },
    ],
    hazardous_cargo: [
      { category: 'Documentation', question: 'Dangerous goods declaration received?' },
      { category: 'Documentation', question: 'Material Safety Data Sheet (MSDS) available?' },
      { category: 'Documentation', question: 'Proper shipping name and UN number verified?' },
      { category: 'Segregation', question: 'Incompatible substances properly separated?' },
      { category: 'Segregation', question: 'Stowage complies with IMDG code?' },
      { category: 'PPE', question: 'Correct PPE for cargo type available?' },
      { category: 'PPE', question: 'Spill containment equipment ready?' },
      { category: t('emergency', lang), question: 'Emergency procedures posted and understood?' },
    ],
    crane_lift: [
      { category: 'Pre-Lift', question: 'Lift plan prepared and communicated?' },
      { category: 'Pre-Lift', question: 'Load weight verified and within crane capacity?' },
      { category: 'Pre-Lift', question: 'Sling angle calculated (minimum 60 degrees)?' },
      { category: 'Pre-Lift', question: 'Tag lines available and personnel assigned?' },
      { category: 'Area', question: 'Exclusion zone established and barriers in place?' },
      { category: 'Area', question: 'No personnel under suspended load?' },
      { category: 'Communication', question: 'Signal person designated and visible?' },
      { category: 'Communication', question: 'Radio communication tested?' },
    ],
  };
  return templates[type] || templates.pre_shift;
}

// ============ TRUCK VISITS ============
function TruckVisits() {
  const { currentRole, currentUser, language } = useAppStore();
  const lang = language;
  const [trucks, setTrucks] = useState<TruckVisit[]>([]);
  const [newTruckDialog, setNewTruckDialog] = useState(false);
  const [newTruck, setNewTruck] = useState({ driverName: '', truckPlate: '', trailerPlate: '', company: '', purpose: 'delivery', cargoDescription: '', bookingRef: '', lotNumber: '', transportCode: '', grossWeight: '', netWeight: '', instructions: '' });
  const [printTruckVisit, setPrintTruckVisit] = useState<TruckVisit | null>(null);

  const trucksLoadedRef = useRef(false);
  const [, startTransitionTrucks] = useTransition();
  const loadTrucks = useCallback(async () => {
    const data = await fetch('/api/trucks').then(r => r.json());
    startTransitionTrucks(() => { setTrucks(data); });
  }, [startTransitionTrucks]);

  useEffect(() => {
    if (!trucksLoadedRef.current) {
      trucksLoadedRef.current = true;
      loadTrucks();
    }
  }, [loadTrucks]);

  const createTruck = async () => {
    await fetch('/api/trucks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newTruck, grossWeight: newTruck.grossWeight ? parseFloat(newTruck.grossWeight) : null, netWeight: newTruck.netWeight ? parseFloat(newTruck.netWeight) : null, status: 'expected', expectedArrival: new Date(Date.now() + 3600000).toISOString() }) });
    setNewTruckDialog(false);
    setNewTruck({ driverName: '', truckPlate: '', trailerPlate: '', company: '', purpose: 'delivery', cargoDescription: '', bookingRef: '', lotNumber: '', transportCode: '', grossWeight: '', netWeight: '', instructions: '' });
    toast({ title: t('success', lang), description: t('trucks', lang) });
    loadTrucks();
  };

  const advanceStatus = async (id: string, currentStatus: string) => {
    const next: Record<string, string> = { expected: 'arrived', arrived: 'at_dock', at_dock: 'loading', loading: 'completed' };
    const nextStatus = next[currentStatus];
    if (!nextStatus) return;
    const data: any = { id, status: nextStatus };
    if (nextStatus === 'arrived') data.arrivedAt = new Date().toISOString();
    if (nextStatus === 'at_dock') { data.dockAssignedAt = new Date().toISOString(); data.dockNumber = 'D' + Math.ceil(Math.random() * 8); }
    if (nextStatus === 'completed') data.completedAt = new Date().toISOString();
    await fetch('/api/trucks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    toast({ title: t('success', lang) });
    loadTrucks();
  };

  const statusFlow: Record<string, string[]> = { expected: ['arrived'], arrived: ['at_dock'], at_dock: ['loading'], loading: ['completed'] };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('trucks', lang)}</h2>
        <Dialog open={newTruckDialog} onOpenChange={setNewTruckDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
              <Plus className="h-4 w-4 mr-2" /> {t('add', lang)}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{t('trucks', lang)}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t('driverName', lang)}</Label><Input placeholder="Full name" value={newTruck.driverName} onChange={(e) => setNewTruck(p => ({ ...p, driverName: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t('truckPlate', lang)}</Label><Input placeholder="1-ABC-123" value={newTruck.truckPlate} onChange={(e) => setNewTruck(p => ({ ...p, truckPlate: e.target.value }))} /></div>
                <div><Label>{t('trailerPlate', lang)}</Label><Input placeholder="1-XYZ-456" value={newTruck.trailerPlate} onChange={(e) => setNewTruck(p => ({ ...p, trailerPlate: e.target.value }))} /></div>
              </div>
              <div><Label>{t('company', lang)}</Label><Input placeholder="Transport company" value={newTruck.company} onChange={(e) => setNewTruck(p => ({ ...p, company: e.target.value }))} /></div>
              <div><Label>{t('purpose', lang)}</Label>
                <Select value={newTruck.purpose} onValueChange={(v) => setNewTruck(p => ({ ...p, purpose: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="delivery">{t('delivery', lang)}</SelectItem><SelectItem value="pickup">{t('pickup', lang)}</SelectItem><SelectItem value="both">{t('delivery', lang)} + {t('pickup', lang)}</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>{t('cargoDescription', lang)}</Label><Textarea placeholder="What cargo..." value={newTruck.cargoDescription} onChange={(e) => setNewTruck(p => ({ ...p, cargoDescription: e.target.value }))} /></div>
              <div><Label>{t('bookingRef', lang)}</Label><Input placeholder="BK-2026-XXXX" value={newTruck.bookingRef} onChange={(e) => setNewTruck(p => ({ ...p, bookingRef: e.target.value }))} /></div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t('lotNumber', lang)}</Label><Input placeholder="Lot number" value={newTruck.lotNumber} onChange={(e) => setNewTruck(p => ({ ...p, lotNumber: e.target.value }))} /></div>
                <div><Label>{t('transportCode', lang)}</Label><Input placeholder="Transport code" value={newTruck.transportCode} onChange={(e) => setNewTruck(p => ({ ...p, transportCode: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t('grossWeightKg', lang)}</Label><Input type="number" placeholder="0" value={newTruck.grossWeight} onChange={(e) => setNewTruck(p => ({ ...p, grossWeight: e.target.value }))} /></div>
                <div><Label>{t('netWeightKg', lang)}</Label><Input type="number" placeholder="0" value={newTruck.netWeight} onChange={(e) => setNewTruck(p => ({ ...p, netWeight: e.target.value }))} /></div>
              </div>
              <div><Label>{t('instructions', lang)}</Label><Textarea placeholder="Special instructions..." value={newTruck.instructions} onChange={(e) => setNewTruck(p => ({ ...p, instructions: e.target.value }))} rows={3} /></div>
            </div>
            <DialogFooter><Button onClick={createTruck} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">{t('create', lang)}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {trucks.map(tv => (
          <Card key={tv.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  tv.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                  tv.status === 'at_dock' || tv.status === 'loading' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                  'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                }`}>
                  <Truck className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{tv.driverName}</h3>
                    <Badge className={statusColors[tv.status] || ''} variant="outline">{statusLabel(tv.status, lang)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{tv.truckPlate} {tv.trailerPlate && `/ ${tv.trailerPlate}`} — {tv.company}</p>
                  <p className="text-sm text-muted-foreground">{tv.purpose} — {tv.cargoDescription}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {tv.dockNumber && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {t('dockNumber', lang)} {tv.dockNumber}</span>}
                    {tv.bookingRef && <span>{tv.bookingRef}</span>}
                    {tv.expectedArrival && <span>{t('expectedArrival', lang)}: {formatTime(tv.expectedArrival)}</span>}
                  </div>
                </div>
                <div className="shrink-0 flex flex-col gap-2 items-end">
                  {statusFlow[tv.status] && (
                    <Button size="sm" onClick={() => advanceStatus(tv.id, tv.status)} className="bg-blue-500 hover:bg-blue-600 text-white">
                      <ArrowRight className="h-4 w-4 mr-1" /> {statusLabel(statusFlow[tv.status][0], lang)}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setPrintTruckVisit(tv)} className="text-xs">
                    <Download className="h-3 w-3 mr-1" /> {t('printLoadingOrder', lang)}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Print Loading Order Dialog */}
      <Dialog open={!!printTruckVisit} onOpenChange={() => setPrintTruckVisit(null)}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('printLoadingOrder', lang)}</DialogTitle></DialogHeader>
          <DocumentPrintView doc={null} truck={printTruckVisit} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintTruckVisit(null)}>{t('close', lang)}</Button>
            <Button onClick={() => window.print()} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
              <Download className="h-4 w-4 mr-2" /> {t('printDocument', lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ WAREHOUSES ============
function WarehouseView() {
  const { language } = useAppStore();
  const lang = language;
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWh, setSelectedWh] = useState<Warehouse | null>(null);

  useEffect(() => {
    fetch('/api/warehouses').then(r => r.json()).then(setWarehouses);
  }, []);

  const typeLabels: Record<string, string> = { general: t('breakbulk', lang), cold: t('cargoType', lang), hazardous: t('safety', lang), bulk: t('bulk', lang) };
  const typeColors: Record<string, string> = { general: 'from-blue-500 to-cyan-500', cold: 'from-cyan-500 to-blue-600', hazardous: 'from-red-500 to-orange-500', bulk: 'from-amber-500 to-yellow-500' };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-6xl mx-auto">
      <h2 className="text-lg font-semibold">{t('warehouses', lang)}</h2>

      {selectedWh ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedWh.name}</CardTitle>
                <CardDescription>{selectedWh.code} — {selectedWh.location} — {typeLabels[selectedWh.type]}</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedWh(null)}><ArrowLeft className="h-4 w-4 mr-1" /> {t('details', lang)}</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"><p className="text-xs text-muted-foreground">{t('cargoType', lang)}</p><p className="font-semibold">{typeLabels[selectedWh.type]}</p></div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"><p className="text-xs text-muted-foreground">{t('unitCount', lang)}</p><p className="font-semibold">{selectedWh.capacity?.toLocaleString() || '-'}</p></div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"><p className="text-xs text-muted-foreground">{t('area', lang)}</p><p className="font-semibold">{selectedWh.area?.toLocaleString() || '-'} m²</p></div>
            </div>
            <h4 className="font-semibold text-sm mb-3">{t('storageLocation', lang)}</h4>
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
              {selectedWh.storageLocations?.map((loc: any) => (
                <div key={loc.id} className={`p-2 rounded-lg border text-center text-xs ${
                  loc.occupied ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700' : 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                }`}>
                  <p className="font-bold">{loc.zone}-{loc.row}-{loc.bay}</p>
                  <p className="text-muted-foreground text-[10px]">{loc.occupied ? loc.cargoRef || t('occupied', lang) : 'Free'}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {warehouses.map(wh => {
            const total = wh.storageLocations?.length || 0;
            const occupied = wh.storageLocations?.filter((l: any) => l.occupied).length || 0;
            const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
            return (
              <Card key={wh.id} className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden" onClick={() => setSelectedWh(wh)}>
                <div className={`h-2 bg-gradient-to-r ${typeColors[wh.type] || 'from-slate-500 to-slate-600'}`} />
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{wh.code}</Badge>
                    <span className="text-xs text-muted-foreground capitalize">{typeLabels[wh.type]}</span>
                  </div>
                  <h3 className="font-semibold">{wh.name}</h3>
                  <p className="text-sm text-muted-foreground">{wh.location}</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{occupied}/{total} {t('occupied', lang).toLowerCase()}</span>
                      <span>{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                  {wh.area && <p className="text-xs text-muted-foreground mt-2">{wh.area.toLocaleString()} m²</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============ NOTIFICATIONS ============
function NotificationsView() {
  const { language } = useAppStore();
  const lang = language;
  const [notifs, setNotifs] = useState<Notification[]>([]);

  const notifsLoadedRef = useRef(false);
  const [, startTransitionNotifs] = useTransition();
  const loadNotifs = useCallback(async () => {
    const data = await fetch('/api/notifications').then(r => r.json());
    startTransitionNotifs(() => { setNotifs(data); });
  }, [startTransitionNotifs]);

  useEffect(() => {
    if (!notifsLoadedRef.current) {
      notifsLoadedRef.current = true;
      loadNotifs();
    }
  }, [loadNotifs]);

  const markRead = async (id: string) => {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, read: true }) });
    loadNotifs();
  };

  const markAllRead = async () => {
    for (const n of notifs.filter(n => !n.read)) {
      await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: n.id, read: true }) });
    }
    loadNotifs();
    toast({ title: t('success', lang) });
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('notifications', lang)}</h2>
        <Button variant="outline" size="sm" onClick={markAllRead}><CheckCheck className="h-4 w-4 mr-2" /> {t('markComplete', lang)}</Button>
      </div>
      <div className="space-y-3">
        {notifs.map(n => (
          <Card key={n.id} className={`transition-all ${n.read ? 'opacity-60' : 'shadow-md'}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{notifIcons[n.type] || <Info className="h-4 w-4" />}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{n.title}</h3>
                    {n.category && <Badge variant="outline" className="text-xs">{notifCategoryLabel(n.category, lang)}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">{timeSince(n.createdAt)}</p>
                </div>
                {!n.read && <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}><Eye className="h-4 w-4" /></Button>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============ REPORTS ============
function ReportsView() {
  const { language } = useAppStore();
  const lang = language;
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => { fetch('/api/stats').then(r => r.json()).then(setStats); }, []);
  if (!stats) return <div className="p-6"><p>{t('loading', lang)}</p></div>;

  const reportCards = [
    { title: t('shifts', lang), data: [{ label: t('active', lang), value: stats.activeShifts }] },
    { title: t('cargo', lang), data: [{ label: t('pendingCargo', lang), value: stats.pendingCargo }, { label: t('inProgressCargo', lang), value: stats.inProgressCargo }, { label: t('completedCargo', lang), value: stats.completedCargo }] },
    { title: t('trucks', lang), data: [{ label: t('expectedTrucks', lang), value: stats.expectedTrucks }, { label: t('atDockTrucks', lang), value: stats.atDockTrucks }] },
    { title: t('documents', lang), data: [{ label: t('pendingReview', lang), value: stats.pendingDocs }] },
    { title: t('safety', lang), data: [{ label: t('activeSafety', lang), value: stats.activeSafetyChecks }] },
    { title: t('admin', lang), data: [{ label: t('totalWorkers', lang), value: stats.totalWorkers }, { label: t('totalChauffeurs', lang), value: stats.totalChauffeurs }] },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      <h2 className="text-lg font-semibold">{t('reports', lang)}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {reportCards.map((rc, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><CardTitle className="text-base">{rc.title}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rc.data.map((d, j) => (
                  <div key={j} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{d.label}</span>
                    <span className="font-bold text-lg">{d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{t('warehouseOverview', lang)}</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.warehouses.map((wh: any) => {
              const pct = wh.totalSlots > 0 ? Math.round((wh.occupiedSlots / wh.totalSlots) * 100) : 0;
              return (
                <div key={wh.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{wh.name} ({wh.code})</span>
                    <span className="text-muted-foreground">{wh.occupiedSlots}/{wh.totalSlots} — {pct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                    <div className={`h-4 rounded-full ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ ADMIN PANEL ============
function AdminPanel() {
  const { language } = useAppStore();
  const lang = language;
  const [users, setUsers] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({ email: '', name: '', role: 'dock_worker', badge: '', phone: '', password: '' });
  const [tab, setTab] = useState('users');

  const [, startTransitionAdmin] = useTransition();
  const fetchUsers = useCallback(async () => {
    const res = await fetch('/api/admin/users');
    if (res.ok) { const data = await res.json(); startTransitionAdmin(() => setUsers(data)); }
  }, [startTransitionAdmin]);

  const fetchAudit = useCallback(async () => {
    const res = await fetch('/api/admin/audit?limit=50');
    if (res.ok) { const data = await res.json(); startTransitionAdmin(() => setAuditLog(data)); }
  }, [startTransitionAdmin]);

  useEffect(() => { fetchUsers(); fetchAudit(); }, [fetchUsers, fetchAudit]);

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.name) { toast({ title: t('error', lang), description: t('email', lang) + ' & ' + t('name', lang), variant: 'destructive' }); return; }
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newUser) });
    if (res.ok) {
      const data = await res.json();
      toast({ title: t('success', lang), description: `Created ${data.name}. Temp password: ${data.tempPassword}` });
      setShowAddUser(false); setNewUser({ email: '', name: '', role: 'dock_worker', badge: '', phone: '', password: '' }); fetchUsers();
    } else { const err = await res.json(); toast({ title: t('error', lang), description: err.error, variant: 'destructive' }); }
  };

  const handleUpdateUser = async (id: string, updates: any) => {
    const res = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) });
    if (res.ok) { toast({ title: t('success', lang), description: t('save', lang) }); setEditUser(null); fetchUsers(); fetchAudit(); }
    else { const err = await res.json(); toast({ title: t('error', lang), description: err.error, variant: 'destructive' }); }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-2" />{t('userManagement', lang)}</TabsTrigger>
          <TabsTrigger value="audit"><FileSearch className="h-4 w-4 mr-2" />{t('auditLog', lang)}</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{t('userManagement', lang)} ({users.length})</h3>
            <Button onClick={() => setShowAddUser(true)} className="bg-amber-500 hover:bg-amber-600"><Plus className="h-4 w-4 mr-2" />{t('addUser', lang)}</Button>
          </div>

          {/* Add User Dialog */}
          <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('addUser', lang)}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>{t('email', lang)}</Label><Input value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} /></div>
                <div><Label>{t('name', lang)}</Label><Input value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} /></div>
                <div><Label>{t('role', lang)}</Label>
                  <Select value={newUser.role} onValueChange={v => setNewUser({...newUser, role: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dock_worker">{roleLabel('dock_worker', lang)}</SelectItem>
                      <SelectItem value="chauffeur">{roleLabel('chauffeur', lang)}</SelectItem>
                      <SelectItem value="admin">{roleLabel('admin', lang)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>{t('badge', lang)}</Label><Input value={newUser.badge} onChange={e => setNewUser({...newUser, badge: e.target.value})} /></div>
                <div><Label>{t('phone', lang)}</Label><Input value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} /></div>
                <div><Label>{t('password', lang)}</Label><Input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="Default: changeme" /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddUser(false)}>{t('cancel', lang)}</Button>
                <Button onClick={handleAddUser} className="bg-amber-500 hover:bg-amber-600">{t('create', lang)}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit User Dialog */}
          <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('editUser', lang)}</DialogTitle></DialogHeader>
              {editUser && (
                <div className="space-y-3">
                  <div><Label>{t('name', lang)}</Label><Input defaultValue={editUser.name} onChange={e => setEditUser({...editUser, name: e.target.value})} /></div>
                  <div><Label>{t('role', lang)}</Label>
                    <Select value={editUser.role} onValueChange={v => setEditUser({...editUser, role: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dock_worker">{roleLabel('dock_worker', lang)}</SelectItem>
                        <SelectItem value="chauffeur">{roleLabel('chauffeur', lang)}</SelectItem>
                        <SelectItem value="admin">{roleLabel('admin', lang)}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>{t('badge', lang)}</Label><Input defaultValue={editUser.badge || ''} onChange={e => setEditUser({...editUser, badge: e.target.value})} /></div>
                  <div><Label>{t('phone', lang)}</Label><Input defaultValue={editUser.phone || ''} onChange={e => setEditUser({...editUser, phone: e.target.value})} /></div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditUser(null)}>{t('cancel', lang)}</Button>
                <Button onClick={() => handleUpdateUser(editUser.id, { name: editUser.name, role: editUser.role, badge: editUser.badge, phone: editUser.phone })} className="bg-amber-500 hover:bg-amber-600">{t('save', lang)}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800"><tr>
                  <th className="p-3 text-left">{t('name', lang)}</th>
                  <th className="p-3 text-left">{t('email', lang)}</th>
                  <th className="p-3 text-left">{t('role', lang)}</th>
                  <th className="p-3 text-left">{t('badge', lang)}</th>
                  <th className="p-3 text-left">{t('status', lang)}</th>
                  <th className="p-3 text-left">{t('actions', lang)}</th>
                </tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-medium">{u.name}</td>
                      <td className="p-3 text-slate-600">{u.email}</td>
                      <td className="p-3"><Badge variant="outline" className={u.role === 'admin' ? 'border-amber-500 text-amber-600' : u.role === 'chauffeur' ? 'border-blue-500 text-blue-600' : 'border-green-500 text-green-600'}>{roleLabel(u.role, lang)}</Badge></td>
                      <td className="p-3">{u.badge || '-'}</td>
                      <td className="p-3"><Badge className={u.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{u.active ? t('active', lang) : t('inactive', lang)}</Badge></td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setEditUser(u)}><Edit className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => handleUpdateUser(u.id, { active: !u.active })}>
                            {u.active ? <XCircle className="h-4 w-4 text-red-500" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <h3 className="text-lg font-semibold">{t('auditLog', lang)}</h3>
          <div className="rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800"><tr>
                  <th className="p-3 text-left">{t('timestamp', lang)}</th>
                  <th className="p-3 text-left">{t('action', lang)}</th>
                  <th className="p-3 text-left">{t('performedBy', lang)}</th>
                  <th className="p-3 text-left">{t('target', lang)}</th>
                  <th className="p-3 text-left">{t('details', lang)}</th>
                </tr></thead>
                <tbody>
                  {auditLog.map((entry: any) => (
                    <tr key={entry.id} className="border-t hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 text-xs">{formatDate(entry.createdAt)}</td>
                      <td className="p-3"><Badge variant="outline">{entry.action}</Badge></td>
                      <td className="p-3">{entry.performerName || entry.performedBy}</td>
                      <td className="p-3">{entry.tableName} / {entry.recordId?.substring(0,8)}...</td>
                      <td className="p-3 text-xs max-w-xs truncate">
                        {entry.newValue ? <details><summary className="cursor-pointer text-blue-600">{t('details', lang)}</summary><pre className="mt-1 text-xs bg-slate-100 p-2 rounded overflow-auto max-h-32">{entry.newValue}</pre></details> : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============ SETTINGS VIEW ============
function SettingsView() {
  const { language, setLanguage, darkMode, setDarkMode, currentUser } = useAppStore();
  const lang = language;
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async () => {
    if (newPw.length < 6) { toast({ title: t('error', lang), description: t('passwordTooShort', lang), variant: 'destructive' }); return; }
    if (newPw !== confirmPw) { toast({ title: t('error', lang), description: t('passwordMismatch', lang), variant: 'destructive' }); return; }
    setPwLoading(true);
    const res = await fetch('/api/auth/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }) });
    if (res.ok) { toast({ title: t('success', lang), description: t('passwordChanged', lang) }); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }
    else { const err = await res.json(); toast({ title: t('error', lang), description: err.error, variant: 'destructive' }); }
    setPwLoading(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-2xl">
      {/* Profile */}
      <Card>
        <CardHeader><CardTitle>{t('myProfile', lang)}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16"><AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xl font-bold">{currentUser?.name?.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback></Avatar>
            <div>
              <p className="font-semibold text-lg">{currentUser?.name}</p>
              <p className="text-slate-500">{currentUser?.email}</p>
              <Badge className="mt-1">{roleLabel(currentUser?.role, lang)}</Badge>
            </div>
          </div>
          {currentUser?.badge && <p className="text-sm text-slate-600">{t('badge', lang)}: {currentUser.badge}</p>}
          {currentUser?.phone && <p className="text-sm text-slate-600">{t('phone', lang)}: {currentUser.phone}</p>}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader><CardTitle><Lock className="h-5 w-5 inline mr-2" />{t('changePassword', lang)}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>{t('currentPassword', lang)}</Label><Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} /></div>
          <div><Label>{t('newPassword', lang)}</Label><Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} /></div>
          <div><Label>{t('confirmPassword', lang)}</Label><Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} /></div>
          <Button onClick={handleChangePassword} disabled={pwLoading} className="bg-amber-500 hover:bg-amber-600">{pwLoading ? t('saving', lang) : t('changePassword', lang)}</Button>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader><CardTitle><Languages className="h-5 w-5 inline mr-2" />{t('language', lang)}</CardTitle></CardHeader>
        <CardContent>
          <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.entries(languageNames) as [Language, string][]).map(([code, name]) => (
                <SelectItem key={code} value={code}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Dark Mode */}
      <Card>
        <CardHeader><CardTitle>{darkMode ? <Moon className="h-5 w-5 inline mr-2" /> : <Sun className="h-5 w-5 inline mr-2" />}{darkMode ? t('darkMode', lang) : t('lightMode', lang)}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Sun className="h-5 w-5 text-amber-500" />
            <button onClick={() => setDarkMode(!darkMode)} className={`relative w-14 h-7 rounded-full transition-colors ${darkMode ? 'bg-amber-500' : 'bg-slate-300'}`}>
              <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-7' : 'translate-x-0.5'}`} />
            </button>
            <Moon className="h-5 w-5 text-slate-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ DOCUMENT PRINT VIEW ============
function DocumentPrintView({ doc, truck }: { doc: Document | null; truck: TruckVisit | null }) {
  const { language } = useAppStore();
  const lang = language;

  const now = new Date();
  const dateStr = now.toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });

  const orderNum = doc?.orderNumber || doc?.reference || 'LO-2026-0001';
  const custName = doc?.customerName || truck?.company || '';
  const transCode = doc?.transportCode || truck?.transportCode || '';
  const lotNum = doc?.lotNumber || truck?.lotNumber || '';
  const ref = doc?.reference || truck?.bookingRef || '';
  const grossW = doc?.grossWeight ?? truck?.grossWeight ?? null;
  const netW = doc?.netWeight ?? truck?.netWeight ?? null;
  const instr = doc?.instructions || truck?.instructions || '';
  const productDesc = doc?.content || truck?.cargoDescription || '';
  const productCode = doc?.docType || truck?.purpose || '';

  return (
    <div id="print-area" className="bg-white text-black p-8 font-sans text-xs" style={{ maxWidth: '210mm', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-600 to-orange-700 rounded-lg flex items-center justify-center">
              <Anchor className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide">C. STEINWEG BELGIUM N.V.</h1>
              <p className="text-[10px] text-gray-600">Vrieskaai 125-133, 2000 Antwerpen</p>
              <p className="text-[10px] text-gray-600">Tel: +32 3 570 28 00 — BTW BE 0405.272.440</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-base font-bold uppercase tracking-wider border border-black px-3 py-1 mb-2">{t('laadorder', lang)} / {t('loadingOrder', lang)}</h2>
          <p className="text-[10px]">{t('date', lang)}: {dateStr} — {t('time', lang)}: {timeStr}</p>
          <div className="mt-2 border border-black px-4 py-2 text-center">
            <p className="text-[8px] text-gray-500 uppercase">{t('barcode', lang)}</p>
            <div className="flex justify-center gap-0.5 my-1">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className={`${i % 3 === 0 ? 'w-[2px]' : i % 3 === 1 ? 'w-[1px]' : 'w-[3px]'} h-6 bg-black`} />
              ))}
            </div>
            <p className="text-[8px] font-mono">{orderNum}</p>
          </div>
        </div>
      </div>

      {/* Order Info Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="border border-gray-400 p-2">
          <p className="text-[9px] text-gray-500 uppercase">{t('orderNumber', lang)}</p>
          <p className="text-sm font-bold text-amber-700">{orderNum}</p>
        </div>
        <div className="border border-gray-400 p-2">
          <p className="text-[9px] text-gray-500 uppercase">{t('customerName', lang)}</p>
          <p className="text-sm font-semibold">{custName}</p>
        </div>
        <div className="border border-gray-400 p-2">
          <p className="text-[9px] text-gray-500 uppercase">{t('transportCode', lang)}</p>
          <p className="text-sm font-semibold">{transCode}</p>
        </div>
        <div className="border border-gray-400 p-2">
          <p className="text-[9px] text-gray-500 uppercase">{t('lotNumber', lang)}</p>
          <p className="text-sm font-semibold">{lotNum}</p>
        </div>
        <div className="border border-gray-400 p-2">
          <p className="text-[9px] text-gray-500 uppercase">{t('reference', lang)}</p>
          <p className="text-sm font-semibold">{ref}</p>
        </div>
        <div className="border border-gray-400 p-2">
          <p className="text-[9px] text-gray-500 uppercase">{t('truckPlate', lang)}</p>
          <p className="text-sm font-semibold">{truck?.truckPlate || ''}</p>
        </div>
      </div>

      {/* Product Details Table */}
      <div className="mb-4">
        <h3 className="text-[10px] font-bold uppercase border-b border-gray-400 pb-1 mb-2">{t('productDetails', lang)}</h3>
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 px-2 py-1 text-left">{t('description', lang)}</th>
              <th className="border border-gray-400 px-2 py-1 text-left">{t('productCode', lang)}</th>
              <th className="border border-gray-400 px-2 py-1 text-center">{t('quantity', lang)}</th>
              <th className="border border-gray-400 px-2 py-1 text-right">{t('grossWeightKg', lang)}</th>
              <th className="border border-gray-400 px-2 py-1 text-right">{t('netWeightKg', lang)}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 px-2 py-1">{productDesc || '—'}</td>
              <td className="border border-gray-400 px-2 py-1">{productCode || '—'}</td>
              <td className="border border-gray-400 px-2 py-1 text-center">1</td>
              <td className="border border-gray-400 px-2 py-1 text-right">{grossW != null ? grossW.toLocaleString() : '—'}</td>
              <td className="border border-gray-400 px-2 py-1 text-right">{netW != null ? netW.toLocaleString() : '—'}</td>
            </tr>
            <tr className="bg-gray-50 font-semibold">
              <td className="border border-gray-400 px-2 py-1" colSpan={2}>{t('total', lang) || 'Total'}</td>
              <td className="border border-gray-400 px-2 py-1 text-center">1</td>
              <td className="border border-gray-400 px-2 py-1 text-right">{grossW != null ? grossW.toLocaleString() : '—'}</td>
              <td className="border border-gray-400 px-2 py-1 text-right">{netW != null ? netW.toLocaleString() : '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Instructions */}
      {instr && (
        <div className="mb-4 border border-gray-400 p-3">
          <h3 className="text-[10px] font-bold uppercase mb-1">{t('warehouseInstructions', lang)}</h3>
          <p className="text-[10px] whitespace-pre-wrap">{instr}</p>
        </div>
      )}

      {/* Sign-off Section */}
      <div className="grid grid-cols-2 gap-8 mt-8">
        <div>
          <p className="text-[10px] font-bold uppercase mb-6">{t('preparedBy', lang)}:</p>
          <div className="border-t border-black pt-1">
            <p className="text-[9px]">{t('signatureLine', lang)}: ___________________________</p>
            <p className="text-[9px] mt-2">{t('dateLine', lang)}: ___/___/______</p>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase mb-6">{t('checkedBy', lang)}:</p>
          <div className="border-t border-black pt-1">
            <p className="text-[9px]">{t('signatureLine', lang)}: ___________________________</p>
            <p className="text-[9px] mt-2">{t('dateLine', lang)}: ___/___/______</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-3 border-t-2 border-gray-300 flex justify-between items-center">
        <p className="text-[8px] text-gray-500">{t('companyInfo', lang)}</p>
        <p className="text-[8px] text-gray-500">{t('page', lang)} 1/1</p>
      </div>
    </div>
  );
}

// ============ MY DELIVERIES VIEW (Chauffeur) ============
function MyDeliveriesView() {
  const { language, currentUser } = useAppStore();
  const lang = language;
  const [trucks, setTrucks] = useState<TruckVisit[]>([]);
  const [activeTruck, setActiveTruck] = useState<TruckVisit | null>(null);
  const [step, setStep] = useState(0); // 0=list, 1-6=wizard steps
  const [sigData, setSigData] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);

  // Step state
  const [stepData, setStepData] = useState({
    // Step 2: Pre-loading
    photoBefore: '',
    loadAreaInspected: false,
    // Step 3: Loading
    itemsLoaded: false,
    grossWeight: '',
    netWeight: '',
    loadingNotes: '',
    // Step 4: Securing
    loadSecured: false,
    photoDuring: '',
    // Step 5: Post-loading
    photoAfter: '',
  });
  const [uploading, setUploading] = useState(false);
  const [printTruck, setPrintTruck] = useState<TruckVisit | null>(null);

  const [, startTransitionDeliveries] = useTransition();
  const fetchTrucks = useCallback(async () => {
    const res = await fetch('/api/trucks');
    if (res.ok) { const data = await res.json(); startTransitionDeliveries(() => setTrucks(data)); }
  }, [startTransitionDeliveries]);

  useEffect(() => { fetchTrucks(); }, [fetchTrucks]);

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('photo', files[0]);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (res.ok) {
      const data = await res.json();
      setStepData(prev => ({ ...prev, [field]: data.url }));
      toast({ title: t('success', lang), description: files[0].name });
    } else {
      toast({ title: t('error', lang), variant: 'destructive' });
    }
    setUploading(false);
    e.target.value = '';
  };

  // Signature pad functions
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    ctx.beginPath(); ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    ctx.lineTo(x, y); ctx.stroke();
  };

  const stopDrawing = () => {
    setDrawing(false);
    if (canvasRef.current) setSigData(canvasRef.current.toDataURL());
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSigData('');
  };

  const confirmArrival = async (truck: TruckVisit) => {
    await fetch('/api/trucks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: truck.id, status: 'arrived', arrivedAt: new Date().toISOString() }) });
    toast({ title: t('success', lang), description: t('arrivalConfirmed', lang) });
    fetchTrucks();
    const fresh = await fetch('/api/trucks').then(r => r.json());
    const updated = fresh.find((t: TruckVisit) => t.id === truck.id);
    if (updated) setActiveTruck(updated);
  };

  const completeDelivery = async () => {
    if (!activeTruck) return;
    // Update truck with weight data and complete
    await fetch('/api/trucks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      id: activeTruck.id,
      status: 'completed',
      completedAt: new Date().toISOString(),
      grossWeight: stepData.grossWeight ? parseFloat(stepData.grossWeight) : null,
      netWeight: stepData.netWeight ? parseFloat(stepData.netWeight) : null,
    }) });
    toast({ title: t('success', lang), description: t('processComplete', lang) });
    fetchTrucks();
    setStep(6);
  };

  const myTrucks = trucks.filter(tv => currentUser && (tv.driverName?.includes(currentUser.name) || true));

  const stepLabels = [
    t('stepArrival', lang),
    t('stepPreLoading', lang),
    t('stepLoading', lang),
    t('stepSecuring', lang),
    t('stepPostLoading', lang),
    t('stepComplete', lang),
  ];

  const stepIcons = [
    <MapPin key="arrival" className="h-4 w-4" />,
    <Eye key="preloading" className="h-4 w-4" />,
    <Package key="loading" className="h-4 w-4" />,
    <Shield key="securing" className="h-4 w-4" />,
    <Camera key="postloading" className="h-4 w-4" />,
    <CheckCircle2 key="complete" className="h-4 w-4" />,
  ];

  const canAdvanceStep = () => {
    switch (step) {
      case 1: return true; // Arrival just needs confirmation
      case 2: return stepData.loadAreaInspected; // Pre-loading needs inspection checkbox
      case 3: return stepData.itemsLoaded; // Loading needs items confirmed
      case 4: return stepData.loadSecured; // Securing needs secured checkbox
      case 5: return !!sigData; // Post-loading needs signature
      default: return false;
    }
  };

  // If no active truck, show list view
  if (step === 0 || !activeTruck) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <h3 className="text-lg font-semibold">{t('myDeliveries', lang)}</h3>
        {myTrucks.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-slate-500">{t('noResults', lang)}</CardContent></Card>
        ) : myTrucks.map(tv => (
          <Card key={tv.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="font-semibold">{tv.driverName}</p>
                  <p className="text-sm text-slate-500">{tv.truckPlate} {tv.trailerPlate ? `→ ${tv.trailerPlate}` : ''}</p>
                  <p className="text-sm">{tv.cargoDescription || tv.purpose}</p>
                  {tv.dockNumber && <p className="text-sm text-blue-600 font-medium">{t('dockNumber', lang)}: {tv.dockNumber}</p>}
                  {tv.company && <p className="text-sm text-slate-500">{tv.company}</p>}
                </div>
                <Badge className={statusColors[tv.status] || 'bg-gray-100 text-gray-800'}>{statusLabel(tv.status, lang)}</Badge>
              </div>
              {tv.blReference && <p className="text-xs text-slate-400 mt-2">{t('blReference', lang)}: {tv.blReference}</p>}
              {tv.bookingRef && <p className="text-xs text-slate-400">{t('bookingRef', lang)}: {tv.bookingRef}</p>}

              <div className="flex gap-2 mt-4">
                {tv.status !== 'completed' && (
                  <Button size="sm" onClick={() => { setActiveTruck(tv); setStep(tv.status === 'expected' ? 1 : tv.status === 'arrived' ? 2 : tv.status === 'at_dock' ? 3 : tv.status === 'loading' ? 4 : 1); setStepData({ photoBefore: '', loadAreaInspected: false, itemsLoaded: false, grossWeight: '', netWeight: '', loadingNotes: '', loadSecured: false, photoDuring: '', photoAfter: '' }); setSigData(''); }} className="bg-amber-500 hover:bg-amber-600">
                    <ArrowRight className="h-4 w-4 mr-1" /> {t('details', lang)}
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setPrintTruck(tv)}>
                  <Download className="h-4 w-4 mr-1" /> {t('printLoadingOrder', lang)}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Print Dialog for Truck */}
        <Dialog open={!!printTruck} onOpenChange={() => setPrintTruck(null)}>
          <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{t('printLoadingOrder', lang)}</DialogTitle></DialogHeader>
            <DocumentPrintView doc={null} truck={printTruck} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setPrintTruck(null)}>{t('close', lang)}</Button>
              <Button onClick={() => window.print()} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                <Download className="h-4 w-4 mr-2" /> {t('printDocument', lang)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Wizard view
  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-2xl mx-auto">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => { setStep(0); setActiveTruck(null); }}>
          <ArrowLeft className="h-4 w-4 mr-1" /> {t('back', lang)}
        </Button>
        <h3 className="text-lg font-semibold">{t('myDeliveries', lang)}</h3>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-6">
        {stepLabels.map((label, i) => {
          const stepNum = i + 1;
          const isActive = step === stepNum;
          const isCompleted = step > stepNum;
          return (
            <div key={i} className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              }`}>
                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : stepIcons[i]}
              </div>
              <p className={`text-[10px] mt-1 text-center ${isActive ? 'font-bold text-amber-600' : isCompleted ? 'text-green-600' : 'text-slate-400'}`}>{label}</p>
              {i < stepLabels.length - 1 && (
                <div className={`hidden sm:block h-0.5 w-full absolute left-1/2 top-4 ${isCompleted ? 'bg-green-500' : 'bg-slate-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {/* Step 1: Arrival */}
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2"><MapPin className="h-5 w-5 text-amber-500" /> {t('stepArrival', lang)}</h4>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <p className="text-sm"><strong>{t('driverName', lang)}:</strong> {activeTruck.driverName}</p>
                <p className="text-sm"><strong>{t('truckPlate', lang)}:</strong> {activeTruck.truckPlate}</p>
                <p className="text-sm"><strong>{t('company', lang)}:</strong> {activeTruck.company}</p>
                <p className="text-sm"><strong>{t('purpose', lang)}:</strong> {activeTruck.purpose}</p>
                <p className="text-sm"><strong>{t('cargoDescription', lang)}:</strong> {activeTruck.cargoDescription || '—'}</p>
                {activeTruck.dockNumber && <p className="text-sm text-blue-600 font-medium"><strong>{t('dockNumber', lang)}:</strong> {activeTruck.dockNumber}</p>}
                {activeTruck.expectedArrival && <p className="text-sm"><strong>{t('expectedArrival', lang)}:</strong> {formatDate(activeTruck.expectedArrival)}</p>}
              </div>
              {activeTruck.status === 'expected' ? (
                <Button onClick={() => confirmArrival(activeTruck)} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                  <MapPin className="h-4 w-4 mr-2" /> {t('confirmArrival', lang)}
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-green-600 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle2 className="h-5 w-5" /> <span className="font-medium">{t('arrivalConfirmed', lang)}</span>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Pre-loading Inspection */}
          {step === 2 && (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2"><Eye className="h-5 w-5 text-amber-500" /> {t('stepPreLoading', lang)}</h4>
              
              {/* Photo BEFORE loading */}
              <div>
                <Label className="flex items-center gap-2 mb-2"><Camera className="h-4 w-4" /> {t('photoBeforeLoading', lang)}</Label>
                {!stepData.photoBefore ? (
                  <label className="cursor-pointer flex items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors">
                    <Camera className="h-8 w-8 text-slate-400" />
                    <span className="text-sm text-slate-500">{uploading ? t('loading', lang) + '...' : t('takePhoto', lang)}</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={(e) => handlePhotoCapture(e, 'photoBefore')} disabled={uploading} />
                  </label>
                ) : (
                  <div className="relative">
                    <img src={stepData.photoBefore} alt="Before loading" className="w-full h-48 object-cover rounded-lg border" />
                    <button onClick={() => setStepData(p => ({ ...p, photoBefore: '' }))} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"><X className="h-3 w-3" /></button>
                  </div>
                )}
              </div>

              {/* Inspection checkbox */}
              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <Checkbox id="load-inspected" checked={stepData.loadAreaInspected} onCheckedChange={(v) => setStepData(p => ({ ...p, loadAreaInspected: !!v }))} />
                <label htmlFor="load-inspected" className="text-sm font-medium leading-tight cursor-pointer">{t('loadAreaInspected', lang)}</label>
              </div>
            </div>
          )}

          {/* Step 3: Loading */}
          {step === 3 && (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2"><Package className="h-5 w-5 text-amber-500" /> {t('stepLoading', lang)}</h4>
              
              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <Checkbox id="items-loaded" checked={stepData.itemsLoaded} onCheckedChange={(v) => setStepData(p => ({ ...p, itemsLoaded: !!v }))} />
                <label htmlFor="items-loaded" className="text-sm font-medium leading-tight cursor-pointer">{t('confirmItemsLoaded', lang)}</label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t('grossWeightKg', lang)}</Label><Input type="number" placeholder="0" value={stepData.grossWeight} onChange={(e) => setStepData(p => ({ ...p, grossWeight: e.target.value }))} /></div>
                <div><Label>{t('netWeightKg', lang)}</Label><Input type="number" placeholder="0" value={stepData.netWeight} onChange={(e) => setStepData(p => ({ ...p, netWeight: e.target.value }))} /></div>
              </div>
              <div><Label>{t('notes', lang)}</Label><Textarea placeholder={t('loadingNotes', lang) || 'Loading notes...'} value={stepData.loadingNotes} onChange={(e) => setStepData(p => ({ ...p, loadingNotes: e.target.value }))} rows={3} /></div>
            </div>
          )}

          {/* Step 4: Securing */}
          {step === 4 && (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2"><Shield className="h-5 w-5 text-amber-500" /> {t('stepSecuring', lang)}</h4>
              
              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <Checkbox id="load-secured" checked={stepData.loadSecured} onCheckedChange={(v) => setStepData(p => ({ ...p, loadSecured: !!v }))} />
                <label htmlFor="load-secured" className="text-sm font-medium leading-tight cursor-pointer">{t('loadSecuredStraps', lang)}</label>
              </div>

              {/* Photo DURING loading */}
              <div>
                <Label className="flex items-center gap-2 mb-2"><Camera className="h-4 w-4" /> {t('photoDuringLoading', lang)}</Label>
                {!stepData.photoDuring ? (
                  <label className="cursor-pointer flex items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors">
                    <Camera className="h-8 w-8 text-slate-400" />
                    <span className="text-sm text-slate-500">{uploading ? t('loading', lang) + '...' : t('takePhoto', lang)}</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={(e) => handlePhotoCapture(e, 'photoDuring')} disabled={uploading} />
                  </label>
                ) : (
                  <div className="relative">
                    <img src={stepData.photoDuring} alt="During loading" className="w-full h-48 object-cover rounded-lg border" />
                    <button onClick={() => setStepData(p => ({ ...p, photoDuring: '' }))} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"><X className="h-3 w-3" /></button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Post-loading */}
          {step === 5 && (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2"><Camera className="h-5 w-5 text-amber-500" /> {t('stepPostLoading', lang)}</h4>
              
              {/* Photo AFTER loading */}
              <div>
                <Label className="flex items-center gap-2 mb-2"><Camera className="h-4 w-4" /> {t('photoAfterLoading', lang)}</Label>
                {!stepData.photoAfter ? (
                  <label className="cursor-pointer flex items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors">
                    <Camera className="h-8 w-8 text-slate-400" />
                    <span className="text-sm text-slate-500">{uploading ? t('loading', lang) + '...' : t('takePhoto', lang)}</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={(e) => handlePhotoCapture(e, 'photoAfter')} disabled={uploading} />
                  </label>
                ) : (
                  <div className="relative">
                    <img src={stepData.photoAfter} alt="After loading" className="w-full h-48 object-cover rounded-lg border" />
                    <button onClick={() => setStepData(p => ({ ...p, photoAfter: '' }))} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"><X className="h-3 w-3" /></button>
                  </div>
                )}
              </div>

              {/* Final confirmation + Signature */}
              <div className="p-4 rounded-lg border bg-amber-50 dark:bg-amber-900/20">
                <p className="font-medium text-sm mb-3">{t('finalConfirmation', lang)}</p>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <p>✓ {t('loadAreaInspected', lang)}</p>
                  <p>✓ {t('confirmItemsLoaded', lang)}</p>
                  <p>✓ {t('loadSecuredStraps', lang)}</p>
                </div>
              </div>

              {/* Signature Pad */}
              <div>
                <Label className="mb-2 block">{t('signatureRequired', lang)}</Label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-2 bg-white">
                  <canvas ref={canvasRef} width={400} height={120} className="w-full touch-none cursor-crosshair"
                    onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
                </div>
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-muted-foreground">{t('pleaseSign', lang)}</p>
                  <Button variant="ghost" size="sm" onClick={clearSignature} className="text-xs h-6">{t('clearSignature', lang)}</Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Complete */}
          {step === 6 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-lg">{t('processComplete', lang)}</h4>
              
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-left space-y-2">
                <h5 className="font-medium text-sm">{t('loadingSummary', lang)}</h5>
                <p className="text-sm"><strong>{t('driverName', lang)}:</strong> {activeTruck.driverName}</p>
                <p className="text-sm"><strong>{t('truckPlate', lang)}:</strong> {activeTruck.truckPlate}</p>
                {stepData.grossWeight && <p className="text-sm"><strong>{t('grossWeightKg', lang)}:</strong> {parseFloat(stepData.grossWeight).toLocaleString()}</p>}
                {stepData.netWeight && <p className="text-sm"><strong>{t('netWeightKg', lang)}:</strong> {parseFloat(stepData.netWeight).toLocaleString()}</p>}
              </div>

              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => { setStep(0); setActiveTruck(null); }}>{t('close', lang)}</Button>
                <Button onClick={() => window.print()} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                  <Download className="h-4 w-4 mr-2" /> {t('printLoadingOrder', lang)}
                </Button>
              </div>

              {/* Hidden print view */}
              <div className="hidden">
                <DocumentPrintView doc={null} truck={activeTruck} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      {step < 6 && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => { if (step === 1) { setStep(0); setActiveTruck(null); } else setStep(step - 1); }} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4 mr-1" /> {t('back', lang)}
          </Button>
          {step < 5 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canAdvanceStep()} className="bg-amber-500 hover:bg-amber-600 text-white">
              {t('next', lang)} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : step === 5 ? (
            <Button onClick={completeDelivery} disabled={!canAdvanceStep()} className="bg-green-500 hover:bg-green-600 text-white">
              <CheckCircle2 className="h-4 w-4 mr-1" /> {t('confirmDelivery', lang)}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ============ MAIN APP ============
function MainApp() {
  const { currentView, language } = useAppStore();
  const lang = language;

  const viewMap: Record<AppView, React.ReactNode> = {
    dashboard: <Dashboard />,
    shifts: <ShiftManagement />,
    cargo: <CargoOperations />,
    documents: <DocumentManagement />,
    safety: <SafetyChecklists />,
    trucks: <TruckVisits />,
    warehouses: <WarehouseView />,
    notifications: <NotificationsView />,
    reports: <ReportsView />,
    admin: <AdminPanel />,
    settings: <SettingsView />,
    'my-deliveries': <MyDeliveriesView />,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <SidebarNav />
      <div className="lg:ml-72">
        <TopBar />
        <main className="pb-8">
          {viewMap[currentView]}
        </main>
      </div>
    </div>
  );
}

// ============ PAGE EXPORT ============
export default function Page() {
  const { currentUser } = useAppStore();

  return (
    <>
      {currentUser ? <MainApp /> : <LoginScreen />}
      <Toaster />
    </>
  );
}
