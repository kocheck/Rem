/**
 * UI logic for Rem plugin
 */

// State
let currentConfig: any = null;
let customPresets: any[] = [];
let builtInPresets: any[] = [];
let history: any[] = [];

/**
 * Initialize UI event listeners
 */
function initializeEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      switchTab(tabName!);
    });
  });

  // Mode toggle (page/selection)
  document.querySelectorAll('[data-mode]').forEach(button => {
    button.addEventListener('click', () => {
      const mode = button.getAttribute('data-mode');
      setSelectionMode(mode as 'page' | 'selection');
    });
  });

  // Settings mode toggle
  document.querySelectorAll('[data-setting-mode]').forEach(button => {
    button.addEventListener('click', () => {
      const mode = button.getAttribute('data-setting-mode');
      setSettingsMode(mode as 'exclude' | 'includeOnly');
    });
  });

  // Smart detect button
  document.getElementById('smartDetectBtn')?.addEventListener('click', () => {
    handleSmartDetect();
  });

  // Apply button
  document.getElementById('applyBtn')?.addEventListener('click', () => {
    handleApplyChanges();
  });

  // Base font size input
  document.getElementById('baseFontSize')?.addEventListener('input', () => {
    updatePreview();
  });

  // Save settings button
  document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
    handleSaveSettings();
  });

  // Save preset button
  document.getElementById('savePresetBtn')?.addEventListener('click', () => {
    handleSavePreset();
  });

  // Add selection to protected list
  document.getElementById('addSelectionBtn')?.addEventListener('click', () => {
    handleAddSelection();
  });

  // Export history
  document.getElementById('exportHistoryBtn')?.addEventListener('click', () => {
    handleExportHistory();
  });
}

/**
 * Switch active tab
 */
function switchTab(tabName: string) {
  // Update tab buttons
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
  });

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tabName}`);
  });
}

/**
 * Set selection mode
 */
function setSelectionMode(mode: 'page' | 'selection') {
  document.querySelectorAll('[data-mode]').forEach(button => {
    button.classList.toggle('active', button.getAttribute('data-mode') === mode);
  });

  parent.postMessage(
    {
      pluginMessage: {
        type: 'update-config',
        config: { selectionMode: mode }
      }
    },
    '*'
  );
}

/**
 * Set settings mode
 */
function setSettingsMode(mode: 'exclude' | 'includeOnly') {
  document.querySelectorAll('[data-setting-mode]').forEach(button => {
    button.classList.toggle(
      'active',
      button.getAttribute('data-setting-mode') === mode
    );
  });

  const description = document.getElementById('modeDescription');
  if (description) {
    if (mode === 'exclude') {
      description.textContent =
        'Exclude Mode: Update all text elements except those in the protected list.';
    } else {
      description.textContent =
        'Include Only Mode: Only update text elements in the protected list.';
    }
  }

  const protectedInfo = document.getElementById('protectedModeInfo');
  if (protectedInfo) {
    if (mode === 'exclude') {
      protectedInfo.innerHTML =
        'Current mode: <strong>Exclude Mode</strong><br>Elements in this list will be skipped during updates.';
    } else {
      protectedInfo.innerHTML =
        'Current mode: <strong>Include Only Mode</strong><br>Only elements in this list will be updated.';
    }
  }

  if (currentConfig) {
    currentConfig.mode = mode;
  }
}

/**
 * Handle smart detect
 */
function handleSmartDetect() {
  const button = document.getElementById('smartDetectBtn') as HTMLButtonElement;
  button.disabled = true;
  button.textContent = 'Detecting...';

  parent.postMessage(
    {
      pluginMessage: {
        type: 'smart-detect'
      }
    },
    '*'
  );
}

/**
 * Handle apply changes
 */
function handleApplyChanges() {
  const input = document.getElementById('baseFontSize') as HTMLInputElement;
  const baseFontSize = parseFloat(input.value);

  if (isNaN(baseFontSize) || baseFontSize < 8 || baseFontSize > 32) {
    showAlert('error', 'Base font size must be between 8 and 32 pixels');
    return;
  }

  const button = document.getElementById('applyBtn') as HTMLButtonElement;
  button.disabled = true;
  button.textContent = 'Applying...';

  parent.postMessage(
    {
      pluginMessage: {
        type: 'apply-changes',
        baseFontSize
      }
    },
    '*'
  );
}

/**
 * Handle save settings
 */
function handleSaveSettings() {
  const remValuesInput = document.getElementById(
    'customRemValues'
  ) as HTMLInputElement;
  const patternsInput = document.getElementById('layerPatterns') as HTMLInputElement;

  // Parse custom rem values
  const remValues = remValuesInput.value
    .split(',')
    .map(v => parseFloat(v.trim()))
    .filter(v => !isNaN(v));

  // Parse layer patterns
  const patterns = patternsInput.value
    .split(',')
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const config: any = {
    customRemValues: remValues
  };

  if (currentConfig?.mode === 'exclude') {
    config.excludedLayerPatterns = patterns;
  } else {
    config.includedLayerPatterns = patterns;
  }

  parent.postMessage(
    {
      pluginMessage: {
        type: 'update-config',
        config
      }
    },
    '*'
  );

  showAlert('success', 'Settings saved successfully');
}

/**
 * Handle save preset
 */
function handleSavePreset() {
  const name = prompt('Enter preset name:');
  if (!name) return;

  const description = prompt('Enter preset description (optional):') || '';

  const input = document.getElementById('baseFontSize') as HTMLInputElement;
  const baseFontSize = parseFloat(input.value);

  const remValuesInput = document.getElementById(
    'customRemValues'
  ) as HTMLInputElement;
  const customRemValues = remValuesInput.value
    .split(',')
    .map(v => parseFloat(v.trim()))
    .filter(v => !isNaN(v));

  parent.postMessage(
    {
      pluginMessage: {
        type: 'save-preset',
        preset: {
          name,
          description,
          baseFontSize,
          customRemValues
        }
      }
    },
    '*'
  );
}

/**
 * Handle add selection to protected list
 */
function handleAddSelection() {
  parent.postMessage(
    {
      pluginMessage: {
        type: 'add-to-protected',
        nodeIds: [] // Will be populated by plugin with current selection
      }
    },
    '*'
  );
}

/**
 * Handle export history
 */
function handleExportHistory() {
  const report = generateHistoryReport();
  const blob = new Blob([report], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rem-plugin-history-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Generate history report
 */
function generateHistoryReport(): string {
  let report = '# Rem Plugin - Change History\n\n';
  report += `Generated: ${new Date().toLocaleString()}\n\n`;

  for (const entry of history) {
    const date = new Date(entry.timestamp).toLocaleString();
    report += `## ${date}\n\n`;
    report += `- Base font size changed: ${entry.baseFontSize.old}px → ${entry.baseFontSize.new}px\n`;
    report += `- Text nodes updated: ${entry.textNodesUpdated}\n`;
    report += `- Variables updated: ${entry.variablesUpdated}\n\n`;

    if (entry.changes.length > 0) {
      report += '### Changed Elements\n\n';
      for (const change of entry.changes.slice(0, 50)) {
        report += `- **${change.nodeName}**: ${change.oldSize}px → ${change.newSize}px\n`;
      }
      if (entry.changes.length > 50) {
        report += `\n_... and ${entry.changes.length - 50} more_\n`;
      }
      report += '\n';
    }
  }

  return report;
}

/**
 * Update preview
 */
function updatePreview() {
  parent.postMessage(
    {
      pluginMessage: {
        type: 'get-selection'
      }
    },
    '*'
  );
}

/**
 * Show alert
 */
function showAlert(type: 'info' | 'success' | 'error', message: string) {
  const existingAlert = document.querySelector('.alert-temp');
  if (existingAlert) {
    existingAlert.remove();
  }

  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-temp`;
  alert.textContent = message;

  const mainTab = document.getElementById('tab-main');
  mainTab?.insertBefore(alert, mainTab.firstChild);

  setTimeout(() => {
    alert.remove();
  }, 5000);
}

/**
 * Display detection result
 */
function displayDetectionResult(result: any) {
  const container = document.getElementById('detectionResult');
  if (!container) return;

  const confidenceLevel =
    result.confidence >= 0.7 ? 'high' : result.confidence >= 0.4 ? 'medium' : 'low';

  container.innerHTML = `
    <div class="detection-result">
      <div class="confidence">
        <strong>Confidence:</strong>
        <div class="confidence-bar">
          <div class="confidence-fill ${confidenceLevel}" style="width: ${result.confidence * 100}%"></div>
        </div>
        <span>${Math.round(result.confidence * 100)}%</span>
      </div>
      <p class="analysis-text">${result.analysis}</p>
      ${
        result.isRemBased
          ? `
        <div style="margin-top: 12px;">
          <button class="button button-small" onclick="applyDetectedBase(${result.suggestedBaseFontSize})">
            Use Suggested Base (${result.suggestedBaseFontSize}px)
          </button>
        </div>
      `
          : ''
      }
    </div>
  `;

  container.style.display = 'block';

  // Reset button
  const button = document.getElementById('smartDetectBtn') as HTMLButtonElement;
  button.disabled = false;
  button.textContent = 'Smart Detect';
}

/**
 * Apply detected base font size
 */
(window as any).applyDetectedBase = function (baseFontSize: number) {
  const input = document.getElementById('baseFontSize') as HTMLInputElement;
  input.value = baseFontSize.toString();
  updatePreview();
};

/**
 * Update preview display
 */
function updatePreviewDisplay(counts: any) {
  document.getElementById('totalCount')!.textContent = counts.total.toString();
  document.getElementById('updateCount')!.textContent = counts.willUpdate.toString();
  document.getElementById('variableCount')!.textContent =
    counts.usingVariables.toString();
  document.getElementById('lockedCount')!.textContent = counts.locked.toString();
  document.getElementById('protectedCount')!.textContent = (
    counts.total -
    counts.filtered
  ).toString();
}

/**
 * Render presets list
 */
function renderPresets() {
  // Built-in presets
  const builtInList = document.getElementById('builtInPresetsList');
  if (builtInList) {
    builtInList.innerHTML = builtInPresets
      .map(
        preset => `
      <li class="list-item">
        <div class="list-item-content">
          <div class="list-item-title">${preset.name}</div>
          <div class="list-item-description">${preset.description} • ${preset.baseFontSize}px base</div>
        </div>
        <div class="list-item-actions">
          <button class="button button-secondary button-small" onclick="loadPreset('${preset.name}', true)">Load</button>
        </div>
      </li>
    `
      )
      .join('');
  }

  // Custom presets
  const customList = document.getElementById('customPresetsList');
  const noPresetsState = document.getElementById('noPresetsState');

  if (customPresets.length === 0) {
    if (customList) customList.style.display = 'none';
    if (noPresetsState) noPresetsState.style.display = 'block';
  } else {
    if (customList) {
      customList.style.display = 'block';
      customList.innerHTML = customPresets
        .map(
          preset => `
        <li class="list-item">
          <div class="list-item-content">
            <div class="list-item-title">${preset.name}</div>
            <div class="list-item-description">${preset.description || 'Custom preset'} • ${preset.baseFontSize}px base</div>
          </div>
          <div class="list-item-actions">
            <button class="button button-secondary button-small" onclick="loadPreset('${preset.name}', false)">Load</button>
            <button class="button button-danger button-small" onclick="deletePreset('${preset.name}')">Delete</button>
          </div>
        </li>
      `
        )
        .join('');
    }
    if (noPresetsState) noPresetsState.style.display = 'none';
  }
}

/**
 * Load preset
 */
(window as any).loadPreset = function (name: string, isBuiltIn: boolean) {
  const presets = isBuiltIn ? builtInPresets : customPresets;
  const preset = presets.find(p => p.name === name);

  if (preset) {
    parent.postMessage(
      {
        pluginMessage: {
          type: 'load-preset',
          preset
        }
      },
      '*'
    );
  }
};

/**
 * Delete preset
 */
(window as any).deletePreset = function (name: string) {
  if (confirm(`Delete preset "${name}"?`)) {
    parent.postMessage(
      {
        pluginMessage: {
          type: 'delete-preset',
          presetName: name
        }
      },
      '*'
    );
  }
};

/**
 * Render history
 */
function renderHistory() {
  const historyList = document.getElementById('historyList');
  const noHistoryState = document.getElementById('noHistoryState');

  if (history.length === 0) {
    if (historyList) historyList.style.display = 'none';
    if (noHistoryState) noHistoryState.style.display = 'block';
  } else {
    if (historyList) {
      historyList.style.display = 'block';
      historyList.innerHTML = history
        .map(
          (entry, index) => `
        <li class="history-entry" onclick="toggleHistoryEntry(${index})">
          <div class="history-header">
            <span class="history-title">${entry.baseFontSize.old}px → ${entry.baseFontSize.new}px</span>
            <span class="history-time">${new Date(entry.timestamp).toLocaleString()}</span>
          </div>
          <div class="history-stats">
            ${entry.textNodesUpdated} text nodes, ${entry.variablesUpdated} variables
          </div>
          <div class="history-changes">
            ${entry.changes
              .slice(0, 20)
              .map(
                change => `
              <div class="change-item">
                <span>${change.nodeName}</span>
                <span>${change.oldSize}px → ${change.newSize}px</span>
              </div>
            `
              )
              .join('')}
            ${entry.changes.length > 20 ? `<div style="padding: 4px; font-size: 10px; color: var(--figma-color-text-secondary);">... and ${entry.changes.length - 20} more</div>` : ''}
          </div>
        </li>
      `
        )
        .join('');
    }
    if (noHistoryState) noHistoryState.style.display = 'none';
  }
}

/**
 * Toggle history entry expansion
 */
(window as any).toggleHistoryEntry = function (index: number) {
  const entries = document.querySelectorAll('.history-entry');
  if (entries[index]) {
    entries[index].classList.toggle('expanded');
  }
};

/**
 * Render protected elements
 */
function renderProtectedElements() {
  const nodesList = document.getElementById('protectedNodesList');
  const noProtectedState = document.getElementById('noProtectedState');

  const nodeIds =
    currentConfig?.mode === 'exclude'
      ? currentConfig.excludedNodeIds || []
      : currentConfig.includedNodeIds || [];

  if (nodeIds.length === 0) {
    if (nodesList) nodesList.style.display = 'none';
    if (noProtectedState) noProtectedState.style.display = 'block';
  } else {
    if (nodesList) {
      nodesList.style.display = 'block';
      nodesList.innerHTML = nodeIds
        .map(
          nodeId => `
        <li class="list-item">
          <div class="list-item-content">
            <div class="list-item-title">${nodeId}</div>
          </div>
          <div class="list-item-actions">
            <button class="button button-danger button-small" onclick="removeProtectedNode('${nodeId}')">Remove</button>
          </div>
        </li>
      `
        )
        .join('');
    }
    if (noProtectedState) noProtectedState.style.display = 'none';
  }

  // Render patterns
  const patternsList = document.getElementById('patternsList');
  const patterns =
    currentConfig?.mode === 'exclude'
      ? currentConfig.excludedLayerPatterns || []
      : currentConfig.includedLayerPatterns || [];

  if (patternsList) {
    if (patterns.length === 0) {
      patternsList.innerHTML =
        '<p style="font-size: 11px; color: var(--figma-color-text-secondary);">No patterns defined. Add them in Settings tab.</p>';
    } else {
      patternsList.innerHTML = patterns
        .map(pattern => `<div class="list-item"><div class="list-item-title">${pattern}</div></div>`)
        .join('');
    }
  }
}

/**
 * Remove protected node
 */
(window as any).removeProtectedNode = function (nodeId: string) {
  parent.postMessage(
    {
      pluginMessage: {
        type: 'remove-from-protected',
        nodeId
      }
    },
    '*'
  );
};

/**
 * Handle messages from plugin
 */
window.onmessage = (event) => {
  const msg = event.data.pluginMessage;
  if (!msg) return;

  switch (msg.type) {
    case 'init':
      currentConfig = msg.config;
      customPresets = msg.presets;
      builtInPresets = msg.builtInPresets;
      history = msg.history;

      // Update UI
      const baseFontSizeInput = document.getElementById(
        'baseFontSize'
      ) as HTMLInputElement;
      if (baseFontSizeInput) {
        baseFontSizeInput.value = currentConfig.baseFontSize.toString();
      }

      // Set mode toggles
      setSelectionMode(currentConfig.selectionMode);
      setSettingsMode(currentConfig.mode);

      // Set custom rem values
      const remValuesInput = document.getElementById(
        'customRemValues'
      ) as HTMLInputElement;
      if (remValuesInput) {
        remValuesInput.value = currentConfig.customRemValues.join(', ');
      }

      // Set layer patterns
      const patternsInput = document.getElementById(
        'layerPatterns'
      ) as HTMLInputElement;
      if (patternsInput) {
        const patterns =
          currentConfig.mode === 'exclude'
            ? currentConfig.excludedLayerPatterns
            : currentConfig.includedLayerPatterns;
        patternsInput.value = patterns.join(', ');
      }

      renderPresets();
      renderHistory();
      renderProtectedElements();
      updatePreview();
      break;

    case 'selection-update':
      updatePreviewDisplay(msg.counts);
      break;

    case 'detect-result':
      displayDetectionResult(msg.result);
      break;

    case 'apply-success':
      const applyBtn = document.getElementById('applyBtn') as HTMLButtonElement;
      applyBtn.disabled = false;
      applyBtn.textContent = 'Apply Changes';
      showAlert(
        'success',
        `Successfully updated ${msg.result.textNodesUpdated} text nodes!`
      );
      history.unshift(msg.historyEntry);
      renderHistory();
      break;

    case 'config-updated':
      currentConfig = msg.config;
      renderProtectedElements();
      break;

    case 'preset-loaded':
      currentConfig = msg.config;
      const input = document.getElementById('baseFontSize') as HTMLInputElement;
      if (input) {
        input.value = currentConfig.baseFontSize.toString();
      }
      const remInput = document.getElementById('customRemValues') as HTMLInputElement;
      if (remInput) {
        remInput.value = currentConfig.customRemValues.join(', ');
      }
      showAlert('success', 'Preset loaded successfully');
      switchTab('main');
      updatePreview();
      break;

    case 'presets-updated':
      customPresets = msg.presets;
      renderPresets();
      break;

    case 'error':
      showAlert('error', msg.message);
      // Reset buttons
      const smartBtn = document.getElementById('smartDetectBtn') as HTMLButtonElement;
      if (smartBtn) {
        smartBtn.disabled = false;
        smartBtn.textContent = 'Smart Detect';
      }
      const applyButton = document.getElementById('applyBtn') as HTMLButtonElement;
      if (applyButton) {
        applyButton.disabled = false;
        applyButton.textContent = 'Apply Changes';
      }
      break;
  }
};

// Initialize
initializeEventListeners();
