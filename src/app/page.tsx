'use client';

import React, { useEffect, useState, useRef, useTransition, useCallback } from 'react';
import { useAppStore, UserRole, AppView } from '@/lib/store';
import { signIn } from 'next-auth/react';
import {
  Ship, Truck, FileText, Shield, Clock, Warehouse, Bell, BarChart3,
  LogOut, Menu, X, ChevronRight, Package, CheckCircle2, AlertTriangle,
  AlertCircle, Info, Plus, Timer, MapPin, User, Phone, BadgeCheck,
  ClipboardList, ArrowRight, ArrowLeft, Eye, Edit, SignPlus,
  Anchor, Container, Box, CircleDot, Search, Filter, Download,
  Upload, Camera, Signature, CheckCheck, XCircle, MoreVertical,
  Play, Pause, Square, CalendarDays, Route as RouteIcon, HardHat
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
interface Document { id: string; docType: string; reference: string; status: string; cargoOpId: string | null; truckVisitId: string | null; content: string | null; notes: string | null; createdAt: string; signatures?: any[]; }
interface SafetyChecklist { id: string; userId: string; checkType: string; status: string; location: string | null; notes: string | null; createdAt: string; user?: any; items?: SafetyCheckItem[]; }
interface SafetyCheckItem { id: string; checklistId: string; category: string; question: string; passed: boolean | null; notes: string | null; orderIndex: number; }
interface TruckVisit { id: string; driverName: string; driverLicense: string | null; company: string | null; truckPlate: string; trailerPlate: string | null; purpose: string; status: string; dockNumber: string | null; expectedArrival: string | null; arrivedAt: string | null; dockAssignedAt: string | null; completedAt: string | null; cargoDescription: string | null; blReference: string | null; bookingRef: string | null; notes: string | null; documents?: Document[]; }
interface Warehouse { id: string; name: string; code: string; location: string | null; type: string; capacity: number | null; area: number | null; storageLocations?: any[]; }
interface Notification { id: string; type: string; title: string; message: string; read: boolean; category: string | null; createdAt: string; }
interface Stats { activeShifts: number; pendingCargo: number; inProgressCargo: number; completedCargo: number; expectedTrucks: number; atDockTrucks: number; pendingDocs: number; activeSafetyChecks: number; unreadNotifications: number; totalWorkers: number; totalChauffeurs: number; warehouses: any[]; }

// ============ HELPER FUNCTIONS ============
const formatDate = (d: string | null) => d ? new Date(d).toLocaleString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
const formatTime = (d: string | null) => d ? new Date(d).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' }) : '-';
const timeSince = (d: string) => { const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000); if (s < 60) return `${s}s`; if (s < 3600) return `${Math.floor(s/60)}m`; if (s < 86400) return `${Math.floor(s/3600)}h`; return `${Math.floor(s/86400)}d`; };

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
  const { setCurrentUser, setCurrentRole, seeded, setSeeded } = useAppStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const fetchUsers = useCallback(async () => {
    const res = await fetch('/api/users');
    if (res.ok) { const data = await res.json(); setUsers(data); if (data.length > 0) setSeeded(true); }
  }, [setSeeded]);

  const [, startTransitionLogin] = useTransition();
  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(data => {
      startTransitionLogin(() => { setUsers(data); if (data.length > 0) setSeeded(true); });
    });
  }, [startTransitionLogin, setSeeded]);

  const seedDb = async () => {
    setSeedLoading(true);
    const res = await fetch('/api/setup', { method: 'POST' });
    if (res.ok) { setSeeded(true); await fetchUsers(); toast({ title: 'Database seeded', description: 'Demo data loaded successfully' }); }
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
      if (usersRes.ok) {
        const allUsers = await usersRes.json();
        const user = allUsers.find((u: any) => u.email === email);
        if (user) {
          setCurrentUser(user);
          setCurrentRole(user.role as UserRole);
        } else {
          setLoginError('User not found');
        }
      }
    } else {
      setLoginError('Invalid email or password');
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
          <h1 className="text-3xl font-bold text-white">Steinweg Dock</h1>
          <p className="text-slate-400 mt-2">C. Steinweg Belgium N.V. — Port of Antwerp</p>
          <p className="text-slate-500 text-sm mt-1">Digital Dock Management System</p>
        </div>

        {!seeded ? (
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader className="text-center">
              <CardTitle className="text-white">Welcome</CardTitle>
              <CardDescription className="text-slate-400">Load demo data to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={seedDb} disabled={seedLoading} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white h-12 text-lg">
                {seedLoading ? 'Loading...' : '🚀 Load Demo Data & Start'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader className="text-center">
              <CardTitle className="text-white">Sign In</CardTitle>
              <CardDescription className="text-slate-400">
                {showEmailLogin ? 'Enter your credentials' : 'Choose your profile to continue'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {showEmailLogin ? (
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Email</Label>
                    <Input type="email" placeholder="worker1@steinweg.be" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-slate-700 border-slate-600 text-white" required />
                  </div>
                  <div>
                    <Label className="text-slate-300">Password</Label>
                    <Input type="password" placeholder="••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-slate-700 border-slate-600 text-white" required />
                  </div>
                  {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
                  <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                  <button type="button" onClick={() => setShowEmailLogin(false)} className="w-full text-center text-slate-400 hover:text-amber-400 text-sm">
                    ← Back to profiles
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
                        <p className="text-slate-400 text-sm">{user.badge} — {user.role === 'dock_worker' ? 'Dock Worker' : user.role === 'chauffeur' ? 'Chauffeur' : 'Admin'}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-amber-500 transition-colors" />
                    </button>
                  ))}
                  <Separator className="bg-slate-600" />
                  <button onClick={() => setShowEmailLogin(true)} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-600 text-slate-400 hover:text-white hover:border-amber-500/50 transition-all text-sm">
                    <User className="h-4 w-4" /> Sign in with email & password
                  </button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: <Shield className="h-5 w-5" />, label: 'Safety First' },
            { icon: <FileText className="h-5 w-5" />, label: 'Paperless' },
            { icon: <Clock className="h-5 w-5" />, label: 'Real-time' },
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
  const { currentRole, currentView, setCurrentView, currentUser, logout, sidebarOpen, setSidebarOpen } = useAppStore();

  const workerNav: { view: AppView; icon: React.ReactNode; label: string }[] = [
    { view: 'dashboard', icon: <BarChart3 className="h-5 w-5" />, label: 'Dashboard' },
    { view: 'shifts', icon: <Clock className="h-5 w-5" />, label: 'My Shift' },
    { view: 'cargo', icon: <Ship className="h-5 w-5" />, label: 'Cargo Ops' },
    { view: 'documents', icon: <FileText className="h-5 w-5" />, label: 'Documents' },
    { view: 'safety', icon: <Shield className="h-5 w-5" />, label: 'Safety' },
    { view: 'warehouses', icon: <Warehouse className="h-5 w-5" />, label: 'Warehouses' },
    { view: 'notifications', icon: <Bell className="h-5 w-5" />, label: 'Alerts' },
  ];

  const chauffeurNav: { view: AppView; icon: React.ReactNode; label: string }[] = [
    { view: 'dashboard', icon: <BarChart3 className="h-5 w-5" />, label: 'Dashboard' },
    { view: 'trucks', icon: <Truck className="h-5 w-5" />, label: 'My Visits' },
    { view: 'documents', icon: <FileText className="h-5 w-5" />, label: 'Documents' },
    { view: 'notifications', icon: <Bell className="h-5 w-5" />, label: 'Alerts' },
  ];

  const adminNav: { view: AppView; icon: React.ReactNode; label: string }[] = [
    { view: 'dashboard', icon: <BarChart3 className="h-5 w-5" />, label: 'Dashboard' },
    { view: 'shifts', icon: <Clock className="h-5 w-5" />, label: 'Shifts' },
    { view: 'cargo', icon: <Ship className="h-5 w-5" />, label: 'Cargo Ops' },
    { view: 'documents', icon: <FileText className="h-5 w-5" />, label: 'Documents' },
    { view: 'safety', icon: <Shield className="h-5 w-5" />, label: 'Safety' },
    { view: 'trucks', icon: <Truck className="h-5 w-5" />, label: 'Trucks' },
    { view: 'warehouses', icon: <Warehouse className="h-5 w-5" />, label: 'Warehouses' },
    { view: 'notifications', icon: <Bell className="h-5 w-5" />, label: 'Alerts' },
    { view: 'reports', icon: <BarChart3 className="h-5 w-5" />, label: 'Reports' },
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
            <h2 className="text-white font-bold text-sm">Steinweg Dock</h2>
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
                {currentRole === 'dock_worker' ? 'Dock Worker' : currentRole === 'chauffeur' ? 'Chauffeur' : 'Admin'}
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

        <div className="p-4 border-t border-slate-700">
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
            <LogOut className="h-5 w-5" /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

// ============ TOP BAR ============
function TopBar() {
  const { currentView, setSidebarOpen } = useAppStore();
  const viewTitles: Record<AppView, string> = {
    dashboard: 'Dashboard', shifts: 'Shift Management', cargo: 'Cargo Operations',
    documents: 'Documents', safety: 'Safety Checklists', trucks: 'Truck Visits',
    warehouses: 'Warehouses', notifications: 'Notifications', reports: 'Reports & Analytics',
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
          <DialogTitle>Notifications</DialogTitle>
          <DialogDescription>Recent alerts and updates</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-80">
          {notifs.length === 0 ? <p className="text-center text-muted-foreground py-8">No notifications</p> :
            notifs.map(n => (
              <div key={n.id} className={`flex gap-3 p-3 rounded-lg mb-2 ${n.read ? 'opacity-60' : 'bg-slate-50 dark:bg-slate-800'}`}>
                <div className="mt-0.5">{notifIcons[n.type] || <Info className="h-4 w-4" />}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{timeSince(n.createdAt)} ago</p>
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
  const { currentRole } = useAppStore();
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
    { label: 'My Visits', value: trucks.filter(t => t.status !== 'completed').length, icon: <Truck className="h-6 w-6" />, color: 'from-blue-500 to-cyan-500' },
    { label: 'Pending Docs', value: stats.pendingDocs, icon: <FileText className="h-6 w-6" />, color: 'from-amber-500 to-orange-500' },
    { label: 'At Dock', value: stats.atDockTrucks, icon: <MapPin className="h-6 w-6" />, color: 'from-green-500 to-emerald-500' },
    { label: 'Alerts', value: stats.unreadNotifications, icon: <Bell className="h-6 w-6" />, color: 'from-red-500 to-pink-500' },
  ] : [
    { label: 'Active Shifts', value: stats.activeShifts, icon: <Clock className="h-6 w-6" />, color: 'from-green-500 to-emerald-500' },
    { label: 'Cargo In Progress', value: stats.inProgressCargo, icon: <Ship className="h-6 w-6" />, color: 'from-blue-500 to-cyan-500' },
    { label: 'Trucks at Dock', value: stats.atDockTrucks, icon: <Truck className="h-6 w-6" />, color: 'from-amber-500 to-orange-500' },
    { label: 'Pending Docs', value: stats.pendingDocs, icon: <FileText className="h-6 w-6" />, color: 'from-purple-500 to-violet-500' },
    { label: 'Safety Checks', value: stats.activeSafetyChecks, icon: <Shield className="h-6 w-6" />, color: 'from-red-500 to-pink-500' },
    { label: 'Alerts', value: stats.unreadNotifications, icon: <Bell className="h-6 w-6" />, color: 'from-slate-500 to-slate-600' },
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
            <CardTitle className="text-lg flex items-center gap-2"><Ship className="h-5 w-5 text-blue-500" /> Active Cargo Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentCargo.length === 0 ? <p className="text-muted-foreground text-sm py-4">No active operations</p> :
              recentCargo.slice(0, 3).map(op => (
                <div key={op.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="mt-1 text-blue-500">{cargoTypeIcons[op.cargoType || ''] || <Package className="h-4 w-4" />}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{op.vesselName}</p>
                    <p className="text-xs text-muted-foreground">{op.operationType} — Berth {op.berthNumber}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={statusColors[op.status] || ''} variant="outline">{op.status.replace('_', ' ')}</Badge>
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
            <CardTitle className="text-lg flex items-center gap-2"><Truck className="h-5 w-5 text-amber-500" /> Today&apos;s Truck Visits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {trucks.length === 0 ? <p className="text-muted-foreground text-sm py-4">No truck visits today</p> :
              trucks.slice(0, 4).map(tv => (
                <div key={tv.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{tv.driverName}</p>
                    <p className="text-xs text-muted-foreground">{tv.truckPlate} — {tv.company}</p>
                  </div>
                  <Badge className={statusColors[tv.status] || ''} variant="outline">{tv.status.replace('_', ' ')}</Badge>
                </div>
              ))
            }
          </CardContent>
        </Card>

        {/* Warehouse Overview */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2"><Warehouse className="h-5 w-5 text-emerald-500" /> Warehouse Occupancy</CardTitle>
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
                        <span>{wh.occupiedSlots}/{wh.totalSlots} slots</span>
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
  const { currentUser } = useAppStore();
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
    if (res.ok) { toast({ title: 'Checked In', description: `Shift started at ${newShift.location}` }); setCheckInDialog(false); loadShifts(); }
  };

  const checkOut = async () => {
    if (!activeShift) return;
    const res = await fetch('/api/shifts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: activeShift.id, status: 'ended', checkOut: new Date().toISOString() }),
    });
    if (res.ok) { toast({ title: 'Checked Out', description: 'Shift ended' }); loadShifts(); }
  };

  const startBreak = async () => {
    if (!activeShift) return;
    const res = await fetch('/api/shifts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: activeShift.id, status: 'break' }) });
    if (res.ok) { toast({ title: 'Break Started' }); loadShifts(); }
  };

  const endBreak = async () => {
    if (!activeShift) return;
    const res = await fetch('/api/shifts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: activeShift.id, status: 'active' }) });
    if (res.ok) { toast({ title: 'Break Ended' }); loadShifts(); }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Active Shift Card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        {activeShift ? (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Active Shift</p>
                <p className="text-2xl font-bold mt-1">{activeShift.type === 'day' ? 'Day' : 'Night'} Shift</p>
                <div className="flex items-center gap-4 mt-2 text-green-100 text-sm">
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {formatTime(activeShift.checkIn)}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {activeShift.location || 'Not assigned'}</span>
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
                <Square className="h-4 w-4 mr-2" /> Check Out
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-slate-600 to-slate-700 p-6 text-white text-center">
            <Timer className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-semibold">No Active Shift</p>
            <p className="text-slate-300 text-sm mt-1">Check in to start your shift</p>
            <Dialog open={checkInDialog} onOpenChange={setCheckInDialog}>
              <DialogTrigger asChild>
                <Button className="mt-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
                  <Clock className="h-4 w-4 mr-2" /> Check In
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Check In for Shift</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Shift Type</Label>
                    <Select value={newShift.type} onValueChange={(v) => setNewShift(p => ({ ...p, type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="day">Day Shift (06:00-14:00)</SelectItem><SelectItem value="night">Night Shift (14:00-22:00)</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>Location / Dock</Label>
                    <Input placeholder="e.g. Quai 125, Berth 127" value={newShift.location} onChange={(e) => setNewShift(p => ({ ...p, location: e.target.value }))} />
                  </div>
                </div>
                <DialogFooter><Button onClick={checkIn} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">Start Shift</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </Card>

      {/* Shift History */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Recent Shifts</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {shifts.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className={`w-2 h-2 rounded-full ${s.status === 'active' ? 'bg-green-500' : s.status === 'break' ? 'bg-purple-500' : 'bg-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{s.user?.name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{s.type} shift — {s.location || 'No location'}</p>
                </div>
                <div className="text-right">
                  <Badge className={statusColors[s.status] || ''} variant="outline">{s.status}</Badge>
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
  const [operations, setOperations] = useState<CargoOperation[]>([]);
  const [filter, setFilter] = useState('all');
  const [selectedOp, setSelectedOp] = useState<CargoOperation | null>(null);
  const [newOpDialog, setNewOpDialog] = useState(false);
  const { currentUser } = useAppStore();
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
    toast({ title: 'Cargo Operation Created' });
    loadOps();
  };

  const updateStatus = async (id: string, status: string) => {
    const data: any = { id, status };
    if (status === 'in_progress') data.startedAt = new Date().toISOString();
    if (status === 'completed') data.completedAt = new Date().toISOString();
    await fetch('/api/cargo', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    toast({ title: `Status updated to ${status}` });
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
            {f === 'all' ? 'All' : f.replace('_', ' ')}
          </Button>
        ))}
        <div className="flex-1" />
        <Button onClick={() => setNewOpDialog(true)} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
          <Plus className="h-4 w-4 mr-2" /> New Operation
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
              <Button variant="ghost" size="sm" onClick={() => setSelectedOp(null)}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Voyage', value: selectedOp.voyageNumber },
                { label: 'Berth', value: selectedOp.berthNumber },
                { label: 'Reference', value: selectedOp.reference },
                { label: 'Weight', value: selectedOp.weight ? `${selectedOp.weight.toLocaleString()} kg` : '-' },
              ].map((d, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-muted-foreground">{d.label}</p>
                  <p className="font-semibold text-sm mt-0.5">{d.value || '-'}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              {selectedOp.status === 'pending' && <Button onClick={() => updateStatus(selectedOp.id, 'in_progress')} className="bg-blue-500 text-white"><Play className="h-4 w-4 mr-2" />Start</Button>}
              {selectedOp.status === 'in_progress' && <Button onClick={() => updateStatus(selectedOp.id, 'completed')} className="bg-green-500 text-white"><CheckCircle2 className="h-4 w-4 mr-2" />Complete</Button>}
            </div>

            {/* Cargo Items / Tally */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Cargo Tally ({selectedOp.items?.length || 0} items)</h3>
              <div className="space-y-2">
                {selectedOp.items?.map(item => (
                  <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border ${item.checked ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-white dark:bg-slate-800'}`}>
                    <Checkbox checked={item.checked} onCheckedChange={() => toggleItemCheck(item)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.markOrNumber} — {item.itemType}</p>
                      <p className="text-xs text-muted-foreground">{item.description} — Qty: {item.quantity}{item.weight ? ` / ${item.weight.toLocaleString()} kg` : ''}</p>
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
                      <h3 className="font-semibold truncate">{op.vesselName || 'No vessel'}</h3>
                      <Badge className={statusColors[op.status] || ''} variant="outline">{op.status.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{op.operationType} — {op.cargoType} — Berth {op.berthNumber || '-'}</p>
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
          <DialogHeader><DialogTitle>New Cargo Operation</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Operation Type</Label>
              <Select value={newOp.operationType} onValueChange={(v) => setNewOp(p => ({ ...p, operationType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unloading">Unloading</SelectItem><SelectItem value="loading">Loading</SelectItem>
                  <SelectItem value="tally">Tally Check</SelectItem><SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Vessel Name</Label><Input placeholder="e.g. MV ATLANTIC STAR" value={newOp.vesselName} onChange={(e) => setNewOp(p => ({ ...p, vesselName: e.target.value }))} /></div>
            <div><Label>Berth Number</Label><Input placeholder="e.g. 125" value={newOp.berthNumber} onChange={(e) => setNewOp(p => ({ ...p, berthNumber: e.target.value }))} /></div>
            <div><Label>Cargo Type</Label>
              <Select value={newOp.cargoType} onValueChange={(v) => setNewOp(p => ({ ...p, cargoType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakbulk">Breakbulk</SelectItem><SelectItem value="container">Container</SelectItem>
                  <SelectItem value="roro">RoRo</SelectItem><SelectItem value="bulk">Bulk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><Textarea placeholder="Cargo description..." value={newOp.description} onChange={(e) => setNewOp(p => ({ ...p, description: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={createOp} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">Create Operation</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ DOCUMENTS ============
function DocumentManagement() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filter, setFilter] = useState('all');
  const [newDocDialog, setNewDocDialog] = useState(false);
  const [newDoc, setNewDoc] = useState({ docType: 'bill_of_lading', reference: '', notes: '' });
  const [viewDoc, setViewDoc] = useState<Document | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

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
    const docData: any = { ...newDoc, status: 'draft' };
    if (photos.length > 0) docData.photos = JSON.stringify(photos);
    await fetch('/api/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(docData) });
    setNewDocDialog(false);
    setPhotos([]);
    toast({ title: 'Document Created' });
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
        toast({ title: 'Photo added', description: file.name });
      } else {
        toast({ title: 'Upload failed', description: file.name, variant: 'destructive' });
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
    toast({ title: 'Document Signed', description: 'Digital signature applied' });
    loadDocs();
  };

  const docTypeLabels: Record<string, string> = {
    bill_of_lading: 'Bill of Lading', delivery_note: 'Delivery Note', damage_report: 'Damage Report',
    customs: 'Customs Declaration', packing_list: 'Packing List', weigh_bridge: 'Weigh Bridge Ticket',
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
            {f === 'all' ? 'All' : f.replace('_', ' ')}
          </Button>
        ))}
        <div className="flex-1" />
        <Button onClick={() => setNewDocDialog(true)} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
          <Plus className="h-4 w-4 mr-2" /> New Document
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
                    <Badge className={statusColors[doc.status] || ''} variant="outline">{doc.status.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Ref: {doc.reference}</p>
                  {doc.content && (() => { try { const p = JSON.parse(doc.content); return <p className="text-xs text-muted-foreground mt-1 truncate max-w-lg">{Object.entries(p).slice(0,3).map(([k,v]) => `${k}: ${v}`).join(' · ')}</p>; } catch { return <p className="text-xs text-muted-foreground mt-1 truncate max-w-lg">{doc.content}</p>; } })()}
                  {doc.signatures && doc.signatures.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Signature className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">{doc.signatures.length} signature(s)</span>
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">{formatDate(doc.createdAt)}</p>
                  {doc.status !== 'signed' && doc.status !== 'archived' && (
                    <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={(e) => { e.stopPropagation(); signDoc(doc.id); }}>
                      <Signature className="h-3 w-3 mr-1" /> Sign
                    </Button>
                  )}
                </div>
              </div>
              {/* Expanded view */}
              {viewDoc?.id === doc.id && doc.content && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium text-sm mb-2">Document Details</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(() => { try { const parsed = JSON.parse(doc.content); return Object.entries(parsed).map(([k, v]) => (
                      <div key={k} className="p-2 rounded bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-xs text-muted-foreground">{k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</p>
                        <p className="text-sm font-medium">{String(v)}</p>
                      </div>
                    )); } catch { return <p className="col-span-2 text-sm text-muted-foreground">{doc.content}</p>; } })()}
                  </div>
                  {doc.notes && <p className="text-sm text-muted-foreground mt-3 italic">Notes: {doc.notes}</p>}
                  {/* Display attached photos */}
                  {doc.photos && (() => { try { const photoUrls: string[] = JSON.parse(doc.photos); return photoUrls.length > 0 ? (
                    <div className="mt-3">
                      <h5 className="text-xs font-medium text-muted-foreground mb-2">Attached Photos</h5>
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
        <DialogContent>
          <DialogHeader><DialogTitle>Create Document</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Document Type</Label>
              <Select value={newDoc.docType} onValueChange={(v) => setNewDoc(p => ({ ...p, docType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(docTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Reference Number</Label><Input placeholder="e.g. BL-ANT-2026-5521" value={newDoc.reference} onChange={(e) => setNewDoc(p => ({ ...p, reference: e.target.value }))} /></div>
            <div><Label>Notes</Label><Textarea placeholder="Additional notes..." value={newDoc.notes} onChange={(e) => setNewDoc(p => ({ ...p, notes: e.target.value }))} /></div>
            
            {/* Photo Capture Section */}
            <div>
              <Label className="flex items-center gap-2"><Camera className="h-4 w-4" /> Attach Photos</Label>
              <div className="mt-2 flex items-center gap-3">
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Take Photo / Upload'}</span>
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
          <DialogFooter><Button onClick={createDoc} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">Create Document</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ SAFETY CHECKLISTS ============
function SafetyChecklists() {
  const [checklists, setChecklists] = useState<SafetyChecklist[]>([]);
  const [selectedCl, setSelectedCl] = useState<SafetyChecklist | null>(null);
  const [newClDialog, setNewClDialog] = useState(false);
  const [newCl, setNewCl] = useState({ checkType: 'pre_shift', location: '' });
  const { currentUser } = useAppStore();

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
    const items = getChecklistTemplate(newCl.checkType);
    await fetch('/api/safety', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.id, checkType: newCl.checkType, location: newCl.location, status: 'pending', items }) });
    setNewClDialog(false);
    toast({ title: 'Safety Checklist Created' });
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
    toast({ title: anyFailed ? 'Checklist Failed — Issues Found' : 'Checklist Completed — All Clear', variant: anyFailed ? 'destructive' : 'default' });
    loadChecklists();
    setSelectedCl(null);
  };

  const clTypeLabels: Record<string, string> = {
    pre_shift: 'Pre-Shift Check', dock_safety: 'Dock Safety', equipment: 'Equipment Check',
    hazardous_cargo: 'Hazardous Cargo', crane_lift: 'Crane/Lift Safety',
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Safety Checklists</h2>
        <Dialog open={newClDialog} onOpenChange={setNewClDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-red-500 to-pink-600 text-white">
              <Plus className="h-4 w-4 mr-2" /> New Checklist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Start Safety Checklist</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Check Type</Label>
                <Select value={newCl.checkType} onValueChange={(v) => setNewCl(p => ({ ...p, checkType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(clTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Location</Label><Input placeholder="e.g. Quai 125" value={newCl.location} onChange={(e) => setNewCl(p => ({ ...p, location: e.target.value }))} /></div>
            </div>
            <DialogFooter><Button onClick={createChecklist} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">Start Check</Button></DialogFooter>
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
              <Button variant="ghost" size="sm" onClick={() => setSelectedCl(null)}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
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
                <CheckCheck className="h-4 w-4 mr-2" /> Submit Checklist
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
                        <Badge className={statusColors[cl.status] || ''} variant="outline">{cl.status}</Badge>
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

function getChecklistTemplate(type: string): { category: string; question: string }[] {
  const templates: Record<string, { category: string; question: string }[]> = {
    pre_shift: [
      { category: 'Personal Protective Equipment', question: 'Hard hat worn and in good condition?' },
      { category: 'Personal Protective Equipment', question: 'Safety boots worn?' },
      { category: 'Personal Protective Equipment', question: 'High-visibility vest worn?' },
      { category: 'Personal Protective Equipment', question: 'Safety glasses available?' },
      { category: 'Personal Protective Equipment', question: 'Hearing protection available?' },
      { category: 'Equipment', question: 'Crane pre-use inspection completed?' },
      { category: 'Equipment', question: 'Slings and chains inspected?' },
      { category: 'Equipment', question: 'Forklift daily check done?' },
      { category: 'Work Area', question: 'Dock area clear of obstructions?' },
      { category: 'Work Area', question: 'Warning signs and barriers in place?' },
      { category: 'Work Area', question: 'Adequate lighting for operations?' },
      { category: 'Emergency', question: 'Fire extinguishers accessible?' },
      { category: 'Emergency', question: 'Emergency exits clear?' },
      { category: 'Emergency', question: 'First aid kit available and stocked?' },
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
      { category: 'Emergency', question: 'Emergency procedures posted and understood?' },
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
  const { currentRole, currentUser } = useAppStore();
  const [trucks, setTrucks] = useState<TruckVisit[]>([]);
  const [newTruckDialog, setNewTruckDialog] = useState(false);
  const [newTruck, setNewTruck] = useState({ driverName: '', truckPlate: '', trailerPlate: '', company: '', purpose: 'delivery', cargoDescription: '', bookingRef: '' });

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
    await fetch('/api/trucks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newTruck, status: 'expected', expectedArrival: new Date(Date.now() + 3600000).toISOString() }) });
    setNewTruckDialog(false);
    toast({ title: 'Truck Visit Registered' });
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
    toast({ title: `Status: ${nextStatus.replace('_', ' ')}` });
    loadTrucks();
  };

  const statusFlow: Record<string, string[]> = { expected: ['arrived'], arrived: ['at_dock'], at_dock: ['loading'], loading: ['completed'] };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Truck Visits</h2>
        <Dialog open={newTruckDialog} onOpenChange={setNewTruckDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
              <Plus className="h-4 w-4 mr-2" /> Register Visit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Register Truck Visit</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Driver Name</Label><Input placeholder="Full name" value={newTruck.driverName} onChange={(e) => setNewTruck(p => ({ ...p, driverName: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Truck Plate</Label><Input placeholder="1-ABC-123" value={newTruck.truckPlate} onChange={(e) => setNewTruck(p => ({ ...p, truckPlate: e.target.value }))} /></div>
                <div><Label>Trailer Plate</Label><Input placeholder="1-XYZ-456" value={newTruck.trailerPlate} onChange={(e) => setNewTruck(p => ({ ...p, trailerPlate: e.target.value }))} /></div>
              </div>
              <div><Label>Company</Label><Input placeholder="Transport company" value={newTruck.company} onChange={(e) => setNewTruck(p => ({ ...p, company: e.target.value }))} /></div>
              <div><Label>Purpose</Label>
                <Select value={newTruck.purpose} onValueChange={(v) => setNewTruck(p => ({ ...p, purpose: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="delivery">Delivery</SelectItem><SelectItem value="pickup">Pickup</SelectItem><SelectItem value="both">Both</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Cargo Description</Label><Textarea placeholder="What cargo..." value={newTruck.cargoDescription} onChange={(e) => setNewTruck(p => ({ ...p, cargoDescription: e.target.value }))} /></div>
              <div><Label>Booking Reference</Label><Input placeholder="BK-2026-XXXX" value={newTruck.bookingRef} onChange={(e) => setNewTruck(p => ({ ...p, bookingRef: e.target.value }))} /></div>
            </div>
            <DialogFooter><Button onClick={createTruck} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">Register</Button></DialogFooter>
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
                    <Badge className={statusColors[tv.status] || ''} variant="outline">{tv.status.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{tv.truckPlate} {tv.trailerPlate && `/ ${tv.trailerPlate}`} — {tv.company}</p>
                  <p className="text-sm text-muted-foreground">{tv.purpose} — {tv.cargoDescription}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {tv.dockNumber && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Dock {tv.dockNumber}</span>}
                    {tv.bookingRef && <span>{tv.bookingRef}</span>}
                    {tv.expectedArrival && <span>ETA: {formatTime(tv.expectedArrival)}</span>}
                  </div>
                </div>
                <div className="shrink-0">
                  {statusFlow[tv.status] && (
                    <Button size="sm" onClick={() => advanceStatus(tv.id, tv.status)} className="bg-blue-500 hover:bg-blue-600 text-white">
                      <ArrowRight className="h-4 w-4 mr-1" /> {statusFlow[tv.status][0].replace('_', ' ')}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============ WAREHOUSES ============
function WarehouseView() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWh, setSelectedWh] = useState<Warehouse | null>(null);

  useEffect(() => {
    fetch('/api/warehouses').then(r => r.json()).then(setWarehouses);
  }, []);

  const typeLabels: Record<string, string> = { general: 'General', cold: 'Cold Storage', hazardous: 'Hazardous', bulk: 'Bulk' };
  const typeColors: Record<string, string> = { general: 'from-blue-500 to-cyan-500', cold: 'from-cyan-500 to-blue-600', hazardous: 'from-red-500 to-orange-500', bulk: 'from-amber-500 to-yellow-500' };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-6xl mx-auto">
      <h2 className="text-lg font-semibold">Warehouses & Storage</h2>

      {selectedWh ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedWh.name}</CardTitle>
                <CardDescription>{selectedWh.code} — {selectedWh.location} — {typeLabels[selectedWh.type]}</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedWh(null)}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"><p className="text-xs text-muted-foreground">Type</p><p className="font-semibold">{typeLabels[selectedWh.type]}</p></div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"><p className="text-xs text-muted-foreground">Capacity</p><p className="font-semibold">{selectedWh.capacity?.toLocaleString() || '-'} slots</p></div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"><p className="text-xs text-muted-foreground">Area</p><p className="font-semibold">{selectedWh.area?.toLocaleString() || '-'} m²</p></div>
            </div>
            <h4 className="font-semibold text-sm mb-3">Storage Locations</h4>
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
              {selectedWh.storageLocations?.map((loc: any) => (
                <div key={loc.id} className={`p-2 rounded-lg border text-center text-xs ${
                  loc.occupied ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700' : 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                }`}>
                  <p className="font-bold">{loc.zone}-{loc.row}-{loc.bay}</p>
                  <p className="text-muted-foreground text-[10px]">{loc.occupied ? loc.cargoRef || 'Occupied' : 'Free'}</p>
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
                      <span>{occupied}/{total} slots occupied</span>
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
    toast({ title: 'All marked as read' });
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <Button variant="outline" size="sm" onClick={markAllRead}><CheckCheck className="h-4 w-4 mr-2" /> Mark All Read</Button>
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
                    {n.category && <Badge variant="outline" className="text-xs">{n.category}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">{timeSince(n.createdAt)} ago</p>
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
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => { fetch('/api/stats').then(r => r.json()).then(setStats); }, []);
  if (!stats) return <div className="p-6"><p>Loading...</p></div>;

  const reportCards = [
    { title: 'Shifts', data: [{ label: 'Active', value: stats.activeShifts }] },
    { title: 'Cargo', data: [{ label: 'Pending', value: stats.pendingCargo }, { label: 'In Progress', value: stats.inProgressCargo }, { label: 'Completed', value: stats.completedCargo }] },
    { title: 'Trucks', data: [{ label: 'Expected', value: stats.expectedTrucks }, { label: 'At Dock', value: stats.atDockTrucks }] },
    { title: 'Documents', data: [{ label: 'Pending Review', value: stats.pendingDocs }] },
    { title: 'Safety', data: [{ label: 'Active Checks', value: stats.activeSafetyChecks }] },
    { title: 'Personnel', data: [{ label: 'Workers', value: stats.totalWorkers }, { label: 'Chauffeurs', value: stats.totalChauffeurs }] },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      <h2 className="text-lg font-semibold">Reports & Analytics</h2>
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
        <CardHeader><CardTitle className="text-base">Warehouse Occupancy Report</CardTitle></CardHeader>
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

// ============ MAIN APP ============
function MainApp() {
  const { currentView } = useAppStore();

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
