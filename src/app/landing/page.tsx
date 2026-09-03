'use client';

import { useState } from 'react';
import {
  HeartPulse, Ambulance, Flower2, Users, FileText, ShieldCheck,
  Phone, Mail, MapPin, Check, ChevronDown, Building2, Clock, MessageCircle,
} from 'lucide-react';

const WHATSAPP_URL = 'https://wa.me/5586988117925?text=' + encodeURIComponent('Olá! Vim pelo site da PrimeX Sistemas e quero conhecer o EternityOS.');
const EMAIL = 'pedrofsneto33@gmail.com';

const MODULES = [
  { icon: Users, title: 'Associados & Contratos', text: 'Cadastro completo de titulares e dependentes, contratos digitalizados, carnet de mensalidades e carteirinha digital com QR Code — pronta para imprimir ou compartilhar no WhatsApp.' },
  { icon: MessageCircle, title: 'Cobrança Inteligente', text: 'Gere cobranças PIX e boletos em lote via Asaas, envie mensagens de vencimento com um clique e concilie pagamentos automaticamente pelo webhook.' },
  { icon: Ambulance, title: 'Plantão 24h & Dispatch', text: 'Painel de plantão em tempo real, registro de óbitos, despacho de veículos com checklist e dedução automática de estoque (urvas, adornos e itens funerários).' },
  { icon: Flower2, title: 'Capela & Tanatopraxia', text: 'Agenda de velórios e sepultamentos, livro de capela digital e registros técnicos de tanatopraxia com rastreabilidade completa.' },
  { icon: FileText, title: 'Financeiro & DRE', text: 'Contas a pagar/receber, comissões de vendedores, reservas regulatórias e relatórios DRE prontos para a contabilidade — exportação em PDF.' },
  { icon: ShieldCheck, title: 'Multiempresa & Segurança', text: 'Cada funerária em seu próprio ambiente isolado (multi-tenant), com controle de acesso por perfil (RBAC), logs de auditoria e backups gerenciados.' },
];

const PLANS = [
  {
    code: 'essencial', name: 'Essencial', price: 'R$ 397', period: '/mês', badge: null as string | null,
    desc: 'Para funerárias de pequeno porte começando a digitalizar a operação.',
    items: ['Até 200 associados ativos', 'Até 5 usuários no sistema', 'Até 4 dependentes por titular', 'Associados, dependentes e contratos', 'Carteirinha digital + cobrança PIX/boleto', 'Plantão 24h e registro de óbitos', 'Suporte por WhatsApp'],
  },
  {
    code: 'profissional', name: 'Profissional', price: 'R$ 597', period: '/mês', badge: 'Mais escolhido',
    desc: 'Para operações em crescimento que precisam de BI e financeiro completo.',
    items: ['Até 1.000 associados ativos', 'Até 20 usuários no sistema', 'Até 8 dependentes por titular', 'Tudo do Essencial', 'Frota, estoque e tanatopraxia', 'Financeiro completo com DRE', 'Relatórios em PDF e comissões', 'Suporte prioritário'],
  },
  {
    code: 'enterprise', name: 'Enterprise', price: 'Sob consulta', period: '', badge: null as string | null,
    desc: 'Para grupos funerários com múltiplas filiais e alta demanda.',
    items: ['Associados e usuários ilimitados', 'Até 20 dependentes por titular', 'Tudo do Profissional', 'Filiais ilimitadas (multi-empresa)', 'Personalização de marca (logo e cores)', 'Integrações sob demanda', 'Gerente de conta dedicado'],
  },
];

const FAQ = [
  { q: 'Preciso instalar algo?', a: 'Não. O EternityOS é 100% online: funciona no navegador do computador ou celular. Cuidamos da hospedagem, backups e atualizações.' },
  { q: 'Consigo migrar meus dados atuais?', a: 'Sim. Importamos sua base de associados em planilha (Excel/CSV) e orientamos todo o processo de migração sem custo nos planos anuais.' },
  { q: 'A carteirinha funciona no celular?', a: 'Sim, cada associado recebe um link único e seguro com a carteirinha digital, que pode ser salva na tela inicial do celular ou impressa.' },
  { q: 'Meus dados ficam seguros?', a: 'Todos os dados são criptografados em trânsito e em repouso, com controle de acesso por perfil e logs de auditoria de todas as operações.' },
  { q: 'Posso testar antes de contratar?', a: 'Sim! Agende uma demonstração guiada pelo WhatsApp e veja o sistema funcionando com dados de exemplo da sua operação.' },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-blue-500/40">
      <nav className="sticky top-0 z-40 border-b border-white/5 bg-[#070b14]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div className="leading-none">
              <span className="font-bold text-base tracking-tight">Eternity<span className="text-blue-400">OS</span></span>
              <span className="block text-[10px] text-slate-400">by PrimeX Sistemas</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-7 text-sm text-slate-300">
            <a href="#recursos" className="hover:text-white transition">Recursos</a>
            <a href="#planos" className="hover:text-white transition">Planos</a>
            <a href="#faq" className="hover:text-white transition">Dúvidas</a>
            <a href="/login" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition shadow-lg shadow-blue-600/25">Entrar</a>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.18),transparent_60%)]" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="relative max-w-6xl mx-auto px-5 pt-20 pb-24 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/25 rounded-full px-4 py-1.5 mb-7">
            <Clock className="w-3.5 h-3.5" /> Sistema de gestão para funerárias e planos funerários
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.08]">
            Sua funerária inteira<br />
            <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-sky-400 bg-clip-text text-transparent">em um único sistema.</span>
          </h1>
          <p className="max-w-2xl mx-auto mt-6 text-slate-400 text-base md:text-lg leading-relaxed">
            De associados e carteirinhas ao plantão 24h, cobrança, frota e financeiro — o EternityOS automatiza a operação inteira para você cuidar do que importa: <span className="text-slate-200 font-medium">as famílias atendidas.</span>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold shadow-xl shadow-emerald-600/30 transition flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5" /> Agendar demonstração grátis
            </a>
            <a href="/login" className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-semibold transition">Acessar o sistema</a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-12 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Sem instalação</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Dados criptografados</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Suporte em português</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Multiempresa</span>
          </div>
        </div>
      </section>

      <section id="recursos" className="max-w-6xl mx-auto px-5 py-20 border-t border-white/5">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Tudo o que sua operação precisa</h2>
          <p className="text-slate-400 mt-3 max-w-xl mx-auto">Módulos completos e integrados — nada de planilhas soltas e cadernos de plantão.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map((m) => (
            <div key={m.title} className="group rounded-2xl border border-white/8 bg-white/[0.03] p-6 hover:border-blue-500/40 hover:bg-blue-500/[0.04] transition-all duration-300">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <m.icon className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-bold text-white mb-2">{m.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{m.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="planos" className="max-w-6xl mx-auto px-5 py-20 border-t border-white/5">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Planos que crescem com você</h2>
          <p className="text-slate-400 mt-3">Mensalidade previsível, sem surpresa. Troque de plano quando quiser.</p>
        </div>
        <div className="grid lg:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((p) => (
            <div key={p.code} className={`relative rounded-2xl border p-7 flex flex-col ${p.badge ? 'border-blue-500/50 bg-gradient-to-b from-blue-500/10 to-transparent shadow-2xl shadow-blue-900/40' : 'border-white/8 bg-white/[0.03]'}`}>
              {p.badge && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold uppercase tracking-wide bg-blue-600 text-white rounded-full px-3.5 py-1 shadow-lg shadow-blue-600/40">{p.badge}</span>}
              <h3 className="font-bold text-lg text-white">{p.name}</h3>
              <p className="text-xs text-slate-400 mt-1 mb-5">{p.desc}</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold tracking-tight">{p.price}</span>
                <span className="text-slate-400 text-sm">{p.period}</span>
              </div>
              <ul className="space-y-2.5 text-sm flex-1">
                {p.items.map((i) => (
                  <li key={i} className="flex gap-2.5 text-slate-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> {i}
                  </li>
                ))}
              </ul>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className={`mt-7 text-center px-5 py-3 rounded-xl font-bold transition ${p.badge ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30' : 'bg-white/5 hover:bg-white/10 border border-white/10'}`}>
                Contratar plano {p.name}
              </a>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-500 mt-8">Limites por plano: associados e usuários monitorados automaticamente no painel. Enterprise sem limites.</p>
      </section>

      <section id="faq" className="max-w-3xl mx-auto px-5 py-20 border-t border-white/5">
        <h2 className="text-3xl font-bold tracking-tight text-center mb-10">Perguntas frequentes</h2>
        <div className="space-y-3">
          {FAQ.map((f, idx) => (
            <div key={f.q} className="rounded-xl border border-white/8 bg-white/[0.03] overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-slate-100 hover:bg-white/[0.03] transition">
                {f.q}
                <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === idx && <p className="px-5 pb-4 text-sm text-slate-400 leading-relaxed">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(37,99,235,0.2),transparent_65%)]" />
        <div className="relative max-w-4xl mx-auto px-5 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Pronto para digitalizar sua funerária?</h2>
          <p className="text-slate-400 mt-4 max-w-xl mx-auto">Fale agora com a PrimeX Sistemas, veja o sistema ao vivo e comece ainda esta semana.</p>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-8 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold shadow-xl shadow-emerald-600/30 transition">
            <MessageCircle className="w-5 h-5" /> Chamar no WhatsApp
          </a>
        </div>
      </section>

      <footer className="border-t border-white/5 bg-black/30">
        <div className="max-w-6xl mx-auto px-5 py-12 grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <HeartPulse className="w-5 h-5 text-white" />
              </div>
              <div className="leading-none">
                <span className="font-bold">Eternity<span className="text-blue-400">OS</span></span>
                <span className="block text-[10px] text-slate-400">by PrimeX Sistemas</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">Software de gestão completo para funerárias, planos funerários e serviços de assistência familiar.</p>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Phone className="w-4 h-4 text-blue-400" /> Contato</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white transition">
                  <MessageCircle className="w-4 h-4 text-emerald-500" /> (86) 98811-7925
                </a>
              </li>
              <li>
                <a href={'mailto:' + EMAIL} className="flex items-center gap-2 hover:text-white transition">
                  <Mail className="w-4 h-4 text-blue-400" /> {EMAIL}
                </a>
              </li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-500" /> Teresina - PI, Brasil</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-400" /> Acesso</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><a href="/login" className="hover:text-white transition">Entrar no sistema</a></li>
              <li><a href="#planos" className="hover:text-white transition">Ver planos</a></li>
              <li><a href="#faq" className="hover:text-white transition">Dúvidas frequentes</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 py-5 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} PrimeX Sistemas · Todos os direitos reservados
        </div>
      </footer>
    </main>
  );
}




