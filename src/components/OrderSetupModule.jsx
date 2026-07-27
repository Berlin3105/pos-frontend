import React, { useState, useEffect } from 'react';
import styles from './OrderSetupModule.module.css';
import { BACKEND_URL } from '../config.js';

function OrderSetupModule() {
  const [activeTab, setActiveTab] = useState('entry');
  const [ordersList, setOrdersList] = useState([]);
  const [editingOrderId, setEditingOrderId] = useState(null);
  
  // கிரிட் லோடிங் ஸ்டேட்ஸ்
  const [waiters, setWaiters] = useState([]);
  const [tables, setTables] = useState([]);
  const [groups, setGroups] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // மாஸ்டர் செலக்ட் ஸ்டேட்ஸ்
  const [selectedWaiter, setSelectedWaiter] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [orderType, setOrderType] = useState('NON_AC'); 
  const [currentUser, setCurrentUser] = useState(null);

  const [orderNo, setOrderNo] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [isNumPadOpen, setIsNumPadOpen] = useState(false);
  const [activeCartIndex, setActiveCartIndex] = useState(null);
  const [numPadValue, setNumPadValue] = useState('');
  const [gstPercent, setGstPercent] = useState(5); 

  // கம்பெனி விபரங்கள் ஸ்டேட் (server.js -இல் உள்ளவாறு தலைப்பு/முகவரி காட்ட)
  const [company, setCompany] = useState(null);

  // இன்னைய தேதியை YYYY-MM-DD வடிவில் பெற
  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // தேதி ஸ்டேட்கள் (Default ஆக தற்போதைய தேதி இருக்கும்)
  const [fromDate, setFromDate] = useState(getTodayDateString());
  const [toDate, setToDate] = useState(getTodayDateString());

  // குறிப்பிட்ட தேதிகளுக்குள் உள்ள ஆர்டர்களை மட்டும் எடுக்கும் ஃபங்க்ஷன்
  const fetchFilteredOrders = async (fDate, tDate) => {
    try {
      const targetFrom = fDate || fromDate;
      const targetTo = tDate || toDate;
      
      const res = await fetch(`${BACKEND_URL}/api/orders?from_date=${targetFrom}&to_date=${targetTo}`);
      if (res.ok) {
        const data = await res.json();
        setOrdersList(data);
      }
    } catch (err) {
      console.error("Error loading filtered orders:", err);
    }
  };

 // ==========================================
  // ⚡ 100% கச்சிதமான அட்மின் & லிங்க்டு வெயிட்டர் லாஜிக்
  // ==========================================
  const displayedWaiters = waiters.filter(w => {
    if (!currentUser) return false;

    const loggedInUser = (currentUser.username || '').toString().trim().toLowerCase();
    const userRole = (currentUser.role || '').toString().trim().toLowerCase();

    // 🔗 கண்டிஷன் 1: முதலிடம் 'linked_waiters'-க்கு! (அட்மினாக இருந்தாலும் ஐடி இருந்தால் அதுமட்டுமே காட்டும்)
    if (currentUser.linked_waiters && currentUser.linked_waiters !== 'null' && currentUser.linked_waiters !== '') {
      let linkedIds = [];
      if (Array.isArray(currentUser.linked_waiters)) {
        linkedIds = currentUser.linked_waiters.map(Number);
      } else {
        const cleanStr = String(currentUser.linked_waiters).replace(/[\[\]]/g, '');
        linkedIds = cleanStr ? cleanStr.split(',').map(Number) : [];
      }

      if (linkedIds.length > 0) {
        const dbId = Number(w.id);
        const rawCustomId = w.waiter_id ? String(w.waiter_id).replace(/[^0-9]/g, '') : '';
        const dbCustomId = rawCustomId ? Number(rawCustomId) : null;

        return linkedIds.includes(dbId) || (dbCustomId !== null && linkedIds.includes(dbCustomId));
      }
    }

    // 👑 கண்டிஷன் 2: linked_waiters காலியாக இருந்து, ரோல் அல்லது பெயர் 'admin' ஆக இருந்தால் எல்லாரும் லோடு ஆவார்கள்
    if (userRole === 'admin' || loggedInUser === 'admin') {
      return true; 
    }

    // 🤵 கண்டிஷன் 3: சாதாரண ஆபரேட்டராக இருந்து linked_waiters காலியாக இருந்தால், அவர் பெயரில் உள்ளவர் மட்டும் வருவார்
    if (loggedInUser && w.waiter_name) {
      return w.waiter_name.toLowerCase() === loggedInUser;
    }

    return false;
  });

  // 1. முதலாவது useEffect - லோக்கல் ஸ்டோரேஜ் மற்றும் API டேட்டாவை லோடு செய்கிறது
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    console.log("=== LOCALSTORAGE USER ===", storedUser); 
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    fetchInitialData();
  }, []);

  // 2. ஆட்டோ செலக்ட் லாஜிக் (பில்டருக்கு கீழே வைக்கப்பட்டுள்ளது)
  useEffect(() => {
    if (displayedWaiters.length > 0 && !selectedWaiter) {
      setSelectedWaiter(Number(displayedWaiters[0].id));
    }
  }, [waiters, currentUser, displayedWaiters, selectedWaiter]);

  // நிதியாண்டைக் கணக்கிடும் ஃபங்க்ஷன்
  const getFinancialYearPrefix = () => {
    const today = new Date();
    const currentMonth = today.getMonth(); 
    const currentYear = today.getFullYear();
    let startYear, endYear;

    if (currentMonth >= 3) {
      startYear = currentYear;
      endYear = currentYear + 1;
    } else {
      startYear = currentYear - 1;
      endYear = currentYear;
    }
    return `ORD ${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}/`;
  };

  const [orderPfx] = useState(getFinancialYearPrefix());

  // AC/NON_AC மாறும்போது கார்ட் விலைகளை மாற்றுவது
  useEffect(() => {
    const updatedCart = cartItems.map(item => {
      const origProd = products.find(p => p.id === item.product_id);
      if (origProd) {
        const newRate = orderType === 'AC' ? origProd.ac_rate : origProd.non_ac_rate;
        return { ...item, rate: newRate, value: item.qty * newRate };
      }
      return item;
    });
    setCartItems(updatedCart);
  }, [orderType]);


  const fetchInitialData = async () => {
    try {
      const noRes = await fetch(`${BACKEND_URL}/api/orders/next-no`);
      const noData = await noRes.json();
      setOrderNo(noData.nextNo);

      const wRes = await fetch(`${BACKEND_URL}/api/waiters`);
      setWaiters(await wRes.json());

      const tRes = await fetch(`${BACKEND_URL}/api/tables`);
      setTables(await tRes.json());

      // 👇 இங்க உங்க தற்போதைய தேதி பாஸ் பண்ணி கரண்ட் டேட்டா மட்டும் எடுக்கிறோம்
      const todayStr = getTodayDateString();
      const oRes = await fetch(`${BACKEND_URL}/api/orders?from_date=${todayStr}&to_date=${todayStr}`);
      setOrdersList(await oRes.json());

      const groupRes = await fetch(`${BACKEND_URL}/api/product-groups`);
      setGroups(await groupRes.json());

      const productRes = await fetch(`${BACKEND_URL}/api/products`);
      const productData = await productRes.json();
      setProducts(productData);
      setFilteredProducts(productData); 

      // கம்பெனி விபரங்களை பெற
      const compRes = await fetch(`${BACKEND_URL}/api/companies/single`);
      if (compRes.ok) {
        setCompany(await compRes.json());
      }
    } catch (err) {
      console.error("Error loading initial POS data:", err);
    }
  };

  const handleGroupSelect = (groupName) => {
    setSelectedGroup(groupName);
    setFilteredProducts(products.filter(p => p.product_group === groupName));
  };

  const addToCart = (product) => {
    const currentRate = orderType === 'AC' ? Number(product.ac_rate || 0) : Number(product.non_ac_rate || 0);
    const existingIndex = cartItems.findIndex(item => item.product_id === product.id);

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].qty += 1;
      updated[existingIndex].value = updated[existingIndex].qty * updated[existingIndex].rate;
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, {
        product_id: product.id,
        product_name: product.product_name,
        qty: 1,
        rate: currentRate,
        value: currentRate 
      }]);
    }
  };

  const handleCartChange = (index, field, val) => {
    const updated = [...cartItems];
    updated[index][field] = parseFloat(val) || 0;
    updated[index].value = updated[index].qty * updated[index].rate;
    setCartItems(updated);
  };

  const removeFromCart = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const openNumPad = (index, currentQty) => {
    setActiveCartIndex(index);
    setNumPadValue(currentQty.toString());
    setIsNumPadOpen(true);
  };

  const handleNumPadKeyPress = (key) => {
    if (key === 'C') {
      setNumPadValue('');
    } else if (key === '⌫') {
      setNumPadValue(prev => prev.slice(0, -1));
    } else {
      if (numPadValue.length < 3) {
        setNumPadValue(prev => prev + key);
      }
    }
  };

  const saveNumPadValue = () => {
    const finalQty = parseInt(numPadValue) || 1;
    const updated = [...cartItems];
    updated[activeCartIndex].qty = finalQty;
    updated[activeCartIndex].value = finalQty * updated[activeCartIndex].rate;
    setCartItems(updated);
    setIsNumPadOpen(false);
  };

  const grossValue = cartItems.reduce((sum, item) => sum + item.value, 0);
  const gstValue = (grossValue * gstPercent) / 100;
  const netValue = grossValue + gstValue;

  const saveOrder = async (isPrint = true) => {
    if (!selectedWaiter || !selectedTable || cartItems.length === 0) {
      alert("Please select Waiter, Table and at least one Product!");
      return;
    }

    const today = new Date();
    const orderData = {
      order_pfx: orderPfx,
      order_no: orderNo,
      order_date: today.toISOString().split('T')[0],
      order_time: today.toTimeString().split(' ')[0],
      waiter_id: typeof selectedWaiter === 'object' && selectedWaiter !== null ? Number(selectedWaiter.id) : Number(selectedWaiter),
      table_id: typeof selectedTable === 'object' && selectedTable !== null ? Number(selectedTable.id) : Number(selectedTable),
      order_type: orderType,
      gross_value: grossValue,
      gst_percent: gstPercent,
      gst_value: gstValue,
      net_value: netValue,
      items: cartItems,
      is_print: false // Backend silent print-ஐ தவிர்க்க false தருகிறோம்
    };

    try {
      const url = editingOrderId ? `${BACKEND_URL}/api/orders/${editingOrderId}` : `${BACKEND_URL}/api/orders`;
      const method = editingOrderId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (res.ok) {
        const resData = await res.json();
        if (isPrint) {
          // server.js -இல் உள்ள அதே ஸ்டைல் படி பில் மற்றும் KOT பிரின்ட் எடுக்கப்படுகிறது
          handleBrowserPrint(resData.token_no || '001');
        } else {
          alert("Order Saved Successfully!");
        }
        resetPOS();
        setActiveTab('list');
      }
    } catch (err) {
      console.error("Error saving order:", err);
    }
  };

  // 🖨️ server.js -இல் உள்ள அதே டிசைனில் பிரின்ட் செய்யக்கூடிய ஃபங்க்ஷன்
  const handleBrowserPrint = (tokenNo = '001') => {
    const today = new Date();
    const currentDate = today.toISOString().split('T')[0];
    const currentTime = today.toTimeString().split(' ')[0];

    const waiterObj = waiters.find(w => Number(w.id) === Number(selectedWaiter));
    const tableObj = tables.find(t => Number(t.id) === Number(selectedTable));

    const companyName = company?.company_name || 'RESTAURANT BILL';
    const address1 = company?.address1 || '';
    const address2 = company?.address2 || '';
    const gstNo = company?.gst_no || '';

    const totalQty = cartItems.reduce((sum, item) => sum + Number(item.qty), 0);

    const printWindow = window.open('', '', 'width=400,height=700');
    
    const printHtml = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Order Receipt & KOT</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Hind+Madurai:wght@400;700&display=swap');
            body { width: 280px; margin: 0; padding: 5px; font-family: 'Hind Madurai', monospace, sans-serif; font-size: 13px; color: #000; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .title { font-size: 18px; margin-bottom: 2px; text-transform: uppercase; }
            .subtitle { font-size: 12px; margin-bottom: 10px; }
            .line { border-top: 1px dashed #000; margin: 5px 0; }
            .info-table, .items-table { width: 100%; border-collapse: collapse; }
            .info-table td { padding: 2px 0; font-size: 12px; }
            .items-table th { border-bottom: 1px dashed #000; text-align: left; padding: 4px 0; font-size: 12px; }
            .items-table td { padding: 4px 0; vertical-align: top; }
            .right { text-align: right; }
            .total-section { font-size: 14px; margin-top: 5px; }
            .page-break { page-break-after: always; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <!-- 1. CUSTOMER BILL (SERVER.JS DESIGN) -->
          <div class="center">
            <span class="bold title">${companyName}</span><br/>
            <span class="subtitle">${address1} ${address2}</span>
            ${gstNo ? `<br/><span class="subtitle">GSTIN: ${gstNo}</span>` : ''}
          </div>
          <div class="line"></div>
          <table class="info-table">
            <tr>
              <td><b>Order No:</b> ${orderPfx}${orderNo}</td>
              <td class="right"><b>Table:</b> ${tableObj ? 'Table ' + tableObj.table_no : 'N/A'}</td>
            </tr>
            <tr>
              <td><b>Date:</b> ${currentDate}</td>
              <td class="right"><b>Time:</b> ${currentTime}</td>
            </tr>
            <tr>
              <td><b>Waiter:</b> ${waiterObj ? waiterObj.waiter_name : 'N/A'}</td>
            </tr>
            <tr>
              <td class="right" colspan="2"><span style="font-size: 14px; font-weight: bold; border: 1px solid #000; padding: 1px 4px;">TOKEN: ${tokenNo}</span></td>
            </tr>
          </table>
          <div class="line"></div>
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 50%;">Item</th>
                <th class="right" style="width: 20%;">Qty</th>
                <th class="right" style="width: 30%;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${cartItems.map(item => `
                <tr>
                  <td>${item.product_name}</td>
                  <td class="right">${item.qty}</td>
                  <td class="right">₹${Number(item.value).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="line"></div>
          <table class="info-table total-section">
            <tr class="bold">
              <td>Total Qty: ${totalQty}</td>
              <td class="right">Gross: ₹${grossValue.toFixed(2)}</td>
            </tr>
            ${gstValue > 0 ? `
            <tr>
              <td></td>
              <td class="right">GST (${gstPercent}%): ₹${gstValue.toFixed(2)}</td>
            </tr>` : ''}
            <tr class="bold" style="font-size: 15px;">
              <td></td>
              <td class="right">NET TOTAL: ₹${netValue.toFixed(2)}</td>
            </tr>
          </table>
          <div class="line"></div>
          <div class="center bold" style="margin-top: 8px; font-size: 11px;">
            ~ Thank You! Visit Again ~
          </div>

          <div class="page-break"></div>

          <!-- 2. KITCHEN KOT PRINT (SERVER.JS DESIGN) -->
          <div class="center">
            <span class="bold title">** KOT / KITCHEN **</span><br/>
            <span style="font-size:16px; font-weight:bold; background:#000; color:#fff; padding:2px 5px;">Token No: ${tokenNo}</span> 
          </div>
          <div class="line"></div>
          <table class="info-table">
            <tr><td><b>Order No:</b> ${orderPfx}${orderNo}</td><td class="right"><b>Table:</b> ${tableObj ? 'Table ' + tableObj.table_no : 'N/A'}</td></tr>
            <tr><td><b>Date:</b> ${currentDate}</td><td class="right"><b>Time:</b> ${currentTime}</td></tr>
            <tr><td colspan="2"><b>Waiter:</b> ${waiterObj ? waiterObj.waiter_name : 'N/A'}</td></tr>
          </table>
          <div class="line"></div>
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 25%;">Qty</th>
                <th style="width: 75%;">Item Name</th>
              </tr>
            </thead>
            <tbody>
              ${cartItems.map(item => `
                <tr>
                  <td class="bold" style="font-size: 16px;">${item.qty}</td>
                  <td>${item.product_name}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="line"></div>
          <table class="info-table">
            <tr class="bold"><td>TOTAL QTY: ${totalQty}</td></tr>
          </table>
          <div class="line"></div>
        </body>
      </html>
    `;

    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const resetPOS = () => {
    setEditingOrderId(null);
    setSelectedTable(null);
    setCartItems([]);
    fetchInitialData(); 
  };

  const deleteOrder = async (id) => {
    if (window.confirm("Delete this order?")) {
      await fetch(`${BACKEND_URL}/api/orders/${id}`, { method: 'DELETE' });
      fetchInitialData();
    }
  };

  const startEditOrder = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setEditingOrderId(data.order.id);
        setOrderNo(data.order.order_no);
        setSelectedWaiter(data.order.waiter_id ? Number(data.order.waiter_id) : null);
        setSelectedTable(data.order.table_id ? Number(data.order.table_id) : null);
        setOrderType(data.order.order_type);
        setGstPercent(Number(data.order.gst_percent));

        const loadedCart = data.items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          qty: Number(item.qty),
          rate: Number(item.rate),
          value: Number(item.value)
        }));
        setCartItems(loadedCart);
        setActiveTab('entry');
      }
    } catch (err) {
      console.error("Error fetching order for edit:", err);
    }
  };

  return (
    <div className={styles.posContainer}>
      <div className={styles.posHeader}>
        <h2>🛒 POS Order Setup</h2>
        <div className={styles.tabButtons}>
          <button onClick={() => { setActiveTab('entry'); resetPOS(); }} className={activeTab === 'entry' ? styles.activeTab : ''}>POS Screen</button>
          {/* <button onClick={() => setActiveTab('list')} className={activeTab === 'list' ? styles.activeTab : ''}>Orders List</button> */}
          <button 
            onClick={() => { 
              setActiveTab('list'); 
              fetchFilteredOrders(); 
            }} 
            className={activeTab === 'list' ? styles.activeTab : ''}
          >
            Orders List
          </button>
        </div>
      </div>

      {activeTab === 'entry' ? (
        <div className={styles.posBody}>
          <div className={styles.gridSection}>
            
            {/* Waiter Grid */}
            <div className={styles.gridBlock}>
              <h4>🤵 Select Waiter</h4>
              <div className={styles.touchGrid}>
                {displayedWaiters.map(w => (
                  <button 
                    key={w.id} 
                    type="button" 
                    onClick={() => setSelectedWaiter(w.id)} 
                    className={`${styles.gridBtn} ${selectedWaiter && String(selectedWaiter) === String(w.id) ? styles.selectedBtn : ''}`}
                  >
                    {w.waiter_name}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Grid */}
            <div className={styles.gridBlock}>
              <h4>🍽️ Select Table</h4>
              <div className={styles.touchGrid}>
                {tables.map(t => (
                  <button key={t.id} type="button" onClick={() => setSelectedTable(t.id)} className={`${styles.gridBtn} ${selectedTable === t.id ? styles.selectedBtn : ''}`}>T - {t.table_no}</button>
                ))}
              </div>
            </div>

            <div className={styles.typeBlock}>
              <button type="button" onClick={() => setOrderType('NON_AC')} className={`${styles.typeBtn} ${orderType === 'NON_AC' ? styles.activeNonAc : ''}`}>Non-AC</button>
              <button type="button" onClick={() => setOrderType('AC')} className={`${styles.typeBtn} ${orderType === 'AC' ? styles.activeAc : ''}`}>AC Room</button>
            </div>

            {/* Product Group Grid */}
            <div className={styles.gridBlock}>
              <h4>📁 Product Groups</h4>
              <div className={styles.groupGrid}>
                <button type="button" onClick={() => { setSelectedGroup(null); setFilteredProducts(products); }} className={`${styles.groupBtn} ${!selectedGroup ? styles.selectedGroupBtn : ''}`}>All Items</button>
                {groups && Array.isArray(groups) && groups.map((g, idx) => (
                  <button key={idx} type="button" onClick={() => handleGroupSelect(g.name)} className={`${styles.groupBtn} ${selectedGroup === g.name ? styles.selectedGroupBtn : ''}`}>{g.name}</button>
                ))}
              </div>
            </div>

            {/* 🎯 ப்ராடக்ட் கிரிட் பகுதி (AC / NON_AC ரேட் சிக்கல் சரிசெய்யப்பட்டது) */}
            <div className={styles.productGrid}>
              {filteredProducts.map((p) => {
                // 💡 கார்ட்டில் இந்த ப்ராடக்ட் ஏற்கனவே இருக்கிறதா என்று பார்க்கிறோம்
                const cartItem = cartItems.find(item => item.product_id === p.id);
                const productCount = cartItem ? cartItem.qty : 0;

                // 🔥 மாஸ் லாஜிக்: ஆர்டர் டைப் 'AC' ஆக இருந்தால் ac_rate, இல்லையென்றால் non_ac_rate ஐ எடுக்கிறோம்!
                const displayPrice = orderType === 'AC' ? (p.ac_rate || 0) : (p.non_ac_rate || 0);

                // 💡 மைனஸ் பொத்தானை அழுத்தும்போது கார்ட்டில் இருந்து அளவைக் குறைக்க
                const handleMinusClick = (e) => {
                  e.stopPropagation(); // கார்டு கிளிக் ஆகி மீண்டும் பிளஸ் ஆகாமல் தடுக்க
                  
                  if (productCount <= 1) {
                    setCartItems(prev => prev.filter(item => item.product_id !== p.id));
                  } else {
                    setCartItems(prev => prev.map(item => 
                      item.product_id === p.id 
                        ? { ...item, qty: item.qty - 1, value: (item.qty - 1) * displayPrice }
                        : item
                    ));
                  }
                };

                return (
                  <div
                    key={p.id}
                    className={styles.productCard}
                    onClick={() => addToCart(p)}
                    style={{ position: 'relative', cursor: 'pointer', minHeight: '120px' }}
                  >
                    {/* 🔢 கவுண்ட் & மைனஸ் பார் */}
                    {productCount > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#1e293b',
                        padding: '4px 8px',
                        borderRadius: '20px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        zIndex: 10
                      }}>
                        <button
                          type="button"
                          onClick={handleMinusClick}
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          -
                        </button>
                        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '12px' }}>
                          {productCount}
                        </span>
                        <span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '13px' }}>+</span>
                      </div>
                    )}

                    {p.product_image ? (
                      <img
                        src={`${BACKEND_URL}/uploads/${p.product_image}`}
                        alt={p.product_name}
                        className={styles.productImg}
                      />
                    ) : (
                      <div className={styles.noImgPlaceholder}>🍲</div>
                    )}
                    
                    <div className={styles.productInfo} style={{ padding: '8px' }}>
                      <div className={styles.pNameName}>{p.product_name}</div>
                      <div className={styles.pTamilName}>{p.tamil_name || ''}</div>
                      
                      {/* 🎯 ரேட் காட்டும் பகுதி: இப்போ உங்க டேட்டாபேஸில் உள்ள துல்லியமான விலை காட்டும்! */}
                      <div style={{ 
                        fontWeight: 'bold', 
                        color: '#1d4ed8', 
                        fontSize: '0.8rem', 
                        marginTop: '6px',
                        display: 'block'
                      }}>
                        ₹{displayPrice}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Billing Section */}
          <div className={styles.billingSection}>
            <div className={styles.billInvoiceInfo} style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
              <span><strong>Invoice No:</strong> {orderPfx}{orderNo}</span>
              {selectedWaiter && (
                <span style={{ color: '#0284c7', fontWeight: 'bold' }}>
                  🤵 Waiter: {waiters.find(w => Number(w.id) === Number(selectedWaiter))?.waiter_name || 'Unknown'}
                </span>
              )}
            </div>

            <div className={styles.cartContainer}>
              <table className={styles.cartTable}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item, index) => (
                    <tr key={index}>
                      <td>{item.product_name}</td>
                      <td>
                        <button type="button" className={styles.qtyTouchBtn} onClick={() => openNumPad(index, item.qty)}>{item.qty} 📝</button>
                      </td>
                      <td>
                        <input type="number" value={item.rate} onChange={(e) => handleCartChange(index, 'rate', e.target.value)} className={styles.cartInput} />
                      </td>
                      <td>₹{Number(item.value || 0).toFixed(2)}</td>
                      <td><button type="button" onClick={() => removeFromCart(index)} className={styles.cartDelBtn}>X</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.summaryBlock}>
              <div className={styles.summaryRow}><span>Gross Total:</span> <span>₹{grossValue.toFixed(2)}</span></div>
              <div className={styles.summaryRow}>
                <span>GST (%):</span> 
                <input type="number" value={gstPercent} onChange={(e) => setGstPercent(parseFloat(e.target.value) || 0)} className={styles.gstInput} />
              </div>
              <div className={styles.summaryRow}><span>GST Value:</span> <span>₹{gstValue.toFixed(2)}</span></div>
              <div className={styles.summaryRow} style={{fontWeight:900, fontSize:'1.1rem', color:'#0f172a'}}>
                <span>Net Payable:</span> <span>₹{netValue.toFixed(2)}</span>
              </div>
            </div>

            <div className={styles.actionBtnGroup}>
              <button type="button" onClick={() => saveOrder(false)} className={styles.btnSaveOnly}>💾 {editingOrderId ? 'Update Only' : 'Save Only'}</button>
              <button type="button" onClick={() => saveOrder(true)} className={styles.btnSavePrint}>⚡ {editingOrderId ? 'Update & Print' : 'Save & Print'}</button>
            </div>
          </div>

        </div>
      ) : (
        /* LIST VIEW TAB */
        <div className={styles.listContainer}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px', background: '#f1f5f9', padding: '10px', borderRadius: '6px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', marginRight: '5px', color: '#475569' }}>From Date:</label>
              <input 
                type="date" 
                value={fromDate} 
                onChange={(e) => setFromDate(e.target.value)} 
                style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', marginRight: '5px', color: '#475569' }}>To Date:</label>
              <input 
                type="date" 
                value={toDate} 
                onChange={(e) => setToDate(e.target.value)} 
                style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
              />
            </div>
            <button 
              type="button" 
              onClick={() => fetchFilteredOrders()} 
              style={{ padding: '6px 15px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              🔄 Load Data
            </button>
          </div>
          
          <table className={styles.orderTable}>
            <thead>
              <tr>
                <th>Order No</th>
                <th>Token No</th>
                <th>Date / Time</th>
                <th>Waiter</th>
                <th>Table</th>
                <th>Type</th>
                <th>Net Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ordersList.map(o => (
                <tr key={o.id}>
                  {/* data-label ப்ராப்பர்ட்டிகள் சேர்க்கப்பட்டுள்ளன 👇 */}
                  <td data-label="Order No"><strong>{o.order_pfx}{o.order_no}</strong></td>
                  <td data-label="Token No"><mark><b>{o.token_no}</b></mark></td>
                  <td data-label="Date / Time">{o.order_date} | {o.order_time}</td>
                  <td data-label="Waiter">{o.waiter_name || 'Unknown'}</td>
                  <td data-label="Table">{o.table_no ? `Table ${o.table_no}` : 'N/A'}</td>
                  <td data-label="Type">{o.order_type}</td>
                  <td data-label="Net Value" style={{ color: '#16a34a', fontWeight: 'bold' }}>₹{o.net_value}</td>
                  <td className={styles.actionTd}>
                    <button onClick={() => startEditOrder(o.id)} className={styles.btnListEdit} style={{marginRight: '6px', background: '#eab308', color:'white', border:'none', padding:'4px 8px', cursor:'pointer'}}>Edit</button>
                    <button onClick={() => deleteOrder(o.id)} className={styles.btnListDel}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* NumPad Modal */}
      {isNumPadOpen && (
        <div className={styles.numPadOverlay}>
          <div className={styles.numPadContainer}>
            <div className={styles.numPadHeader}>
              <span>Enter Quantity</span>
              <button className={styles.closePadBtn} onClick={() => setIsNumPadOpen(false)}>X</button>
            </div>
            <div className={styles.numPadDisplay}>{numPadValue || '0'}</div>
            <div className={styles.numPadGrid}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => (
                <button 
                  key={key} 
                  type="button" 
                  onClick={() => handleNumPadKeyPress(key)}
                  className={`${styles.numPadBtn} ${key === 'C' ? styles.clearBtn : ''} ${key === '⌫' ? styles.backBtn : ''}`}
                >
                  {key}
                </button>
              ))}
            </div>
            <button type="button" onClick={saveNumPadValue} className={styles.numPadSubmitBtn}>DONE / OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderSetupModule;