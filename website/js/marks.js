// utility functions
function getCourseMarksRow(sr, roll_no, name, plos, marks) {
  // roll_no from marks, name from students, plo-[id] from course, marks from marks
  let marks_column = '';

  for (let i = 0; i < TOTAL_PLOS; i++) {
    const plo = plos[`PLO-${i+1}`];

    let marks_value = 0;

    if (marks[`PLO-${i+1}`]) {
      marks_value = marks[`PLO-${i+1}`];
    }
    
    if (plo != '') {
      // plo label and marks input
      marks_column += `
        <label class="btn btn-sm btn-secondary text-nowrap d-flex align-items-center" for="marks${roll_no}_plo-${i+1}">PLO-${i+1}</label>
        <input min="0" max="100" type="number" id="marks${roll_no}_plo-${i+1}" value="${marks_value}" class="form-control" onfocusout="updateCourseMarks('${roll_no}', ${i+1})">
      `;
    }
  }

  const row = `
    <tr id="marks${roll_no}">
      <td>${sr}</td>
      <td>${roll_no}</td>
      <td>${name}</td>
      <td>
        <div class="d-flex gap-2">
          ${marks_column}
        </div>
      </td>
    </tr>
  `;

  return row;
}

function buildCourseMarksTable() {
  // clear courses table
  $("#course_marks_table").html('');

  // add students to table
  for (let i = 0; i < CURRENT_STUDENTS.length; i++) {
    const student = CURRENT_STUDENTS[i];
    // add sr no, roll no, name, plos - marks
    // all are editable on change

    // get plos array
    const plos = {};
    for (let j = 0; j < TOTAL_PLOS; j++) {
      plos[`PLO-${j+1}`] = CURRENT_COURSE[`PLO-${j+1}`] ? 1 : '';
    }

    let marks = {};

    if (CURRENT_COURSE_MARKS[student.roll_no]) {
      marks = CURRENT_COURSE_MARKS[student.roll_no];
    }

    const row = getCourseMarksRow(i + 1, student.roll_no, student.name, plos, marks);

    $("#course_marks_table").append(row);
  }
}

// load marks function
async function loadMarks() {
  // get courses from database (courses.json)
  const courses = await getFile('courses');

  // save courses to global variable
  CURRENT_COURSES = courses;

  // reset select
  $("#select_course").html(`
    <option value="null" selected hidden>Select Course</option>
  `);

  // reset course marks table
  $("#course_marks_table").html('');

  // add courses to select
  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    $("#select_course").append(`<option value="${i}">${course.course_code} - ${course.course_title}</option>`);
  }

  // get marks from database (marks.json)
  const marks = await getFile('marks');

  // save marks to global variable
  CURRENT_MARKS = marks;

  // get students from database (students.json)
  const students = await getFile('students');

  // save students to global variable
  CURRENT_STUDENTS = students;
}

$("#select_course").change(function() {
  // get selected course
  const selected_course = $("#select_course").val();

  // get course from courses
  const course = CURRENT_COURSES[selected_course];

  // save course to global variable
  CURRENT_COURSE = course;

  // get marks from marks
  let marks = {};

  if (CURRENT_MARKS[course.course_code]) {
    marks = CURRENT_MARKS[course.course_code];
  }

  // save marks to global variable
  CURRENT_COURSE_MARKS = marks;

  // enable download and upload buttons
  $("#download_marks").prop('disabled', false);
  $("#upload_marks").prop('disabled', false);

  // build course marks table
  buildCourseMarksTable();
});

// update course marks function
async function updateCourseMarks(roll_no, plo) {
  // get marks
  const marks = parseInt($(`#marks${roll_no}_plo-${plo}`).val());

  // check if marks is valid
  if (marks < 0 || marks > 100 || isNaN(marks)) {
    glowRow(`marks${roll_no}`, 'warning');
    return;
  }

  let current_marks = 0;
  let is_new_entry = CURRENT_MARKS[CURRENT_COURSE.course_code] ? false : true;

  if (CURRENT_COURSE_MARKS[roll_no]) {
    if (CURRENT_COURSE_MARKS[roll_no][`PLO-${plo}`])
      current_marks = CURRENT_COURSE_MARKS[roll_no][`PLO-${plo}`];
  }

  // if marks are same as before, return
  if (marks == current_marks) return;

  // update marks in global variable
  try {
    CURRENT_COURSE_MARKS[roll_no][`PLO-${plo}`] = marks;
  } catch (error) {
    CURRENT_COURSE_MARKS[roll_no] = {};
    CURRENT_COURSE_MARKS[roll_no][`PLO-${plo}`] = marks;
  }

  // update marks in database
  if (is_new_entry) {
    await addEntry('marks', CURRENT_COURSE.course_code, CURRENT_COURSE_MARKS);
  } else {
    await updateEntry('marks', CURRENT_COURSE.course_code, CURRENT_COURSE_MARKS);
  }

  // update marks in global marks variable
  CURRENT_MARKS[CURRENT_COURSE.course_code] = CURRENT_COURSE_MARKS;

  glowRow(`marks${roll_no}`, 'success');
}

// download marks function
$("#download_marks").click(function() {
  // get marks data
  const marks = CURRENT_COURSE_MARKS;

  // create csv file
  let csv = 'roll_no,name';

  // make plo columns only that are in the current course
  for (let i = 0; i < TOTAL_PLOS; i++) {
    const plo = `PLO-${i+1}`;

    if (CURRENT_COURSE[plo]) {
      csv += `,${plo}`;
    }
  }

  csv += '\n';

  // add students to csv
  for (let i = 0; i < CURRENT_STUDENTS.length; i++) {
    const student = CURRENT_STUDENTS[i];
    const roll_no = student.roll_no;
    const name = student.name;

    csv += `${roll_no},${name}`;

    // add marks to csv
    for (let j = 0; j < TOTAL_PLOS; j++) {
      const plo = `PLO-${j+1}`;

      if (CURRENT_COURSE[plo]) {
        let marks_value = 0;

        // if marks are present in the CURRENT_MARKS variable, add them
        if (marks[roll_no]) {
          if (marks[roll_no][plo]) {
            marks_value = marks[roll_no][plo];
          }
        }

        csv += `,${marks_value}`;
      }
    }

    csv += '\n';
  }

  // download csv file
  downloadFile(`${CURRENT_COURSE.course_code} - ${CURRENT_COURSE.course_title}.csv`, csv);
});

// upload marks function
$("#upload_marks").click(function() {
  uploadFile(
    async function(file) {
      let marks = {};

      // parse csv file, it will return an array of objects with headers as keys
      try {
        marks = await parseCSV(file);
      } catch (error) {
        alert('Error uploading file. Please try again.');
        return;
      }

      // check if csv file has valid keys
      if (!marks[0].hasOwnProperty('roll_no')) {
        alert('Error uploading file. Please try again.');
        return;
      }

      // check plo keys
      for (let i = 0; i < TOTAL_PLOS; i++) {
        // if plo is present in the current course, check if it is present in the csv file
        const plo = `PLO-${i+1}`;

        if (CURRENT_COURSE[plo]) {
          if (!marks[0].hasOwnProperty(plo)) {
            alert('Error uploading file. Please try again.');
            return;
          }
        }
      }

      // check if csv file has valid values
      for (let i = 0; i < marks.length; i++) {
        const student = marks[i];

        if (student.roll_no == '') {
          marks.splice(i, 1);
          i--;
          continue;
        }
      }

      // check if marks are valid
      for (let i = 0; i < marks.length; i++) {
        const student = marks[i];

        for (let j = 0; j < TOTAL_PLOS; j++) {
          const plo = `PLO-${j+1}`;

          if (CURRENT_COURSE[plo]) {
            const marks_value = parseInt(student[plo]);

            if (marks_value < 0 || marks_value > 100 || isNaN(marks_value)) {
              alert('Error uploading file. Please try again.');
              return;
            }
          }
        }
      }

      // create marks object
      const marks_object = {};

      // add marks to marks object
      for (let i = 0; i < marks.length; i++) {
        const student = marks[i];
        const roll_no = student.roll_no;

        marks_object[roll_no] = {};

        for (let j = 0; j < TOTAL_PLOS; j++) {
          const plo = `PLO-${j+1}`;

          if (CURRENT_COURSE[plo]) {
            marks_object[roll_no][plo] = parseInt(student[plo]);
          }
        }
      }

      let is_new_entry = CURRENT_MARKS[CURRENT_COURSE.course_code] ? false : true;

      // update marks in global variable
      CURRENT_COURSE_MARKS = marks_object;

      // update marks in global marks variable
      CURRENT_MARKS[CURRENT_COURSE.course_code] = CURRENT_COURSE_MARKS;

      // build course marks table
      buildCourseMarksTable();

      // update marks in database
      if (is_new_entry) {
        await addEntry('marks', CURRENT_COURSE.course_code, CURRENT_COURSE_MARKS);
      } else {
        await updateEntry('marks', CURRENT_COURSE.course_code, CURRENT_COURSE_MARKS);
      }
    }
  )
});