import {bind} from 'hyperhtml';
import delegate from 'dom-delegate';
import {getMapSvg} from '../../common/map';
import { getHouseById, getHouseByAddress, updateHouse } from './hoa-map-app-model';
import '../hoa-search/hoa-search';
import '../hoa-modal/hoa-modal';
import './hoa-map-app.css';


//http://localhost:4000/graphql
class HoaMapApp extends HTMLElement {
    // static get observedAttributes() { return ['test-type']; }

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

    getLot(e) {
        let target = e.target;
        while (!target.getAttribute('data-lot')) {
            target = target.parentNode;
        }
        return target.getAttribute('data-lot');
    }

    openModal(data) {
        const hoaModalEl = this.querySelector('hoa-modal');
        hoaModalEl.update(data);
        hoaModalEl.open();
    }

    addEventListeners() {
        this.delegateEl = delegate(this);

        this.delegateEl.on('click', '.house', e => {
            e.preventDefault();
            // get lot number
            const lot = this.getLot(e);
            // look up house data
            getHouseById(lot)
                .then(response => {
                    // display data
                    this.openModal(response.data.house);
                });
        });

        this.delegateEl.on('hoaSearch:submit', 'hoa-search', e => {
            const value = e.detail;
            if (value.length === 1 || value.length === 2) {
                getHouseById(value)
                    .then(response => {
                        // display data
                        this.openModal(response.data.house);
                    })
                    .catch(err => {
                        this.openModal({ errorMsg: 'No record.' })
                        console.log(err);
                    });
            }
            else if (value.length >= 4) {
                getHouseByAddress(value)
                    .then(response => {
                        // display data
                        this.openModal(response.data.address);
                    })
                    .catch(err => {
                        this.openModal({ errorMsg: 'No record.' })
                        console.log(err);
                    });
            }
        });
        this.delegateEl.on('hoaForm:submit', 'hoa-modal', e => {
            const value = e.detail;
            updateHouse(value)
                .then(response => {
                    // display data
                    this.openModal(response.data.updateHouse);
                })
                .catch(err => {
                    this.openModal({ errorMsg: 'No record.' })
                    console.log(err);
                });
        });
        this.delegateEl.on('hoaModal:close', 'hoa-modal', () => {
            this.querySelector('hoa-search').clear();
        });
    }

    render() {
        if (!this.connected) { return ''; }
        return this.html`
            <hoa-modal></hoa-modal>
            <hoa-search></hoa-search>
            <h1>Old Friendship Place HOA - MAP</h1>

            <section class="hoa-map-container">
                <svg
                width="900px"
                height="100%"
                viewBox="0 0 1200 690"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                xml:space="preserve"
                xmlns:serif="http://www.serif.com/"
                style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;"
                >${getMapSvg()}</svg>
            </section>
        `;
    }
}

customElements.define('hoa-map-app', HoaMapApp);
