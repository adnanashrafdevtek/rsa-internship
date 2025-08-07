import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Student from "./pages/Users";
import ClassApp from "./pages/ClassApp";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import ResetPassword from "./pages/ResetPassword";
import Schedule from "./pages/Schedule";
import TeacherList from "./pages/TeacherList";
import StudentList from "./pages/StudentList";
import AddUserPage from "./pages/AddUserPage";
import ClassRosters from "./pages/ClassRosters"; // ✅ NEW
import ActivationForm from "./pages/ActivationForm";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/class"
            element={
              <ProtectedRoute>
                <ClassApp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student"
            element={
              <ProtectedRoute>
                <Student />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedule"
            element={
              <ProtectedRoute>
                <Schedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/schedules"
            element={
              <ProtectedRoute>
                <TeacherList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/schedules"
            element={
              <StudentList />
            }
          />
          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />
          <Route
            path="/rosters"
            element={
              <ProtectedRoute>
                <ClassRosters />
              </ProtectedRoute>
            }
          />
          <Route
          path="/add-user" 
          element={
            <ProtectedRoute>
          <AddUserPage />
          </ProtectedRoute>
          }
          />
          <Route
          path="/activation-form" element={<ActivationForm />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
