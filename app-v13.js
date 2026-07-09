'use strict';

const PRESETS = [
  { id: 'roof_hero', label: 'RoofPitch Hero — 1600 × 900', w: 1600, h: 900, style: 'roof' },
  { id: 'blog_feature', label: 'Blog Feature — 1200 × 630', w: 1200, h: 630, style: 'blog' },
  { id: 'blog_wide', label: 'Blog Wide — 1600 × 900', w: 1600, h: 900, style: 'blog' },
  { id: 'etsy_listing', label: 'Etsy Listing — 2000 × 2000', w: 2000, h: 2000, style: 'etsy' },
  { id: 'facebook_square', label: 'Facebook Square — 1080 × 1080', w: 1080, h: 1080, style: 'facebook' },
  { id: 'facebook_story', label: 'Facebook Story — 1080 × 1920', w: 1080, h: 1920, style: 'facebook' },
  { id: 'pinterest_pin', label: 'Pinterest Pin — 1000 × 1500', w: 1000, h: 1500, style: 'pinterest' },
  { id: 'linkedin_post', label: 'LinkedIn Post — 1200 × 1200', w: 1200, h: 1200, style: 'linkedin' },
  { id: 'custom', label: 'Custom Size — enter manually', w: 1600, h: 900, style: 'custom' }
];

const STYLE_PRESETS = {
  roof: `Premium dark engineering style for RoofPitchCalculators.com. Use realistic American residential roofing visuals, modern homes, roof pitch/roof framing context, dark navy + charcoal + warm gold color palette, cinematic dusk lighting, sharp architectural details, Google Discover quality, professional roofing website style.`,
  etsy: `Premium Etsy listing product photography style. Soft beige/cream neutral palette, realistic flat-lay or lifestyle desk scene, soft natural light, clean printable product mockup aesthetic, plenty of clean space, high-end digital product shop feel.`,
  facebook: `Bright professional social media promo style. Clean lifestyle product scene, strong visual contrast, mobile-first composition, clear empty space for future text overlay, modern small business marketing look, realistic lighting, polished and eye-catching.`
};

const els = {};
const state = {
  compiled: [],
  generated: [],
  product: null,
  lastFailed: []
};

window.addEventListener('DOMContentLoaded', () => {
  bindElements();
  populatePresets();
  bindEvents();
  applyPlatformPreset('roof_hero');
  els.masterStyle.value = STYLE_PRESETS.roof;
  els.imageInstructions.value = `Image 1\nLuxury American house at dusk with a clear steep gable roof, warm window lights, professional home improvement hero background\n\nImage 2\nProfessional roofer measuring roof pitch on a residential shingle roof, realistic safety gear, clean construction detail\n\nImage 3\nRoof framing education visual showing rafters, ridge beam, roof deck, and finished shingles on a modern American home`;
  compilePrompts();
  log('VisualForge v13 loaded. Master style applies to every image instruction.');
});

function bindElements() {
  Object.assign(els, {
    platformPreset: document.getElementById('platformPreset'),
    widthInput: document.getElementById('widthInput'),
    heightInput: document.getElementById('heightInput'),
    modelSelect: document.getElementById('modelSelect'),
    formatSelect: document.getElementById('formatSelect'),
    seedMode: document.getElementById('seedMode'),
    seedWrap: document.getElementById('seedWrap'),
    seedInput: document.getElementById('seedInput'),
    autoEnhance: document.getElementById('autoEnhance'),
    forceNoText: document.getElementById('forceNoText'),
    strictSize: document.getElementById('strictSize'),
    seoNames: document.getElementById('seoNames'),
    productInput: document.getElementById('productInput'),
    productPreview: document.getElementById('productPreview'),
    useProduct: document.getElementById('useProduct'),
    productPlacement: document.getElementById('productPlacement'),
    masterStyle: document.getElementById('masterStyle'),
    imageInstructions: document.getElementById('imageInstructions'),
    compileBtn: document.getElementById('compileBtn'),
    copyPromptsBtn: document.getElementById('copyPromptsBtn'),
    downloadPromptsBtn: document.getElementById('downloadPromptsBtn'),
    compiledCount: document.getElementById('compiledCount'),
    compiledList: document.getElementById('compiledList'),
    errorPanel: document.getElementById('errorPanel'),
    errorTitle: document.getElementById('errorTitle'),
    errorMessage: document.getElementById('errorMessage'),
    generateBtn: document.getElementById('generateBtn'),
    retryFailedBtn: document.getElementById('retryFailedBtn'),
    downloadZipBtn: document.getElementById('downloadZipBtn'),
    progressTitle: document.getElementById('progressTitle'),
    progressMeta: document.getElementById('progressMeta'),
    progressBar: document.getElementById('progressBar'),
    logBox: document.getElementById('logBox'),
    resultsGrid: document.getElementById('resultsGrid'),
    resultCount: document.getElementById('resultCount')
  });
}

function populatePresets() {
  els.platformPreset.innerHTML = PRESETS.map(p => `<option value="${p.id}">${p.label}</option>`).join('');
}

function bindEvents() {
  els.platformPreset.addEventListener('change', () => applyPlatformPreset(els.platformPreset.value));
  els.seedMode.addEventListener('change', () => { els.seedWrap.hidden = els.seedMode.value !== 'fixed'; });
  els.compileBtn.addEventListener('click', compilePrompts);
  els.copyPromptsBtn.addEventListener('click', copyCompiledPrompts);
  els.downloadPromptsBtn.addEventListener('click', downloadCompiledJson);
  els.generateBtn.addEventListener('click', () => generateAll(false));
  els.retryFailedBtn.addEventListener('click', () => generateAll(true));
  els.downloadZipBtn.addEventListener('click', downloadZip);
  els.productInput.addEventListener('change', handleProductUpload);
  document.querySelectorAll('[data-style]').forEach(btn => {
    btn.addEventListener('click', () => {
      const style = btn.dataset.style;
      if (style === 'clear') {
        els.masterStyle.value = '';
        els.imageInstructions.value = '';
        compilePrompts();
        return;
      }
      els.masterStyle.value = STYLE_PRESETS[style] || '';
      compilePrompts();
    });
  });
}

function applyPlatformPreset(id) {
  const preset = PRESETS.find(p => p.id === id) || PRESETS[0];
  if (id !== 'custom') {
    els.widthInput.value = preset.w;
    els.heightInput.value = preset.h;
  }
  if (preset.style && STYLE_PRESETS[preset.style] && !els.masterStyle.value.trim()) {
    els.masterStyle.value = STYLE_PRESETS[preset.style];
  }
  if (preset.style === 'roof' || preset.style === 'blog') {
    els.useProduct.checked = false;
  }
}

function parseImageInstructions(text) {
  const raw = text.trim();
  if (!raw) return [];

  const lines = raw.split(/\r?\n/);
  const hasMarkers = lines.some(line => /^\s*(?:#{1,6}\s*)?(?:image|img)\s*\d+\s*[:.)-]?\s*$/i.test(line.trim()) || /^\s*\d+\s*[:.)-]\s+/.test(line.trim()));

  if (!hasMarkers) {
    return raw.split(/\n+/).map(s => s.trim()).filter(Boolean);
  }

  const blocks = [];
  let current = [];

  for (let line of lines) {
    const trimmed = line.trim();
    const markerOnly = /^\s*(?:#{1,6}\s*)?(?:image|img)\s*\d+\s*[:.)-]?\s*$/i.test(trimmed);
    const numberedWithText = /^\s*\d+\s*[:.)-]\s+(.+)/.exec(trimmed);
    const imageWithInline = /^\s*(?:#{1,6}\s*)?(?:image|img)\s*\d+\s*[:.)-]\s+(.+)/i.exec(trimmed);

    if (markerOnly || numberedWithText || imageWithInline) {
      if (current.join(' ').trim()) blocks.push(current.join('\n').trim());
      current = [];
      if (numberedWithText) current.push(numberedWithText[1]);
      if (imageWithInline) current.push(imageWithInline[1]);
    } else if (trimmed) {
      current.push(line);
    }
  }
  if (current.join(' ').trim()) blocks.push(current.join('\n').trim());
  return blocks;
}

function compilePrompts() {
  clearError();
  clearFieldErrors();
  const master = els.masterStyle.value.trim();
  const instructions = parseImageInstructions(els.imageInstructions.value);
  const width = parseInt(els.widthInput.value, 10);
  const height = parseInt(els.heightInput.value, 10);

  if (!master) return showError('Master style missing', 'Write one master style. This is what saves time across all images.', els.masterStyle);
  if (!instructions.length) return showError('Image instructions missing', 'Paste one prompt per line or Image 1 / Image 2 blocks.', els.imageInstructions);
  if (!width || !height || width < 256 || height < 256) return showError('Invalid size', 'Enter width and height at least 256 px.', els.widthInput);

  state.compiled = instructions.map((instruction, index) => ({
    index,
    shortPrompt: instruction,
    prompt: buildFinalPrompt(instruction, master, width, height),
    filenameBase: buildFilenameBase(instruction, index)
  }));

  renderCompiled();
  els.copyPromptsBtn.disabled = false;
  els.downloadPromptsBtn.disabled = false;
  log(`Compiled ${state.compiled.length} prompt(s).`);
  return state.compiled;
}

function buildFinalPrompt(instruction, master, width, height) {
  const parts = [instruction, master];
  if (els.autoEnhance.checked) {
    parts.push(`High-end commercial image, realistic materials, natural lighting, clean composition, sharp focus, professional camera perspective, no watermark, no logo, no low-quality artifacts, exact ${width}x${height} composition.`);
  }
  if (els.forceNoText.checked) {
    parts.push('Do not include readable text, letters, numbers, labels, captions, UI panels, fake typography, charts, badges, or watermarks inside the generated image.');
  }
  return parts.filter(Boolean).join('\n\n');
}

function renderCompiled() {
  els.compiledCount.textContent = `${state.compiled.length} prompt${state.compiled.length === 1 ? '' : 's'}`;
  if (!state.compiled.length) {
    els.compiledList.classList.add('empty');
    els.compiledList.textContent = 'Compile prompts to preview them here.';
    return;
  }
  els.compiledList.classList.remove('empty');
  els.compiledList.innerHTML = state.compiled.map(item => `
    <article class="compiled-item">
      <strong>Image ${item.index + 1}</strong>
      <p>${escapeHtml(item.prompt)}</p>
    </article>
  `).join('');
}

async function generateAll(retryOnly) {
  clearError();
  if (!retryOnly) compilePrompts();
  const sourceItems = retryOnly ? state.lastFailed.map(f => state.compiled[f.index]).filter(Boolean) : state.compiled;
  if (!sourceItems.length) return showError('No prompts ready', 'Compile prompts first, or generate once before retrying failed images.');

  const width = parseInt(els.widthInput.value, 10);
  const height = parseInt(els.heightInput.value, 10);
  const format = els.formatSelect.value;
  const model = els.modelSelect.value;
  const baseSeed = els.seedMode.value === 'fixed' ? parseInt(els.seedInput.value, 10) || 1 : Math.floor(Math.random() * 10000000);

  if (!retryOnly) {
    state.generated = [];
    state.lastFailed = [];
    renderResults();
  }

  setBusy(true);
  setProgress(0, sourceItems.length, retryOnly ? 'Retrying failed images...' : 'Generating images...');
  log(`${retryOnly ? 'Retrying' : 'Starting'} ${sourceItems.length} image(s) at ${width} × ${height}.`);

  for (let i = 0; i < sourceItems.length; i++) {
    const item = sourceItems[i];
    setProgress(i, sourceItems.length, `Generating ${i + 1} of ${sourceItems.length}...`);
    try {
      const seed = baseSeed + item.index;
      const dataUrl = await generatePollinationsImage(item.prompt, width, height, model, seed, format);
      const finalData = els.useProduct.checked && state.product ? await compositeProduct(dataUrl, width, height, format) : dataUrl;
      const result = {
        index: item.index,
        prompt: item.shortPrompt,
        compiledPrompt: item.prompt,
        dataUrl: finalData,
        filename: makeFilename(item.filenameBase, item.index, width, height, format),
        width,
        height,
        error: null
      };
      upsertResult(result);
      log(`Image ${item.index + 1}: generated successfully.`);
    } catch (error) {
      const message = cleanError(error);
      const result = { index: item.index, prompt: item.shortPrompt, error: message, width, height };
      upsertResult(result);
      log(`Image ${item.index + 1}: failed — ${message}`);
    }
    renderResults();
    setProgress(i + 1, sourceItems.length, `Completed ${i + 1} of ${sourceItems.length}`);
  }

  state.lastFailed = state.generated.filter(r => r.error).map(r => ({ index: r.index, error: r.error }));
  const success = state.generated.filter(r => !r.error).length;
  setBusy(false);
  els.retryFailedBtn.disabled = state.lastFailed.length === 0;
  els.downloadZipBtn.disabled = success === 0;
  setProgress(sourceItems.length, sourceItems.length, state.lastFailed.length ? 'Finished with errors' : 'Complete');
  if (state.lastFailed.length) showError('Some images failed', `${state.lastFailed.length} image(s) failed. You can click Retry Failed Only.`, null, false);
  log(`Finished. ${success}/${state.generated.length} total images available.`);
}

async function generatePollinationsImage(prompt, width, height, model, seed, format) {
  const cleanPrompt = prompt.replace(/\s+/g, ' ').trim();
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=${width}&height=${height}&model=${encodeURIComponent(model)}&seed=${seed}&nologo=true&private=true&enhance=false&safe=true`;
  const blob = await fetchImageBlob(url);
  const rawDataUrl = await blobToDataUrl(blob);
  if (!els.strictSize.checked) return rawDataUrl;
  return resizeDataUrl(rawDataUrl, width, height, format);
}

async function fetchImageBlob(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Image API returned ${response.status}. Try again or reduce batch size.`);
  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) throw new Error('Image API did not return an image. Try a simpler prompt.');
  return blob;
}

function resizeDataUrl(dataUrl, width, height, mime) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: mime !== 'image/jpeg' });
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      const srcW = img.naturalWidth || img.width;
      const srcH = img.naturalHeight || img.height;
      const scale = Math.max(width / srcW, height / srcH);
      const drawW = srcW * scale;
      const drawH = srcH * scale;
      const dx = (width - drawW) / 2;
      const dy = (height - drawH) / 2;
      ctx.drawImage(img, dx, dy, drawW, drawH);
      resolve(canvas.toDataURL(mime, mime === 'image/jpeg' ? .92 : .95));
    };
    img.onerror = () => reject(new Error('Could not resize generated image.'));
    img.src = dataUrl;
  });
}

async function handleProductUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) return showError('Invalid product file', 'Upload a PNG, JPG, or WebP image.');
  const dataUrl = await fileToDataUrl(file);
  state.product = { name: file.name, dataUrl };
  els.productPreview.innerHTML = `<img src="${dataUrl}" alt="Uploaded product preview" />`;
  log(`Product uploaded: ${file.name}`);
}

async function compositeProduct(backgroundDataUrl, width, height, mime) {
  const bg = await loadImage(backgroundDataUrl);
  const product = await loadImage(state.product.dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: mime !== 'image/jpeg' });
  ctx.drawImage(bg, 0, 0, width, height);

  let box = getProductBox(width, height, els.productPlacement.value);
  drawRoundedShadowCard(ctx, box.x, box.y, box.w, box.h, Math.round(Math.min(width, height) * .025));
  drawImageContain(ctx, product, box.x + box.pad, box.y + box.pad, box.w - box.pad * 2, box.h - box.pad * 2);
  return canvas.toDataURL(mime, mime === 'image/jpeg' ? .92 : .95);
}

function getProductBox(w, h, placement) {
  const pad = Math.round(Math.min(w, h) * .025);
  if (placement === 'left-card') return { x: Math.round(w * .055), y: Math.round(h * .18), w: Math.round(w * .34), h: Math.round(h * .62), pad };
  if (placement === 'center') return { x: Math.round(w * .28), y: Math.round(h * .20), w: Math.round(w * .44), h: Math.round(h * .58), pad };
  if (placement === 'bottom-stack') return { x: Math.round(w * .25), y: Math.round(h * .52), w: Math.round(w * .50), h: Math.round(h * .38), pad };
  return { x: Math.round(w * .61), y: Math.round(h * .18), w: Math.round(w * .34), h: Math.round(h * .62), pad };
}

function drawRoundedShadowCard(ctx, x, y, w, h, r) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.35)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  roundedRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.restore();
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawImageContain(ctx, img, x, y, w, h) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.min(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image for canvas composition.'));
    img.src = src;
  });
}

function upsertResult(result) {
  const idx = state.generated.findIndex(r => r.index === result.index);
  if (idx >= 0) state.generated[idx] = result;
  else state.generated.push(result);
  state.generated.sort((a, b) => a.index - b.index);
}

function renderResults() {
  const success = state.generated.filter(r => !r.error).length;
  els.resultCount.textContent = `${success} image${success === 1 ? '' : 's'}`;
  els.downloadZipBtn.disabled = success === 0;

  if (!state.generated.length) {
    els.resultsGrid.innerHTML = '<div class="empty-card">No images yet.</div>';
    return;
  }

  els.resultsGrid.innerHTML = state.generated.map(r => {
    if (r.error) {
      return `<article class="result-card error-card"><div class="result-body"><strong>Image ${r.index + 1} failed</strong><p>${escapeHtml(r.error)}</p><button class="retry-one" type="button" data-retry-index="${r.index}">Retry this image</button></div></article>`;
    }
    return `<article class="result-card"><img src="${r.dataUrl}" alt="Generated image ${r.index + 1}" /><div class="result-body"><strong>Image ${r.index + 1}</strong><p>${escapeHtml(r.prompt.slice(0, 140))}${r.prompt.length > 140 ? '…' : ''}</p><div class="result-actions"><a class="download-one" href="${r.dataUrl}" download="${escapeHtml(r.filename)}">Download</a><span class="dim">${r.width} × ${r.height}</span></div></div></article>`;
  }).join('');

  document.querySelectorAll('[data-retry-index]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const i = parseInt(btn.dataset.retryIndex, 10);
      state.lastFailed = [{ index: i }];
      await generateAll(true);
    });
  });
}

async function downloadZip() {
  try {
    if (!window.JSZip) throw new Error('JSZip did not load. Refresh and try again.');
    const success = state.generated.filter(r => !r.error && r.dataUrl);
    if (!success.length) throw new Error('No generated images available for ZIP download.');
    const zip = new JSZip();
    const folder = zip.folder('visualforge-ai-v13-images');
    success.forEach(r => folder.file(r.filename, dataUrlToBase64(r.dataUrl), { base64: true }));
    zip.file('compiled-prompts.json', JSON.stringify({ created_at: new Date().toISOString(), size: { width: parseInt(els.widthInput.value, 10), height: parseInt(els.heightInput.value, 10) }, prompts: state.compiled }, null, 2));
    const blob = await zip.generateAsync({ type: 'blob' });
    saveBlob(blob, `visualforge-ai-v13-${Date.now()}.zip`);
    log('ZIP downloaded successfully.');
  } catch (error) {
    showError('ZIP failed', cleanError(error));
    log(`ZIP error: ${cleanError(error)}`);
  }
}

function copyCompiledPrompts() {
  const text = state.compiled.map(i => `Image ${i.index + 1}\n${i.prompt}`).join('\n\n---\n\n');
  navigator.clipboard.writeText(text).then(() => log('Compiled prompts copied.')).catch(() => showError('Copy failed', 'Browser did not allow clipboard access.'));
}

function downloadCompiledJson() {
  const blob = new Blob([JSON.stringify(state.compiled, null, 2)], { type: 'application/json' });
  saveBlob(blob, `compiled-prompts-${Date.now()}.json`);
}

function setBusy(busy) {
  els.generateBtn.disabled = busy;
  els.retryFailedBtn.disabled = busy || state.lastFailed.length === 0;
  els.generateBtn.textContent = busy ? 'Generating...' : 'Generate All Images';
}
function setProgress(done, total, title) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  els.progressTitle.textContent = title;
  els.progressMeta.textContent = `${done} / ${total}`;
  els.progressBar.style.width = `${pct}%`;
}
function log(message) {
  const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const current = els.logBox.textContent ? els.logBox.textContent + '\n' : '';
  els.logBox.textContent = `${current}[${stamp}] ${message}`;
  els.logBox.scrollTop = els.logBox.scrollHeight;
}
function showError(title, message, field = null, scroll = true) {
  els.errorTitle.textContent = title;
  els.errorMessage.textContent = message;
  els.errorPanel.hidden = false;
  if (field) {
    field.classList.add('field-error');
    field.focus({ preventScroll: true });
  }
  if (scroll) els.errorPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return [];
}
function clearError() { els.errorPanel.hidden = true; els.errorMessage.textContent = ''; }
function clearFieldErrors() { [els.masterStyle, els.imageInstructions, els.widthInput, els.heightInput].forEach(el => el.classList.remove('field-error')); }
function fileToDataUrl(file) { return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(new Error(`Could not read ${file.name}.`)); r.readAsDataURL(file); }); }
function blobToDataUrl(blob) { return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(new Error('Could not read generated image.')); r.readAsDataURL(blob); }); }
function dataUrlToBase64(dataUrl) { return dataUrl.split(',')[1] || ''; }
function saveBlob(blob, filename) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }
function makeFilename(base, index, width, height, mime) { const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png'; const safe = els.seoNames.checked ? base : `image-${index + 1}`; return `${String(index + 1).padStart(2, '0')}-${safe}-${width}x${height}.${ext}`; }
function buildFilenameBase(text, index) { const slug = slugify(text).slice(0, 80); return slug || `image-${index + 1}`; }
function slugify(text) { return String(text).toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-'); }
function cleanError(error) { return (error?.message || String(error || 'Unknown error')).replace(/\s+/g, ' ').trim(); }
function escapeHtml(value) { return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
