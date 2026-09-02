import pathlib

# Fix ModalCarnets.tsx
p = pathlib.Path(r'C:\Users\User\eternitysos\src\components\modals\ModalCarnets.tsx')
c = p.read_text(encoding='utf-8')

# Replace supabase direct calls with authFetch
old1 = "const { data: activeContracts } = await supabase.from('contracts').select('id, holder_name').eq('status', 'active');"
new1 = "const res0 = await authFetch('/api/contracts?status=active'); const activeContracts = await res0.json();"
c = c.replace(old1, new1)

old2 = "await supabase.from('payment_carnets').insert(batch);"
new2 = "await authFetch('/api/payment-carnets/batch', { method: 'POST', body: JSON.stringify(batch) });"
c = c.replace(old2, new2)

p.write_text(c, encoding='utf-8')
print('Fixed ModalCarnets')

# Fix ModalContractEngine.tsx
p = pathlib.Path(r'C:\Users\User\eternitysos\src\components\modals\ModalContractEngine.tsx')
c = p.read_text(encoding='utf-8')

# Add authFetch import and replace supabase calls
c = c.replace("import { supabase } from '@/lib/supabaseClient';", "import { authFetch } from '@/lib/authFetch';")

# Replace contract creation
old3 = """const { data: contract, error: contractErr } = await supabase.from('contracts').insert([
        { holder_name: holderName, cpf: cpf, status: 'active' }
      ]).select().single();

      if (contractErr) throw contractErr;"""
new3 = """const res = await authFetch('/api/contracts', {
        method: 'POST',
        body: JSON.stringify({ holder_name: holderName, cpf, status: 'active' })
      });
      if (!res.ok) throw new Error('Erro ao criar contrato');
      const contract = await res.json();"""
c = c.replace(old3, new3)

# Replace asaas_customers insert
old4 = """await supabase.from('asaas_customers').insert([
        { contract_id: contract.id, asaas_customer_id: 'cus_' + Math.random().toString(36).substring(7), billing_type: 'BOLETO' }
      ]);"""
new4 = """await authFetch('/api/asaas/customers', {
        method: 'POST',
        body: JSON.stringify({ contract_id: contract.id, billing_type: 'BOLETO' })
      });"""
c = c.replace(old4, new4)

# Replace audit_logs insert
old5 = """await supabase.from('audit_logs').insert([
        { action: 'CONTRACT_AND_ASAAS_GENERATE', user_email: 'sistema@eternitysos.com', details: `Contrato gerado e faturamento Asaas configurado para ${holderName}` }
      ]);"""
new5 = """await authFetch('/api/audit-logs', {
        method: 'POST',
        body: JSON.stringify({ action: 'CONTRACT_AND_ASAAS_GENERATE', details: 'Contrato gerado e faturamento Asaas configurado para ' + holderName })
      });"""
c = c.replace(old5, new5)

p.write_text(c, encoding='utf-8')
print('Fixed ModalContractEngine')
