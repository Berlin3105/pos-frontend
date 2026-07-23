import React, { useState, useEffect, useRef } from 'react';
import styles from './CompanySetupModule.module.css'; //[cite: 10]

function CompanySetupModule() {
  const [ledgers, setLedgers] = useState([]); //[cite: 10]
  const [systemPrinters, setSystemPrinters] = useState([]); // 👈 விண்டோஸ் பிரிண்டர்களைச் சேமிக்க
  const [companyId, setCompanyId] = useState(null); //[cite: 10]
  const [imageFile, setImageFile] = useState(null); //[cite: 10]
  const [imagePreview, setImagePreview] = useState(''); //[cite: 10]

  const companyNameRef = useRef(null); //[cite: 10]
  const fileInputRef = useRef(null); //[cite: 10]

  

  // Form States
  const [formData, setFormData] = useState({
    company_name: '', //[cite: 10]
    address1: '', //[cite: 10]
    address2: '', //[cite: 10]
    address3: '', //[cite: 10]
    state: '', //[cite: 10]
    state_code: '', //[cite: 10]
    mobile_no: '', //[cite: 10]
    phone_no: '', //[cite: 10]
    gst_no: '', //[cite: 10]
    email_no: '', //[cite: 10]
    cash_in_hand_account: '', //[cite: 10]
    sales_account: '', //[cite: 10]
    existing_image: '', //[cite: 10]
    // 👈 புதிய பிரிண்டர் மற்றும் லாங்குவேஜ் ஸ்டேட்கள்
    kot_printer: '',
    sales_printer: '',
    report_printer: '',
    kot_lang: 'English',
    sales_lang: 'English'         
  });
  //const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'https://pos-backend-kuog.onrender.com'; // ✅ BACKEND_URL
  // சிஸ்டம் பிரிண்டர் பட்டியலை எடுக்க
  const fetchSystemPrinters = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/system-printers`);
      const data = await res.json();
      setSystemPrinters(data);
    } catch (err) { console.error("Error fetching system printers:", err); }
  };

  const fetchLedgers = async () => { //[cite: 10]
    try {
      const res = await fetch(`${BACKEND_URL}/api/ledgers`); //[cite: 10]
      const data = await res.json(); //[cite: 10]
      setLedgers(data); //[cite: 10]
    } catch (err) { console.error("Error fetching ledgers:", err); } //[cite: 10]
  };

  const fetchCompanyProfile = async () => { //[cite: 10]
    try {
      const res = await fetch(`${BACKEND_URL}/api/companies/single`); //[cite: 10]
      const data = await res.json(); //[cite: 10]
      
      if (data) { //[cite: 10]
        setCompanyId(data.id); //[cite: 10]
        setFormData({
          company_name: data.company_name, //[cite: 10]
          address1: data.address1 || '', //[cite: 10]
          address2: data.address2 || '', //[cite: 10]
          address3: data.address3 || '', //[cite: 10]
          state: data.state || '', //[cite: 10]
          state_code: data.state_code || '', //[cite: 10]
          mobile_no: data.mobile_no || '', //[cite: 10]
          phone_no: data.phone_no || '', //[cite: 10]
          gst_no: data.gst_no || '', //[cite: 10]
          email_no: data.email_no || '', //[cite: 10]
          cash_in_hand_account: data.cash_in_hand_account || '', //[cite: 10]
          sales_account: data.sales_account || '', //[cite: 10]
          existing_image: data.image_path || '', //[cite: 10]
          // 👈 டேட்டாபேஸில் இருந்து செட்டிங்ஸை லோடு செய்ய
          kot_printer: data.kot_printer || '',
          sales_printer: data.sales_printer || '',
          report_printer: data.report_printer || '',
          kot_lang: data.kot_lang || 'English',
          sales_lang: data.sales_lang || 'English'
        });
        if (data.image_path) { //[cite: 10]
          setImagePreview(`${BACKEND_URL}/${data.image_path}`); //[cite: 10]
        }
      }
    } catch (err) { console.error("Error fetching company profile:", err); } //[cite: 10]
  };

  useEffect(() => {
    fetchSystemPrinters(); // 👈 பிரிண்டர்களை லோடு செய்ய அழைக்கிறோம்
    fetchLedgers(); //[cite: 10]
    fetchCompanyProfile(); //[cite: 10]
  }, []);

  useEffect(() => { //[cite: 10]
    if (companyNameRef.current) { //[cite: 10]
      companyNameRef.current.focus(); //[cite: 10]
    }
  }, []); //[cite: 10]

  const handleChange = (e) => { //[cite: 10]
    const { name, value } = e.target; //[cite: 10]
    setFormData(prev => ({ ...prev, [name]: value })); //[cite: 10]
  }; //[cite: 10]

  const handleImageChange = (e) => { //[cite: 10]
    const file = e.target.files[0]; //[cite: 10]
    if (file) { //[cite: 10]
      setImageFile(file); //[cite: 10]
      setImagePreview(URL.createObjectURL(file)); //[cite: 10]
    }
  }; //[cite: 10]

  const handleSubmit = async (e) => { //[cite: 10]
    e.preventDefault(); //[cite: 10]
    
    const data = new FormData(); //[cite: 10]
    
    if (companyId) { //[cite: 10]
      data.append('id', companyId); //[cite: 10]
    } else {
      data.append('id', ''); //[cite: 10]
    }
    
    Object.keys(formData).forEach(key => { //[cite: 10]
      const value = formData[key] === null ? '' : formData[key]; //[cite: 10]
      data.append(key, value); //[cite: 10]
    }); //[cite: 10]
    
    if (imageFile) { //[cite: 10]
      data.append('image', imageFile); //[cite: 10]
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/companies/save-single`, { //[cite: 10]
        method: 'POST', //[cite: 10]
        body: data //[cite: 10]
      });
      
      const result = await res.json(); //[cite: 10]

      if (res.ok) { //[cite: 10]
        alert(result.message); //[cite: 10]
        setImageFile(null); //[cite: 10]
        if (fileInputRef.current) fileInputRef.current.value = ''; //[cite: 10]
        fetchCompanyProfile(); //[cite: 10]
      } else {
        alert("Server Error: " + (result.error || "Failed to save")); //[cite: 10]
      }
    } catch (err) { 
      console.error("Submit Error:", err); //[cite: 10]
      alert("Error saving company details!"); //[cite: 10]
    }
  };

  return (
    <div className={styles.container}> {/*[cite: 10] */}
      <div className={styles.header}> {/*[cite: 10] */}
        <h2>🏢 Company Setup Profile</h2> {/*[cite: 10] */}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4"> {/*[cite: 10] */}
        <div className={styles.formGrid}> {/*[cite: 10] */}
          
          {/* ... பழைய ஃபீல்டுகள் அனைத்தும் அப்படியே இருக்கும் (Company Name முதல் Sales Account வரை) ... */}
          <div className={styles.fieldGroup}> {/*[cite: 10] */}
            <label className={styles.label}>Company Name *</label> {/*[cite: 10] */}
            <input type="text" name="company_name" ref={companyNameRef} required value={formData.company_name} onChange={handleChange} className={styles.inputField} /> {/*[cite: 10] */}
          </div>
          <div className={styles.fieldGroup}> {/*[cite: 10] */}
            <label className={styles.label}>Address 1</label> {/*[cite: 10] */}
            <input type="text" name="address1" value={formData.address1} onChange={handleChange} className={styles.inputField} /> {/*[cite: 10] */}
          </div>
          <div className={styles.fieldGroup}> {/*[cite: 10] */}
            <label className={styles.label}>Address 2</label> {/*[cite: 10] */}
            <input type="text" name="address2" value={formData.address2} onChange={handleChange} className={styles.inputField} /> {/*[cite: 10] */}
          </div>
          <div className={styles.fieldGroup}> {/*[cite: 10] */}
            <label className={styles.label}>Address 3</label> {/*[cite: 10] */}
            <input type="text" name="address3" value={formData.address3} onChange={handleChange} className={styles.inputField} /> {/*[cite: 10] */}
          </div>
          <div className={styles.fieldGroup}> {/*[cite: 10] */}
            <label className={styles.label}>State</label> {/*[cite: 10] */}
            <input type="text" name="state" value={formData.state} onChange={handleChange} className={styles.inputField} /> {/*[cite: 10] */}
          </div>
          <div className={styles.fieldGroup}> {/*[cite: 10] */}
            <label className={styles.label}>State Code</label> {/*[cite: 10] */}
            <input type="text" name="state_code" value={formData.state_code} onChange={handleChange} className={styles.inputField} /> {/*[cite: 10] */}
          </div>
          <div className={styles.fieldGroup}> {/*[cite: 10] */}
            <label className={styles.label}>Mobile No</label> {/*[cite: 10] */}
            <input type="text" name="mobile_no" value={formData.mobile_no} onChange={handleChange} className={styles.inputField} /> {/*[cite: 10] */}
          </div>
          <div className={styles.fieldGroup}> {/*[cite: 10] */}
            <label className={styles.label}>Phone No</label> {/*[cite: 10] */}
            <input type="text" name="phone_no" value={formData.phone_no} onChange={handleChange} className={styles.inputField} /> {/*[cite: 10] */}
          </div>
          <div className={styles.fieldGroup}> {/*[cite: 10] */}
            <label className={styles.label}>GST No</label> {/*[cite: 10] */}
            <input type="text" name="gst_no" value={formData.gst_no} onChange={handleChange} className={styles.inputField} /> {/*[cite: 10] */}
          </div>
          <div className={styles.fieldGroup}> {/*[cite: 10] */}
            <label className={styles.label}>Email ID</label> {/*[cite: 10] */}
            <input type="email" name="email_no" value={formData.email_no} onChange={handleChange} className={styles.inputField} /> {/*[cite: 10] */}
          </div>

          <div className={styles.fieldGroup}> {/*[cite: 10] */}
            <label className={styles.label}>Cash-In-Hand Account</label> {/*[cite: 10] */}
            <select name="cash_in_hand_account" value={formData.cash_in_hand_account} onChange={handleChange} className={styles.selectField}> {/*[cite: 10] */}
              <option value="">-- Select Cash Ledger --</option> {/*[cite: 10] */}
              {ledgers.map(l => (<option key={l.id} value={l.id}>{l.ledger_id} - {l.ledger_name}</option>))} {/*[cite: 10] */}
            </select> {/*[cite: 10] */}
          </div>

          <div className={styles.fieldGroup}> {/*[cite: 10] */}
            <label className={styles.label}>Sales Account</label> {/*[cite: 10] */}
            <select name="sales_account" value={formData.sales_account} onChange={handleChange} className={styles.selectField}> {/*[cite: 10] */}
              <option value="">-- Select Sales Ledger --</option> {/*[cite: 10] */}
              {ledgers.map(l => (<option key={l.id} value={l.id}>{l.ledger_id} - {l.ledger_name}</option>))} {/*[cite: 10] */}
            </select> {/*[cite: 10] */}
          </div>

          {/* ──────────────────────────────────────────────────────── */}
          {/* ✨ புதிய பிரிண்டர் மற்றும் மொழித் தேர்வுகள் (NEW SECTIONS) */}
          {/* ──────────────────────────────────────────────────────── */}
          
          {/* KOT Printer Dropdown */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>KOT Printer</label>
            <select name="kot_printer" value={formData.kot_printer} onChange={handleChange} className={styles.selectField}>
              <option value="">-- Select KOT Printer --</option>
              {systemPrinters.map((name, idx) => (
                <option key={idx} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Sales Printer Dropdown */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Sales / Bill Printer</label>
            <select name="sales_printer" value={formData.sales_printer} onChange={handleChange} className={styles.selectField}>
              <option value="">-- Select Sales Printer --</option>
              {systemPrinters.map((name, idx) => (
                <option key={idx} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Report Printer Dropdown */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Report Printer</label>
            <select name="report_printer" value={formData.report_printer} onChange={handleChange} className={styles.selectField}>
              <option value="">-- Select Report Printer --</option>
              {systemPrinters.map((name, idx) => (
                <option key={idx} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* KOT Language Dropdown */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>KOT Print Language</label>
            <select name="kot_lang" value={formData.kot_lang} onChange={handleChange} className={styles.selectField}>
              <option value="English">English</option>
              <option value="Tamil">தமிழ் (Tamil)</option>
            </select>
          </div>

          {/* Sales Language Dropdown */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Sales Print Language</label>
            <select name="sales_lang" value={formData.sales_lang} onChange={handleChange} className={styles.selectField}>
              <option value="English">English</option>
              <option value="Tamil">தமிழ் (Tamil)</option>
            </select>
          </div>

          {/* Company Logo Image Browse */}
          <div className={styles.fieldGroup}> {/*[cite: 10] */}
            <label className={styles.label}>Company Logo / Image</label> {/*[cite: 10] */}
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className={styles.inputField} /> {/*[cite: 10] */}
            {imagePreview && ( //[cite: 10]
              <div className={styles.imagePreviewBox}> {/*[cite: 10] */}
                <img src={imagePreview} alt="Preview" className={styles.previewImg} /> {/*[cite: 10] */}
              </div> //[cite: 10]
            )}
          </div>

        </div>

        <div className={styles.btnGroup}> {/*[cite: 10] */}
          <button type="submit" className={styles.btnSubmit}> {/*[cite: 10] */}
            {companyId ? 'Update Profile' : 'Save Profile'} {/*[cite: 10] */}
          </button> {/*[cite: 10] */}
        </div>
      </form>
    </div>
  );
}

export default CompanySetupModule;