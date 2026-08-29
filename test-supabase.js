const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://plvrapxybhdnwmquossb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsdnJhcHh5YmhkbndtcXVvc3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MDAxNTIsImV4cCI6MjEwMzQ3NjE1Mn0.5zziRxyOMI_-eipi4-LXP2oROM0u7X_sD86NhuFoyz4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('--- TESTANDO INSERÇÃO DIRETA NO SUPABASE ---');
  
  // 1. Inserir Titular
  const { data: holder, error: hErr } = await supabase
    .from('holders')
    .insert([{ full_name: 'Titular Teste Terminal', cpf: '000.111.222-33', phone: '86999998888' }])
    .select()
    .single();

  if (hErr) {
    console.error('ERRO EM HOLDERS:', hErr.message);
    return;
  }
  console.log('✅ 1. Titular gravado com ID:', holder.id);

  // 2. Buscar Plano
  const { data: plans, error: pErr } = await supabase.from('plans').select('id, name, monthly_fee').limit(1);
  if (pErr || !plans.length) {
    console.error('ERRO EM PLANS (Tabela vazia ou bloqueada):', pErr ? pErr.message : 'Nenhum plano encontrado');
    return;
  }
  console.log('✅ 2. Plano encontrado:', plans[0].name);

  // 3. Inserir Contrato
  const { data: contract, error: cErr } = await supabase
    .from('contracts')
    .insert([{ holder_id: holder.id, plan_id: plans[0].id, status: 'active' }])
    .select()
    .single();

  if (cErr) {
    console.error('ERRO EM CONTRACTS:', cErr.message);
    return;
  }
  console.log('✅ 3. Contrato vinculado com ID:', contract.id);

  // 4. Inserir Pagamento
  const { data: payment, error: payErr } = await supabase
    .from('payments')
    .insert([{
      contract_id: contract.id,
      amount: plans[0].monthly_fee,
      due_date: '2026-09-10',
      status: 'pending',
      payment_method: 'pix'
    }])
    .select()
    .single();

  if (payErr) {
    console.error('ERRO EM PAYMENTS:', payErr.message);
    return;
  }
  console.log('✅ 4. Fatura gerada com ID:', payment.id);
  console.log('🎉 SUCESSO TOTAL: Pode abrir o Table Editor no Supabase que o registro está lá!');
}

testInsert();
