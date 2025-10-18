import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Classes from "./pages/Classes";
import Student from "./pages/Users";
import TeacherList from "./pages/TeacherList";
import StudentList from "./pages/StudentList";
import ResetPassword from "./pages/ResetPassword";
import ClassRosters from "./pages/ClassRosters";
import AddUserPage from "./pages/AddUserPage";
import ActivationForm from "./pages/ActivationForm";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { SidebarProvider } from "./context/SidebarContext";
import './App.css';

import MySchedule from "./pages/MySchedule";
import Schedules from "./pages/Schedules";
import CreateSchedule from "./pages/CreateSchedule";
import TeacherAvailability from "./pages/TeacherAvailability";
import TeacherHome from "./pages/TeacherHome";
import StudentHome from "./pages/StudentHome";
import TeacherSchedule from "./pages/TeacherSchedule";
import StudentSchedule from "./pages/StudentSchedule";


function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
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
                <Classes />
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
                <Schedules />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher-list"
            element={
              <ProtectedRoute>
                <TeacherList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-list"
            element={
              <ProtectedRoute>
                <StudentList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />
          <Route
            path="/rosters/:classId"
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
            path="/activation-form"
            element={<ActivationForm />}
          />
          <Route
            path="/my-schedule"
            element={
              <ProtectedRoute>
                <MySchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher-dashboard"
            element={
              <ProtectedRoute>
                <TeacherHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute>
                <StudentHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher-schedule"
            element={
              <ProtectedRoute>
                <TeacherSchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-schedule"
            element={
              <ProtectedRoute>
                <StudentSchedule />
              </ProtectedRoute>
            }
          />
          <Route path="/schedules" element={<Schedules />} />
          <Route path="/create-schedule" element={<ProtectedRoute><CreateSchedule /></ProtectedRoute>} />
          <Route path="/availability" element={<TeacherAvailability />} />
        </Routes>
      </Router>
      </SidebarProvider>
    </AuthProvider>
  );
}

export default App;