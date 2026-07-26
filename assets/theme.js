/**
 * APEX MODERN PREMIUM SHOPIFY THEME - GLOBAL JAVASCRIPT ENGINE
 * Modular, dependency-free Vanilla ES6+ architecture.
 */

class ApexTheme {
  constructor() {
    this.initDrawers();
    this.initStickyHeader();
    this.initAccordions();
    this.initTabs();
    this.initCarousels();
    this.initCartAjax();
    this.initQuickAdd();
  }

  /* ------------------------------------------------------------------------
   * 1. DRAWER & MODAL MANAGEMENT
   * ------------------------------------------------------------------------ */
  initDrawers() {
    const triggers = document.querySelectorAll('[data-drawer-trigger]');
    const backdrop = document.querySelector('[data-drawer-backdrop]');
    const closeBtns = document.querySelectorAll('[data-drawer-close]');

    triggers.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-drawer-trigger');
        this.openDrawer(targetId);
      });
    });

    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => this.closeAllDrawers());
    });

    if (backdrop) {
      backdrop.addEventListener('click', () => this.closeAllDrawers());
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeAllDrawers();
    });
  }

  openDrawer(drawerId) {
    const drawer = document.getElementById(drawerId);
    const backdrop = document.querySelector('[data-drawer-backdrop]');
    if (!drawer) return;

    this.closeAllDrawers();
    drawer.classList.add('is-active');
    if (backdrop) backdrop.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  }

  closeAllDrawers() {
    document.querySelectorAll('.drawer.is-active').forEach(d => d.classList.remove('is-active'));
    const backdrop = document.querySelector('[data-drawer-backdrop]');
    if (backdrop) backdrop.classList.remove('is-active');
    document.body.style.overflow = '';
  }

  /* ------------------------------------------------------------------------
   * 2. STICKY HEADER OBSERVER
   * ------------------------------------------------------------------------ */
  initStickyHeader() {
    const header = document.querySelector('[data-header-sticky]');
    if (!header) return;

    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 100) {
        header.classList.add('is-sticky');
        if (currentScrollY > lastScrollY && currentScrollY > 250) {
          header.classList.add('is-hidden');
        } else {
          header.classList.remove('is-hidden');
        }
      } else {
        header.classList.remove('is-sticky', 'is-hidden');
      }

      lastScrollY = currentScrollY;
    }, { passive: true });
  }

  /* ------------------------------------------------------------------------
   * 3. ACCORDIONS (PRODUCT DETAILS & FAQ)
   * ------------------------------------------------------------------------ */
  initAccordions() {
    const accordionTriggers = document.querySelectorAll('[data-accordion-trigger]');

    accordionTriggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const item = trigger.closest('.accordion__item');
        const content = item.querySelector('.accordion__content');
        const isOpen = item.classList.contains('is-open');

        // Close siblings if inside a single accordion group
        const group = trigger.closest('[data-accordion-group]');
        if (group) {
          group.querySelectorAll('.accordion__item.is-open').forEach(sibling => {
            if (sibling !== item) {
              sibling.classList.remove('is-open');
              sibling.querySelector('.accordion__content').style.maxHeight = null;
            }
          });
        }

        if (isOpen) {
          item.classList.remove('is-open');
          content.style.maxHeight = null;
        } else {
          item.classList.add('is-open');
          content.style.maxHeight = content.scrollHeight + 'px';
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
   * 4. TABS COMPONENT
   * ------------------------------------------------------------------------ */
  initTabs() {
    const tabNavs = document.querySelectorAll('[data-tab-group]');

    tabNavs.forEach(group => {
      const triggers = group.querySelectorAll('[data-tab-trigger]');
      const panes = group.querySelectorAll('[data-tab-pane]');

      triggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
          const target = trigger.getAttribute('data-tab-trigger');

          triggers.forEach(t => t.classList.remove('is-active'));
          panes.forEach(p => p.classList.remove('is-active'));

          trigger.classList.add('is-active');
          const activePane = group.querySelector(`[data-tab-pane="${target}"]`);
          if (activePane) activePane.classList.add('is-active');
        });
      });
    });
  }

  /* ------------------------------------------------------------------------
   * 5. CAROUSEL / SLIDER SYSTEM
   * ------------------------------------------------------------------------ */
  initCarousels() {
    const carousels = document.querySelectorAll('[data-carousel]');

    carousels.forEach(container => {
      const track = container.querySelector('[data-carousel-track]');
      const prevBtn = container.querySelector('[data-carousel-prev]');
      const nextBtn = container.querySelector('[data-carousel-next]');

      if (!track) return;

      const scrollAmount = () => track.firstElementChild ? track.firstElementChild.offsetWidth + 24 : 300;

      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
        });
      }

      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
        });
      }
    });
  }

  /* ------------------------------------------------------------------------
   * 6. AJAX CART ENGINE
   * ------------------------------------------------------------------------ */
  initCartAjax() {
    document.addEventListener('submit', async (e) => {
      const form = e.target.closest('form[action*="/cart/add"]');
      if (!form) return;

      e.preventDefault();
      const submitBtn = form.querySelector('[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerText : '';

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerText = 'Adding...';
        }

        const formData = new FormData(form);
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          body: formData,
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        if (!response.ok) throw new Error('Cart API request failed');

        const item = await response.json();
        await this.refreshCart();
        this.openDrawer('cart-drawer');

        if (submitBtn) {
          submitBtn.innerText = 'Added!';
          setTimeout(() => {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
          }, 1800);
        }
      } catch (err) {
        console.error('Add to Cart error:', err);
        if (submitBtn) {
          submitBtn.innerText = originalText;
          submitBtn.disabled = false;
        }
      }
    });
  }

  async refreshCart() {
    try {
      const res = await fetch('/cart.js');
      const cart = await res.json();

      // Update Header Cart Count Badges
      document.querySelectorAll('[data-cart-count]').forEach(badge => {
        badge.innerText = cart.item_count;
        badge.style.display = cart.item_count > 0 ? 'inline-flex' : 'none';
      });

      // Update Drawer HTML if container exists
      const drawerContent = document.getElementById('cart-drawer-items');
      if (drawerContent) {
        const htmlRes = await fetch('/cart?section_id=cart-drawer-items');
        if (htmlRes.ok) {
          const html = await htmlRes.text();
          drawerContent.innerHTML = html;
        }
      }
    } catch (err) {
      console.error('Error refreshing cart:', err);
    }
  }

  /* ------------------------------------------------------------------------
   * 7. QUICK ADD BUTTONS
   * ------------------------------------------------------------------------ */
  initQuickAdd() {
    document.addEventListener('click', async (e) => {
      const quickBtn = e.target.closest('[data-quick-add]');
      if (!quickBtn) return;

      const variantId = quickBtn.getAttribute('data-quick-add');
      if (!variantId) return;

      try {
        quickBtn.disabled = true;
        const formData = new FormData();
        formData.append('id', variantId);
        formData.append('quantity', 1);

        await fetch('/cart/add.js', {
          method: 'POST',
          body: formData
        });

        await this.refreshCart();
        this.openDrawer('cart-drawer');
      } catch (err) {
        console.error('Quick add error:', err);
      } finally {
        quickBtn.disabled = false;
      }
    });
  }
}

// Initialize Theme JS Engine when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.apexTheme = new ApexTheme();
});
