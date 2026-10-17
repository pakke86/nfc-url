/**
 * Swish NFC URL Generator - Main Application Logic
 * Supports: Only Number, Number + Amount, Number + Message, Number + Amount + Message
 * Includes: Web NFC Writing (NDEFReader), QR Code rendering, Byte Tracker & Swish Mockup
 */

(function () {
  'use strict';

  // DOM Elements
  const payeeInput = document.getElementById('payeeInput');
  const clearPayeeBtn = document.getElementById('clearPayeeBtn');
  const numberTypeBadge = document.getElementById('numberTypeBadge');
  const amountInput = document.getElementById('amountInput');
  const amountLockContainer = document.getElementById('amountLockContainer');
  const amountLockToggle = document.getElementById('amountLockToggle');
  const messageInput = document.getElementById('messageInput');
  const messageLockContainer = document.getElementById('messageLockContainer');
  const messageLockToggle = document.getElementById('messageLockToggle');
  const charCount = document.getElementById('charCount');

  // Summary Elements
  const summaryModeTitle = document.getElementById('summaryModeTitle');
  const summaryModeDesc = document.getElementById('summaryModeDesc');

  // NFC Meter Elements
  const byteCounter = document.getElementById('byteCounter');
  const meterFill213 = document.getElementById('meterFill213');
  const verdict213 = document.getElementById('verdict213');
  const meterFill215 = document.getElementById('meterFill215');

  // Result Elements
  const generatedUrlTextarea = document.getElementById('generatedUrl');
  const copyUrlBtn = document.getElementById('copyUrlBtn');
  const testSwishBtn = document.getElementById('testSwishBtn');

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

  // QR Code Elements
  const qrcodeCanvas = document.getElementById('qrcodeCanvas');
  const downloadQrBtn = document.getElementById('downloadQrBtn');
  const qrMetaAmount = document.getElementById('qrMetaAmount');
  const qrMetaMsg = document.getElementById('qrMetaMsg');

  // Mockup Elements
  const mockPayee = document.getElementById('mockPayee');
  const mockAmount = document.getElementById('mockAmount');
  const mockAmountLock = document.getElementById('mockAmountLock');
  const mockMessage = document.getElementById('mockMessage');
  const mockMessageLock = document.getElementById('mockMessageLock');

  // Toast
  const toast = document.getElementById('toastNotification');
  const toastMsg = document.getElementById('toastMessage');

  // Presets & Quick Buttons
  const presetChips = document.querySelectorAll('.preset-chip');
  const quickAmtBtns = document.querySelectorAll('.quick-amt-btn');
  const formatTabBtns = document.querySelectorAll('.format-tab-btn');

  let currentFormat = 'universal'; // 'universal' (https://app.swish.nu) or 'scheme' (swish://payment)
  let qrInstance = null;
  let nfcAbortController = null;

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

  // 2. Normalize and Format Swedish Phone / Merchant Numbers
  function sanitizePayee(raw) {
    if (!raw) return '';
    // Strip everything except digits and plus sign
    let cleaned = raw.replace(/[^\d+]/g, '');
    // If starts with +46, convert to Swedish 07x or keep for normalization
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
    // Company 123 xxx xx xx
    if (cleaned.startsWith('123') && cleaned.length === 10) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
    }
    // Mobile 07x xxx xx xx
    if (cleaned.startsWith('07') && cleaned.length === 10) {
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

  // 3. Main Generator Logic
  function generateSwishPayload() {
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

    // Char count update
    charCount.textContent = `${messageVal.length} / 50`;
    charCount.style.color = messageVal.length >= 45 ? '#f43f5e' : 'var(--text-dim)';

    // Update Number type badge
    detectNumberType(cleanPayee);

    // Build Swish JSON structure
    const payload = {
      version: 1,
      payee: {
        value: cleanPayee || '0701234567'
      }
    };

    if (hasAmount) {
      payload.amount = {
        value: amountVal
      };
      if (isAmountLocked) {
        payload.amount.editable = false;
      }
    }

    if (hasMessage) {
      payload.message = {
        value: messageVal
      };
      if (isMessageLocked) {
        payload.message.editable = false;
      }
    }

    // Current format: 'universal' (https://app.swish.nu) or 'scheme' (swish://payment)
    let fullSwishUrl = '';
    const activePayee = cleanPayee || '0701234567';

    if (currentFormat === 'universal') {
      // Official Swish Web / Universal URL (Optimal for NFC & iOS/Android background read)
      // e.g., https://app.swish.nu/1/p/sw/?sw=0701234567&amt=50&cur=SEK&msg=Kaffe
      let url = `https://app.swish.nu/1/p/sw/?sw=${encodeURIComponent(activePayee)}`;
      if (hasAmount) {
        url += `&amt=${amountVal}&cur=SEK`;
      }
      if (hasMessage) {
        url += `&msg=${encodeURIComponent(messageVal)}`;
      }
      fullSwishUrl = url;
    } else {
      // Swish URI Scheme (App Deep Link)
      const jsonStr = JSON.stringify(payload);
      const encodedData = encodeURIComponent(jsonStr);
      fullSwishUrl = `swish://payment?data=${encodedData}`;
    }

    // Update Output & Test Button
    generatedUrlTextarea.value = fullSwishUrl;
    testSwishBtn.href = fullSwishUrl;

    // Update Mode Summary Card
    updateSummaryCard(hasAmount, amountVal, isAmountLocked, hasMessage, messageVal, isMessageLocked);

    // Update Mockup
    updateMockup(cleanPayee || '070 123 45 67', hasAmount, amountVal, isAmountLocked, hasMessage, messageVal, isMessageLocked);

    // Update NFC Byte Meters
    updateNfcMeter(fullSwishUrl);

    // Update QR Code
    updateQrCode(fullSwishUrl, hasAmount, amountVal, hasMessage, messageVal);
  }

  // 4. Update Summary Card
  function updateSummaryCard(hasAmount, amount, amountLocked, hasMsg, msg, msgLocked) {
    if (!hasAmount && !hasMsg) {
      summaryModeTitle.textContent = 'Läge: Endast mottagarnummer';
      summaryModeDesc.textContent = 'Kunden blippar NFC-taggen och Swish öppnas med mottagaren vald. Kunden fyller i valfritt belopp och eventuellt eget meddelande.';
    } else if (hasAmount && !hasMsg) {
      summaryModeTitle.textContent = `Läge: Nummer + ${amountLocked ? 'Låst' : 'Redigerbart'} belopp (${amount} kr)`;
      summaryModeDesc.textContent = amountLocked 
        ? `Swish öppnas med exakt ${amount} kr förifyllt. Kunden kan inte ändra beloppet.` 
        : `Swish öppnas med ${amount} kr förifyllt, men kunden kan justera beloppet vid behov.`;
    } else if (!hasAmount && hasMsg) {
      summaryModeTitle.textContent = `Läge: Nummer + ${msgLocked ? 'Låst' : 'Redigerbart'} meddelande ("${msg}")`;
      summaryModeDesc.textContent = msgLocked 
        ? `Swish öppnas med meddelandet låst. Kunden väljer själv belopp.` 
        : `Swish öppnas med förslaget meddelande. Kunden väljer själv belopp.`;
    } else {
      summaryModeTitle.textContent = `Läge: Komplett (${amount} kr & "${msg}")`;
      summaryModeDesc.textContent = `Både belopp och meddelande är förkonfigurerade. ${amountLocked ? 'Beloppet är låst. ' : ''}${msgLocked ? 'Meddelandet är låst.' : ''}`;
    }
  }

  // 5. Update Swish Live Mockup
  function updateMockup(payee, hasAmount, amount, amountLocked, hasMsg, msg, msgLocked) {
    mockPayee.textContent = formatPayeeDisplay(payee) || payee;
    
    if (hasAmount) {
      mockAmount.textContent = `${amount} kr`;
      mockAmountLock.style.display = amountLocked ? 'inline' : 'none';
    } else {
      mockAmount.textContent = 'Valfritt belopp';
      mockAmountLock.style.display = 'none';
    }

    if (hasMsg) {
      mockMessage.textContent = msg;
      mockMessageLock.style.display = msgLocked ? 'inline' : 'none';
    } else {
      mockMessage.textContent = 'Inget meddelande';
      mockMessageLock.style.display = 'none';
    }
  }

  // 6. NFC Tag Memory Calculator
  function updateNfcMeter(url) {
    // UTF-8 byte length of URL + NDEF URI Record overhead (~5 bytes header + protocol code)
    const encoder = new TextEncoder();
    const urlBytes = encoder.encode(url).length;
    // Standard NDEF URI record prefix takes ~4 bytes overhead
    const ndefTotalBytes = urlBytes + 4;

    byteCounter.textContent = `${ndefTotalBytes} bytes NDEF`;

    // NTAG213 capacity: 144 bytes
    const pct213 = Math.min(100, Math.round((ndefTotalBytes / 144) * 100));
    meterFill213.style.width = `${pct213}%`;
    
    if (ndefTotalBytes <= 144) {
      meterFill213.style.background = 'linear-gradient(90deg, #38bdf8, #10b981)';
      verdict213.innerHTML = `✅ Får plats i NTAG213 (${144 - ndefTotalBytes} bytes över)`;
      verdict213.style.color = '#34d399';
    } else {
      meterFill213.style.background = '#f43f5e';
      verdict213.innerHTML = `⚠️ För stor för NTAG213! Kräver NTAG215 eller kortare meddelande (${ndefTotalBytes - 144} bytes för mycket)`;
      verdict213.style.color = '#fb7185';
    }

    // NTAG215 capacity: 504 bytes
    const pct215 = Math.min(100, Math.round((ndefTotalBytes / 504) * 100));
    meterFill215.style.width = `${pct215}%`;
  }

  // 7. QR Code Rendering
  function updateQrCode(url, hasAmount, amount, hasMsg, msg) {
    qrMetaAmount.textContent = hasAmount ? `${amount} kr` : 'Valfritt belopp';
    qrMetaMsg.textContent = hasMsg ? `"${msg}"` : 'Inget meddelande';

    if (window.QRCode) {
      qrcodeCanvas.innerHTML = '';
      qrInstance = new window.QRCode(qrcodeCanvas, {
        text: url,
        width: 140,
        height: 140,
        colorDark: '#0f172a',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.M
      });
    }
  }

  // 8. Download QR Code PNG
  function downloadQrCode() {
    const canvas = qrcodeCanvas.querySelector('canvas');
    if (!canvas) {
      showToast('Ingen QR-kod tillgänglig ännu');
      return;
    }
    const link = document.createElement('a');
    link.download = `swish-qr-${sanitizePayee(payeeInput.value) || 'betalning'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('QR-koden har laddats ner som PNG!');
  }

  // 9. Copy to Clipboard
  async function copyUrl() {
    const url = generatedUrlTextarea.value;
    if (!url) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        generatedUrlTextarea.select();
        document.execCommand('copy');
      }
      showToast('Swish-URL kopierad till urklipp!');
    } catch (err) {
      generatedUrlTextarea.select();
      showToast('Markera texten och tryck Ctrl+C / Cmd+C');
    }
  }

  // 10. Web NFC Write Process
  async function startNfcWrite() {
    if (!('NDEFReader' in window)) {
      showToast('Web NFC stöds tyvärr inte i denna webbläsare');
      return;
    }

    const swishUrl = generatedUrlTextarea.value;
    if (!swishUrl) {
      showToast('Vänligen ange ett giltigt mottagarnummer först');
      return;
    }

    // Show Scanning Modal
    nfcModal.style.display = 'flex';
    nfcModalTitle.textContent = 'Håll NFC-taggen mot telefonen';
    nfcModalDesc.textContent = 'Placera din NTAG213 eller NTAG215 tagg mot baksidan av mobilen...';

    nfcAbortController = new AbortController();

    try {
      const ndef = new window.NDEFReader();
      
      // Write NDEF URL record
      await ndef.write({
        records: [
          { recordType: 'url', data: swishUrl }
        ]
      }, { signal: nfcAbortController.signal });

      // Success!
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      nfcModalTitle.textContent = '🎉 Lyckades!';
      nfcModalDesc.textContent = 'Swish-länken har skrivits till NFC-taggen!';

      setTimeout(() => {
        closeNfcModal();
        showToast('NFC-taggen är nu programmerad och redo att blippas!');
      }, 1500);

    } catch (error) {
      if (error.name === 'AbortError') {
        // User cancelled
        return;
      }
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

  // 11. Toast Notification Helper
  let toastTimer = null;
  function showToast(message) {
    toastMsg.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // 12. Presets Handler
  function applyPreset(presetKey) {
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
    generateSwishPayload();
  }

  // Event Listeners
  payeeInput.addEventListener('input', generateSwishPayload);
  clearPayeeBtn.addEventListener('click', () => {
    payeeInput.value = '';
    payeeInput.focus();
    generateSwishPayload();
  });

  amountInput.addEventListener('input', () => {
    // Reset quick amount highlight if custom
    quickAmtBtns.forEach(b => b.classList.remove('active'));
    generateSwishPayload();
  });

  amountLockToggle.addEventListener('change', generateSwishPayload);
  messageInput.addEventListener('input', generateSwishPayload);
  messageLockToggle.addEventListener('change', generateSwishPayload);

  // Quick Amount Buttons
  quickAmtBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      quickAmtBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const amt = btn.getAttribute('data-amt');
      amountInput.value = amt;
      generateSwishPayload();
    });
  });

  // Preset Buttons
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      applyPreset(chip.getAttribute('data-preset'));
    });
  });

  // URL Format Tabs
  formatTabBtns.forEach(tab => {
    tab.addEventListener('click', () => {
      formatTabBtns.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFormat = tab.getAttribute('data-format') || 'universal';
      generateSwishPayload();
    });
  });

  // Buttons
  copyUrlBtn.addEventListener('click', copyUrl);
  downloadQrBtn.addEventListener('click', downloadQrCode);
  startNfcWriteBtn.addEventListener('click', startNfcWrite);
  cancelNfcModalBtn.addEventListener('click', closeNfcModal);

  // Initialize
  checkNfcSupport();
  generateSwishPayload();

})();
