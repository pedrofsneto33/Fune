'use client';

import { useState } from 'react';

const plans = [
  { name: 'Essencial', price: '297', desc: 'Ideal para funerárias pequenas', features: ['Até 200 titulares', 'Gestão de contratos', 'Cobrança PIX e boleto', 'Controle de capelas', 'Suporte por e-mail'], popular: false },
  { name: 'Profissional', price: '497', desc: 'Para funerárias em crescimento', features: ['Até 1.000 titulares', 'Tudo do Essencial', 'Gestão de frota', 'Tanatopraxia', 'Dashboard financeiro', 'WhatsApp integrado', 'Até 5 usuários'], popular: true },
  { name: 'Enterprise', price: 'Consulta', desc: 'Para grandes operações', features: ['Titulares ilimitados', 'Tudo do Profissional', 'Multi-filiais', 'API personalizada', 'BI avançado', 'Suporte 24/7 dedicado'], popular: false },
];

const features = [
  { icon: 'M', title: 'Gestão de Titulares', desc: 'Cadastro completo de associados, dependentes e contratos. Controle de inadimplência e pagamentos.' },
  { icon: 'C', title: 'Cobranças Automatizadas', desc: 'Integração com Asaas para PIX, boleto e carnês. Geração automática de ciclos de cobrança.' },
  { icon: 'F', title: 'Frota e Logística', desc: 'Controle de veículos, motoristas e plantões 24h. Rastreamento de atendimentos.' },
  { icon: 'K', title: 'Capelas e Tanatopraxia', desc: 'Agendamento de velórios, controle de capelas e gestão completa de tanatopraxia.' },
  { icon: 'B', title: 'BI e Financeiro', desc: 'Dashboard com KPIs, DRE detalhado, reservas regulatórias e contas a pagar.' },
  { icon: 'S', title: 'Controle de Acesso', desc: 'Permissões por perfil: superadmin, admin, gerente, atendente, motorista e financeiro.' },
];

const faqs = [
  { q: 'Quanto tempo leva para implementar?', a: 'Em até 24 horas sua funerária já estará operando com todas as funcionalidades.' },
  { q: 'Preciso instalar algum software?', a: 'Não! O EternityOS é 100% na nuvem. Acesse de qualquer dispositivo com internet.' },
  { q: 'Como funciona a cobrança?', a: 'Integramos com o Asaas para gerar cobranças PIX, boleto e carnês automaticamente.' },
  { q: 'Vocês oferecem suporte?', a: 'Sim! Todos os planos incluem suporte, com opções prioritárias e dedicadas.' },
];
export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-zinc-100 font-sans">
      <header className="container mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
            <span className="text-blue-400 font-bold text-lg">E</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Eternity<span className="text-blue-400">OS</span></h1>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <a href="#features" className="text-zinc-400 hover:text-zinc-200 transition">Recursos</a>
          <a href="#pricing" className="text-zinc-400 hover:text-zinc-200 transition">Planos</a>
          <a href="#faq" className="text-zinc-400 hover:text-zinc-200 transition">FAQ</a>
          <a href="/login" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition shadow-lg shadow-blue-600/20">Acessar Sistema</a>
        </nav>
      </header>

      <main className="container mx-auto px-6 py-20 text-center">
        <div className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-semibold mb-6">
          Plataforma #1 em gestão funerária do Brasil
        </div>
        <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
          ERP Funerário <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Inteligente</span> e Integrado
        </h2>
        <p className="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto mb-10 leading-relaxed">
          Gestão completa para empresas funerárias e planos de assistência. Automatize cobranças,
          controle frota e capelas, gerencie titulares e tome decisões com dados.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/login" className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-lg shadow-blue-600/20 text-lg">Começar Agora</a>
          <a href="#features" className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition text-lg">Ver Recursos</a>
        </div>
      </main>
<section id="features" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-4xl font-extrabold mb-4">Tudo que sua funerária precisa</h3>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Uma plataforma completa com todos os módulos para gerenciar sua operação com eficiência.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((f, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-blue-500/30 transition group">
              <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 font-bold text-xl mb-4">
                {f.icon}
              </div>
              <h4 className="font-bold text-white text-lg mb-2 group-hover:text-blue-400 transition">{f.title}</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-4xl font-extrabold mb-4">Planos para todos os tamanhos</h3>
          <p className="text-zinc-400">Escolha o plano ideal para sua funerária.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <div key={i} className={`relative bg-slate-900/50 border rounded-2xl p-8 ${plan.popular ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-slate-800'}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 rounded-full text-xs font-bold">MAIS POPULAR</div>
              )}
              <h4 className="text-xl font-bold text-white mb-2">{plan.name}</h4>
              <p className="text-sm text-zinc-400 mb-6">{plan.desc}</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-white">R${plan.price}</span>
                {plan.price !== 'Consulta' && <span className="text-zinc-400">/mês</span>}
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feat, fi) => (
                  <li key={fi} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    {feat}
                  </li>
                ))}
              </ul>
              <a href="/login" className={`block w-full py-3 rounded-xl text-center font-bold transition ${plan.popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}>
                {plan.popular ? 'Escolher Profissional' : `Escolher ${plan.name}`}
              </a>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="container mx-auto px-6 py-20">
        <h3 className="text-3xl md:text-4xl font-extrabold text-center mb-16">Perguntas Frequentes</h3>
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-800/50 transition"
              >
                <span className="font-semibold text-white">{faq.q}</span>
                <span className="text-blue-400 text-xl">{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && (
                <div className="px-6 pb-4 text-sm text-zinc-400 leading-relaxed">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-800 py-12">
        <div className="container mx-auto px-6 text-center text-sm text-zinc-500">
          <p>© {new Date().getFullYear()} EternityOS — Sistema de Gestão Funerária e Planos de Assistência</p>
          <p className="mt-2">Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}