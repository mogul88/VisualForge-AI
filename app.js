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

const PUTER_MODELS = [
  { value: 'gpt-image-2', label: 'GPT Image 2 — Best' },
  { value: 'gpt-image-1.5', label: 'GPT Image 1.5' },
  { value: 'gpt-image-1', label: 'GPT Image 1' },
  { value: 'gpt-image-1-mini', label: 'GPT Image 1 Mini' }
];

const POLLINATIONS_MODELS = [
  { value: 'flux', label: 'Flux — realistic / free URL' },
  { value: 'turbo', label: 'Turbo — faster' },
  { value: 'gptimage', label: 'GPT Image — key mode' },
  { value: 'gptimage-large', label: 'GPT Image Large — key mode' }
];


const els = {};
const state = {
  connected: false,
  references: [],
  generated: [],
  lastPromptValues: [],
  errors: [],
  activeProvider: 'pollinations_legacy'
};

window.addEventListener('DOMContentLoaded', () => {
  bindElements();
  populateSizePresets();
  bindEvents();
  updateProviderUI();
  applyPreset('etsy_listing');
  updatePromptBoxes();
  updateConnectUI(false, 'Not connected');
  updateRetryButton();
  clearVisibleError();
  log('Waiting for setup...');
  setTimeout(() => {
    if (window.puter) log('Puter.js loaded successfully. Puter mode is available if you select it.');
    else log('Puter.js is still loading. Pollinations mode can still work without Puter.');
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
    providerSelect: document.getElementById('providerSelect'),
    providerHelp: document.getElementById('providerHelp'),
    pollinationsKeyWrap: document.getElementById('pollinationsKeyWrap'),
    pollinationsKey: document.getElementById('pollinationsKey'),
    modelSelect: document.getElementById('modelSelect'),
    qualitySelect: document.getElementById('qualitySelect'),
    formatSelect: document.getElementById('formatSelect'),
    referenceInput: document.getElementById('referenceInput'),
    referencePreview: document.getElementById('referencePreview'),
    refCount: document.getElementById('refCount'),
    useReferences: document.getElementById('useReferences'),
    autoEnhance: document.getElementById('autoEnhance'),
    strictResize: document.getElementById('strictResize'),
    fallbackPollinations: document.getElementById('fallbackPollinations'),
    seoFilenames: document.getElementById('seoFilenames'),
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

function updateProviderUI() {
  const provider = els.providerSelect?.value || 'pollinations_legacy';
  state.activeProvider = provider;

  const isPuter = provider === 'puter';
  const isKeyMode = provider === 'pollinations_key';

  if (els.pollinationsKeyWrap) els.pollinationsKeyWrap.classList.toggle('hidden', !isKeyMode);
  if (els.connectPuterBtn) els.connectPuterBtn.style.display = isPuter ? 'inline-flex' : 'none';
  if (els.connectStatus) {
    els.connectStatus.textContent = isPuter
      ? (state.connected ? els.connectStatus.textContent || 'Connected' : 'Puter mode needs connection')
      : (isKeyMode ? 'Pollinations key mode' : 'Pollinations free URL mode');
    els.connectStatus.classList.toggle('connected', !isPuter || state.connected);
  }

  if (els.providerHelp) {
    if (provider === 'pollinations_legacy') {
      els.providerHelp.textContent = 'No Puter balance needed. This tries the legacy Pollinations image URL. Reference images are not used in this mode.';
    } else if (provider === 'pollinations_key') {
      els.providerHelp.textContent = 'Uses Pollinations OpenAI-compatible image endpoint. Paste only a scoped pk_ publishable key, not sk_ secret keys.';
    } else {
      els.providerHelp.textContent = 'Uses Puter GPT Image. Best quality/reference image support, but it may need Puter balance.';
    }
  }

  const models = isPuter ? PUTER_MODELS : POLLINATIONS_MODELS;
  const current = els.modelSelect.value;
  els.modelSelect.innerHTML = models.map(item => `<option value="${item.value}">${item.label}</option>`).join('');
  els.modelSelect.value = models.some(item => item.value === current) ? current : models[0].value;

  if (provider !== 'puter' && els.useReferences?.checked && state.references.length) {
    log('Note: uploaded reference images are only used in Puter mode. Pollinations mode will use prompts only.');
  }
}

function currentProvider() {
  return els.providerSelect?.value || 'pollinations_legacy';
}

function currentProviderName() {
  const provider = currentProvider();
  if (provider === 'puter') return 'Puter GPT Image';
  if (provider === 'pollinations_key') return 'Pollinations API Key';
  return 'Pollinations Free URL';
}

function bindEvents() {
  els.connectPuterBtn.addEventListener('click', connectPuter);

  els.imageCount.addEventListener('input', () => {
    clearFieldError(els.imageCount);
    const value = els.imageCount.value.trim();
    if (value === '') {
      state.lastPromptValues = collectPromptValues();
      updatePromptBoxes();
      updateRetryButton();
      return;
    }

    let count = parseInt(value, 10);
    if (Number.isNaN(count)) count = 0;
    if (count > 50) {
      count = 50;
      els.imageCount.value = '50';
      showVisibleError('Maximum limit applied', 'Maximum 50 image prompt boxes allowed for browser stability.', 'You can generate in smaller batches for better stability.');
      log('Maximum 50 image prompt boxes allowed for browser stability.');
    }
    if (count < 0) els.imageCount.value = '';
    state.lastPromptValues = collectPromptValues();
    updatePromptBoxes();
    updateRetryButton();
  });

  els.sizePreset.addEventListener('change', () => {
    clearFieldError(els.sizePreset);
    applyPreset(els.sizePreset.value);
  });
  els.widthInput.addEventListener('input', () => {
    clearFieldError(els.widthInput);
    updateSizeBadge();
  });
  els.heightInput.addEventListener('input', () => {
    clearFieldError(els.heightInput);
    updateSizeBadge();
  });
  els.providerSelect.addEventListener('change', () => {
    clearFieldError(els.providerSelect);
    updateProviderUI();
  });
  els.pollinationsKey.addEventListener('input', () => clearFieldError(els.pollinationsKey));
  els.referenceInput.addEventListener('change', handleReferenceUpload);
  els.generateBtn.addEventListener('click', generateImages);
  els.retryFailedBtn.addEventListener('click', retryFailedImages);
  els.downloadZipBtn.addEventListener('click', downloadZip);
}

async function connectPuter() {
  try {
    clearVisibleError();
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
    clearVisibleError();
    log('Puter connected successfully. Ready to generate images.');
  } catch (error) {
    updateConnectUI(false, 'Connection failed');
    const message = cleanError(error);
    showVisibleError('Connection failed', message, 'Click Connect Puter again. If a login popup was blocked, allow popups and retry.');
    log(`Connection error: ${message}`);
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
    clearFieldError(els.widthInput);
    clearFieldError(els.heightInput);
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
      <article class="prompt-card" data-prompt-card="${i}">
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
    input.addEventListener('input', () => {
      clearPromptError(input);
      updatePromptStatus(input);
    });
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
      showVisibleError('Reference image skipped', `${file.name} is larger than 12MB.`, 'Use a smaller JPG/WebP/PNG reference image.');
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
  clearVisibleError();
  clearAllFieldErrors();
  state.errors = [];

  try {
    const setup = validateInputs();
    await ensurePuterReady();

    state.generated = [];
    renderResults();
    updateRetryButton();
    setButtonsBusy(true);
    setProgress(0, setup.count, 'Generating...');
    log(`Starting ${setup.count} image generation(s) at ${setup.width} × ${setup.height}px.`);

    for (let i = 0; i < setup.prompts.length; i++) {
      await generateAtIndex(i, setup.prompts[i], setup.width, setup.height, setup.count);
    }

    finishGeneration(setup.count);
  } catch (error) {
    handleTopLevelError(error, 'Could not start image generation');
  } finally {
    setButtonsBusy(false);
    updateRetryButton();
  }
}

async function retryFailedImages() {
  clearVisibleError();
  clearAllFieldErrors();
  state.errors = [];

  try {
    const failedIndexes = state.generated
      .map((item, index) => item?.error ? index : -1)
      .filter(index => index >= 0);

    if (!failedIndexes.length) throw makeValidationError('No failed images to retry.', null);

    const setup = validateInputs({ onlyIndexes: failedIndexes });
    await ensurePuterReady();

    setButtonsBusy(true);
    els.retryFailedBtn.disabled = true;
    setProgress(0, failedIndexes.length, 'Retrying failed images...');
    log(`Retrying ${failedIndexes.length} failed image(s).`);

    for (let step = 0; step < failedIndexes.length; step++) {
      const index = failedIndexes[step];
      await generateAtIndex(index, setup.prompts[index], setup.width, setup.height, failedIndexes.length, step);
    }

    finishGeneration(parseInt(els.imageCount.value, 10));
  } catch (error) {
    handleTopLevelError(error, 'Could not retry failed images');
  } finally {
    setButtonsBusy(false);
    updateRetryButton();
  }
}

function validateInputs(options = {}) {
  const count = parseInt(els.imageCount.value, 10);
  const width = parseInt(els.widthInput.value, 10);
  const height = parseInt(els.heightInput.value, 10);
  const prompts = collectPromptValues().map(p => p.trim());

  if (!count || count < 1) {
    throw makeValidationError('Enter how many images you want first.', els.imageCount);
  }

  if (count > 50) {
    throw makeValidationError('Maximum 50 images allowed in one batch.', els.imageCount);
  }

  if (prompts.length !== count) {
    throw makeValidationError('Prompt boxes are not ready. Re-enter image count.', els.imageCount);
  }

  if (!width || width < 64) {
    throw makeValidationError('Enter a valid width. Minimum width is 64px.', els.widthInput);
  }

  if (!height || height < 64) {
    throw makeValidationError('Enter a valid height. Minimum height is 64px.', els.heightInput);
  }

  if (width > 4096 || height > 4096) {
    const target = width > 4096 ? els.widthInput : els.heightInput;
    throw makeValidationError('Maximum output size is 4096 × 4096 for browser stability.', target);
  }

  const onlyIndexes = options.onlyIndexes || null;
  const indexesToCheck = onlyIndexes || prompts.map((_, index) => index);

  for (const index of indexesToCheck) {
    if (!prompts[index]) {
      const input = getPromptInput(index);
      throw makeValidationError(`Prompt missing for Image ${index + 1}.`, input);
    }
  }

  return { count, width, height, prompts };
}

async function generateAtIndex(index, prompt, width, height, totalForProgress, progressStep = index) {
  const total = totalForProgress || 1;
  const displayStep = progressStep ?? index;
  setProgress(displayStep, total, `Generating image ${index + 1}...`);
  log(`Image ${index + 1}: sending prompt to ${currentProviderName()}...`);

  try {
    const generated = await generateSingleImage({ prompt, index, width, height });
    state.generated[index] = generated;
    clearPromptError(getPromptInput(index));
    renderResults();
    log(`Image ${index + 1}: done (${width} × ${height}).`);
  } catch (error) {
    const message = cleanError(error);
    const failed = makeFailedResult(prompt, index, width, height, error);
    state.generated[index] = failed;
    state.errors.push({ image: index + 1, message });
    markPromptError(index);
    renderResults();
    showVisibleError(`Image ${index + 1} failed`, message, `Problem in Image ${index + 1}. Fix the prompt, connection, or model setting, then use Retry Failed Only.`, { scroll: false });
    log(`Image ${index + 1}: failed — ${message}`);
  }

  setProgress(displayStep + 1, total, `Generated ${Math.min(displayStep + 1, total)} of ${total}`);
}

function finishGeneration(totalCount) {
  const successCount = state.generated.filter(item => item && !item.error).length;
  const failedCount = state.generated.filter(item => item && item.error).length;
  els.downloadZipBtn.disabled = successCount === 0;
  setProgress(totalCount, totalCount, failedCount ? 'Finished with errors' : 'Complete');

  if (failedCount) {
    const summary = state.generated
      .map((item, index) => item?.error ? `Image ${index + 1}: ${escapeHtml(item.error)}` : '')
      .filter(Boolean)
      .join('<br>');
    showVisibleError('Some images failed', summary, `${successCount}/${totalCount} images generated. Fix failed prompts or settings, then click Retry Failed Only.`, { html: true, scroll: true });
  } else {
    clearVisibleError();
  }

  updateRetryButton();
  log(`Finished. ${successCount}/${totalCount} images generated successfully.`);
}

function handleTopLevelError(error, title) {
  const message = cleanError(error);
  const target = error?.target || null;

  if (target) {
    setFieldError(target);
    scrollToField(target);
  }

  showVisibleError(title, message, 'Check the highlighted field, fix it, then click Generate Images again.');
  log(`Error: ${message}`);
}

async function ensurePuterReady() {
  const provider = currentProvider();

  if (provider === 'pollinations_key') {
    const key = els.pollinationsKey.value.trim();
    if (!key) throw makeValidationError('Pollinations API key mode selected. Paste your scoped pk_ publishable key or switch provider to Pollinations Free URL.', els.pollinationsKey);
    if (key.startsWith('sk_')) throw makeValidationError('Do not paste a secret sk_ key in a public frontend app. Use a scoped pk_ publishable key only.', els.pollinationsKey);
    return;
  }

  if (provider === 'pollinations_legacy') {
    return;
  }

  if (!window.puter || !window.puter.ai || typeof window.puter.ai.txt2img !== 'function') {
    throw new Error('Puter.js image API is not available. Switch provider to Pollinations Free URL or refresh the page.');
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
  const provider = currentProvider();

  try {
    if (provider === 'puter') {
      return await generateWithPuter({ prompt, index, width, height });
    }

    if (provider === 'pollinations_key') {
      return await generateWithPollinationsKey({ prompt, index, width, height });
    }

    return await generateWithPollinationsLegacy({ prompt, index, width, height });
  } catch (error) {
    const msg = cleanError(error).toLowerCase();
    const canFallback = provider === 'puter' && els.fallbackPollinations?.checked;
    const looksLikeBalanceIssue = msg.includes('balance') || msg.includes('credit') || msg.includes('funding') || msg.includes('payment') || msg.includes('quota') || msg.includes('limit');

    if (canFallback && looksLikeBalanceIssue) {
      log(`Image ${index + 1}: Puter failed due to balance/credit. Trying Pollinations Free URL fallback...`);
      return await generateWithPollinationsLegacy({ prompt, index, width, height, fallbackFrom: 'puter' });
    }

    throw error;
  }
}

async function generateWithPuter({ prompt, index, width, height }) {
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
  return await finalizeGeneratedImage({ source, prompt, index, width, height, provider: 'puter' });
}

async function generateWithPollinationsLegacy({ prompt, index, width, height, fallbackFrom = '' }) {
  const model = els.modelSelect.value || 'flux';
  const promptForAI = buildPremiumPrompt(prompt, width, height, { forceNoReferences: true });
  const url = buildPollinationsLegacyUrl(promptForAI, width, height, model, index);
  const source = await fetchImageAsDataUrl(url, 'Pollinations Free URL');
  const result = await finalizeGeneratedImage({ source, prompt, index, width, height, provider: 'pollinations_legacy' });
  if (fallbackFrom) result.fallbackFrom = fallbackFrom;
  return result;
}

async function generateWithPollinationsKey({ prompt, index, width, height }) {
  const key = els.pollinationsKey.value.trim();
  const model = els.modelSelect.value || 'flux';
  const quality = els.qualitySelect.value;
  const promptForAI = buildPremiumPrompt(prompt, width, height, { forceNoReferences: true });

  const response = await fetch('https://gen.pollinations.ai/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      prompt: promptForAI,
      size: `${width}x${height}`,
      quality,
      response_format: 'b64_json'
    })
  });

  if (!response.ok) {
    let detail = '';
    try { detail = await response.text(); } catch (_) { detail = ''; }
    throw new Error(`Pollinations API request failed (${response.status}). ${detail.slice(0, 260)}`);
  }

  const json = await response.json();
  const first = json?.data?.[0];
  let source = '';
  if (first?.b64_json) source = `data:image/png;base64,${first.b64_json}`;
  else if (first?.url) source = await fetchImageAsDataUrl(first.url, 'Pollinations image URL');
  else throw new Error('Pollinations API returned no image data.');

  return await finalizeGeneratedImage({ source, prompt, index, width, height, provider: 'pollinations_key' });
}

async function finalizeGeneratedImage({ source, prompt, index, width, height, provider }) {
  const format = els.formatSelect.value;
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
    provider,
    error: null
  };
}

function buildPollinationsLegacyUrl(promptForAI, width, height, model, index) {
  const seed = Date.now() + index * 97;
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    seed: String(seed),
    model: model || 'flux',
    nologo: 'true',
    private: 'true',
    safe: 'true',
    enhance: 'false'
  });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(promptForAI)}?${params.toString()}`;
}

async function fetchImageAsDataUrl(url, label = 'Image provider') {
  let response;
  try {
    response = await fetch(url, { method: 'GET', cache: 'no-store', mode: 'cors' });
  } catch (error) {
    throw new Error(`${label} could not be reached. Try again, switch model, or use Pollinations API Key mode. ${cleanError(error)}`);
  }

  if (!response.ok) {
    let detail = '';
    try { detail = await response.text(); } catch (_) { detail = ''; }
    throw new Error(`${label} request failed (${response.status}). ${detail.slice(0, 260)}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    let detail = '';
    try { detail = await response.text(); } catch (_) { detail = ''; }
    throw new Error(`${label} did not return an image. ${detail.slice(0, 260)}`);
  }

  const blob = await response.blob();
  return await blobToDataUrl(blob);
}

function buildPremiumPrompt(userPrompt, width, height, options = {}) {
  const providerCanUseReferences = currentProvider() === 'puter' && !options.forceNoReferences;
  const referencesInstruction = (providerCanUseReferences && els.useReferences.checked && state.references.length)
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
    img.onerror = () => reject(new Error('Could not load generated image for resizing. Try PNG format or generate again.'));
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
  const successCount = state.generated.filter(item => item && !item.error).length;
  els.resultCount.textContent = `${successCount} image${successCount === 1 ? '' : 's'}`;
  els.downloadZipBtn.disabled = successCount === 0;
  updateRetryButton();

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
    if (!item) return '';

    if (item.error) {
      return `
        <article class="result-card error-card">
          <div class="result-body">
            <strong>Image ${i + 1} failed</strong>
            <p>${escapeHtml(item.error)}</p>
            <button class="retry-one" type="button" data-retry-one="${i}">Retry this image</button>
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

  document.querySelectorAll('[data-retry-one]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const index = parseInt(btn.dataset.retryOne, 10);
      await retryOneImage(index);
    });
  });
}

async function retryOneImage(index) {
  clearVisibleError();
  clearAllFieldErrors();
  try {
    if (!state.generated[index] || !state.generated[index].error) throw makeValidationError(`Image ${index + 1} is not failed.`, null);
    const setup = validateInputs({ onlyIndexes: [index] });
    await ensurePuterReady();
    setButtonsBusy(true);
    setProgress(0, 1, `Retrying image ${index + 1}...`);
    await generateAtIndex(index, setup.prompts[index], setup.width, setup.height, 1, 0);
    finishGeneration(parseInt(els.imageCount.value, 10));
  } catch (error) {
    handleTopLevelError(error, `Could not retry Image ${index + 1}`);
  } finally {
    setButtonsBusy(false);
    updateRetryButton();
  }
}

async function downloadZip() {
  try {
    clearVisibleError();
    if (!window.JSZip) throw new Error('JSZip did not load. Refresh and try again.');
    const successItems = state.generated.filter(item => item && !item.error && item.dataUrl);
    if (!successItems.length) throw new Error('No generated images available for ZIP download.');

    const zip = new JSZip();
    const folder = zip.folder('bulk-image-maker-ai-images');
    for (const item of successItems) {
      folder.file(item.filename, dataUrlToBase64(item.dataUrl), { base64: true });
    }

    const failedItems = state.generated
      .map((item, index) => item?.error ? ({ image: index + 1, prompt: item.prompt, error: item.error }) : null)
      .filter(Boolean);

    const manifest = {
      created_at: new Date().toISOString(),
      total_successful_images: successItems.length,
      total_failed_images: failedItems.length,
      provider: currentProviderName(),
      model: els.modelSelect.value,
      quality: els.qualitySelect.value,
      size: {
        width: parseInt(els.widthInput.value, 10),
        height: parseInt(els.heightInput.value, 10)
      },
      used_reference_images: els.useReferences.checked ? state.references.map(r => r.name) : [],
      images: successItems.map(item => ({ filename: item.filename, prompt: item.prompt })),
      failed: failedItems
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
    const message = cleanError(error);
    showVisibleError('ZIP download failed', message, 'Try generating at least one image first, then click Download ZIP again.');
    log(`ZIP error: ${message}`);
  }
}

function dataUrlToBase64(dataUrl) {
  return dataUrl.split(',')[1] || '';
}

function setButtonsBusy(isBusy) {
  els.generateBtn.disabled = isBusy;
  els.generateBtn.textContent = isBusy ? 'Generating...' : 'Generate Images';
  if (els.retryFailedBtn) els.retryFailedBtn.disabled = isBusy || !hasFailedImages();
}

function updateRetryButton() {
  if (!els.retryFailedBtn) return;
  const failedCount = state.generated.filter(item => item && item.error).length;
  els.retryFailedBtn.disabled = failedCount === 0;
  els.retryFailedBtn.textContent = failedCount ? `Retry Failed Only (${failedCount})` : 'Retry Failed Only';
}

function hasFailedImages() {
  return state.generated.some(item => item && item.error);
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

function showVisibleError(title, message, subtitle = 'Please fix the issue below and try again.', options = {}) {
  if (!els.errorPanel) return;
  els.errorTitle.textContent = title || 'Action needed';
  els.errorSubtitle.textContent = subtitle;
  if (options.html) els.errorMessage.innerHTML = message || 'Unknown error';
  else els.errorMessage.textContent = message || 'Unknown error';
  els.errorPanel.hidden = false;
  if (options.scroll !== false) {
    els.errorPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function clearVisibleError() {
  if (!els.errorPanel) return;
  els.errorPanel.hidden = true;
  els.errorTitle.textContent = 'Action needed';
  els.errorSubtitle.textContent = 'Please fix the issue below and try again.';
  els.errorMessage.textContent = '';
}

function makeValidationError(message, target) {
  const error = new Error(message);
  error.target = target || null;
  return error;
}

function getPromptInput(index) {
  return document.querySelector(`.prompt-input[data-index="${index}"]`);
}

function markPromptError(index) {
  const input = getPromptInput(index);
  if (!input) return;
  setFieldError(input);
  const card = input.closest('.prompt-card');
  if (card) card.classList.add('has-error');
  const status = document.querySelector(`[data-status-for="${index}"]`);
  if (status) {
    status.textContent = 'Error — fix or retry';
    status.classList.remove('ok');
    status.classList.add('bad');
  }
}

function clearPromptError(input) {
  if (!input) return;
  clearFieldError(input);
  const card = input.closest('.prompt-card');
  if (card) card.classList.remove('has-error');
  const idx = input.dataset.index;
  const status = document.querySelector(`[data-status-for="${idx}"]`);
  if (status) status.classList.remove('bad');
}

function setFieldError(el) {
  if (!el) return;
  el.classList.add('field-error');
  const card = el.closest('.prompt-card');
  if (card) card.classList.add('has-error');
}

function clearFieldError(el) {
  if (!el) return;
  el.classList.remove('field-error');
  const card = el.closest('.prompt-card');
  if (card) card.classList.remove('has-error');
}

function clearAllFieldErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));
  document.querySelectorAll('.prompt-card.has-error').forEach(card => card.classList.remove('has-error'));
  document.querySelectorAll('.prompt-status.bad').forEach(status => status.classList.remove('bad'));
}

function scrollToField(el) {
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => {
    if (typeof el.focus === 'function') el.focus({ preventScroll: true });
  }, 350);
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read generated image blob.'));
    reader.readAsDataURL(blob);
  });
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
