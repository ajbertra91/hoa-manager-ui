import {bind} from 'hyperhtml';
import delegate from 'dom-delegate';
import {dispatchEvents} from '../../common/utilities';
import '../hoa-form/hoa-form';
import './hoa-modal.css';

class HoaModal extends HTMLElement {
    // static get observedAttributes() { return ['nothing']; }

    connectedCallback() {
        this.connected = true;
        this.html = bind(this);
        this.render();
        this.addEventListeners();
    }

    disconnectedCallback() {
        this.delegateEl.off();
    }

    attributeChangedCallback(attr, oldValue, newValue) {
        if (oldValue !== newValue) {
            this[attr] = newValue;
            this.render();
        }
    }

    propertyChangeCallback(prop, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.setAttribute(prop, newValue);
            this.render();
        }
    }

    addEventListeners() {
        this.delegateEl = delegate(this);

        this.delegateEl.on('click', '.hoa-modal--overlay', e => {
            e.preventDefault();
            this.close();
        });
        this.delegateEl.on('click', '.hoa-modal--close-button', e => {
            e.preventDefault();
            this.close();
        });
    }

    update(data) {
        this.querySelector('hoa-form').update(data);
    }

    close() {
        this.classList.remove('is-visible');
        dispatchEvents({name:'hoaModal:close', el: this});
    }

    open() {
        this.classList.add('is-visible');
    }

    render() {
        if (!this.connected) { return ''; }
        return this.html`
            <div class="hoa-modal--overlay"></div>
            <section class="hoa-modal__wrapper">
                <i class="far fa-times-circle hoa-modal--close-button"></i>
                <hoa-form></hoa-form>
            </section>
        `;

    }
}

customElements.define('hoa-modal', HoaModal);