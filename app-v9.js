'use strict';

const SIZE_PRESETS = [
  { id: 'etsy_listing', label: 'Etsy Listing — 2000 × 2000', w: 2000, h: 2000 },
  { id: 'etsy_banner', label: 'Etsy Big Banner — 1600 × 400', w: 1600, h: 400 },
  { id: 'etsy_receipt', label: 'Etsy Receipt Banner — 760 × 100', w: 760, h: 100 },
  { id: 'blog_feature', label: 'Blog Feature — 1200 × 630', w: 1200, h: 630 },
  { id: 'blog_wide', label: 'Blog Wide Hero — 1600 × 900', w: 1600, h: 900 },
  { id: 'facebook_story', label: 'Facebook Story — 1080 × 1920', w: 1080, h: 1920 },
  { id: 'facebook_square', label: 'Facebook Page/Group — 1080 × 1080', w: 1080, h: 1080 },
  { id: 'facebook_link', label: 'Facebook Link Preview — 1200 × 630', w: 1200, h: 630 },
  { id: 'linkedin_post', label: 'LinkedIn Post — 1200 × 1200', w: 1200, h: 1200 },
  { id: 'linkedin_preview', label: 'LinkedIn Link Preview — 1200 × 627', w: 1200, h: 627 },
  { id: 'pinterest_pin', label: 'Pinterest Pin — 1000 × 1500', w: 1000, h: 1500 },
  { id: 'youtube_thumb', label: 'YouTube Thumbnail — 1280 × 720', w: 1280, h: 720 },
  { id: 'custom', label: 'Custom Size — enter width & height', w: null, h: null }
];

const els = {};
const state = { references: [], generated: [], lastPromptValues: [], errors: [] };

window.addEventListener('DOMContentLoaded', () => {
  bindElements();
  populateSizePresets();
  bindEvents();
  applyPreset('etsy_listing');
  updateOverlayPresetDefaults(false);
  updatePromptBoxes();
  clearVisibleError();
  log('Pollinations base-image mode loaded. Auto overlay builder is active.');
});

function bindElements() {
  Object.assign(els, {
    imageCount: document.getElementById('imageCount'),
    sizePreset: document.getElementById('sizePreset'),
    widthInput: document.getElementById('widthInput'),
    heightInput: document.getElementById('heightInput'),
    sizeBadge: document.getElementById('sizeBadge'),
    modelSelect: document.getElementById('modelSelect'),
    formatSelect: document.getElementById('formatSelect'),
    referenceInput: document.getElementById('referenceInput'),
    referencePreview: document.getElementById('referencePreview'),
    refCount: document.getElementById('refCount'),
    autoEnhance: document.getElementById('autoEnhance'),
    strictResize: document.getElementById('strictResize'),
    seoFilenames: document.getElementById('seoFilenames'),
    overlayEnabled: document.getElementById('overlayEnabled'),
    overlayPreset: document.getElementById('overlayPreset'),
    overlayHeading: document.getElementById('overlayHeading'),
    overlaySubheading: document.getElementById('overlaySubheading'),
    overlayMetrics: document.getElementById('overlayMetrics'),
    promptList: document.getElementById('promptList'),
    promptCountBadge: document.getElementById('promptCountBadge'),
    generateBtn: document.getElementById('generateBtn'),
    retryFailedBtn: document.getElementById('retryFailedBtn'),
    downloadZipBtn: document.getElementById('downloadZipBtn'),
    progressTitle: document.getElementById('progressTitle'),
    progressMeta: document.getElementById('progressMeta'),
    progressBar: document.getElementById('progressBar'),
    logBox: document.getElementById('logBox'),
    resultsGrid: document.getElementById('resultsGrid'),
    resultCount: document.getElementById('resultCount'),
    errorPanel: document.getElementById('errorPanel'),
    errorTitle: document.getElementById('errorTitle'),
    errorSubtitle: document.getElementById('errorSubtitle'),
    errorMessage: document.getElementById('errorMessage')
  });
}

function populateSizePresets() {
  els.sizePreset.innerHTML = SIZE_PRESETS.map(p => `<option value="${p.id}">${p.label}</option>`).join('');
  els.sizePreset.value = 'etsy_listing';
}

function bindEvents() {
  els.imageCount.addEventListener('input', () => {
    clearFieldError(els.imageCount);
    state.lastPromptValues = collectPromptValues();
    let count = parseInt(els.imageCount.value, 10);
    if (count > 50) {
      els.imageCount.value = '50';
      showVisibleError('Maximum limit applied', 'Maximum 50 image prompt boxes allowed in one browser batch.', 'Generate images in smaller batches for stability.');
    }
    updatePromptBoxes();
    updateRetryButton();
  });
  els.sizePreset.addEventListener('change', () => { clearFieldError(els.sizePreset); applyPreset(els.sizePreset.value); });
  els.widthInput.addEventListener('input', () => { clearFieldError(els.widthInput); updateSizeBadge(); });
  els.heightInput.addEventListener('input', () => { clearFieldError(els.heightInput); updateSizeBadge(); });
  els.referenceInput.addEventListener('change', handleReferenceUpload);
  els.generateBtn.addEventListener('click', generateImages);
  els.retryFailedBtn.addEventListener('click', retryFailedImages);
  els.downloadZipBtn.addEventListener('click', downloadZip);
  els.overlayPreset?.addEventListener('change', updateOverlayPresetDefaults);
}

function applyPreset(id) {
  const preset = SIZE_PRESETS.find(p => p.id === id) || SIZE_PRESETS[0];
  if (preset.id === 'custom') {
    els.widthInput.value = '';
    els.heightInput.value = '';
    els.widthInput.readOnly = false;
    els.heightInput.readOnly = false;
    log('Custom size selected. Enter width and height.');
  } else {
    els.widthInput.value = preset.w;
    els.heightInput.value = preset.h;
    els.widthInput.readOnly = true;
    els.heightInput.readOnly = true;
  }
  updateSizeBadge();
}

function updateSizeBadge() {
  const w = parseInt(els.widthInput.value, 10);
  const h = parseInt(els.heightInput.value, 10);
  els.sizeBadge.textContent = w && h ? `${w} × ${h}` : 'Custom size';
}

function updatePromptBoxes() {
  const count = parseInt(els.imageCount.value, 10);
  if (!count || count < 1) {
    els.promptList.classList.add('empty-state');
    els.promptList.innerHTML = '<div class="empty-card"><strong>No prompt boxes yet.</strong><span>Enter image count in Setup.</span></div>';
    els.promptCountBadge.textContent = '0 prompts';
    return;
  }
  const values = collectPromptValues().length ? collectPromptValues() : state.lastPromptValues;
  els.promptList.classList.remove('empty-state');
  els.promptList.innerHTML = Array.from({ length: count }, (_, i) => `
    <article class="prompt-card">
      <div class="prompt-card-head"><strong>Image ${i + 1}</strong><span class="prompt-status" data-status-for="${i}">Prompt required</span></div>
      <textarea class="prompt-input" data-index="${i}" placeholder="Describe image ${i + 1}... Example: ultra realistic dark engineering website hero, modern American house, roof pitch calculator UI overlays, blueprint lines, no text">${escapeHtml(values[i] || '')}</textarea>
    </article>`).join('');
  els.promptCountBadge.textContent = `${count} prompt${count === 1 ? '' : 's'}`;
  document.querySelectorAll('.prompt-input').forEach(input => {
    input.addEventListener('input', () => { clearPromptError(input); updatePromptStatus(input); });
    updatePromptStatus(input);
  });
}

function updatePromptStatus(input) {
  const status = document.querySelector(`[data-status-for="${input.dataset.index}"]`);
  if (!status) return;
  const ok = input.value.trim().length > 0;
  status.textContent = ok ? 'Ready' : 'Prompt required';
  status.classList.toggle('ok', ok);
  status.classList.toggle('bad', !ok);
}

function collectPromptValues() {
  return Array.from(document.querySelectorAll('.prompt-input')).map(el => el.value);
}

async function handleReferenceUpload(event) {
  const files = Array.from(event.target.files || []);
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    if (file.size > 12 * 1024 * 1024) {
      showVisibleError('Reference skipped', `${file.name} is larger than 12MB.`, 'Use a smaller image.');
      continue;
    }
    const dataUrl = await fileToDataUrl(file);
    state.references.push({ id: cryptoRandomId(), name: file.name, type: file.type, dataUrl });
  }
  event.target.value = '';
  renderReferences();
  log(`${state.references.length} reference image(s) added for preview only. Free mode is prompt-only.`);
}

function renderReferences() {
  els.refCount.textContent = `${state.references.length} refs`;
  els.referencePreview.innerHTML = state.references.map(ref => `
    <div class="ref-thumb" title="${escapeHtml(ref.name)}"><img src="${ref.dataUrl}" alt="Reference preview" /><button type="button" data-remove-ref="${ref.id}">×</button></div>`).join('');
  document.querySelectorAll('[data-remove-ref]').forEach(btn => btn.addEventListener('click', () => {
    state.references = state.references.filter(ref => ref.id !== btn.dataset.removeRef);
    renderReferences();
  }));
}

function validateInputs(options = {}) {
  const count = parseInt(els.imageCount.value, 10);
  const width = parseInt(els.widthInput.value, 10);
  const height = parseInt(els.heightInput.value, 10);
  const prompts = collectPromptValues().map(p => p.trim());
  if (!count || count < 1) throw makeValidationError('Enter how many images you want first.', els.imageCount);
  if (count > 50) throw makeValidationError('Maximum 50 images allowed in one batch.', els.imageCount);
  if (prompts.length !== count) throw makeValidationError('Prompt boxes are not ready. Re-enter image count.', els.imageCount);
  if (!width || width < 64) throw makeValidationError('Enter a valid width. Minimum width is 64px.', els.widthInput);
  if (!height || height < 64) throw makeValidationError('Enter a valid height. Minimum height is 64px.', els.heightInput);
  if (width > 4096 || height > 4096) throw makeValidationError('Maximum output size is 4096 × 4096.', width > 4096 ? els.widthInput : els.heightInput);
  const indexes = options.onlyIndexes || prompts.map((_, i) => i);
  for (const i of indexes) {
    if (!prompts[i]) throw makeValidationError(`Prompt missing for Image ${i + 1}.`, document.querySelector(`.prompt-input[data-index="${i}"]`));
  }
  return { count, width, height, prompts };
}

async function generateImages() {
  clearVisibleError();
  clearAllFieldErrors();
  state.errors = [];
  try {
    const setup = validateInputs();
    state.generated = [];
    renderResults();
    setButtonsBusy(true);
    setProgress(0, setup.count, 'Generating...');
    log(`Starting ${setup.count} Pollinations image generation(s) at ${setup.width} × ${setup.height}px.`);
    for (let i = 0; i < setup.prompts.length; i++) await generateAtIndex(i, setup.prompts[i], setup.width, setup.height, setup.count);
    finishGeneration(setup.count);
  } catch (error) { handleTopLevelError(error, 'Could not start generation'); }
  finally { setButtonsBusy(false); updateRetryButton(); }
}

async function retryFailedImages() {
  clearVisibleError();
  clearAllFieldErrors();
  state.errors = [];
  try {
    const failedIndexes = state.generated.map((item, i) => item?.error ? i : -1).filter(i => i >= 0);
    if (!failedIndexes.length) throw makeValidationError('No failed images to retry.', null);
    const setup = validateInputs({ onlyIndexes: failedIndexes });
    setButtonsBusy(true);
    setProgress(0, failedIndexes.length, 'Retrying failed images...');
    for (let step = 0; step < failedIndexes.length; step++) await generateAtIndex(failedIndexes[step], setup.prompts[failedIndexes[step]], setup.width, setup.height, failedIndexes.length, step);
    finishGeneration(parseInt(els.imageCount.value, 10));
  } catch (error) { handleTopLevelError(error, 'Could not retry failed images'); }
  finally { setButtonsBusy(false); updateRetryButton(); }
}

async function generateAtIndex(index, prompt, width, height, total, stepOverride = null) {
  const step = stepOverride ?? index;
  setProgress(step, total, `Generating image ${index + 1}...`);
  log(`Image ${index + 1}: sending prompt to Pollinations...`);
  try {
    const generated = await generateSingleImage({ prompt, index, width, height });
    state.generated[index] = generated;
    renderResults();
    log(`Image ${index + 1}: done (${width} × ${height}).`);
  } catch (error) {
    const message = cleanError(error);
    state.generated[index] = makeFailedResult(prompt, index, width, height, error);
    state.errors.push({ image: index + 1, message });
    renderResults();
    showVisibleError(`Image ${index + 1} failed`, message, 'Retry this image or simplify the prompt. Free providers can fail during high traffic.');
    log(`Image ${index + 1}: failed — ${message}`);
  }
  setProgress(step + 1, total, `Generated ${step + 1} of ${total}`);
}

async function generateSingleImage({ prompt, index, width, height }) {
  const model = els.modelSelect.value || 'flux';
  const promptForAI = buildPremiumPrompt(prompt, width, height);
  const url = buildPollinationsUrl(promptForAI, width, height, model, index);
  const source = await fetchImageAsDataUrl(url);
  const format = els.formatSelect.value;
  let dataUrl = els.strictResize.checked ? await resizeToExact(source, width, height, format) : await normalizeImageSource(source, format);

  if (els.overlayEnabled && els.overlayEnabled.checked) {
    dataUrl = await applyEngineeringOverlay(dataUrl, width, height, format, index, prompt);
  }

  return { prompt, filename: buildFilename(prompt, index, width, height, format), dataUrl, width, height, format, error: null, provider: 'pollinations+overlay' };
}

function buildPollinationsUrl(prompt, width, height, model, index) {
  const seed = Math.abs(hashString(`${prompt}-${width}-${height}-${model}-${Date.now()}-${index}`));
  const params = new URLSearchParams({ width: String(width), height: String(height), model, seed: String(seed), nologo: 'true', private: 'true', safe: 'true', enhance: 'false' });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params.toString()}`;
}

function buildPremiumPrompt(userPrompt, width, height) {
  if (!els.autoEnhance.checked) return `${userPrompt}

IMPORTANT: Generate a clean base background only. Do not create any readable text, labels, UI panels, dashboards, numbers, logos, or watermarks.`;

  return `${userPrompt}

Generate ONLY the clean realistic base image/background. Do not create any readable text, letters, labels, dashboard panels, calculator UI, numbers, badges, logos, or watermarks. Leave clean breathing room around the top and edges for software overlay text that will be added later. Make the house/roof/background photorealistic, premium, sharp, believable, natural lighting, realistic materials, clean professional composition, no fake typography, no gibberish, no cartoon style, no overprocessed AI glow. Fit exactly the selected ${width} by ${height} aspect ratio.`;
}


function updateOverlayPresetDefaults(overwrite = true) {
  if (!els.overlayPreset) return;
  const preset = els.overlayPreset.value;
  const defaults = {
    roof_pitch: {
      heading: 'Build Smarter. Estimate Faster.',
      sub: 'RoofPitchCalculators.com',
      metrics: `Roof Pitch | 6 / 12
Roof Angle | 26.57°
Roof Area | 1,562 sq ft
Roofing Squares | 15.62
Cost Estimate | $18,560
Rafter Length | 16' - 7 3/4"`
    },
    roof_cost: {
      heading: 'Estimate Roof Costs with Confidence.',
      sub: 'Roof Cost Calculator',
      metrics: `Total Estimate | $18,560
Roof Area | 1,562 sq ft
Roofing Squares | 15.62
Material Cost | $9,820
Labor Estimate | $6,450
Timeline | 2 - 4 days`
    },
    roof_framing: {
      heading: 'Understand Roof Framing Visually.',
      sub: 'Roof Framing Guide',
      metrics: `Common Rafter | 16' - 7 3/4"
Ridge Length | 32' - 6"
Roof Pitch | 6 / 12
Roof Angle | 26.57°
Roof Area | 1,562 sq ft
Span | 28 ft`
    },
    clean_cards: {
      heading: 'Plan Better Roofing Projects.',
      sub: 'RoofPitchCalculators.com',
      metrics: `Roof Area | 1,562 sq ft
Pitch | 6 / 12
Angle | 26.57°
Squares | 15.62
Estimate | $18,560
Report | Ready`
    }
  };
  const d = defaults[preset] || defaults.roof_pitch;
  if (overwrite || !els.overlayHeading.value.trim()) els.overlayHeading.value = d.heading;
  if (overwrite || !els.overlaySubheading.value.trim()) els.overlaySubheading.value = d.sub;
  if (overwrite || !els.overlayMetrics.value.trim()) els.overlayMetrics.value = d.metrics;
}

function parseOverlayMetrics() {
  const raw = els.overlayMetrics?.value || '';
  return raw.split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split('|');
      if (parts.length >= 2) return { label: parts[0].trim(), value: parts.slice(1).join('|').trim() };
      return { label: 'Metric', value: line.trim() };
    })
    .filter(item => item.label || item.value)
    .slice(0, 8);
}

async function applyEngineeringOverlay(src, width, height, mime, index, prompt) {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(img, 0, 0, width, height);

  drawHeroVignette(ctx, width, height);
  drawBlueprintLayer(ctx, width, height);
  drawHeaderOverlay(ctx, width, height);
  drawMetricCards(ctx, width, height, parseOverlayMetrics());
  drawCalculatorPanel(ctx, width, height);
  drawSubtleBrandBadge(ctx, width, height);

  return canvas.toDataURL(mime, mime === 'image/jpeg' ? 0.92 : 0.96);
}

function drawHeroVignette(ctx, w, h) {
  const top = ctx.createLinearGradient(0, 0, 0, h);
  top.addColorStop(0, 'rgba(3,7,18,0.72)');
  top.addColorStop(0.22, 'rgba(3,7,18,0.18)');
  top.addColorStop(0.72, 'rgba(3,7,18,0.08)');
  top.addColorStop(1, 'rgba(3,7,18,0.74)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, w, h);

  const side = ctx.createLinearGradient(0, 0, w, 0);
  side.addColorStop(0, 'rgba(3,7,18,0.62)');
  side.addColorStop(0.26, 'rgba(3,7,18,0.05)');
  side.addColorStop(0.74, 'rgba(3,7,18,0.05)');
  side.addColorStop(1, 'rgba(3,7,18,0.66)');
  ctx.fillStyle = side;
  ctx.fillRect(0, 0, w, h);
}

function drawBlueprintLayer(ctx, w, h) {
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.42)';
  ctx.lineWidth = Math.max(1, w / 1600);
  const gap = Math.max(48, w / 18);
  for (let x = -gap; x < w + gap; x += gap) {
    ctx.beginPath(); ctx.moveTo(x, h * 0.08); ctx.lineTo(x + w * 0.18, h * 0.94); ctx.stroke();
  }
  for (let y = h * 0.12; y < h; y += gap) {
    ctx.beginPath(); ctx.moveTo(w * 0.04, y); ctx.lineTo(w * 0.96, y - h * 0.08); ctx.stroke();
  }
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = 'rgba(245,158,11,0.46)';
  drawLineWithDot(ctx, w*0.30, h*0.34, w*0.13, h*0.30);
  drawLineWithDot(ctx, w*0.58, h*0.28, w*0.86, h*0.24);
  drawLineWithDot(ctx, w*0.54, h*0.48, w*0.86, h*0.46);
  ctx.restore();
}

function drawHeaderOverlay(ctx, w, h) {
  const heading = (els.overlayHeading?.value || 'Build Smarter. Estimate Faster.').trim();
  const fontSize = clamp(w * 0.043, 28, 62);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `800 ${fontSize}px Inter, Arial, sans-serif`;
  const parts = splitHeading(heading);
  const y = Math.max(20, h * 0.045);
  if (parts.highlight) {
    const gap = fontSize * 0.22;
    const leftW = ctx.measureText(parts.left).width;
    const hiW = ctx.measureText(parts.highlight).width;
    const total = leftW + gap + hiW;
    const start = w/2 - total/2;
    ctx.fillStyle = 'rgba(248,250,252,0.96)';
    ctx.fillText(parts.left, start + leftW/2, y);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(parts.highlight, start + leftW + gap + hiW/2, y);
  } else {
    ctx.fillStyle = 'rgba(248,250,252,0.96)';
    ctx.fillText(heading, w/2, y);
  }

  const sub = (els.overlaySubheading?.value || '').trim();
  if (sub) {
    const subSize = clamp(w * 0.014, 11, 18);
    ctx.font = `700 ${subSize}px Inter, Arial, sans-serif`;
    ctx.fillStyle = 'rgba(226,232,240,0.80)';
    ctx.fillText(sub, w/2, y + fontSize + 8);
  }
  ctx.restore();
}

function splitHeading(text) {
  const parts = text.split('.');
  if (parts.length >= 2 && text.includes('.')) {
    return { left: parts[0].trim() + '.', highlight: parts.slice(1).join('.').trim() };
  }
  const words = text.trim().split(/\s+/);
  if (words.length > 2) return { left: words.slice(0, -2).join(' '), highlight: words.slice(-2).join(' ') };
  return { left: text, highlight: '' };
}

function drawMetricCards(ctx, w, h, metrics) {
  if (!metrics.length) return;
  const landscape = w >= h;
  const cardW = landscape ? clamp(w * 0.215, 190, 320) : clamp(w * 0.38, 170, 260);
  const cardH = landscape ? clamp(h * 0.105, 62, 98) : clamp(h * 0.075, 58, 84);
  const gap = clamp(h * 0.022, 10, 22);
  const margin = clamp(w * 0.022, 18, 38);
  const topY = landscape ? h * 0.18 : h * 0.15;
  const leftMetrics = metrics.slice(0, 3);
  const rightMetrics = metrics.slice(3, 6);

  leftMetrics.forEach((m, i) => {
    drawMetricCard(ctx, margin, topY + i * (cardH + gap), cardW, cardH, m, i);
  });

  rightMetrics.forEach((m, i) => {
    drawMetricCard(ctx, w - margin - cardW, topY + i * (cardH + gap), cardW, cardH, m, i + 3);
  });

  if (!landscape && metrics[6]) drawMetricCard(ctx, margin, h - margin - cardH, cardW, cardH, metrics[6], 6);
}

function drawMetricCard(ctx, x, y, w, h, metric, idx) {
  ctx.save();
  roundedRect(ctx, x, y, w, h, Math.min(18, h*0.24));
  const grad = ctx.createLinearGradient(x, y, x+w, y+h);
  grad.addColorStop(0, 'rgba(15,23,42,0.76)');
  grad.addColorStop(1, 'rgba(15,23,42,0.48)');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(226,232,240,0.22)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  const iconSize = h * 0.38;
  ctx.strokeStyle = 'rgba(245,158,11,0.88)';
  ctx.lineWidth = 2;
  const ix = x + h * 0.30, iy = y + h * 0.30;
  drawSimpleIcon(ctx, ix, iy, iconSize, idx);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = `800 ${clamp(h*0.18, 11, 15)}px Inter, Arial, sans-serif`;
  ctx.fillStyle = 'rgba(226,232,240,0.86)';
  ctx.fillText(String(metric.label || '').toUpperCase(), x + h * 0.88, y + h * 0.20, w - h);

  ctx.font = `900 ${clamp(h*0.30, 18, 30)}px Inter, Arial, sans-serif`;
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(String(metric.value || ''), x + h * 0.88, y + h * 0.47, w - h);
  ctx.restore();
}

function drawSimpleIcon(ctx, x, y, s, idx) {
  ctx.save();
  ctx.beginPath();
  if (idx % 4 === 0) {
    ctx.moveTo(x, y+s); ctx.lineTo(x+s*0.5, y); ctx.lineTo(x+s, y+s); ctx.closePath();
  } else if (idx % 4 === 1) {
    ctx.arc(x+s/2, y+s/2, s/2, Math.PI, Math.PI*2); ctx.moveTo(x+s/2, y+s/2); ctx.lineTo(x+s*0.86, y+s*0.18);
  } else if (idx % 4 === 2) {
    ctx.rect(x, y+s*0.18, s, s*0.64); ctx.moveTo(x+s*0.18,y+s*0.18); ctx.lineTo(x+s*0.18,y+s*0.82); ctx.moveTo(x+s*0.5,y+s*0.18); ctx.lineTo(x+s*0.5,y+s*0.82); ctx.moveTo(x+s*0.82,y+s*0.18); ctx.lineTo(x+s*0.82,y+s*0.82);
  } else {
    ctx.moveTo(x, y+s*0.65); ctx.lineTo(x+s*0.30, y+s*0.35); ctx.lineTo(x+s*0.58, y+s*0.55); ctx.lineTo(x+s, y+s*0.12);
  }
  ctx.stroke();
  ctx.restore();
}

function drawCalculatorPanel(ctx, w, h) {
  if (w < 900 || h < 520) return;
  const panelW = clamp(w * 0.19, 190, 280);
  const panelH = clamp(h * 0.19, 110, 170);
  const x = w * 0.5 - panelW * 0.12;
  const y = h - panelH - h * 0.06;
  ctx.save();
  roundedRect(ctx, x, y, panelW, panelH, 18);
  ctx.fillStyle = 'rgba(15,23,42,0.70)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(226,232,240,0.22)';
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(248,250,252,0.92)';
  ctx.font = `800 ${clamp(panelH*0.10, 11, 15)}px Inter, Arial, sans-serif`;
  ctx.fillText('CALCULATOR', x + 16, y + 14);

  const rows = [['Pitch', '6 / 12'], ['Area', '1,562 sq ft'], ['Squares', '15.62']];
  const rowH = (panelH - 60) / 3;
  rows.forEach((r, i) => {
    const yy = y + 42 + i*rowH;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundedRect(ctx, x+14, yy, panelW-28, rowH-8, 8); ctx.fill();
    ctx.fillStyle = 'rgba(203,213,225,0.78)';
    ctx.font = `700 ${clamp(panelH*0.075, 10, 13)}px Inter, Arial, sans-serif`;
    ctx.fillText(r[0], x+24, yy+8);
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'right';
    ctx.fillText(r[1], x+panelW-24, yy+8);
    ctx.textAlign = 'left';
  });

  ctx.fillStyle = '#f59e0b';
  roundedRect(ctx, x+14, y+panelH-38, panelW-28, 26, 8); ctx.fill();
  ctx.fillStyle = '#111827';
  ctx.textAlign = 'center';
  ctx.font = `900 ${clamp(panelH*0.07, 10, 12)}px Inter, Arial, sans-serif`;
  ctx.fillText('CALCULATE', x+panelW/2, y+panelH-32);
  ctx.restore();
}

function drawSubtleBrandBadge(ctx, w, h) {
  const text = (els.overlaySubheading?.value || 'RoofPitchCalculators.com').trim();
  if (!text) return;
  const fs = clamp(w*0.012, 10, 14);
  ctx.save();
  ctx.font = `800 ${fs}px Inter, Arial, sans-serif`;
  const padX = fs * 0.9, padY = fs * 0.55;
  const tw = ctx.measureText(text).width;
  const bw = tw + padX * 2, bh = fs + padY * 2;
  const x = w - bw - clamp(w*0.02, 16, 32);
  const y = h - bh - clamp(h*0.02, 14, 28);
  roundedRect(ctx, x, y, bw, bh, bh/2);
  ctx.fillStyle = 'rgba(15,23,42,0.62)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(245,158,11,0.32)';
  ctx.stroke();
  ctx.fillStyle = 'rgba(248,250,252,0.84)';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x + padX, y + bh/2);
  ctx.restore();
}

function roundedRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}

function drawLineWithDot(ctx, x1, y1, x2, y2) {
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x1, y1, 4, 0, Math.PI*2); ctx.fillStyle = 'rgba(245,158,11,0.82)'; ctx.fill();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

async function fetchImageAsDataUrl(url) {
  const response = await fetch(url, { method: 'GET', cache: 'no-store' });
  if (!response.ok) throw new Error(`Pollinations image request failed (${response.status}). Try again or use a shorter prompt.`);
  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) throw new Error('Pollinations did not return an image. Try again.');
  return await blobToDataUrl(blob);
}

async function normalizeImageSource(src, mime) { return resizeToExact(src, null, null, mime, false); }

async function resizeToExact(src, width, height, mime, crop = true) {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  const outputWidth = width || img.naturalWidth || img.width;
  const outputHeight = height || img.naturalHeight || img.height;
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d', { alpha: mime !== 'image/jpeg' });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  if (!crop) { ctx.drawImage(img, 0, 0, outputWidth, outputHeight); return canvas.toDataURL(mime, mime === 'image/jpeg' ? 0.92 : 0.95); }
  const scale = Math.max(outputWidth / srcW, outputHeight / srcH);
  const drawW = srcW * scale, drawH = srcH * scale;
  ctx.drawImage(img, (outputWidth - drawW) / 2, (outputHeight - drawH) / 2, drawW, drawH);
  return canvas.toDataURL(mime, mime === 'image/jpeg' ? 0.92 : 0.95);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load generated image for resizing. Try again.'));
    img.src = src;
  });
}

function finishGeneration(totalCount) {
  const successCount = state.generated.filter(item => item && !item.error).length;
  els.downloadZipBtn.disabled = successCount === 0;
  setProgress(totalCount, totalCount, successCount ? 'Complete' : 'Finished with errors');
  if (state.errors.length) showVisibleError('Some images failed', state.errors.map(e => `Image ${e.image}: ${escapeHtml(e.message)}`).join('<br>'), `${successCount}/${totalCount} images were generated.`);
  else clearVisibleError();
  log(`Finished. ${successCount}/${totalCount} images generated successfully.`);
  updateRetryButton();
}

function renderResults() {
  const successCount = state.generated.filter(item => item && !item.error).length;
  els.resultCount.textContent = `${successCount} image${successCount === 1 ? '' : 's'}`;
  els.downloadZipBtn.disabled = successCount === 0;
  if (!state.generated.length) {
    els.resultsGrid.classList.add('empty-results');
    els.resultsGrid.innerHTML = '<div class="empty-card"><strong>No images yet.</strong><span>Add prompts and click Generate Images.</span></div>';
    return;
  }
  els.resultsGrid.classList.remove('empty-results');
  els.resultsGrid.innerHTML = state.generated.map((item, i) => {
    if (!item) return '';
    if (item.error) return `<article class="result-card error-card"><div class="result-body"><strong>Image ${i + 1} failed</strong><p>${escapeHtml(item.error)}</p><button class="retry-one" type="button" data-retry-one="${i}">Retry this image</button><span class="dim-label">${item.width} × ${item.height}</span></div></article>`;
    return `<article class="result-card"><img src="${item.dataUrl}" alt="Generated image ${i + 1}" /><div class="result-body"><strong>Image ${i + 1}</strong><p>${escapeHtml(item.prompt.slice(0, 120))}${item.prompt.length > 120 ? '…' : ''}</p><div class="result-actions"><a class="download-one" href="${item.dataUrl}" download="${escapeHtml(item.filename)}">Download</a><span class="dim-label">${item.width} × ${item.height}</span></div></div></article>`;
  }).join('');
  document.querySelectorAll('[data-retry-one]').forEach(btn => btn.addEventListener('click', async () => {
    const index = parseInt(btn.dataset.retryOne, 10);
    await retryOneImage(index);
  }));
  updateRetryButton();
}

async function retryOneImage(index) {
  clearVisibleError();
  try {
    const setup = validateInputs({ onlyIndexes: [index] });
    state.errors = [];
    setButtonsBusy(true);
    await generateAtIndex(index, setup.prompts[index], setup.width, setup.height, 1, 0);
    finishGeneration(parseInt(els.imageCount.value, 10));
  } catch (error) { handleTopLevelError(error, 'Could not retry image'); }
  finally { setButtonsBusy(false); updateRetryButton(); }
}

async function downloadZip() {
  try {
    if (!window.JSZip) throw new Error('JSZip did not load. Refresh and try again.');
    const successItems = state.generated.filter(item => item && !item.error && item.dataUrl);
    if (!successItems.length) throw new Error('No generated images available for ZIP download.');
    const zip = new JSZip();
    const folder = zip.folder('bulk-image-maker-ai-images');
    for (const item of successItems) folder.file(item.filename, dataUrlToBase64(item.dataUrl), { base64: true });
    zip.file('prompts-and-settings.json', JSON.stringify({ created_at: new Date().toISOString(), provider: 'Pollinations Free URL', total_images: successItems.length, size: { width: parseInt(els.widthInput.value, 10), height: parseInt(els.heightInput.value, 10) }, images: successItems.map(i => ({ filename: i.filename, prompt: i.prompt })) }, null, 2));
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `bulk-image-maker-ai-${Date.now()}.zip`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    log('ZIP downloaded successfully.');
  } catch (error) { const msg = cleanError(error); showVisibleError('ZIP download failed', msg, 'Generate at least one image first.'); log(`ZIP error: ${msg}`); }
}

function updateRetryButton() { els.retryFailedBtn.disabled = !state.generated.some(item => item && item.error); }
function setButtonsBusy(isBusy) { els.generateBtn.disabled = isBusy; els.retryFailedBtn.disabled = isBusy || !state.generated.some(item => item && item.error); els.generateBtn.textContent = isBusy ? 'Generating...' : 'Generate Images'; }
function setProgress(done, total, title) { const pct = total ? Math.round((done / total) * 100) : 0; els.progressTitle.textContent = title; els.progressMeta.textContent = `${done} / ${total}`; els.progressBar.style.width = `${pct}%`; }
function log(message) { const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); const current = els.logBox.textContent && els.logBox.textContent !== 'Waiting for setup...' ? els.logBox.textContent + '\n' : ''; els.logBox.textContent = `${current}[${stamp}] ${message}`; els.logBox.scrollTop = els.logBox.scrollHeight; }

function showVisibleError(title, message, subtitle = 'Fix the issue below and try again.') { els.errorTitle.textContent = title; els.errorSubtitle.textContent = subtitle; els.errorMessage.innerHTML = message || 'Unknown error'; els.errorPanel.hidden = false; els.errorPanel.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
function clearVisibleError() { els.errorPanel.hidden = true; els.errorMessage.textContent = ''; }
function handleTopLevelError(error, title) { const msg = cleanError(error); if (error?.target) { setFieldError(error.target); scrollToField(error.target); } showVisibleError(title, msg, 'Check the highlighted field, fix it, then try again.'); log(`Error: ${msg}`); }
function makeValidationError(message, target) { const e = new Error(message); e.target = target; return e; }
function setFieldError(el) { if (!el) return; el.classList.add('field-error'); if (el.classList.contains('prompt-input')) el.closest('.prompt-card')?.classList.add('has-error'); }
function clearFieldError(el) { if (!el) return; el.classList.remove('field-error'); if (el.classList.contains('prompt-input')) el.closest('.prompt-card')?.classList.remove('has-error'); }
function clearPromptError(input) { clearFieldError(input); }
function clearAllFieldErrors() { document.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error')); document.querySelectorAll('.prompt-card.has-error').forEach(el => el.classList.remove('has-error')); }
function scrollToField(el) { if (!el) return; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => { try { el.focus(); } catch (_) {} }, 350); }
function makeFailedResult(prompt, index, width, height, error) { return { prompt, filename: `failed-${String(index + 1).padStart(2, '0')}.txt`, dataUrl: '', width, height, format: 'text/plain', error: cleanError(error) }; }
function buildFilename(prompt, index, width, height, mime) { const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png'; const base = els.seoFilenames.checked ? slugify(prompt).slice(0, 70) : `image-${index + 1}`; return `${String(index + 1).padStart(2, '0')}-${base || `image-${index + 1}`}-${width}x${height}.${ext}`; }
function dataUrlToBase64(dataUrl) { return dataUrl.split(',')[1] || ''; }
function slugify(text) { return text.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-'); }
function hashString(str) { let hash = 0; for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0; return hash; }
function cleanError(error) { return (error?.message || String(error || 'Unknown error')).replace(/\s+/g, ' ').trim(); }
function escapeHtml(value) { return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
function fileToDataUrl(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error(`Could not read ${file.name}.`)); reader.readAsDataURL(file); }); }
function blobToDataUrl(blob) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('Could not read generated image.')); reader.readAsDataURL(blob); }); }
function cryptoRandomId() { if (window.crypto && crypto.getRandomValues) { const arr = new Uint32Array(2); crypto.getRandomValues(arr); return `${arr[0].toString(16)}${arr[1].toString(16)}`; } return `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
