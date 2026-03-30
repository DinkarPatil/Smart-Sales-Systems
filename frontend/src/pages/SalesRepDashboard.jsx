import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Sparkles, Clock, CheckCircle, RefreshCcw } from 'lucide-react';

const SalesRepDashboard = () => {
  const [queries, setQueries] = useState([
    { 
      id: 'q1', 
      complaintId: 'C12345', 
      userEmail: 'customer1@gmail.com', 
      query: 'My router is not connecting to the 5GHz band.', 
      aiAnswer: 'Please try resetting your router and ensuring the 5GHz SSID is enabled in settings. A solution will be provided within 30 minutes.', 
      status: 'pending' 
    },
    { 
      id: 'q2', 
      complaintId: 'C12346', 
      userEmail: 'customer2@yahoo.com', 
      query: 'What is the warranty period for Cloud Hub X?', 
      aiAnswer: 'The Cloud Hub X comes with a 2-year manufacturer warranty. A solution will be provided within 30 minutes.', 
      status: 'pending' 
    },
  ]);

  const [selectedQuery, setSelectedQuery] = useState(null);
  const [editedAnswer, setEditedAnswer] = useState('');

  const handleSelectQuery = (query) => {
    setSelectedQuery(query);
    setEditedAnswer(query.aiAnswer);
    // In a real app, we would call the /assign-query API here
    console.log(`Query ${query.complaintId} assigned to rep at ${new_date().toISOString()}`);
  };

  const handleSendResponse = () => {
    // Mocking resolution
    setQueries(queries.map(q => q.id === selectedQuery.id ? { ...q, status: 'resolved' } : q));
    setSelectedQuery(null);
    setEditedAnswer('');
    alert('Response sent to customer!');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-12rem)]">
      {/* Query List */}
      <div className="lg:col-span-4 glass rounded-2xl flex flex-col overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-primary-400" size={20} />
            <h3 className="font-semibold">Active Queries</h3>
          </div>
          <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400 shadow-sm" title="Refresh">
            <RefreshCcw size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {queries.filter(q => q.status === 'pending').map(query => (
            <button
              key={query.id}
              onClick={() => handleSelectQuery(query)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedQuery?.id === query.id 
                ? 'bg-primary-600/20 border-primary-500/50' 
                : 'bg-white/5 border-transparent hover:border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-primary-400">ID: {query.complaintId}</span>
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Clock size={12} />
                  Just now
                </span>
              </div>
              <p className="font-medium text-sm truncate mb-1">{query.query}</p>
              <p className="text-xs text-slate-500 truncate">{query.userEmail}</p>
            </button>
          ))}
          {queries.filter(q => q.status === 'pending').length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <CheckCircle className="mx-auto mb-2 opacity-20" size={48} />
              <p>All queries solved!</p>
            </div>
          )}
        </div>
      </div>

      {/* Resolution Pane */}
      <div className="lg:col-span-8 glass rounded-2xl flex flex-col overflow-hidden relative">
        <AnimatePresence mode="wait">
          {selectedQuery ? (
            <motion.div 
              key={selectedQuery.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full"
            >
              <div className="p-6 border-b border-white/5 bg-slate-900/40">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">Query Resolution</h3>
                  <span className="px-3 py-1 bg-primary-600/20 text-primary-400 rounded-full text-xs font-medium border border-primary-500/30">
                    Priority: Normal
                  </span>
                </div>
                <div className="p-4 bg-black/30 rounded-xl border border-white/5 text-sm text-slate-300">
                  <p className="font-semibold mb-1 text-slate-500">Customer Query:</p>
                  <p>"{selectedQuery.query}"</p>
                </div>
              </div>

              <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary-400 mb-2">
                    <Sparkles size={18} />
                    <span className="text-sm font-semibold uppercase tracking-wider">AI Suggested Answer</span>
                  </div>
                  <textarea
                    value={editedAnswer}
                    onChange={(e) => setEditedAnswer(e.target.value)}
                    className="w-full h-80 bg-white/5 border border-white/10 rounded-2xl p-6 text-slate-200 outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-sans leading-relaxed text-sm"
                    placeholder="Refine the AI answer here..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-white/5 bg-slate-900/40 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Response to: <span className="text-slate-300 underline">{selectedQuery.userEmail}</span>
                  <p className="mt-1">Format: Manual resolution with 30min SLA</p>
                </div>
                <button 
                  onClick={handleSendResponse}
                  className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary-900/20"
                >
                  <span>Send Response</span>
                  <Send size={18} />
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center">
                <MessageSquare size={32} className="opacity-20" />
              </div>
              <p className="text-lg">Select a query from the list to start solving</p>
              <p className="text-sm opacity-50">Manual provided by companies will be used for AI answers</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SalesRepDashboard;
