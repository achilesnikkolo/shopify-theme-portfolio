class ProductRecommendations extends HTMLElement {
  connectedCallback() {
    if (!this.dataset.url) return;

    // Wait until the shopper scrolls near this section, then load
    this.observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        this.observer.disconnect();
        this.load();
      },
      { rootMargin: '0px 0px 400px 0px' }
    );

    this.observer.observe(this);
  }

  disconnectedCallback() {
    this.observer?.disconnect();
  }

  async load() {
    try {
      const response = await fetch(this.dataset.url);
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);

      const html = new DOMParser().parseFromString(await response.text(), 'text/html');
      const filled = html.querySelector('product-recommendations');

      if (filled && filled.innerHTML.trim() !== '') {
        this.innerHTML = filled.innerHTML;
        this.classList.add('is-loaded');
      }
    } catch (error) {
      console.warn('Could not load product recommendations:', error);
    }
  }
}

if (!customElements.get('product-recommendations')) {
  customElements.define('product-recommendations', ProductRecommendations);
}