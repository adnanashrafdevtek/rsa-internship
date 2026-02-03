import React from "react";

export default function StudentSchedules({
  students,
  selectedStudent,
  studentEvents,
  handleStudentSelect,
  renderCalendar
}) {
  return (
    <>
      <div style={{
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "12px 16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        marginBottom: "12px"
      }}>
        <h1 style={{
          fontSize: 20,
          fontWeight: "bold",
          margin: 0,
          color: "#2c3e50",
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}>
          🧑‍🎓 Student Schedules
        </h1>
      </div>

      <div style={{ display: "flex", gap: "16px", height: "calc(100vh - 200px)" }}>
        <div style={{
          width: "300px",
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          overflowY: "auto"
        }}>
          <h3 style={{ margin: "0 0 16px 0", color: "#2c3e50" }}>Select Student</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {students.map(student => (
              <button
                key={student.id}
                onClick={() => handleStudentSelect(student)}
                style={{
                  padding: "12px",
                  border: "2px solid #e1e8ed",
                  borderRadius: "8px",
                  backgroundColor: selectedStudent?.id === student.id ? "#3498db" : "white",
                  color: selectedStudent?.id === student.id ? "white" : "#2c3e50",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  if (selectedStudent?.id !== student.id) {
                    e.target.style.backgroundColor = "#f8f9fa";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedStudent?.id !== student.id) {
                    e.target.style.backgroundColor = "white";
                  }
                }}
              >
                <div style={{ fontWeight: "600" }}>
                  {student.first_name} {student.last_name}
                </div>
                <div style={{ fontSize: "12px", opacity: 0.8 }}>
                  ID: {student.id}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {selectedStudent ? (
            <>
              <div style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "12px 16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                marginBottom: "12px"
              }}>
                <h3 style={{ margin: 0, color: "#2c3e50" }}>
                  Schedule for {selectedStudent.first_name} {selectedStudent.last_name}
                </h3>
              </div>
              {renderCalendar(studentEvents, "student-schedule")}
            </>
          ) : (
            <div style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "40px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              textAlign: "center",
              color: "#7f8c8d"
            }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🧑‍🎓</div>
              <h3 style={{ margin: "0 0 8px 0", color: "#2c3e50" }}>Select a Student</h3>
              <p style={{ margin: 0 }}>Choose a student from the list to view their schedule</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
