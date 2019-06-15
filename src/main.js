import './components/hoa-map-app/hoa-map-app.js';

const REDIRECT_URI = './index.html';
const STATE = '';
const SCOPES = '';
const CLIENT_ID = '1234';

AppleID.auth.init({
    clientId: CLIENT_ID,
    scope: SCOPES,
    redirectURI: REDIRECT_URI,
    state: STATE
});

const buttonContainerEl = document.querySelector('.sign-in-container');
const buttonElement = document.getElementById('sign-in-with-apple-button');
buttonElement.addEventListener('click', () => {
    AppleID.auth.signIn();
    buttonContainerEl.classList.remove('active');
});

setTimeout(() => {
    buttonContainerEl.classList.add('active');
}, 1000);

// if ('serviceWorker' in navigator) {
//     window.addEventListener('load', () => {
//         navigator.serviceWorker.register('./service-worker.js')
//             .then(registration => {
//                 console.log('Service worker registered. ', registration);
//             },
//                 err => {
//                     console.log('ServiceWorker registraion failed: ', err);
//                 });
//     });
// }