class CollectionFilters extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('[data-filter-form]');
    this.status = this.querySelector('[data-filter-status]');
    if (!this.form) return;

    this.sectionId = this.dataset.sectionId;

    // A filter, the sort, or a price changed: update the products
    this.form.addEventListener('change', (event) => {
      if (event.target.matches('input, select')) this.update();
    });

    // "Apply filters" (or Enter in a price field): update without reloading
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.update();
    });

    // Filter pills, "Clear all", and pagination links: update without reloading
    this.addEventListener('click', (event) => {
      const link = event.target.closest(
        '.active-filters a, .collection__empty-link, .pagination a'
      );
      if (!link) return;

      event.preventDefault();
      const params = new URL(link.href).searchParams.toString();
      const isPagination = Boolean(link.closest('.pagination'));
      this.render(params, { pushState: true, scroll: isPagination });
    });

    // Back and forward buttons: show the matching filters
    window.addEventListener('popstate', () => {
      this.render(window.location.search.slice(1), { pushState: false });
    });

    this.classList.add('is-enhanced');
  }

  // Turn the form into URL parameters, skipping empty fields
  getParams() {
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(this.form)) {
      if (value !== '') params.append(key, value);
    }
    return params.toString();
  }

  update() {
    this.render(this.getParams(), { pushState: true });
  }

  async render(params, { pushState, scroll = false }) {
    const results = this.querySelector('.collection__results');
    results?.classList.add('is-loading');
    results?.setAttribute('aria-busy', 'true');

    // Remember which control was focused, to restore it afterward
    const active = document.activeElement;
    const focusName = this.contains(active) ? active.name : null;
    const focusValue = this.contains(active) ? active.value : null;

    try {
      const query = params ? `${params}&` : '';
      const response = await fetch(
        `${window.location.pathname}?${query}section_id=${this.sectionId}`
      );
      if (!response.ok) throw new Error('Request failed');

      const html = new DOMParser().parseFromString(await response.text(), 'text/html');

      ['.collection__filters', '.collection__results'].forEach((selector) => {
        const current = this.querySelector(selector);
        const next = html.querySelector(selector);
        if (current && next) current.replaceWith(next);
      });

      if (pushState) {
        const newUrl = `${window.location.pathname}${params ? `?${params}` : ''}`;
        window.history.pushState({}, '', newUrl);
      }

      this.restoreFocus(focusName, focusValue);

      const count = this.querySelector('.collection__count');
      if (this.status && count) this.status.textContent = count.textContent.trim();

      if (scroll) {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }
    } catch (error) {
      // If anything fails, fall back to a normal page load
      window.location.search = params;
    }
  }

  restoreFocus(name, value) {
    if (!name) return;
    const byValue = this.querySelector(
      `[name="${CSS.escape(name)}"][value="${CSS.escape(value)}"]`
    );
    const byName = this.querySelector(`[name="${CSS.escape(name)}"]`);
    (byValue || byName)?.focus();
  }
}

if (!customElements.get('collection-filters')) {
  customElements.define('collection-filters', CollectionFilters);
}