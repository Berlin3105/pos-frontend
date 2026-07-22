import React, { useState, useEffect } from 'react';
import styles from './LedgerSetup.module.css'; // CSS Module Import

function LedgerSetupModule() {
  const [activeTab, setActiveTab] = useState('entry'); 
  const [ledgers, setLedgers] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [formData, setFormData] = useState({
    id: '', 
    ledger_id: '',
    ledger_name: '',
    mobile_no: '',
    email_id: '',
    gstno: '',
    address: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  const fetchLedgers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/ledgers');
      const data = await res.json();
      setLedgers(data);
    } catch (err) {
      console.error("Error fetching ledgers:", err);
    }
  };

  const fetchNextLedgerId = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/ledgers/next-id');
      const data = await res.json();
      setFormData(prev => ({ ...prev, ledger_id: data.nextId }));
    } catch (err) {
      console.error("Error fetching next ID:", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'entry' && !isEditing) {
      fetchNextLedgerId();
    }
    fetchLedgers();
  }, [activeTab, isEditing]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isEditing 
      ? `http://localhost:5000/api/ledgers/${formData.id}` 
      : 'http://localhost:5000/api/ledgers';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert(isEditing ? "Ledger Updated!" : "Ledger Created!");
        handleReset();
        setActiveTab('list');
      }
    } catch (err) {
      alert("Error saving ledger");
    }
  };

  const handleEdit = (ledger) => {
    setFormData(ledger);
    setIsEditing(true);
    setActiveTab('entry');
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this ledger?")) {
      try {
        const res = await fetch(`http://localhost:5000/api/ledgers/${id}`, { method: 'DELETE' });
        if (res.ok) {
          alert("Ledger Deleted!");
          fetchLedgers();
        }
      } catch (err) {
        alert("Error deleting ledger");
      }
    }
  };

  const handleReset = () => {
    setFormData({ id: '', ledger_id: '', ledger_name: '', mobile_no: '', email_id: '', gstno: '', address: '' });
    setIsEditing(false);
  };

  const filteredLedgers = ledgers.filter((ledger) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (ledger.ledger_id && ledger.ledger_id.toLowerCase().includes(searchLower)) ||
      (ledger.ledger_name && ledger.ledger_name.toLowerCase().includes(searchLower)) ||
      (ledger.mobile_no && ledger.mobile_no.toLowerCase().includes(searchLower)) ||
      (ledger.email_id && ledger.email_id.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className={styles.container}>
      
      {/* Title & Tab Sheets Bar */}
      <div className={styles.headerWrapper}>
        <div>
          <h2 className={styles.title}>⚙️ Ledger Setup</h2>
          <p className={styles.subtitle}>Manage customer and supplier accounts hierarchy.</p>
        </div>

        {/* Tabs Controls */}
        <div className={styles.tabContainer}>
          <button 
            type="button"
            onClick={() => { setActiveTab('entry'); if(!isEditing) handleReset(); }}
            className={`${styles.tabButton} ${activeTab === 'entry' ? styles.activeTabButton : ''}`}
          >
            📥 Entry
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('list')}
            className={`${styles.tabButton} ${activeTab === 'list' ? styles.activeTabButton : ''}`}
          >
            📋 List
          </button>
        </div>
      </div>

      {/* TAB 1: LEDGER ENTRY FORM */}
      {activeTab === 'entry' && (
        <form onSubmit={handleSubmit} className={styles.formLayout}>
          <div className={styles.formGrid}>
            <div>
              <label className={styles.label}>Ledger ID</label>
              <input type="text" name="ledger_id" value={formData.ledger_id} readOnly className={styles.inputReadOnly} />
            </div>
            <div>
              <label className={styles.label}>Ledger Name *</label>
              <input type="text" name="ledger_name" value={formData.ledger_name} onChange={handleChange} required placeholder="Enter account name" className={styles.inputStandard} />
            </div>
            <div>
              <label className={styles.label}>Mobile No</label>
              <input type="text" name="mobile_no" value={formData.mobile_no} onChange={handleChange} placeholder="Enter mobile number" className={styles.inputStandard} />
            </div>
            <div>
              <label className={styles.label}>Email ID</label>
              <input type="email" name="email_id" value={formData.email_id} onChange={handleChange} placeholder="name@company.com" className={styles.inputStandard} />
            </div>
            <div className={styles.fullWidthRow}>
              <label className={styles.label}>GST Number</label>
              <input type="text" name="gstno" value={formData.gstno} onChange={handleChange} placeholder="GSTIN" className={styles.inputStandard} style={{textTransform: 'uppercase'}} />
            </div>
            <div className={styles.fullWidthRow}>
              <label className={styles.label}>Address</label>
              <textarea name="address" rows="3" value={formData.address} onChange={handleChange} placeholder="Enter full billing address" className={styles.textareaStandard}></textarea>
            </div>
          </div>
          <div className={styles.buttonGroup}>
            <button type="submit" className={styles.btnSubmit}>
              {isEditing ? '🔄 Update' : '💾 Save'}
            </button>
            <button type="button" onClick={handleReset} className={styles.btnClear}>Clear</button>
          </div>
        </form>
      )}

      {/* TAB 2: LEDGER DATA GRID VIEW WITH LIVE SEARCH */}
      {activeTab === 'list' && (
        <div className={styles.listWrapper}>
          
          {/* Search Input Bar */}
          <div className={styles.searchBar}>
            <span className={styles.searchIcon}>🔍</span>
            <input 
              type="text"
              placeholder="Search by ID, Name, Mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm('')} className={styles.searchClearBtn}>✕</button>
            )}
          </div>

          {/* 1. MOBILE RESPONSIVE VIEW (CARD LAYOUT) */}
          <div className={styles.mobileCardsContainer}>
            {filteredLedgers.length === 0 ? (
              <div className={styles.noRecords}>No records found.</div>
            ) : (
              filteredLedgers.map((ledger) => (
                <div key={ledger.id} className={styles.mobileCard}>
                  <div className={styles.mobileCardHeader}>
                    <span className={styles.badgeId}>{ledger.ledger_id}</span>
                    <span className={styles.badgeGst}>{ledger.gstno || 'NO GST'}</span>
                  </div>
                  <div className={styles.mobileCardBody}>
                    <p className={styles.mobileCardTitle}>{ledger.ledger_name}</p>
                    <p className={styles.mobileCardText}>📱 {ledger.mobile_no || '-'}</p>
                    <p className={styles.mobileCardTextMuted}>📧 {ledger.email_id || '-'}</p>
                    <p className={styles.mobileCardTextSmall}>📍 {ledger.address || '-'}</p>
                  </div>
                  <div className={styles.mobileCardActions}>
                    <button type="button" onClick={() => handleEdit(ledger)} className={styles.btnActionEdit}>Edit</button>
                    <button type="button" onClick={() => handleDelete(ledger.id)} className={styles.btnActionDel}>Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 2. DESKTOP VIEW (TRADITIONAL TABLE GRID) */}
          <div className={styles.desktopTableContainer}>
            <table className={styles.tableLayout}>
              <thead>
                <tr className={styles.tableHeaderRow}>
                  <th className={styles.tableHeaderCell}>Ledger ID</th>
                  <th className={styles.tableHeaderCell}>Account Name</th>
                  <th className={styles.tableHeaderCell}>Mobile</th>
                  <th className={styles.tableHeaderCell}>Email ID</th>
                  <th className={styles.tableHeaderCell}>GSTIN</th>
                  <th className={styles.tableHeaderCell}>Address</th>
                  <th className={styles.tableHeaderCellCenter}>Actions</th>
                </tr>
              </thead>
              <tbody className={styles.tableBodyRow}>
                {filteredLedgers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className={styles.noRecordsCell}>No Accounts Found.</td>
                  </tr>
                ) : (
                  filteredLedgers.map((ledger) => (
                    <tr key={ledger.id}>
                      <td className={styles.tableCellId}>{ledger.ledger_id}</td>
                      <td className={styles.tableCellName}>{ledger.ledger_name}</td>
                      <td className={styles.tableCellStandard}>{ledger.mobile_no || '-'}</td>
                      <td className={styles.tableCellMuted}>{ledger.email_id || '-'}</td>
                      <td className={styles.tableCellGst}>{ledger.gstno || '-'}</td>
                      <td className={styles.tableCellAddress}>{ledger.address || '-'}</td>
                      <td className={styles.tableCellActions}>
                        <button type="button" onClick={() => handleEdit(ledger)} className={styles.btnTableEdit}>Edit</button>
                        <button type="button" onClick={() => handleDelete(ledger.id)} className={styles.btnTableDel}>Del</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
}

export default LedgerSetupModule;