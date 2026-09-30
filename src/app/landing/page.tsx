import type { Metadata } from 'next';
import {
  HeartPulse, Ambulance, Flower2, Users, FileText, ShieldCheck,
  Phone, Mail, MapPin, Check, ChevronDown, Building2, Clock, MessageCircle, Truck, BarChart3, Handshake, QrCode, Wallet, ClipboardCheck,
} from 'lucide-react';
import LeadForm from '@/components/landing/LeadForm';

// Landing 100% pública e estática: Server Component puro, sem 'use client',
// sem AuthGuard, sem verificação de sessão. A única interatividade (formulário
// de leads) vive isolada em <LeadForm /> (client component filho).
export const dynamic = 'force-static';
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Eternity OS | Sistema para Funerária e Plano Funerário em Teresina - PI | ERP Funerário',
  description:
    'Pare de perder mensalidades. Controle titulares, carteirinhas com QR, guia de sepultamento e financeiro em um só lugar. Feito para funerárias do Piauí.',
  keywords: [
    'sistema para funerária',
    'ERP funerário',
    'plano funerário Teresina',
    'software funerária Piauí',
    'carteirinha digital funerária',
    'guia de sepultamento',
    'cobrança funerária PIX boleto',
    'gestão de funerária',
  ],
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Eternity OS | ERP para Funerárias em Teresina - PI',
    description:
      'Pare de perder mensalidades. Titulares, carteirinhas com QR, guia de sepultamento e financeiro em um só lugar.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'EternityOS',
  },
};

const WHATSAPP_URL = 'https://wa.me/5586988117925?text=' + encodeURIComponent('Quero ver o Eternity funcionando');
const WHATSAPP_CTA = 'Ver demonstração em 2 minutos no WhatsApp';
const EMAIL = 'pedrofsneto33@gmail.com';

const MODULES = [
  { icon: Users, title: 'Associados & Contratos', text: 'Cadastro completo de titulares e dependentes, contratos digitalizados, carnet de mensalidades e carteirinha digital com QR Code — pronta para imprimir ou compartilhar no WhatsApp.' },
  { icon: MessageCircle, title: 'Cobrança Inteligente', text: 'Gere cobranças PIX e boletos em lote via Asaas, envie mensagens de vencimento com um clique e concilie pagamentos automaticamente pelo webhook.' },
  { icon: Ambulance, title: 'Plantão 24h & Dispatch', text: 'Painel de plantão em tempo real, registro de óbitos, despacho de veículos com checklist e dedução automática de estoque (urnas, adornos e itens funerários).' },
  { icon: Flower2, title: 'Capela & Tanatopraxia', text: 'Agenda de velórios e sepultamentos, livro de capela digital e registros técnicos de tanatopraxia com rastreabilidade completa.' },
  { icon: Truck, title: 'Frota, Estoque & Convalescentes', text: 'Controle de veículos em missão, estoque de urnas e insumos com baixa automática, além do empréstimo de aparelhos convalescentes (cadeiras, muletas, camas).' },
  { icon: FileText, title: 'Financeiro, DRE & Fiscal', text: 'Contas a pagar/receber, comissões de vendedores, carnets e relatórios DRE — mais emissão de NFS-e integrada.' },
  { icon: BarChart3, title: 'Painel Executivo & BI', text: 'KPIs em tempo real: vidas cobertas, receita do mês, inadimplência, sepultamentos e catálogo de planos funerários com valores e coberturas.' },
  { icon: Handshake, title: 'Vendedores & Clube de Convênios', text: 'Gestão de vendedores com comissões e clube de convênios com parceiros locais (farmácias, clínicas, laboratórios) para valorizar o plano.' },
  { icon: ShieldCheck, title: 'Multiempresa & Segurança', text: 'Cada funerária em seu próprio ambiente isolado, com controle de acesso por perfil (RBAC), logs de auditoria e backups gerenciados.' },
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
    items: ['Até 1.000 associados ativos', 'Até 20 usuários no sistema', 'Até 8 dependentes por titular', 'Tudo do Essencial', 'Frota completa e tanatopraxia', 'Financeiro com DRE + NFS-e', 'Vendedores, convênios e BI executivo', 'Catálogo de planos + relatórios em PDF', 'Suporte prioritário'],
  },
  {
    code: 'enterprise', name: 'Enterprise', price: 'Sob consulta', period: '', badge: null as string | null,
    desc: 'Para grupos funerários com múltiplas filiais e alta demanda.',
    items: ['Associados e usuários ilimitados', 'Até 20 dependentes por titular', 'Tudo do Profissional', 'Filiais ilimitadas (multi-empresa)', 'Personalização de marca (logo e cores)', 'Integrações sob demanda', 'Gerente de conta dedicado'],
  },
];

const FAQ = [
  { q: 'Preciso instalar algo?', a: 'Não. O EternityOS é 100% online: funciona no navegador do computador ou celular. Cuidamos da hospedagem, backups e atualizações.' },
  { q: 'Quanto custa a implantação (setup)?', a: 'A implantação é cobrada à parte, como taxa única: inclui migração da sua base, configuração inicial e treinamento. O valor varia conforme o volume de dados e o escopo — peça uma proposta fechada no WhatsApp antes de assinar.' },
  { q: 'Consigo migrar meus dados atuais?', a: 'Sim. Importamos sua base de associados de planilhas (Excel/CSV) ou de outro sistema. A migração faz parte da taxa de implantação — consulte o valor conforme o volume.' },
  { q: 'A carteirinha funciona no celular?', a: 'Sim, cada associado recebe um link único e seguro com a carteirinha digital, que pode ser salva na tela inicial do celular ou impressa.' },
  { q: 'Meus dados ficam seguros?', a: 'Todos os dados são criptografados em trânsito e em repouso, com controle de acesso por perfil e logs de auditoria de todas as operações.' },
  { q: 'Posso testar antes de contratar?', a: 'Sim! Agende uma demonstração guiada pelo WhatsApp e veja o sistema funcionando com dados de exemplo da sua operação.' },
];


export default function LandingPage() {
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
              <span className="block text-[10px] text-slate-400">by PrimeX Sistemas · Teresina - PI</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-7 text-sm text-slate-300">
            <a href="#recursos" className="hover:text-white transition">Recursos</a>
            <a href="#planos" className="hover:text-white transition">Planos</a>
            <a href="#faq" className="hover:text-white transition">Dúvidas</a>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold transition shadow-lg shadow-emerald-600/25 text-white">Falar no WhatsApp</a>
          </div>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="md:hidden px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold transition text-white">Falar no WhatsApp</a>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.18),transparent_60%)]" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="relative max-w-6xl mx-auto px-5 pt-20 pb-24 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/25 rounded-full px-4 py-1.5 mb-7">
            <Clock className="w-3.5 h-3.5" /> ERP funerário · Feito em Teresina - PI
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.08]">
            Pare de perder contratos<br />
            <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-sky-400 bg-clip-text text-transparent">por falta de controle.</span>
          </h1>
          <p className="max-w-2xl mx-auto mt-6 text-slate-400 text-base md:text-lg leading-relaxed">
            ERP feito para funerária. Titulares, carteirinha digital com token seguro,
            guia de sepultamento em 30s e financeiro sem planilha.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xl shadow-emerald-600/30 transition flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5" /> {WHATSAPP_CTA}
            </a>
            <a href="#dores" className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-semibold transition">Ver dores que resolvemos</a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-12 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Sem instalação</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Dados criptografados</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Suporte em português</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Multiempresa</span>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 pb-4">
        <p className="text-center text-xs text-slate-500 max-w-2xl mx-auto">Taxa única de implantação (setup): migração da sua base, configuração inicial e treinamento são cobrados à parte — o valor depende do volume de dados e do escopo. Fale com a gente e receba uma proposta fechada antes de assinar.</p>
      </section>

      <section id="dores" className="max-w-6xl mx-auto px-5 py-20 border-t border-white/5">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">A dor de quem ainda controla no caderno</h2>
          <p className="text-slate-400 mt-3 max-w-xl mx-auto">Se você reconhece alguma cena abaixo, o EternityOS foi feito para você.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-6">
            <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
              <Wallet className="w-5 h-5 text-rose-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Mensalidade perdida</h3>
            <p className="text-sm text-slate-400 leading-relaxed">Carnê rasurado, planilha desatualizada e titular que some sem pagar. No fim do mês, ninguém sabe quem está adimplente.</p>
          </div>
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-6">
            <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
              <MessageCircle className="w-5 h-5 text-rose-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Família pedindo 2ª via no WhatsApp</h3>
            <p className="text-sm text-slate-400 leading-relaxed">Dependente na porta pedindo carteirinha nova, atendente procurando contrato em pasta e fila crescendo no balcão.</p>
          </div>
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-6">
            <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
              <ClipboardCheck className="w-5 h-5 text-rose-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Guia de sepultamento na mão na hora do enterro</h3>
            <p className="text-sm text-slate-400 leading-relaxed">Óbito de madrugada, guia preenchida à mão e erro de nome na lápide. O plantão precisa de documento pronto em 30 segundos.</p>
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

      <section className="max-w-6xl mx-auto px-5 py-20 border-t border-white/5">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">A solução: controle sem expor documento</h2>
          <p className="text-slate-400 mt-3 max-w-xl mx-auto">Os 3 diferenciais que resolvem as dores acima.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <QrCode className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Carteirinha com token rastreável (sem vazar CPF)</h3>
            <p className="text-sm text-slate-400 leading-relaxed">Link público <code className="text-slate-200">/carteirinha/&lt;cpf&gt;?t=&lt;token&gt;</code> gerado por <code className="text-slate-200">CarteirinhaButton</code>: sem token, a rota responde &quot;não localizada&quot;. Validação por QR no balcão, 2ª via no WhatsApp em segundos.</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Mesmo cliente em 2 funerárias? Sem erro de CPF.</h3>
            {/* multi-tenant: isolamento por empresa (tenant), RBAC + auditoria */}
            <p className="text-sm text-slate-400 leading-relaxed">Chega de cadastrar CPF fake. O mesmo CPF pode ter plano em empresas diferentes, cada uma vendo só os seus contratos e mensalidades. Sem misturar.</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <ClipboardCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Termo assinado + QR</h3>
            <p className="text-sm text-slate-400 leading-relaxed">Termo de adesão assinado + guia de sepultamento (<code className="text-slate-200">BurialGuide</code>) pronta em 30s: plantão registra o óbito, despacha a frota e imprime a guia completa com rastreabilidade.</p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-20 border-t border-white/5">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Criado em Teresina - PI, para funerárias de todo o Brasil</h2>
        </div>
        <div className="max-w-3xl mx-auto rounded-2xl border border-white/8 bg-white/[0.03] p-8">
          <p className="text-slate-200 leading-relaxed">Sem logos inventados. O Eternity OS já está em produção com 272 testes automatizados, carteirinha com token seguro sem expor CPF, guia de sepultamento em 30 segundos e financeiro isolado por empresa com RBAC e auditoria. Implantação acompanhada direto com o time técnico, atendimento humano, sem fidelidade e sem call center. Atendemos qualquer cidade do Brasil.</p>
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
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className={`mt-7 text-center px-5 py-3 rounded-xl font-bold transition text-white ${p.badge ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30' : 'bg-white/5 hover:bg-white/10 border border-white/10'}`}>
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
            <details key={f.q} className="group rounded-xl border border-white/8 bg-white/[0.03] overflow-hidden" open={idx === 0}>
              <summary className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-slate-100 hover:bg-white/[0.03] transition cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown className="w-4 h-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-5 pb-4 text-sm text-slate-400 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(37,99,235,0.2),transparent_65%)]" />
        <div className="relative max-w-4xl mx-auto px-5 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Pronto para digitalizar sua funerária?</h2>
          <p className="text-slate-400 mt-4 max-w-xl mx-auto">Fale agora com a PrimeX Sistemas, veja o sistema ao vivo e comece ainda esta semana.</p>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-8 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xl shadow-emerald-600/30 transition">
            <MessageCircle className="w-5 h-5" /> {WHATSAPP_CTA}
          </a>
        </div>
      </section>

      {/* CAPTURA DE LEADS → CRM interno do operador (POST /api/leads/landing) */}
      <section id="contato" className="max-w-3xl mx-auto px-5 py-20">
        <h2 className="text-2xl sm:text-3xl font-black text-white text-center mb-2">
          Quer ver o sistema funcionando?
        </h2>
        <p className="text-sm text-slate-400 text-center mb-8">
          Deixe seu contato e retornamos pelo WhatsApp com uma demonstração ao vivo — sem compromisso.
        </p>
        <LeadForm />
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
            <p className="text-sm text-slate-400 leading-relaxed">Software de gestão completo para funerárias, planos funerários e serviços de assistência familiar. Teresina - PI, Brasil.</p>
            <p className="mt-3 text-xs text-slate-500">CNPJ: 55.536.885/0001-30 — Teresina / PI</p>
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
              <li><a href="/login" className="hover:text-white transition">Área do cliente</a></li>
              <li><a href="#planos" className="hover:text-white transition">Ver planos</a></li>
              <li><a href="#faq" className="hover:text-white transition">Dúvidas frequentes</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 py-5 text-center text-xs text-slate-500">
          <div className="flex items-center justify-center gap-4 mb-2">
            <a href="/termos" className="hover:text-white transition">Termos de Uso</a>
            <a href="/privacidade" className="hover:text-white transition">Politica de Privacidade</a>
            <a href="/cookies" className="hover:text-white transition">Cookies</a>
          </div>
          © {new Date().getFullYear()} PrimeX Sistemas · Todos os direitos reservados
        </div>
      </footer>

      {/* SEO local: schema.org LocalBusiness */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'EternityOS — PrimeX Sistemas',
            description:
              'ERP para funerária e plano funerário: titulares, carteirinha digital com QR, guia de sepultamento e financeiro.',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Teresina',
              addressRegion: 'PI',
              addressCountry: 'BR',
            },
            telephone: '+55-86-98811-7925',
            email: 'pedrofsneto33@gmail.com',
            taxID: '55.536.885/0001-30',
            areaServed: 'Teresina - PI',
            url: 'https://eternitysos.com.br/landing',
          }),
        }}
      />

      {/* Botão flutuante de WhatsApp (CSS puro, sem JS): conversão mobile */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Falar no WhatsApp"
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-600/40 flex items-center justify-center transition"
      >
        <MessageCircle className="w-7 h-7 text-white" />
      </a>
    </main>
  );
}

