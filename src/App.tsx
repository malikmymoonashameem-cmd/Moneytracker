/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  ListOrdered, 
  User as UserIcon, 
  LogOut, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Tag,
  FileText,
  Camera,
  PieChart as PieChartIcon,
  Search,
  Sun,
  Moon,
  Trash2,
  Activity
} from 'lucide-react';
import { MoneyTrackLogo } from './components/Logo';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  Legend
} from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { cn, type User, type Expense, type Budget, type Income, CATEGORIES, CATEGORY_COLORS, CURRENCIES } from './types';
import { PrivacyPolicy, TermsOfService } from './StaticPages';
import { AddIncomeView, IncomeListView } from './components/IncomeViews';

// --- Components ---

const Card = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <div className={cn("bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-black/5 dark:border-white/5 transition-colors duration-300", className)} {...props}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className,
  disabled,
  type = 'button'
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) => {
  const variants = {
    primary: "bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200",
    secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
    danger: "bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700",
    ghost: "bg-transparent text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
  };

  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-6 py-3 rounded-2xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

const Input = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder,
  required
}: { 
  label: string; 
  type?: string; 
  value: string | number; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
}) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 ml-1">{label}</label>
    <input 
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white transition-all dark:text-white"
    />
  </div>
);

const Select = ({ 
  label, 
  value, 
  onChange, 
  options 
}: { 
  label: string; 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 ml-1">{label}</label>
    <select 
      value={value}
      onChange={onChange}
      className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white transition-all appearance-none dark:text-white"
    >
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);
// --- Main App ---

const ExpenseModal = ({ expense, onClose }: { expense: Expense; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Expense Details</h2>
        <div className="space-y-4">
          <p className="text-zinc-500 dark:text-zinc-400">Category: {expense.category}</p>
          <p className="text-zinc-500 dark:text-zinc-400">Amount: {expense.currency} {expense.amount.toFixed(2)}</p>
          <p className="text-zinc-500 dark:text-zinc-400">Date: {format(parseISO(expense.date), 'MMM d, yyyy')} {expense.time}</p>
          <p className="text-zinc-500 dark:text-zinc-400">Notes: {expense.notes || "No notes"}</p>
          {expense.receipt_url && (
            <div className="mt-4">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Receipt:</p>
              <img src={expense.receipt_url} alt="Receipt" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700" referrerPolicy="no-referrer" />
            </div>
          )}
        </div>
        <button onClick={onClose} className="w-full mt-8 bg-black dark:bg-white text-white dark:text-black py-3 rounded-2xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all">Close</button>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const [isTermsOfServiceOpen, setIsTermsOfServiceOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'add' | 'profile' | 'stats' | 'income'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('fintrack_dark_mode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('fintrack_dark_mode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Fetch expenses, budgets, and income
  const fetchData = async (userId: number) => {
    try {
      const [expensesRes, budgetsRes, incomeRes] = await Promise.all([
        fetch('/api/expenses', { headers: { 'x-user-id': userId.toString() } }),
        fetch('/api/budgets', { headers: { 'x-user-id': userId.toString() } }),
        fetch('/api/income', { headers: { 'x-user-id': userId.toString() } })
      ]);
      
      if (!expensesRes.ok || !budgetsRes.ok || !incomeRes.ok) {
        if (expensesRes.status === 401 || budgetsRes.status === 401 || incomeRes.status === 401) {
          handleLogout();
          return;
        }
        throw new Error("Failed to fetch data");
      }
      
      const expensesData = await expensesRes.json();
      const budgetsData = await budgetsRes.json();
      const incomeData = await incomeRes.json();
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      setBudgets(Array.isArray(budgetsData) ? budgetsData : []);
      setIncome(Array.isArray(incomeData) ? incomeData : []);
    } catch (err) {
      console.error("Failed to fetch data", err);
      setExpenses([]);
      setBudgets([]);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('fintrack_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
      fetchData(u.id);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      setUser(data.user);
      localStorage.setItem('fintrack_user', JSON.stringify(data.user));
      fetchData(data.user.id);
    } catch (err) {
      alert("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setExpenses([]);
    localStorage.removeItem('fintrack_user');
  };

  const handleAddExpense = async (expenseData: Partial<Expense>) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString()
        },
        body: JSON.stringify(expenseData)
      });
      const newExpense = await res.json();
      setExpenses([newExpense, ...expenses]);
      setActiveTab('dashboard');
    } catch (err) {
      alert("Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  const handleAddIncome = async (incomeData: Partial<Income>) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/income', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString()
        },
        body: JSON.stringify(incomeData)
      });
      const newIncome = await res.json();
      setIncome([newIncome, ...income]);
      setActiveTab('dashboard');
    } catch (err) {
      alert("Failed to add income");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!user) return;
    
    // Optimistic update
    const previousExpenses = [...expenses];
    setExpenses(expenses.filter(e => e.id !== id));
    
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user.id.toString() }
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setExpenses(previousExpenses);
      alert("Failed to delete expense. Please try again.");
    }
  };

  const handleDeleteIncome = async (id: number) => {
    if (!user) return;
    
    // Optimistic update
    const previousIncome = [...income];
    setIncome(income.filter(i => i.id !== id));
    
    try {
      const res = await fetch(`/api/income/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user.id.toString() }
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setIncome(previousIncome);
      alert("Failed to delete income. Please try again.");
    }
  };

  const handleDeleteBudget = async (id: number) => {
    if (!user) return;
    
    // Optimistic update
    const previousBudgets = [...budgets];
    setBudgets(budgets.filter(b => b.id !== id));
    
    try {
      const res = await fetch(`/api/budgets/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user.id.toString() }
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setBudgets(previousBudgets);
      alert("Failed to delete budget. Please try again.");
    }
  };

  const handleUpdateSettings = async (settings: Partial<User>) => {
    if (!user) return;
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString()
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        const updatedUser = { ...user, ...settings };
        setUser(updatedUser);
        localStorage.setItem('fintrack_user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error("Failed to update settings", err);
    }
  };

  // --- Auth View ---
  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6 font-sans transition-colors duration-300">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-black dark:bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <MoneyTrackLogo className="text-white dark:text-black w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight dark:text-white">MoneyTrack</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">Master your money, one tap at a time.</p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <Input 
                label="Email Address" 
                type="email" 
                value={authEmail} 
                onChange={e => setAuthEmail(e.target.value)}
                placeholder="hello@example.com"
                required
              />
              <Input 
                label="Password" 
                type="password" 
                value={authPassword} 
                onChange={e => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In / Register"}
              </Button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200 dark:border-zinc-700"></div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-zinc-400">
                By continuing, you agree to our <button onClick={() => setIsTermsOfServiceOpen(true)} className="underline hover:text-black dark:hover:text-white">Terms of Service</button> and <button onClick={() => setIsPrivacyPolicyOpen(true)} className="underline hover:text-black dark:hover:text-white">Privacy Policy</button>.
              </p>
            </div>
          </Card>
          <div className="mt-8 flex justify-center">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-3 rounded-full bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 shadow-sm text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-all"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- App View ---
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans pb-24 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-black/5 dark:border-white/5 px-6 py-4 sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight dark:text-white">
              {activeTab === 'dashboard' && "Dashboard"}
              {activeTab === 'list' && "Transactions"}
              {activeTab === 'add' && "Add Expense"}
              {activeTab === 'profile' && "Profile"}
              {activeTab === 'stats' && "Analytics"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <DashboardView expenses={expenses} income={income} darkMode={darkMode} user={user} onSelectExpense={setSelectedExpense} />
          )}
          {activeTab === 'list' && (
            <ListView expenses={expenses} onDelete={handleDeleteExpense} onSelectExpense={setSelectedExpense} />
          )}
          {activeTab === 'add' && (
            <AddExpenseView onAdd={handleAddExpense} loading={loading} user={user} />
          )}
          {activeTab === 'income' && (
            <div className="space-y-6">
              <AddIncomeView onAdd={handleAddIncome} loading={loading} user={user} />
              <IncomeListView income={income} onDelete={handleDeleteIncome} />
            </div>
          )}
          {activeTab === 'profile' && (
            <ProfileView user={user} onLogout={handleLogout} onUpdateSettings={handleUpdateSettings} darkMode={darkMode} setDarkMode={setDarkMode} setIsTermsOfServiceOpen={setIsTermsOfServiceOpen} setIsPrivacyPolicyOpen={setIsPrivacyPolicyOpen} budgets={budgets} setBudgets={setBudgets} expenses={expenses} onDeleteBudget={handleDeleteBudget} />
          )}
          {activeTab === 'stats' && (
            <StatsView expenses={expenses} darkMode={darkMode} user={user} />
          )}
        </AnimatePresence>
      </main>

      {selectedExpense && (
        <ExpenseModal expense={selectedExpense} onClose={() => setSelectedExpense(null)} />
      )}

      {isPrivacyPolicyOpen && (
        <PrivacyPolicy onClose={() => setIsPrivacyPolicyOpen(false)} />
      )}

      {isTermsOfServiceOpen && (
        <TermsOfService onClose={() => setIsTermsOfServiceOpen(false)} />
      )}

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-black/5 dark:border-white/5 px-6 py-3 z-20 transition-colors duration-300">
        <div className="max-w-2xl mx-auto flex items-center justify-around">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard />} 
            label="Home" 
          />
          <NavButton 
            active={activeTab === 'list'} 
            onClick={() => setActiveTab('list')} 
            icon={<ListOrdered />} 
            label="History" 
          />
          <NavButton 
            active={activeTab === 'income'} 
            onClick={() => setActiveTab('income')} 
            icon={<TrendingUp />} 
            label="Income" 
          />
          <button 
            onClick={() => setActiveTab('add')}
            className={cn(
              "w-14 h-14 -mt-8 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90",
              activeTab === 'add' ? "bg-black text-white dark:bg-white dark:text-black" : "bg-black text-white dark:bg-white dark:text-black"
            )}
          >
            <PlusCircle className="w-8 h-8" />
          </button>
          <NavButton 
            active={activeTab === 'profile'} 
            onClick={() => setActiveTab('profile')} 
            icon={<UserIcon />} 
            label="Profile" 
          />
          <NavButton 
            active={activeTab === 'stats'} 
            onClick={() => setActiveTab('stats')} 
            icon={<PieChartIcon />} 
            label="Stats" 
          />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-colors",
        active ? "text-black dark:text-white" : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
      )}
    >
      {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </button>
  );
}

function DashboardView({ expenses, income, darkMode, user, onSelectExpense }: { expenses: Expense[]; income: Income[]; darkMode: boolean; user: User | null; onSelectExpense: (expense: Expense) => void }) {
  const totalSpending = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
  const netSavings = totalIncome - totalSpending;
  
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    expenses.forEach(e => {
      counts[e.category] = (counts[e.category] || 0) + e.amount;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const recentExpenses = expenses.slice(0, 5);

  const getCurrencySymbol = (code: string) => {
    return CURRENCIES.find(c => c.code === code)?.symbol || "$";
  };

  const preferredCurrency = user?.preferred_currency || 'USD';

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {/* Financial Summary Card */}
      <div className="bg-zinc-900 dark:bg-zinc-800 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden transition-colors duration-300">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-zinc-400 dark:text-zinc-500 text-sm font-medium uppercase tracking-widest mb-1">Total Income</p>
            <h2 className="text-3xl font-bold tracking-tighter text-emerald-400">
              {getCurrencySymbol(preferredCurrency)}{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
          </div>
          <div>
            <p className="text-zinc-400 dark:text-zinc-500 text-sm font-medium uppercase tracking-widest mb-1">Total Expenses</p>
            <h2 className="text-3xl font-bold tracking-tighter text-red-400">
              {getCurrencySymbol(preferredCurrency)}{totalSpending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
          </div>
          <div>
            <p className="text-zinc-400 dark:text-zinc-500 text-sm font-medium uppercase tracking-widest mb-1">Net Savings</p>
            <h2 className={`text-3xl font-bold tracking-tighter ${netSavings >= 0 ? 'text-white' : 'text-red-500'}`}>
              {getCurrencySymbol(preferredCurrency)}{netSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
          </div>
        </div>
        {/* Abstract background shapes */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="h-64 flex flex-col">
          <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-4 uppercase tracking-wider">Spending by Category</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || "#000"} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: darkMode ? '#18181b' : '#fff', color: darkMode ? '#fff' : '#000' }}
                  itemStyle={{ color: darkMode ? '#fff' : '#000' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="h-64 flex flex-col">
          <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-4 uppercase tracking-wider">Monthly Trend</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenses.slice(0, 7).reverse()}>
                <XAxis dataKey="date" hide />
                <Tooltip 
                   cursor={{fill: 'transparent'}}
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: darkMode ? '#18181b' : '#fff', color: darkMode ? '#fff' : '#000' }}
                   itemStyle={{ color: darkMode ? '#fff' : '#000' }}
                />
                <Bar dataKey="amount" fill={darkMode ? "#fff" : "#000"} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-lg dark:text-white">Recent Transactions</h3>
          <button className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors">See All</button>
        </div>
        <div className="space-y-3">
          {recentExpenses.length === 0 ? (
            <p className="text-center py-10 text-zinc-400 italic">No transactions yet. Start tracking!</p>
          ) : (
            recentExpenses.map(expense => (
              <div key={expense.id} onClick={() => onSelectExpense(expense)} className="cursor-pointer bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-black/5 dark:border-white/5 flex items-center justify-between group hover:border-black/20 dark:hover:border-white/20 transition-all">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
                    style={{ backgroundColor: CATEGORY_COLORS[expense.category] || "#000" }}
                  >
                    <Tag className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">{expense.category}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      {format(parseISO(expense.date), 'MMM d, yyyy')} • {expense.time || '--:--'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">
                    -{getCurrencySymbol(expense.currency || 'USD')}{expense.amount.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wider">{expense.notes || "No notes"}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ListView({ expenses, onDelete, onSelectExpense }: { expenses: Expense[]; onDelete: (id: number) => void; onSelectExpense: (expense: Expense) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredExpenses = expenses.filter(e => 
    e.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.notes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCurrencySymbol = (code: string) => {
    return CURRENCIES.find(c => c.code === code)?.symbol || "$";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 w-5 h-5" />
        <input 
          type="text"
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-3xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white transition-all shadow-sm dark:text-white"
        />
      </div>

      <div className="space-y-3">
        {filteredExpenses.map(expense => (
          <div key={expense.id} onClick={() => onSelectExpense(expense)} className="cursor-pointer bg-white dark:bg-zinc-900 p-5 rounded-[2rem] border border-black/5 dark:border-white/5 flex items-center justify-between group hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: CATEGORY_COLORS[expense.category] || "#000" }}
              >
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">{expense.category}</p>
                <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                  <Calendar className="w-3 h-3" />
                  <span>{format(parseISO(expense.date), 'MMM d, yyyy')} • {expense.time || '--:--'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-bold text-zinc-900 dark:text-zinc-100">
                  -{getCurrencySymbol(expense.currency || 'USD')}{expense.amount.toFixed(2)}
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wider truncate max-w-[100px]">{expense.notes}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(expense.id); }}
                className="p-2 text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
        {filteredExpenses.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-zinc-300 dark:text-zinc-600 w-10 h-10" />
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">No transactions found matching your search.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AddExpenseView({ onAdd, loading, user }: { onAdd: (data: Partial<Expense>) => void; loading: boolean; user: User | null }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [currency, setCurrency] = useState(user?.preferred_currency || 'USD');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      amount: parseFloat(amount),
      category,
      date,
      time,
      currency,
      notes
    });
  };

  const getCurrencySymbol = (code: string) => {
    return CURRENCIES.find(c => c.code === code)?.symbol || "$";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="text-center mb-8">
            <p className="text-zinc-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Enter Amount</p>
            <div className="flex items-center justify-center gap-2">
              <div className="relative">
                <select 
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="text-4xl font-bold text-zinc-400 dark:text-zinc-500 bg-transparent border-none focus:ring-0 cursor-pointer appearance-none text-right"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.symbol} ({c.code})</option>
                  ))}
                </select>
              </div>
              <input 
                type="number" 
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="text-6xl font-bold tracking-tighter w-full max-w-[200px] text-center focus:outline-none placeholder:text-zinc-100 dark:placeholder:text-zinc-800 bg-transparent dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 ml-1 uppercase tracking-wider">Select Category</label>
            <div className="grid grid-cols-4 gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all gap-2",
                    category === cat 
                      ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white scale-105 shadow-md" 
                      : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
                  )}
                >
                  <div 
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      category === cat ? "bg-white/20" : "bg-white dark:bg-zinc-700"
                    )}
                    style={{ backgroundColor: category === cat ? undefined : CATEGORY_COLORS[cat] }}
                  >
                    <Tag className={cn("w-4 h-4", category === cat ? "text-white dark:text-black" : "text-white")} />
                  </div>
                  <span className="text-[10px] font-bold uppercase truncate w-full text-center">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Input 
              label="Date" 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              required
            />
            <Input 
              label="Time" 
              type="time" 
              value={time} 
              onChange={e => setTime(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 ml-1">Notes</label>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What was this for?"
              className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white transition-all h-24 resize-none dark:text-white"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 hover:border-black/20 dark:hover:border-white/20 transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold dark:text-white">Attach Receipt</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Upload a photo of your receipt</p>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full py-4 text-lg" disabled={loading}>
            {loading ? "Adding..." : "Save Expense"}
          </Button>
        </form>
      </Card>
    </motion.div>
  );
}

const BudgetView = ({ budgets, expenses, onDeleteBudget, user }: { budgets: Budget[]; expenses: Expense[]; onDeleteBudget: (id: number) => void; user: User }) => {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const preferredCurrency = user?.preferred_currency || 'USD';

  const handleSetBudget = async () => {
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user!.id.toString()
        },
        body: JSON.stringify({ category, amount: parsedAmount, month: selectedMonth, expiryDate: expiryDate || null })
      });
      if (res.ok) {
        alert("Budget set successfully");
      } else {
        alert("Failed to set budget");
      }
    } catch (err) {
      alert("Failed to set budget");
    }
  };

  const getCurrencySymbol = (code: string) => {
    return CURRENCIES.find(c => c.code === code)?.symbol || "$";
  };

  const today = new Date();
  const isBudgetActive = (budget: Budget) => {
    const isMonthActive = budget.month === selectedMonth;
    const isNotExpired = !budget.expiryDate || new Date(budget.expiryDate) >= today;
    return isMonthActive && isNotExpired;
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-bold mb-4 dark:text-white">Set Budget</h2>
        <div className="space-y-4">
          <Select label="Category" value={category} onChange={e => setCategory(e.target.value)} options={CATEGORIES} />
          <Input label="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
          <Input label="Month" type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
          <Input label="Expiry Date (Optional)" type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
          <Button onClick={handleSetBudget} className="w-full">Set Budget</Button>
        </div>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-bold dark:text-white">Active Budgets ({selectedMonth})</h2>
        {budgets.filter(isBudgetActive).map(budget => {
          const spent = expenses
            .filter(e => e.category === budget.category && e.date.startsWith(budget.month) && (budget.expiryDate ? e.date <= budget.expiryDate : true))
            .reduce((sum, e) => sum + e.amount, 0);
          const progress = Math.min((spent / budget.amount) * 100, 100);
          
          return (
            <Card key={budget.id}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <span className="font-bold dark:text-white">{budget.category}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {getCurrencySymbol(preferredCurrency)}{spent.toFixed(2)} / {getCurrencySymbol(preferredCurrency)}{budget.amount.toFixed(2)}
                  </span>
                  <button onClick={() => onDeleteBudget(budget.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2.5">
                <div className="bg-black dark:bg-white h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
              {budget.expiryDate && (
                <p className="text-xs text-zinc-400 mt-2">Expires: {budget.expiryDate}</p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

function ProfileView({ user, onLogout, onUpdateSettings, darkMode, setDarkMode, setIsTermsOfServiceOpen, setIsPrivacyPolicyOpen, budgets, setBudgets, expenses, onDeleteBudget }: { user: User; onLogout: () => void; onUpdateSettings: (settings: Partial<User>) => void; darkMode: boolean; setDarkMode: (val: boolean) => void; setIsTermsOfServiceOpen: (val: boolean) => void; setIsPrivacyPolicyOpen: (val: boolean) => void; budgets: Budget[]; setBudgets: React.Dispatch<React.SetStateAction<Budget[]>>; expenses: Expense[]; onDeleteBudget: (id: number) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6"
    >
      <Card className="p-8 text-center">
        <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-black/5 dark:border-white/5">
          <UserIcon className="w-12 h-12 text-zinc-400 dark:text-zinc-500" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight dark:text-white">{user.name}</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">{user.email}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-left">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Currency</p>
            <select 
              value={user.preferred_currency || 'USD'}
              onChange={(e) => onUpdateSettings({ preferred_currency: e.target.value })}
              className="font-bold dark:text-white bg-transparent border-none p-0 focus:ring-0 w-full cursor-pointer"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
              ))}
            </select>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-left">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Appearance</p>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="font-bold dark:text-white flex items-center gap-2 w-full justify-between"
            >
              <div className="flex items-center gap-2">
                {darkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                <span>{darkMode ? "Dark Mode" : "Light Mode"}</span>
              </div>
              <div className={cn(
                "w-10 h-5 rounded-full relative transition-colors duration-300",
                darkMode ? "bg-indigo-600" : "bg-zinc-300"
              )}>
                <div className={cn(
                  "absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300",
                  darkMode ? "left-6" : "left-1"
                )} />
              </div>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <Button variant="secondary" className="w-full justify-between group">
            <span>Account Settings</span>
            <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-black dark:group-hover:text-white transition-colors" />
          </Button>
          <Button variant="secondary" className="w-full justify-between group" onClick={() => setIsTermsOfServiceOpen(true)}>
            <span>Terms of Service</span>
            <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-black dark:group-hover:text-white transition-colors" />
          </Button>
          <Button variant="secondary" className="w-full justify-between group" onClick={() => setIsPrivacyPolicyOpen(true)}>
            <span>Privacy Policy</span>
            <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-black dark:group-hover:text-white transition-colors" />
          </Button>
          <Button variant="secondary" className="w-full justify-between group">
            <span>Export Data (CSV)</span>
            <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-black dark:group-hover:text-white transition-colors" />
          </Button>
          <Button variant="ghost" onClick={onLogout} className="w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </Card>

      <BudgetView budgets={budgets} expenses={expenses} onDeleteBudget={onDeleteBudget} user={user} />

      <div className="text-center px-6">
        <p className="text-xs text-zinc-400 dark:text-zinc-600">MoneyTrack v1.0.0 • Crafted with care</p>
      </div>
    </motion.div>
  );
}

function StatsView({ expenses, darkMode, user }: { expenses: Expense[]; darkMode: boolean; user: User | null }) {
  const totalSpending = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    expenses.forEach(e => {
      counts[e.category] = (counts[e.category] || 0) + e.amount;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const dailyTrend = useMemo(() => {
    const days: Record<string, number> = {};
    expenses.forEach(e => {
      const day = format(parseISO(e.date), 'MMM d');
      days[day] = (days[day] || 0) + e.amount;
    });
    return Object.entries(days)
      .map(([name, value]) => ({ name, value }))
      .slice(-7);
  }, [expenses]);

  const getCurrencySymbol = (code: string) => {
    return CURRENCIES.find(c => c.code === code)?.symbol || "$";
  };

  const preferredCurrency = user?.preferred_currency || 'USD';

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-6">
          <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Expenses</p>
          <p className="text-2xl font-bold dark:text-white">{expenses.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1">Avg. Per Item</p>
          <p className="text-2xl font-bold dark:text-white">
            {getCurrencySymbol(preferredCurrency)}{(totalSpending / (expenses.length || 1)).toFixed(2)}
          </p>
        </Card>
      </div>

      <Card className="h-80 flex flex-col">
        <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-6 uppercase tracking-wider">Spending Distribution</h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || "#000"} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: darkMode ? '#18181b' : '#fff', color: darkMode ? '#fff' : '#000' }}
                itemStyle={{ color: darkMode ? '#fff' : '#000' }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="h-64 flex flex-col">
        <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-6 uppercase tracking-wider">Daily Spending Trend</h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyTrend}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: darkMode ? '#71717a' : '#a1a1aa'}} />
              <YAxis hide />
              <Tooltip 
                 cursor={{fill: 'transparent'}}
                 contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: darkMode ? '#18181b' : '#fff', color: darkMode ? '#fff' : '#000' }}
                 itemStyle={{ color: darkMode ? '#fff' : '#000' }}
              />
              <Bar dataKey="value" fill={darkMode ? "#fff" : "#000"} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="space-y-4">
        <h3 className="font-bold text-lg dark:text-white px-1">Top Categories</h3>
        <div className="space-y-2">
          {categoryData.slice(0, 5).map((cat, idx) => (
            <div key={cat.name} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-black/5 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat.name] }} />
                <span className="font-bold dark:text-white">{cat.name}</span>
              </div>
              <span className="font-bold dark:text-zinc-400">
                {getCurrencySymbol(preferredCurrency)}{cat.value.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
