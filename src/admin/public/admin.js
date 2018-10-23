window.onload = () => {
  setTimeout(hideFlash, 7000);
  addSpinner('new-deck-form');
};

function hideFlash() {
  const flash = document.querySelector('.banner-container');
  flash.classList.add('hidden');
}

function addSpinner(formId) {
  getSubmitBtns(formId).forEach(submitBtn => submitBtn.addEventListener(
    'click',
    showSpinner,
  ));
}

function showSpinner(event) {
  const formId = event.target.id.replace('submit', 'form');
  const form = document.getElementById(formId);

  const shroud = makeDiv('shroud');
  const spinner = makeDiv('spinner');

  shroud.appendChild(spinner);
  form.appendChild(shroud);
}

function getSubmitBtns(formId) {
  const submitBtnClass = formId.replace('form', 'submit');
  return document.querySelectorAll(`.${submitBtnClass}`);
}

function makeDiv(className) {
  const div = document.createElement('div');
  div.classList.add(className);
  return div;
}
