import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../App.css";
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line
} from "recharts";

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  // Admin data
  const [userStats, setUserStats] = useState([]);
  const [classesToday, setClassesToday] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [pendingTasks, setPendingTasks] = useState(null);

  // Student/Teacher schedule
  const [schedule, setSchedule] = useState([]);
  const [nextClass, setNextClass] = useState(null);
  const [nextBreak, setNextBreak] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const capitalizeFirst = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch admin data
  useEffect(() => {
    if (user?.role !== "admin") return;

    const fetchAdminData = async () => {
      try {
        // Example API endpoints – replace with real ones
        const usersRes = await fetch("http://localhost:3001/admin/users/stats");
        const classesRes = await fetch("http://localhost:3001/admin/classes/today");
        const attendanceRes = await fetch("http://localhost:3001/admin/attendance/week");
        const tasksRes = await fetch("http://localhost:3001/admin/tasks/pending");

        const usersData = await usersRes.json();        // [{role: 'student', count: 120}, ...]
        const classesData = await classesRes.json();    // [{teacher: 'Mr. Smith', count: 3}, ...]
        const attendanceWeek = await attendanceRes.json(); // [{day: 'Mon', attendance: 95}, ...]
        const tasksData = await tasksRes.json();        // number

        setUserStats(usersData);
        setClassesToday(classesData);
        setAttendanceData(attendanceWeek);
        setPendingTasks(tasksData.count);
      } catch (err) {
        console.error("Error fetching admin data:", err);
      }
    };

    fetchAdminData();
  }, [user]);

  // Fetch schedule for student/teacher
  useEffect(() => {
    if (!user || user.role === "admin") return;

    const fetchSchedule = async () => {
      try {
        const res = await fetch(`http://localhost:3001/${user.role}/schedule`);
        const data = await res.json();
        setSchedule(data);

        const now = new Date();
        const upcoming = data
          .map((cls) => ({
            ...cls,
            start: new Date(cls.start_time),
            end: new Date(cls.end_time),
          }))
          .filter((cls) => cls.start > now)
          .sort((a, b) => a.start - b.start);

        if (upcoming.length > 0) {
          setNextClass(upcoming[0]);

          const prev = data
            .map((cls) => ({
              ...cls,
              start: new Date(cls.start_time),
              end: new Date(cls.end_time),
            }))
            .filter((cls) => cls.end < upcoming[0].start)
            .sort((a, b) => b.end - a.end)[0];

          if (prev && prev.end < upcoming[0].start) {
            setNextBreak({
              start: prev.end,
              end: upcoming[0].start,
            });
          } else {
            setNextBreak(null);
          }
        }
      } catch (err) {
        console.error("Failed to fetch schedule:", err);
      }
    };

    fetchSchedule();
  }, [user]);

  // Colors for PieChart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar onLogout={handleLogout} />

      <div style={{ flex: 1, backgroundColor: "white", padding: "40px", marginLeft: 300, overflowY: "auto" }}>
        <h1 style={{ fontSize: "36px", fontWeight: "bold", marginBottom: "10px" }}>
          Welcome, <span style={{ color: "#26bedd" }}>{capitalizeFirst(user?.username)}</span>
        </h1>

        <p style={{ fontSize: "20px", marginBottom: "20px", color: "#333" }}>
          {time.toLocaleTimeString()}
        </p>

        {/* Admin Dashboard */}
        {user?.role === "admin" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            {/* Users Pie Chart */}
            <div style={cardStyle}>
              <h3>User Roles</h3>
              <PieChart width={250} height={250}>
                <Pie
                  data={userStats}
                  dataKey="count"
                  nameKey="role"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {userStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>

            {/* Classes Today Bar Chart */}
            <div style={cardStyle}>
              <h3>Classes Today</h3>
              <BarChart width={300} height={250} data={classesToday}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="teacher" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#26bedd" />
              </BarChart>
            </div>

            {/* Attendance Line Chart */}
            <div style={cardStyle}>
              <h3>Attendance This Week (%)</h3>
              <LineChart width={300} height={250} data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="attendance" stroke="#00C49F" strokeWidth={3} />
              </LineChart>
            </div>

            {/* Pending Tasks Card */}
            <div style={cardStyle}>
              <h3>Pending Tasks</h3>
              <p style={{ fontSize: "24px", fontWeight: "bold" }}>{pendingTasks ?? "..."}</p>
            </div>
          </div>
        )}

        {/* Student/Teacher schedule */}
        {(user?.role === "student" || user?.role === "teacher") && (
          <div style={{ display: "flex", gap: "20px", marginTop: "20px", flex: 1 }}>
            <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={cardStyle}>
                <h2>📚 Next Class</h2>
                {nextClass ? (
                  <p>
                    <strong>{nextClass.class_name}</strong><br />
                    {new Date(nextClass.start_time).toLocaleTimeString()} - {new Date(nextClass.end_time).toLocaleTimeString()}
                  </p>
                ) : (<p>No upcoming class 🎉</p>)}
              </div>
              <div style={cardStyle}>
                <h2>☕ Next Break</h2>
                {nextBreak ? (
                  <p>{nextBreak.start.toLocaleTimeString()} - {nextBreak.end.toLocaleTimeString()}</p>
                ) : (<p>No break before next class</p>)}
              </div>
            </div>

            <div style={{ flex: 1, ...cardStyle, overflowY: "auto" }}>
              <h2>📅 Today’s Schedule</h2>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "15px"
              }}>
                {schedule.length > 0 ? schedule.map((cls, idx) => (
                  <div key={idx} style={{
                    padding: "15px",
                    borderRadius: "12px",
                    background: "#f1faff",
                    border: "1px solid #d1e9f6",
                  }}>
                    <strong>{cls.class_name}</strong><br />
                    {new Date(cls.start_time).toLocaleTimeString()} - {new Date(cls.end_time).toLocaleTimeString()}
                  </div>
                )) : <p>No schedule available</p>}
              </div>

              <button onClick={() => navigate(`/${user.role}/schedule`)} style={{
                marginTop: "20px",
                padding: "12px 20px",
                backgroundColor: "#26bedd",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "bold"
              }}>
                View Full Schedule
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#f9f9f9",
  borderRadius: "16px",
  padding: "20px",
  boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};
