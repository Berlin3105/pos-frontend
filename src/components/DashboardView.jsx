import React, { useState } from 'react';
import styles from './DashboardView.module.css'; 
import LedgerSetupModule from './LedgerSetupModule';
import ProductSetupModule from './ProductSetupModule';
import CompanySetupModule from './CompanySetupModule';
import WaiterSetupModule from './WaiterSetupModule';
import TableSetupModule from './TableSetupModule';
import OrderSetupModule from './OrderSetupModule';
import SalesModule from './SalesModule';
import PasswordSetup from './PasswordSetup';

function DashboardView({ 
  username, 
  handleLogout, 
  activeMenu, 
  setActiveMenu, 
  menuOptions, 
  dashboardStats,
  financialYears,
  selectedFY,
  setSelectedFY
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className={styles.minHeightScreen}>
      
      {/* Top Navigation Bar */}
      <header className={styles.header}>
        <div className={styles.logoArea}>
          <button 
            type="button" 
            className={styles.hamburgerBtn}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            ☰
          </button>
          <span className="text-xl">🍽️</span>
          <h1 className={styles.logoText}>
            JB  <span className={styles.brandHighlight}>RestoBiz</span>
          </h1>
        </div>
        
        <div className={styles.profileArea}>
          <div className={styles.profileFlex}>
            <div className={styles.avatar}>A</div>
            <span className={styles.profileName}>
              {username || 'Admin Live'}
            </span>
          </div>
          <button onClick={handleLogout} className={styles.btnLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Workspace App Layout */}
      <div className={styles.workspace}>
        {isMobileMenuOpen && (
          <div className={styles.overlay} onClick={() => setIsMobileMenuOpen(false)}></div>
        )}

        <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.menuSection}>
            <p className={styles.menuHeading}>Navigation Menu</p>
            <nav className={styles.navContainer}>
              {menuOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setActiveMenu(option.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`${styles.menuBtn} ${activeMenu === option.id ? styles.activeMenuBtn : ''}`}
                >
                  {option.label}
                </button>
              ))}
            </nav>
          </div>
          <div className={styles.sidebarFooter}>
            © 2026 JB ECOSYSTEM
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={styles.mainPane}>
          {activeMenu === 'dashboard' ? (
            <div className={styles.dashboardGap}>
              
              {/* Header Title & Financial Year Dropdown */}
              <div className={styles.pageHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2>Business Overview</h2>
                  <p>Real-time point of sale matrix accumulations.</p>
                </div>

                {/* Financial Year Selection Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label htmlFor="fySelect" style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>
                    📅 Financial Year:
                  </label>
                  <select 
                    id="fySelect"
                    value={selectedFY} 
                    onChange={(e) => setSelectedFY(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontWeight: 'bold',
                      color: '#0f172a',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    {financialYears && financialYears.map((fy) => (
                      <option key={fy} value={fy}>
                        FY {fy}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Counters Metrics Grid Layout */}
              <div className={styles.metricsGrid}>
                {/* Today Bill Count Card */}
                <div className={styles.cardBill}>
                  <div>
                    <p className={styles.cardLabel}>Today Bill Count</p>
                    <h3 className={styles.cardValue}>{dashboardStats.todayBillCount}</h3>
                    <p className={styles.cardSubTextBlue}>↑ Counter tickets generated</p>
                  </div>
                  <div className={styles.cardIconBlue}>📋</div>
                </div>

                {/* Total Sales Amount Card */}
                <div className={styles.cardSales}>
                  <div>
                    <p className={styles.cardLabel}>Total Sales Amount</p>
                    <h3 className={styles.cardValue}>{dashboardStats.todayTotalAmount}</h3>
                    <p className={styles.cardSubTextGreen}>↑ Gross counter collection</p>
                  </div>
                  <div className={styles.cardIconGreen}>💰</div>
                </div>
              </div>

              {/* Monthwise Grouped Reports Panel (April to March Order) */}
              <div className={styles.panel}>
                <div className={styles.panelHeader}>
                  <h3>📅 Monthwise Sales Report ({selectedFY})</h3>
                </div>

                <div className={styles.monthsGrid}>
                  {dashboardStats.monthwiseSales && dashboardStats.monthwiseSales.map((item, index) => (
                    <div key={index} className={styles.monthBlock}>
                      <div>
                        <h4>{item.month}</h4>
                        <p>Monthly business</p>
                      </div>
                      <div>
                        <span className={styles.amountBadge}>
                          {item.amount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
          ) : activeMenu === 'ledger_setup' ? (
              <LedgerSetupModule />
          ): activeMenu === 'product_setup' ? ( 
              <ProductSetupModule />
          ): activeMenu === 'company_setup' ? ( 
              <CompanySetupModule />
          ): activeMenu === 'waiter_setup' ? ( 
              <WaiterSetupModule />
          ): activeMenu === 'Table_setup' ? ( 
              <TableSetupModule />
          ): activeMenu === 'order_entry' ? ( 
              <OrderSetupModule />
          ): activeMenu === 'sales_entry' ? ( 
              <SalesModule />
          ): activeMenu === 'Password_setup' ? ( 
              <PasswordSetup />
          ): (
            <div className={styles.placeholderContainer}>
              <span className={styles.placeholderIcon}>🛠️</span>
              <h3 className={styles.placeholderTitle}>
                {menuOptions.find(o => o.id === activeMenu)?.label} Screen
              </h3>
              <p className={styles.placeholderText}>
                இங்குக் குறிப்பிட்ட பக்கத்திற்கான மாட்யூல் மற்றும் டேட்டாவை விரைவில் இணைக்கலாம்.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default DashboardView;