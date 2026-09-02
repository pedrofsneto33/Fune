'use client';
import React, { useState } from 'react';
import { X, MessageCircle, Send } from 'lucide-react';
import { formatWhatsAppMessage } from '@/lib/whatsapp';

export function ModalNotifications({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = formatWhatsAppMessage(message, phone);
      window.open(url, '_blank');
      onClose();
    } catch (err: any) {
      alert('Erro ao enviar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-green-400" /> Enviar WhatsApp
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSend} className="space-y-3">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Telefone (com DDD)</label>
            <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white" placeholder="86988117925" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Mensagem</label>
            <textarea required value={message} onChange={e => setMessage(e.target.value)} rows={4} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white" />
          </div>
          <button disabled={loading} className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5">
            <Send className="w-4 h-4" /> {loading ? 'Abrindo...' : 'Abrir WhatsApp'}
          </button>
        </form>
      </div>
    </div>
  );
}
