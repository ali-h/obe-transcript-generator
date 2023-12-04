// utility functions
function getStudentRow(id, roll_no, name) {
  const row = `
    <tr id="student${id}">
      <td>${id + 1}</td>
      <td><input type="text" name="roll_no" value="${roll_no}" class="form-control" onfocusout="updateStudent(${id})"></td>
      <td><input type="text" name="name" value="${name}" class="form-control" onfocusout="updateStudent(${id})"></td>
      <td align="right">
        <button class="btn btn-primary" onclick="generateTranscript(${id})">Generate Transcript</button>
        <button class="btn btn-danger" onclick="deleteStudent(${id})">${DELETE_ICON}</button>
      </td>
    </tr>
  `;

  return row;
}

function buildStudentTable() {
  // clear students table
  $("#students_table").html('');

  // add students to table
  for (let i = 0; i < CURRENT_STUDENTS.length; i++) {
    const student = CURRENT_STUDENTS[i];
    // add sr no, roll no, name, delete button, generate transcript button
    // all are editable on change

    const row = getStudentRow(i, student.roll_no, student.name);

    $("#students_table").append(row);
  }

  // add new student button
  $("#students_table").append(`
    <tr id="add_new_student">
      <td colspan="4" align="right">
        <button class="btn btn-success" onclick="addStudent()">Add New Student</button>
      </td>
    </tr>
  `);
}

// load students function
async function loadStudents() {
  // get students from database (students.json)
  const students = await getFile('students');

  // save students to global variable
  CURRENT_STUDENTS = students;

  // build students table
  buildStudentTable();
}

// add student function
async function addStudent() {
  // random new student row id
  const new_id = Math.floor(Math.random() * 1000000);

  // add a new row to students table
  const row = `
    <tr id="newStudent${new_id}" class="new_row">
      <td></td>
      <td><input type="text" name="roll_no" class="form-control"></td>
      <td><input type="text" name="name" class="form-control"></td>
      <td align="right">
        <button class="btn btn-success" onclick="saveStudent('${new_id}')">${CHECK_ICON}</button>
        <button class="btn btn-danger" onclick="cancelStudent('${new_id}')">${DELETE_ICON}</button>
      </td>
    </tr>
  `;

  // add row to table
  $("#add_new_student").before(row);

  // focus on roll no input
  $(`#newStudent${new_id} input[name=roll_no]`).focus();
}

// save student function
async function saveStudent(id) {
  // get student data from row
  const roll_no = $(`#newStudent${id} input[name=roll_no]`).val();
  const name = $(`#newStudent${id} input[name=name]`).val();

  // make sure roll no and name are not empty
  if (roll_no == '' || name == '') {
    glowRow(`newStudent${id}`, 'warning');
    return;
  }

  const new_id = CURRENT_STUDENTS.length;

  // add student to current students
  CURRENT_STUDENTS.push({
    roll_no,
    name
  });

  // add student to database
  await addEntry('students', new_id, {
    roll_no,
    name
  });

  // remove new row
  $(`#newStudent${id}`).remove();

  // add student to table
  const row = getStudentRow(new_id, roll_no, name);

  $("#add_new_student").before(row);

  glowRow(`student${new_id}`, 'success');
}

// cancel student function
async function cancelStudent(id) {
  // remove new row
  $(`#newStudent${id}`).remove();
}

// delete student function
async function deleteStudent(id) {
  // delete student from current students
  CURRENT_STUDENTS.splice(id, 1);

  glowRow(id, 'danger');

  // delete student from database
  await deleteEntry('students', id);

  // delete student from table
  $(`#student${id}`).remove();

  // update students table
  buildStudentTable();
}

// update student function
async function updateStudent(id) {
  // get student data from row
  const roll_no = $(`#student${id} input[name=roll_no]`).val();
  const name = $(`#student${id} input[name=name]`).val();

  // make sure roll no and name are not empty
  if (roll_no == '' || name == '') {
    glowRow(`student${id}`, 'warning');
    return;
  }
  
  const current_data = CURRENT_STUDENTS[id];

  // check if data has changed
  if (current_data.roll_no == roll_no && current_data.name == name) {
    return;
  }

  // update student in current students
  CURRENT_STUDENTS[id] = {
    roll_no,
    name
  };

  // update student in database
  await updateEntry('students', id, {
    roll_no,
    name
  });

  glowRow(`student${id}`, 'success');
}

// download students function
$("#download_students").click(function() {
  // get students data
  const students = CURRENT_STUDENTS;

  // create csv file
  let csv = 'roll_no,name\n';

  for (let i = 0; i < students.length; i++) {
    const student = students[i];

    csv += `${student.roll_no},${student.name}\n`;
  }

  // download csv file
  downloadFile('students.csv', csv);
});

// upload students function
$("#upload_students").click(function() {
  uploadFile(
    async function(file) {
      let students = [];
      
      // parse csv file, it will return an array of objects with headers as keys
      try {
        students = await parseCSV(file);
      } catch (error) {
        alert('Error uploading file. Please try again.');
        return;
      }

      // check if csv file has valid keys
      if (!students[0].hasOwnProperty('roll_no') || !students[0].hasOwnProperty('name')) {
        alert('Error uploading file. Please try again.');
        return;
      }

      // check if csv file has valid values
      for (let i = 0; i < students.length; i++) {
        const student = students[i];

        // if roll no or name are empty, delete student
        if (student.roll_no == '' || student.name == '') {
          students.splice(i, 1);
          i--;
          continue;
        }
      }

      // save students to global variable
      CURRENT_STUDENTS = students;

      // build students table
      buildStudentTable();

      // save students to database
      await saveFile('students', students);
    }
  );
});

// generate transcript function
function generateTranscript(id) {
  // open transcript page with id in new tab
  window.open(`transcript/${id}`, '_blank');
}
