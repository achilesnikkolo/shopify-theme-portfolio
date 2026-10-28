class CartDrawer extends HTMLElement {
  connectedCallback() {
    this.dialog = this.querySelector('dialog');
    this.status = this.querySelector('[data-drawer-status]');
    if (!this.dialog) return;

    // Buttons inside the drawer: close, quantity, and remove
    this.addEventListener('click', (event) => {
      if (event.target.closest('[data-drawer-close]')) {
        this.close();
        return;
      }

      const lineButton = event.target.closest('[data-line]');
      if (lineButton) {
        this.changeLine(
          Number(lineButton.dataset.line),
          Number(lineButton.dataset.quantity),
          lineButton.dataset.focusKey,
        );
      }
    });

    // Clicking the dark backdrop closes the drawer
    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog) this.close();
    });

    // The header cart icon opens the drawer instead of going to /cart
    document.addEventListener('click', (event) => {
      const cartLink = event.target.closest('[data-cart-link]');
      if (!cartLink) return;
      event.preventDefault();
      this.open();
    });
  }

  open() {
    if (!this.dialog.open) this.dialog.showModal();
  }

  close() {
    this.dialog.close();
  }

  async changeLine(line, quantity, focusKey) {
    this.setBusy(true);

    try {
      const response = await fetch(`${this.dataset.cartChangeUrl}.js`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ line, quantity, sections: 'cart-drawer' }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.description || data.message || 'Could not update your cart.',
        );
      }

      this.renderContents(data.sections?.['cart-drawer'], focusKey);
      this.status.textContent =
        quantity === 0 ? 'Item removed.' : 'Cart updated.';
    } catch (error) {
      this.status.textContent = error.message;
    } finally {
      this.setBusy(false);
    }
  }

  renderContents(sectionHtml, focusKey) {
    if (!sectionHtml) return;

    const html = new DOMParser().parseFromString(sectionHtml, 'text/html');
    const newContents = html.getElementById('CartDrawer-Contents');
    const currentContents = this.querySelector('#CartDrawer-Contents');
    if (!newContents || !currentContents) return;

    currentContents.replaceWith(newContents);
    this.updateCount(Number(newContents.dataset.count) || 0);

    // Return keyboard focus to the same button, or to the title if it's gone
    if (this.dialog.open) {
      const sameButton = focusKey
        ? this.querySelector(`[data-focus-key="${focusKey}"]`)
        : null;
      (sameButton || this.querySelector('#CartDrawer-Title'))?.focus();
    }
  }

  updateCount(count) {
    document.querySelectorAll('[data-cart-count]').forEach((element) => {
      element.textContent = count;
      element.hidden = count === 0;
    });

    document.querySelectorAll('[data-cart-link]').forEach((link) => {
      link.setAttribute('aria-label', `Cart (${count} items)`);
    });
  }

  setBusy(isBusy) {
    const contents = this.querySelector('#CartDrawer-Contents');
    contents?.classList.toggle('is-busy', isBusy);
    contents?.setAttribute('aria-busy', String(isBusy));
  }
}

if (!customElements.get('cart-drawer')) {
  customElements.define('cart-drawer', CartDrawer);
}
