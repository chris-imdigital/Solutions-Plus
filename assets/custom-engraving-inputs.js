/**
 * Custom Engraving Inputs - Character Counter
 *
 * Provides live character count feedback for engraving input fields.
 * Updates the counter display as users type and applies visual feedback
 * when approaching or reaching the character limit.
 */

class CustomEngravingInputs {
  constructor() {
    this.inputs = document.querySelectorAll('.custom-engraving-inputs__input[data-char-limit]');
    this.init();
  }

  init() {
    this.inputs.forEach((input) => {
      const charLimit = parseInt(input.dataset.charLimit, 10);
      const counterId = input.id;
      const counterEl = document.querySelector(`[data-char-count-for="${counterId}"]`);

      if (!counterEl || !charLimit) return;

      const currentCountEl = counterEl.querySelector('[data-current-count]');
      if (!currentCountEl) return;

      // Update on input
      input.addEventListener('input', () => {
        this.updateCharCount(input, currentCountEl, counterEl, charLimit);
      });

      // Initial update in case of pre-filled values
      this.updateCharCount(input, currentCountEl, counterEl, charLimit);
    });
  }

  updateCharCount(input, currentCountEl, counterEl, charLimit) {
    const currentLength = input.value.length;
    currentCountEl.textContent = currentLength;

    // Toggle limit class when at or near limit
    const isAtLimit = currentLength >= charLimit;
    counterEl.classList.toggle('custom-engraving-inputs__char-count--limit', isAtLimit);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new CustomEngravingInputs());
} else {
  new CustomEngravingInputs();
}

// Re-initialize when Shopify section is reloaded (theme editor)
document.addEventListener('shopify:section:load', () => {
  new CustomEngravingInputs();
});

// Re-initialize when quick-add dialog opens (inputs are morphed into modal)
document.addEventListener('dialog:open', (event) => {
  if (event.target?.id === 'quick-add-dialog') {
    // Small delay to ensure morph is complete
    requestAnimationFrame(() => new CustomEngravingInputs());
  }
});
