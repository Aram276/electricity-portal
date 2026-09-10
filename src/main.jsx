import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CRITICAL APP ERROR:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', fontFamily: 'sans-serif', direction: 'rtl', textAlign: 'right', color: '#1e293b', background: '#f8fafc', minHeight: '100vh' }}>
          <div style={{ maxWidth: '600px', margin: '40px auto', background: '#fff', padding: '24px', borderRadius: '16px', border: '2px solid #ef4444', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#dc2626', margin: '0 0 12px 0' }}>هەڵەیەک لە سیستەم ڕوویدا</h2>
            <p style={{ fontSize: '14px', color: '#475569' }}>تکایە پەڕەکە نوێ (Refresh) بکەوە یان کلیک لەسەر دوگمەی خوارەوە بکە:</p>
            <button 
              onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.reload(); }}
              style={{ background: '#f59e0b', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop: '12px' }}
            >
              پاککردنەوەی کەش و نوێکردنەوە (Reset & Reload)
            </button>
            <div style={{ marginTop: '20px', textAlign: 'left', direction: 'ltr', fontSize: '12px', background: '#f1f5f9', padding: '12px', borderRadius: '8px', overflow: 'auto' }}>
              <strong>Error:</strong> {this.state.error?.toString()}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('SW registration failed:', err);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
