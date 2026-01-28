
import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  ShieldAlert, 
  MessageSquare, 
  BarChart3, 
  Bell, 
  Settings,
  Car,
  Wind,
  Zap,
  Clock,
  Menu,
  X
} from 'lucide-react';
import TrafficMap from './components/TrafficMap';
import ChatAssistant from './components/ChatAssistant';
import ViolationFeed from './components/ViolationFeed';
import LiveMonitor from './components/LiveMonitor';
import { TrafficViolation } from './types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const chartData = [
  { time: '08:00', load: 400 },
  { time: '09:00', load: 850 },
  { time: '10:00', load: 720 },
  { time: '11:00', load: 500 },
  { time: '12:00', load: 600 },
  { time: '13:00', load: 450 },
  { time: '14:00', load: 480 },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'safety' | 'assistant' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [settings, setSettings] = useState({
    alertVolume: 80,
    autoCapture: true,
    nightMode: true,
    emailNotifications: true,
    speedThreshold: 60,
    updateInterval: 5,
  });
  const [violations, setViolations] = useState<TrafficViolation[]>([
    {
      id: 'v1',
      type: 'speeding',
      severity: 'high',
      timestamp: '14:23',
      location: 'Central Avenue',
      details: 'Vehicle traveling at 95km/h in a 60km/h zone.'
    },
    {
      id: 'v2',
      type: 'invalid_plate',
      severity: 'medium',
      timestamp: '14:45',
      location: 'Bridge West',
      details: 'LPR detected altered license plate sequence.'
    },
    {
      id: 'v3',
      type: 'crossing',
      severity: 'high',
      timestamp: '15:02',
      location: 'Cross Rd 4th',
      details: 'Illegal crossing at major intersection.'
    }
  ]);

  const handleNewViolation = useCallback((violation: TrafficViolation) => {
    setViolations(prev => [violation, ...prev]);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col shrink-0`}>
        <div className="p-6 flex items-center gap-3">
          {isSidebarOpen && <span className="text-xl font-bold tracking-tight">Traffic Flow</span>}
        </div>

        <nav className="flex-1 px-4 space-y-2 py-4">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            collapsed={!isSidebarOpen}
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={<MapIcon size={20} />} 
            label="Live Traffic Map" 
            active={activeTab === 'map'} 
            collapsed={!isSidebarOpen}
            onClick={() => setActiveTab('map')} 
          />
          <SidebarItem 
            icon={<ShieldAlert size={20} />} 
            label="Safety & Enforcement" 
            active={activeTab === 'safety'} 
            collapsed={!isSidebarOpen}
            onClick={() => setActiveTab('safety')} 
          />
          <SidebarItem 
            icon={<MessageSquare size={20} />} 
            label="GenAI Assistant" 
            active={activeTab === 'assistant'} 
            collapsed={!isSidebarOpen}
            onClick={() => setActiveTab('assistant')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
           <SidebarItem 
            icon={<Settings size={20} />} 
            label="Settings" 
            active={activeTab === 'settings'}
            collapsed={!isSidebarOpen}
            onClick={() => setActiveTab('settings')}
           />
           <button onClick={toggleSidebar} className="w-full flex items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
        <header className="sticky top-0 z-30 flex justify-between items-center p-6 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold capitalize">{activeTab.replace('_', ' ')} Overview</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-slate-400">GenAI Core: Online</span>
            </div>
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-950"></span>
            </button>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-[1400px] mx-auto">
          {activeTab === 'dashboard' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<Car className="text-blue-400" />} label="Avg. Speed" value="42.5 km/h" trend="+2.4%" />
                <StatCard icon={<Zap className="text-amber-400" />} label="Active Alerts" value={violations.length.toString()} trend="-4" trendType="neutral" />
                <StatCard icon={<Wind className="text-emerald-400" />} label="CO2 Reduction" value="-- Tons" trend="+15%" />
                <StatCard icon={<Clock className="text-purple-400" />} label="Wait Time Saved" value="-- Hrs" trend="+8%" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Traffic Load Chart */}
                <div className="lg:col-span-2 bg-slate-900/40 rounded-2xl border border-slate-800 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold flex items-center gap-2"><BarChart3 size={18} className="text-blue-500" /> System Load (Historical)</h3>
                    <select className="bg-slate-800 text-xs border border-slate-700 rounded-lg px-2 py-1 outline-none">
                      <option>Last 24 Hours</option>
                      <option>Last 7 Days</option>
                    </select>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                          itemStyle={{ color: '#f8fafc' }}
                        />
                        <Area type="monotone" dataKey="load" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLoad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent Violations Mini Feed */}
                <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold flex items-center gap-2"><ShieldAlert size={18} className="text-red-500" /> Recent Violations</h3>
                    <button onClick={() => setActiveTab('safety')} className="text-xs text-blue-400 hover:underline">View All</button>
                  </div>
                  <ViolationFeed violations={violations.slice(0, 3)} />
                </div>
              </div>
            </>
          )}

          {activeTab === 'map' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3 space-y-6">
                <TrafficMap />
              </div>
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 h-full">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><MapIcon size={18} className="text-emerald-500" /> Route Analysis</h3>
                  <div className="space-y-4">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                      <p className="text-xs text-slate-500 mb-1">Current Focus</p>
                      <p className="text-sm font-semibold">Downtown Central Hub</p>
                      <div className="mt-3 w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-red-500 w-[85%] h-full"></div>
                      </div>
                      <p className="text-[10px] mt-1 text-red-400">85% Congestion Rate</p>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/20 text-xs text-blue-100 italic">
                      "AI Suggestion: Redirect Harbor traffic via Suburban Gate to relieve central pressure."
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <LiveMonitor onViolationDetected={handleNewViolation} />
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                 <h3 className="font-bold mb-6 flex items-center gap-2"><ShieldAlert size={18} className="text-amber-500" /> Real-time Enforcement Logs</h3>
                 <ViolationFeed violations={violations} />
              </div>
            </div>
          )}

          {activeTab === 'assistant' && (
            <div className="h-[700px]">
              <ChatAssistant />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl">
              {/* System Settings */}
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                <h3 className="font-bold mb-6 flex items-center gap-2"><Settings size={20} className="text-blue-400" /> System Settings</h3>
                <div className="space-y-6">
                  {/* Night Mode */}
                  <div className="flex justify-between items-center p-4 bg-slate-800/30 rounded-xl border border-slate-700">
                    <div>
                      <p className="font-semibold text-sm">Night Mode</p>
                      <p className="text-xs text-slate-400">Dark theme for reduced eye strain</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={settings.nightMode}
                      onChange={(e) => setSettings({...settings, nightMode: e.target.checked})}
                      className="w-5 h-5 rounded cursor-pointer"
                    />
                  </div>

                  {/* Auto Capture */}
                  <div className="flex justify-between items-center p-4 bg-slate-800/30 rounded-xl border border-slate-700">
                    <div>
                      <p className="font-semibold text-sm">Auto Capture Violations</p>
                      <p className="text-xs text-slate-400">Automatically capture evidence</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={settings.autoCapture}
                      onChange={(e) => setSettings({...settings, autoCapture: e.target.checked})}
                      className="w-5 h-5 rounded cursor-pointer"
                    />
                  </div>

                  {/* Email Notifications */}
                  <div className="flex justify-between items-center p-4 bg-slate-800/30 rounded-xl border border-slate-700">
                    <div>
                      <p className="font-semibold text-sm">Email Notifications</p>
                      <p className="text-xs text-slate-400">Receive alerts via email</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={settings.emailNotifications}
                      onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                      className="w-5 h-5 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Sensor & Detection Settings */}
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                <h3 className="font-bold mb-6 flex items-center gap-2"><Zap size={20} className="text-amber-400" /> Detection Settings</h3>
                <div className="space-y-6">
                  {/* Speed Threshold */}
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-center mb-3">
                      <p className="font-semibold text-sm">Speed Threshold (km/h)</p>
                      <span className="bg-blue-600/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full">{settings.speedThreshold}</span>
                    </div>
                    <input 
                      type="range" 
                      min="30" 
                      max="120" 
                      value={settings.speedThreshold}
                      onChange={(e) => setSettings({...settings, speedThreshold: parseInt(e.target.value)})}
                      className="w-full cursor-pointer"
                    />
                    <p className="text-xs text-slate-400 mt-2">Violations flagged above this limit</p>
                  </div>

                  {/* Update Interval */}
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-center mb-3">
                      <p className="font-semibold text-sm">Update Interval (seconds)</p>
                      <span className="bg-blue-600/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full">{settings.updateInterval}</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="30" 
                      value={settings.updateInterval}
                      onChange={(e) => setSettings({...settings, updateInterval: parseInt(e.target.value)})}
                      className="w-full cursor-pointer"
                    />
                    <p className="text-xs text-slate-400 mt-2">Data refresh frequency</p>
                  </div>

                  {/* Alert Volume */}
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-center mb-3">
                      <p className="font-semibold text-sm">Alert Volume</p>
                      <span className="bg-blue-600/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full">{settings.alertVolume}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={settings.alertVolume}
                      onChange={(e) => setSettings({...settings, alertVolume: parseInt(e.target.value)})}
                      className="w-full cursor-pointer"
                    />
                    <p className="text-xs text-slate-400 mt-2">Notification sound level</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// --- Helper Components ---

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, collapsed, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
      active 
        ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
    } ${collapsed ? 'justify-center' : ''}`}
  >
    {icon}
    {!collapsed && <span className="font-medium">{label}</span>}
  </button>
);

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
  trendType?: 'positive' | 'negative' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, trend, trendType = 'positive' }) => (
  <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors group">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 rounded-lg bg-slate-800 group-hover:scale-110 transition-transform">{icon}</div>
      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
        trendType === 'positive' ? 'bg-emerald-500/10 text-emerald-500' :
        trendType === 'negative' ? 'bg-red-500/10 text-red-500' :
        'bg-blue-500/10 text-blue-500'
      }`}>
        {trend}
      </span>
    </div>
    <h4 className="text-slate-500 text-sm mb-1">{label}</h4>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

export default App;
