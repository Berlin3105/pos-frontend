import React, { useState, useEffect, useRef } from 'react';
import styles from './ProductSetupModule.module.css';

function ProductSetupModule() {
  const [activeTab, setActiveTab] = useState('entry'); 
  const [products, setProducts] = useState([]);
  
  // தனித்தனி குரூப் லிஸ்ட்களுக்கான ஸ்டேட்ஸ்
  const [englishGroups, setEnglishGroups] = useState([]);
  const [tamilGroups, setTamilGroups] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);

  // [மாற்றம்]: Product Name இன்புட்டை Focus செய்ய ஒரு Ref-ஐ உருவாக்குகிறோம்
  const productNameRef = useRef(null);

  // Form States
  const [formData, setFormData] = useState({
    product_code: '',
    product_name: '',
    tamil_product_name: '',
    ac_rate: '',
    non_ac_rate: '',
    hsn_code: '',
    product_group: '',
    tamil_product_group: '',
    unit: ''
  });

  // அடுத்த குறியீடு, தயாரிப்புகள் மற்றும் தனித்தனி குழுக்களை எடுக்கும் பங்க்ஷன்
  const fetchNextCode = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/products/next-code');
      const data = await res.json();
      setFormData(prev => ({ ...prev, product_code: data.nextCode }));
    } catch (err) {
      console.error("Error fetching product code:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const fetchAllGroups = async () => {
    try {
      const [resEn, resTa] = await Promise.all([
        fetch('http://localhost:5000/api/products/groups-en'),
        fetch('http://localhost:5000/api/products/groups-ta')
      ]);
      const dataEn = await resEn.json();
      const dataTa = await resTa.json();
      
      setEnglishGroups(dataEn);
      setTamilGroups(dataTa);
    } catch (err) {
      console.error("Error fetching group lists:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchAllGroups();
    if (!editingId) fetchNextCode();
  }, [editingId]);

  // தொடக்கத்தில் அல்லது டேப் மாறும்போது Product Name-ல் ஃபோகஸ் வைக்க
  useEffect(() => {
    if (activeTab === 'entry' && productNameRef.current) {
      productNameRef.current.focus();
    }
  }, [activeTab]);

  // இன்புட் மாற்றங்களை நிர்வகிக்க
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // படிவத்தைச் சமர்ப்பிக்க (Save / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingId 
      ? `http://localhost:5000/api/products/${editingId}` 
      : 'http://localhost:5000/api/products';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        alert(editingId ? "Product Updated Successfully!" : "Product Saved Successfully!");
        
        // ஃபார்மை ரீசெட் செய்கிறோம்
        resetForm();
        
        // டேட்டாவை ரெஃப்ரெஷ் செய்கிறோம்
        fetchProducts();
        fetchAllGroups();
        
        // புதிய Product Code லோட் ஆக இதைக் கூப்பிடுகிறோம்
        await fetchNextCode(); 

        // [மாற்றம்]: சேவ் ஆன பிறகு கர்சர் தானாகவே Product Name பாக்ஸிற்குள் ஃபோகஸ் ஆகும்
        if (productNameRef.current) {
          productNameRef.current.focus();
        }
      }
    } catch (err) {
      alert("Error saving product data!");
    }
  };

  // திருத்த (Edit Trigger)
  const handleEdit = (product) => {
    setEditingId(product.id);
    setFormData({
      product_code: product.product_code,
      product_name: product.product_name,
      tamil_product_name: product.tamil_product_name || '',
      ac_rate: product.ac_rate,
      non_ac_rate: product.non_ac_rate,
      hsn_code: product.hsn_code || '',
      product_group: product.product_group || '',
      tamil_product_group: product.tamil_product_group || '',
      unit: product.unit || ''
    });
    setActiveTab('entry');
  };

  // நீக்க (Delete Trigger)
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const res = await fetch(`http://localhost:5000/api/products/${id}`, { method: 'DELETE' });
        if (res.ok) {
          alert("Product Deleted Successfully!");
          fetchProducts();
          fetchAllGroups();
          if (!editingId) fetchNextCode();
        }
      } catch (err) {
        alert("Error deleting product!");
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      product_code: '',
      product_name: '',
      tamil_product_name: '',
      ac_rate: '',
      non_ac_rate: '',
      hsn_code: '',
      product_group: '',
      tamil_product_group: '',
      unit: ''
    });
  };

  // தேடல் வடிகட்டி
  const filteredProducts = products.filter(p => 
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.product_code.toString().includes(searchQuery)
  );

  return (
    <div className={styles.container}>
      
      {/* Header */}
      <div className={styles.header}>
        <h2>📦 Product Setup Module</h2>
      </div>

      {/* Tab Sheets Layout */}
      <div className={styles.tabLayout}>
        <button
          onClick={() => setActiveTab('entry')}
          className={`${styles.tabBtn} ${activeTab === 'entry' ? styles.activeTab : styles.inactiveTab}`}
        >
          📥 Product Entry
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`${styles.tabBtn} ${activeTab === 'list' ? styles.activeTab : styles.inactiveTab}`}
        >
          📋 Product List ({products.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'entry' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className={styles.formGrid}>
            
            {/* Product Code */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Product Code</label>
              <input 
                type="text" 
                name="product_code"
                value={formData.product_code}
                readOnly
                className={`${styles.inputField} ${styles.readOnlyField}`}
              />
            </div>

            {/* Product Name */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Product Name *</label>
              <input 
                type="text" 
                name="product_name"
                ref={productNameRef} // [மாற்றம்]: Ref-ஐ இங்கு இணைத்துள்ளோம்
                required
                value={formData.product_name}
                onChange={handleChange}
                placeholder="Enter english name"
                className={styles.inputField}
              />
            </div>

            {/* Tamil Product Name */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Tamil Product Name</label>
              <input 
                type="text" 
                name="tamil_product_name"
                value={formData.tamil_product_name}
                onChange={handleChange}
                placeholder="தமிழ் பெயர் உள்ளிடவும்"
                className={styles.inputField}
              />
            </div>

            {/* AC Rate */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>AC Rate (₹)</label>
              <input 
                type="number" 
                step="0.01"
                name="ac_rate"
                value={formData.ac_rate}
                onChange={handleChange}
                placeholder="0.00"
                className={styles.inputField}
              />
            </div>

            {/* Non-AC Rate */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Non-AC Rate (₹)</label>
              <input 
                type="number" 
                step="0.01"
                name="non_ac_rate"
                value={formData.non_ac_rate}
                onChange={handleChange}
                placeholder="0.00"
                className={styles.inputField}
              />
            </div>

            {/* HSN Code */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>HSN Code</label>
              <input 
                type="text" 
                name="hsn_code"
                value={formData.hsn_code}
                onChange={handleChange}
                placeholder="Enter HSN"
                className={styles.inputField}
              />
            </div>

            {/* Product Group (Combo Box) */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Product Group</label>
              <input 
                type="text" 
                name="product_group"
                list="english-group-list"
                value={formData.product_group}
                onChange={handleChange}
                placeholder="Type or select group"
                className={styles.inputField}
              />
              <datalist id="english-group-list">
                {englishGroups.map((group, index) => (
                  <option key={index} value={group} />
                ))}
              </datalist>
            </div>

            {/* Tamil Product Group (Combo Box) */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Tamil Product Group</label>
              <input 
                type="text" 
                name="tamil_product_group"
                list="tamil-group-list"
                value={formData.tamil_product_group}
                onChange={handleChange}
                placeholder="டைப் செய்யவும் அல்லது தேர்ந்தெடுக்கவும்"
                className={styles.inputField}
              />
              <datalist id="tamil-group-list">
                {tamilGroups.map((group, index) => (
                  <option key={index} value={group} />
                ))}
              </datalist>
            </div>

            {/* Unit */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Unit</label>
              <input 
                type="text" 
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                placeholder="e.g., NOS, QTY, PCS"
                className={styles.inputField}
              />
            </div>

          </div>

          {/* Form Action Buttons */}
          <div className={styles.btnGroup}>
            <button type="submit" className={styles.btnSubmit}>
              {editingId ? 'Update Product' : 'Save Product'}
            </button>
            <button type="button" onClick={resetForm} className={styles.btnCancel}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        /* List Tab View */
        <div className="space-y-4">
          <div className={styles.searchBox}>
            <label className={styles.label}>Search Products</label>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search by Product Name or Code..."
              className={styles.inputField}
            />
          </div>

          {/* Desktop Table */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th>Code</th>
                  <th>Product Name</th>
                  <th>Tamil Name</th>
                  <th>AC Rate</th>
                  <th>Non-AC Rate</th>
                  <th>Group</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => (
                    <tr key={p.id}>
                      <td className={styles.textCode}>{p.product_code}</td>
                      <td className={styles.textBold}>{p.product_name}</td>
                      <td className={styles.textMuted}>{p.tamil_product_name || '-'}</td>
                      <td className={styles.textBlue}>₹{parseFloat(p.ac_rate).toFixed(2)}</td>
                      <td className={styles.textGreen}>₹{parseFloat(p.non_ac_rate).toFixed(2)}</td>
                      <td>{p.product_group || '-'}</td>
                      <td className="text-center">
                        <button onClick={() => handleEdit(p)} className={styles.btnEdit}>Edit</button>
                        <button onClick={() => handleDelete(p.id)} className={styles.btnDelete}>Delete</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400 font-bold uppercase">No products found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile View Cards */}
          <div className={styles.mobileCardsGrid}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <div key={p.id} className={styles.mobileCard}>
                  <div className={styles.cardHeader}>
                    <span className={styles.badgeCode}>CODE: {p.product_code}</span>
                    <span className={styles.badgeUnit}>{p.unit || 'NOS'}</span>
                  </div>
                  <div>
                    <h4 className={styles.cardTitle}>{p.product_name}</h4>
                    <p className={styles.cardSubTitle}>{p.tamil_product_name || 'தமிழ் பெயர் இல்லை'}</p>
                  </div>
                  <div className={styles.ratesBox}>
                    <div>
                      <span className={styles.rateLabel}>AC Rate</span>
                      <b className={styles.textBlue}>₹{parseFloat(p.ac_rate).toFixed(2)}</b>
                    </div>
                    <div>
                      <span className={styles.rateLabel}>Non-AC Rate</span>
                      <b className={styles.textGreen}>₹{parseFloat(p.non_ac_rate).toFixed(2)}</b>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Group: <b>{p.product_group || '-'}</b> {p.tamil_product_group ? `(${p.tamil_product_group})` : ''}
                  </div>
                  <div className={styles.mobileActions}>
                    <button onClick={() => handleEdit(p)} className={styles.mobileBtnEdit}>Edit</button>
                    <button onClick={() => handleDelete(p.id)} className={styles.mobileBtnDelete}>Delete</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-50 p-6 border text-center text-slate-400 font-bold uppercase">No products found.</div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}

export default ProductSetupModule;