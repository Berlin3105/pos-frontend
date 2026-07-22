import React, { useState, useEffect } from 'react';
import styles from './TableSetupModule.module.css';

function TableSetupModule() {
  const [activeTab, setActiveTab] = useState('entry'); 
  const [tables, setTables] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [formData, setFormData] = useState({
    id: '', 
    table_no: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  // அனைத்து டேபிள்களையும் சர்வரில் இருந்து எடுக்க
  const fetchTables = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/tables');
      const data = await res.json();
      setTables(data);
    } catch (err) {
      console.error("Error fetching tables:", err);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // சேவ் / அப்டேட் செய்ய
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // முன்பக்க வேலிடேஷன் (Trimming space)
    if (!formData.table_no.trim()) {
      alert("Please enter a valid Table Number");
      return;
    }

    const url = isEditing 
      ? `http://localhost:5000/api/tables/${formData.id}`
      : 'http://localhost:5000/api/tables';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_no: formData.table_no.trim() })
      });
      
      const result = await res.json();

      if (res.ok) {
        alert(isEditing ? "Table Updated Successfully!" : "Table Saved Successfully!");
        resetForm();
        fetchTables();
        //setActiveTab('list');
      } else {
        // டூப்ளிகேட் எரர் அல்லது சர்வர் எரர் வந்தால் அலர்ட் காட்டும்
        alert("Warning: " + (result.error || "Failed to save"));
      }
    } catch (err) {
      console.error("Error saving table:", err);
    }
  };

  // எடிட் செய்ய டேட்டாவை ஃபார்மிற்கு கொண்டு செல்ல
  const handleEdit = (table) => {
    setFormData({
      id: table.id,
      table_no: table.table_no
    });
    setIsEditing(true);
    setActiveTab('entry');
  };

  // டேபிளை நீக்க
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this table?")) {
      try {
        const res = await fetch(`http://localhost:5000/api/tables/${id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          alert("Table Deleted Successfully!");
          fetchTables();
        }
      } catch (err) {
        console.error("Error deleting table:", err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      table_no: ''
    });
    setIsEditing(false);
  };

  // தேடுதல் லாஜிக்
  const filteredTables = tables.filter(table => 
    table.table_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      
      {/* Header & Tabs */}
      <div className={styles.headerWrapper}>
        <h3 className={styles.title}>🪑 Table Setup</h3>
        <div className={styles.tabLayout}>
          <button 
            onClick={() => { setActiveTab('entry'); if(!isEditing) resetForm(); }} 
            className={`${styles.tabBtn} ${activeTab === 'entry' ? styles.activeTab : ''}`}
          >
            {isEditing ? 'Edit Entry' : 'New Entry'}
          </button>
          <button 
            onClick={() => setActiveTab('list')} 
            className={`${styles.tabBtn} ${activeTab === 'list' ? styles.activeTab : ''}`}
          >
            Table List
          </button>
        </div>
      </div>

      {/* ENTRY TAB */}
      {activeTab === 'entry' && (
        <form onSubmit={handleSubmit} className={styles.formContainer}>
          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Table Number *</label>
              <input 
                type="text" 
                name="table_no" 
                required 
                value={formData.table_no} 
                onChange={handleChange} 
                className={styles.inputField} 
                placeholder="Enter Table No (e.g. 1, 2, T-1)" 
              />
            </div>
          </div>

          <div className={styles.btnGroup}>
            <button type="submit" className={styles.btnSubmit}>
              {isEditing ? 'Update Table' : 'Save Table'}
            </button>
            {isEditing && (
              <button type="button" onClick={resetForm} className={styles.btnCancel}>Cancel</button>
            )}
          </div>
        </form>
      )}

      {/* LIST TAB */}
      {activeTab === 'list' && (
        <div className={styles.listContainer}>
          
          {/* Search Box */}
          <div className={styles.searchWrapper}>
            <input 
              type="text" 
              placeholder="🔍 Search by Table Number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Desktop Table View (பெரிய ஸ்கிரீன்களுக்கு) */}
          <div className={styles.tableResponsive}>
            <table className={styles.restaurantTable}>
              <thead>
                <tr className={styles.tableHeaderRow}>
                  <th style={{ width: '20%' }}>S.No</th>
                  <th style={{ width: '60%' }}>Table Number</th>
                  <th style={{ width: '20%' }}>Actions</th>
                </tr>
              </thead>
              <tbody className={styles.tableBodyRow}>
                {filteredTables.length === 0 ? (
                  <tr>
                    <td colSpan="3" className={styles.noRecordsCell}>No Tables Found.</td>
                  </tr>
                ) : (
                  filteredTables.map((table, index) => (
                    <tr key={table.id}>
                      <td className={styles.tableCellId}>{index + 1}</td>
                      <td className={styles.tableCellName}>Table {table.table_no}</td>
                      <td className={styles.tableCellActions}>
                        <button type="button" onClick={() => handleEdit(table)} className={styles.btnTableEdit}>Edit</button>
                        <button type="button" onClick={() => handleDelete(table.id)} className={styles.btnTableDel}>Del</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (மொபைல் வியூவிற்கு மட்டும்) */}
          <div className={styles.mobileCardsGrid}>
            {filteredTables.length === 0 ? (
              <div className={styles.noRecordsCell}>No Tables Found.</div>
            ) : (
              filteredTables.map((table, index) => (
                <div key={table.id} className={styles.mobileCard}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardId}>#{index + 1}</span>
                  </div>
                  <div className={styles.cardBody}>
                    <p><strong>Table Number:</strong> {table.table_no}</p>
                  </div>
                  <div className={styles.cardActions}>
                    <button type="button" onClick={() => handleEdit(table)} className={styles.mobileBtnEdit}>Edit</button>
                    <button type="button" onClick={() => handleDelete(table.id)} className={styles.mobileBtnDel}>Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

    </div>
  );
}

export default TableSetupModule;