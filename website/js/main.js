// default page
let CURRENT_PAGE = '';

const DELETE_ICON = `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
  </svg>
`;

const CHECK_ICON = `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle" viewBox="0 0 16 16">
    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
    <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05"/>
  </svg>
`;

// global variables
let CURRENT_STUDENTS = [];
let CURRENT_COURSES = [];
let CURRENT_MARKS = [];
let CURRENT_COURSE = {};
let CURRENT_COURSE_MARKS = {};
let CURRENT_SEMESTERS = {};
const TOTAL_SEMESTERS = 8;
const TOTAL_PLOS = 12;

// update page
async function updatePage() {
  // hide all pages
  $(".page").addClass("d-none");

  // make all nav buttons inactive
  $(".nav_btn").removeClass('active_nav');

  // make loading visible
  $("#loading").removeClass("d-none");

  switch (CURRENT_PAGE) {
    case 'students':
      await loadStudents();
      break;
    case 'courses':
      await loadCourses();
      break;
    case 'marks':
      await loadMarks();
      break;
    case 'semesters':
      await loadSemesters();
      break;
    default:
      CURRENT_PAGE = 'students';
      await loadStudents();
      break;
  }

  // make current nav button active
  $(`.nav_btn[name=${CURRENT_PAGE}]`).addClass('active_nav');

  // hide loading
  $("#loading").addClass("d-none");
  
  // show new page
  await $(`#${CURRENT_PAGE}`).removeClass("d-none");
}

async function changePage(page) {
  if (page == CURRENT_PAGE) return;

  CURRENT_PAGE = page;

  await updatePage();
}

// UTILITY FUNCTIONS

// get file from database
async function getFile(file) {
  // get file from database
  const response = await fetch(`database/${file}`);

  // return file
  return await response.json();
}

// delete entry from database
async function deleteEntry(file, id) {
  // delete entry from database
  const response = await fetch(`database/${file}/${id}`, {
    method: 'DELETE'
  });

  // return response
  return await response.json();
}

// update entry in database
async function updateEntry(file, id, data) {
  // update entry in database
  const response = await fetch(`database/${file}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  // return response
  return await response.json();
}

// add entry to a file in database
async function addEntry(file, id, data) {
  // add entry to a file in database
  const response = await fetch(`database/${file}/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  // return response
  return await response.json();
}

// save file to database
async function saveFile(file, data) {
  // save file to database
  const response = await fetch(`database/${file}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  // update page
  updatePage();

  // return response
  return await response.json();
}

// toast function
function toast(message, type) {
  // createa a bootstrap toast with success or danger
  
  // generate random toast id
  const toast_id = Math.floor(Math.random() * 1000000);

  const toast = `
    <div class="toast align-items-center text-bg-${type} border-0" data-bs-delay="800" id="t${toast_id}">
      <div class="d-flex">
        <div class="toast-body">
          <span class="fs-4">${message}</span>
        </div>
      </div>
    </div>
  `;

  // add toast to toast div
  $("#toast_wrapper").append(toast);

  // show toast
  $(`#t${toast_id}`).toast('show');
}

// glow row function
function glowRow(id, type) {
  // rgba colors for success and danger
  const colors = {
    success: 'rgba(40, 167, 69, 0.3)',
    danger: 'rgba(220, 53, 69, 0.3)',
    warning: 'rgba(255, 193, 7, 0.3)'
  };

  // animate row background color jquery
  $(`#${id}`).find('td').css('transition', 'background-color 0.5s ease-in-out')
  $(`#${id}`).find('td').css('background-color', colors[type]);
  setTimeout(function() {
    $(`#${id}`).find('td').css('background-color', '');
  }, 800);
}

// download file function
function downloadFile(filename, text) {
  // create a new element
  const element = document.createElement('a');

  // set href to file
  element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);

  // set download attribute to filename
  element.setAttribute('download', filename);

  // hide element
  element.style.display = 'none';

  // add element to body
  document.body.appendChild(element);

  // click element
  element.click();

  // remove element from body
  document.body.removeChild(element);
}

// upload file function
// create a file input element and click it
function uploadFile(callback) {
  // create a new element
  const element = document.createElement('input');

  // set type to file
  element.setAttribute('type', 'file');

  // set event listener
  element.onchange = function() {
    // get file
    const file = element.files[0];

    // call callback function
    callback(file);
  };

  // hide element
  element.style.display = 'none';

  // add element to body
  document.body.appendChild(element);

  // click element
  element.click();

  // remove element from body
  document.body.removeChild(element);
}

// parse csv file function
function parseCSV(file) {
  // create a new file reader
  const reader = new FileReader();

  // read file
  reader.readAsText(file);

  // return promise
  return new Promise((resolve, reject) => {
    // resolve promise on load
    reader.onload = function() {
      // create a json object with csv data [{keys: values}, {keys: values}]
      // first line is header
      // rest lines are data
      
      // get csv data
      const csv = reader.result;

      // split csv data into lines
      const lines = csv.split('\n');

      // get header
      const header = lines[0].split(',');

      // remove whitespace and other characters from header
      for (let i = 0; i < header.length; i++) {
        header[i] = header[i].trim();
        header[i] = header[i].replace(/['"]+/g, '');
        header[i] = header[i].replace(/\r?\n|\r/g, '');
      }

      // create json object
      const json = [];

      // loop through lines
      for (let i = 1; i < lines.length; i++) {
        // split line into values
        const values = lines[i].split(',');
        
        // create object
        const obj = {};

        // loop through values
        for (let j = 0; j < values.length; j++) {
          // remove whitespace
          values[j] = values[j].trim();
          // remove quotes
          values[j] = values[j].replace(/['"]+/g, '');
          // remove newlines
          values[j] = values[j].replace(/\r?\n|\r/g, '');

          // add value to object
          obj[header[j]] = values[j];
        }

        // add object to json
        json.push(obj);
      }

      // resolve promise
      resolve(json);
    };

    // reject promise on error
    reader.onerror = function() {
      reject(reader.error);
    };
  });
}

// on page ready
$(document).ready(function() {
  // update page on nav button click
  $(".nav_btn").click(function() {
    let page = $(this).attr('name');
    
    changePage(page);
  });

  // first update
  updatePage();
});
