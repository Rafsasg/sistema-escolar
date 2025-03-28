// Importar módulos de Firebase (v9 modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Datos en memoria (simulación de base de datos)
let data = {
  students: [
    { id: '123', name: 'Juan Pérez', grade: '1º', notes: 'Aprobado', reports: 'Sin observaciones' },
    { id: '456', name: 'María López', grade: '2º', notes: 'Excelente', reports: 'Muy buen desempeño' }
  ],
  enrollments: [
    { id: '789', fileName: 'matricula1.pdf' }
  ]
};

// Credenciales simuladas para directivos
const adminCredentials = { user: "admin", pass: "admin123" };

// Elementos del DOM
const btnDirectivas = document.getElementById("btnDirectivas");
const btnConsulta = document.getElementById("btnConsulta");
const btnAcerca = document.getElementById("btnAcerca");
const sectionDirectivas = document.getElementById("sectionDirectivas");
const sectionConsulta = document.getElementById("sectionConsulta");
const sectionAcerca = document.getElementById("sectionAcerca");
const loginAdminDiv = document.getElementById("loginAdmin");
const panelAdminDiv = document.getElementById("panelAdmin");
const formLogin = document.getElementById("formLogin");
const btnLogout = document.getElementById("btnLogout");
const formAddStudent = document.getElementById("formAddStudent");
const listsContainer = document.getElementById("listsContainer");
const formUploadExcel = document.getElementById("formUploadExcel");
const enrollmentList = document.getElementById("enrollmentList");
const formSearchStudent = document.getElementById("formSearchStudent");
const studentInfoDiv = document.getElementById("studentInfo");
const formEnrollment = document.getElementById("formEnrollment");
const formMessageDiv = document.getElementById("formMessage");

// Función para mostrar u ocultar secciones
function showSection(section) {
  // Oculta todas las secciones
  sectionDirectivas.classList.add("hidden");
  sectionConsulta.classList.add("hidden");
  sectionAcerca.classList.add("hidden");
  // Muestra la sección solicitada
  section.classList.remove("hidden");
}

// Eventos de navegación
btnDirectivas.addEventListener("click", () => showSection(sectionDirectivas));
btnConsulta.addEventListener("click", () => showSection(sectionConsulta));
btnAcerca.addEventListener("click", () => showSection(sectionAcerca));

// Inicio de sesión para directivos
formLogin.addEventListener("submit", (e) => {
  e.preventDefault();
  const user = document.getElementById("adminUser").value;
  const pass = document.getElementById("adminPass").value;
  if (user === adminCredentials.user && pass === adminCredentials.pass) {
    loginAdminDiv.classList.add("hidden");
    panelAdminDiv.classList.remove("hidden");
    renderStudentLists();
    renderEnrollments();
  } else {
    alert("Credenciales incorrectas");
  }
});

// Cerrar sesión
btnLogout.addEventListener("click", () => {
  panelAdminDiv.classList.add("hidden");
  loginAdminDiv.classList.remove("hidden");
});

// Agregar estudiante manualmente
formAddStudent.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("studentID").value;
  const name = document.getElementById("studentName").value;
  const grade = document.getElementById("studentGrade").value;

  data.students.push({ id, name, grade, notes: "", reports: "" });
  formAddStudent.reset();
  renderStudentLists();
});

// Procesar archivo Excel para carga masiva
formUploadExcel.addEventListener("submit", (e) => {
  e.preventDefault();
  const fileInput = document.getElementById("excelFile");
  const file = fileInput.files[0];
  if (!file) {
    alert("Por favor, seleccione un archivo Excel.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const dataArray = new Uint8Array(e.target.result);
    const workbook = XLSX.read(dataArray, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    // Convertir la hoja en un arreglo (suponiendo encabezados en la primera fila)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Recorrer filas a partir de la segunda (índice 1)
    jsonData.slice(1).forEach(row => {
      const id = row[0] ? row[0].toString() : "";
      const name = row[1] ? row[1].toString() : "";
      const grade = row[2] ? row[2].toString() : "";
      const note = row[3] ? row[3].toString() : "";
      const report = row[4] ? row[4].toString() : "";

      if (id && name && grade) {
        data.students.push({ id, name, grade, notes: note, reports: report });
      }
    });

    renderStudentLists();
    alert("Archivo Excel procesado correctamente.");
    formUploadExcel.reset();
  };

  reader.readAsArrayBuffer(file);
});

// Renderizar lista de estudiantes organizados por grado
function renderStudentLists() {
  listsContainer.innerHTML = "";
  const grades = {};
  data.students.forEach(student => {
    if (!grades[student.grade]) {
      grades[student.grade] = [];
    }
    grades[student.grade].push(student);
  });

  for (const grade in grades) {
    const gradeDiv = document.createElement("div");
    gradeDiv.classList.add("grade-list");
    gradeDiv.innerHTML = `<h4>Grado: ${grade}</h4>`;
    grades[grade].forEach(student => {
      const studentDiv = document.createElement("div");
      studentDiv.classList.add("student-item");
      studentDiv.innerHTML = `
        <p>ID: ${student.id} - Nombre: ${student.name}</p>
        <p>Notas: <span contenteditable="true" data-id="${student.id}" class="editable" data-field="notes">${student.notes}</span></p>
        <p>Informes: <span contenteditable="true" data-id="${student.id}" class="editable" data-field="reports">${student.reports}</span></p>
      `;
      gradeDiv.appendChild(studentDiv);
    });
    listsContainer.appendChild(gradeDiv);
  }

  // Permitir edición en línea de notas e informes
  const editables = document.querySelectorAll(".editable");
  editables.forEach(element => {
    element.addEventListener("blur", () => {
      const studentID = element.getAttribute("data-id");
      const field = element.getAttribute("data-field");
      const value = element.textContent;
      const student = data.students.find(s => s.id === studentID);
      if (student) {
        student[field] = value;
      }
    });
  });
}

// Renderizar matrículas pendientes
function renderEnrollments() {
  enrollmentList.innerHTML = "";
  data.enrollments.forEach(enrollment => {
    const li = document.createElement("li");
    li.textContent = `ID: ${enrollment.id} - Archivo: ${enrollment.fileName}`;
    enrollmentList.appendChild(li);
  });
}

// Buscar estudiante por identificación
formSearchStudent.addEventListener("submit", (e) => {
  e.preventDefault();
  const searchID = document.getElementById("searchID").value;
  const student = data.students.find(s => s.id === searchID);
  if (student) {
    studentInfoDiv.innerHTML = `
      <p>ID: ${student.id}</p>
      <p>Nombre: ${student.name}</p>
      <p>Grado: ${student.grade}</p>
      <p>Notas: ${student.notes}</p>
      <p>Informes: ${student.reports}</p>
    `;
  } else {
    studentInfoDiv.innerHTML = "<p>Estudiante no encontrado.</p>";
  }
});

// Enviar formulario de matrícula
formEnrollment.addEventListener("submit", async (e) => {
  e.preventDefault();

  const enrollID = document.getElementById("enrollID").value;
  const enrollFileInput = document.getElementById("enrollFile");
  const file = enrollFileInput.files[0];

  if (!file) {
    formMessageDiv.textContent = "Debe seleccionar un archivo PDF o PNG.";
    return;
  }

  try {
    await addDoc(collection(db, "enrollments"), {
      id: enrollID,
      fileName: file.name,
      timestamp: serverTimestamp()
    });
    formMessageDiv.textContent = "Matrícula enviada y registrada correctamente.";
    formEnrollment.reset();
    renderEnrollments();
  } catch (error) {
    console.error("Error al registrar la matrícula:", error);
    formMessageDiv.textContent = "Error al enviar la matrícula. Inténtalo de nuevo.";
  }
});

// Inicializa Firebase con la configuración de tu proyecto
const firebaseConfig = {
  apiKey: "AIzaSyDf9HdH-f7-t9SOi4xEZ3HV6lpET_SLjnc",
  authDomain: "ernesto-89453.firebaseapp.com",
  projectId: "ernesto-89453",
  storageBucket: "ernesto-89453.firebasestorage.app",
  messagingSenderId: "764279120938",
  appId: "1:764279120938:web:134d6514994fe184e1cf53",
  measurementId: "G-QCBPR7YW05"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
