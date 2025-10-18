import React from "react";
import { useNavigate } from "react-router-dom";
import "./Landing.css";

function Landing() {
  const navigate = useNavigate();

  const handleSignIn = () => {
    navigate("/login");
  };

  return (
    <div className="landing-container">
      {/* Header */}
      <header className="landing-header">
        <div className="header-content">
          <div className="logo-section">
            <img 
              src="https://media.discordapp.net/attachments/1096192885394771968/1408272693492580424/raw.png?ex=68ab1de6&is=68a9cc66&hm=4aeb1037d87e34a95583cf33b3ab1c457ed98876da08e5bcc986df29c90ef529&=&format=webp&quality=lossless&width=1936&height=1290" 
              alt="Schedulo Logo" 
              className="logo"
            />
            <h1 className="brand-name">Schedulo</h1>
          </div>
          <button className="sign-in-btn" onClick={handleSignIn}>
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Streamline Your School Scheduling
          </h1>
          <p className="hero-subtitle">
            Powerful scheduling software designed for modern schools. 
            Manage classes, teachers, and students all in one place.
          </p>
          <button className="cta-button" onClick={handleSignIn}>
            Get Started →
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Everything You Need</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📘</div>
            <h3>Master Schedule</h3>
            <p>
              Create and manage your entire school schedule with drag-and-drop simplicity. 
              View all classes, teachers, and rooms at a glance.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👨‍🏫</div>
            <h3>Teacher Management</h3>
            <p>
              Track teacher availability, assign classes, and ensure optimal 
              scheduling without conflicts. Keep everyone organized.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🧑‍🎓</div>
            <h3>Student Schedules</h3>
            <p>
              Generate individual student schedules automatically. 
              Students and parents can view schedules anytime, anywhere.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>A/B Day Support</h3>
            <p>
              Handle complex A/B day schedules with ease. 
              Perfect for alternating day systems and block scheduling.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🏫</div>
            <h3>Room Allocation</h3>
            <p>
              Manage classroom assignments and prevent double-bookings. 
              See real-time room availability across your school.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Real-Time Updates</h3>
            <p>
              Make changes on the fly with instant synchronization. 
              Everyone stays informed with live schedule updates.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="benefits-content">
          <h2 className="section-title">Why Schools Choose Schedulo</h2>
          <div className="benefits-list">
            <div className="benefit-item">
              <div className="benefit-number">1</div>
              <div className="benefit-text">
                <h3>Save Time</h3>
                <p>Reduce scheduling time from weeks to hours with our intuitive interface</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-number">2</div>
              <div className="benefit-text">
                <h3>Eliminate Conflicts</h3>
                <p>Automatic conflict detection ensures no double-bookings or scheduling errors</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-number">3</div>
              <div className="benefit-text">
                <h3>Easy Collaboration</h3>
                <p>Multiple administrators can work together seamlessly on the same schedule</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-number">4</div>
              <div className="benefit-text">
                <h3>Flexible & Scalable</h3>
                <p>Works for small schools and large districts with hundreds of teachers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to Transform Your Scheduling?</h2>
        <p>Join hundreds of schools already using Schedulo</p>
        <button className="cta-button-large" onClick={handleSignIn}>
          Sign In to Get Started
        </button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; 2025 Schedulo. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Landing;
