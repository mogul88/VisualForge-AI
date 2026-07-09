'use strict';

const PLATFORM_PRESETS = [
  {id:'etsy', label:'Etsy Listing — 2000 × 2000', w:2000, h:2000, overlay:'etsy'},
  {id:'etsy-banner', label:'Etsy Banner — 1600 × 400', w:1600, h:400, overlay:'banner'},
  {id:'fb-square', label:'Facebook Square — 1080 × 1080', w:1080, h:1080, overlay:'facebook'},
  {id:'fb-story', label:'Facebook Story — 1080 × 1920', w:1080, h:1920, overlay:'story'},
  {id:'pin', label:'Pinterest Pin — 1000 × 1500', w:1000, h:1500, overlay:'pinterest'},
  {id:'blog', label:'Blog Feature — 1200 × 630', w:1200, h:630, overlay:'website'},
  {id:'hero', label:'Website Hero — 1600 × 900', w:1600, h:900, overlay:'website'},
  {id:'roof', label:'Roofing Hero — 1600 × 900', w:1600, h:900, overlay:'roof'},
  {id:'custom', label:'Custom Size', w:1200, h:800, overlay:'custom'}
];
const STYLE_PRESETS = [
  {id:'clean-product', label:'Clean product photo', add:'clean realistic product photography, soft natural light, premium commercial composition'},
  {id:'cozy-etsy', label:'Cozy Etsy printable', add:'warm beige desk, neutral styling, soft shadows, realistic printable shop product photography'},
  {id:'facebook-bright', label:'Bright social promo', add:'bright modern lifestyle background, clean negative space, premium social media marketing visual'},
  {id:'dark-roofing', label:'Dark roofing engineering', add:'luxury modern American house exterior, roof clearly visible, cinematic dusk lighting, dark navy premium engineering mood'},
  {id:'minimal', label:'Minimal background', add:'minimal clean background, smooth lighting, lots of empty space, realistic high quality'}
];
const OVERLAY_PRESETS = [
  {id:'etsy', label:'Etsy product thumbnail'},
  {id:'facebook', label:'Facebook promo'},
  {id:'story', label:'Story sale layout'},
  {id:'pinterest', label:'Pinterest tall pin'},
  {id:'website', label:'Website/blog hero'},
  {id:'roof', label:'Roofing calculator dashboard'},
  {id:'banner', label:'Clean banner'},
  {id:'custom', label:'Custom / minimal'}
];
const PRODUCT_MODES = [
  {id:'right-card', label:'Right floating product card'},
  {id:'left-card', label:'Left floating product card'},
  {id:'center', label:'Center product hero'},
  {id:'bottom-stack', label:'Bottom product stack'},
  {id:'full-bleed', label:'Full product background card'},
  {id:'none', label:'No product image'}
];

const els = {};
const state = { backgrounds: [], products: [], selectedBg: 0, selectedProduct: 0, busy: false };
let ctx;

window.addEventListener('DOMContentLoaded', init);
function init(){
  bind(); populate(); bindEvents(); applyPlatform('etsy'); applyOverlayPreset('etsy'); resizeCanvas(); draw();
  setStatus('Ready','v11 loaded. Use AI background OR upload a background, then upload product image and customize overlay.','success');
}
function bind(){
  ['platformPreset','widthInput','heightInput','imageCount','stylePreset','bgPrompts','enhancePrompt','emptySpace','noLogo','generateBtn','bgUpload','status','overlayPreset','productMode','showProduct','showTitle','showBadges','showCards','showCta','showFooter','showGrid','showVignette','productUpload','productThumbs','titleText','subtitleText','badge1','badge2','ctaText','footerText','cardsText','accentColor','buttonColor','textColor','cardColor','badgeBgColor','badgeTextColor','overlayOpacity','titleSize','productSize','productX','productY','productRot','bgDim','canvas','bgThumbs','refreshBtn','downloadCurrentBtn','zipBtn','exportFormat','roofPromptBtn','etsyPromptBtn','fbPromptBtn','roofColorsBtn','etsyColorsBtn'].forEach(id=>els[id]=document.getElementById(id));
  ctx = els.canvas.getContext('2d');
}
function populate(){
  els.platformPreset.innerHTML = PLATFORM_PRESETS.map(x=>`<option value="${x.id}">${x.label}</option>`).join('');
  els.stylePreset.innerHTML = STYLE_PRESETS.map(x=>`<option value="${x.id}">${x.label}</option>`).join('');
  els.overlayPreset.innerHTML = OVERLAY_PRESETS.map(x=>`<option value="${x.id}">${x.label}</option>`).join('');
  els.productMode.innerHTML = PRODUCT_MODES.map(x=>`<option value="${x.id}">${x.label}</option>`).join('');
}
function bindEvents(){
  els.platformPreset.addEventListener('change',()=>applyPlatform(els.platformPreset.value));
  els.overlayPreset.addEventListener('change',()=>applyOverlayPreset(els.overlayPreset.value));
  els.widthInput.addEventListener('input',()=>{resizeCanvas();draw();});
  els.heightInput.addEventListener('input',()=>{resizeCanvas();draw();});
  els.generateBtn.addEventListener('click',generateBackgrounds);
  els.bgUpload.addEventListener('change',handleBgUpload);
  els.productUpload.addEventListener('change',handleProductUpload);
  els.refreshBtn.addEventListener('click',draw);
  els.downloadCurrentBtn.addEventListener('click',downloadCurrent);
  els.zipBtn.addEventListener('click',downloadZip);
  els.roofPromptBtn.addEventListener('click',()=>{els.bgPrompts.value='Ultra realistic cinematic photo of a luxury modern American suburban house with a steep dark shingle gable roof at dusk, warm lights glowing from windows, roof clearly visible, premium landscaping, clean driveway, dramatic navy evening sky, professional home improvement website hero image, no text, no watermark';});
  els.etsyPromptBtn.addEventListener('click',()=>{els.bgPrompts.value='cozy beige desk flat lay for a printable product mockup, soft natural light, coffee cup, pencil, small plant, clean neutral background, realistic Etsy product photography, empty space for overlay, no text, no watermark';});
  els.fbPromptBtn.addEventListener('click',()=>{els.bgPrompts.value='bright modern lifestyle desk scene for a digital product promotion, soft natural light, pastel accents, clean empty space for bold overlay text, realistic social media ad background, no text, no logo, no watermark';});
  els.roofColorsBtn.addEventListener('click',()=>{setColors('#f59e0b','#2563eb','#ffffff','#0b1120','#fef3c7','#111827');draw();});
  els.etsyColorsBtn.addEventListener('click',()=>{setColors('#d97706','#10b981','#2f2a25','#fff7ed','#fef3c7','#3b2f2f');draw();});
  document.querySelectorAll('input,select,textarea').forEach(el=>{
    if(['bgPrompts','imageCount','bgUpload','productUpload'].includes(el.id)) return;
    el.addEventListener('input',draw); el.addEventListener('change',draw);
  });
}
function applyPlatform(id){
  const p = PLATFORM_PRESETS.find(x=>x.id===id) || PLATFORM_PRESETS[0];
  els.widthInput.value=p.w; els.heightInput.value=p.h; els.overlayPreset.value=p.overlay; applyOverlayPreset(p.overlay,false); resizeCanvas(); draw();
}
function applyOverlayPreset(id, redraw=true){
  const data={
    etsy:{title:'Weekly Planner Bundle',sub:'Editable Canva Template + Printable PDF',b1:'Editable in Canva',b2:'Instant Download',cta:'Shop Now',footer:'ThePrintableSeason',cards:'US Letter + A4 | Included\nEasy to Edit | Canva\nPrint at Home | PDF',mode:'right-card',colors:['#d97706','#10b981','#2f2a25','#fff7ed','#fef3c7','#3b2f2f'],style:'cozy-etsy'},
    facebook:{title:'New Printable Bundle',sub:'Simple, editable, and ready to use',b1:'50% OFF',b2:'Limited Time',cta:'Shop Now',footer:'Digital Download',cards:'Editable | Canva\nInstant | Access\nPrintable | PDF',mode:'left-card',colors:['#fb7185','#7c3aed','#ffffff','#111827','#ffffff','#111827'],style:'facebook-bright'},
    story:{title:'Back to School Bundle',sub:'Editable templates for busy parents & students',b1:'SALE',b2:'Instant Access',cta:'Tap to Shop',footer:'Printable + Canva',cards:'Planner | PDF\nChecklist | Included\nCanva | Editable',mode:'center',colors:['#f59e0b','#ec4899','#ffffff','#111827','#fffbeb','#111827'],style:'facebook-bright'},
    pinterest:{title:'Printable Planner',sub:'Organize your week beautifully',b1:'Editable',b2:'PDF Included',cta:'Save This',footer:'ThePrintableSeason',cards:'Clean Layout | Simple\nA4 + Letter | Sizes\nDigital | Download',mode:'center',colors:['#d97706','#059669','#ffffff','#0f172a','#fffbeb','#111827'],style:'cozy-etsy'},
    website:{title:'Build Smarter. Estimate Faster.',sub:'Premium calculators and visual guides for better project planning',b1:'Fast Estimates',b2:'Clean Reports',cta:'Open Calculator',footer:'RoofPitchCalculators.com',cards:'Roof Area | 1,562 sq ft\nRoof Pitch | 6 / 12\nRoof Angle | 26.57°\nRafter Length | 16 ft',mode:'right-card',colors:['#f59e0b','#2563eb','#ffffff','#0b1120','#fef3c7','#111827'],style:'dark-roofing'},
    roof:{title:'Estimate Roof Costs with Confidence.',sub:'Roof Cost Calculator',b1:'6/12 Pitch',b2:'26.57° Angle',cta:'Calculate Now',footer:'RoofPitchCalculators.com',cards:'Total Estimate | $18,560\nRoof Area | 1,562 sq ft\nRoofing Squares | 15.62\nMaterial Cost | $9,820\nLabor Estimate | $6,450\nTimeline | 2 - 4 days',mode:'none',colors:['#f59e0b','#f59e0b','#ffffff','#0b1120','#fef3c7','#111827'],style:'dark-roofing'},
    banner:{title:'Premium Digital Templates',sub:'Editable, printable, and ready in minutes',b1:'Canva',b2:'Instant',cta:'Shop Now',footer:'',cards:'',mode:'right-card',colors:['#f59e0b','#10b981','#ffffff','#0f172a','#fffbeb','#111827'],style:'clean-product'},
    custom:{title:'Your Custom Title',sub:'Your subtitle goes here',b1:'Badge One',b2:'Badge Two',cta:'Learn More',footer:'YourBrand.com',cards:'Feature | Value\nFeature | Value',mode:'right-card',colors:['#f59e0b','#10b981','#ffffff','#0f172a','#fffbeb','#111827'],style:'clean-product'}
  }[id] || null;
  if(!data) return;
  els.titleText.value=data.title; els.subtitleText.value=data.sub; els.badge1.value=data.b1; els.badge2.value=data.b2; els.ctaText.value=data.cta; els.footerText.value=data.footer; els.cardsText.value=data.cards; els.productMode.value=data.mode; els.stylePreset.value=data.style; setColors(...data.colors); if(redraw) draw();
}
function setColors(a,b,t,c,bb,bt){els.accentColor.value=a;els.buttonColor.value=b;els.textColor.value=t;els.cardColor.value=c;els.badgeBgColor.value=bb;els.badgeTextColor.value=bt;}
function resizeCanvas(){els.canvas.width=clamp(parseInt(els.widthInput.value,10),320,4096);els.canvas.height=clamp(parseInt(els.heightInput.value,10),320,4096);}
async function generateBackgrounds(){
  clearErr(); const w=clamp(parseInt(els.widthInput.value,10),320,4096), h=clamp(parseInt(els.heightInput.value,10),320,4096), count=parseInt(els.imageCount.value,10);
  if(!count||count<1) return fail(els.imageCount,'Missing image count','Enter how many images you want. Example: 3');
  if(count>12) return fail(els.imageCount,'Too many images','Generate max 12 at a time for browser stability.');
  const prompts=els.bgPrompts.value.split('\n').map(x=>x.trim()).filter(Boolean);
  if(!prompts.length) return fail(els.bgPrompts,'Missing prompt','Write at least one background prompt or click a quick prompt button.');
  setBusy(true); state.backgrounds=[]; state.selectedBg=0; renderBgThumbs(); resizeCanvas();
  for(let i=0;i<count;i++){
    const prompt=buildPrompt(prompts[i]||prompts[0],w,h,i); setStatus('Generating background',`Image ${i+1} of ${count} via Pollinations Free...`,'');
    try{const dataUrl=await pollinations(prompt,w,h,i); state.backgrounds.push({dataUrl,prompt,error:null}); state.selectedBg=state.backgrounds.length-1; renderBgThumbs(); await draw();}
    catch(e){state.backgrounds.push({dataUrl:'',prompt,error:clean(e)}); renderBgThumbs(); setStatus('One background failed',clean(e),'error');}
  }
  const ok=state.backgrounds.filter(x=>x.dataUrl).length; els.downloadCurrentBtn.disabled=ok===0; els.zipBtn.disabled=ok===0;
  if(ok){state.selectedBg=state.backgrounds.findIndex(x=>x.dataUrl);renderBgThumbs();await draw();setStatus('Ready to export',`${ok}/${count} backgrounds ready. Overlay and product image are real canvas elements.`, 'success');}
  else setStatus('Generation failed','No background was generated. Try shorter prompt or upload your own background.', 'error');
  setBusy(false);
}
function buildPrompt(user,w,h,i){const style=STYLE_PRESETS.find(x=>x.id===els.stylePreset.value)||STYLE_PRESETS[0];const parts=[user];if(els.enhancePrompt.checked)parts.push(style.add);if(els.emptySpace.checked)parts.push('clean negative space for overlay, balanced composition, avoid busy center if product overlay is used');parts.push('no text, no letters, no numbers, no watermark, no logo, no fake typography, no UI panels, no gibberish, realistic high quality');parts.push(`aspect ratio ${w}:${h}, final marketing background, variation ${i+1}`);return parts.join(', ');}
async function pollinations(prompt,w,h,i){const params=new URLSearchParams({width:String(w),height:String(h),model:'flux',seed:String(Date.now()+i*981),enhance:'false',safe:'true'}); if(els.noLogo.checked)params.set('nologo','true'); const url=`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`; const res=await fetch(url,{cache:'no-store'}); if(!res.ok)throw new Error(`Pollinations returned ${res.status}`); const blob=await res.blob(); if(!blob.type.startsWith('image/'))throw new Error('Provider did not return an image.'); return blobToDataUrl(blob);}
async function handleBgUpload(e){for(const f of Array.from(e.target.files||[])){if(!f.type.startsWith('image/'))continue;const dataUrl=await fileToDataUrl(f);state.backgrounds.push({dataUrl,prompt:f.name,error:null,uploaded:true});}e.target.value='';if(state.backgrounds.length){state.selectedBg=state.backgrounds.length-1;renderBgThumbs();els.downloadCurrentBtn.disabled=false;els.zipBtn.disabled=false;draw();setStatus('Background uploaded','Use overlay builder and export final image.','success');}}
async function handleProductUpload(e){for(const f of Array.from(e.target.files||[])){if(!f.type.startsWith('image/'))continue;const dataUrl=await fileToDataUrl(f);state.products.push({id:rid(),name:f.name,dataUrl});}e.target.value='';if(state.products.length)state.selectedProduct=state.products.length-1;renderProductThumbs();draw();}
function renderBgThumbs(){if(!state.backgrounds.length){els.bgThumbs.innerHTML='<div class="empty">Generated/uploaded backgrounds appear here.</div>';return;}els.bgThumbs.innerHTML=state.backgrounds.map((b,i)=>b.dataUrl?`<div class="thumb ${i===state.selectedBg?'active':''}" data-i="${i}"><img src="${b.dataUrl}"><span>${b.uploaded?'Upload':'AI'} ${i+1}</span></div>`:`<div class="thumb" data-i="${i}"><div class="empty">Failed</div><span>${i+1}</span></div>`).join('');els.bgThumbs.querySelectorAll('[data-i]').forEach(x=>x.onclick=()=>{state.selectedBg=+x.dataset.i;renderBgThumbs();draw();});}
function renderProductThumbs(){els.productThumbs.innerHTML=state.products.map((p,i)=>`<div class="product-thumb ${i===state.selectedProduct?'active':''}" data-i="${i}"><img src="${p.dataUrl}"><button data-del="${p.id}" type="button">×</button></div>`).join('');els.productThumbs.querySelectorAll('[data-i]').forEach(x=>x.onclick=e=>{if(e.target.dataset.del)return;state.selectedProduct=+x.dataset.i;renderProductThumbs();draw();});els.productThumbs.querySelectorAll('[data-del]').forEach(b=>b.onclick=e=>{e.stopPropagation();state.products=state.products.filter(p=>p.id!==b.dataset.del);state.selectedProduct=Math.max(0,Math.min(state.selectedProduct,state.products.length-1));renderProductThumbs();draw();});}
async function draw(){resizeCanvas();const w=els.canvas.width,h=els.canvas.height;ctx.clearRect(0,0,w,h);const bg=state.backgrounds[state.selectedBg];if(bg&&bg.dataUrl){const img=await loadImage(bg.dataUrl);drawCover(img,0,0,w,h);}else drawDefaultBg(w,h);const dim=parseInt(els.bgDim.value,10)/100;if(dim>0){ctx.fillStyle=`rgba(0,0,0,${dim})`;ctx.fillRect(0,0,w,h);}if(els.showGrid.checked)drawGrid(w,h);if(els.showVignette.checked)drawVignette(w,h);if(els.showProduct.checked)await drawProduct(w,h);drawOverlay(w,h);}
function drawDefaultBg(w,h){const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#111827');g.addColorStop(.55,'#0f172a');g.addColorStop(1,'#020617');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.fillStyle='rgba(255,255,255,.08)';round(w*.08,h*.16,w*.84,h*.68,Math.min(w,h)*.04,true,false);ctx.fillStyle='rgba(255,255,255,.75)';ctx.font=`800 ${Math.max(18,w*.025)}px system-ui`;ctx.textAlign='center';ctx.fillText('Generate or upload a background image',w/2,h/2);ctx.textAlign='left';}
function drawGrid(w,h){ctx.save();ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=Math.max(1,w*.0008);const step=Math.max(42,Math.min(w,h)*.08);for(let x=-w;x<w*2;x+=step){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+w*.35,h);ctx.stroke();}for(let y=0;y<h;y+=step){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y-h*.12);ctx.stroke();}ctx.restore();}
function drawVignette(w,h){const g=ctx.createRadialGradient(w*.5,h*.45,Math.min(w,h)*.12,w*.5,h*.5,Math.max(w,h)*.76);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.48)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}
async function drawProduct(w,h){if(!state.products.length||els.productMode.value==='none')return;const p=state.products[state.selectedProduct]||state.products[0];const img=await loadImage(p.dataUrl);const mode=els.productMode.value;let cx=w*(parseInt(els.productX.value,10)/100),cy=h*(parseInt(els.productY.value,10)/100);let maxW=Math.min(w,h)*(parseInt(els.productSize.value,10)/100);if(mode==='center'){cx=w*.5;cy=h*.55;maxW=Math.min(w,h)*.62;}if(mode==='left-card'){cx=w*.25;}if(mode==='right-card'){cx=w*.73;}if(mode==='bottom-stack'){cx=w*.5;cy=h*.72;maxW=Math.min(w,h)*.48;}if(mode==='full-bleed'){cx=w*.5;cy=h*.55;maxW=Math.min(w,h)*.72;}const aspect=img.naturalHeight/img.naturalWidth;const iw=maxW,ih=iw*aspect;const rot=parseInt(els.productRot.value,10)*Math.PI/180;ctx.save();ctx.translate(cx,cy);ctx.rotate(rot);ctx.shadowColor='rgba(0,0,0,.38)';ctx.shadowBlur=Math.min(w,h)*.05;ctx.shadowOffsetY=Math.min(w,h)*.018;ctx.fillStyle='rgba(255,255,255,.94)';round(-iw/2-w*.015,-ih/2-h*.015,iw+w*.03,ih+h*.03,Math.min(w,h)*.026,true,false);ctx.shadowColor='transparent';clipRound(-iw/2,-ih/2,iw,ih,Math.min(w,h)*.018);ctx.drawImage(img,-iw/2,-ih/2,iw,ih);ctx.restore();}
function drawOverlay(w,h){const id=els.overlayPreset.value,c=colors(),title=els.titleText.value,sub=els.subtitleText.value,b1=els.badge1.value,b2=els.badge2.value,cta=els.ctaText.value,footer=els.footerText.value,cards=parseCards();if(id==='roof')return drawRoof(w,h,c,title,sub,b1,b2,cta,footer,cards);if(id==='website')return drawWebsite(w,h,c,title,sub,b1,b2,cta,footer,cards);if(id==='facebook')return drawFacebook(w,h,c,title,sub,b1,b2,cta,footer,cards);if(id==='story'||id==='pinterest')return drawTall(w,h,c,title,sub,b1,b2,cta,footer,cards);if(id==='banner')return drawBanner(w,h,c,title,sub,b1,b2,cta,footer,cards);return drawEtsy(w,h,c,title,sub,b1,b2,cta,footer,cards);}
function drawEtsy(w,h,c,title,sub,b1,b2,cta,footer,cards){if(els.showTitle.checked){drawBadges(w*.07,h*.07,b1,b2,c);drawTitle(title,sub,w*.07,h*.17,w*.50,c);}if(els.showCards.checked)drawCardList(cards,w*.07,h*.58,w*.34,h*.08,c);if(els.showCta.checked)drawButton(cta,w*.07,h*.83,w*.28,h*.075,c);if(els.showFooter.checked)drawFooter(footer,w,h,c);}
function drawFacebook(w,h,c,title,sub,b1,b2,cta,footer,cards){glass(w*.06,h*.12,w*.48,h*.72,c,Math.min(w,h)*.035);if(els.showBadges.checked)drawBadges(w*.09,h*.18,b1,b2,c);if(els.showTitle.checked)drawTitle(title,sub,w*.09,h*.30,w*.39,c);if(els.showCards.checked)drawCardList(cards,w*.09,h*.58,w*.36,h*.065,c);if(els.showCta.checked)drawButton(cta,w*.09,h*.78,w*.28,h*.08,c);if(els.showFooter.checked)drawFooter(footer,w,h,c);}
function drawTall(w,h,c,title,sub,b1,b2,cta,footer,cards){if(els.showTitle.checked){drawBadges(w*.08,h*.07,b1,b2,c);drawTitle(title,sub,w*.08,h*.15,w*.84,c,parseInt(els.titleSize.value,10)*.88);}if(els.showCards.checked)drawCardList(cards,w*.08,h*.62,w*.84,h*.045,c);if(els.showCta.checked)drawButton(cta,w*.20,h*.88,w*.60,h*.052,c);if(els.showFooter.checked)drawFooter(footer,w,h,c);}
function drawWebsite(w,h,c,title,sub,b1,b2,cta,footer,cards){if(els.showTitle.checked){drawBadges(w*.06,h*.14,b1,b2,c);drawTitle(title,sub,w*.06,h*.26,w*.48,c);}if(els.showCards.checked)drawMetricCards(cards,w*.62,h*.15,w*.32,h*.12,c);if(els.showCta.checked)drawButton(cta,w*.06,h*.66,w*.22,h*.08,c);if(els.showFooter.checked)drawFooter(footer,w,h,c);drawLines(w,h,c);}
function drawRoof(w,h,c,title,sub,b1,b2,cta,footer,cards){if(els.showTitle.checked){ctx.textAlign='center';ctx.fillStyle=c.text;ctx.font=`900 ${Math.max(30,w*.055)}px Georgia,serif`;ctx.fillText(title,w*.5,h*.09);ctx.font=`800 ${Math.max(16,w*.018)}px system-ui`;ctx.fillStyle='rgba(255,255,255,.75)';ctx.fillText(sub,w*.5,h*.145);ctx.textAlign='left';}if(els.showCards.checked){drawMetricCards(cards.slice(0,3),w*.035,h*.18,w*.22,h*.11,c);drawMetricCards(cards.slice(3,6),w*.76,h*.18,w*.21,h*.11,c);}if(els.showCta.checked)drawCalculator(w,h,c,cta);if(els.showBadges.checked)drawBadges(w*.42,h*.82,b1,b2,c);if(els.showFooter.checked)drawFooter(footer,w,h,c);drawLines(w,h,c);}
function drawBanner(w,h,c,title,sub,b1,b2,cta,footer,cards){glass(w*.05,h*.14,w*.54,h*.72,c,Math.min(w,h)*.08);if(els.showBadges.checked)drawBadges(w*.08,h*.25,b1,b2,c);if(els.showTitle.checked)drawTitle(title,sub,w*.08,h*.42,w*.45,c,Math.max(28,w*.04));if(els.showCta.checked)drawButton(cta,w*.08,h*.70,w*.22,h*.13,c);if(els.showFooter.checked)drawFooter(footer,w,h,c);}
function parseCards(){return els.cardsText.value.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{const [a,b]=l.split('|');return{label:(a||'').trim(),value:(b||'').trim()};});}
function colors(){const op=parseInt(els.overlayOpacity.value,10)/100;return{accent:els.accentColor.value,button:els.buttonColor.value,text:els.textColor.value,card:hexRgba(els.cardColor.value,op),cardSolid:els.cardColor.value,badge:els.badgeBgColor.value,badgeText:els.badgeTextColor.value};}
function drawTitle(title,sub,x,y,maxW,c,size){size=size||parseInt(els.titleSize.value,10);ctx.fillStyle=c.text;ctx.font=`950 ${Math.max(24,size)}px system-ui`;ctx.textBaseline='top';wrap(title,x,y,maxW,size*1.05,3);ctx.fillStyle='rgba(255,255,255,.82)';ctx.font=`750 ${Math.max(14,size*.32)}px system-ui`;wrap(sub,x,y+size*2.25,maxW,size*.48,3);ctx.textBaseline='alphabetic';}
function drawBadges(x,y,b1,b2,c){if(!els.showBadges.checked)return;let cur=x;[b1,b2].filter(Boolean).forEach(t=>{ctx.font=`900 ${Math.max(13,els.canvas.width*.014)}px system-ui`;const tw=ctx.measureText(t).width,bw=tw+els.canvas.width*.035,bh=els.canvas.height*.055;ctx.fillStyle=c.badge;round(cur,y,bw,bh,bh/2,true,false);ctx.fillStyle=c.badgeText;ctx.textBaseline='middle';ctx.fillText(t,cur+bw*.14,y+bh/2);cur+=bw+els.canvas.width*.012;});ctx.textBaseline='alphabetic';}
function drawCardList(cards,x,y,w,cardH,c){cards.slice(0,4).forEach((it,i)=>{const yy=y+i*(cardH+els.canvas.height*.015);glass(x,yy,w,cardH,c,cardH*.18);ctx.fillStyle=c.accent;ctx.font=`900 ${Math.max(13,cardH*.22)}px system-ui`;ctx.fillText(it.label,x+w*.08,yy+cardH*.36);ctx.fillStyle=c.text;ctx.font=`900 ${Math.max(16,cardH*.34)}px Georgia,serif`;ctx.fillText(it.value||'',x+w*.08,yy+cardH*.72);});}
function drawMetricCards(cards,x,y,w,cardH,c){cards.forEach((it,i)=>{const yy=y+i*(cardH+els.canvas.height*.025);glass(x,yy,w,cardH,c,cardH*.18);ctx.strokeStyle=c.accent;ctx.lineWidth=Math.max(2,els.canvas.width*.002);ctx.beginPath();ctx.arc(x+w*.12,yy+cardH*.5,cardH*.22,0,Math.PI*1.5);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.74)';ctx.font=`850 ${Math.max(12,cardH*.18)}px system-ui`;ctx.fillText(it.label,x+w*.24,yy+cardH*.36);ctx.fillStyle=c.accent;ctx.font=`950 ${Math.max(18,cardH*.34)}px Georgia,serif`;ctx.fillText(it.value,x+w*.24,yy+cardH*.72);});}
function drawCalculator(w,h,c,cta){const x=w*.46,y=h*.68,pw=w*.20,ph=h*.18;glass(x,y,pw,ph,c,Math.min(w,h)*.02);ctx.fillStyle=c.text;ctx.font=`850 ${w*.014}px system-ui`;ctx.fillText('CALCULATOR',x+pw*.08,y+ph*.20);['Pitch        6 / 12','Area         1,562 sq ft'].forEach((t,i)=>{ctx.fillStyle='rgba(255,255,255,.08)';round(x+pw*.08,y+ph*(.34+i*.20),pw*.84,ph*.12,ph*.04,true,false);ctx.fillStyle='rgba(255,255,255,.85)';ctx.font=`750 ${w*.011}px system-ui`;ctx.fillText(t,x+pw*.12,y+ph*(.43+i*.20));});drawButton(cta,x+pw*.08,y+ph*.74,pw*.84,ph*.18,c);}
function drawButton(text,x,y,w,h,c){if(!text||!els.showCta.checked)return;ctx.save();ctx.shadowColor='rgba(0,0,0,.30)';ctx.shadowBlur=20;ctx.shadowOffsetY=7;ctx.fillStyle=c.button;round(x,y,w,h,h/2,true,false);ctx.shadowColor='transparent';ctx.fillStyle='#06110b';ctx.font=`950 ${Math.max(13,h*.32)}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,x+w/2,y+h/2);ctx.restore();ctx.textAlign='left';ctx.textBaseline='alphabetic';}
function drawFooter(text,w,h,c){if(!text)return;ctx.fillStyle='rgba(255,255,255,.78)';ctx.font=`850 ${Math.max(12,w*.013)}px system-ui`;ctx.textAlign='right';ctx.fillText(text,w*.95,h*.94);ctx.textAlign='left';}
function drawLines(w,h,c){ctx.save();ctx.strokeStyle=hexRgba(c.accent,.32);ctx.lineWidth=Math.max(1,w*.0012);for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(w*(.28+i*.12),h*(.35+i*.1));ctx.lineTo(w*(.48+i*.08),h*(.31+i*.05));ctx.stroke();ctx.fillStyle=c.accent;ctx.beginPath();ctx.arc(w*(.48+i*.08),h*(.31+i*.05),Math.max(3,w*.003),0,Math.PI*2);ctx.fill();}ctx.restore();}
function glass(x,y,w,h,c,r){ctx.save();ctx.shadowColor='rgba(0,0,0,.35)';ctx.shadowBlur=Math.min(w,h)*.20;ctx.shadowOffsetY=Math.min(w,h)*.06;ctx.fillStyle=c.card;round(x,y,w,h,r,true,false);ctx.shadowColor='transparent';ctx.strokeStyle='rgba(255,255,255,.16)';ctx.lineWidth=Math.max(1,els.canvas.width*.0012);round(x,y,w,h,r,false,true);ctx.restore();}
async function downloadCurrent(){await draw();await frame();const mime=els.exportFormat.value;downloadData(els.canvas.toDataURL(mime,mime==='image/jpeg'?.92:.96),name(0,mime));}
async function downloadZip(){try{if(!window.JSZip)throw new Error('JSZip not loaded');if(!state.backgrounds.some(b=>b.dataUrl))throw new Error('No backgrounds available');setBusy(true);const zip=new JSZip();let n=0;for(let i=0;i<state.backgrounds.length;i++){if(!state.backgrounds[i].dataUrl)continue;state.selectedBg=i;renderBgThumbs();await draw();await frame();const mime=els.exportFormat.value;zip.file(name(i,mime),els.canvas.toDataURL(mime,mime==='image/jpeg'?.92:.96).split(',')[1],{base64:true});n++;}zip.file('visualforge-v11-settings.json',JSON.stringify(manifest(),null,2));const blob=await zip.generateAsync({type:'blob'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`visualforge-v11-${Date.now()}.zip`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);setStatus('ZIP downloaded',`${n} final images exported.`, 'success');}catch(e){setStatus('ZIP failed',clean(e),'error');}finally{setBusy(false);}}
function name(i,mime){const ext=mime==='image/jpeg'?'jpg':mime==='image/webp'?'webp':'png';return `${String(i+1).padStart(2,'0')}-${slug(els.titleText.value||'visualforge-image')}-${els.canvas.width}x${els.canvas.height}.${ext}`;}
function manifest(){return{tool:'VisualForge AI v11',created_at:new Date().toISOString(),size:{w:els.canvas.width,h:els.canvas.height},overlay:els.overlayPreset.value,product_mode:els.productMode.value,text:{title:els.titleText.value,subtitle:els.subtitleText.value,badge1:els.badge1.value,badge2:els.badge2.value,cta:els.ctaText.value,footer:els.footerText.value,cards:els.cardsText.value},products:state.products.map(p=>p.name),backgrounds:state.backgrounds.map(b=>({uploaded:!!b.uploaded,prompt:b.prompt,error:b.error}))};}
function setBusy(v){state.busy=v;els.generateBtn.disabled=v;els.downloadCurrentBtn.disabled=v||!state.backgrounds.some(b=>b.dataUrl);els.zipBtn.disabled=v||!state.backgrounds.some(b=>b.dataUrl);els.generateBtn.textContent=v?'Working...':'Generate Backgrounds';els.generateBtn.classList.toggle('pulse',v);}
function setStatus(t,m,type){els.status.querySelector('strong').textContent=t;els.status.querySelector('span').textContent=m;els.status.classList.remove('error','success');if(type)els.status.classList.add(type);}
function fail(el,t,m){el.classList.add('field-error');el.scrollIntoView({behavior:'smooth',block:'center'});el.focus();setStatus(t,m,'error');}
function clearErr(){document.querySelectorAll('.field-error').forEach(x=>x.classList.remove('field-error'));}
function loadImage(src){return new Promise((res,rej)=>{const img=new Image();img.crossOrigin='anonymous';img.onload=()=>res(img);img.onerror=()=>rej(new Error('Could not load image'));img.src=src;});}
function drawCover(img,x,y,w,h){const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,s=Math.max(w/iw,h/ih),dw=iw*s,dh=ih*s;ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);}
function round(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();if(fill)ctx.fill();if(stroke)ctx.stroke();}
function clipRound(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();ctx.clip();}
function wrap(text,x,y,maxW,lineH,maxLines=3){if(!text)return;const words=String(text).split(/\s+/);let line='',lines=0;for(let i=0;i<words.length;i++){const test=line?line+' '+words[i]:words[i];if(ctx.measureText(test).width>maxW&&i>0){ctx.fillText(line,x,y);line=words[i];y+=lineH;lines++;if(lines>=maxLines-1){line += i<words.length-1?'…':'';break;}}else line=test;}ctx.fillText(line,x,y);}
function hexRgba(hex,a){const h=hex.replace('#','');return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;}
function fileToDataUrl(f){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(new Error(`Could not read ${f.name}`));r.readAsDataURL(f);});}
function blobToDataUrl(b){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(new Error('Could not read image blob'));r.readAsDataURL(b);});}
function downloadData(url,n){const a=document.createElement('a');a.href=url;a.download=n;document.body.appendChild(a);a.click();a.remove();}
function frame(){return new Promise(r=>requestAnimationFrame(()=>setTimeout(r,60)));}
function clamp(n,min,max){if(Number.isNaN(n))return min;return Math.min(max,Math.max(min,n));}
function slug(s){return String(s).toLowerCase().replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70)||'image';}
function rid(){return `${Date.now()}-${Math.random().toString(16).slice(2)}`;}
function clean(e){return(e&&e.message?e.message:String(e||'Unknown error')).replace(/\s+/g,' ').trim();}
