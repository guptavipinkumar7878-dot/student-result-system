/**
 * EduTrack - Student Result & Attendance Management System
 * Core Application Logic & Algorithms
 */

// ============================================================================
// SAMPLE DATA PRESETS
// ============================================================================
const DEFAULT_STUDENTS = [
  { roll: 101, name: "Aarav Sharma", marks: 95.5, attendance: 92.0 },
  { roll: 102, name: "Priya Patel", marks: 88.0, attendance: 96.5 },
  { roll: 103, name: "Rohan Verma", marks: 74.5, attendance: 71.0 }, // attendance shortage
  { roll: 104, name: "Sneha Reddy", marks: 92.0, attendance: 88.5 },
  { roll: 105, name: "Vikram Singh", marks: 63.0, attendance: 80.0 },
  { roll: 106, name: "Ananya Iyer", marks: 44.0, attendance: 65.5 }, // fail & shortage
  { roll: 107, name: "Kabir Mehta", marks: 81.5, attendance: 78.0 },
  { roll: 108, name: "Divya Nair", marks: 54.0, attendance: 84.0 }
];

// ============================================================================
// APPLICATION STATE
// ============================================================================
let students = [];
let currentSort = "rank_asc";
let filterGrade = "ALL";
let filterAttendance = "ALL";
let searchQuery = "";

// ============================================================================
// CORE BUSINESS LOGIC (Directly mirroring attendance_management.py)
// ============================================================================

/**
 * Grade Calculation logic from attendance_management.py
 * @param {number} marks - student marks out of 100
 * @returns {string} - Grade letter (A, B, C, D, E, F)
 */
function calculate_grade(marks) {
  if (marks >= 90) return "A";
  if (marks >= 80) return "B";
  if (marks >= 70) return "C";
  if (marks >= 60) return "D";
  if (marks >= 50) return "E";
  return "F";
}

/**
 * Sorts students by marks in descending order and assigns 1-based ranks
 */
function sort_by_marks() {
  students.sort((a, b) => b.marks - a.marks);
  for (let i = 0; i < students.length; i++) {
    students[i].rank = i + 1;
  }
}

/**
 * Sorts students by roll number in ascending order (prerequisite for binary search)
 */
function sort_by_roll(list) {
  return [...list].sort((a, b) => a.roll - b.roll);
}

/**
 * Binary Search algorithm on students list sorted by Roll Number
 * Returns { foundIndex, student, steps }
 */
function binary_search(rollToFind) {
  // Always work on roll-sorted array for valid binary search
  const sorted = sort_by_roll(students);
  let low = 0;
  let high = sorted.length - 1;
  const steps = [];
  let stepCount = 0;

  while (low <= high) {
    stepCount++;
    const mid = Math.floor((low + high) / 2);
    const midStudent = sorted[mid];

    steps.push({
      step: stepCount,
      low,
      high,
      mid,
      midRoll: midStudent.roll,
      midName: midStudent.name
    });

    if (midStudent.roll === rollToFind) {
      return { found: true, student: midStudent, steps };
    } else if (midStudent.roll < rollToFind) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return { found: false, student: null, steps };
}

// ============================================================================
// STORAGE & INITIALIZATION
// ============================================================================

function loadStoredData() {
  const saved = localStorage.getItem("edutrack_students_data");
  if (saved) {
    try {
      students = JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved students:", e);
      students = [...DEFAULT_STUDENTS];
    }
  } else {
    students = [...DEFAULT_STUDENTS];
  }

  // Ensure grades and ranks are fresh
  recalculateSystem();
}

function saveToStorage() {
  localStorage.setItem("edutrack_students_data", JSON.stringify(students));
}

function recalculateSystem() {
  // Recalculate grades for all students
  students.forEach(s => {
    s.grade = calculate_grade(s.marks);
  });

  // Calculate ranks by marks descending
  sort_by_marks();

  // Save changes
  saveToStorage();

  // Refresh UI
  renderAll();
}

// ============================================================================
// UI RENDERING FUNCTIONS
// ============================================================================

function renderAll() {
  renderKPIs();
  renderTable();
}

function renderKPIs() {
  const total = students.length;
  document.getElementById("kpiTotalStudents").textContent = total;

  if (total === 0) {
    document.getElementById("kpiAvgMarks").textContent = "0.0";
    document.getElementById("kpiAvgAttendance").textContent = "0%";
    document.getElementById("kpiTopPerformer").textContent = "None";
    document.getElementById("kpiTopScore").textContent = "No data";
    document.getElementById("kpiPassRate").textContent = "0%";
    document.getElementById("kpiPassedCount").textContent = "0 students";
    return;
  }

  // Average Marks
  const avgMarks = (students.reduce((acc, s) => acc + Number(s.marks), 0) / total).toFixed(1);
  document.getElementById("kpiAvgMarks").textContent = avgMarks;

  // Average Attendance
  const avgAtt = (students.reduce((acc, s) => acc + Number(s.attendance), 0) / total).toFixed(1);
  const avgAttEl = document.getElementById("kpiAvgAttendance");
  avgAttEl.textContent = `${avgAtt}%`;
  
  const attHealthEl = document.getElementById("kpiAttendanceHealth");
  if (avgAtt >= 75) {
    attHealthEl.textContent = "Class attendance healthy (≥ 75%)";
    attHealthEl.style.color = "var(--status-success)";
  } else {
    attHealthEl.textContent = "Class attendance below 75% target!";
    attHealthEl.style.color = "var(--status-danger)";
  }

  // Top Performer (Rank 1)
  const top = students.find(s => s.rank === 1) || students[0];
  if (top) {
    document.getElementById("kpiTopPerformer").textContent = top.name;
    document.getElementById("kpiTopScore").textContent = `Score: ${top.marks}/100 • Grade ${top.grade}`;
  }

  // Pass Rate (Marks >= 50, Grade E or higher)
  const passedStudents = students.filter(s => s.marks >= 50);
  const passRate = ((passedStudents.length / total) * 100).toFixed(0);
  document.getElementById("kpiPassRate").textContent = `${passRate}%`;
  document.getElementById("kpiPassedCount").textContent = `${passedStudents.length} of ${total} passed`;
}

function getFilteredStudents() {
  let list = [...students];

  // 1. Text Search Filter (name or roll)
  if (searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(s => 
      s.name.toLowerCase().includes(q) || 
      String(s.roll).includes(q)
    );
  }

  // 2. Grade Filter
  if (filterGrade !== "ALL") {
    list = list.filter(s => s.grade === filterGrade);
  }

  // 3. Attendance Filter
  if (filterAttendance === "SAFE") {
    list = list.filter(s => s.attendance >= 75);
  } else if (filterAttendance === "SHORTAGE") {
    list = list.filter(s => s.attendance < 75);
  }

  // 4. Sorting
  switch (currentSort) {
    case "rank_asc":
      list.sort((a, b) => a.rank - b.rank);
      break;
    case "marks_asc":
      list.sort((a, b) => a.marks - b.marks);
      break;
    case "roll_asc":
      list.sort((a, b) => a.roll - b.roll);
      break;
    case "roll_desc":
      list.sort((a, b) => b.roll - a.roll);
      break;
    case "name_asc":
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "attendance_desc":
      list.sort((a, b) => b.attendance - a.attendance);
      break;
    default:
      list.sort((a, b) => a.rank - b.rank);
  }

  return list;
}

function renderTable() {
  const tbody = document.getElementById("studentTableBody");
  const emptyState = document.getElementById("emptyStateView");
  const table = document.getElementById("studentsTable");
  const visibleList = getFilteredStudents();

  document.getElementById("visibleStudentCount").textContent = visibleList.length;
  document.getElementById("totalStudentCount").textContent = students.length;

  if (visibleList.length === 0) {
    tbody.innerHTML = "";
    table.style.display = "none";
    emptyState.style.display = "flex";
    return;
  }

  table.style.display = "table";
  emptyState.style.display = "none";

  tbody.innerHTML = visibleList.map(s => {
    // Rank styling
    let rankBadgeClass = "rank-badge";
    let rowRankClass = "";
    let rankDisplay = s.rank;

    if (s.rank === 1) {
      rankBadgeClass += " top-1";
      rowRankClass = "rank-1-row";
      rankDisplay = "🥇 1";
    } else if (s.rank === 2) {
      rankBadgeClass += " top-2";
      rowRankClass = "rank-2-row";
      rankDisplay = "🥈 2";
    } else if (s.rank === 3) {
      rankBadgeClass += " top-3";
      rowRankClass = "rank-3-row";
      rankDisplay = "🥉 3";
    }

    // Avatar initials
    const initials = s.name.split(" ").map(n => n[0]).join("").substring(0, 2);

    // Marks Progress Bar color
    let barColor = "var(--grade-c)";
    if (s.marks >= 90) barColor = "var(--grade-a)";
    else if (s.marks >= 80) barColor = "var(--grade-b)";
    else if (s.marks < 50) barColor = "var(--grade-f)";

    // Attendance warning
    const isShortage = s.attendance < 75;
    const attBadgeClass = isShortage ? "attendance-badge warning" : "attendance-badge safe";
    const attIcon = isShortage ? "⚠️" : "✓";

    // Pass / Fail status
    const isPassed = s.marks >= 50;
    const statusPill = isPassed 
      ? `<span style="font-weight: 600; color: var(--status-success); font-size: 0.8rem;">Passed</span>`
      : `<span style="font-weight: 600; color: var(--status-danger); font-size: 0.8rem;">Failed</span>`;

    return `
      <tr class="${rowRankClass}" data-roll="${s.roll}">
        <td>
          <span class="${rankBadgeClass}">${rankDisplay}</span>
        </td>
        <td>
          <strong>#${s.roll}</strong>
        </td>
        <td>
          <div class="student-profile-cell">
            <div class="student-avatar">${initials}</div>
            <div>
              <div class="student-name-text">${escapeHtml(s.name)}</div>
              <div class="student-roll-sub">Roll No: ${s.roll}</div>
            </div>
          </div>
        </td>
        <td>
          <div class="marks-progress-wrapper">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${Math.min(s.marks, 100)}%; background: ${barColor};"></div>
            </div>
            <span class="marks-val-badge">${s.marks}</span>
          </div>
        </td>
        <td>
          <span class="${attBadgeClass}" title="${isShortage ? 'Attendance Shortage (<75%)' : 'Satisfactory Attendance'}">
            ${attIcon} ${s.attendance}%
          </span>
        </td>
        <td>
          <span class="grade-pill grade-${s.grade}">${s.grade}</span>
        </td>
        <td>
          ${statusPill}
        </td>
        <td style="text-align: right;">
          <div class="action-buttons-group" style="justify-content: flex-end;">
            <button class="btn-table-action" onclick="viewStudentReport(${s.roll})" title="View Report Card">
              👁️
            </button>
            <button class="btn-table-action" onclick="openEditStudentModal(${s.roll})" title="Edit Student">
              ✏️
            </button>
            <button class="btn-table-action delete-action" onclick="deleteStudent(${s.roll})" title="Delete Student">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================

function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const icon = type === "success" ? "✅" : (type === "error" ? "❌" : "ℹ️");
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span style="flex: 1;">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-exit");
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

// ============================================================================
// MODAL & FORM CONTROLS
// ============================================================================

const studentModal = document.getElementById("studentModal");
const reportModal = document.getElementById("reportModal");
const studentForm = document.getElementById("studentForm");
const rollInput = document.getElementById("studentRollInput");
const nameInput = document.getElementById("studentNameInput");
const marksInput = document.getElementById("studentMarksInput");
const attendanceInput = document.getElementById("studentAttendanceInput");
const editOriginalRollInput = document.getElementById("editStudentOriginalRoll");
const modalTitle = document.getElementById("modalTitle");

function openAddStudentModal() {
  modalTitle.textContent = "Add New Student";
  studentForm.reset();
  editOriginalRollInput.value = "";
  rollInput.disabled = false;
  
  // Suggest next roll number
  const maxRoll = students.length > 0 ? Math.max(...students.map(s => s.roll)) : 100;
  rollInput.value = maxRoll + 1;

  updateLiveGradePreview();
  studentModal.classList.add("active");
  nameInput.focus();
}

function openEditStudentModal(roll) {
  const s = students.find(st => st.roll === roll);
  if (!s) return;

  modalTitle.textContent = "Edit Student Details";
  editOriginalRollInput.value = s.roll;
  rollInput.value = s.roll;
  rollInput.disabled = false; // allow editing roll if not colliding
  nameInput.value = s.name;
  marksInput.value = s.marks;
  attendanceInput.value = s.attendance;

  updateLiveGradePreview();
  studentModal.classList.add("active");
  nameInput.focus();
}

function closeStudentModal() {
  studentModal.classList.remove("active");
}

function updateLiveGradePreview() {
  const val = parseFloat(marksInput.value);
  const textEl = document.getElementById("previewGradeText");
  const pillEl = document.getElementById("previewGradePill");

  if (isNaN(val)) {
    textEl.textContent = "Enter marks";
    pillEl.style.display = "none";
    return;
  }

  const grade = calculate_grade(val);
  textEl.textContent = `Grade ${grade}`;
  pillEl.textContent = grade;
  pillEl.className = `grade-pill grade-${grade}`;
  pillEl.style.display = "inline-block";
}

marksInput.addEventListener("input", updateLiveGradePreview);

studentForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const roll = parseInt(rollInput.value, 10);
  const name = nameInput.value.trim();
  const marks = parseFloat(marksInput.value);
  const attendance = parseFloat(attendanceInput.value);
  const originalRoll = editOriginalRollInput.value ? parseInt(editOriginalRollInput.value, 10) : null;

  // Validations
  if (!name || isNaN(roll) || isNaN(marks) || isNaN(attendance)) {
    showToast("Please fill all fields with valid numbers", "error");
    return;
  }

  if (marks < 0 || marks > 100) {
    showToast("Marks must be between 0 and 100", "error");
    return;
  }

  if (attendance < 0 || attendance > 100) {
    showToast("Attendance must be between 0% and 100%", "error");
    return;
  }

  // Roll uniqueness check
  const existing = students.find(s => s.roll === roll);
  if (existing && existing.roll !== originalRoll) {
    showToast(`Roll Number ${roll} is already registered to ${existing.name}`, "error");
    return;
  }

  if (originalRoll) {
    // Edit existing student
    const index = students.findIndex(s => s.roll === originalRoll);
    if (index !== -1) {
      students[index].roll = roll;
      students[index].name = name;
      students[index].marks = marks;
      students[index].attendance = attendance;
      showToast(`Student #${roll} (${name}) updated successfully!`, "success");
    }
  } else {
    // Add new student
    students.push({ roll, name, marks, attendance });
    showToast(`Student #${roll} (${name}) added to class!`, "success");
  }

  closeStudentModal();
  recalculateSystem();
});

function deleteStudent(roll) {
  const student = students.find(s => s.roll === roll);
  if (!student) return;

  if (confirm(`Are you sure you want to delete student #${roll} (${student.name})?`)) {
    students = students.filter(s => s.roll !== roll);
    showToast(`Student #${roll} removed`, "info");
    recalculateSystem();
  }
}

// ============================================================================
// STUDENT PERFORMANCE REPORT & SEARCH MODAL
// ============================================================================

function viewStudentReport(roll, searchTrace = null) {
  const s = students.find(st => st.roll === roll);
  if (!s) {
    showToast(`No student found with Roll #${roll}`, "error");
    return;
  }

  document.getElementById("reportStudentName").textContent = s.name;
  document.getElementById("reportStudentRoll").textContent = s.roll;
  document.getElementById("reportStudentRank").textContent = `#${s.rank}`;
  document.getElementById("reportStudentGrade").textContent = s.grade;
  document.getElementById("reportStudentMarks").textContent = `${s.marks} / 100`;

  const isPassed = s.marks >= 50;
  const statusEl = document.getElementById("reportStudentStatus");
  statusEl.textContent = isPassed ? "PASSED" : "FAILED";
  statusEl.style.color = isPassed ? "var(--status-success)" : "var(--status-danger)";

  document.getElementById("reportAttendancePercent").textContent = `${s.attendance}%`;
  const fill = document.getElementById("reportAttendanceFill");
  fill.style.width = `${Math.min(s.attendance, 100)}%`;

  const verdictEl = document.getElementById("reportAttendanceVerdict");
  if (s.attendance >= 75) {
    fill.style.background = "var(--status-success)";
    verdictEl.textContent = "✓ Attendance requirement satisfied (≥ 75%)";
    verdictEl.style.color = "var(--status-success)";
  } else {
    fill.style.background = "var(--status-danger)";
    verdictEl.textContent = `⚠️ Attendance Shortage Alert! Student is ${ (75 - s.attendance).toFixed(1) }% below the mandatory 75% limit.`;
    verdictEl.style.color = "var(--status-danger)";
  }

  // Handle Binary Search Trace
  const traceBox = document.getElementById("binarySearchLogContainer");
  const stepsLog = document.getElementById("binarySearchStepsLog");
  if (searchTrace && searchTrace.length > 0) {
    traceBox.style.display = "block";
    stepsLog.innerHTML = searchTrace.map(st => 
      `<div>[Step ${st.step}] Range: [${st.low} .. ${st.high}] | Mid: idx ${st.mid} (Roll ${st.midRoll}: "${st.midName}") ${st.midRoll === roll ? '🎯 FOUND!' : ''}</div>`
    ).join("");
  } else {
    traceBox.style.display = "none";
    stepsLog.innerHTML = "";
  }

  reportModal.classList.add("active");
}

function closeReportModal() {
  reportModal.classList.remove("active");
}

// ============================================================================
// BINARY SEARCH HANDLER
// ============================================================================

function handleBinarySearch() {
  const input = document.getElementById("binarySearchRollInput");
  const val = parseInt(input.value, 10);

  if (isNaN(val)) {
    showToast("Please enter a valid numeric Roll Number to search", "info");
    input.focus();
    return;
  }

  if (students.length === 0) {
    showToast("No students in records to search", "error");
    return;
  }

  const result = binary_search(val);

  if (result.found) {
    showToast(`Found student: ${result.student.name} in ${result.steps.length} binary search step(s)!`, "success");
    viewStudentReport(val, result.steps);
  } else {
    showToast(`Student with Roll #${val} not found in records after ${result.steps.length} binary search step(s)`, "error");
  }
}

// ============================================================================
// EXPORT TO CSV
// ============================================================================

function exportToCsv() {
  if (students.length === 0) {
    showToast("No student data available to export", "info");
    return;
  }

  const headers = ["Rank", "Roll Number", "Name", "Marks", "Attendance (%)", "Grade", "Status"];
  const rows = students.map(s => [
    s.rank,
    s.roll,
    `"${s.name.replace(/"/g, '""')}"`,
    s.marks,
    s.attendance,
    s.grade,
    s.marks >= 50 ? "Pass" : "Fail"
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + 
    [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `student_result_attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("Report exported successfully to CSV!", "success");
}

// ============================================================================
// EVENT LISTENERS & SETUP
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Theme Toggle
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const themeIcon = document.getElementById("themeIcon");
  const savedTheme = localStorage.getItem("edutrack_theme") || "dark";
  
  document.documentElement.setAttribute("data-theme", savedTheme);
  themeIcon.textContent = savedTheme === "dark" ? "🌙" : "☀️";

  themeToggleBtn.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("edutrack_theme", nextTheme);
    themeIcon.textContent = nextTheme === "dark" ? "🌙" : "☀️";
    showToast(`Switched to ${nextTheme} theme`, "info");
  });

  // Load Data
  loadStoredData();

  // Header Actions
  document.getElementById("openAddModalBtn").addEventListener("click", openAddStudentModal);
  document.getElementById("closeModalBtn").addEventListener("click", closeStudentModal);
  document.getElementById("cancelModalBtn").addEventListener("click", closeStudentModal);
  
  document.getElementById("closeReportModalBtn").addEventListener("click", closeReportModal);
  document.getElementById("closeReportFooterBtn").addEventListener("click", closeReportModal);
  document.getElementById("printReportBtn").addEventListener("click", () => window.print());

  // Empty state buttons
  document.getElementById("emptyAddBtn").addEventListener("click", openAddStudentModal);
  document.getElementById("emptyLoadSampleBtn").addEventListener("click", () => {
    students = [...DEFAULT_STUDENTS];
    recalculateSystem();
    showToast("Demo records loaded successfully!", "success");
  });

  // Sample data button
  document.getElementById("sampleDataBtn").addEventListener("click", () => {
    students = [...DEFAULT_STUDENTS];
    recalculateSystem();
    showToast("Loaded 8 demo students with diverse grades & attendance!", "success");
  });

  // Export CSV
  document.getElementById("exportCsvBtn").addEventListener("click", exportToCsv);

  // Binary Search button & Enter key
  document.getElementById("binarySearchBtn").addEventListener("click", handleBinarySearch);
  document.getElementById("binarySearchRollInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleBinarySearch();
  });

  // Live text search
  document.getElementById("liveSearchInput").addEventListener("input", (e) => {
    searchQuery = e.target.value;
    renderTable();
  });

  // Filter Dropdowns
  document.getElementById("gradeFilterSelect").addEventListener("change", (e) => {
    filterGrade = e.target.value;
    renderTable();
  });

  document.getElementById("attendanceFilterSelect").addEventListener("change", (e) => {
    filterAttendance = e.target.value;
    renderTable();
  });

  document.getElementById("sortBySelect").addEventListener("change", (e) => {
    currentSort = e.target.value;
    renderTable();
  });

  document.getElementById("resetFiltersBtn").addEventListener("click", () => {
    document.getElementById("liveSearchInput").value = "";
    document.getElementById("gradeFilterSelect").value = "ALL";
    document.getElementById("attendanceFilterSelect").value = "ALL";
    document.getElementById("sortBySelect").value = "rank_asc";
    searchQuery = "";
    filterGrade = "ALL";
    filterAttendance = "ALL";
    currentSort = "rank_asc";
    renderTable();
    showToast("Filters reset to default", "info");
  });

  // Table Column Header Sort
  document.querySelectorAll(".data-table th.sortable").forEach(th => {
    th.addEventListener("click", () => {
      const type = th.dataset.sort;
      if (type === "rank") currentSort = "rank_asc";
      else if (type === "roll") currentSort = currentSort === "roll_asc" ? "roll_desc" : "roll_asc";
      else if (type === "name") currentSort = "name_asc";
      else if (type === "marks") currentSort = currentSort === "rank_asc" ? "marks_asc" : "rank_asc";
      else if (type === "attendance") currentSort = "attendance_desc";
      else if (type === "grade") currentSort = "rank_asc";

      document.getElementById("sortBySelect").value = currentSort;
      renderTable();
    });
  });

  // Close modals on clicking overlay backdrop
  [studentModal, reportModal].forEach(modal => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });
  });

  // Keyboard Escape key to close active modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeStudentModal();
      closeReportModal();
    }
  });
});
