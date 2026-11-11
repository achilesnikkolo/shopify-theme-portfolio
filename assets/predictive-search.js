class PredictiveSearch extends HTMLElement {
  connectedCallback() {
    this.input = this.querySelector('input[type="search"]');
    this.results = this.querySelector('[data-predictive-results]');
    this.searchUrl = this.dataset.searchUrl;
    if (!this.input || !this.results || !this.searchUrl) return;

    // A hidden message area, so screen readers hear how many results appeared
    this.status = document.createElement('p');
    this.status.className = 'visually-hidden';
    this.status.setAttribute('role', 'status');
    this.append(this.status);

    // Wait until the shopper pauses typing before searching
    this.input.addEventListener('input', () => {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.search(), 300);
    });
  }

  disconnectedCallback() {
    clearTimeout(this.timer);
    this.controller?.abort();
  }

  async search() {
    const terms = this.input.value.trim();
    if (terms.length < 2) {
      this.clear();
      return;
    }

    // Cancel the previous search if it's still loading
    this.controller?.abort();
    this.controller = new AbortController();

    const params = new URLSearchParams({
      q: terms,
      'resources[type]': 'product,collection,query',
      'resources[limit]': '4',
      'resources[options][prefix]': 'last',
      section_id: 'predictive-search',
    });

    try {
      const response = await fetch(`${this.searchUrl}?${params}`, {
        signal: this.controller.signal,
      });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);

      const html = new DOMParser().parseFromString(await response.text(), 'text/html');
      const content = html.querySelector('.predictive-search__results');

      if (!content) {
        this.clear();
        return;
      }

      this.results.replaceChildren(content);

      const count = Number(content.dataset.resultsCount) || 0;
      this.status.textContent =
        count > 0 ? `${count} suggestions available` : 'No results found';
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.warn('Predictive search failed:', error);
      }
    }
  }

  clear() {
    this.results.replaceChildren();
    this.status.textContent = '';
  }
}

if (!customElements.get('predictive-search')) {
  customElements.define('predictive-search', PredictiveSearch);
}