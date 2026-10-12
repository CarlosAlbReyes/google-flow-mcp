// Driver de línea de comandos para generar un clip de vídeo en Flow sin pasar
// por la capa MCP. Útil para probar el pipeline o generar por lotes desde un script.
//
//   node run-clip.mjs <id> <modelo> <duración> "<prompt>"
//
//   modelo    lite | fast | quality | flash   (o el nombre exacto de Flow)
//   duración  4s | 6s | 8s | 10s   (los modelos Veo la ignoran: es fija)
//
// El proyecto/campaña de destino salen de FLOW_PROJECT y FLOW_CAMPAIGN.
import { launchKiaraProfile, navigateToFlow } from './src/browser/launch-profile.js';
import { getPage, setBrowser } from './src/browser/connect.js';
import { handleGenerateVideo } from './src/tools/generate-video.js';

const [, , id, model = 'fast', duration = '6s', ...rest] = process.argv;
const prompt = rest.join(' ');

if (!id || !prompt) {
  console.error('uso: node run-clip.mjs <id> <modelo> <duración> "<prompt>"');
  process.exit(1);
}

const projectName = process.env.FLOW_PROJECT || 'MCP clips';
const campaign = process.env.FLOW_CAMPAIGN || 'mcp-clips';

console.error(`\n=== CLIP ${id} | modelo=${model} | ${duration} | 16:9 ===`);
console.error(`proyecto: ${projectName}`);
console.error(`prompt: ${prompt.slice(0, 160)}...\n`);

const res = await launchKiaraProfile(false);
if (res.browser) setBrowser(res.browser);
const page = getPage();
await navigateToFlow(page);

const out = await handleGenerateVideo({
  prompt,
  model,
  duration,
  ratio: '16:9',
  auto_confirm: true,
  project_name: projectName,
  campaign,
});

console.error('\n=== RESULTADO ===');
console.log(JSON.stringify(out, null, 2));
process.exit(0);
