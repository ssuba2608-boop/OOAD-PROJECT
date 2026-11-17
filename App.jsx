import { useEffect, useMemo, useState } from "react";
import "./App.css";
import WorkforceHub from "./WorkforceHub";

const initialEmployees = [
  {
    id: "EMP101",
    name: "Arun Kumar",
    role: "Software Engineer",
    department: "IT",
    basic: 35000,
    allowance: 7000,
    deduction: 2000,
    attendance: "Present",
  },
  {
    id: "EMP102",
    name: "Priya Devi",
    role: "HR Executive",
    department: "HR",
    basic: 28000,
    allowance: 5000,
    deduction: 1500,
    attendance: "Present",
  },
  {
    id: "EMP103",
    name: "Rahul Raj",
    role: "Accountant",
    department: "Finance",
    basic: 32000,
    allowance: 6000,
    deduction: 1800,
    attendance: "Leave",
  },
];

const pageNames = [
  "Dashboard",
  "Employee Details",
  "Salary Calculation",
  "Attendance",
  "Reports & Leave",
  "Workforce Intelligence",
  "Employee Financial Wellness",
];

const emptyEmployee = {
  id: "",
  name: "",
  role: "",
  department: "IT",
  basic: "",
  allowance: "",
  deduction: "",
  attendance: "Present",
};

const emptyLeave = { name: "", type: "Casual Leave", days: 1 };

const money = (amount) =>
  "₹" + Number(amount || 0).toLocaleString("en-IN");

const netSalary = (employee) =>
  Number(employee.basic || 0) +
  Number(employee.allowance || 0) -
  Number(employee.deduction || 0);

function loadSaved(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [employees, setEmployees] = useState(
    () => loadSaved("payflow-employees", initialEmployees)
  );
  const [leaves, setLeaves] = useState(
    () => loadSaved("payflow-leaves", [])
  );
  const [salaries, setSalaries] = useState(
    () => loadSaved("payflow-salaries", {})
  );
  const [attendanceLog, setAttendanceLog] = useState(
    () => loadSaved("payflow-attendance", {})
  );

  const [page, setPage] = useState(0);
  const [employeeForm, setEmployeeForm] = useState(emptyEmployee);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("All");
  const [selectedId, setSelectedId] = useState("");
  const [salaryForm, setSalaryForm] = useState({
    allowance: "5000",
    deduction: "1500",
  });
  const [leaveForm, setLeaveForm] = useState(emptyLeave);
  const [dark, setDark] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    localStorage.setItem("payflow-employees", JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem("payflow-leaves", JSON.stringify(leaves));
  }, [leaves]);

  useEffect(() => {
    localStorage.setItem("payflow-salaries", JSON.stringify(salaries));
  }, [salaries]);

  useEffect(() => {
    localStorage.setItem(
      "payflow-attendance",
      JSON.stringify(attendanceLog)
    );
  }, [attendanceLog]);

  const payroll = useMemo(
    () =>
      employees.reduce((sum, employee) => {
        const saved = salaries[employee.id];
        return sum + (saved ? Number(saved.net) : netSalary(employee));
      }, 0),
    [employees, salaries]
  );

  const selectedEmployee = employees.find(
    (employee) => employee.id === selectedId
  );

  const filteredEmployees = employees.filter((employee) => {
    const text =
      `${employee.id} ${employee.name} ${employee.role} ${employee.department}`.toLowerCase();

    return (
      text.includes(search.toLowerCase()) &&
      (filterDepartment === "All" ||
        employee.department === filterDepartment)
    );
  });

  const presentCount = employees.filter(
    (employee) => getAttendance(employee) === "Present"
  ).length;

  const pendingLeaves = leaves.filter(
    (leave) => leave.status === "Pending"
  ).length;

  function getAttendance(employee) {
    const today = new Date().toISOString().slice(0, 10);
    return attendanceLog[today]?.[employee.id] || employee.attendance;
  }

  function showNotice(message) {
    setNotice(message);
  }

  function navigateTo(nextPage) {
    setPage(Math.max(0, Math.min(pageNames.length - 1, nextPage)));
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleEmployeeChange(event) {
    const { name, value } = event.target;
    setEmployeeForm((old) => ({ ...old, [name]: value }));
  }

  function saveEmployee(event) {
    event.preventDefault();

    if (
      !employeeForm.id.trim() ||
      !employeeForm.name.trim() ||
      !employeeForm.role.trim()
    ) {
      showNotice("Please complete the required fields.");
      return;
    }

    if (
      [employeeForm.basic, employeeForm.allowance, employeeForm.deduction]
        .some(
          (value) =>
            value === "" ||
            !Number.isFinite(Number(value)) ||
            Number(value) < 0
        )
    ) {
      showNotice("Enter valid, non-negative salary values.");
      return;
    }

    const id = employeeForm.id.trim().toUpperCase();

    if (
      employees.some(
        (employee) =>
          employee.id.toUpperCase() === id && employee.id !== editingId
      )
    ) {
      showNotice("Employee ID already exists. Use a different ID.");
      return;
    }

    const record = {
      ...employeeForm,
      id,
      name: employeeForm.name.trim(),
      role: employeeForm.role.trim(),
      basic: Number(employeeForm.basic),
      allowance: Number(employeeForm.allowance),
      deduction: Number(employeeForm.deduction),
    };

    if (editingId) {
      setEmployees((old) =>
        old.map((employee) =>
          employee.id === editingId ? record : employee
        )
      );
      showNotice("Employee details updated and saved!");
    } else {
      setEmployees((old) => [...old, record]);
      showNotice("Employee added and saved!");
    }

    setEmployeeForm(emptyEmployee);
    setEditingId(null);

    if (!editingId) setSelectedId(id);
  }

  function editEmployee(employee) {
    setEmployeeForm({ ...employee });
    setEditingId(employee.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
    showNotice("Edit the form and click Save Changes.");
  }

  function deleteEmployee(employee) {
    if (!window.confirm(`Delete ${employee.name} (${employee.id})?`)) {
      return;
    }

    setEmployees((old) =>
      old.filter((item) => item.id !== employee.id)
    );

    setSalaries((old) => {
      const updated = { ...old };
      delete updated[employee.id];
      return updated;
    });

    if (selectedId === employee.id) setSelectedId("");

    if (editingId === employee.id) {
      setEditingId(null);
      setEmployeeForm(emptyEmployee);
    }

    showNotice("Employee deleted.");
  }

  function getWorkforceExtra(employeeId) {
    try {
      const data =
        JSON.parse(localStorage.getItem("payflow-workforce-v1")) || {
          skills: [],
          work: {},
        };

      const rates = {
        Beginner: 500,
        Intermediate: 1200,
        Advanced: 2200,
        Expert: 3500,
      };

      const approvedSkills = (data.skills || []).filter(
        (skill) =>
          skill.employeeId === employeeId &&
          skill.status === "Approved"
      );

      const skillAllowance = approvedSkills.reduce(
        (sum, skill) => sum + (rates[skill.level] || 0),
        0
      );

      const work = (data.work || {})[employeeId] || {};
      const target = Math.max(1, Number(work.target || 1));
      const completed = Math.max(0, Number(work.completed || 0));
      const performance = Math.round((completed / target) * 100);

      const performanceBonus =
        performance >= 120
          ? 5000
          : performance >= 100
          ? 3000
          : performance >= 80
          ? 1000
          : 0;

      const overtimePay =
        Number(work.overtimeHours || 0) *
        Number(work.hourlyRate || 0) *
        1.5;

      const advanceEmi = Number(work.emi || 0);

      return {
        skillAllowance,
        performanceBonus,
        overtimePay,
        advanceEmi,
      };
    } catch {
      return {
        skillAllowance: 0,
        performanceBonus: 0,
        overtimePay: 0,
        advanceEmi: 0,
      };
    }
  }

  function calculateSalary(event) {
    event.preventDefault();

    if (!selectedEmployee) {
      showNotice("Please add and select an employee first.");
      return;
    }

    const allowance = Number(salaryForm.allowance);
    const deduction = Number(salaryForm.deduction);

    if (
      salaryForm.allowance === "" ||
      salaryForm.deduction === "" ||
      !Number.isFinite(allowance) ||
      !Number.isFinite(deduction) ||
      allowance < 0 ||
      deduction < 0 ||
      deduction > Number(selectedEmployee.basic) + allowance
    ) {
      showNotice("Check allowance and deduction values.");
      return;
    }

    const workforce = getWorkforceExtra(selectedEmployee.id);

    const record = {
      basic: Number(selectedEmployee.basic),
      allowance,
      deduction,
      ...workforce,
      net:
        Number(selectedEmployee.basic) +
        allowance -
        deduction +
        workforce.skillAllowance +
        workforce.performanceBonus +
        workforce.overtimePay -
        workforce.advanceEmi,
      calculatedAt: new Date().toLocaleString(),
    };

    setSalaries((old) => ({
      ...old,
      [selectedEmployee.id]: record,
    }));

    setEmployees((old) =>
      old.map((employee) =>
        employee.id === selectedEmployee.id
          ? { ...employee, allowance, deduction }
          : employee
      )
    );

    showNotice(
      `Salary calculated and saved for ${selectedEmployee.name}.`
    );
  }

  function selectEmployee(id) {
    setSelectedId(id);

    const employee = employees.find((item) => item.id === id);
    const saved = salaries[id];

    setSalaryForm({
      allowance: String(
        saved?.allowance ?? employee?.allowance ?? 0
      ),
      deduction: String(
        saved?.deduction ?? employee?.deduction ?? 0
      ),
    });
  }

  function markAttendance(id, status) {
    const today = new Date().toISOString().slice(0, 10);

    setAttendanceLog((old) => ({
      ...old,
      [today]: {
        ...(old[today] || {}),
        [id]: status,
      },
    }));

    showNotice("Attendance updated and saved for today.");
  }

  function addLeave(event) {
    event.preventDefault();

    if (!leaveForm.name.trim() || Number(leaveForm.days) < 1) {
      showNotice("Enter an employee name and valid leave days.");
      return;
    }

    setLeaves((old) => [
      ...old,
      {
        ...leaveForm,
        id: Date.now(),
        days: Number(leaveForm.days),
        status: "Pending",
      },
    ]);

    setLeaveForm(emptyLeave);
    showNotice("Leave request submitted and saved.");
  }

  function updateLeave(id, status) {
    setLeaves((old) =>
      old.map((leave) =>
        leave.id === id ? { ...leave, status } : leave
      )
    );

    showNotice(`Leave request ${status.toLowerCase()}.`);
  }

  function exportCSV() {
    const rows = [
      [
        "Employee ID",
        "Name",
        "Department",
        "Basic",
        "Allowance",
        "Deduction",
        "Skill Allowance",
        "Performance Bonus",
        "Overtime Pay",
        "Advance EMI",
        "Net Salary",
        "Attendance",
      ],
      ...employees.map((employee) => {
        const saved = salaries[employee.id];
        const extra = getWorkforceExtra(employee.id);

        return [
          employee.id,
          employee.name,
          employee.department,
          employee.basic,
          saved?.allowance ?? employee.allowance,
          saved?.deduction ?? employee.deduction,
          saved?.skillAllowance ?? extra.skillAllowance,
          saved?.performanceBonus ?? extra.performanceBonus,
          saved?.overtimePay ?? extra.overtimePay,
          saved?.advanceEmi ?? extra.advanceEmi,
          saved?.net ??
            (netSalary(employee) +
              extra.skillAllowance +
              extra.performanceBonus +
              extra.overtimePay -
              extra.advanceEmi),
          getAttendance(employee),
        ];
      }),
    ];

    const csv =
      "\uFEFF" +
      rows
        .map((row) =>
          row
            .map(
              (value) =>
                `"${String(value ?? "").replace(/"/g, '""')}"`
            )
            .join(",")
        )
        .join("\r\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = "payflow-payroll-report.csv";
    link.click();
    URL.revokeObjectURL(url);

    showNotice("CSV report downloaded.");
  }

  function printSalarySlip(employee) {
    const saved = salaries[employee.id] || {
      basic: employee.basic,
      allowance: employee.allowance,
      deduction: employee.deduction,
      net: netSalary(employee),
      skillAllowance: 0,
      performanceBonus: 0,
      overtimePay: 0,
      advanceEmi: 0,
    };

    const slipWindow = window.open("", "_blank");

    if (!slipWindow) {
      showNotice("Please allow pop-ups to print a salary slip.");
      return;
    }

    const safe = (value) =>
      String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char]);

    slipWindow.document.write(`
      <!doctype html>
      <html>
      <head>
        <title>Salary Slip</title>
        <style>
          body {
            font: 16px Arial;
            max-width: 650px;
            margin: 40px auto;
            color: #20213c;
          }
          h1 { color: #5842a6; }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          td, th {
            padding: 14px;
            border: 1px solid #ddd;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <h1>PAYFLOW · SALARY SLIP</h1>
        <p>Employee: ${safe(employee.name)}</p>
        <p>ID: ${safe(employee.id)} · Department: ${safe(employee.department)}</p>
        <table>
          <tr><td>Basic Salary</td><td>${money(saved.basic)}</td></tr>
          <tr><td>Allowance</td><td>${money(saved.allowance)}</td></tr>
          <tr><td>Deduction</td><td>${money(saved.deduction)}</td></tr>
          <tr><td>Skill Allowance</td><td>${money(saved.skillAllowance)}</td></tr>
          <tr><td>Performance Bonus</td><td>${money(saved.performanceBonus)}</td></tr>
          <tr><td>Overtime Pay</td><td>${money(saved.overtimePay)}</td></tr>
          <tr><td>Advance EMI</td><td>${money(saved.advanceEmi)}</td></tr>
          <tr><th>Net Salary</th><th>${money(saved.net)}</th></tr>
        </table>
        <p>Demonstration salary slip.</p>
        <script>window.onload=()=>window.print();<\/script>
      </body>
      </html>
    `);

    slipWindow.document.close();
  }

  function clearDemoData() {
    if (
      !window.confirm(
        "Reset all demo records? This cannot be undone."
      )
    ) {
      return;
    }

    setEmployees([]);
    setLeaves([]);
    setSalaries({});
    setAttendanceLog({});
    setSelectedId("");
    setEmployeeForm(emptyEmployee);
    setEditingId(null);

    showNotice("Demo records cleared.");
  }

  return (
    <div className={`app ${dark ? "dark" : "light"}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">P</div>
          <div>
            <strong>
              payflow<span>.</span>
            </strong>
            <small>PAYROLL WORKSPACE</small>
          </div>
        </div>

        <p className="nav-label">MAIN MENU</p>

        {pageNames.map((name, index) => (
          <button
            key={name}
            className={`nav-link ${page === index ? "active" : ""}`}
            onClick={() => navigateTo(index)}
          >
            <span className="nav-icon">
              {["▦", "♙", "₹", "◷", "▤", "✦", "♡"][index]}
            </span>
            {name}
            {index === 4 && pendingLeaves > 0 && (
              <span className="nav-count">{pendingLeaves}</span>
            )}
          </button>
        ))}

        <div className="sidebar-bottom">
          <span className="online-dot" />
          <div>
            <strong>Workspace Active</strong>
            <small>Local data storage</small>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">PAYFLOW / WORKSPACE</p>
            <h1>{pageNames[page]}</h1>
            <p className="muted">
              Manage your people. Simplify your payroll.
            </p>
          </div>

          <div className="top-actions">
            <button
              className="icon-btn"
              onClick={() => setDark(!dark)}
              title="Toggle theme"
            >
              {dark ? "☀" : "☾"}
            </button>

            <span className="admin-chip">
              <span className="avatar">HR</span> HR Admin
            </span>
          </div>
        </header>

        {notice && (
          <div className="notice" role="status">
            <span>✦ &nbsp;{notice}</span>
            <button
              onClick={() => setNotice("")}
              aria-label="Close notice"
            >
              ×
            </button>
          </div>
        )}

        {page === 0 && (
          <>
            <section className="hero">
              <div className="hero-content">
                <span className="hero-tag">✦ PEOPLE FIRST</span>
                <h2>
                  Your team.
                  <br />
                  Your numbers. One place.
                </h2>
                <p>
                  Every employee and every salary, connected in one workspace.
                </p>
                <button
                  className="primary-btn"
                  onClick={() => navigateTo(1)}
                >
                  Get started <span>→</span>
                </button>
              </div>

              <div className="hero-orbit orbit-one" />
              <div className="hero-orbit orbit-two" />
              <div className="hero-star">✳</div>
            </section>

            <section className="stats-grid">
              <Stat
                title="Total Employees"
                value={employees.length}
                note="Registered team members"
                icon="♙"
                color="purple"
              />

              <Stat
                title="Monthly Payroll"
                value={money(payroll)}
                note="Current net salary total"
                icon="₹"
                color="mint"
              />

              <Stat
                title="Present Today"
                value={`${presentCount}/${employees.length}`}
                note={`${
                  employees.length
                    ? Math.round(
                        (presentCount / employees.length) * 100
                      )
                    : 0
                }% attendance`}
                icon="✓"
                color="peach"
              />

              <Stat
                title="Pending Leaves"
                value={pendingLeaves}
                note="Requests to review"
                icon="◷"
                color="blue"
              />
            </section>

            <section className="panel">
              <div className="section-head">
                <div>
                  <h2>Quick Actions</h2>
                  <p className="muted">Jump to a task</p>
                </div>
              </div>

              <div className="quick-grid">
                <Quick
                  title="Add Employee"
                  icon="＋"
                  onClick={() => {
                    setEmployeeForm(emptyEmployee);
                    setEditingId(null);
                    navigateTo(1);
                  }}
                />

                <Quick
                  title="Calculate Salary"
                  icon="₹"
                  onClick={() => navigateTo(2)}
                />

                <Quick
                  title="Mark Attendance"
                  icon="✓"
                  onClick={() => navigateTo(3)}
                />

                <Quick
                  title="View Reports"
                  icon="↗"
                  onClick={() => navigateTo(4)}
                />

                <Quick
                  title="Workforce Intelligence"
                  icon="✦"
                  onClick={() => navigateTo(5)}
                />

                <Quick
                  title="Financial Wellness"
                  icon="♡"
                  onClick={() => navigateTo(6)}
                />
              </div>
            </section>

            <section className="panel">
              <div className="section-head">
                <div>
                  <h2>Recent Employees</h2>
                  <p className="muted">
                    Latest saved employee records
                  </p>
                </div>

                <button
                  className="secondary-btn"
                  onClick={() => navigateTo(1)}
                >
                  View all →
                </button>
              </div>

              <EmployeeTable
                employees={employees.slice(-4).reverse()}
                onEdit={editEmployee}
                onDelete={deleteEmployee}
                onSlip={printSalarySlip}
              />
            </section>
          </>
        )}

        {page === 1 && (
          <>
            <section className="panel">
              <div className="section-head">
                <div>
                  <h2>
                    {editingId ? "Edit Employee" : "Register Employee"}
                  </h2>
                  <p className="muted">
                    Saved details will be shared with salary and attendance pages.
                  </p>
                </div>

                {editingId && (
                  <button
                    className="secondary-btn"
                    onClick={() => {
                      setEditingId(null);
                      setEmployeeForm(emptyEmployee);
                    }}
                  >
                    Cancel edit
                  </button>
                )}
              </div>

              <form className="form-grid" onSubmit={saveEmployee}>
                <Field label="Employee ID">
                  <input
                    name="id"
                    value={employeeForm.id}
                    onChange={handleEmployeeChange}
                    placeholder="EMP104"
                    required
                  />
                </Field>

                <Field label="Full Name">
                  <input
                    name="name"
                    value={employeeForm.name}
                    onChange={handleEmployeeChange}
                    placeholder="Employee name"
                    required
                  />
                </Field>

                <Field label="Job Role">
                  <input
                    name="role"
                    value={employeeForm.role}
                    onChange={handleEmployeeChange}
                    placeholder="Job title"
                    required
                  />
                </Field>

                <Field label="Department">
                  <select
                    name="department"
                    value={employeeForm.department}
                    onChange={handleEmployeeChange}
                  >
                    {[
                      "IT",
                      "HR",
                      "Finance",
                      "Design",
                      "Marketing",
                      "Operations",
                    ].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Basic Salary (₹)">
                  <input
                    type="number"
                    min="0"
                    name="basic"
                    value={employeeForm.basic}
                    onChange={handleEmployeeChange}
                    required
                  />
                </Field>

                <Field label="Allowance (₹)">
                  <input
                    type="number"
                    min="0"
                    name="allowance"
                    value={employeeForm.allowance}
                    onChange={handleEmployeeChange}
                    required
                  />
                </Field>

                <Field label="Deduction (₹)">
                  <input
                    type="number"
                    min="0"
                    name="deduction"
                    value={employeeForm.deduction}
                    onChange={handleEmployeeChange}
                    required
                  />
                </Field>

                <Field label="Initial Attendance">
                  <select
                    name="attendance"
                    value={employeeForm.attendance}
                    onChange={handleEmployeeChange}
                  >
                    {["Present", "Absent", "Leave"].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </Field>

                <div className="form-actions">
                  <button className="primary-btn" type="submit">
                    {editingId ? "Save Changes ✓" : "+ Add Employee"}
                  </button>

                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={() => {
                      setEmployeeForm(emptyEmployee);
                      setEditingId(null);
                    }}
                  >
                    Clear Form
                  </button>
                </div>
              </form>
            </section>

            <section className="panel">
              <div className="section-head">
                <div>
                  <h2>Employee Directory</h2>
                  <p className="muted">
                    {filteredEmployees.length} employee(s) found
                  </p>
                </div>

                <button className="secondary-btn" onClick={exportCSV}>
                  ↓ Export CSV
                </button>
              </div>

              <Filters
                search={search}
                setSearch={setSearch}
                department={filterDepartment}
                setDepartment={setFilterDepartment}
              />

              <EmployeeTable
                employees={filteredEmployees}
                onEdit={editEmployee}
                onDelete={deleteEmployee}
                onSlip={printSalarySlip}
              />
            </section>
          </>
        )}

        {page === 2 && (
          <>
            <section className="panel">
              <div className="section-head">
                <div>
                  <h2>Salary Calculator</h2>
                  <p className="muted">
                    Select an employee to calculate and save their salary.
                  </p>
                </div>
              </div>

              {employees.length === 0 ? (
                <Empty
                  text="Add an employee before calculating salary."
                  onClick={() => navigateTo(1)}
                />
              ) : (
                <form className="form-grid" onSubmit={calculateSalary}>
                  <Field label="Select Employee">
                    <select
                      value={selectedId}
                      onChange={(event) =>
                        selectEmployee(event.target.value)
                      }
                      required
                    >
                      <option value="">Choose employee</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.id} — {employee.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Basic Salary (₹)">
                    <input
                      value={
                        selectedEmployee
                          ? money(selectedEmployee.basic)
                          : ""
                      }
                      readOnly
                      placeholder="Select employee"
                    />
                  </Field>

                  <Field label="Allowance (₹)">
                    <input
                      type="number"
                      min="0"
                      value={salaryForm.allowance}
                      onChange={(event) =>
                        setSalaryForm({
                          ...salaryForm,
                          allowance: event.target.value,
                        })
                      }
                      required
                    />
                  </Field>

                  <Field label="Deduction (₹)">
                    <input
                      type="number"
                      min="0"
                      value={salaryForm.deduction}
                      onChange={(event) =>
                        setSalaryForm({
                          ...salaryForm,
                          deduction: event.target.value,
                        })
                      }
                      required
                    />
                  </Field>

                  <div className="salary-preview">
                    <span>ESTIMATED NET SALARY</span>
                    <strong>
                      {selectedEmployee &&
                      salaryForm.allowance !== "" &&
                      salaryForm.deduction !== "" &&
                      Number(salaryForm.allowance) >= 0 &&
                      Number(salaryForm.deduction) >= 0
                        ? money(
                            Number(selectedEmployee.basic) +
                              Number(salaryForm.allowance) -
                              Number(salaryForm.deduction)
                          )
                        : money(0)}
                    </strong>
                    <small>Basic + Allowance − Deduction</small>
                  </div>

                  <div className="form-actions">
                    <button className="primary-btn" type="submit">
                      Calculate & Save ✓
                    </button>

                    {selectedEmployee && (
                      <button
                        className="secondary-btn"
                        type="button"
                        onClick={() =>
                          printSalarySlip(selectedEmployee)
                        }
                      >
                        Print Salary Slip
                      </button>
                    )}
                  </div>
                </form>
              )}
            </section>

            <section className="panel">
              <div className="section-head">
                <div>
                  <h2>Saved Payroll Records</h2>
                  <p className="muted">
                    Calculated salaries shared with Dashboard and Reports.
                  </p>
                </div>

                <button className="secondary-btn" onClick={exportCSV}>
                  ↓ Export CSV
                </button>
              </div>

              <EmployeeTable
                employees={employees}
                onEdit={editEmployee}
                onDelete={deleteEmployee}
                onSlip={printSalarySlip}
              />
            </section>
          </>
        )}

        {page === 3 && (
          <>
            <section className="stats-grid attendance-stats">
              <Stat
                title="Present"
                value={presentCount}
                note="Marked present today"
                icon="✓"
                color="mint"
              />

              <Stat
                title="Absent"
                value={
                  employees.filter(
                    (e) => getAttendance(e) === "Absent"
                  ).length
                }
                note="Marked absent today"
                icon="×"
                color="peach"
              />

              <Stat
                title="On Leave"
                value={
                  employees.filter(
                    (e) => getAttendance(e) === "Leave"
                  ).length
                }
                note="Marked on leave today"
                icon="◷"
                color="purple"
              />
            </section>

            <section className="panel">
              <div className="section-head">
                <div>
                  <h2>Daily Attendance Register</h2>
                  <p className="muted">
                    Date: {new Date().toLocaleDateString("en-IN")} · Changes are saved automatically.
                  </p>
                </div>
              </div>

              {employees.length === 0 ? (
                <Empty
                  text="Add employees to start attendance tracking."
                  onClick={() => navigateTo(1)}
                />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Department</th>
                        <th>Attendance</th>
                      </tr>
                    </thead>

                    <tbody>
                      {employees.map((employee) => (
                        <tr key={employee.id}>
                          <td>
                            <strong>{employee.name}</strong>
                            <small>{employee.id}</small>
                          </td>

                          <td>{employee.department}</td>

                          <td>
                            <select
                              className="status-select"
                              value={getAttendance(employee)}
                              onChange={(event) =>
                                markAttendance(
                                  employee.id,
                                  event.target.value
                                )
                              }
                            >
                              {["Present", "Absent", "Leave"].map(
                                (status) => (
                                  <option key={status}>{status}</option>
                                )
                              )}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {page === 4 && (
          <>
            <section className="stats-grid">
              <Stat
                title="Total Employees"
                value={employees.length}
                note="Current employee records"
                icon="♙"
                color="purple"
              />

              <Stat
                title="Net Payroll"
                value={money(payroll)}
                note="Combined employee salaries"
                icon="₹"
                color="mint"
              />

              <Stat
                title="Pending Leaves"
                value={pendingLeaves}
                note="Awaiting approval"
                icon="◷"
                color="peach"
              />
            </section>

            <section className="panel">
              <div className="section-head">
                <div>
                  <h2>Payroll Reports</h2>
                  <p className="muted">
                    Download a report containing current salary and attendance data.
                  </p>
                </div>
              </div>

              <div className="report-card">
                <div className="report-icon">▤</div>

                <div className="report-info">
                  <strong>Monthly Payroll Report</strong>
                  <small>
                    {employees.length} employees · CSV spreadsheet
                  </small>
                </div>

                <button className="primary-btn" onClick={exportCSV}>
                  ↓ Download CSV
                </button>
              </div>

              <div className="report-summary">
                <span>
                  Basic salary total
                  <strong>
                    {money(
                      employees.reduce(
                        (sum, e) => sum + Number(e.basic),
                        0
                      )
                    )}
                  </strong>
                </span>

                <span>
                  Allowance total
                  <strong>
                    {money(
                      employees.reduce(
                        (sum, e) =>
                          sum +
                          Number(
                            salaries[e.id]?.allowance ?? e.allowance
                          ),
                        0
                      )
                    )}
                  </strong>
                </span>

                <span>
                  Deduction total
                  <strong>
                    {money(
                      employees.reduce(
                        (sum, e) =>
                          sum +
                          Number(
                            salaries[e.id]?.deduction ?? e.deduction
                          ),
                        0
                      )
                    )}
                  </strong>
                </span>

                <span>
                  Net salary total
                  <strong className="mint-text">
                    {money(payroll)}
                  </strong>
                </span>
              </div>
            </section>

            <section className="panel">
              <div className="section-head">
                <div>
                  <h2>Leave Requests</h2>
                  <p className="muted">
                    Submit and manage employee leave requests.
                  </p>
                </div>
              </div>

              <form className="form-grid" onSubmit={addLeave}>
                <Field label="Employee Name">
                  <input
                    value={leaveForm.name}
                    onChange={(event) =>
                      setLeaveForm({
                        ...leaveForm,
                        name: event.target.value,
                      })
                    }
                    placeholder="Enter employee name"
                    required
                  />
                </Field>

                <Field label="Leave Type">
                  <select
                    value={leaveForm.type}
                    onChange={(event) =>
                      setLeaveForm({
                        ...leaveForm,
                        type: event.target.value,
                      })
                    }
                  >
                    {[
                      "Casual Leave",
                      "Sick Leave",
                      "Personal Leave",
                      "Annual Leave",
                    ].map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Number of Days">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={leaveForm.days}
                    onChange={(event) =>
                      setLeaveForm({
                        ...leaveForm,
                        days: event.target.value,
                      })
                    }
                    required
                  />
                </Field>

                <div className="form-actions">
                  <button className="primary-btn" type="submit">
                    + Submit Request
                  </button>
                </div>
              </form>

              <div className="table-wrap leave-table">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Leave Type</th>
                      <th>Days</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {leaves.map((leave) => (
                      <tr key={leave.id}>
                        <td>{leave.name}</td>
                        <td>{leave.type}</td>
                        <td>{leave.days}</td>

                        <td>
                          <span
                            className={`status ${leave.status.toLowerCase()}`}
                          >
                            {leave.status}
                          </span>
                        </td>

                        <td>
                          {leave.status === "Pending" ? (
                            <div className="row-actions">
                              <button
                                className="approve-btn"
                                onClick={() =>
                                  updateLeave(leave.id, "Approved")
                                }
                              >
                                Approve
                              </button>

                              <button
                                className="delete-btn"
                                onClick={() =>
                                  updateLeave(leave.id, "Rejected")
                                }
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}

                    {leaves.length === 0 && (
                      <tr>
                        <td colSpan="5" className="empty">
                          No leave requests yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="panel danger-panel">
              <h2>Demo Data Settings</h2>
              <p className="muted">
                Reset all employees, salary records, attendance and leave requests saved in this browser.
              </p>
              <button
                className="delete-btn reset-btn"
                onClick={clearDemoData}
              >
                Reset Demo Data
              </button>
            </section>
          </>
        )}

        {page === 5 && (
          <WorkforceHub
            employees={employees}
            showNotice={showNotice}
          />
        )}

        {page === 6 && (
          <EmployeeWellness
            employees={employees}
            salaries={salaries}
          />
        )}

        <footer className="footer">
          <span>PAYFLOW · PAYROLL MANAGEMENT SYSTEM</span>
          <span>
            Page {page + 1} of {pageNames.length} · Data saved locally
          </span>
        </footer>

        <div className="page-controls">
          <button
            className="secondary-btn"
            disabled={page === 0}
            onClick={() => navigateTo(page - 1)}
          >
            ← Previous
          </button>

          <div className="page-dots">
            {pageNames.map((name, index) => (
              <button
                key={name}
                title={name}
                aria-label={`Go to ${name}`}
                className={page === index ? "dot current" : "dot"}
                onClick={() => navigateTo(index)}
              />
            ))}
          </div>

          {page < pageNames.length - 1 ? (
            <button
              className="primary-btn"
              onClick={() => navigateTo(page + 1)}
            >
              Next: {pageNames[page + 1]} →
            </button>
          ) : (
            <button
              className="primary-btn"
              onClick={() => navigateTo(0)}
            >
              Back to Dashboard ↗
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function Stat({ title, value, note, icon, color }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-top">
        <span>{title}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <h2>{value}</h2>
      <p>{note}</p>
      <div className="mini-track">
        <span />
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="field">{label}{children}</label>;
}

function Quick({ title, icon, onClick }) {
  return (
    <button className="quick-card" onClick={onClick}>
      <span>{icon}</span>
      <strong>{title}</strong>
      <b>→</b>
    </button>
  );
}

function Filters({
  search,
  setSearch,
  department,
  setDepartment,
}) {
  return (
    <div className="filters">
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="⌕ Search name, ID, role..."
        aria-label="Search employees"
      />

      <select
        value={department}
        onChange={(event) => setDepartment(event.target.value)}
        aria-label="Filter department"
      >
        {[
          "All",
          "IT",
          "HR",
          "Finance",
          "Design",
          "Marketing",
          "Operations",
        ].map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </div>
  );
}

function EmployeeTable({
  employees,
  onEdit,
  onDelete,
  onSlip,
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Department</th>
            <th>Basic Salary</th>
            <th>Net Salary</th>
            <th>Attendance</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td>
                <div className="employee-cell">
                  <span className="employee-avatar">
                    {employee.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>

                  <span>
                    <strong>{employee.name}</strong>
                    <small>
                      {employee.id} · {employee.role}
                    </small>
                  </span>
                </div>
              </td>

              <td>
                <span className="department-tag">
                  {employee.department}
                </span>
              </td>

              <td>{money(employee.basic)}</td>

              <td className="net-salary">
                {money(netSalary(employee))}
              </td>

              <td>
                <span
                  className={`status ${employee.attendance.toLowerCase()}`}
                >
                  {employee.attendance}
                </span>
              </td>

              <td>
                <div className="row-actions">
                  <button
                    className="edit-btn"
                    onClick={() => onEdit(employee)}
                  >
                    Edit
                  </button>

                  <button
                    className="slip-btn"
                    onClick={() => onSlip(employee)}
                  >
                    Slip
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => onDelete(employee)}
                  >
                    ×
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {employees.length === 0 && (
            <tr>
              <td colSpan="6" className="empty">
                No employees yet. Add one using the Employee Details page.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Empty({ text, onClick }) {
  return (
    <div className="empty-state">
      <p>{text}</p>
      <button className="primary-btn" onClick={onClick}>
        Go to Employee Details →
      </button>
    </div>
  );
}

// ---------------------------------------------------------
// EMPLOYEE FINANCIAL WELLNESS PLANNER
// ---------------------------------------------------------

const formDefaults = {
  food: "4000",
  rent: "6000",
  travel: "2000",
  bills: "1500",
  personal: "1500",
  family: "2000",
  savingsGoal: "5000",
  emergencyTarget: "30000",
  emergencySaved: "5000",
};

function EmployeeWellness({ employees, salaries }) {
  const [selectedId, setSelectedId] = useState(
    employees[0]?.id || ""
  );

  const [plans, setPlans] = useState(() => {
    try {
      return (
        JSON.parse(
          localStorage.getItem("payflow-financial-wellness-v1")
        ) || {}
      );
    } catch {
      return {};
    }
  });

  const [form, setForm] = useState({ ...formDefaults });
  const [message, setMessage] = useState("");

  const employee = employees.find(
    (item) => item.id === selectedId
  );

  const salaryRecord = employee
    ? salaries[employee.id]
    : null;

  const monthlySalary = employee
    ? Number(
        salaryRecord?.net ??
          (Number(employee.basic || 0) +
            Number(employee.allowance || 0) -
            Number(employee.deduction || 0))
      )
    : 0;

  useEffect(() => {
    if (!selectedId) return;

    const saved = plans[selectedId];

    setForm(
      saved
        ? { ...formDefaults, ...saved }
        : { ...formDefaults }
    );

    setMessage("");
  }, [selectedId, plans]);

  const expenseKeys = [
    "food",
    "rent",
    "travel",
    "bills",
    "personal",
    "family",
  ];

  const totalExpenses = expenseKeys.reduce(
    (sum, key) => sum + Number(form[key] || 0),
    0
  );

  const savingsGoal = Number(form.savingsGoal || 0);
  const emergencyTarget = Number(form.emergencyTarget || 0);
  const emergencySaved = Number(form.emergencySaved || 0);

  const balance =
    monthlySalary - totalExpenses - savingsGoal;

  const emergencyProgress =
    emergencyTarget > 0
      ? Math.min(
          100,
          Math.round(
            (emergencySaved / emergencyTarget) * 100
          )
        )
      : 0;

  function updateField(event) {
    const { name, value } = event.target;

    setForm((old) => ({
      ...old,
      [name]: value,
    }));
  }

  function savePlan(event) {
    event.preventDefault();

    if (!selectedId) {
      setMessage("Please add and select an employee first.");
      return;
    }

    const updated = {
      ...plans,
      [selectedId]: form,
    };

    setPlans(updated);

    localStorage.setItem(
      "payflow-financial-wellness-v1",
      JSON.stringify(updated)
    );

    setMessage("Financial plan saved successfully.");
  }

  const suggestions = [];

  if (balance < 0) {
    suggestions.push(
      "Your planned expenses and savings are higher than your monthly salary. Reduce one or more expense categories."
    );
  } else if (balance < monthlySalary * 0.1) {
    suggestions.push(
      "Your remaining balance is low. Try to keep at least 10% of salary as a buffer."
    );
  } else {
    suggestions.push(
      "Your plan leaves a useful monthly balance. Keep tracking expenses to maintain it."
    );
  }

  if (emergencyProgress < 100) {
    suggestions.push(
      "Build your emergency fund gradually until it reaches your target."
    );
  }

  if (savingsGoal === 0) {
    suggestions.push(
      "Set a monthly savings goal, even if you start with a small amount."
    );
  }

  return (
    <div className="wellness-page">
      <style>{`
        .wellness-page {
          color: #29334b;
        }

        .wellness-hero {
          padding: 26px;
          border-radius: 20px;
          background: linear-gradient(
            120deg,
            #e9e7ff,
            #e1f7f0 58%,
            #fff0e5
          );
          margin-bottom: 20px;
        }

        .wellness-hero h2 {
          font-size: 25px;
          margin: 0 0 8px;
          color: #34365e;
        }

        .wellness-hero p {
          margin: 0;
          color: #68718a;
          line-height: 1.6;
        }

        .wellness-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin: 18px 0;
        }

        .wellness-card {
          background: #fff;
          border: 1px solid #e9eaf2;
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 5px 18px #252b4310;
        }

        .wellness-card small {
          display: block;
          color: #7c8499;
          font-size: 12px;
          margin-bottom: 9px;
        }

        .wellness-card strong {
          font-size: 23px;
          color: #35395e;
        }

        .wellness-card p {
          font-size: 12px;
          color: #8a91a4;
          margin: 7px 0 0;
        }

        .wellness-layout {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 18px;
        }

        .wellness-panel {
          background: #fff;
          border: 1px solid #e9eaf2;
          border-radius: 17px;
          padding: 20px;
          margin-bottom: 18px;
        }

        .wellness-panel h3 {
          margin: 0 0 6px;
          color: #373b60;
          font-size: 17px;
        }

        .wellness-muted {
          font-size: 13px;
          color: #858da0;
          margin: 0 0 17px;
        }

        .wellness-fields {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 13px;
        }

        .wellness-fields label {
          font-size: 12px;
          color: #68718a;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .wellness-fields input,
        .wellness-select {
          width: 100%;
          box-sizing: border-box;
          padding: 11px;
          border: 1px solid #e2e5ef;
          border-radius: 9px;
          background: #fbfcff;
          color: #303650;
          outline: none;
        }

        .wellness-fields input:focus,
        .wellness-select:focus {
          border-color: #9b91e9;
        }

        .wellness-save {
          margin-top: 17px;
          border: 0;
          border-radius: 10px;
          padding: 12px 18px;
          background: #7669cf;
          color: white;
          font-weight: 700;
          cursor: pointer;
        }

        .wellness-progress {
          height: 9px;
          border-radius: 10px;
          background: #edf0f6;
          overflow: hidden;
          margin: 12px 0;
        }

        .wellness-progress span {
          display: block;
          height: 100%;
          background: linear-gradient(90deg, #8b80e2, #72cbb1);
          border-radius: 10px;
        }

        .wellness-tip {
          padding: 12px 14px;
          border-radius: 11px;
          background: #f2f0ff;
          color: #55557d;
          font-size: 13px;
          line-height: 1.5;
          margin-top: 10px;
        }

        .wellness-success {
          color: #27866c;
          font-size: 13px;
          margin-top: 12px;
        }

        .wellness-warning {
          color: #b45d4b !important;
        }

        .wellness-breakdown {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #f0f1f5;
          font-size: 13px;
          color: #68718a;
        }

        .wellness-breakdown b {
          color: #363b5d;
        }

        @media (max-width: 800px) {
          .wellness-layout {
            grid-template-columns: 1fr;
          }

          .wellness-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 520px) {
          .wellness-fields {
            grid-template-columns: 1fr;
          }

          .wellness-hero {
            padding: 19px;
          }
        }
      `}</style>

      <section className="wellness-hero">
        <h2>Make your salary work smarter.</h2>
        <p>
          Plan monthly expenses, set savings goals and build an
          emergency fund. Your plan is saved separately in this browser.
        </p>
      </section>

      <section className="wellness-panel">
        <h3>Choose Employee</h3>
        <p className="wellness-muted">
          The salary value is taken from the existing payroll record.
        </p>

        <select
          className="wellness-select"
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
        >
          <option value="">Select employee</option>

          {employees.map((item) => (
            <option key={item.id} value={item.id}>
              {item.id} — {item.name}
            </option>
          ))}
        </select>

        {!employees.length && (
          <p className="wellness-muted">
            Add an employee in Employee Details to begin.
          </p>
        )}
      </section>

      <div className="wellness-grid">
        <div className="wellness-card">
          <small>MONTHLY TAKE-HOME SALARY</small>
          <strong>{money(monthlySalary)}</strong>
          <p>Based on saved payroll details</p>
        </div>

        <div className="wellness-card">
          <small>PLANNED MONTHLY EXPENSES</small>
          <strong>{money(totalExpenses)}</strong>
          <p>Across six expense categories</p>
        </div>

        <div className="wellness-card">
          <small>AVAILABLE AFTER PLAN</small>
          <strong className={balance < 0 ? "wellness-warning" : ""}>
            {money(balance)}
          </strong>
          <p>Salary − expenses − savings goal</p>
        </div>
      </div>

      <div className="wellness-layout">
        <form className="wellness-panel" onSubmit={savePlan}>
          <h3>Monthly Expense Planner</h3>
          <p className="wellness-muted">
            Enter your planned monthly amounts in rupees.
          </p>

          <div className="wellness-fields">
            <label>
              Food & groceries (₹)
              <input
                type="number"
                min="0"
                name="food"
                value={form.food}
                onChange={updateField}
              />
            </label>

            <label>
              House rent (₹)
              <input
                type="number"
                min="0"
                name="rent"
                value={form.rent}
                onChange={updateField}
              />
            </label>

            <label>
              Travel (₹)
              <input
                type="number"
                min="0"
                name="travel"
                value={form.travel}
                onChange={updateField}
              />
            </label>

            <label>
              Bills & utilities (₹)
              <input
                type="number"
                min="0"
                name="bills"
                value={form.bills}
                onChange={updateField}
              />
            </label>

            <label>
              Personal expenses (₹)
              <input
                type="number"
                min="0"
                name="personal"
                value={form.personal}
                onChange={updateField}
              />
            </label>

            <label>
              Family expenses (₹)
              <input
                type="number"
                min="0"
                name="family"
                value={form.family}
                onChange={updateField}
              />
            </label>

            <label>
              Monthly savings goal (₹)
              <input
                type="number"
                min="0"
                name="savingsGoal"
                value={form.savingsGoal}
                onChange={updateField}
              />
            </label>

            <label>
              Emergency fund target (₹)
              <input
                type="number"
                min="0"
                name="emergencyTarget"
                value={form.emergencyTarget}
                onChange={updateField}
              />
            </label>

            <label>
              Emergency fund saved (₹)
              <input
                type="number"
                min="0"
                name="emergencySaved"
                value={form.emergencySaved}
                onChange={updateField}
              />
            </label>
          </div>

          <button className="wellness-save" type="submit">
            Save Financial Plan
          </button>

          {message && (
            <p className="wellness-success">{message}</p>
          )}
        </form>

        <div>
          <section className="wellness-panel">
            <h3>Expense Summary</h3>
            <p className="wellness-muted">
              Where your monthly salary is planned to go.
            </p>

            {[
              ["Food & groceries", form.food],
              ["House rent", form.rent],
              ["Travel", form.travel],
              ["Bills & utilities", form.bills],
              ["Personal", form.personal],
              ["Family", form.family],
              ["Savings goal", form.savingsGoal],
            ].map(([label, value]) => (
              <div className="wellness-breakdown" key={label}>
                <span>{label}</span>
                <b>{money(value)}</b>
              </div>
            ))}
          </section>

          <section className="wellness-panel">
            <h3>Emergency Fund Progress</h3>
            <p className="wellness-muted">
              {money(emergencySaved)} saved of {money(emergencyTarget)}
            </p>

            <div className="wellness-progress">
              <span
                style={{
                  width: `${emergencyProgress}%`,
                }}
              />
            </div>

            <strong>{emergencyProgress}% completed</strong>
          </section>

          <section className="wellness-panel">
            <h3>Smart Money Suggestions</h3>

            {suggestions.map((tip, index) => (
              <div className="wellness-tip" key={index}>
                {tip}
              </div>
            ))}

            {balance < 0 && (
              <div className="wellness-tip wellness-warning">
                Your plan currently exceeds your salary.
                Review the amounts before following this plan.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;