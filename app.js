/**
 * Swish & NFC URL Generator Suite - Application Logic
 * Supports:
 * - 💳 Swish: Universal HTTPS (app.swish.nu) & App Deep Link (swish://)
 * - 📶 Wi-Fi: Direct connect (WIFI:S:...)
 * - 🔗 Web URL: Any website, menu, social profile
 * - 📇 vCard: Digital business card
 * - 📍 Maps: Google Maps location
 * - 💬 SMS / Phone Call
 */

(function () {
  'use strict';

  // State
  let activeCategory = 'swish'; // 'swish', 'wifi', 'url', 'vcard', 'maps', 'sms'
  let currentSwishFormat = 'universal'; // 'universal' or 'scheme'
  let qrInstance = null;
  let nfcAbortController = null;

  // Global Output Elements
  const generatedUrlTextarea = document.getElementById('generatedUrl');
  const copyUrlBtn = document.getElementById('copyUrlBtn');
  const testSwishBtn = document.getElementById('testSwishBtn');
  const testBtnText = document.getElementById('testBtnText');
  const byteCounter = document.getElementById('byteCounter');
  const meterFill213 = document.getElementById('meterFill213');
  const verdict213 = document.getElementById('verdict213');
  const meterFill215 = document.getElementById('meterFill215');
  const qrcodeCanvas = document.getElementById('qrcodeCanvas');
  const downloadQrBtn = document.getElementById('downloadQrBtn');
  const qrInfoDesc = document.getElementById('qrInfoDesc');
  const qrMetaChips = document.getElementById('qrMetaChips');

  // Web NFC Elements
  const nfcSupportBadge = document.getElementById('nfcSupportBadge');
  const nfcStatusText = document.getElementById('nfcStatusText');
  const webNfcAvailableArea = document.getElementById('webNfcAvailableArea');
  const webNfcFallbackArea = document.getElementById('webNfcFallbackArea');
  const startNfcWriteBtn = document.getElementById('startNfcWriteBtn');
  const nfcModal = document.getElementById('nfcModal');
  const cancelNfcModalBtn = document.getElementById('cancelNfcModalBtn');
  const nfcModalTitle = document.getElementById('nfcModalTitle');
  const nfcModalDesc = document.getElementById('nfcModalDesc');

  // Mockup Elements
  const mockupTypeBadge = document.getElementById('mockupTypeBadge');
  const mockupScreenSwish = document.getElementById('mockupScreenSwish');
  const mockupScreenGeneric = document.getElementById('mockupScreenGeneric');
  const mockPayee = document.getElementById('mockPayee');
  const mockAmount = document.getElementById('mockAmount');
  const mockAmountLock = document.getElementById('mockAmountLock');
  const mockMessage = document.getElementById('mockMessage');
  const mockMessageLock = document.getElementById('mockMessageLock');
  const mockGenIcon = document.getElementById('mockGenIcon');
  const mockGenTitle = document.getElementById('mockGenTitle');
  const mockGenSub = document.getElementById('mockGenSub');
  const mockGenBody = document.getElementById('mockGenBody');
  const mockGenBtn = document.getElementById('mockGenBtn');
  const mockGenBtnText = document.getElementById('mockGenBtnText');

  // Toast
  const toast = document.getElementById('toastNotification');
  const toastMsg = document.getElementById('toastMessage');

  // Category Tabs & Panels
  const categoryTabs = document.querySelectorAll('.category-tab');
  const categoryPanels = document.querySelectorAll('.category-panel');
  const swishFormatTabs = document.getElementById('swishFormatTabs');
  const formatTabBtns = document.querySelectorAll('.format-tab-btn');

  // Swish Form Elements
  const payeeInput = document.getElementById('payeeInput');
  const clearPayeeBtn = document.getElementById('clearPayeeBtn');
  const numberTypeBadge = document.getElementById('numberTypeBadge');
  const amountInput = document.getElementById('amountInput');
  const amountLockContainer = document.getElementById('amountLockContainer');
  const amountLockToggle = document.getElementById('amountLockToggle');
  const amountLockBadge = document.getElementById('amountLockBadge');
  const amountLockStatusText = document.getElementById('amountLockStatusText');
  const messageInput = document.getElementById('messageInput');
  const messageLockContainer = document.getElementById('messageLockContainer');
  const messageLockToggle = document.getElementById('messageLockToggle');
  const messageLockBadge = document.getElementById('messageLockBadge');
  const messageLockStatusText = document.getElementById('messageLockStatusText');
  const charCount = document.getElementById('charCount');
  const summaryModeTitle = document.getElementById('summaryModeTitle');
  const summaryModeDesc = document.getElementById('summaryModeDesc');
  const presetChips = document.querySelectorAll('.preset-chip:not(.url-preset)');
  const quickAmtBtns = document.querySelectorAll('.quick-amt-btn');

  // Wi-Fi Form Elements
  const wifiSsid = document.getElementById('wifiSsid');
  const wifiPassword = document.getElementById('wifiPassword');
  const wifiAuth = document.getElementById('wifiAuth');
  const wifiHidden = document.getElementById('wifiHidden');

  // URL Form Elements
  const customUrlInput = document.getElementById('customUrlInput');
  const urlPresets = document.querySelectorAll('.url-preset');

  // vCard Form Elements
  const vcFirstName = document.getElementById('vcFirstName');
  const vcLastName = document.getElementById('vcLastName');
  const vcPhone = document.getElementById('vcPhone');
  const vcEmail = document.getElementById('vcEmail');
  const vcCompany = document.getElementById('vcCompany');
  const vcTitle = document.getElementById('vcTitle');

  // Maps Form Elements
  const mapsAddress = document.getElementById('mapsAddress');

  // SMS Form Elements
  const smsPhone = document.getElementById('smsPhone');
  const smsBody = document.getElementById('smsBody');
  const smsBodyGroup = document.getElementById('smsBodyGroup');
  const actionSmsBtn = document.getElementById('actionSmsBtn');
  const actionCallBtn = document.getElementById('actionCallBtn');
  let currentSmsMode = 'sms'; // 'sms' or 'call'

  // 1. Initial Web NFC Capability Detection
  function checkNfcSupport() {
    const isSupported = 'NDEFReader' in window;
    if (isSupported) {
      nfcSupportBadge.className = 'badge badge-success';
      nfcSupportBadge.innerHTML = '<span class="status-dot"></span> Web NFC Redo';
      nfcStatusText.textContent = 'Web NFC stöds';
      nfcStatusText.className = 'nfc-compat-pill';
      webNfcAvailableArea.style.display = 'block';
      webNfcFallbackArea.style.display = 'none';
    } else {
      nfcSupportBadge.className = 'badge badge-info';
      nfcSupportBadge.innerHTML = '<span class="status-dot"></span> Manuell NFC / QR';
      nfcStatusText.textContent = 'Webbläsare saknar Web NFC';
      nfcStatusText.style.background = 'rgba(255, 255, 255, 0.08)';
      nfcStatusText.style.color = 'var(--text-muted)';
      webNfcAvailableArea.style.display = 'none';
      webNfcFallbackArea.style.display = 'block';
    }
  }

  // 2. Category Switcher
  function switchCategory(categoryKey) {
    activeCategory = categoryKey;
    categoryTabs.forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-category') === categoryKey);
    });

    categoryPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === `panel-${categoryKey}`);
    });

    // Show format tabs only for Swish
    swishFormatTabs.style.display = (categoryKey === 'swish') ? 'grid' : 'none';

    // Update mockup screen visibility
    if (categoryKey === 'swish') {
      mockupTypeBadge.textContent = 'Swish Vy';
      mockupScreenSwish.style.display = 'flex';
      mockupScreenGeneric.style.display = 'none';
    } else {
      mockupScreenSwish.style.display = 'none';
      mockupScreenGeneric.style.display = 'flex';
    }

    generateCurrent();
  }

  // 3. Central Dispatcher
  function generateCurrent() {
    switch (activeCategory) {
      case 'swish':
        generateSwish();
        break;
      case 'wifi':
        generateWifi();
        break;
      case 'url':
        generateUrl();
        break;
      case 'vcard':
        generateVCard();
        break;
      case 'maps':
        generateMaps();
        break;
      case 'sms':
        generateSms();
        break;
    }
  }

  // ==========================================
  // SWISH GENERATOR
  // ==========================================
  function sanitizePayee(raw) {
    if (!raw) return '';
    let cleaned = raw.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+46')) {
      cleaned = '0' + cleaned.substring(3);
    } else if (cleaned.startsWith('46') && cleaned.length >= 10 && cleaned[2] === '7') {
      cleaned = '0' + cleaned.substring(2);
    }
    return cleaned;
  }

  function formatPayeeDisplay(raw) {
    const cleaned = sanitizePayee(raw);
    if (!cleaned) return '';
    if ((cleaned.startsWith('123') || cleaned.startsWith('07')) && cleaned.length === 10) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
    }
    return cleaned;
  }

  function detectNumberType(cleaned) {
    if (!cleaned) {
      numberTypeBadge.textContent = 'Ange nummer';
      numberTypeBadge.style.color = 'var(--text-dim)';
      numberTypeBadge.style.background = 'rgba(255, 255, 255, 0.05)';
      return;
    }
    if (cleaned.startsWith('123')) {
      numberTypeBadge.textContent = 'Företag / Förening (123)';
      numberTypeBadge.style.color = '#38bdf8';
      numberTypeBadge.style.background = 'rgba(56, 189, 248, 0.15)';
    } else if (cleaned.startsWith('07')) {
      numberTypeBadge.textContent = 'Privatperson (07X)';
      numberTypeBadge.style.color = '#34d399';
      numberTypeBadge.style.background = 'rgba(52, 211, 153, 0.15)';
    } else {
      numberTypeBadge.textContent = 'Telefonnummer';
      numberTypeBadge.style.color = '#f59e0b';
      numberTypeBadge.style.background = 'rgba(245, 158, 11, 0.15)';
    }
  }

  function generateSwish() {
    const rawPayee = payeeInput.value.trim();
    const cleanPayee = sanitizePayee(rawPayee);
    const amountVal = parseFloat(amountInput.value);
    const hasAmount = !isNaN(amountVal) && amountVal > 0;
    const isAmountLocked = amountLockToggle.checked;

    const messageVal = messageInput.value.trim();
    const hasMessage = messageVal.length > 0;
    const isMessageLocked = messageLockToggle.checked;

    // Show/hide lock toggles
    amountLockContainer.style.display = hasAmount ? 'flex' : 'none';
    messageLockContainer.style.display = hasMessage ? 'flex' : 'none';

    // Update lock badges & classes
    if (isAmountLocked) {
      amountLockBadge.textContent = 'Låst';
      amountLockBadge.className = 'lock-status-badge';
      amountLockStatusText.textContent = 'Belopp är låst';
      amountLockContainer.classList.add('active');
    } else {
      amountLockBadge.textContent = 'Redigerbart (&edit=amt)';
      amountLockBadge.className = 'lock-status-badge unlocked';
      amountLockStatusText.textContent = 'Kunden kan ändra belopp';
      amountLockContainer.classList.remove('active');
    }

    if (isMessageLocked) {
      messageLockBadge.textContent = 'Låst';
      messageLockBadge.className = 'lock-status-badge';
      messageLockStatusText.textContent = 'Meddelande är låst';
      messageLockContainer.classList.add('active');
    } else {
      messageLockBadge.textContent = 'Redigerbart (&edit=msg)';
      messageLockBadge.className = 'lock-status-badge unlocked';
      messageLockStatusText.textContent = 'Kunden kan ändra meddelande';
      messageLockContainer.classList.remove('active');
    }

    // Char count update
    charCount.textContent = `${messageVal.length} / 50`;
    charCount.style.color = messageVal.length >= 45 ? '#f43f5e' : 'var(--text-dim)';

    // Update Number type badge
    detectNumberType(cleanPayee);

    // Build Payload for Scheme
    const payload = {
      version: 1,
      payee: { value: cleanPayee || '0701234567' }
    };

    if (hasAmount) {
      payload.amount = {
        value: amountVal,
        editable: !isAmountLocked
      };
    }

    if (hasMessage) {
      payload.message = {
        value: messageVal,
        editable: !isMessageLocked
      };
    }

    // Build URL
    let fullSwishUrl = '';
    const activePayee = cleanPayee || '0701234567';

    if (currentSwishFormat === 'universal') {
      // Swish Web Universal URL
      let url = `https://app.swish.nu/1/p/sw/?sw=${encodeURIComponent(activePayee)}`;
      if (hasAmount) {
        url += `&amt=${amountVal}&cur=SEK`;
      }
      if (hasMessage) {
        url += `&msg=${encodeURIComponent(messageVal)}`;
      }

      // Add edit parameter for unlocked fields
      const editableFields = [];
      if (hasAmount && !isAmountLocked) {
        editableFields.push('amt');
      }
      if (hasMessage && !isMessageLocked) {
        editableFields.push('msg');
      }
      if (editableFields.length > 0) {
        url += `&edit=${editableFields.join(',')}`;
      }

      fullSwishUrl = url;
    } else {
      // Swish URI Scheme
      const jsonStr = JSON.stringify(payload);
      fullSwishUrl = `swish://payment?data=${encodeURIComponent(jsonStr)}`;
    }

    // Output
    setResultOutput(fullSwishUrl, fullSwishUrl, 'Öppna i Swish');

    // Summary Card
    updateSwishSummary(hasAmount, amountVal, isAmountLocked, hasMessage, messageVal, isMessageLocked);

    // Mockup
    mockPayee.textContent = formatPayeeDisplay(cleanPayee) || '070 123 45 67';
    mockAmount.textContent = hasAmount ? `${amountVal} kr` : 'Valfritt belopp';
    mockAmountLock.style.display = isAmountLocked ? 'inline' : 'none';
    mockMessage.textContent = hasMessage ? messageVal : 'Inget meddelande';
    mockMessageLock.style.display = isMessageLocked ? 'inline' : 'none';

    // QR Meta
    qrInfoDesc.textContent = 'Scanna med Swish eller mobilkamera för att förhandsgranska betalningen.';
    qrMetaChips.innerHTML = `
      <span class="meta-chip">${hasAmount ? `${amountVal} kr (${isAmountLocked ? 'Låst' : 'Redigerbart'})` : 'Valfritt belopp'}</span>
      <span class="meta-chip">${hasMessage ? `"${messageVal}"` : 'Inget meddelande'}</span>
    `;

    renderQr(fullSwishUrl);
  }

  function updateSwishSummary(hasAmount, amount, amountLocked, hasMsg, msg, msgLocked) {
    if (!hasAmount && !hasMsg) {
      summaryModeTitle.textContent = 'Läge: Endast mottagarnummer';
      summaryModeDesc.textContent = 'Kunden blippar NFC-taggen och Swish öppnas med mottagaren vald. Kunden fyller i valfritt belopp och eventuellt eget meddelande.';
    } else if (hasAmount && !hasMsg) {
      summaryModeTitle.textContent = `Läge: Nummer + ${amountLocked ? 'Låst' : 'Redigerbart'} belopp (${amount} kr)`;
      summaryModeDesc.textContent = amountLocked 
        ? `Swish öppnas med exakt ${amount} kr förifyllt. Kunden kan inte ändra beloppet.` 
        : `Swish öppnas med ${amount} kr förifyllt (&edit=amt), men kunden kan justera summan.`;
    } else if (!hasAmount && hasMsg) {
      summaryModeTitle.textContent = `Läge: Nummer + ${msgLocked ? 'Låst' : 'Redigerbart'} meddelande ("${msg}")`;
      summaryModeDesc.textContent = msgLocked 
        ? `Swish öppnas med meddelandet låst. Kunden väljer själv belopp.` 
        : `Swish öppnas med förslaget meddelande (&edit=msg). Kunden kan ändra det.`;
    } else {
      summaryModeTitle.textContent = `Läge: Komplett (${amount} kr & "${msg}")`;
      summaryModeDesc.textContent = `Både belopp och meddelande är förkonfigurerade. ${amountLocked ? 'Beloppet är låst. ' : 'Beloppet är redigerbart (&edit=amt). '}${msgLocked ? 'Meddelandet är låst.' : 'Meddelandet är redigerbart.'}`;
    }
  }

  // ==========================================
  // WI-FI GENERATOR
  // ==========================================
  function generateWifi() {
    const ssid = wifiSsid.value.trim() || 'Mitt-WiFi';
    const pass = wifiPassword.value;
    const auth = wifiAuth.value;
    const hidden = wifiHidden.checked;

    // Standard Wi-Fi string format: WIFI:S:<SSID>;T:<WPA|WEP|nopass>;P:<password>;H:<true|false>;;
    const wifiData = `WIFI:S:${ssid};T:${auth};P:${pass};H:${hidden ? 'true' : 'false'};;`;

    setResultOutput(wifiData, '#', 'Koppla upp (Blippa tagg)');
    testSwishBtn.style.pointerEvents = 'none';
    testSwishBtn.style.opacity = '0.6';

    mockupTypeBadge.textContent = 'Wi-Fi Anslutning';
    mockGenIcon.textContent = '📶';
    mockGenTitle.textContent = `Anslut till "${ssid}"`;
    mockGenSub.textContent = auth === 'nopass' ? 'Öppet nätverk' : 'Skyddat nätverk';
    mockGenBody.innerHTML = `
      <div class="mock-field">
        <span class="mock-field-label">Nätverk (SSID)</span>
        <span class="mock-field-value">${ssid}</span>
      </div>
      <div class="mock-field">
        <span class="mock-field-label">Säkerhet</span>
        <span class="mock-field-value">${auth.toUpperCase()}</span>
      </div>
      <div class="mock-field">
        <span class="mock-field-label">Lösenord</span>
        <span class="mock-field-value">${auth === 'nopass' ? 'Inget lösenord' : (pass ? '••••••••' : 'Inget')}</span>
      </div>
    `;
    mockGenBtnText.textContent = 'Anslut automatiskt';

    qrInfoDesc.textContent = 'Scanna QR-koden med mobilens kamera för att ansluta direkt till Wi-Fi nätverket!';
    qrMetaChips.innerHTML = `
      <span class="meta-chip">Nätverk: ${ssid}</span>
      <span class="meta-chip">Kryptering: ${auth}</span>
    `;

    renderQr(wifiData);
  }

  // ==========================================
  // URL / WEBBADRESS GENERATOR
  // ==========================================
  function generateUrl() {
    let url = customUrlInput.value.trim();
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    const finalUrl = url || 'https://google.com';

    setResultOutput(finalUrl, finalUrl, 'Öppna länk');
    testSwishBtn.style.pointerEvents = 'auto';
    testSwishBtn.style.opacity = '1';

    mockupTypeBadge.textContent = 'Webbadress';
    mockGenIcon.textContent = '🌐';
    mockGenTitle.textContent = 'Öppna Webbsida';
    mockGenSub.textContent = finalUrl;
    mockGenBody.innerHTML = `
      <div class="mock-field">
        <span class="mock-field-label">Länk (URL)</span>
        <span class="mock-field-value" style="word-break: break-all; color: #0284c7;">${finalUrl}</span>
      </div>
    `;
    mockGenBtnText.textContent = 'Besök webbplats';

    qrInfoDesc.textContent = 'Scanna med kameran för att öppna länken i webbläsaren.';
    qrMetaChips.innerHTML = `<span class="meta-chip">${finalUrl}</span>`;

    renderQr(finalUrl);
  }

  // ==========================================
  // vCARD / KONTAKTKORT GENERATOR
  // ==========================================
  function generateVCard() {
    const fn = vcFirstName.value.trim() || 'Anders';
    const ln = vcLastName.value.trim() || 'Svensson';
    const phone = vcPhone.value.trim() || '0701234567';
    const email = vcEmail.value.trim();
    const org = vcCompany.value.trim();
    const title = vcTitle.value.trim();

    // Compact vCard 3.0 standard
    let vcard = `BEGIN:VCARD\nVERSION:3.0\nN:${ln};${fn};;;\nFN:${fn} ${ln}\nTEL;TYPE=CELL:${phone}`;
    if (email) vcard += `\nEMAIL:${email}`;
    if (org) vcard += `\nORG:${org}`;
    if (title) vcard += `\nTITLE:${title}`;
    vcard += `\nEND:VCARD`;

    setResultOutput(vcard, '#', 'Spara kontakt (Blippa tagg)');
    testSwishBtn.style.pointerEvents = 'none';
    testSwishBtn.style.opacity = '0.6';

    mockupTypeBadge.textContent = 'Digitalt Visitkort';
    mockGenIcon.textContent = '👤';
    mockGenTitle.textContent = `${fn} ${ln}`;
    mockGenSub.textContent = title ? `${title} &bull; ${org}` : (org || 'Kontaktkort');
    mockGenBody.innerHTML = `
      <div class="mock-field">
        <span class="mock-field-label">Mobil</span>
        <span class="mock-field-value">${phone}</span>
      </div>
      ${email ? `
      <div class="mock-field">
        <span class="mock-field-label">E-post</span>
        <span class="mock-field-value">${email}</span>
      </div>` : ''}
    `;
    mockGenBtnText.textContent = 'Spara i kontakter';

    qrInfoDesc.textContent = 'Scanna QR-koden med mobilen för att lägga till kontakten direkt i kontaktboken!';
    qrMetaChips.innerHTML = `
      <span class="meta-chip">${fn} ${ln}</span>
      <span class="meta-chip">${phone}</span>
    `;

    renderQr(vcard);
  }

  // ==========================================
  // GOOGLE MAPS GENERATOR
  // ==========================================
  function generateMaps() {
    const address = mapsAddress.value.trim() || 'Stockholm';
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

    setResultOutput(mapsUrl, mapsUrl, 'Öppna i Maps');
    testSwishBtn.style.pointerEvents = 'auto';
    testSwishBtn.style.opacity = '1';

    mockupTypeBadge.textContent = 'Google Maps';
    mockGenIcon.textContent = '📍';
    mockGenTitle.textContent = 'Visa Plats';
    mockGenSub.textContent = address;
    mockGenBody.innerHTML = `
      <div class="mock-field">
        <span class="mock-field-label">Destination</span>
        <span class="mock-field-value">${address}</span>
      </div>
    `;
    mockGenBtnText.textContent = 'Starta vägbeskrivning';

    qrInfoDesc.textContent = 'Scanna för att öppna kartan och starta navigation.';
    qrMetaChips.innerHTML = `<span class="meta-chip">${address}</span>`;

    renderQr(mapsUrl);
  }

  // ==========================================
  // SMS / RING GENERATOR
  // ==========================================
  function generateSms() {
    const phone = smsPhone.value.trim() || '0701234567';
    const body = smsBody.value.trim();

    let uri = '';
    if (currentSmsMode === 'sms') {
      uri = body ? `sms:${phone}?body=${encodeURIComponent(body)}` : `sms:${phone}`;
      testBtnText.textContent = 'Skicka SMS';
      mockGenTitle.textContent = 'Skicka SMS';
      mockGenSub.textContent = `Till ${phone}`;
      mockGenBody.innerHTML = `
        <div class="mock-field">
          <span class="mock-field-label">Till</span>
          <span class="mock-field-value">${phone}</span>
        </div>
        <div class="mock-field">
          <span class="mock-field-label">Meddelande</span>
          <span class="mock-field-value">${body || 'Inget förifyllt'}</span>
        </div>
      `;
      mockGenBtnText.textContent = 'Öppna Meddelanden';
    } else {
      uri = `tel:${phone}`;
      testBtnText.textContent = 'Ring samtal';
      mockGenTitle.textContent = 'Ringa samtal';
      mockGenSub.textContent = phone;
      mockGenBody.innerHTML = `
        <div class="mock-field">
          <span class="mock-field-label">Telefonnummer</span>
          <span class="mock-field-value">${phone}</span>
        </div>
      `;
      mockGenBtnText.textContent = 'Ring upp';
    }

    setResultOutput(uri, uri, testBtnText.textContent);
    testSwishBtn.style.pointerEvents = 'auto';
    testSwishBtn.style.opacity = '1';

    mockupTypeBadge.textContent = currentSmsMode === 'sms' ? 'SMS' : 'Samtal';
    mockGenIcon.textContent = currentSmsMode === 'sms' ? '💬' : '📞';

    qrInfoDesc.textContent = 'Scanna för att ringa eller skicka SMS.';
    qrMetaChips.innerHTML = `<span class="meta-chip">${phone}</span>`;

    renderQr(uri);
  }

  // ==========================================
  // OUTPUT & NFC MEMORY CALCULATOR
  // ==========================================
  function setResultOutput(text, testHref, btnLabel) {
    generatedUrlTextarea.value = text;
    testSwishBtn.href = testHref;
    testBtnText.textContent = btnLabel;

    // Memory Calculation
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text).length;
    // NDEF record overhead (~4 bytes)
    const ndefBytes = bytes + 4;

    byteCounter.textContent = `${ndefBytes} bytes NDEF`;

    // NTAG213: 144 B
    const pct213 = Math.min(100, Math.round((ndefBytes / 144) * 100));
    meterFill213.style.width = `${pct213}%`;
    if (ndefBytes <= 144) {
      meterFill213.style.background = 'linear-gradient(90deg, #38bdf8, #10b981)';
      verdict213.innerHTML = `✅ Får plats i NTAG213 (${144 - ndefBytes} B över)`;
      verdict213.style.color = '#34d399';
    } else {
      meterFill213.style.background = '#f43f5e';
      verdict213.innerHTML = `⚠️ Kräver NTAG215 (${ndefBytes - 144} B för mycket för NTAG213)`;
      verdict213.style.color = '#fb7185';
    }

    // NTAG215: 504 B
    const pct215 = Math.min(100, Math.round((ndefBytes / 504) * 100));
    meterFill215.style.width = `${pct215}%`;
  }

  function renderQr(text) {
    if (window.QRCode) {
      qrcodeCanvas.innerHTML = '';
      qrInstance = new window.QRCode(qrcodeCanvas, {
        text: text,
        width: 140,
        height: 140,
        colorDark: '#0f172a',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.M
      });
    }
  }

  // ==========================================
  // ACTIONS: COPY, DOWNLOAD, NFC WRITE
  // ==========================================
  async function copyOutput() {
    const text = generatedUrlTextarea.value;
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        generatedUrlTextarea.select();
        document.execCommand('copy');
      }
      showToast('Kopierad till urklipp!');
    } catch (err) {
      generatedUrlTextarea.select();
      showToast('Markera texten och tryck Ctrl+C');
    }
  }

  function downloadQrCode() {
    const canvas = qrcodeCanvas.querySelector('canvas');
    if (!canvas) {
      showToast('Ingen QR-kod tillgänglig');
      return;
    }
    const link = document.createElement('a');
    link.download = `nfc-${activeCategory}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('QR-koden har laddats ner som PNG!');
  }

  async function startNfcWrite() {
    if (!('NDEFReader' in window)) {
      showToast('Web NFC stöds tyvärr inte i denna webbläsare');
      return;
    }

    const data = generatedUrlTextarea.value;
    if (!data) {
      showToast('Ingen data att skriva');
      return;
    }

    nfcModal.style.display = 'flex';
    nfcModalTitle.textContent = 'Håll NFC-taggen mot telefonen';
    nfcModalDesc.textContent = 'Placera din NTAG213 eller NTAG215 tagg mot baksidan av mobilen...';

    nfcAbortController = new AbortController();

    try {
      const ndef = new window.NDEFReader();
      
      // Determine record type: url or text/mime
      let record;
      if (data.startsWith('http://') || data.startsWith('https://') || data.startsWith('swish://') || data.startsWith('sms:') || data.startsWith('tel:')) {
        record = { recordType: 'url', data: data };
      } else {
        record = { recordType: 'text', data: data };
      }

      await ndef.write({
        records: [record]
      }, { signal: nfcAbortController.signal });

      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      nfcModalTitle.textContent = '🎉 Lyckades!';
      nfcModalDesc.textContent = 'Datan har skrivits till NFC-taggen!';

      setTimeout(() => {
        closeNfcModal();
        showToast('NFC-taggen är nu programmerad och redo att blippas!');
      }, 1500);

    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('NFC Write Error:', error);
      nfcModalTitle.textContent = 'Kunde inte skriva';
      nfcModalDesc.textContent = `Ett fel uppstod: ${error.message || 'Kontrollera att NFC är påslaget och att taggen inte är skrivskyddad.'}`;
    }
  }

  function closeNfcModal() {
    if (nfcAbortController) {
      nfcAbortController.abort();
      nfcAbortController = null;
    }
    nfcModal.style.display = 'none';
  }

  let toastTimer = null;
  function showToast(message) {
    toastMsg.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // ==========================================
  // PRESETS
  // ==========================================
  function applySwishPreset(presetKey) {
    presetChips.forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-preset') === presetKey);
    });

    switch (presetKey) {
      case 'number-only':
        amountInput.value = '';
        messageInput.value = '';
        amountLockToggle.checked = false;
        messageLockToggle.checked = false;
        break;
      case 'coffee':
        amountInput.value = '35';
        messageInput.value = 'Kaffe & Bulle';
        amountLockToggle.checked = true;
        messageLockToggle.checked = true;
        break;
      case 'lunch':
        amountInput.value = '125';
        messageInput.value = 'Dagens lunch';
        amountLockToggle.checked = true;
        messageLockToggle.checked = true;
        break;
      case 'flea-market':
        amountInput.value = '';
        messageInput.value = 'Loppis bord 12';
        amountLockToggle.checked = false;
        messageLockToggle.checked = true;
        break;
      case 'parking':
        amountInput.value = '50';
        messageInput.value = 'Parkering 24h';
        amountLockToggle.checked = true;
        messageLockToggle.checked = true;
        break;
    }
    generateSwish();
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================
  // Category tabs
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchCategory(tab.getAttribute('data-category'));
    });
  });

  // Swish URL format tabs
  formatTabBtns.forEach(tab => {
    tab.addEventListener('click', () => {
      formatTabBtns.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentSwishFormat = tab.getAttribute('data-format') || 'universal';
      generateSwish();
    });
  });

  // Swish inputs
  payeeInput.addEventListener('input', generateSwish);
  clearPayeeBtn.addEventListener('click', () => {
    payeeInput.value = '';
    payeeInput.focus();
    generateSwish();
  });

  amountInput.addEventListener('input', () => {
    quickAmtBtns.forEach(b => b.classList.remove('active'));
    generateSwish();
  });

  // Amount lock toggle: listen to both change, input, and click on label
  amountLockToggle.addEventListener('change', generateSwish);
  amountLockToggle.addEventListener('input', generateSwish);
  amountLockContainer.addEventListener('click', () => {
    setTimeout(generateSwish, 0);
  });

  messageInput.addEventListener('input', generateSwish);
  messageLockToggle.addEventListener('change', generateSwish);
  messageLockToggle.addEventListener('input', generateSwish);
  messageLockContainer.addEventListener('click', () => {
    setTimeout(generateSwish, 0);
  });

  // Quick Amount Buttons
  quickAmtBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      quickAmtBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      amountInput.value = btn.getAttribute('data-amt');
      generateSwish();
    });
  });

  // Preset Buttons
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      applySwishPreset(chip.getAttribute('data-preset'));
    });
  });

  // Wi-Fi inputs
  wifiSsid.addEventListener('input', generateWifi);
  wifiPassword.addEventListener('input', generateWifi);
  wifiAuth.addEventListener('change', generateWifi);
  wifiHidden.addEventListener('change', generateWifi);

  // URL inputs & presets
  customUrlInput.addEventListener('input', generateUrl);
  urlPresets.forEach(btn => {
    btn.addEventListener('click', () => {
      customUrlInput.value = btn.getAttribute('data-url');
      generateUrl();
    });
  });

  // vCard inputs
  [vcFirstName, vcLastName, vcPhone, vcEmail, vcCompany, vcTitle].forEach(el => {
    el.addEventListener('input', generateVCard);
  });

  // Maps inputs
  mapsAddress.addEventListener('input', generateMaps);

  // SMS inputs & mode
  smsPhone.addEventListener('input', generateSms);
  smsBody.addEventListener('input', generateSms);
  actionSmsBtn.addEventListener('click', () => {
    actionSmsBtn.classList.add('active');
    actionCallBtn.classList.remove('active');
    smsBodyGroup.style.display = 'block';
    currentSmsMode = 'sms';
    generateSms();
  });
  actionCallBtn.addEventListener('click', () => {
    actionCallBtn.classList.add('active');
    actionSmsBtn.classList.remove('active');
    smsBodyGroup.style.display = 'none';
    currentSmsMode = 'call';
    generateSms();
  });

  // Global Actions
  copyUrlBtn.addEventListener('click', copyOutput);
  downloadQrBtn.addEventListener('click', downloadQrCode);
  startNfcWriteBtn.addEventListener('click', startNfcWrite);
  cancelNfcModalBtn.addEventListener('click', closeNfcModal);

  // Initial Boot
  checkNfcSupport();
  generateSwish();

})();
