import React, { useState, useEffect } from 'react';
import styles from './SalesModule.module.css';

function SalesModule() {
  const [activeTab, setActiveTab] = useState('token_billing'); // 'token_billing' | 'direct_billing'
  const [activeTokens, setActiveTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);

  // Direct / Selected Billing States
  const [tables, setTables] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [selectedTable, setSelectedTable] = useState(null);
  const [orderType, setOrderType] = useState('NON_AC');
  const [cartItems, setCartItems] = useState([]);

  // 🔢 NumPad (Number Plate) States
  const [isNumPadOpen, setIsNumPadOpen] = useState(false);
  const [activeCartIndex, setActiveCartIndex] = useState(null);
  const [numPadValue, setNumPadValue] = useState('');
  
  // Payment States
  const [paymentMode, setPaymentMode] = useState('CASH'); // CASH, UPI, CARD
  const [discount, setDiscount] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState('');

  useEffect(() => {
    fetchInitialData();
    fetchActiveTokens();
  }, []);

  const fetchInitialData = async () => {
    try {
      const tRes = await fetch('http://localhost:5000/api/tables');
      setTables(await tRes.json());

      const gRes = await fetch('http://localhost:5000/api/product-groups');
      setGroups(await gRes.json());

      const pRes = await fetch('http://localhost:5000/api/products');
      const pData = await pRes.json();
      setProducts(pData);
      setFilteredProducts(pData);
    } catch (err) {
      console.error("Error loading master data:", err);
    }
  };

  // ஆர்டர் என்ட்ரியில் போட்ட நிலுவையில் உள்ள (Pending) டோக்கன்களை மட்டும் எடுக்கிறது
  const fetchActiveTokens = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/orders/pending-tokens');
      if (res.ok) {
        const data = await res.json();
        setActiveTokens(data);
      }
    } catch (err) {
      console.error("Error loading pending tokens:", err);
    }
  };

  // டோக்கனை கிளிக் செய்யும் போது அந்த ஆர்டர் விபரங்களை கார்ட்டில் ஏற்றுவது
  const handleSelectToken = async (token) => {
    setSelectedToken(token);
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${token.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTable(data.order.table_id);
        setOrderType(data.order.order_type);
        
        const loadedCart = data.items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          qty: Number(item.qty),
          rate: Number(item.rate),
          value: Number(item.value)
        }));
        setCartItems(loadedCart);
      }
    } catch (err) {
      console.error("Error loading token details:", err);
    }
  };

  // நேரடி ப்ராடக்ட் சேர்க்கை
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

  const handleGroupSelect = (groupName) => {
    setSelectedGroup(groupName);
    setFilteredProducts(products.filter(p => p.product_group === groupName));
  };

  // 🔢 Number Plate / NumPad Functions
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

  const removeFromCart = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  // கணக்கீடுகள்
  const grossValue = cartItems.reduce((sum, item) => sum + item.value, 0);
  const netPayable = Math.max(0, grossValue - Number(discount));
  const balanceToReturn = Math.max(0, Number(receivedAmount) - netPayable);

  // சேல்ஸ் முடித்து பேமெண்ட் போடும் ஃபங்க்ஷன்
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
      const res = await fetch('http://localhost:5000/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salesData)
      });

      if (res.ok) {
        alert("✅ Sales Bill Completed Successfully!");
        setCartItems([]);
        setSelectedToken(null);
        setSelectedTable(null);
        setReceivedAmount('');
        setDiscount(0);
        fetchActiveTokens();
      }
    } catch (err) {
      console.error("Error processing sales:", err);
    }
  };

  return (
    <div className={styles.salesContainer}>
      {/* Header */}
      <div className={styles.salesHeader}>
        <h2>💳 Sales & Payment Entry</h2>
        <div className={styles.tabGroup}>
          <button 
            className={activeTab === 'token_billing' ? styles.activeTab : ''} 
            onClick={() => setActiveTab('token_billing')}
          >
            🎟️ Active Tokens ({activeTokens.length})
          </button>
          <button 
            className={activeTab === 'direct_billing' ? styles.activeTab : ''} 
            onClick={() => setActiveTab('direct_billing')}
          >
            ⚡ Direct Counter Billing
          </button>
        </div>
      </div>

      <div className={styles.salesBody}>
        {/* LEFT PANEL */}
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
              {/* Table Selection Grid */}
              <div className={styles.gridBlock}>
                <h4>🍽️ Select Table</h4>
                <div className={styles.touchGrid}>
                  {tables.map(t => (
                    <button 
                      key={t.id} 
                      type="button" 
                      onClick={() => setSelectedTable(t.id)} 
                      className={`${styles.gridBtn} ${selectedTable === t.id ? styles.selectedBtn : ''}`}
                    >
                      T - {t.table_no}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.typeBlock} style={{ margin: '10px 0' }}>
                <button 
                  type="button" 
                  onClick={() => setOrderType('NON_AC')} 
                  className={`${styles.typeBtn} ${orderType === 'NON_AC' ? styles.activeNonAc : ''}`}
                >
                  Non-AC
                </button>
                <button 
                  type="button" 
                  onClick={() => setOrderType('AC')} 
                  className={`${styles.typeBtn} ${orderType === 'AC' ? styles.activeAc : ''}`}
                >
                  AC Room
                </button>
              </div>

              {/* Group Grid */}
              <div className={styles.groupGrid}>
                <button 
                  type="button" 
                  onClick={() => { setSelectedGroup(null); setFilteredProducts(products); }} 
                  className={`${styles.groupBtn} ${!selectedGroup ? styles.selectedGroupBtn : ''}`}
                >
                  All Items
                </button>
                {groups.map((g, idx) => (
                  <button 
                    key={idx} 
                    type="button" 
                    onClick={() => handleGroupSelect(g.name)} 
                    className={`${styles.groupBtn} ${selectedGroup === g.name ? styles.selectedGroupBtn : ''}`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>

              {/* Product Grid */}
              <div className={styles.productGrid}>
                {filteredProducts.map((p) => {
                  const cartItem = cartItems.find(item => item.product_id === p.id);
                  const productCount = cartItem ? cartItem.qty : 0;
                  const displayPrice = orderType === 'AC' ? (p.ac_rate || 0) : (p.non_ac_rate || 0);

                  const handleMinusClick = (e) => {
                    e.stopPropagation();
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
                              cursor: 'pointer'
                            }}
                          >
                            -
                          </button>
                          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '12px' }}>{productCount}</span>
                          <span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '13px' }}>+</span>
                        </div>
                      )}

                      {p.product_image ? (
                        <img src={`http://localhost:5000/uploads/${p.product_image}`} alt={p.product_name} className={styles.productImg} />
                      ) : (
                        <div className={styles.noImgPlaceholder}>🍲</div>
                      )}
                      
                      <div className={styles.productInfo} style={{ padding: '8px' }}>
                        <div className={styles.pNameName}>{p.product_name}</div>
                        <div className={styles.pTamilName}>{p.tamil_name || ''}</div>
                        <div style={{ fontWeight: 'bold', color: '#1d4ed8', fontSize: '0.8rem', marginTop: '6px' }}>
                          ₹{displayPrice}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: BILLING */}
        <div className={styles.rightPanel}>
          <div className={styles.billHeader}>
            <h3>🧾 Checkout Bill</h3>
            {selectedToken && (
              <span className={styles.activeTokenTag}>Token #{selectedToken.token_no} Selected</span>
            )}
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
                      {/* Qty Click செய்தால் Number Plate Opens */}
                      <button 
                        type="button" 
                        className={styles.qtyTouchBtn} 
                        onClick={() => openNumPad(idx, item.qty)}
                      >
                        {item.qty} 📝
                      </button>
                    </td>
                    <td>₹{item.rate}</td>
                    <td>₹{item.value}</td>
                    <td>
                      <button type="button" onClick={() => removeFromCart(idx)} className={styles.cartDelBtn}>X</button>
                    </td>
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
              <input 
                type="number" 
                value={discount} 
                onChange={(e) => setDiscount(e.target.value)} 
                className={styles.payInput}
              />
            </div>

            <div className={`${styles.payRow} ${styles.netPayableRow}`}>
              <span>Net Payable:</span>
              <span>₹{netPayable.toFixed(2)}</span>
            </div>

            <div className={styles.modeGroup}>
              {['CASH', 'UPI', 'CARD'].map(mode => (
                <button
                  key={mode}
                  type="button"
                  className={`${styles.modeBtn} ${paymentMode === mode ? styles.activeMode : ''}`}
                  onClick={() => setPaymentMode(mode)}
                >
                  {mode === 'CASH' ? '💵 Cash' : mode === 'UPI' ? '📱 UPI' : '💳 Card'}
                </button>
              ))}
            </div>

            {paymentMode === 'CASH' && (
              <>
                <div className={styles.payRow}>
                  <span>Received Amt:</span>
                  <input 
                    type="number" 
                    value={receivedAmount} 
                    onChange={(e) => setReceivedAmount(e.target.value)} 
                    placeholder={netPayable.toString()}
                    className={styles.payInput}
                  />
                </div>
                <div className={styles.payRow}>
                  <span>Balance Return:</span>
                  <strong style={{ color: '#dc2626' }}>₹{balanceToReturn.toFixed(2)}</strong>
                </div>
              </>
            )}

            <button 
              type="button" 
              onClick={completeSalesAndPayment} 
              className={styles.paySubmitBtn}
            >
              🚀 COMPLETE PAYMENT & PRINT
            </button>
          </div>
        </div>
      </div>

      {/* 🔢 NumPad (Number Plate) Modal */}
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

export default SalesModule;