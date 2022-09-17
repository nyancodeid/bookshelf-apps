const STORAGE_KEY = "bookshelf-apps";

const books = [];
const notyf = new Notyf({
  position: {
    x: 'left',
    y: 'bottom',
  },
});

function addBook () {
  const book = generateBook({
    title: getElementValue('#book-title'),
    author: getElementValue('#book-author'),
    year: getElementValue('#book-year'),
    isCompleted: getElementValue('#book-is-completed', true)
  });

  books.push(book);

  document.dispatchEvent(renderEvent);
  saveData();
}
function editBook (bookId) {
  const book = findBook(bookId);

  const editedBook = {
    title: getElementValue('#book-title'),
    author: getElementValue('#book-author'),
    year: getElementValue('#book-year'),
    isCompleted: getElementValue('#book-is-completed', true)
  };

  for (const key in editedBook) {
    book[key] = editedBook[key];
  }

  document.querySelector('.book-submit-content-title').innerText = "Masukkan Buku Baru";

  const submitButton = document.querySelector('#book-submit-button');
  submitButton.classList.remove('hidden');
  submitButton.setAttribute('type', 'submit');

  const editButton = document.querySelector('#book-edit-button');
  editButton.classList.add('hidden');
  editButton.setAttribute('type', 'button');
  editButton.removeAttribute('data-book');

  document.dispatchEvent(renderEvent);
  saveData();
}
function showEditBook (bookId) {
  const book = findBook(bookId);

  if (!book) return;

  document.querySelector('#book-title').value = book.title;
  document.querySelector('#book-author').value = book.author;
  document.querySelector('#book-year').value = book.year;

  document.querySelector('#book-is-completed').checked = book.isCompleted;

  document.querySelector('.book-submit-content-title').innerText = "Edit Buku";

  const submitButton = document.querySelector('#book-submit-button');
  submitButton.classList.add('hidden');
  submitButton.setAttribute('type', 'button');

  const editButton = document.querySelector('#book-edit-button');
  editButton.classList.remove('hidden');
  editButton.setAttribute('type', 'submit');
  editButton.setAttribute('data-book', book.id);
}
function addBookToCompleted (bookId) {
  const book = findBook(bookId);
 
  if (!book) return;
  book.isCompleted = true;

  document.dispatchEvent(renderEvent);
  saveData();
}
function undoBookFromCompleted(bookId) {
  const book = findBook(bookId);

  if (book == null) return;
 
  book.isCompleted = false;
  document.dispatchEvent(renderEvent);
  saveData();
}
function removeBookFromCompleted(bookId) {
  const book = findBookIndex(bookId);
 
  if (book === -1) return;
 
  books.splice(book, 1);
  document.dispatchEvent(renderEvent);
  saveData();
}

function generateId () {
  return +new Date();
}
function generateBook (book) {
  return {
    id: generateId(),
    ...book,
  }
}
function findBook(bookId) {
  return books.find((book) => book.id == bookId) || null;
}
function findBookIndex(bookId) {
  for (const index in books) {
    if (books[index].id == bookId) return index;
  }

  return -1;
}
function getElementValue (selector, isBoolean = false) {
  if (isBoolean) return document.querySelector(selector).checked;

  return document.querySelector(selector).value;
}
function isStorageExist () {
  if (typeof (Storage) === undefined) {
    notyf.error('Browser kamu tidak mendukung local storage');
    return false;
  }
  return true;
}
function renderBookElement (book) {
  const actionButton = (!book.isCompleted) ?
    `<button data-book="${book.id}" title="Tandai sebagai selesai dibaca" class="action-button mark-as-completed"></button>` : 
    `<button data-book="${book.id}" title="Tandai sebagai belum selesai dibaca" class="action-button mark-as-uncompleted"></button>`;

  return String.raw`
    <article class="book-card">
      <div class="book-card--content">
        <h4 class="book-content--title">${book.title}</h4>
        <span class="book-content--subtitle">${book.author} — ${book.year}</span>
      </div>
      <div class="book-card--action">
        ${actionButton}
        <button data-book="${book.id}" title="Edit Buku" class="action-button edit"></button>
        <button data-book="${book.id}" title="Hapus Buku" class="action-button remove"></button>
      </div>
    </article>`;
}
function actionButtonEventListener () {
  const buttons = document.querySelectorAll('.action-button');

  for (const button of buttons) {
    button.addEventListener('click', function () {
      const bookId = button.dataset.book;

      if (button.classList.contains('mark-as-completed')) {
        addBookToCompleted(bookId);
      } else if (button.classList.contains('mark-as-uncompleted')) {
        undoBookFromCompleted(bookId);
      } else if (button.classList.contains('remove')) {
        const removeConfirm = confirm(`Apakah anda yakin akan menghapus Buku ini?`);

        if (removeConfirm) removeBookFromCompleted(bookId);
      } else if (button.classList.contains('edit')) {
        showEditBook(bookId);
      } 
    });
  }
}

function saveData () {
  if (!isStorageExist()) return;

  const parsed = JSON.stringify(books);
  localStorage.setItem(STORAGE_KEY, parsed);

  document.dispatchEvent(savedEvent);
}
function loadDataFromStorage() {
  const serializedData = localStorage.getItem(STORAGE_KEY);

  if (serializedData !== null) {
    const data = JSON.parse(serializedData);

    for (const book of data) {
      books.push(book);
    }
  }
 
  document.dispatchEvent(renderEvent);
}

const [ renderEvent, renderEventListener ] = [
  new Event('on:render'), function () {
    const search = getElementValue('.book-search-input');

    const completedBookList = document.querySelector('#completed-book-list');
    const uncompletedBookList = document.querySelector('#uncompleted-book-list');

    completedBookList.innerHTML = "";
    uncompletedBookList.innerHTML = "";

    const filteredBook = books
      .filter((book) => {
        if (search === "") return true;
        
        return (
          book.title.toLowerCase().includes(search.toLowerCase()) || 
          book.author.toLowerCase().includes(search.toLowerCase())
        );
      });

    const completedBooks = filteredBook.filter(book => book.isCompleted);
    const uncompletedBooks = filteredBook.filter(book => !book.isCompleted);

    document.querySelector('.completed-book-count').innerHTML = `${completedBooks.length} item`;
    document.querySelector('.uncompleted-book-count').innerHTML = `${uncompletedBooks.length} item`;

    completedBookList.innerHTML = completedBooks.map(renderBookElement).join('');
    uncompletedBookList.innerHTML = uncompletedBooks.map(renderBookElement).join('');

    if (completedBooks.length == 0) {
      completedBookList.innerHTML = `<div class="book-card book-card--empty">Opps! Daftar Buku Kosong</div>`;
    }
    if (uncompletedBooks.length == 0) {
      uncompletedBookList.innerHTML = `<div class="book-card book-card--empty">Opps! Daftar Buku Kosong</div>`;
    }

    actionButtonEventListener();
  }
];
const [ savedEvent, savedEventListener ] = [
  new Event('on:saved'), function () {
    notyf.success(`Data Berhasil Disimpan.`);
  }
];

document.addEventListener(renderEvent.type, renderEventListener);
document.addEventListener(savedEvent.type, savedEventListener);

document.addEventListener('DOMContentLoaded', () => {
  const inputSearch = document.querySelector('.book-search-input');
  const formSubmit = document.querySelector('.book-submit-content');

  if (isStorageExist()) loadDataFromStorage();

  formSubmit.addEventListener('submit', (event) => {
    event.preventDefault();

    if (event.submitter.id == "book-edit-button") {
      const bookId = event.submitter.dataset.book;
      editBook(bookId);
      notyf.success(`Buku berhasil diubah`);
    } else {
      addBook();
      notyf.success(`Buku berhasil ditambahkan`);
    }

    formSubmit.reset();
  });
  inputSearch.addEventListener('input', function () {
    document.dispatchEvent(renderEvent);
  });
});