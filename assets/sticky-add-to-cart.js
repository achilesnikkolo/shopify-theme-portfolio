class StickyAddToCart extends HTMLElement {
  connectedCallback() {
    this.product = this.closest('product-info');
    if (!this.product) return;

    this.form = this.product.querySelector('[data-product-form]');
    this.mainButton = this.product.querySelector('[data-add-button]');
    this.mainPrice = this.product.querySelector('[data-price]');
    this.button = this.querySelector('[data-sticky-button]');
    this.price = this.querySelector('[data-sticky-price]');
    if (!this.form || !this.mainButton || !this.button) return;

    this.mobileQuery = window.matchMedia('(max-width: 749px)');
    this.scrolledPast = false;

    // JavaScript is running: make the bar part of the page, but hidden from focus
    this.hidden = false;
    this.inert = true;

    // The sticky button submits the real product form
    this.button.addEventListener('click', () => this.form.requestSubmit());

    // Keep the button and price matching the main ones
    this.mirror = new MutationObserver(() => this.sync());
    this.mirror.observe(this.mainButton, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    });
    if (this.mainPrice) {
      this.mirror.observe(this.mainPrice, { childList: true, characterData: true, subtree: true });
    }

    // Watch whether the main button has been scrolled past
    this.watcher = new IntersectionObserver(([entry]) => {
      this.scrolledPast = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      this.toggle();
    });
    this.watcher.observe(this.mainButton);

    // Re-check when switching between phone and desktop widths
    this.onResize = () => this.toggle();
    this.mobileQuery.addEventListener('change', this.onResize);

    this.sync();
  }

  disconnectedCallback() {
    this.mirror?.disconnect();
    this.watcher?.disconnect();
    this.mobileQuery?.removeEventListener('change', this.onResize);
  }

  sync() {
    this.button.disabled = this.mainButton.disabled;
    this.button.textContent = this.mainButton.textContent.trim();
    if (this.mainPrice && this.price) {
      this.price.textContent = this.mainPrice.textContent.trim();
    }
  }

  toggle() {
    const show = this.scrolledPast && this.mobileQuery.matches;
    this.classList.toggle('is-visible', show);
    this.inert = !show;
  }
}

if (!customElements.get('sticky-add-to-cart')) {
  customElements.define('sticky-add-to-cart', StickyAddToCart);
}