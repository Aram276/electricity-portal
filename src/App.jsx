import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CitizenSearch from './components/CitizenSearch';
import AdminDashboard from './components/AdminDashboard';
import ExcelModal from './components/ExcelModal';
import RecordModal from './components/RecordModal';
import DeliveryModal from './components/DeliveryModal';
import PrintReceiptModal from './components/PrintReceiptModal';
import AdminLoginModal from './components/AdminLoginModal';
import Footer from './components/Footer';
import { 
  getStoredRecords, 
  saveRecords, 
  resetToDemoRecords, 
  markAsDelivered, 
  isAdminAuthenticated, 
  setAdminAuthenticated 
} from './utils/storage';
import { subscribeToCloudRecords, saveRecordsToCloud } from './utils/cloudSync';
import { CheckCircle2, Info, Cloud } from 'lucide-react';

export default function App() {
  const [records, setRecords] = useState(() => getStoredRecords());
  const [currentView, setCurrentView] = useState('citizen'); // 'citizen' | 'admin'
  const [isAdmin, setIsAdmin] = useState(() => isAdminAuthenticated());
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('electricity_portal_theme');
    return saved !== 'light'; // default dark
  });

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isExcelOpen, setIsExcelOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deliveryModalRecord, setDeliveryModalRecord] = useState(null);
  const [printModalRecord, setPrintModalRecord] = useState(null);

  // Toast notification
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setIsAdmin(isAdminAuthenticated());

    // Live Cloud Subscription to Firebase Firestore
    const unsubscribe = subscribeToCloudRecords((cloudRecords) => {
      if (cloudRecords && cloudRecords.length > 0) {
        setRecords(cloudRecords);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Sync theme with DOM
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      document.body.classList.add('dark-mode');
      localStorage.setItem('electricity_portal_theme', 'dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark-mode');
      localStorage.setItem('electricity_portal_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleAdminLogin = () => {
    setAdminAuthenticated(true);
    setIsAdmin(true);
    setCurrentView('admin');
    showToast('بە سەرکەوتوویی وەک بەڕێوەبەر چوویە ژوورەوە', 'success');
  };

  const handleAdminLogout = () => {
    setAdminAuthenticated(false);
    setIsAdmin(false);
    setCurrentView('citizen');
    showToast('دەرچوویت لە پەنێڵی ئادمین', 'info');
  };

  // Excel Import handler
  const handleImportSuccess = (newRecords, mode) => {
    let updated;
    if (mode === 'replace') {
      updated = newRecords;
    } else {
      const existingIds = new Set(records.map(r => r.fileNumber));
      const filteredNew = newRecords.filter(r => !existingIds.has(r.fileNumber));
      updated = [...records, ...filteredNew];
    }
    setRecords(updated);
    saveRecordsToCloud(updated);
    showToast(`${newRecords.length} مامەڵە بە سەرکەوتوویی لە فایلی ئێکسڵەوە هاوردە کرا`, 'success');
  };

  // Add / Edit record
  const handleSaveRecord = (formData, recordId) => {
    let updated;
    const rawName = (formData.citizenName || '').trim();
    const hasRealName = Boolean(rawName && rawName !== 'هاوبەشی کارەبا' && !rawName.startsWith('مانگی '));
    const processedData = {
      ...formData,
      citizenName: hasRealName ? rawName : 'هاوبەشی کارەبا',
      hasRealName: hasRealName
    };

    if (recordId) {
      updated = records.map(r => r.id === recordId ? { ...r, ...processedData } : r);
      showToast('زانیارییەکانی مامەڵەکە لە کڵاود و سێرڤەر بە سەرکەوتوویی نوێکرایەوە', 'success');
    } else {
      const newRec = {
        id: 'rec-' + Date.now(),
        ...processedData
      };
      updated = [newRec, ...records];
      showToast('مامەڵەی نوێ لە سێرڤەری گشتی بە سەرکەوتوویی تۆمار کرا', 'success');
    }
    setRecords(updated);
    saveRecordsToCloud(updated);
  };

  // Delete record (single)
  const handleDeleteRecord = (id) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    saveRecordsToCloud(updated);
    showToast('مامەڵەکە بە سەرکەوتوویی لە سێرڤەر سڕایەوە', 'info');
  };

  // Bulk / Batch Delete records
  const handleBatchDelete = (ids) => {
    const idSet = new Set(ids);
    const updated = records.filter(r => !idSet.has(r.id));
    setRecords(updated);
    saveRecordsToCloud(updated);
    showToast(`${ids.length} فایل بە سەرکەوتوویی لە کڵاود سڕانەوە`, 'info');
  };

  // Bulk Status update
  const handleBatchUpdateStatus = (ids, newStatus) => {
    const idSet = new Set(ids);
    const today = new Date().toISOString().slice(0, 10);
    const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const updated = records.map(r => {
      if (idSet.has(r.id)) {
        const changes = { status: newStatus };
        if (newStatus === 'COMPLETED' && !r.completionDate) {
          changes.completionDate = today;
        }
        if (newStatus === 'DELIVERED' && !r.deliveredDate) {
          changes.deliveredDate = nowTime;
        }
        return { ...r, ...changes };
      }
      return r;
    });

    setRecords(updated);
    saveRecordsToCloud(updated);
    showToast(`دۆخی ${ids.length} فایل بە سەرکەوتوویی لە کڵاود گۆڕدرا`, 'success');
  };

  // Inline Status update from table
  const handleUpdateStatus = (id, newStatus) => {
    const updated = records.map(r => {
      if (r.id === id) {
        const changes = { status: newStatus };
        if (newStatus === 'COMPLETED' && !r.completionDate) {
          changes.completionDate = new Date().toISOString().slice(0, 10);
        }
        if (newStatus === 'DELIVERED' && !r.deliveredDate) {
          changes.deliveredDate = new Date().toISOString().replace('T', ' ').slice(0, 16);
        }
        return { ...r, ...changes };
      }
      return r;
    });
    setRecords(updated);
    saveRecordsToCloud(updated);
    showToast('دۆخی مامەڵە لە سێرڤەر گۆڕدرا', 'success');
  };

  // Toggle single record file type (Yellow Folder vs Paper)
  const handleToggleFileType = (id) => {
    const updated = records.map(r => {
      if (r.id === id) {
        const nextType = r.fileType === 'YELLOW_FOLDER' ? 'PAPER' : 'YELLOW_FOLDER';
        return { ...r, fileType: nextType };
      }
      return r;
    });
    setRecords(updated);
    saveRecordsToCloud(updated);
    showToast('جۆری دۆسیەکە لە کڵاود گۆڕدرا', 'info');
  };

  // Bulk File Type update
  const handleBatchUpdateFileType = (ids, newFileType) => {
    const idSet = new Set(ids);
    const updated = records.map(r => {
      if (idSet.has(r.id)) {
        return { ...r, fileType: newFileType };
      }
      return r;
    });
    setRecords(updated);
    saveRecordsToCloud(updated);
    showToast(`جۆری ${ids.length} فایل گۆڕدرا بۆ ${newFileType === 'YELLOW_FOLDER' ? 'فایلی زەرد' : 'ئەوراق'}`, 'success');
  };

  // Delivery Modal confirm
  const handleConfirmDelivery = (id, receiverName, customDate, note) => {
    const updated = markAsDelivered(id, receiverName, customDate);
    if (note) {
      const rec = updated.find(r => r.id === id);
      if (rec) rec.notes = (rec.notes ? rec.notes + ' | ' : '') + note;
    }
    setRecords(updated);
    saveRecordsToCloud(updated);
    setDeliveryModalRecord(null);
    showToast(`فایل بە فەرمی تەسلیمی (${receiverName || 'هاووڵاتی'}) کرا لە [${customDate}]`, 'success');
  };

  // Reset to demo
  const handleResetData = () => {
    if (window.confirm('ئایا دڵنیایت لە گەڕاندنەوەی داتاکان بۆ داتای سەرەتایی نموونەیی؟')) {
      const reset = resetToDemoRecords();
      setRecords(reset);
      saveRecordsToCloud(reset);
      showToast('داتاکان لە سێرڤەر گەڕێندرانەوە بۆ دۆخی سەرەتایی', 'info');
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-kurdish antialiased bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border text-sm font-bold ${
            toast.type === 'success' 
              ? 'bg-emerald-900/95 dark:bg-emerald-950/90 border-emerald-500 text-white dark:text-emerald-200 shadow-emerald-500/20' 
              : 'bg-blue-900/95 dark:bg-blue-950/90 border-blue-500 text-white dark:text-blue-200 shadow-blue-500/20'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Info className="w-5 h-5 text-blue-400" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isAdmin={isAdmin}
        onOpenAdminLogin={() => setIsLoginOpen(true)}
        onAdminLogout={handleAdminLogout}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {currentView === 'citizen' ? (
          <CitizenSearch
            records={records}
            onOpenPrintModal={(rec) => setPrintModalRecord(rec)}
          />
        ) : (
          <AdminDashboard
            records={records}
            onOpenExcelImport={() => setIsExcelOpen(true)}
            onOpenAddModal={() => { setEditingRecord(null); setIsRecordModalOpen(true); }}
            onOpenEditModal={(rec) => { setEditingRecord(rec); setIsRecordModalOpen(true); }}
            onOpenDeliveryModal={(rec) => setDeliveryModalRecord(rec)}
            onOpenPrintModal={(rec) => setPrintModalRecord(rec)}
            onDeleteRecord={handleDeleteRecord}
            onBatchDelete={handleBatchDelete}
            onBatchUpdateStatus={handleBatchUpdateStatus}
            onBatchUpdateFileType={handleBatchUpdateFileType}
            onToggleFileType={handleToggleFileType}
            onUpdateStatus={handleUpdateStatus}
            onSaveRecord={handleSaveRecord}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleAdminLogin}
      />

      {/* Add / Edit Record Modal */}
      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => { setIsRecordModalOpen(false); setEditingRecord(null); }}
        onSave={handleSaveRecord}
        editingRecord={editingRecord}
        records={records}
      />

      {/* Excel Import Modal */}
      <ExcelModal
        isOpen={isExcelOpen}
        onClose={() => setIsExcelOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* Delivery Confirmation Modal */}
      <DeliveryModal
        isOpen={Boolean(deliveryModalRecord)}
        onClose={() => setDeliveryModalRecord(null)}
        record={deliveryModalRecord}
        onConfirm={handleConfirmDelivery}
      />

      {/* Print Slip / Receipt Modal */}
      <PrintReceiptModal
        isOpen={Boolean(printModalRecord)}
        onClose={() => setPrintModalRecord(null)}
        record={printModalRecord}
      />

    </div>
  );
}
