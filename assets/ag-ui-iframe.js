if (!customElements.get('ag-ui-iframe')) {
  class AgUIIframe extends HTMLElement {
    constructor() {
      super();

      this.iframe = document.createElement('iframe');
      this.iframe.style.border = 'none';
      this.iframe.style.height = '100%';
      this.iframe.title = 'AG-UI Iframe';
      this.iframe.style.width = '100%';

      this.src = this.getSanitizedSrc(this.getAttribute('src'));

      this.shadow = this.attachShadow({ mode: 'open' });
      this.shadow.appendChild(this.iframe);
    }

    connectedCallback() {
      if (this.src) {
        this.iframe.src = this.src;
      } else {
        this.renderFallback();
      }

      this.messageListener = this.messageListener.bind(this);
      window.addEventListener('message', this.messageListener);
    }

    disconnectedCallback() {
      window.removeEventListener('message', this.messageListener);
    }

    static get observedAttributes() {
      return ['src'];
    }

    attributeChangedCallback(name, _, newValue) {
      if (name === 'src') {
        const sanitizedSrc = this.getSanitizedSrc(newValue);

        if (sanitizedSrc) {
          this.iframe.removeAttribute('srcdoc');
          this.iframe.src = sanitizedSrc;
        } else {
          this.iframe.removeAttribute('src');
          this.renderFallback();
        }

        this.src = sanitizedSrc;

        return;
      }

      this.iframe[name] = newValue;
    }

    getSanitizedPositionOptions(value) {
      if (!value || typeof value !== 'object') {
        return undefined;
      }

      const options = {};

      if (typeof value.enableHighAccuracy === 'boolean') {
        options.enableHighAccuracy = value.enableHighAccuracy;
      }

      if (
        typeof value.maximumAge === 'number' &&
        Number.isFinite(value.maximumAge) &&
        value.maximumAge >= 0
      ) {
        options.maximumAge = value.maximumAge;
      }

      if (
        typeof value.timeout === 'number' &&
        Number.isFinite(value.timeout) &&
        value.timeout >= 0
      ) {
        options.timeout = value.timeout;
      }

      return Object.keys(options).length > 0 ? options : undefined;
    }

    getSanitizedSrc(value) {
      if (!value) return null;

      try {
        const url = new URL(value, window.location.href);

        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          return null;
        }

        url.searchParams.set('origin', window.location.origin);

        return url.href;
      } catch (err) {
        console.error(
          'AG-UI Iframe: Failed to parse "src" attribute value.',
          { value, error: err },
        );

        return null;
      }
    }

    async messageListener(event) {
      const handledMessages = ['getCurrentPosition'];
      const isMessageValid = handledMessages.includes(event.data?.name);
      const isSourceValid = event.source === this.iframe?.contentWindow;
      const isTrustedOrigin = (() => {
        if (!this.iframe?.src) return false;

        try {
          const iframeUrl = new URL(this.iframe.src);
          return event.origin === iframeUrl.origin;
        } catch {
          return false;
        }
      })();

      if (!isMessageValid || !isSourceValid || !isTrustedOrigin) return;

      if (event.data.name === 'getCurrentPosition') {
        const positionOptions = this.getSanitizedPositionOptions(
          event.data?.positionOptions,
        );

        if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
          event.source.postMessage({
            name: 'getCurrentPosition',
            error: {
              message: 'Geolocation API is not supported by your browser',
            },
          }, event.origin);

          return;
        }

        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, positionOptions);
          });

          event.source.postMessage(
            {
              name: 'getCurrentPosition',
              position: {
                coords: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                },
              },
            },
            event.origin,
          );
        } catch (err) {
          event.source.postMessage({
            name: 'getCurrentPosition',
            error: {
              code: err.code,
              message: err.message,
            },
          }, event.origin);
        }
      }
    }

    renderFallback() {
      this.iframe.srcdoc = `
        <div>
          <h1>Failed to load content</h1>
          <h2>Check if the source URL is correct and allows embedding</h2>
        </div>

        <style>
          body {
            background: white;
            border: 1px solid black;
            box-sizing: border-box;
            height: 100%;
            margin: 0;
            padding: 16px;
            text-align: center;
            width: 100%;
          }

          html {
            height: 100%;
            width: 100%;
          }
        </style>
    `;
    }
  }

  customElements.define('ag-ui-iframe', AgUIIframe);
}
