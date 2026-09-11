import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentLayout from '../components/StudentLayout';

export default function StudentReports() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  


  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
      const [incRes, expRes] = await Promise.all([
        axios.get('/api/income', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/expenses', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setIncomes(incRes.data);
      setExpenses(expRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportIncomes = () => {
    const header = 'Date,Source,Amount (ETB),Recurring,Interval,Description\n';
    const rows = incomes.map(i =>
      `${i.date},${i.source},${parseFloat(i.amount).toFixed(2)},${i.isRecurring ? 'Yes' : 'No'},${i.recurrenceInterval || ''},${(i.description || '').replace(/,/g, ' ')}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'income_records.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExpenses = () => {
    const header = 'Date,Category,Amount (ETB),Recurring,Interval,Paid,Description\n';
    const rows = expenses.map(e =>
      `${e.date},${e.Category?.name || 'Unknown'},${parseFloat(e.amount).toFixed(2)},${e.isRecurring ? 'Yes' : 'No'},${e.recurrenceInterval || ''},${e.isPaid ? 'Yes' : 'No'},${(e.description || '').replace(/,/g, ' ')}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'expense_records.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportData = () => {
    let csv = "Type,Date,Amount,Source/Category,Description,Recurring\n";
    incomes.forEach(inc => {
      csv += `"Income","${inc.date}","${inc.amount}","${inc.source}","${(inc.description || '').replace(/"/g, '""')}","${inc.isRecurring ? inc.recurrenceInterval : 'No'}"\n`;
    });
    expenses.forEach(exp => {
      csv += `"Expense","${exp.date}","${exp.amount}","${exp.Category?.name || 'Unknown'}","${(exp.description || '').replace(/"/g, '""')}","${exp.isRecurring ? exp.recurrenceInterval : 'No'}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `BirrWise_Complete_Data_${new Date().toISOString().slice(0,10)}.csv`);
    a.click();
    URL.revokeObjectURL(url);
  };



  return (
    <StudentLayout activeSection="reports" user={user}>
      <div className="bw-content-area" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <h1 className="bw-page-title">📑 Reports & Exports</h1>
        <p className="bw-page-subtitle" style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '24px' }}>Download your financial data for offline use and analysis.</p>
        
        {error && <div className="error-message" style={{ color: '#ef4444', marginBottom: 20 }}>{error}</div>}
        
        <div className="bw-card" style={{ marginBottom: 24, padding: 24 }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: 16 }}>Download CSV Data</h2>
          <p style={{ color: 'rgba(var(--overlay-rgb), 0.7)', fontSize: '0.9rem', marginBottom: 24 }}>
            Export your records in standard CSV format. These files can be opened in Excel, Google Sheets, or any data analysis tool.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <button 
              onClick={handleExportIncomes} 
              disabled={loading}
              className="btn-primary" 
              style={{ flex: 1, minWidth: '200px', padding: '16px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, cursor: 'pointer' }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>💰</div>
              <div style={{ fontWeight: 'bold' }}>Export Income</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: 4 }}>Download all income records</div>
            </button>
            
            <button 
              onClick={handleExportExpenses} 
              disabled={loading}
              className="btn-primary" 
              style={{ flex: 1, minWidth: '200px', padding: '16px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, cursor: 'pointer' }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>💸</div>
              <div style={{ fontWeight: 'bold' }}>Export Expenses</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: 4 }}>Download all expense records</div>
            </button>

            <button 
              onClick={handleExportData} 
              disabled={loading}
              className="btn-primary" 
              style={{ flex: 1, minWidth: '200px', padding: '16px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, cursor: 'pointer' }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>📊</div>
              <div style={{ fontWeight: 'bold' }}>Complete Export</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: 4 }}>Download everything in one file</div>
            </button>
          </div>
          
          {loading && <p style={{ marginTop: 24, color: 'rgba(var(--overlay-rgb), 0.5)' }}>Loading your data...</p>}
        </div>
      </div>
    </StudentLayout>
  );
}
