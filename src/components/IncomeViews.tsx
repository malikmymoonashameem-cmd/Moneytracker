import React, { useState } from 'react';
import { format } from 'date-fns';
import { PlusCircle, Trash2, Calendar, Tag, Search } from 'lucide-react';
import { Income, CURRENCIES, cn } from '../types';

export const AddIncomeView = ({ onAdd, loading, user }: { onAdd: (data: Partial<Income>) => void; loading: boolean; user: any }) => {
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('Salary');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [currency, setCurrency] = useState(user?.preferred_currency || 'USD');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      amount: parseFloat(amount),
      source,
      date,
      currency,
      notes
    });
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm">
        <div className="text-center mb-8">
          <p className="text-zinc-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Enter Income Amount</p>
          <div className="flex items-center justify-center gap-2">
            <select 
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="text-4xl font-bold text-zinc-400 dark:text-zinc-500 bg-transparent border-none focus:ring-0 cursor-pointer appearance-none text-right"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.symbol} ({c.code})</option>
              ))}
            </select>
            <input 
              type="number" 
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 bg-transparent border-none focus:ring-0 w-32"
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 ml-1">Source</label>
          <select 
            value={source}
            onChange={e => setSource(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white transition-all dark:text-white"
          >
            <option value="Salary">Salary</option>
            <option value="Freelancing">Freelancing</option>
            <option value="Investment">Investment</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 ml-1">Date</label>
          <input 
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white transition-all dark:text-white"
          />
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 ml-1">Notes</label>
          <input 
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional notes"
            className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white transition-all dark:text-white"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add Income"}
        </button>
      </form>
    </div>
  );
};

export const IncomeListView = ({ income, onDelete }: { income: Income[]; onDelete: (id: number) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredIncome = income.filter(i => 
    i.source.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.notes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCurrencySymbol = (code: string) => {
    return CURRENCIES.find(c => c.code === code)?.symbol || "$";
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 w-5 h-5" />
        <input 
          type="text"
          placeholder="Search income..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-3xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white transition-all shadow-sm dark:text-white"
        />
      </div>

      <div className="space-y-3">
        {filteredIncome.map(item => (
          <div key={item.id} className="bg-white dark:bg-zinc-900 p-5 rounded-[2rem] border border-black/5 dark:border-white/5 flex items-center justify-between group hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm bg-emerald-500">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">{item.source}</p>
                <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                  <Calendar className="w-3 h-3" />
                  <span>{format(new Date(item.date), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-bold text-emerald-600 dark:text-emerald-400">
                  +{getCurrencySymbol(item.currency || 'USD')}{item.amount.toFixed(2)}
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wider truncate max-w-[100px]">{item.notes}</p>
              </div>
              <button 
                onClick={() => onDelete(item.id)}
                className="p-2 text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
        {filteredIncome.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-zinc-300 dark:text-zinc-600 w-10 h-10" />
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">No income records found.</p>
          </div>
        )}
      </div>
    </div>
  );
};
