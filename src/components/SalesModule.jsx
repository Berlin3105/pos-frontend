import React, { useState, useEffect } from 'react';
import styles from './SalesModule.module.css';
import { BACKEND_URL } from '../config.js';

function SalesModule() {
  const [activeTab, setActiveTab] = useState('token_billing'); // 'token_billing' | 'direct_billing' | 'sales_list'
  const [activeTokens, setActiveTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);

  // Sales List States
  const [salesList, setSalesList] = useState([]);
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));

  // Billing States
  const [nextBillNo, setNextBillNo] = useState('');
  const [tables, setTables] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [selectedTable, setSelectedTable] = useState(null);
  const [orderType, setOrderType] = useState('NON_AC');
  const [cartItems, setCartItems] = useState([]);

  // NumPad States
  const [isNumPadOpen, setIsNumPadOpen] = useState(false);
  const [activeCartIndex, setActiveCartIndex] = useState(null);
  const [numPadValue, setNumPadValue] = useState('');
  
  // Payment States
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [discount, setDiscount] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState('');

  useEffect(() => {
    fetchInitialData();
    fetchActiveTokens();
    fetchNextBillNo();
  }, []);

  useEffect(() => {
    if (activeTab === 'sales_list') {
      fetchSalesList();
    }
  }, [activeTab]);

  const fetchNextBillNo = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/next-bill-no`);
      const data = await res.json();
      setNextBillNo(data.bill_no);
    } catch (err) { console.error("Error fetching bill no:", err); }
  };

  const fetchInitialData = async () => {
    try {
      const tRes = await fetch(`${BACKEND_URL}/api/tables`);
      setTables(await tRes.json());

      const gRes = await fetch(`${BACKEND_URL}/api/product-groups`);
      setGroups(await gRes.json());

      const pRes = await fetch(`${BACKEND_URL}/api/products`);
      const pData = await pRes.json();
      setProducts(pData);
      setFilteredProducts(pData);
    } catch (err) { console.error("Error loading master data:", err); }
  };

  const fetchActiveTokens = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/pending-tokens`);
      if (res.ok) setActiveTokens(await res.json());
    } catch (err) { console.error("Error loading pending tokens:", err); }
  };

  const fetchSalesList = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales?from_date=${fromDate}&to_date=${toDate}`);
      if (res.ok) setSalesList(await res.json());
    } catch (err) { console.error("Error loading sales list:", err); }
  };

  const handleSelectToken = async (token) => {
    setSelectedToken(token);
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${token.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTable(data.order.table_id);
        setOrderType(data.order.order_type);
        
        setCartItems(data.items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          qty: Number(item.qty),
          rate: Number(item.rate),
          value: Number(item.value)
        })));
      }
    } catch (err) { console.error("Error loading token details:", err); }
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

  const openNumPad = (index, currentQty) => {
    setActiveCartIndex(index);
    setNumPadValue(currentQty.toString());
    setIsNumPadOpen(true);
  };

  const handleNumPadKeyPress = (key) => {
    if (key === 'C') setNumPadValue('');
    else if (key === '⌫') setNumPadValue(prev => prev.slice(0, -1));
    else if (numPadValue.length < 3) setNumPadValue(prev => prev + key);
  };

  const saveNumPadValue = () => {
    const finalQty = parseInt(numPadValue) || 1;
    const updated = [...cartItems];
    updated[activeCartIndex].qty = finalQty;
    updated[activeCartIndex].value = finalQty * updated[activeCartIndex].rate;
    setCartItems(updated);
    setIsNumPadOpen(false);
  };

  const removeFromCart = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const grossValue = cartItems.reduce((sum, item) => sum + item.value, 0);
  const netPayable = Math.max(0, grossValue - Number(discount));
  const balanceToReturn = Math.max(0, Number(receivedAmount) - netPayable);

  const completeSalesAndPayment = async () => {
    if (cartItems.length === 0) {
      alert("Please select items for billing!");
      return;
    }

    const salesData = {
      order_id: selectedToken ? selectedToken.id : null,
      token_no: selectedToken ? selectedToken.token_no : null,
      table_id: selectedTable,
      gross_value: grossValue,
      discount: Number(discount),
      net_payable: netPayable,
      payment_mode: paymentMode,
      received_amount: Number(receivedAmount) || netPayable,
      balance_returned: balanceToReturn,
      items: cartItems
    };

    try {
      const res = await fetch(`${BACKEND_URL}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salesData)
      });

      if (res.ok) {
        const result = await res.json();
        alert(`✅ Sales Bill ${result.bill_no} Completed Successfully!`);
        setCartItems([]);
        setSelectedToken(null);
        setSelectedTable(null);
        setReceivedAmount('');
        setDiscount(0);
        fetchActiveTokens();
        fetchNextBillNo();
      }
    } catch (err) { console.error("Error processing sales:", err); }
  };

  const handleDeleteSales = async (id) => {
    if (window.confirm("Are you sure you want to delete this bill?")) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/sales/${id}`, { method: 'DELETE' });
        if (res.ok) {
          alert("Bill deleted successfully!");
          fetchSalesList();
        }
      } catch (err) { console.error("Error deleting bill:", err); }
    }
  };

  const handleEditSales = async (salesData) => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/orders/${salesData.order_id}`);
    if (res.ok) {
      const data = await res.json();
      setSelectedTable(data.order.table_id);
      setOrderType(data.order.order_type);
      setCartItems(data.items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        qty: Number(item.qty),
        rate: Number(item.rate),
        value: Number(item.value)
      })));
      setActiveTab('direct_billing'); // Direct Billing டேப்பிற்கு அழைத்துச் செல்லும்
    }
  } catch (err) {
    console.error("Error loading sales for edit:", err);
  }
};

  const handleReprintSales = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/reprint/${id}`);
      if (res.ok) alert("🖨️ Re-print request sent to printer!");
    } catch (err) { console.error("Error printing bill:", err); }
  };

  return (
    <div className={styles.salesContainer}>
      <div className={styles.salesHeader}>
        <h2>💳 Sales & Payment Entry <span className={styles.billBadge}>[{nextBillNo}]</span></h2>
        <div className={styles.tabGroup}>
          <button className={activeTab === 'token_billing' ? styles.activeTab : ''} onClick={() => setActiveTab('token_billing')}>
            🎟️ Active Tokens ({activeTokens.length})
          </button>
          <button className={activeTab === 'direct_billing' ? styles.activeTab : ''} onClick={() => setActiveTab('direct_billing')}>
            ⚡ Direct Counter Billing
          </button>
          <button className={activeTab === 'sales_list' ? styles.activeTab : ''} onClick={() => setActiveTab('sales_list')}>
            📋 Sales List
          </button>
        </div>
      </div>

      {activeTab === 'sales_list' ? (
        /* SALES LIST VIEW */
        <div className={styles.listViewContainer}>
          <div className={styles.filterBar}>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={styles.dateInput} />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={styles.dateInput} />
            <button onClick={fetchSalesList} className={styles.filterBtn}>🔍 Filter</button>
          </div>

          <table className={styles.listTable}>
            <thead>
              <tr>
                <th>Bill No</th>
                <th>Date</th>
                <th>Token</th>
                <th>Table</th>
                <th>Mode</th>
                <th>Net Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {salesList.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center' }}>No sales records found.</td></tr>
              ) : (
                salesList.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.bill_no}</strong></td>
                    <td>{new Date(s.sales_date).toLocaleString()}</td>
                    <td>{s.token_no || 'Counter'}</td>
                    <td>{s.table_no}</td>
                    <td>{s.payment_mode}</td>
                    <td>₹{Number(s.net_payable).toFixed(2)}</td>
                    <td className={styles.actionTd}>
                      {/* Edit Button சேர்க்கப்பட்டுள்ளது */}
                      <button onClick={() => handleEditSales(s)} className={styles.btnEdit}>✏️ Edit</button>
                      <button onClick={() => handleReprintSales(s.id)} className={styles.btnPrint}>🖨️ Print</button>
                      <button onClick={() => handleDeleteSales(s.id)} className={styles.btnDelete}>🗑️ Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* BILLING ENTRY VIEW */
        <div className={styles.salesBody}>
          <div className={styles.leftPanel}>
            {activeTab === 'token_billing' ? (
              <div className={styles.tokenSection}>
                <h4>📌 Active Order Tokens (Click to Bill)</h4>
                {activeTokens.length === 0 ? (
                  <div className={styles.noTokens}>No pending tokens available!</div>
                ) : (
                  <div className={styles.tokenGrid}>
                    {activeTokens.map((t) => (
                      <div 
                        key={t.id} 
                        className={`${styles.tokenCard} ${selectedToken?.id === t.id ? styles.selectedTokenCard : ''}`}
                        onClick={() => handleSelectToken(t)}
                      >
                        <div className={styles.tokenBadge}>Token #{t.token_no}</div>
                        <div className={styles.tokenDetails}>
                          <span>🍽️ Table: {t.table_no || 'N/A'}</span>
                          <span>🤵 Waiter: {t.waiter_name}</span>
                          <span>💰 Amt: ₹{t.net_value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.directBillingSection}>
                {/* Table Grid */}
                <div className={styles.gridBlock}>
                  <h4>🍽️ Select Table</h4>
                  <div className={styles.touchGrid}>
                    {tables.map(t => (
                      <button key={t.id} type="button" onClick={() => setSelectedTable(t.id)} className={`${styles.gridBtn} ${selectedTable === t.id ? styles.selectedBtn : ''}`}>
                        T - {t.table_no}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Group Grid */}
                <div className={styles.groupGrid} style={{ marginTop: '10px' }}>
                  <button type="button" onClick={() => { setSelectedGroup(null); setFilteredProducts(products); }} className={`${styles.groupBtn} ${!selectedGroup ? styles.selectedGroupBtn : ''}`}>All</button>
                  {groups.map((g, idx) => (
                    <button key={idx} type="button" onClick={() => { setSelectedGroup(g.name); setFilteredProducts(products.filter(p => p.product_group === g.name)); }} className={`${styles.groupBtn} ${selectedGroup === g.name ? styles.selectedGroupBtn : ''}`}>
                      {g.name}
                    </button>
                  ))}
                </div>

                {/* Product Grid */}
                <div className={styles.productGrid}>
                  {filteredProducts.map((p) => (
                    <div key={p.id} className={styles.productCard} onClick={() => addToCart(p)}>
                      <div className={styles.pNameName}>{p.product_name}</div>
                      <div style={{ fontWeight: 'bold', color: '#1d4ed8', marginTop: '4px' }}>
                        ₹{orderType === 'AC' ? (p.ac_rate || 0) : (p.non_ac_rate || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: BILLING */}
          <div className={styles.rightPanel}>
            <div className={styles.billHeader}>
              <h3>🧾 Bill Checkout</h3>
              {selectedToken && <span className={styles.activeTokenTag}>Token #{selectedToken.token_no} Selected</span>}
            </div>

            <div className={styles.cartScroll}>
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
                  {cartItems.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.product_name}</td>
                      <td>
                        <button type="button" className={styles.qtyTouchBtn} onClick={() => openNumPad(idx, item.qty)}>
                          {item.qty} 📝
                        </button>
                      </td>
                      <td>₹{item.rate}</td>
                      <td>₹{item.value}</td>
                      <td><button type="button" onClick={() => removeFromCart(idx)} className={styles.cartDelBtn}>X</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.paymentBox}>
              <div className={styles.payRow}>
                <span>Sub Total:</span>
                <strong>₹{grossValue.toFixed(2)}</strong>
              </div>

              <div className={styles.payRow}>
                <span>Discount (₹):</span>
                <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className={styles.payInput} />
              </div>

              <div className={`${styles.payRow} ${styles.netPayableRow}`}>
                <span>Net Payable:</span>
                <span>₹{netPayable.toFixed(2)}</span>
              </div>

              <div className={styles.modeGroup}>
                {['CASH', 'UPI', 'CARD'].map(mode => (
                  <button key={mode} type="button" className={`${styles.modeBtn} ${paymentMode === mode ? styles.activeMode : ''}`} onClick={() => setPaymentMode(mode)}>
                    {mode}
                  </button>
                ))}
              </div>

              <button type="button" onClick={completeSalesAndPayment} className={styles.paySubmitBtn}>
                🚀 SAVE & PRINT ({nextBillNo})
              </button>
            </div>
          </div>
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
                <button key={key} type="button" onClick={() => handleNumPadKeyPress(key)} className={styles.numPadBtn}>
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

export default SalesModule;