import {bind, wire} from 'hyperhtml';
import delegate from 'dom-delegate';
import './hoa-form.css';
import { dispatchEvents } from '../../common/utilities';

class HoaForm extends HTMLElement {
    // static get observedAttributes() { return ['nothing']; }

    connectedCallback() {
        this.connected = true;
        this.html = bind(this);
        this.editMode = false;
        this.state = {
            lot: "27",
            address: "5107 Fellowship Dr.",
            contactInfo: {
                mobile: "",
                phone: "860-384-3921",
                email: "ajbertra91@gmail.com"
            },
            owners: [
                {
                    firstName: "Adam",
                    lastName: "Bertrand"
                },
                {
                    firstName: "Raeyoung",
                    lastName: "Park"
                }
            ],
            hoaFeePaid: [
                {
                    year: 2019,
                    paid: true,
                    value: 600,
                    lateFee: 0
                }
            ]
        }
        this.render();
        // this.addEventListeners();
    }

    disconnectedCallback() {
        // this.delegateEl.off();
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

        // this.delegateEl.on('click', '.hoa-modal--overlay', e => {
        //     e.preventDefault();
        //     this.close();
        // });
    }

    update(data) {
        this.state = data;
        this.editMode = false;
        this.render();
    }

    submitHandler() {
        this.editMode = false;
        // dispatchEvents({ name: 'hoaForm:submit', el: this, value: this.state})
        this.render();
    }

    onclickHandler(e) {
        console.log(e)
    }

    editHandler() {
        this.editMode = true;
        this.render();
    }

    firstNameChangeHandler(e) {
        this.state.owners[e.target.dataset.index].firstName = e.target.value;
    }

    lastNameChangeHandler(e) {
        this.state.owners[e.target.dataset.index].lastName = e.target.value;
    }

    feesPaidChangeHandler(e) {
        this.state.hoaFeePaid.paid = e.target.value === 'true' ? true : false;
        this.state.hoaFeePaid.year = new Date().getFullYear();
        console.log('this.state.hoaFeePaid.paid', this.state.hoaFeePaid.paid);
        console.log('this.state.hoaFeePaid.year', this.state.hoaFeePaid.year);
    }

    getStaticInfo() {
        return wire()`
            <div class="hoa-form__row hoa-form__lot">
                <span class="hoa-form__label">Lot: </span>
                <span class="hoa-form__value">${this.state.lot}</span>
            </div>

            <div class="hoa-form__row hoa-form__address">
                <span class="hoa-form__label">Address: </span>
                <span class="hoa-form__value">${this.state.address}</span>
            </div>
        `;
    }

    getOwnerInfo() {
        return this.state.owners.map(owner => {
            return wire(owner)`
                <div class="hoa-form__row hoa-form__name">
                    <span class="hoa-form__label">Owner: </span>
                    <span class="hoa-form__value">${owner.firstName} ${owner.lastName}</span>
                </div>
            `;
        });
    }

    getContactInfo() {
        return wire(this.state.contactInfo)`
            <div class="hoa-form__row hoa-form__contact-info">
                <span class="hoa-form__label">Phone: </span>
                <span class="hoa-form__value">${this.state.contactInfo.phone}</span>
            </div>
            <div class="hoa-form__row hoa-form__contact-info">
                <span class="hoa-form__label">Mobile: </span>
                <span class="hoa-form__value">${this.state.contactInfo.mobile}</span>
            </div>
            <div class="hoa-form__row hoa-form__contact-info">
                <span class="hoa-form__label">Email: </span>
                <span class="hoa-form__value">${this.state.contactInfo.email}</span>
            </div>
        `;
    }

    getHoaFeesInfo() {
        return this.state.hoaFeePaid.map(hoaFee => {
            return wire(hoaFee)`
                <div class="hoa-form__row hoa-form__hoa-fee">
                    <span class="hoa-form__label">${hoaFee.year} Fees: </span>
                    <span class="hoa-form__value">${hoaFee.paid ? 'Paid' : 'Not Paid'}</span>
                </div>
            `;
        });
    }

    getDisplayContent() {
        return wire()`
            <section class="hoa-form hoa-form--display-mode">
                ${this.getStaticInfo()}
                ${this.getOwnerInfo()}
                ${this.getContactInfo()}
                ${this.getHoaFeesInfo()}

                </section>
                `
                // <div class="hoa-form__row hoa-form__action">
                //     <button type="button" onclick=${this.editHandler.bind(this)}>Edit</button>
                // </div>
    }

    getEditFormContent() {
        return wire()`
            ${this.getStaticInfo()}

            <form class="hoa-form hoa-form--edit-mode" onsubmit=${this.submitHandler.bind(this)}>
                ${this.state.owners.map((owner,idx) => {
                    return wire(owner)`
                        <div class="hoa-form__row hoa-form__name">
                            <label for="firstName">First Name: </label>
                            <input
                                id="firstName"
                                type="text"
                                value=${owner.firstName}
                                data-index=${idx}
                                placeholder="Jane"
                                onchange=${this.firstNameChangeHandler.bind(this)}
                            />
                        </div>
                        <div class="hoa-form__row hoa-form__name">
                            <label for="firstName">Last Name: </label>
                            <input
                                id="firstName"
                                type="text"
                                value=${owner.lastName}
                                data-index=${idx}
                                placeholder="Doe"
                                onchange=${this.lastNameChangeHandler.bind(this)}
                            />
                        </div>
                    `;
                })}
                <div class="hoa-form__row hoa-form__fees">
                    <div class="hoa-form__fees-title">Fees Paid?</div>
                    <label for="fees-paid-yes">Yes: </label>
                    <input id="fees-paid-yes" name="fees-paid-radio" type="radio" value="true" checked=${this.state.hoaFeePaid.paid === true} onchange=${this.feesPaidChangeHandler.bind(this)}/>
                    <label for="fees-paid-yes">No: </label>
                    <input id="fees-paid-no" name="fees-paid-radio" type="radio" value="false" checked=${this.state.hoaFeePaid.paid === false} onchange=${this.feesPaidChangeHandler.bind(this)}/>
                </div>
                <div class="hoa-form__row hoa-form__action">
                    <button type="submit">Save</button>
                </div>
            </form>
        `;
    }

    getErrorContent() {
        return wire()`
            <p class="error-msg">${this.state.errorMsg}</p>
        `;
    }

    render() {
        if (!this.connected) { return ''; }
        if (!this.state.errorMsg) {
            return this.html`
                ${this.editMode
                    ? this.getEditFormContent()
                    : this.getDisplayContent()
                }
            `;
        } else {
            return this.html`
                ${this.getErrorContent()}
            `;
        }

    }
}

customElements.define('hoa-form', HoaForm);