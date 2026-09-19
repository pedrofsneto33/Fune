import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Faltam vars: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: "public" },
});

const commit = process.argv.includes("--commit");

const RE_RATING = /Rating:\s*([\d.]+)/;
const RE_REVIEWS = /Reviews:\s*(\d+)/;
const RE_ADDRESS = /Endereco:\s*(.+?)(?:\s*\|\s*Site:|$)/;
const RE_WEBSITE = /Site:\s*(https?:\/\/\S+)/;

async function main() {
  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, name, notes")
    .like("notes", "Rating:%")
    .is("rating", null);

  if (error) {
    console.error("Erro ao buscar leads:", error.message);
    process.exit(1);
  }

  if (!leads || leads.length === 0) {
    console.log("Nenhum lead com notes parseavel e rating NULL.");
    return;
  }

  console.log(`Modo: ${commit ? "COMMIT (executando ALTERACOES)" : "DRY-RUN (sem alteracoes)"}\n`);
  console.log(`Leads encontrados: ${leads.length}\n`);

  let updated = 0;
  let noMatch = 0;

  for (const lead of leads) {
    const notes = lead.notes || "";
    const ratingMatch = notes.match(RE_RATING);
    const reviewsMatch = notes.match(RE_REVIEWS);
    const addressMatch = notes.match(RE_ADDRESS);
    const websiteMatch = notes.match(RE_WEBSITE);

    const rating = ratingMatch ? Number(ratingMatch[1]) : null;
    const reviews_count = reviewsMatch ? Number(reviewsMatch[1]) : null;
    const address = addressMatch ? addressMatch[1].trim() : null;
    const website = websiteMatch ? websiteMatch[1] : null;

    const parsed = rating !== null || reviews_count !== null || address !== null || website !== null;

    if (!parsed) {
      console.log(`[${lead.name}] — sem match nos campos`);
      noMatch++;
      continue;
    }

    console.log(`[${lead.name}]`);
    if (rating !== null) console.log(`  rating        = ${rating}`);
    if (reviews_count !== null) console.log(`  reviews_count = ${reviews_count}`);
    if (address !== null) console.log(`  address       = ${address}`);
    if (website !== null) console.log(`  website       = ${website}`);

    if (commit) {
      const { error: updError } = await supabase
        .from("leads")
        .update({ rating, reviews_count, address, website })
        .eq("id", lead.id);

      if (updError) {
        console.error(`  ERRO: ${updError.message}`);
      } else {
        console.log(`  -> ATUALIZADO`);
        updated++;
      }
    } else {
      console.log(`  -> (dry-run, pule se usar --commit)`);
      updated++;
    }
    console.log("");
  }

  console.log("--- Resumo ---");
  console.log(`Total leads processados: ${leads.length}`);
  console.log(`Com match (atualizados em dry-run): ${updated}`);
  console.log(`Sem match: ${noMatch}`);
  console.log(`Com match mas sem commit: ${commit ? "N/A" : updated}`);
}

main().catch(console.error);
