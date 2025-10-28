import React from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="navbar">
        <h1 className="clinic-name">LMS</h1>
        <div className="nav-links">
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#contact">Contact</a>
          <button className="login-btn" onClick={() => navigate("/login")}>
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-text">
          <h2>Leonardo Medical Services</h2>
          <p>
            Providing compassionate medical care and trusted laboratory
            services, ensuring your health is always our mission.
          </p>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <h2>About Us</h2>
        <p className="about-desc">
          Leonardo Medicalal Services is dedicated to providing accessible,
          reliable, and quality healthcare services to every patient.
        </p>

        <div className="about-cards">
          <div className="about-card">
            <h4>Our Mission</h4>
            <p>
              To deliver high-quality and patient-centered healthcare through
              professional service, modern technology, and compassion.
            </p>
          </div>
          <div className="about-card">
            <h4>Our Vision</h4>
            <p>
              To be the leading community clinic known for excellence,
              innovation, and integrity in medical service.
            </p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services-section">
        <h2>Our Services</h2>
        <div className="service-cards">
          <div className="service-card">
            <h4>General Consultation</h4>
            <p>
              Personalized health assessments and medical guidance for patients
              of all ages.
            </p>
          </div>
          <div className="service-card">
            <h4>Laboratory Testing</h4>
            <p>
              Accurate and efficient diagnostic testing to support better health
              outcomes.
            </p>
          </div>
          <div className="service-card">
            <h4>Preventive Check-Ups</h4>
            <p>
              Routine health screenings for early detection and disease
              prevention.
            </p>
          </div>
          <div className="service-card">
            <h4>Medical Certificates</h4>
            <p>
              Convenient issuance of medical certificates for employment,
              school, and personal needs.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <h2>Contact Us</h2>
        <div className="contact-info">
          <p>
            <strong>Address:</strong> B1 L17-E Avante Neovista Bagumbong,
            Caloocan City (In front of 7-Eleven)
          </p>
          <p>
            <strong>Phone:</strong> (+63) 956 225 2409
          </p>
          <p>
            <strong>Email:</strong> leonardomedical1@gmail.com
          </p>
          <p>
            <strong>Facebook:</strong> fb.com/Leonardo Medical Services
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>
          © {new Date().getFullYear()} Leonardo Medical Services — All Rights
          Reserved.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
