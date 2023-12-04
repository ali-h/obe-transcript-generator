// utilitiy functions
function getSemesterRow(sr, course_code, course_title) {
  const row = `
    <tr id="semesters_${course_code}">
      <td>${sr}</td>
      <td>${course_code}</td>
      <td>${course_title}</td>
      <td align="right">
        <button class="btn btn-danger" onclick="deleteSemesterCourse('${course_code}')">
          ${DELETE_ICON}
        </button>
      </td>
    </tr>
  `;

  return row;
}

// load semesters page function
async function loadSemesters() {
  // get semesters from database (semesters.json)
  const semesters = await getFile('semesters');

  // get courses from database (courses.json)
  const courses = await getFile('courses');

  // save courses to global variable
  CURRENT_COURSES = courses;

  // save semesters to global variable
  CURRENT_SEMESTERS = semesters;

  // build semesters table
  buildSemestersTable();
}

// build semester table function
function buildSemestersTable() {
  // clear semesters tables div
  $("#semesters_tables").html('');

  // loop through each semester in semesters and add a table
  const semesters = CURRENT_SEMESTERS;

  for (let i = 0; i < TOTAL_SEMESTERS; i++) {
    const semester = semesters[i];

    // add semester table
    $("#semesters_tables").append(`
      <div>
        <h4>Semester ${i+1}</h4>
        <table class="table table-striped table-hover">
          <thead>
            <tr>
              <th>Sr.</th>
              <th>Course Code</th>
              <th>Course Title</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody id="semester_${i+1}_table">
          </tbody>
        </table>
      </div>
    `);

    // add course code, course title, and delete button
    // semester is an array of course codes
    for (let k = 0; k < semester.length; k++) {
      // get course title from courses
      const course = CURRENT_COURSES.find(course => course.course_code == semester[k]);
      
      // if course not found, skip
      if (!course) continue;
      
      const course_code = course.course_code;
      const course_title = course.course_title;

      const row = getSemesterRow(k+1, course_code, course_title);

      $(`#semester_${i+1}_table`).append(row);
    }

    // add add course to semester select
    $(`#semester_${i+1}_table`).append(`
      <tr>
        <td colspan="4" align="right">
          <div class="d-flex gap-3">
            <select class="form-control semester_select" id="semester_${i+1}_select">
              <option value="null" selected hidden>Select Course</option>
            </select>
            <button class="btn btn-success text-nowrap" onclick="addCourseToSemester(${i+1})">Add Course</button>
          </div>
        </td>
      </tr>
    `);

    reloadSemesterSelects();
  }
}

// reload semester selects function
function reloadSemesterSelects() {
  // get all semester selects
  const semester_selects = $(".semester_select");

  // clear all semester selects
  $(semester_selects).html('<option value="null" selected hidden>Select Course</option>');

  // loop through each course in courses and check if it is already in semester
  // if not, add it to semester select
  for (let i = 0; i < CURRENT_COURSES.length; i++) {
    const course = CURRENT_COURSES[i];

    // check if this course is already in semester
    let found = false;
    for (let j = 0; j < TOTAL_SEMESTERS; j++) {
      const semester = CURRENT_SEMESTERS[j];
      if (semester.includes(course.course_code)) {
        found = true;
        break;
      }
    }

    // if not found, add it to semester select
    if (!found) {
      $(semester_selects).append(`<option value="${course.course_code}">${course.course_code} - ${course.course_title}</option>`);
    }
  }
}

// add course to semester function
async function addCourseToSemester(semester) {
  // get selected course code
  const course_code = $(`#semester_${semester}_select`).val();

  // get course title from courses
  const course = CURRENT_COURSES.find(course => course.course_code == course_code);

  // if course not found, skip
  if (!course) return;

  const course_title = course.course_title;

  // add course to semester
  CURRENT_SEMESTERS[semester-1].push(course_code);

  // add course to semesters table
  await updateEntry('semesters', semester-1, CURRENT_SEMESTERS[semester-1]);

  // add course to semester table
  const semester_table = $(`#semester_${semester}_table`);

  // get this course's sr no from semester
  const sr = CURRENT_SEMESTERS[semester-1].length;

  const row = getSemesterRow(sr, course_code, course_title);

  // add row at the second last position
  $(semester_table).children().eq(-1).before(row);

  // reload semester selects
  reloadSemesterSelects();

  glowRow(`semesters_${course_code}`, 'success');
}

// delete semester function
async function deleteSemesterCourse(course_code) {
  // delete course from semester
  let semester_id = null;

  for (let i = 0; i < TOTAL_SEMESTERS; i++) {
    const semester = CURRENT_SEMESTERS[i];
    const index = semester.indexOf(course_code);
    if (index > -1) {
      CURRENT_SEMESTERS[i].splice(index, 1);
      semester_id = i;
      break;
    }
  }

  glowRow(`semesters_${course_code}`, 'danger');

  // delete course from semesters.json
  await updateEntry('semesters', semester_id, CURRENT_SEMESTERS[semester_id]);

  // delete course from semesters table
  $(`#semesters_${course_code}`).remove();

  // reload semester selects
  reloadSemesterSelects();
}