const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const ExcelJS = require('exceljs');

const app = express();

app.use(express.json());

// CORS
app.use(cors());

// resources folder
app.use(express.static(path.join(__dirname, 'website')));

// default page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'website', 'index.html'));
});

// DATABASE API
// get file from database
app.get('/database/:file', async (req, res) => {
  // get file from database folder, if available
  // otherwise get the file from default folder

  const file = req.params.file;
  let response = [];

  try {
    // get file from database
    response = await fs.readFile(path.join(__dirname, 'temp', `${file}.json`));
  } catch (err) {
    // get file from default folder
    response = await fs.readFile(path.join(__dirname, 'defaults', `${file}.json`));

    // also save file to database folder
    await fs.writeFile(path.join(__dirname, 'temp', `${file}.json`), response);
  }

  // return file
  res.json(JSON.parse(response));
});

// delete entry from database
app.delete('/database/:file/:id', async (req, res) => {
  // delete entry from database folder

  const file = req.params.file;
  const id = req.params.id;

  // get file from database
  let response = await fs.readFile(path.join(__dirname, 'temp', `${file}.json`));

  // parse file
  let data = JSON.parse(response);

  // delete entry from file
  for (let i = 0; i < data.length; i++) {
    if (i == id) {
      data.splice(i, 1);
      break;
    }
  }

  // save file to database
  await fs.writeFile(path.join(__dirname, 'temp', `${file}.json`), JSON.stringify(data));

  // return success
  res.json({ success: true });
});

// update entry in database
app.put('/database/:file/:id', async (req, res) => {
  // update entry in database folder

  const file = req.params.file;
  const id = req.params.id;
  const data = req.body;

  // get file from database
  let response = await fs.readFile(path.join(__dirname, 'temp', `${file}.json`));

  // parse file
  let fileData = JSON.parse(response);

  // update entry in file
  // if filedata in array, update entry at id
  if (Array.isArray(fileData)) {
    for (let i = 0; i < fileData.length; i++) {
      if (i == id) {
        fileData[i] = data;
        break;
      }
    }
  }
  else {
    // if filedata is object, update entry at id
    fileData[id] = data;
  }

  // save file to database
  await fs.writeFile(path.join(__dirname, 'temp', `${file}.json`), JSON.stringify(fileData));

  // return success
  res.json({ success: true });
});

// add new entry to a file in database
app.post('/database/:file/:id', async (req, res) => {
  // add new entry in a file in database folder

  const file = req.params.file;
  const id = req.params.id;
  const data = req.body;

  // get file from database
  let response = await fs.readFile(path.join(__dirname, 'temp', `${file}.json`));

  // parse file
  let fileData = JSON.parse(response);

  // add new entry in file
  // if filedata in array, add new entry at id
  if (Array.isArray(fileData)) {
    fileData.splice(id, 0, data);
  }
  else {
    // if filedata is object, add new entry at id
    fileData[id] = data;
  }
  
  // save file to database
  await fs.writeFile(path.join(__dirname, 'temp', `${file}.json`), JSON.stringify(fileData));

  // return success
  res.json({ success: true });
});

// save file to database
app.post('/database/:file', async (req, res) => {
  // save file to database folder

  const file = req.params.file;
  const data = req.body;

  // save file to database
  await fs.writeFile(path.join(__dirname, 'temp', `${file}.json`), JSON.stringify(data));

  // return success
  res.json({ success: true });
});

// generate transcript for student id, excel file using data from database
app.get('/transcript/:id', async (req, res) => {
  // generate transcript for student id, excel file using data from database

  const id = req.params.id;

  // get student data from database
  const students = await fs.readFile(path.join(__dirname, 'temp', 'students.json'));

  // parse student data
  const studentData = JSON.parse(students);

  // get student roll number and name
  const rollNumber = studentData[id].roll_no;
  const name = studentData[id].name;

  // get student marks data from database
  const marks = await fs.readFile(path.join(__dirname, 'temp', 'marks.json'));

  // parse student marks data
  const marksData = JSON.parse(marks);

  // get student marks from array of marks
  const studentMarks = {};

  for (course in marksData) {
    const courseMarks = marksData[course];

    if (courseMarks[rollNumber]) {
      studentMarks[course] = courseMarks[rollNumber];
    }
  }

  // get course data from database
  const courses = await fs.readFile(path.join(__dirname, 'temp', 'courses.json'));

  // parse course data
  const courseData = JSON.parse(courses);

  // load semester data from database (semesters.json)
  const semesterData = await fs.readFile(path.join(__dirname, 'temp', 'semesters.json'));

  // parse semester data
  const semesters = JSON.parse(semesterData);

  // load template properties from defaults (template.json)
  const template = await fs.readFile(path.join(__dirname, 'defaults', 'template.json'));

  // parse template properties
  const templateData = JSON.parse(template);

  // load spreadsheet template
  const workbook = new ExcelJS.Workbook();

  // load template
  await workbook.xlsx.readFile(path.join(__dirname, 'defaults', 'transcript.xlsx'));

  // edit template
  // add student data
  workbook.worksheets[0].getCell(templateData.roll_no_cell).value = `Roll No: ${rollNumber}`;
  workbook.worksheets[0].getCell(templateData.name_cell).value = `Name: ${name}`;

  // add student marks
  const startline = templateData.start_line;
  const courseCodeColumn = templateData.course_code_column;
  const courseTitleColumn = templateData.course_title_column;

  let currentLine = startline;

  // add semester header for each semester, below it sr, course code, couse name
  for (let i = 0; i < semesters.length; i++) {
    const semester = semesters[i];

    // add semester header
    workbook.worksheets[0].getCell(`A${currentLine}`).value = `Semester ${i+1}`;

    // merge semester header till the last plo column
    const ploColumns = Object.values(templateData.plo_columns);
    const lastPloColumn = ploColumns[ploColumns.length - 1];

    workbook.worksheets[0].mergeCells(`A${currentLine}:${lastPloColumn}${currentLine}`);

    // increment current line
    currentLine++;

    // add sr, course code, course name of each course in the semester array
    for (let j = 0; j < semester.length; j++) {
      const courseCode = semester[j];

      // get course name from all courses
      const course = courseData.find(course => course.course_code == courseCode);

      // if course not found, skip
      if (!course) {
        continue;
      }

      const courseTitle = course.course_title;

      // get sr from object
      const sr = j + 1;

      // add sr
      workbook.worksheets[0].getCell(`A${currentLine}`).value = sr;

      // add course code
      workbook.worksheets[0].getCell(`${courseCodeColumn}${currentLine}`).value = courseCode;

      // add course name
      workbook.worksheets[0].getCell(`${courseTitleColumn}${currentLine}`).value = courseTitle;

      // add marks for course
      if (studentMarks[courseCode]) {
        const courseMarks = studentMarks[courseCode];

        // add marks
        for (plo in courseMarks) {
          // get plo column
          const ploColumn = templateData.plo_columns[plo];

          // add marks
          workbook.worksheets[0].getCell(`${ploColumn}${currentLine}`).value = courseMarks[plo];
        }
      }

      // touch the last plo column to make sure it is not empty
      workbook.worksheets[0].getCell(`${lastPloColumn}${currentLine}`).value = '';

      // increment current line
      currentLine++;
    }
  }

  // add border to all cells
  const ploColumns = Object.values(templateData.plo_columns);
  const lastPloColumn = ploColumns[ploColumns.length - 1];

  const lastLine = currentLine - 1;

  // loop through all rows
  workbook.worksheets[0].eachRow({ includeEmpty: true }, function(row, rowNumber) {
    if (rowNumber < startline || rowNumber > lastLine) {
      return;
    }

    // loop through all columns
    row.eachCell({ includeEmpty: true }, function(cell, colNumber) {
      // add border to cell
      workbook.worksheets[0].getCell(`${cell.address}`).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // download file
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  // return file
  res.setHeader('Content-Disposition', `attachment; filename=${rollNumber}-${name}.xlsx`);

  // return new worksheet
  await workbook.xlsx.write(res);

  // end response
  res.end();
});

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// setup for vercel
module.exports = app;