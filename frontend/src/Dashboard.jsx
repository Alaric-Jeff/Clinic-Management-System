import React, { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Logo from '/src/zLogo.png';


// Main App Component
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoContainer}>
            <div>

<img 
        src={Logo} 
        alt="Preview"
        style={{
          position: 'absolute',
          width: '250px',        
          height: '180px',      
          objectFit: 'cover',    
          borderRadius: '10px',  
          left: '525px',
          top: '-30px'
        }}
      />

              <h1 style={styles.title}>LEONARDO MEDICAL SERVICES</h1>
             <center><p style={styles.subtitle}>B1 L17-E Navoisita, Bagumbong, Caloocan City</p></center>
            </div>
          </div>
          
          {/* Navigation */}
          <nav style={styles.nav}>
            <button
              onClick={() => setActiveTab('overview')}
              style={activeTab === 'overview' ? styles.navButtonActive : styles.navButtonInactive}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              style={activeTab === 'analytics' ? styles.navButtonActive : styles.navButtonInactive}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('forecasting')}
              style={activeTab === 'forecasting' ? styles.navButtonActive : styles.navButtonInactive}
            >
              Forecasting
            </button>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main style={styles.main}>
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'forecasting' && <Forecasting />}
      </main>
    </div>
  );
};

// Overview Component - receives data from backend as props
const Overview = ({ totalPatients = 0, addedPatients = 0, totalReports = 0, addedReports = 0, maleCount = 0, femaleCount = 0 }) => {
  return (
    <div style={styles.spaceY6}>
      {/* Top Cards */}
      
        <div style={styles.middle}>
        <div style={styles.redCard}>
          <h1 style={styles.cardTitle}>Total Patients</h1>
          <div style={styles.cardValue}>
            {totalPatients}
          </div>
          <div style={styles.cardSubtext}>
            <TrendingUp size={16} />
            <span style={styles.trendNumber}>{addedPatients}</span>
            <span>added new patients today</span>
          </div>
        </div>

        <div style={styles.redCard}>
          <h3 style={styles.cardTitle}>Total Reports</h3>
          <div style={styles.cardValue}>
            {totalReports}
          </div>
          <div style={styles.cardSubtext}>
            <TrendingUp size={16} />
            <span style={styles.trendNumber}>{addedReports}</span>
            <span>added new record today</span>
          </div>
        </div>
        </div>
      

      <div style={styles.cardGrid2}>
        {/* Patient Visits Pie Chart */}
        <div style={styles.whiteCard}>
          <h3 style={styles.forecastHeader}>Patient Visits</h3>
          <div style={styles.chartContainerFlex}>
            <svg width="250" height="250" viewBox="0 0 250 250">
              <circle cx="125" cy="125" r="100" fill="#1e3a8a" />
              <path d="M 125 125 L 125 25 A 100 100 0 0 1 225 125 Z" fill="#fbbf24" />
              <path d="M 125 125 L 225 125 A 100 100 0 0 1 175 205 Z" fill="#0891b2" />
            </svg>
          </div>
          <div style={styles.legend}>
            <div style={styles.legendItem}>
              <div style={{...styles.legendDot, backgroundColor: '#1e3a8a'}}></div>
              <span style={styles.legendText}>Adult</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{...styles.legendDot, backgroundColor: '#fbbf24'}}></div>
              <span style={styles.legendText}>Child</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{...styles.legendDot, backgroundColor: '#0891b2'}}></div>
              <span style={styles.legendText}>Elderly</span>
            </div>
          </div>
        </div>

        {/* Patient Overview Line Chart */}
        <div style={styles.whiteCard}>
          <h3 style={styles.forecastHeader}>Patient Overview</h3>
          <div style={styles.chartContainer}>
            <svg width="100%" height="100%" viewBox="0 0 400 200">
              <path d="M 0 150 Q 50 120 100 130 T 200 140 T 300 120 T 400 130" 
                    stroke="#3b82f6" strokeWidth="2" fill="none" />
              <path d="M 0 170 Q 50 150 100 155 T 200 160 T 300 150 T 400 155" 
                    stroke="#fbbf24" strokeWidth="2" fill="none" />
              <line x1="0" y1="200" x2="400" y2="200" stroke="#e5e7eb" strokeWidth="1" />
            </svg>
          </div>
          <div style={styles.chartLabels}>
            <span>Sat</span>
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
          </div>
        </div>
      </div>

      {/* Gender Distribution */}
      <div style={styles.genderContainer}>
        <div style={styles.genderGrid}>
          <div style={styles.maleBox}>
            <h4 style={styles.genderTitle}>Male</h4>
            <div style={styles.genderValue}>{maleCount}</div>
          </div>
          <div style={styles.femaleBox}>
            <h4 style={styles.genderTitle}>Female</h4>
            <div style={styles.genderValue}>{femaleCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Analytics Component
const Analytics = () => {
  const [totalRevenue, setTotalRevenue] = useState('');
  const [revenueChange, setRevenueChange] = useState('');
  const [topService, setTopService] = useState('');
  const [serviceCount, setServiceCount] = useState('');
  const [topCategory, setTopCategory] = useState('');
  const [categoryRevenue, setCategoryRevenue] = useState('');
  const [categoryByRevenue, setCategoryByRevenue] = useState('');
  const [categoryChange, setCategoryChange] = useState('');

  return (
    <div style={styles.spaceY6}>
      {/* Top Cards */}
      <div style={styles.cardGrid3}>
        <div style={styles.whiteCard}>
          <h3 style={styles.cardTitleGray}>Total Revenue</h3>
          <div style={styles.cardValueMedium}>
            {totalRevenue ? `₱${totalRevenue}` : '₱0.00'}
          </div>
          <div style={styles.cardSubtextGreen}>
            <TrendingUp size={14} />
            <span>{revenueChange || '0'}% last month</span>
          </div>
        </div>

        <div style={styles.whiteCard}>
          <h3 style={styles.cardTitleGray}>Top Service Availed</h3>
          <div style={styles.cardValueMedium}>
            {topService || 'N/A'}
          </div>
          <div style={styles.cardSubtextGreen}>
            <TrendingUp size={14} />
            <span>{serviceCount || '0'} times this month</span>
          </div>
        </div>

        <div style={styles.whiteCard}>
          <h3 style={styles.cardTitleGray}>Top Earning Category</h3>
          <div style={styles.cardValueMedium}>
            {topCategory || 'N/A'}
          </div>
          <div style={styles.cardSubtextGreen}>
            <TrendingUp size={14} />
            <span>{categoryRevenue ? `₱${categoryRevenue}` : '₱0.00'}</span>
          </div>
        </div>
      </div>

      <div style={styles.cardGrid2}>
        {/* Revenue Trend */}
        <div style={styles.whiteCard}>
          <h3 style={styles.forecastHeader}>Revenue Trend</h3>
          <div style={styles.chartContainerSmall}>
            <svg width="100%" height="100%" viewBox="0 0 400 150">
              <path d="M 0 100 L 50 70 L 100 110 L 150 50 L 200 80 L 250 60 L 300 90 L 350 70 L 400 100" 
                    stroke="#3b82f6" strokeWidth="2" fill="none" />
              <line x1="0" y1="150" x2="400" y2="150" stroke="#e5e7eb" strokeWidth="1" />
            </svg>
          </div>
          <div style={styles.chartLabels}>
            <span>Jan</span>
            <span>Mar</span>
            <span>May</span>
            <span>Jul</span>
            <span>Sep</span>
            <span>Nov</span>
          </div>
        </div>

        {/* Top 5 Services */}
        <div style={styles.whiteCard}>
          <h3 style={styles.forecastHeader}>Top 5 Services</h3>
          <div style={styles.serviceList}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={styles.serviceItem}>
                <div style={styles.serviceBar}>
                  <div style={{...styles.serviceBarFill, width: `${100 - i * 15}%`}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.cardGrid2}>
        {/* Revenue by Category */}
        <div style={styles.whiteCard}>
          <h3 style={styles.forecastHeader}>Revenue by Category</h3>
          <div style={styles.cardValueMedium}>
            {categoryByRevenue ? `₱${categoryByRevenue}` : '₱0.00'}
          </div>
          <div style={styles.cardSubtextGreen}>
            <TrendingUp size={14} />
            <span>{categoryChange || '0'}% vs last month</span>
          </div>
          <div style={styles.spaceY2}>
            <div style={styles.legendItem}>
              <div style={{...styles.legendDot, backgroundColor: '#3b82f6'}}></div>
              <span style={styles.legendText}>Hematology</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{...styles.legendDot, backgroundColor: '#22d3ee'}}></div>
              <span style={styles.legendText}>Histopathology</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{...styles.legendDot, backgroundColor: '#1e3a8a'}}></div>
              <span style={styles.legendText}>Bacteriology</span>
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div style={styles.whiteCard}>
          <div style={styles.chartContainerFlex}>
            <svg width="250" height="250" viewBox="0 0 250 250">
              <circle cx="125" cy="125" r="100" fill="#1e3a8a" />
              <path d="M 125 125 L 125 25 A 100 100 0 0 1 195 70 Z" fill="#3b82f6" />
              <path d="M 125 125 L 195 70 A 100 100 0 0 1 225 125 Z" fill="#0891b2" />
              <circle cx="125" cy="125" r="50" fill="white" />
            </svg>
          </div>
          <div style={styles.legend}>
            <div style={styles.legendItem}>
              <div style={{...styles.legendDot, backgroundColor: '#3b82f6'}}></div>
              <span style={styles.legendText}>Hematology</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{...styles.legendDot, backgroundColor: '#1e3a8a'}}></div>
              <span style={styles.legendText}>Bacteriology</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{...styles.legendDot, backgroundColor: '#22d3ee'}}></div>
              <span style={styles.legendText}>Histopathology</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{...styles.legendDot, backgroundColor: '#1e40af'}}></div>
              <span style={styles.legendText}>Microscopy</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{...styles.legendDot, backgroundColor: '#14b8a6'}}></div>
              <span style={styles.legendText}>Enzymes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Forecasting Component
const Forecasting = () => {
  const [forecastRevenue, setForecastRevenue] = useState('');
  const [forecastChange, setForecastChange] = useState('');
  const [pastRevenue, setPastRevenue] = useState('');
  const [forecastedRevenue, setForecastedRevenue] = useState('');

  return (
    <div style={styles.spaceY6}>
      {/* General Revenue Forecasting */}
      <div style={styles.whiteCard}>
        <h3 style={styles.forecastHeader}>General Revenue Forecasting</h3>
        <div style={styles.mb4}>
          <div style={styles.cardValueMedium}>
            {forecastRevenue ? `₱${forecastRevenue}` : '₱0.00'}
          </div>
          <div style={styles.cardSubtextGreen}>
            <TrendingUp size={14} />
            <span>{forecastChange || '0'}%</span>
          </div>
        </div>

        <div style={styles.buttonGroup}>
          <button style={styles.button}>Daily</button>
          <button style={styles.button}>Weekly</button>
          <button style={styles.button}>Monthly</button>
        </div>

        <div style={styles.chartContainerSmall}>
          <svg width="100%" height="100%" viewBox="0 0 500 150">
            <path d="M 0 140 Q 50 130 100 120 T 200 100 T 300 80 T 400 70 T 500 60" 
                  stroke="#3b82f6" strokeWidth="2" fill="none" />
            <line x1="0" y1="150" x2="500" y2="150" stroke="#e5e7eb" strokeWidth="1" />
          </svg>
        </div>

        <div style={styles.chartLabels}>
          <span>Jan</span>
          <span>Feb</span>
          <span>Mar</span>
          <span>Apr</span>
          <span>May</span>
          <span>Jun</span>
          <span>Jul</span>
          <span>Aug</span>
          <span>Sep</span>
        </div>
      </div>

      <div style={styles.cardGrid3}>
        {/* Past Revenue */}
        <div style={styles.whiteCard}>
          <h3 style={styles.cardTitleGray}>Past Revenue net with</h3>
          <div style={styles.cardValueSmall}>
            {pastRevenue ? `₱${pastRevenue}` : '₱0.00'}
          </div>
        </div>

        {/* Forecasted Revenue */}
        <div style={styles.whiteCard}>
          <h3 style={styles.cardTitleGray}>Forecasted Revenue</h3>
          <div style={styles.cardValueSmall}>
            {forecastedRevenue ? `₱${forecastedRevenue}` : '₱0.00'}
          </div>
        </div>

        {/* Per-Service Revenue Forecasting */}
        <div style={styles.whiteCard}>
          <h3 style={styles.forecastSubheader}>Per-Service Revenue Forecasting</h3>
          <div style={styles.spaceY4}>
            <div>
              <div style={styles.forecastItemMb}>
                <span style={styles.legendTextSmall}>CBC</span>
                <span style={styles.legendTextSmall}>₱45,000</span>
              </div>
              <div style={styles.progressContainer}>
                <div style={{...styles.progressBar, width: '90%'}}></div>
              </div>
            </div>
            <div>
              <div style={styles.forecastItemMb}>
                <span style={styles.legendTextSmall}>Urinalysis</span>
                <span style={styles.legendTextSmall}>₱30,000</span>
              </div>
              <div style={styles.progressContainer}>
                <div style={{...styles.progressBar, width: '60%'}}></div>
              </div>
            </div>
            <div>
              <div style={styles.forecastItemMb}>
                <span style={styles.legendTextSmall}>X-Ray</span>
                <span style={styles.legendTextSmall}>₱25,000</span>
              </div>
              <div style={styles.progressContainer}>
                <div style={{...styles.progressBar, width: '50%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.cardGrid2}>
        {/* Top 3 Growing Services */}
        <div style={styles.whiteCard}>
          <h3 style={styles.forecastSubheader}>Top 3 Growing Services</h3>
          <div style={styles.spaceY3}>
            <div style={styles.forecastItem}>
              <span style={styles.legendText}>CBC</span>
              <span style={styles.textGreen}>+30%</span>
            </div>
            <div style={styles.forecastItem}>
              <span style={styles.legendText}>Urinalysis</span>
              <span style={styles.textGreen}>+18%</span>
            </div>
            <div style={styles.forecastItem}>
              <span style={styles.legendText}>X-Ray</span>
              <span style={styles.textGray}>0%</span>
            </div>
          </div>
        </div>

        {/* Per-Category Revenue Forecasting */}
        <div style={styles.whiteCard}>
          <h3 style={styles.forecastSubheader}>Per-Category Revenue Forecasting</h3>
          <div style={styles.chartContainerFlex}>
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="80" fill="#0891b2" />
              <path d="M 100 100 L 100 20 A 80 80 0 0 1 148 32 Z" fill="#fbbf24" />
              <path d="M 100 100 L 148 32 A 80 80 0 0 1 180 100 Z" fill="#1e3a8a" />
              <circle cx="100" cy="100" r="40" fill="white" />
            </svg>
          </div>
          <div style={styles.mt4}>
            <div style={styles.forecastSubheaderSmall}>Top Growing Category</div>
            <div style={styles.spaceY1}>
              <div style={styles.legendItem}>
                <div style={{...styles.legendDotSmall, backgroundColor: '#14b8a6'}}></div>
                <span style={styles.legendTextSmall}>Hematology</span>
              </div>
              <div style={styles.legendItem}>
                <div style={{...styles.legendDotSmall, backgroundColor: '#1e3a8a'}}></div>
                <span style={styles.legendTextSmall}>Bacteriology</span>
              </div>
              <div style={styles.legendItem}>
                <div style={{...styles.legendDotSmall, backgroundColor: '#fbbf24'}}></div>
                <span style={styles.legendTextSmall}>Histopathology</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Styles Object
const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#fff3f3',
    minHeight: '100vh'
  },
  header: {
    borderBottom: '10px solid #7f1d1d',
  },
  headerContent: {
    padding: '1px 1px',
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '10px'
  },
  title: {
    fontFamily: 'Arial, sans-serif',
    fontSize: '30px',
    fontWeight: '800',
    color: '#c50202',
    marginBottom: '5px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
  },
  nav: {
    display: 'inline',
    marginTop: '1px',
  },
  navButtonActive: {
    padding: '13px 40px',
    fontWeight: 'bold',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#7f1d1d',
    color: '#ffffff',
    cursor: 'pointer',
  },
  navButtonInactive: {
    fontSize: '15px',
    borderRadius: '10px',
    padding: '13px 40px',
    fontWeight: 'bold',
    border: 'none',
    cursor: 'pointer',
    color: '#8b0000',
    backgroundColor: 'transparent',
  },
  main: {
    padding: '50px',
  },
  cardGrid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1.5rem',
  },
  cardGrid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1.5rem',
  },
  redCard: {
    width: '700px',
    backgroundColor: '#8d1a1c',
    color: '#ffffff',
    padding: '1.5rem',
    borderRadius: '0.5rem',
    border: '5px solid #8d1a1c',
  },
  whiteCard: {
    backgroundColor: '#ffffff',
    padding: '1.5rem',
    borderRadius: '0.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  cardTitle: {
    fontSize: '0.875rem',
    fontWeight: 500,
    marginBottom: '0.5rem',
  },
  cardTitleGray: {
    fontSize: '0.875rem',
    color: '#4c525aff',
    marginBottom: '0.5rem',
  },
  cardValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  },
  cardValueMedium: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  },
  cardValueSmall: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
  },
  cardSubtext: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.875rem',
    color: '#08dd19ff',
  },
  trendNumber: {
    fontWeight: '600',
  },
  cardSubtextGreen: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    color: '#16a34a',
    fontSize: '0.875rem',
  },
  chartContainer: {
    height: '16rem',
  },
  chartContainerSmall: {
    height: '12rem',
  },
  chartContainerFlex: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '16rem',
  },
  chartLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: '#6b7280',
    marginTop: '0.5rem',
  },
  genderContainer: {
    backgroundColor: '#7f1d1d',
    padding: '1.5rem',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  genderGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
  },
  maleBox: {
    backgroundColor: 'rgba(30, 58, 138, 0.8)',
    padding: '2rem',
    borderRadius: '0.5rem',
    textAlign: 'center',
  },
  femaleBox: {
    backgroundColor: 'rgba(202, 138, 4, 0.8)',
    padding: '2rem',
    borderRadius: '0.5rem',
    textAlign: 'center',
  },
  genderTitle: {
    color: '#ffffff',
    fontSize: '1.125rem',
    marginBottom: '0.5rem',
  },
  genderValue: {
    textAlign: 'center',
    fontSize: '2.25rem',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  legend: {
    marginTop: '1rem',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.25rem',
  },
  legendDot: {
    width: '1rem',
    height: '1rem',
    borderRadius: '9999px',
  },
  legendDotSmall: {
    width: '0.75rem',
    height: '0.75rem',
    borderRadius: '9999px',
  },
  legendText: {
    fontSize: '0.875rem',
  },
  legendTextSmall: {
    fontSize: '0.75rem',
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  button: {
    padding: '0.5rem 1rem',
    backgroundColor: '#e5e7eb',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    border: 'none',
    cursor: 'pointer',
  },
  serviceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  serviceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  serviceBar: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    borderRadius: '9999px',
    height: '2rem',
  },
  serviceBarFill: {
    backgroundColor: '#2dd4bf',
    height: '100%',
    borderRadius: '9999px',
  },
  progressContainer: {
    width: '100%',
    backgroundColor: '#e5e7eb',
    borderRadius: '9999px',
    height: '1.5rem',
  },
  progressBar: {
    backgroundColor: '#1e3a8a',
    height: '100%',
    borderRadius: '9999px',
  },
  forecastHeader: {
    fontSize: '1.125rem',
    fontWeight: 600,
    marginBottom: '1rem',
  },
  forecastSubheader: {
    fontSize: '0.875rem',
    fontWeight: 600,
    marginBottom: '1rem',
  },
  forecastSubheaderSmall: {
    fontSize: '0.875rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
  },
  forecastItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forecastItemMb: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.25rem',
  },
  textGreen: {
    color: '#16a34a',
    fontSize: '0.875rem',
  },
  textGray: {
    color: '#4b5563',
    fontSize: '0.875rem',
  },
  spaceY6: { display: 'flex', flexDirection: 'column', gap: '2.5rem' },
  spaceY4: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  spaceY3: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  spaceY2: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  spaceY1: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  mb2: { marginBottom: '0.5rem' },
  mb4: { marginBottom: '1rem' },
  mb6: { marginBottom: '1.5rem' },
  mt4: { marginTop: '1rem' },
  middle: {
    display: 'flex',
    justifyContent: 'space-evenly',
  },
};

export default Dashboard;