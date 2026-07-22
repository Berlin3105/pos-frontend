import React, { useState, useEffect } from 'react';
import styles from './WaiterSetupModule.module.css';

function WaiterSetupModule() {
  const [activeTab, setActiveTab] = useState('entry'); 
  const [waiters, setWaiters] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [formData, setFormData] = useState({
    id: '', 
    waiter_id: '',
    waiter_name: '',
    tamil_waiter_name: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  // அனைத்து வெயிட்டர்களையும் சர்வரில் இருந்து எடுக்க
  const fetchWaiters = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/waiters');
      const data = await res.json();
      setWaiters(data);
    } catch (err) {
      console.error("Error fetching waiters:", err);
    }
  };

  // அடுத்த ஆட்டோ இன்க்ரிமென்ட் Waiter ID-ஐ எடுக்க
  const fetchNextWaiterId = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/waiters/next-id');
      const data = await res.json();
      setFormData(prev => ({ ...prev, waiter_id: data.nextId }));
    } catch (err) {
      console.error("Error fetching next ID:", err);
    }
  };

  useEffect(() => {
    fetchWaiters();
    if (!isEditing) {
      fetchNextWaiterId();
    }
  }, [isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // சேவ் / அப்டேட் செய்ய
  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isEditing 
      ? `http://localhost:5000/api/waiters/${formData.id}`
      : 'http://localhost:5000/api/waiters';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: 'HEAD' === method ? 'POST' : method, // பாதுகாப்பிற்காக உங்கள் மெத்தட் லாஜிக்
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert(isEditing ? "Waiter Updated Successfully!" : "Waiter Saved Successfully!");
        
        // [சரிசெய்யப்பட்டது]: முதலில் லிஸ்டை புதுப்பித்துவிட்டு, பிறகு ஃபார்மை ரீசெட் செய்கிறோம்
        fetchWaiters();
        resetForm(); // இது ஆட்டோமேட்டிக்காக புதிய Waiter ID-ஐ எடுத்துக்கொள்ளும்
       // setActiveTab('list');
      }
    } catch (err) {
      console.error("Error saving waiter:", err);
    }
  };

  // எடிட் செய்ய டேட்டாவை ஃபார்மிற்கு கொண்டு செல்ல
  const handleEdit = (waiter) => {
    setFormData({
      id: waiter.id,
      waiter_id: waiter.waiter_id,
      waiter_name: waiter.waiter_name,
      tamil_waiter_name: waiter.tamil_waiter_name || ''
    });
    setIsEditing(true);
    setActiveTab('entry');
  };

  // வெயிட்டரை நீக்க
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this waiter?")) {
      try {
        const res = await fetch(`http://localhost:5000/api/waiters/${id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          alert("Waiter Deleted Successfully!");
          fetchWaiters();
        }
      } catch (err) {
        console.error("Error deleting waiter:", err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      waiter_id: '',
      waiter_name: '',
      tamil_waiter_name: ''
    });
    setIsEditing(false);
    fetchNextWaiterId();
  };

  // தேடுதல் லாஜிக்
  const filteredWaiters = waiters.filter(waiter => 
    waiter.waiter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    waiter.waiter_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      
      {/* Header & Tabs */}
      <div className={styles.headerWrapper}>
        <h3 className={styles.title}>🤵 Waiter Setup</h3>
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
            Waiter List
          </button>
        </div>
      </div>

      {/* ENTRY TAB */}
      {activeTab === 'entry' && (
        <form onSubmit={handleSubmit} className={styles.formContainer}>
          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Waiter ID</label>
              <input type="text" name="waiter_id" value={formData.waiter_id} readOnly className={styles.inputFieldDisabled} />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Waiter Name *</label>
              <input type="text" name="waiter_name" required value={formData.waiter_name} onChange={handleChange} className={styles.inputField} placeholder="Enter Waiter Name" />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Tamil Waiter Name</label>
              <input type="text" name="tamil_waiter_name" value={formData.tamil_waiter_name} onChange={handleChange} className={styles.inputField} placeholder="வெயிட்டர் பெயர் (தமிழ்)" />
            </div>
          </div>

          <div className={styles.btnGroup}>
            <button type="submit" className={styles.btnSubmit}>
              {isEditing ? 'Update Waiter' : 'Save Waiter'}
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
              placeholder="🔍 Search by Name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Desktop Table View (பெரிய ஸ்கிரீன்களுக்கு) */}
          <div className={styles.tableResponsive}>
            <table className={styles.waiterTable}>
              <thead>
                <tr className={styles.tableHeaderRow}>
                  <th style={{ width: '20%' }}>Waiter ID</th>
                  <th style={{ width: '35%' }}>Waiter Name (English)</th>
                  <th style={{ width: '30%' }}>Waiter Name (Tamil)</th>
                  <th style={{ width: '15%' }}>Actions</th>
                </tr>
              </thead>
              <tbody className={styles.tableBodyRow}>
                {filteredWaiters.length === 0 ? (
                  <tr>
                    <td colSpan="4" className={styles.noRecordsCell}>No Waiters Found.</td>
                  </tr>
                ) : (
                  filteredWaiters.map((waiter) => (
                    <tr key={waiter.id}>
                      <td className={styles.tableCellId}>{waiter.waiter_id}</td>
                      <td className={styles.tableCellName}>{waiter.waiter_name}</td>
                      <td className={styles.tableCellStandard}>{waiter.tamil_waiter_name || '-'}</td>
                      <td className={styles.tableCellActions}>
                        <button type="button" onClick={() => handleEdit(waiter)} className={styles.btnTableEdit}>Edit</button>
                        <button type="button" onClick={() => handleDelete(waiter.id)} className={styles.btnTableDel}>Del</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (மொபைல் வியூவிற்கு மட்டும்) */}
          <div className={styles.mobileCardsGrid}>
            {filteredWaiters.length === 0 ? (
              <div className={styles.noRecordsCell}>No Waiters Found.</div>
            ) : (
              filteredWaiters.map((waiter) => (
                <div key={waiter.id} className={styles.mobileCard}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardId}>{waiter.waiter_id}</span>
                  </div>
                  <div className={styles.cardBody}>
                    <p><strong>Name:</strong> {waiter.waiter_name}</p>
                    <p><strong>Tamil Name:</strong> {waiter.tamil_waiter_name || '-'}</p>
                  </div>
                  <div className={styles.cardActions}>
                    <button type="button" onClick={() => handleEdit(waiter)} className={styles.mobileBtnEdit}>Edit</button>
                    <button type="button" onClick={() => handleDelete(waiter.id)} className={styles.mobileBtnDel}>Delete</button>
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

export default WaiterSetupModule;