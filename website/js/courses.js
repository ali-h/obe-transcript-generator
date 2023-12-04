// utility functions
function getCourseRow(id, course_code, course_title, plos) {
  // course_code, course_title, plo-[id], delete button
  let plos_column = '';

  for (let i = 0; i < TOTAL_PLOS; i++) {
    const plo = plos[`PLO-${i+1}`];
    // checkbox for plo
    plos_column += `
      <input type="checkbox" class="btn-check" id="course${id}_plo-${i+1}" autocomplete="off" ${plo ? 'checked' : ''} onchange="updateCoursePlo(${id}, 'PLO-${i+1}')">
      <label class="btn btn-sm btn-outline-primary text-nowrap" for="course${id}_plo-${i+1}">PLO-${i+1}</label>
    `;
  }

  const row = `
    <tr id="course${id}">
      <td>${id + 1}</td>
      <td><input type="text" name="course_code" value="${course_code}" class="form-control" onfocusout="updateCourse(${id})"></td>
      <td><input type="text" name="course_title" value="${course_title}" class="form-control" onfocusout="updateCourse(${id})"></td>
      <td>
        <div class="d-flex gap-2">
          ${plos_column}
        </div>
      </td>
      <td align="right">
        <button class="btn btn-danger" onclick="deleteCourse(${id})">${DELETE_ICON}</button>
      </td>
    </tr>
  `;

  return row;
}

function buildCourseTable() {
  // clear courses table
  $("#courses_table").html('');

  // add courses to table
  for (let i = 0; i < CURRENT_COURES.length; i++) {
    const course = CURRENT_COURES[i];
    // add sr no, course code, course title, plos, delete button
    // all are editable on change

    // get plos array
    const plos = {};
    for (let j = 0; j < TOTAL_PLOS; j++) {
      plos[`PLO-${j+1}`] = course[`PLO-${j+1}`] ? 1 : '';
    }

    const row = getCourseRow(i, course.course_code, course.course_title, plos);

    $("#courses_table").append(row);
  }

  // add new course button
  $("#courses_table").append(`
    <tr id="add_new_course">
      <td colspan="${ TOTAL_PLOS + 4 }" align="right">
        <button class="btn btn-success" onclick="addCourse()">Add New Course</button>
      </td>
    </tr>
  `);
}

// load courses function
async function loadCourses() {
  // get courses from database (courses.json)
  const courses = await getFile('courses');

  // save courses to global variable
  CURRENT_COURES = courses;

  // build courses table
  buildCourseTable();
}

// add course function
async function addCourse() {
  // random new course row id
  const new_id = Math.floor(Math.random() * 1000000);

  // add a new row to courses table
  let plos_column = '';

  for (let i = 0; i < TOTAL_PLOS; i++) {
    // checkbox for plo
    plos_column += `
      <input type="checkbox" class="btn-check" id="newCourse${new_id}_plo-${i+1}" autocomplete="off">
      <label class="btn btn-sm btn-outline-primary text-nowrap" for="newCourse${new_id}_plo-${i+1}">PLO-${i+1}</label>
    `;
  }

  const row = `
    <tr id="newCourse${new_id}" class="new_row">
      <td></td>
      <td><input type="text" name="course_code" class="form-control"></td>
      <td><input type="text" name="course_title" class="form-control"></td>
      <td>
        <div class="d-flex gap-2">
          ${plos_column}
        </div>
      </td>
      <td align="right">
        <div class="d-flex gap-2">
          <button class="btn btn-success" onclick="saveCourse('${new_id}')">
            ${CHECK_ICON}
          </button>
          <button class="btn btn-danger" onclick="cancelCourse('${new_id}')">
            ${DELETE_ICON}
          </button>
        </div>
      </td>
    </tr>
  `;

  $("#add_new_course").before(row);

  // focus on course code input
  $(`#newCourse${new_id} input[name=course_code]`).focus();
}

// save course function
async function saveCourse(id) {
  // get course data from input
  const course_code = $(`#newCourse${id} input[name=course_code]`).val();
  const course_title = $(`#newCourse${id} input[name=course_title]`).val();
  const plos = {};

  // make sure course code and title are not empty
  if (course_code == '' || course_title == '') {
    glowRow(`newCourse${id}`, 'warning');
    return;
  }

  const new_id = CURRENT_COURES.length;

  for (let i = 0; i < TOTAL_PLOS; i++) {
    const isChecked = $(`#newCourse${id}_plo-${i+1}`).prop('checked');
    plos[`PLO-${i+1}`] = isChecked ? 1 : '';
  }

  // add course to current courses
  CURRENT_COURES.push({
    course_code,
    course_title,
    ...plos
  });

  // add course to database
  await addEntry('courses', new_id, {
    course_code,
    course_title,
    ...plos
  });

  // remove new row
  $(`#newCourse${id}`).remove();

  // add course to table
  const row = getCourseRow(new_id, course_code, course_title, plos);

  $("#add_new_course").before(row);

  glowRow(`course${new_id}`, 'success');
}

// cancel course function
async function cancelCourse(id) {
  // remove new row
  $(`#newCourse${id}`).remove();
}

// delete course function
async function deleteCourse(id) {
  // delete course from current courses
  CURRENT_COURES.splice(id, 1);

  glowRow(id, 'danger');

  // delete course from database
  await deleteEntry('courses', id);

  // delete course from table
  $(`#course${id}`).remove();

  // update courses table
  buildCourseTable();
}

// update course function
async function updateCourse(id) {
  // get course data from row
  const course_code = $(`#course${id} input[name=course_code]`).val();
  const course_title = $(`#course${id} input[name=course_title]`).val();

  // make sure course code and title are not empty
  if (course_code == '' || course_title == '') {
    glowRow(`course${id}`, 'warning');
    return;
  }

  const current_data = CURRENT_COURES[id];

  // make sure data has changed
  if (current_data.course_code == course_code && current_data.course_title == course_title) {
    return;
  }

  // update course in current courses
  CURRENT_COURES[id] = {
    ...current_data,
    course_code,
    course_title
  };

  // update course in database
  await updateEntry('courses', id, {
    ...current_data,
    course_code,
    course_title
  });

  glowRow(`course${id}`, 'success');
}

// update course plo function
async function updateCoursePlo(id, plo) {
  const isChecked = $(`#course${id}_plo-${plo.replace('PLO-', '')}`).prop('checked');

  // update course in current courses
  CURRENT_COURES[id][plo] = isChecked ? 1 : '';

  // update course in database
  await updateEntry('courses', id, CURRENT_COURES[id]);

  glowRow(`course${id}`, 'success');
}

// download courses function
$("#download_courses").click(function() {
  // get courses data
  const courses = CURRENT_COURES;

  // create csv file
  let csv = 'course_code,course_title';

  for (let i = 0; i < TOTAL_PLOS; i++) {
    csv += `,PLO-${i+1}`;
  }

  csv += '\n';

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];

    csv += `${course.course_code},${course.course_title}`;

    for (let j = 0; j < TOTAL_PLOS; j++) {
      csv += `,${course[`PLO-${j+1}`]}`;
    }

    csv += '\n';
  }

  // download csv file
  downloadFile('courses.csv', csv);
});

// upload courses function
$("#upload_courses").click(function() {
  uploadFile(
    async function(file) {
      let courses = [];

      // parse csv file, it will return an array of objects with headers as keys
      try {
        courses = await parseCSV(file);
      } catch (error) {
        alert('Error uploading file. Please try again.');
        return;
      }

      // check if csv file has valid keys
      if (!courses[0].hasOwnProperty('course_code') || !courses[0].hasOwnProperty('course_title')) {
        alert('Error uploading file. Please try again.');
        return;
      }

      // check plo keys
      for (let i = 0; i < TOTAL_PLOS; i++) {
        if (!courses[0].hasOwnProperty(`PLO-${i+1}`)) {
          alert('Error uploading file. Please try again.');
          return;
        }
      }

      // check if csv file has valid values
      for (let i = 0; i < courses.length; i++) {
        const course = courses[i];

        // if course code or title are empty, delete course
        if (course.course_code == '' || course.course_title == '') {
          courses.splice(i, 1);
          i--;
          continue;
        }

        // // check if plos are valid
        // for (let j = 0; j < TOTAL_PLOS; j++) {
        //   const plo = course[`PLO-${j+1}`];

        //   if (plo != '' && plo != '1') {
        //     alert('Error uploading file. Please try again.');
        //     return;
        //   }
        // }
      }

      // save courses to current courses
      CURRENT_COURES = courses;

      // build courses table
      buildCourseTable();

      // save courses to database
      await saveFile('courses', courses);
    }
  );
});
