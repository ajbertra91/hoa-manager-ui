import { bind, wire } from 'hyperhtml';
import delegate from 'dom-delegate';
import {dispatchEvents} from '../../common/utilities';
import './hoa-search.css';

class HoaSearch extends HTMLElement {
    // static get observedAttributes() { return ['nothing']; }

    connectedCallback() {
        this.connected = true;
        this.html = bind(this);
        this.state = {
            isActive: false
        }
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

        this.delegateEl.on('focusout', '#hoa-search-input' , e => {
            const value = e.target.value;
            if (value) {
                this.state = { ...this.state, isActive: true }
                this.render();
            }
        })
    }

    submitHandler(e) {
        e.preventDefault();
        const value = this.querySelector('#hoa-search-input').value;
        console.log('value: ', value);
        // dispatch event to the hoa-map-app
        // listen to in the app and submit the graphQL query
        //TODO submit graphQL request for entered data.
        dispatchEvents({
            name: 'hoaSearch:submit',
            el: this,
            value
        });
    }

    clear() {
        this.querySelector('input').value = '';
        this.render();
    }

    render() {
        if (!this.connected) { return ''; }
        return this.html`
            <form onsubmit=${this.submitHandler.bind(this)}>
                <section id="hoa-search-input-container" class=${this.state.isActive ? 'is-active' : ''}>
                    <input type="text" id="hoa-search-input" placeholder="1234 Fellowship Drive" />
                    <label for="hoa-search-input">Search</label>
                    <section class="hoa-search--action">
                        <button type="submit">GO</button>
                        <span class="spinner spinner-double-section-out"></span>
                    </section>
                </section>
            </form>
        `;

    }
}

customElements.define('hoa-search', HoaSearch);