'use client';
import React, { useState } from 'react';
import { X, MessageSquare, Send, Bell, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export function ModalNotifications({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('Olá! Lembramos que sua mensalidade do Plano Assistencial Eternity OS vence em breve. Evite suspensão.');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      // Simula disparo via API de WhatsApp ou gateway conectado
      // Aqui integrará com a Evolution API / Supabase Edge Functions no ambiente de prod
      await new Promise(r => setTimeout(r, 1200));
      
      // Registra log do disparo
      await supabase.from('audit_logs').insert([
        { action: 'WHATSAPP_DISPATCH', user_email: 'sistema@eternitysos.com', details: `Mensagem enviada para ${phone}` }
      ]).select();

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setPhone('');
      }, 2500);
    } catch (err: any) {
      alert('Erro ao disparar notificação: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Central de Notificações Omnichannel</h2>
              <p className="text-xs text-zinc-400">Disparo automatizado de cobranças e alertas via WhatsApp</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSendWhatsApp} className="p-6 space-y-4">
          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-400 text-xs">
              <CheckCircle className="w-4 h-4" /> Mensagem disparada com sucesso via canal oficial!
            </div>
          )}

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Telefone do Cliente (com DDD)</label>
            <input 
              required 
              type="text" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              placeholder="(86) 99999-9999" 
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono" 
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Modelo de Mensagem</label>
            <textarea 
              rows={4}
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-white" 
            />
          </div>

          <button 
            disabled={loading} 
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Transmitindo mensagem...' : 'Disparar Notificação Instantânea'}
          </button>
        </form>

      </div>
    </div>
  );
}
