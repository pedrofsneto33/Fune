import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

// Upload de logo validado NO SERVIDOR (tamanho + magic bytes) e gravado
// com a service role — o navegador nunca mais acessa o bucket direto.
export const POST = withAuth(async (req: NextRequest, { auth }) => {
  const form = await req.formData();
  const file = form.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Arquivo ausente no upload.' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'A imagem deve ter no maximo 2MB.' }, { status: 400 });
  }

  const mime = (file.type || '').toLowerCase();
  if (!ALLOWED_TYPES.includes(mime)) {
    return NextResponse.json(
      { error: 'Formato de imagem nao suportado. Use PNG, JPEG ou WebP.' },
      { status: 400 }
    );
  }

  // Validacao de conteudo real (magic bytes) — o MIME do navegador e facil de falsificar
  const buf = Buffer.from(await file.arrayBuffer());
  const isPng =
    buf.length > 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const isJpeg = buf.length > 2 && buf[0] === 0xff && buf[1] === 0xd8;
  const isWebp =
    buf.length > 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP';

  if (!isPng && !isJpeg && !isWebp) {
    return NextResponse.json(
      { error: 'Conteudo do arquivo nao corresponde a uma imagem valida.' },
      { status: 400 }
    );
  }

  const ext = mime === 'image/png' ? 'png' : mime === 'image/jpeg' ? 'jpg' : 'webp';
  const path = `${auth.tenantId}/logo-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('tenant-logos')
    .upload(path, new Uint8Array(buf), { upsert: true, contentType: mime });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabaseAdmin.storage
    .from('tenant-logos')
    .getPublicUrl(path);

  return NextResponse.json({ url: urlData.publicUrl });
}, ['superadmin', 'admin', 'manager']);