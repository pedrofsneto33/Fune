const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL || 'https://plvrapxybhdnwmquossb.supabase.co';
// SECURITY: chave via variavel de ambiente (.env.local). Nunca commitar o valor real.
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!key) {
  console.error('ERRO: defina SUPABASE_SERVICE_ROLE_KEY no .env.local antes de rodar este script.');
  process.exit(1);
}

const sb = createClient(url, key);


async function createTables() {
  // Create service_orders table
  const { data: data1, error: error1 } = await sb.from('service_orders').select('id').limit(1);
  
  if (error1 && error1.code === 'PGRST205') {
    console.log('service_orders table does not exist. Please run this SQL in Supabase Dashboard:');
    console.log('');
    console.log(`CREATE TABLE IF NOT EXISTS service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  burial_id uuid REFERENCES chapel_burials(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  deceased_name text NOT NULL,
  deceased_type text NOT NULL CHECK (deceased_type IN ('holder', 'dependent')),
  deceased_id uuid NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  burial_date timestamptz,
  cemetery_location text,
  notes text,
  total_amount numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);`);
    console.log('');
    console.log(`CREATE TABLE IF NOT EXISTS service_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE,
  inventory_id uuid REFERENCES inventory(id) ON DELETE SET NULL,
  quantity integer DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);`);
    console.log('');
    console.log('Indexes:');
    console.log('CREATE INDEX IF NOT EXISTS idx_service_orders_tenant ON service_orders(tenant_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_service_orders_contract ON service_orders(contract_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_service_orders_burial ON service_orders(burial_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_service_order_items_service ON service_order_items(service_order_id);');
  } else if (error1) {
    console.log('Error checking table:', error1);
  } else {
    console.log('service_orders table already exists');
  }
}

createTables();
