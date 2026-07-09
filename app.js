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
const state = {
  connected: false,
  references: [],
  generated: [],
  lastPromptValues: []
};

window.addEventListener('DOMContentLoaded', () => {
  bindElements();
  populateSizePresets();
  bindEvents();
  applyPreset('etsy_listing');
  updatePromptBoxes();
  updateConnectUI(false, 'Not connected');
  log('Waiting for setup...');
  setTimeout(() => {
    if (window.puter) log('Puter.js loaded successfully. Click Connect Puter when ready.');
    else log('Puter.js is still loading. Refresh if it does not load after a few seconds.');
  }, 900);
});

function bindElements() {
  Object.assign(els, {
    connectPuterBtn: document.getElementById('connectPuterBtn'),
    connectText: document.getElementById('connectText'),
    connectStatus: document.getElementById('connectStatus'),
    imageCount: document.getElementById('imageCount'),
    sizePreset: document.getElementById('sizePreset'),
    widthInput: document.getElementById('widthInput'),
    heightInput: document.getElementById('heightInput'),
    sizeBadge: document.getElementById('sizeBadge'),
    modelSelect: document.getElementById('modelSelect'),
    qualitySelect: document.getElementById('qualitySelect'),
    formatSelect: document.getElementById('formatSelect'),
    referenceInput: document.getElementById('referenceInput'),
    referencePreview: document.getElementById('referencePreview'),
    refCount: document.getElementById('refCount'),
    useReferences: document.getElementById('useReferences'),
    autoEnhance: document.getElementById('autoEnhance'),
    strictResize: document.getElementById('strictResize'),
    seoFilenames: document.getElementById('seoFilenames'),
    promptList: document.getElementById('promptList'),
    promptCountBadge: document.getElementById('promptCountBadge'),
    generateBtn: document.getElementById('generateBtn'),
    downloadZipBtn: document.getElementById('downloadZipBtn'),
    progressTitle: document.getElementById('progressTitle'),
    progressMeta: document.getElementById('progressMeta'),
    progressBar: document.getElementById('progressBar'),
    logBox: document.getElementById('logBox'),
    resultsGrid: document.getElementById('resultsGrid'),
    resultCount: document.getElementById('resultCount')
  });
}

function populateSizePresets() {
  els.sizePreset.innerHTML = SIZE_PRESETS.map(p => `<option value="${p.id}">${p.label}</option>`).join('');
  els.sizePreset.value = 'etsy_listing';
}

function bindEvents() {
  els.connectPuterBtn.addEventListener('click', connectPuter);

  els.imageCount.addEventListener('input', () => {
    const value = els.imageCount.value.trim();
    if (value === '') {
      state.lastPromptValues = collectPromptValues();
      updatePromptBoxes();
      return;
    }

    let count = parseInt(value, 10);
    if (Number.isNaN(count)) count = 0;
    if (count > 50) {
      count = 50;
      els.imageCount.value = '50';
      log('Maximum 50 image prompt boxes allowed for browser stability.');
    }
    if (count < 0) els.imageCount.value = '';
    state.lastPromptValues = collectPromptValues();
    updatePromptBoxes();
  });

  els.sizePreset.addEventListener('change', () => applyPreset(els.sizePreset.value));
  els.widthInput.addEventListener('input', updateSizeBadge);
  els.heightInput.addEventListener('input', updateSizeBadge);
  els.referenceInput.addEventListener('change', handleReferenceUpload);
  els.generateBtn.addEventListener('click', generateImages);
  els.downloadZipBtn.addEventListener('click', downloadZip);
}

async function connectPuter() {
  try {
    if (!window.puter) throw new Error('Puter.js is not loaded yet. Refresh the page and try again.');

    els.connectPuterBtn.classList.add('connecting');
    els.connectText.textContent = 'Connecting...';
    els.connectStatus.textContent = 'Opening Puter login...';

    if (window.puter.auth && typeof window.puter.auth.signIn === 'function') {
      await window.puter.auth.signIn();
    }

    let username = '';
    try {
      if (window.puter.auth && typeof window.puter.auth.getUser === 'function') {
        const user = await window.puter.auth.getUser();
        username = user?.username || user?.email || '';
      }
    } catch (_) {
      username = '';
    }

    updateConnectUI(true, username ? `Connected as ${username}` : 'Connected');
    log('Puter connected successfully. Ready to generate images.');
  } catch (error) {
    updateConnectUI(false, 'Connection failed');
    log(`Connection error: ${cleanError(error)}`);
  } finally {
    els.connectPuterBtn.classList.remove('connecting');
  }
}

function updateConnectUI(isConnected, message) {
  state.connected = isConnected;
  els.connectPuterBtn.classList.toggle('connected', isConnected);
  els.connectStatus.classList.toggle('connected', isConnected);
  els.connectText.textContent = isConnected ? 'Puter Connected' : 'Connect Puter';
  els.connectStatus.textContent = message;
}

function applyPreset(id) {
  const preset = SIZE_PRESETS.find(p => p.id === id) || SIZE_PRESETS[0];
  const isCustom = preset.id === 'custom';

  if (isCustom) {
    els.widthInput.value = '';
    els.heightInput.value = '';
    els.widthInput.readOnly = false;
    els.heightInput.readOnly = false;
    els.widthInput.placeholder = 'e.g. 1200';
    els.heightInput.placeholder = 'e.g. 800';
    log('Custom size selected. Enter width and height manually.');
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
    els.promptList.innerHTML = `
      <div class="empty-card">
        <strong>No prompt boxes yet.</strong>
        <span>Enter image count in Setup. Prompt boxes will appear here automatically.</span>
      </div>`;
    els.promptCountBadge.textContent = '0 prompts';
    return;
  }

  els.promptList.classList.remove('empty-state');
  const existing = collectPromptValues();
  const values = existing.length ? existing : state.lastPromptValues;

  const cards = [];
  for (let i = 0; i < count; i++) {
    const value = escapeHtml(values[i] || '');
    cards.push(`
      <article class="prompt-card">
        <div class="prompt-card-head">
          <strong>Image ${i + 1}</strong>
          <span class="prompt-status" data-status-for="${i}">Prompt required</span>
        </div>
        <textarea class="prompt-input" data-index="${i}" placeholder="Describe image ${i + 1}... Example: premium Etsy listing mockup for a printable wedding budget spreadsheet on a beige desk, natural light, realistic product photography, no text">${value}</textarea>
      </article>`);
  }

  els.promptList.innerHTML = cards.join('');
  els.promptCountBadge.textContent = `${count} prompt${count === 1 ? '' : 's'}`;

  document.querySelectorAll('.prompt-input').forEach(input => {
    input.addEventListener('input', () => updatePromptStatus(input));
    updatePromptStatus(input);
  });
}

function updatePromptStatus(input) {
  const idx = input.dataset.index;
  const status = document.querySelector(`[data-status-for="${idx}"]`);
  if (!status) return;
  const filled = input.value.trim().length > 0;
  status.textContent = filled ? 'Ready' : 'Prompt required';
  status.classList.toggle('ok', filled);
}

function collectPromptValues() {
  return Array.from(document.querySelectorAll('.prompt-input')).map(el => el.value);
}

async function handleReferenceUpload(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    if (file.size > 12 * 1024 * 1024) {
      log(`Skipped ${file.name}: file is larger than 12MB.`);
      continue;
    }
    const dataUrl = await fileToDataUrl(file);
    state.references.push({
      id: cryptoRandomId(),
      name: file.name,
      type: file.type,
      dataUrl
    });
  }

  event.target.value = '';
  renderReferences();
  log(`${state.references.length} reference image(s) ready.`);
}

function renderReferences() {
  els.refCount.textContent = `${state.references.length} refs`;
  if (!state.references.length) {
    els.referencePreview.innerHTML = '';
    return;
  }

  els.referencePreview.innerHTML = state.references.map(ref => `
    <div class="ref-thumb" title="${escapeHtml(ref.name)}">
      <img src="${ref.dataUrl}" alt="Reference image preview" />
      <button type="button" data-remove-ref="${ref.id}" aria-label="Remove reference">×</button>
    </div>`).join('');

  document.querySelectorAll('[data-remove-ref]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.references = state.references.filter(ref => ref.id !== btn.dataset.removeRef);
      renderReferences();
      log(`${state.references.length} reference image(s) ready.`);
    });
  });
}

async function generateImages() {
  try {
    const count = parseInt(els.imageCount.value, 10);
    const width = parseInt(els.widthInput.value, 10);
    const height = parseInt(els.heightInput.value, 10);
    const prompts = collectPromptValues().map(p => p.trim());

    if (!count || count < 1) throw new Error('Enter how many images you want first.');
    if (prompts.length !== count) throw new Error('Prompt boxes are not ready. Re-enter image count.');
    const emptyIndex = prompts.findIndex(p => !p);
    if (emptyIndex >= 0) throw new Error(`Prompt missing for Image ${emptyIndex + 1}.`);
    if (!width || !height || width < 64 || height < 64) throw new Error('Select a preset or enter a valid custom width and height.');
    if (width > 4096 || height > 4096) throw new Error('Maximum output size is 4096 × 4096 for browser stability.');

    await ensurePuterReady();

    state.generated = [];
    renderResults();
    setButtonsBusy(true);
    setProgress(0, count, 'Generating...');
    log(`Starting ${count} image generation(s) at ${width} × ${height}px.`);

    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      setProgress(i, count, `Generating image ${i + 1} of ${count}...`);
      log(`Image ${i + 1}: sending prompt to Puter image model...`);

      try {
        const generated = await generateSingleImage({ prompt, index: i, width, height });
        state.generated.push(generated);
        renderResults();
        log(`Image ${i + 1}: done (${width} × ${height}).`);
      } catch (error) {
        const failed = makeFailedResult(prompt, i, width, height, error);
        state.generated.push(failed);
        renderResults();
        log(`Image ${i + 1}: failed — ${cleanError(error)}`);
      }

      setProgress(i + 1, count, `Generated ${i + 1} of ${count}`);
    }

    const successCount = state.generated.filter(item => !item.error).length;
    els.downloadZipBtn.disabled = successCount === 0;
    setProgress(count, count, successCount ? 'Complete' : 'Finished with errors');
    log(`Finished. ${successCount}/${count} images generated successfully.`);
  } catch (error) {
    log(`Error: ${cleanError(error)}`);
  } finally {
    setButtonsBusy(false);
  }
}

async function ensurePuterReady() {
  if (!window.puter || !window.puter.ai || typeof window.puter.ai.txt2img !== 'function') {
    throw new Error('Puter.js image API is not available. Refresh the page and try again.');
  }

  if (!state.connected) {
    try {
      if (window.puter.auth && typeof window.puter.auth.signIn === 'function') {
        await connectPuter();
      }
    } catch (_) {
      // The generation call can still surface a proper Puter login/error if auth is required.
    }
  }
}

async function generateSingleImage({ prompt, index, width, height }) {
  const model = els.modelSelect.value;
  const quality = els.qualitySelect.value;
  const format = els.formatSelect.value;
  const promptForAI = buildPremiumPrompt(prompt, width, height);

  const options = {
    provider: 'openai-image-generation',
    model,
    quality,
    ratio: { w: width, h: height }
  };

  const refs = state.references.map(ref => ref.dataUrl);
  if (els.useReferences.checked && refs.length) {
    options.input_images = refs;
    options.input_image = refs[0];
  }

  const imageElement = await window.puter.ai.txt2img(promptForAI, options);
  const source = extractImageSource(imageElement);
  const finalDataUrl = els.strictResize.checked
    ? await resizeToExact(source, width, height, format)
    : await normalizeImageSource(source, format);

  const filename = buildFilename(prompt, index, width, height, format);

  return {
    prompt,
    filename,
    dataUrl: finalDataUrl,
    width,
    height,
    format,
    error: null
  };
}

function buildPremiumPrompt(userPrompt, width, height) {
  const referencesInstruction = (els.useReferences.checked && state.references.length)
    ? 'Use the uploaded reference image(s) as the main product/template/design content. Preserve the important layout, colors, page/product appearance, and keep it naturally visible inside the scene. Do not ignore the reference image.'
    : '';

  if (!els.autoEnhance.checked) {
    return [userPrompt, referencesInstruction].filter(Boolean).join('\n\n');
  }

  return `${userPrompt}

${referencesInstruction}

Create a premium commercial image ready for an Etsy listing, website hero, blog featured image, or social media post. Make it look like authentic high-end product photography, not AI art. Use realistic lighting, natural shadows, believable materials, clean composition, sharp focus, and professional camera perspective. Keep the product/template clearly visible as the main subject. Avoid distorted objects, fake gibberish text, unreadable labels, warped hands, extra fingers, watermarks, brand logos, messy clutter, duplicated products, surreal effects, and overprocessed AI glow. Leave clean breathing room for optional Canva text overlay. Composition must fit a ${width} × ${height}px output with the selected aspect ratio.`.trim();
}

function extractImageSource(imageElement) {
  if (!imageElement) throw new Error('No image returned by Puter.');
  if (typeof imageElement === 'string') return imageElement;
  if (imageElement.src) return imageElement.src;
  if (imageElement.url) return imageElement.url;
  throw new Error('Puter returned an unsupported image response.');
}

async function normalizeImageSource(src, mime) {
  if (src.startsWith('data:') && src.startsWith(`data:${mime}`)) return src;
  return resizeToExact(src, null, null, mime, false);
}

async function resizeToExact(src, width, height, mime, crop = true) {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  const outputWidth = width || img.naturalWidth || img.width;
  const outputHeight = height || img.naturalHeight || img.height;

  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d', { alpha: mime === 'image/png' || mime === 'image/webp' });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (!crop) {
    ctx.drawImage(img, 0, 0, outputWidth, outputHeight);
    return canvas.toDataURL(mime, mime === 'image/jpeg' ? 0.92 : 0.95);
  }

  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  const scale = Math.max(outputWidth / srcW, outputHeight / srcH);
  const drawW = srcW * scale;
  const drawH = srcH * scale;
  const dx = (outputWidth - drawW) / 2;
  const dy = (outputHeight - drawH) / 2;

  ctx.drawImage(img, dx, dy, drawW, drawH);
  return canvas.toDataURL(mime, mime === 'image/jpeg' ? 0.92 : 0.95);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load generated image for resizing.'));
    img.src = src;
  });
}

function buildFilename(prompt, index, width, height, mime) {
  const ext = mimeToExt(mime);
  const base = els.seoFilenames.checked ? slugify(prompt).slice(0, 70) : `image-${index + 1}`;
  const safeBase = base || `image-${index + 1}`;
  return `${String(index + 1).padStart(2, '0')}-${safeBase}-${width}x${height}.${ext}`;
}

function mimeToExt(mime) {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  return 'png';
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function makeFailedResult(prompt, index, width, height, error) {
  return {
    prompt,
    filename: `failed-${String(index + 1).padStart(2, '0')}.txt`,
    dataUrl: '',
    width,
    height,
    format: 'text/plain',
    error: cleanError(error)
  };
}

function renderResults() {
  const count = state.generated.filter(item => !item.error).length;
  els.resultCount.textContent = `${count} image${count === 1 ? '' : 's'}`;
  els.downloadZipBtn.disabled = count === 0;

  if (!state.generated.length) {
    els.resultsGrid.classList.add('empty-results');
    els.resultsGrid.innerHTML = `
      <div class="empty-card">
        <strong>No images yet.</strong>
        <span>Add prompts and click Generate Images.</span>
      </div>`;
    return;
  }

  els.resultsGrid.classList.remove('empty-results');
  els.resultsGrid.innerHTML = state.generated.map((item, i) => {
    if (item.error) {
      return `
        <article class="result-card error-card">
          <div class="result-body">
            <strong>Image ${i + 1} failed</strong>
            <p>${escapeHtml(item.error)}</p>
            <span class="dim-label">${item.width} × ${item.height}</span>
          </div>
        </article>`;
    }

    return `
      <article class="result-card">
        <img src="${item.dataUrl}" alt="Generated image ${i + 1}" />
        <div class="result-body">
          <strong>Image ${i + 1}</strong>
          <p>${escapeHtml(item.prompt.slice(0, 120))}${item.prompt.length > 120 ? '…' : ''}</p>
          <div class="result-actions">
            <a class="download-one" href="${item.dataUrl}" download="${escapeHtml(item.filename)}">Download</a>
            <span class="dim-label">${item.width} × ${item.height}</span>
          </div>
        </div>
      </article>`;
  }).join('');
}

async function downloadZip() {
  try {
    if (!window.JSZip) throw new Error('JSZip did not load. Refresh and try again.');
    const successItems = state.generated.filter(item => !item.error && item.dataUrl);
    if (!successItems.length) throw new Error('No generated images available for ZIP download.');

    const zip = new JSZip();
    const folder = zip.folder('bulk-image-maker-ai-images');
    for (const item of successItems) {
      folder.file(item.filename, dataUrlToBase64(item.dataUrl), { base64: true });
    }

    const manifest = {
      created_at: new Date().toISOString(),
      total_images: successItems.length,
      model: els.modelSelect.value,
      quality: els.qualitySelect.value,
      size: {
        width: parseInt(els.widthInput.value, 10),
        height: parseInt(els.heightInput.value, 10)
      },
      used_reference_images: els.useReferences.checked ? state.references.map(r => r.name) : [],
      images: successItems.map(item => ({ filename: item.filename, prompt: item.prompt }))
    };
    zip.file('prompts-and-settings.json', JSON.stringify(manifest, null, 2));

    log('Preparing ZIP download...');
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-image-maker-ai-${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    log('ZIP downloaded successfully.');
  } catch (error) {
    log(`ZIP error: ${cleanError(error)}`);
  }
}

function dataUrlToBase64(dataUrl) {
  return dataUrl.split(',')[1] || '';
}

function setButtonsBusy(isBusy) {
  els.generateBtn.disabled = isBusy;
  els.generateBtn.textContent = isBusy ? 'Generating...' : 'Generate Images';
}

function setProgress(done, total, title) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  els.progressTitle.textContent = title;
  els.progressMeta.textContent = `${done} / ${total}`;
  els.progressBar.style.width = `${pct}%`;
}

function log(message) {
  const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const current = els.logBox.textContent && els.logBox.textContent !== 'Waiting for setup...' ? els.logBox.textContent + '\n' : '';
  els.logBox.textContent = `${current}[${stamp}] ${message}`;
  els.logBox.scrollTop = els.logBox.scrollHeight;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function cryptoRandomId() {
  if (window.crypto && crypto.getRandomValues) {
    const arr = new Uint32Array(2);
    crypto.getRandomValues(arr);
    return `${arr[0].toString(16)}${arr[1].toString(16)}`;
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cleanError(error) {
  if (!error) return 'Unknown error';
  const msg = error.message || String(error);
  return msg.replace(/\s+/g, ' ').trim();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
