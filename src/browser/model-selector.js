import { logger } from '../utils/logger.js';

/**
 * Pone la barra de prompt de Flow en modo VÍDEO con el modelo y la duración
 * pedidos. El repo original nunca tocaba este selector: mandaba el prompt con
 * el modelo de imagen activo y Flow generaba imágenes.
 *
 * Camino real de la UI (verificado 2026-08-28, UI en español):
 *   chip de la barra  ->  pestaña "Vídeo"  ->  desplegable de modelo  ->  duración
 */

const CHIP = 'button:has-text("Vídeo · "), button:has-text("Nano Banana"), ' +
             'button:has-text("Veo 3.1"), button:has-text("Omni")';

async function clearOverlays(page) {
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(300);
  }
}

async function openChip(page) {
  const chip = page.locator(CHIP).first();
  await chip.waitFor({ state: 'visible', timeout: 15000 });
  await chip.click({ force: true });
  await page.waitForTimeout(1200);
  return chip;
}

/** Cambia a la pestaña Vídeo si no lo está ya. */
async function ensureVideoTab(page) {
  const inactive = page.locator('button[role="tab"][aria-selected="false"]')
    .filter({ hasText: /Vídeo|Video/ }).first();
  if (await inactive.count() > 0) {
    await inactive.click({ force: true });
    await page.waitForTimeout(1500);
    logger.info('Switched prompt bar to Vídeo tab');
    return true;
  }
  logger.info('Vídeo tab already active');
  return false;
}

/** Selecciona el modelo de vídeo por nombre exacto (ej. "Veo 3.1 - Fast"). */
async function pickModel(page, modelName) {
  const dd = page.locator('button').filter({ hasText: /arrow_drop_down/ }).first();
  if (await dd.count() === 0) { logger.warn('Model dropdown not found'); return false; }
  await dd.click({ force: true });
  await page.waitForTimeout(1800);

  // El nombre del modelo puede venir precedido de un icono ("volume_up Veo 3.1 - Fast").
  const opt = page.locator('button, [role="option"], [role="menuitem"], li')
    .filter({ hasText: new RegExp(modelName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
    .last();
  if (await opt.count() === 0) { logger.warn('Model option not found', { modelName }); return false; }
  await opt.click({ force: true });
  await page.waitForTimeout(2000);
  logger.info('Video model selected', { modelName });
  return true;
}

/** Fija la duración ("4s" | "6s" | "8s" | "10s") si la ofrece el modelo. */
async function pickDuration(page, duration) {
  const btn = page.locator('button').filter({ hasText: new RegExp(`^${duration}$`) }).first();
  if (await btn.count() === 0 || !(await btn.isVisible().catch(() => false))) {
    logger.warn('Duration not offered by this model', { duration });
    return false;
  }
  await btn.click({ force: true });
  await page.waitForTimeout(1200);
  logger.info('Duration set', { duration });
  return true;
}

/**
 * Deja la barra lista para generar vídeo. Devuelve el texto final del chip
 * para que quien llame pueda verificar/registrar lo que Flow tiene puesto.
 */
export async function setVideoMode(page, { model, duration }) {
  await clearOverlays(page);
  await openChip(page);
  await ensureVideoTab(page);
  if (model) await pickModel(page, model);
  if (duration) await pickDuration(page, duration);
  await clearOverlays(page);

  const chipText = await page.locator(CHIP).first().innerText()
    .then(t => t.replace(/\s+/g, ' ').trim())
    .catch(() => '(desconocido)');
  logger.info('Prompt bar ready', { chipText });
  return chipText;
}
