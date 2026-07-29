import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShoppingBag, Trash2, Plus, Minus, Printer, CheckCircle, 
  Search, RefreshCw, X, User, Phone, MapPin, Scissors, HardDrive
} from 'lucide-react';

const OrderSetupModule = () => {
  // State variables
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart & Order State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Measurements Modal State
  const [selectedItemForMeasurement, setSelectedItemForMeasurement] = useState(null);
  const [itemMeasurements, setItemMeasurements] = useState({});

  // Loading & Action States
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // API call placeholders - update URLs as per your backend structure
      const catRes = await axios.get('/api/categories');
      const itemRes = await axios.get('/api/items');
      setCategories(catRes.data || []);
      setItems(itemRes.data || []);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add Item to Cart
  const addToCart = (item) => {
    const existingIndex = cart.findIndex(c => c.id === item.id);
    if (existingIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].qty += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, { 
        ...item, 
        qty: 1, 
        price: item.price || 0,
        measurements: {} 
      }]);
    }
  };

  // Update Cart Quantity
  const updateQuantity = (id, delta) => {
    const updatedCart = cart.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean);
    setCart(updatedCart);
  };

  // Remove Item from Cart
  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Calculate Totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const grandTotal = Math.max(0, subtotal - Number(discountAmount));
  const balanceAmount = Math.max(0, grandTotal - Number(advanceAmount));

  // Save Measurements for a Cart Item
  const handleSaveMeasurements = (itemId, measurementsData) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        return { ...item, measurements: measurementsData };
      }
      return item;
    }));
    setSelectedItemForMeasurement(null);
  };

  // Customer Receipt Print HTML Generator
  const generateCustomerBillHtml = (orderData) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Customer Bill</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Hind+Madurai:wght@400;700&display=swap');
          
          @page {
            size: 80mm auto; 
            margin: 0px;
          }

          html, body { 
            width: 270px; 
            height: auto;
            margin: 0 auto; 
            padding: 5px; 
            font-family: 'Hind Madurai', monospace, sans-serif; 
            font-size: 13px; 
            color: #000; 
            overflow: hidden;
            page-break-inside: avoid;
          }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 8px; }
          .header h2 { margin: 0; font-size: 18px; font-weight: bold; }
          .header p { margin: 2px 0; font-size: 11px; }
          .info { margin-bottom: 8px; font-size: 12px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          th { border-bottom: 1px solid #000; text-align: left; padding: 3px 0; font-size: 11px; }
          td { padding: 4px 0; font-size: 12px; }
          .totals { border-top: 1px dashed #000; padding-top: 5px; font-size: 12px; }
          .totals-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
          .grand-total { font-weight: bold; font-size: 14px; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 3px 0; margin: 4px 0; }
          .footer { text-align: center; margin-top: 10px; font-size: 11px; border-top: 1px dashed #000; padding-top: 5px; margin-bottom: 0px; padding-bottom: 0px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>TAILORING SHOP</h2>
          <p>Order Receipt / பில்</p>
          <p>Ph: +91 98765 43210</p>
        </div>
        
        <div class="info">
          <div class="info-row"><span>Order No:</span> <strong>#${orderData.id || 'NEW'}</strong></div>
          <div class="info-row"><span>Date:</span> <span>${new Date().toLocaleDateString('en-IN')}</span></div>
          <div class="info-row"><span>Name:</span> <span>${orderData.customerName}</span></div>
          <div class="info-row"><span>Phone:</span> <span>${orderData.customerPhone}</span></div>
          <div class="info-row"><span>Delivery:</span> <strong>${orderData.deliveryDate}</strong></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item / பொருள்</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Amt</th>
            </tr>
          </thead>
          <tbody>
            ${orderData.cart.map(item => `
              <tr>
                <td>${item.name}</td>
                <td style="text-align:center;">${item.qty}</td>
                <td style="text-align:right;">₹${item.price * item.qty}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row"><span>Subtotal:</span> <span>₹${orderData.subtotal}</span></div>
          ${orderData.discountAmount > 0 ? `<div class="totals-row"><span>Discount:</span> <span>-₹${orderData.discountAmount}</span></div>` : ''}
          <div class="totals-row grand-total"><span>Grand Total:</span> <span>₹${orderData.grandTotal}</span></div>
          <div class="totals-row"><span>Advance Paid:</span> <span>₹${orderData.advanceAmount}</span></div>
          <div class="totals-row" style="font-weight:bold;"><span>Balance Due:</span> <span>₹${orderData.balanceAmount}</span></div>
        </div>

        <div class="footer">
          <p>நன்றி! மீண்டும் வருக!</p>
          <p>Please bring this slip during delivery.</p>
        </div>
      </body>
      </html>
    `;
  };

  // Kitchen/Workplace Ticket HTML Generator (KOT/Work Order)
  const generateKitchenKOTHtml = (orderData) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Work Order Slip</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Hind+Madurai:wght@400;700&display=swap');
          
          @page {
            size: 80mm auto; 
            margin: 0px;
          }

          html, body { 
            width: 270px; 
            height: auto;
            margin: 0 auto; 
            padding: 5px; 
            font-family: 'Hind Madurai', monospace, sans-serif; 
            font-size: 13px; 
            color: #000; 
            overflow: hidden;
            page-break-inside: avoid;
          }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 8px; }
          .header h2 { margin: 0; font-size: 18px; }
          .info { margin-bottom: 8px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
          .item-box { border: 1px solid #000; padding: 6px; margin-bottom: 8px; border-radius: 4px; }
          .item-title { font-size: 14px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 4px; }
          .measure-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; }
          .measure-item { background: #f0f0f0; padding: 2px 4px; border-radius: 2px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>WORK ORDER / தையல் குறிப்பு</h2>
          <p>Order #${orderData.id || 'NEW'} | Delivery: <strong>${orderData.deliveryDate}</strong></p>
        </div>

        <div class="info">
          <div><strong>Customer:</strong> ${orderData.customerName}</div>
          <div><strong>Phone:</strong> ${orderData.customerPhone}</div>
          ${orderData.orderNotes ? `<div><strong>Notes:</strong> ${orderData.orderNotes}</div>` : ''}
        </div>

        ${orderData.cart.map(item => `
          <div class="item-box">
            <div class="item-title">${item.name} x ${item.qty}</div>
            <div class="measure-grid">
              ${Object.entries(item.measurements || {}).map(([key, val]) => `
                <div class="measure-item"><strong>${key}:</strong> ${val}</div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </body>
      </html>
    `;
  };

  // Handle Print Triggers[cite: 1]
  const triggerCustomerBillPrint = (orderData) => {
    const custHtml = generateCustomerBillHtml(orderData);
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    printWindow.document.write(custHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const triggerKitchenKOTPrint = (orderData) => {
    const kotHtml = generateKitchenKOTHtml(orderData);
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    printWindow.document.write(kotHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Submit Order
  const handleSubmitOrder = async (shouldPrint = true) => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }
    if (!customerName || !customerPhone) {
      alert("Please enter customer details!");
      return;
    }

    setSubmitting(true);
    const payload = {
      customerName,
      customerPhone,
      deliveryDate,
      orderNotes,
      cart,
      subtotal,
      discountAmount,
      grandTotal,
      advanceAmount,
      balanceAmount,
      createdAt: new Date().toISOString()
    };

    try {
      const res = await axios.post('/api/orders', payload);
      const createdOrder = res.data || { id: Math.floor(Math.random() * 10000), ...payload };

      if (shouldPrint) {
        triggerCustomerBillPrint(createdOrder);
        triggerKitchenKOTPrint(createdOrder);
      }

      setSuccessMessage("Order created successfully!");
      
      // Reset Form
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryDate('');
      setOrderNotes('');
      setAdvanceAmount(0);
      setDiscountAmount(0);

      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("Failed to submit order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter Items
  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      
      {/* LEFT SECTION: Items & Catalog */}
      <div className="flex-1 flex flex-col gap-4">
        
        {/* Top Search & Refresh */}
        <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Search items / உடைகள் தேடுக..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button 
            onClick={fetchInitialData}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600 transition"
            title="Refresh Catalog"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              selectedCategory === 'ALL'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id || cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                selectedCategory === cat.name
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-y-auto max-h-[calc(100vh-220px)] p-1">
          {filteredItems.map((item) => (
            <div 
              key={item.id}
              onClick={() => addToCart(item)}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-500 cursor-pointer transition flex flex-col justify-between group"
            >
              <div>
                <div className="w-full h-24 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 transition">
                  <Scissors className="w-8 h-8 text-indigo-500" />
                </div>
                <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">{item.name}</h3>
                <p className="text-xs text-gray-500">{item.category}</p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-bold text-indigo-600 text-base">₹{item.price}</span>
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition">
                  <Plus className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SECTION: Cart & Customer Info */}
      <div className="w-full lg:w-[420px] bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-48px)] sticky top-6">
        
        {/* Cart Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 rounded-t-2xl">
          <div className="flex items-center gap-2 font-bold text-gray-800 text-lg">
            <ShoppingBag className="w-5 h-5 text-indigo-600" />
            <span>New Order Cart</span>
          </div>
          <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            {cart.length} Items
          </span>
        </div>

        {/* Customer Input Details */}
        <div className="p-4 border-b border-gray-100 space-y-3 bg-white">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Customer Name / பெயர் *"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Mobile / எண் *"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div className="relative">
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
              <ShoppingBag className="w-12 h-12 stroke-1 mb-2" />
              <p className="text-sm">No items in cart</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800 text-sm">{item.name}</span>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1 hover:bg-gray-100 text-gray-600 rounded-l-lg"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-semibold text-gray-700">{item.qty}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 hover:bg-gray-100 text-gray-600 rounded-r-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedItemForMeasurement(item)}
                    className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-md font-medium border border-indigo-200 hover:bg-indigo-100 transition flex items-center gap-1"
                  >
                    <Scissors className="w-3 h-3" />
                    Measurements ({Object.keys(item.measurements || {}).length})
                  </button>

                  <span className="font-bold text-gray-800 text-sm">₹{item.price * item.qty}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calculation & Checkout Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl space-y-3">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            
            <div className="flex justify-between items-center text-gray-600">
              <span>Discount</span>
              <input 
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className="w-20 px-2 py-0.5 text-right border border-gray-300 rounded text-sm focus:outline-none"
              />
            </div>

            <div className="flex justify-between font-bold text-gray-800 text-base border-t border-gray-200 pt-1.5">
              <span>Grand Total</span>
              <span>₹{grandTotal}</span>
            </div>

            <div className="flex justify-between items-center text-gray-600 pt-1">
              <span>Advance Paid</span>
              <input 
                type="number"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                className="w-20 px-2 py-0.5 text-right border border-gray-300 rounded text-sm focus:outline-none"
              />
            </div>

            <div className="flex justify-between font-bold text-indigo-600 text-sm border-t border-dashed border-gray-300 pt-1.5">
              <span>Balance Due</span>
              <span>₹{balanceAmount}</span>
            </div>
          </div>

          {successMessage && (
            <div className="p-2 bg-green-100 border border-green-300 text-green-700 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Submit Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => handleSubmitOrder(false)}
              disabled={submitting || cart.length === 0}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2.5 rounded-xl transition text-sm disabled:opacity-50"
            >
              Save Only
            </button>
            <button
              onClick={() => handleSubmitOrder(true)}
              disabled={submitting || cart.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              Print & Save
            </button>
          </div>
        </div>
      </div>

      {/* Measurement Modal Placeholder Component */}
      {selectedItemForMeasurement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 text-lg">
                Measurements for {selectedItemForMeasurement.name}
              </h3>
              <button 
                onClick={() => setSelectedItemForMeasurement(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mb-4">
              Enter key measurements below (e.g., Length, Chest, Waist):
            </p>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {['Length', 'Chest', 'Waist', 'Shoulder', 'Sleeve'].map((field) => (
                <div key={field} className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700">{field}</label>
                  <input
                    type="text"
                    defaultValue={selectedItemForMeasurement.measurements?.[field] || ''}
                    onChange={(e) => {
                      setItemMeasurements(prev => ({ ...prev, [field]: e.target.value }));
                    }}
                    className="w-32 px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedItemForMeasurement(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveMeasurements(selectedItemForMeasurement.id, itemMeasurements)}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Save Measurements
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderSetupModule;