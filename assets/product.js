function updateCartCount(count) {
  document.querySelectorAll('[data-cart-count]').forEach((element) => {
    element.textContent = count;
    element.hidden = count === 0;
  });

  document.querySelectorAll('[data-cart-link]').forEach((link) => {
    link.setAttribute('aria-label', `Cart (${count} items)`);
  });
}

class QuantityInput extends HTMLElement {
  connectedCallback() {
    this.input = this.querySelector('input');
    if (!this.input) return;

    this.querySelector('[data-quantity-minus]')?.addEventListener('click', () =>
      this.change(-1),
    );
    this.querySelector('[data-quantity-plus]')?.addEventListener('click', () =>
      this.change(1),
    );
  }

  change(step) {
    const min = Number(this.input.min) || 1;
    const current = Number(this.input.value) || min;
    this.input.value = Math.max(min, current + step);
  }
}

class ProductInfo extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('[data-product-form]');
    this.select = this.querySelector('[data-variant-select]');
    this.addButton = this.querySelector('[data-add-button]');
    this.status = this.querySelector('[data-status]');
    this.priceElement = this.querySelector('[data-price]');
    this.compareElement = this.querySelector('[data-compare-price]');

    const variantData = this.querySelector('[data-variants]');
    this.variants = variantData ? JSON.parse(variantData.textContent) : [];
    this.isSoldOut = this.addButton ? this.addButton.disabled : false;

    this.select?.addEventListener('change', () => this.onVariantChange());
    this.form?.addEventListener('submit', (event) => this.onSubmit(event));
  }

  formatMoney(cents) {
    return new Intl.NumberFormat(document.documentElement.lang || 'en', {
      style: 'currency',
      currency: this.dataset.currency || 'USD',
    }).format(cents / 100);
  }

  onVariantChange() {
    const variant = this.variants.find(
      (item) => String(item.id) === this.select.value,
    );
    if (!variant) return;

    this.priceElement.textContent = this.formatMoney(variant.price);

    const onSale = variant.compare_at_price > variant.price;
    this.compareElement.hidden = !onSale;
    if (onSale) {
      this.compareElement.textContent = this.formatMoney(
        variant.compare_at_price,
      );
    }

    this.isSoldOut = !variant.available;
    this.addButton.disabled = this.isSoldOut;
    this.addButton.textContent = this.isSoldOut ? 'Sold out' : 'Add to cart';

    const url = new URL(window.location.href);
    url.searchParams.set('variant', variant.id);
    window.history.replaceState({}, '', url);
  }

  setLoading(isLoading) {
    this.addButton.setAttribute('aria-busy', String(isLoading));
    this.addButton.disabled = isLoading || this.isSoldOut;
    if (!this.isSoldOut) {
      this.addButton.textContent = isLoading ? 'Adding…' : 'Add to cart';
    }
  }

  async onSubmit(event) {
    event.preventDefault();

    const formData = new FormData(this.form);
    const item = {
      id: Number(formData.get('id')),
      quantity: Number(formData.get('quantity')) || 1,
    };

    this.status.textContent = '';
    this.setLoading(true);

    try {
      const response = await fetch(`${this.dataset.cartAddUrl}.js`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ items: [item], sections: 'cart-drawer' }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.description || data.message || 'Could not add to cart.',
        );
      }

      const drawer = document.querySelector('cart-drawer');

      if (drawer && data.sections?.['cart-drawer']) {
        drawer.renderContents(data.sections['cart-drawer']);
        drawer.open();
      } else {
        const cartResponse = await fetch(`${this.dataset.cartUrl}.js`, {
          headers: { Accept: 'application/json' },
        });
        const cart = await cartResponse.json();
        updateCartCount(cart.item_count);
      }

      this.status.textContent = 'Added to cart.';
    } catch (error) {
      this.status.textContent = error.message;
    } finally {
      this.setLoading(false);
    }
  }
}

if (!customElements.get('quantity-input')) {
  customElements.define('quantity-input', QuantityInput);
}

if (!customElements.get('product-info')) {
  customElements.define('product-info', ProductInfo);
}
