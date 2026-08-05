import React, { useState, useEffect } from 'react';
import styles from './SalesReport.module.css';
import { BACKEND_URL } from '../config.js';

function SalesReport() {
  // Filter States
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedWaiter, setSelectedWaiter] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [reportType, setReportType] = useState('SUMMARY'); // 'DETAIL' | 'SUMMARY'

  // Payment Modes Checkboxes (Default: all checked)
  const [paymentModes, setPaymentModes] = useState({
    CASH: true,
    UPI: true,
    CARD: true, // Credit/Debit Card
  });

  // Data States
  const [waiters, setWaiters] = useState([]);
  const [tables, setTables] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      const wRes = await fetch(`${BACKEND_URL}/api/waiters`);
      if (wRes.ok) setWaiters(await wRes.json());

      const tRes = await fetch(`${BACKEND_URL}/api/tables`);
      if (tRes.ok) setTables(await tRes.json());
    } catch (err) {
      console.error("Error loading masters:", err);
    }
  };

  const handleCheckboxChange = (mode) => {
    setPaymentModes(prev => ({ ...prev, [mode]: !prev[mode] }));
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const activeModes = Object.keys(paymentModes).filter(m => paymentModes[m]).join(',');

      // Date strings clean-up
      let url = `${BACKEND_URL}/api/reports/sales-report?from_date=${fromDate}&to_date=${toDate}&report_type=${reportType}`;
      
      if (selectedWaiter) url += `&waiter_id=${selectedWaiter}`;
      if (selectedTable) url += `&table_id=${selectedTable}`;
      if (activeModes) url += `&payment_modes=${encodeURIComponent(activeModes)}`;

      console.log("Fetching Request URL:", url); // URL சரிபார்க்க

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        console.log("Report Data Received:", data);
        setReportData(data);
      }
    } catch (err) {
      console.error("Error fetching report:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Detail View-ல் Bill No மற்றும் Date-ஐ Group செய்ய Helper Function
  const groupDataByBill = (data) => {
    return data.reduce((groups, item) => {
      const key = `${item.bill_no}_${item.sales_date}`;
      if (!groups[key]) {
        groups[key] = {
          bill_no: item.bill_no,
          sales_date: item.sales_date,
          waiter_name: item.waiter_name,
          table_no: item.table_no,
          payment_mode: item.payment_mode,
          items: []
        };
      }
      groups[key].items.push(item);
      return groups;
    }, {});
  };

  // Calculate Totals for Summary Footer
  const totalGross = reportData.reduce((sum, i) => sum + Number(i.gross_value || 0), 0);
  const totalGst = reportData.reduce((sum, i) => sum + Number(i.gst_value || 0), 0);
  const totalDiscount = reportData.reduce((sum, i) => sum + Number(i.discount || 0), 0);
  const totalNett = reportData.reduce((sum, i) => sum + Number(i.nett_value || 0), 0);

  return (
    <div className={styles.reportContainer}>
      {/* FILTER BAR - (Print எடுக்கும் போது மறைக்கப்படும்) */}
      <div className={`${styles.filterCard} ${styles.noPrint}`}>
        <h2>📊 Sales Report Filters</h2>
        
        <div className={styles.filterGrid}>
          {/* Dates */}
          <div className={styles.filterGroup}>
            <label>From Date:</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>

          <div className={styles.filterGroup}>
            <label>To Date:</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>

          {/* Waiter Filter */}
          <div className={styles.filterGroup}>
            <label>Waiter:</label>
            <select value={selectedWaiter} onChange={(e) => setSelectedWaiter(e.target.value)}>
              <option value="">-- All Waiters --</option>
              {waiters.map(w => (
                <option key={w.id} value={w.id}>{w.waiter_name}</option>
              ))}
            </select>
          </div>

          {/* Table Filter */}
          <div className={styles.filterGroup}>
            <label>Table:</label>
            <select value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)}>
              <option value="">-- All Tables --</option>
              {tables.map(t => (
                <option key={t.id} value={t.id}>Table {t.table_no}</option>
              ))}
            </select>
          </div>

          {/* Report Type Radio Buttons */}
          <div className={styles.filterGroup}>
            <label>Report View:</label>
            <div className={styles.radioGroup}>
              <label>
                <input 
                  type="radio" 
                  name="reportType" 
                  value="SUMMARY" 
                  checked={reportType === 'SUMMARY'} 
                  onChange={() => setReportType('SUMMARY')} 
                /> Summary
              </label>
              <label>
                <input 
                  type="radio" 
                  name="reportType" 
                  value="DETAIL" 
                  checked={reportType === 'DETAIL'} 
                  onChange={() => setReportType('DETAIL')} 
                /> Detail
              </label>
            </div>
          </div>

          {/* Payment Mode Checkboxes */}
          <div className={styles.filterGroup}>
            <label>Payment Modes:</label>
            <div className={styles.checkboxGroup}>
              <label>
                <input 
                  type="checkbox" 
                  checked={paymentModes.CASH} 
                  onChange={() => handleCheckboxChange('CASH')} 
                /> Cash
              </label>
              <label>
                <input 
                  type="checkbox" 
                  checked={paymentModes.CARD} 
                  onChange={() => handleCheckboxChange('CARD')} 
                /> Credit/Card
              </label>
              <label>
                <input 
                  type="checkbox" 
                  checked={paymentModes.UPI} 
                  onChange={() => handleCheckboxChange('UPI')} 
                /> UPI
              </label>
            </div>
          </div>
        </div>

        <div className={styles.btnRow}>
          <button className={styles.fetchBtn} onClick={fetchReport}>🔍 View Report</button>
          <button className={styles.printBtn} onClick={handlePrint} disabled={reportData.length === 0}>
            🖨️ Print A4 Report
          </button>
        </div>
      </div>

      {/* A4 REPORT PRINT SHEET */}
      <div className={styles.a4Sheet}>
        {/* Print Header */}
        <div className={styles.reportHeader}>
          <h1>SALES REPORT</h1>
          <p>
            Period: <strong>{fromDate}</strong> to <strong>{toDate}</strong> | Type: <strong>{reportType}</strong>
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading Report Data...</div>
        ) : reportData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>No records found for selected filters.</div>
        ) : reportType === 'SUMMARY' ? (
          
          /* SUMMARY REPORT TABLE */
          <table className={styles.reportTable}>
            <thead>
              <tr>
                <th>Bill No</th>
                <th>Date</th>
                <th>Waiter</th>
                <th>Table</th>
                <th>Mode</th>
                <th className={styles.txtRight}>Gross (₹)</th>
                <th className={styles.txtRight}>GST (₹)</th>
                <th className={styles.txtRight}>Discount (₹)</th>
                <th className={styles.txtRight}>Nett Value (₹)</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row) => (
                <tr key={row.sales_id}>
                  <td><strong>{row.bill_no}</strong></td>
                  <td>{new Date(row.sales_date).toLocaleDateString()}</td>
                  <td>{row.waiter_name}</td>
                  <td>{row.table_no}</td>
                  <td>{row.payment_mode}</td>
                  <td className={styles.txtRight}>{Number(row.gross_value).toFixed(2)}</td>
                  <td className={styles.txtRight}>{Number(row.gst_value).toFixed(2)}</td>
                  <td className={styles.txtRight}>{Number(row.discount).toFixed(2)}</td>
                  <td className={styles.txtRight}><strong>{Number(row.nett_value).toFixed(2)}</strong></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="5" className={styles.txtRight}><strong>TOTAL:</strong></td>
                <td className={styles.txtRight}><strong>₹{totalGross.toFixed(2)}</strong></td>
                <td className={styles.txtRight}><strong>₹{totalGst.toFixed(2)}</strong></td>
                <td className={styles.txtRight}><strong>₹{totalDiscount.toFixed(2)}</strong></td>
                <td className={styles.txtRight}><strong>₹{totalNett.toFixed(2)}</strong></td>
              </tr>
            </tfoot>
          </table>

        ) : (

          /* DETAIL REPORT GRID (Grouped Header View) */
          <div className={styles.detailContainer}>
            {Object.values(groupDataByBill(reportData)).map((group, idx) => (
              <div key={idx} className={styles.groupBlock}>
                {/* Bill Header Group */}
                <div className={styles.groupHeader}>
                  <span><strong>Bill No:</strong> {group.bill_no}</span>
                  <span><strong>Date:</strong> {new Date(group.sales_date).toLocaleString()}</span>
                  <span><strong>Waiter:</strong> {group.waiter_name}</span>
                  <span><strong>Table:</strong> {group.table_no}</span>
                  <span><strong>Mode:</strong> {group.payment_mode}</span>
                </div>

                {/* Items Grid Table */}
                <table className={styles.reportTable}>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th className={styles.txtCenter}>Qty</th>
                      <th className={styles.txtRight}>Rate (₹)</th>
                      <th className={styles.txtRight}>Value (₹)</th>
                      <th className={styles.txtRight}>GST (₹)</th>
                      <th className={styles.txtRight}>Discount (₹)</th>
                      <th className={styles.txtRight}>Nett Value (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item, iIdx) => (
                      <tr key={iIdx}>
                        <td>{item.product_name}</td>
                        <td className={styles.txtCenter}>{item.qty}</td>
                        <td className={styles.txtRight}>{Number(item.rate).toFixed(2)}</td>
                        <td className={styles.txtRight}>{Number(item.value).toFixed(2)}</td>
                        <td className={styles.txtRight}>{Number(item.gst_value || 0).toFixed(2)}</td>
                        <td className={styles.txtRight}>{Number(item.discount || 0).toFixed(2)}</td>
                        <td className={styles.txtRight}><strong>{Number(item.nett_value || 0).toFixed(2)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

        )}
      </div>
    </div>
  );
}

export default SalesReport;