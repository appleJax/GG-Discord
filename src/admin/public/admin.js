let flash;
let fileInput;

window.onload = () => {
  flash = initFlash();
  fileInput = initFileInput();
  wireUp('new-deck-form');
};

function getSubmitBtn(formId) {
  const submitBtnClass = formId.replace('form', 'submit');
  return document.querySelector(`.${submitBtnClass}`);
}

function initFlash() {
  const flash = document.querySelector('.banner');
  return {
    show(type, msg) {
      flash.classList.add(`banner--${type}`);
      flash.innerHTML = msg;
      flash.classList.remove('hidden');
      setTimeout(this.hide, 1000 * 20);
    },

    hide() {
      flash.classList.add('hidden');
      flash.classList.remove('banner--error');
      flash.classList.remove('banner--success');
      flash.classList.remove('banner--warning');
    }
  }
}

function initFileInput() {
  const fileInput = document.getElementById('file-input');
  const newDeckForm = document.getElementById('new-deck-form');

  return {
    clear() {
      fileInput.value = null;
    },

    info() {
      const data = new FormData(newDeckForm)
      const config = {
        headers: {
          'content-type': 'multipart/form-data',
        },
      };

      return { data, config };
    }
  };
}

function makeDiv(className) {
  const div = document.createElement('div');
  div.classList.add(className);
  return div;
}

function NewSpinner(event) {
  const formId = event.target.id.replace('submit', 'form');
  const form = document.getElementById(formId);

  const shroud = makeDiv('shroud');
  const spinner = makeDiv('spinner');
  shroud.appendChild(spinner);

  return {
    show() {
      form.appendChild(shroud);
    },

    remove() {
      form.removeChild(shroud);
    }
  };
}

function pollStatus(taskStatus, spinner) {
  let poll;
  const handleStatus = () => {
    axios.get(taskStatus)
      .then(({ data }) => {
        if (data.status !== 'processing') {
          clearInterval(poll);
          spinner.remove();
          flash.show(data.status, data.message)
          fileInput.clear();
        }
      });
  };

  poll = setInterval(handleStatus, 2000);
}

function submitForm() {
  event.preventDefault();

  const spinner = NewSpinner(event);
  spinner.show();

  const { data, config } = fileInput.info();

  if (!data) return;

  axios.post('/deck/new', data, config)
    .then(({ data })=> {
      pollStatus(data.taskStatus, spinner);
    });
}

function wireUp(formId) {
  getSubmitBtn(formId).addEventListener(
    'click',
    submitForm,
  );
}
