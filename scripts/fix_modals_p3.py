import pathlib

# Fix ModalFleetLogistics.tsx
p = pathlib.Path(r'C:\Users\User\eternitysos\src\components\modals\ModalFleetLogistics.tsx')
c = p.read_text(encoding='utf-8')

c = c.replace("import { supabase } from '@/lib/supabaseClient';", "import { authFetch } from '@/lib/authFetch';")

old1 = "const { error } = await supabase.from('fleet_vehicles').update({ status: 'em_missao' }).eq('plate', 'ABC-1234');"
new1 = "const res = await authFetch('/api/vehicles', { method: 'PATCH', body: JSON.stringify({ plate: 'ABC-1234', status: 'em_missao' }) });"
c = c.replace(old1, new1)

old2 = """await supabase.from('audit_logs').insert([
        { action: 'FLEET_MISSION_ASSIGN', user_email: 'plantao@eternitysos.com', details: `Veículo ${vehicle} alocado para motorista ${driver}` }
      ]);"""
new2 = """await authFetch('/api/audit-logs', {
        method: 'POST',
        body: JSON.stringify({ action: 'FLEET_MISSION_ASSIGN', details: 'Veiculo ' + vehicle + ' alocado para motorista ' + driver })
      });"""
c = c.replace(old2, new2)

p.write_text(c, encoding='utf-8')
print('Fixed ModalFleetLogistics')

# Fix ModalNotifications.tsx
p = pathlib.Path(r'C:\Users\User\eternitysos\src\components\modals\ModalNotifications.tsx')
c = p.read_text(encoding='utf-8')

c = c.replace("import { supabase } from '@/lib/supabaseClient';", "import { authFetch } from '@/lib/authFetch';")

old3 = """await new Promise(r => setTimeout(r, 1200));
      
      // Registra log do disparo
      await supabase.from('audit_logs').insert([
        { action: 'WHATSAPP_DISPATCH', user_email: 'sistema@eternitysos.com', details: `Mensagem enviada para ${phone}` }
      ]).select();"""
new3 = """const res = await authFetch('/api/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify({ phone, message })
      });
      if (!res.ok) throw new Error('Erro ao enviar via WhatsApp');"""
c = c.replace(old3, new3)

p.write_text(c, encoding='utf-8')
print('Fixed ModalNotifications')
