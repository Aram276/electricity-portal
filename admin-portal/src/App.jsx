import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AdminDashboard from './components/AdminDashboard';
import AdminLoginModal from './components/AdminLoginModal';
import RecordModal from './components/RecordModal';
import ExcelModal from './components/ExcelModal';
import DeliveryModal from './components/DeliveryModal';
import PrintReceiptModal from './components/PrintReceiptModal';
import Footer from './components/Footer';

import { 
  getStoredRecords, 
  resetToDemoRecords, 
  isAdminAuthenticated, 
  setAdminAuthenticated 
} from './utils/storage';
import { 
  subscribeToCloudRecords, 
  saveRecordsToCloud, 
  logActivity 
} from './utils/cloudSync';
import { CheckCircle2, Info } from 'lucide-react';

export default function App() {
  const [records, setRecords] = useState(() => getStoredRecords());
  const [isAdmin, setIsAdmin] = useState(() => isAdminAuthenticated());
  const [activeStaff, setActiveStaff] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('electricity_active_staff') || 'null');
    } catch (e) {
      return null;
    }
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('electricity_portal_theme');
    return saved !== 'light';
  });

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(() => !isAdminAuthenticated());
  const [isExcelOpen, setIsExcelOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deliveryModalRecord, setDeliveryModalRecord] = useState(null);
  const [printModalRecord, setPrintModalRecord] = useState(null);

  // Toast notification
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const auth = isAdminAuthenticated();
    setIsAdmin(auth);
    if (!auth) {
      setIsLoginOpen(true);
    }

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

  const getActiveStaffName = () => {
    if (activeStaff && activeStaff.name) return activeStaff.name;
    try {
      const saved = localStorage.getItem('electricity_active_staff');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.name) return parsed.name;
      }
    } catch (e) {}
    return 'فەرمانبەری ژووری ١٩';
  };

  // Handle Staff login success
  const handleLoginSuccess = (staffUser) => {
    setIsAdmin(true);
    setAdminAuthenticated(true);
    if (staffUser) {
      setActiveStaff(staffUser);
      localStorage.setItem('electricity_active_staff', JSON.stringify(staffUser));
    }
    setIsLoginOpen(false);
    showToast(`بەخێربێیت ${staffUser?.name || 'فەرمانبەر'}! چوونەژوورەوەت سەرکەوتوو بوو`, 'success');
  };

  // Handle Staff logout
  const handleAdminLogout = () => {
    setIsAdmin(false);
    setAdminAuthenticated(false);
    setActiveStaff(null);
    localStorage.removeItem('electricity_active_staff');
    setIsLoginOpen(true);
    showToast('دەرچوون لە ئەژمێری ئادمین ئەنجامدرا', 'info');
  };

  // Smart Excel Import handler
  const handleImportSuccess = (newRecords, mode) => {
    let updated;
    if (mode === 'replace') {
      updated = newRecords;
      showToast(`${newRecords.length} دۆسیە بە سەرکەوتوویی لە جێگەی هەموو داتاکان دانران`, 'success');
    } else {
      const existingFileMap = new Map();
      records.forEach(r => {
        const key = String(r.fileNumber || r.id).trim().toLowerCase();
        existingFileMap.set(key, r);
      });
      newRecords.forEach(r => {
        const key = String(r.fileNumber || r.id).trim().toLowerCase();
        existingFileMap.set(key, r);
      });
      updated = Array.from(existingFileMap.values());
      showToast(`${newRecords.length} دۆسیەی نوێ بە سەرکەوتوویی زیادکران`, 'success');
    }

    setRecords(updated);
    saveRecordsToCloud(updated);
    const staffName = getActiveStaffName();
    logActivity('EXCEL_IMPORT', `هاوردەکردنی ئێکسڵ (${newRecords.length} دۆسیە بە شێوازی ${mode === 'replace' ? 'جێگرتنەوە' : 'تێکەڵکردن'}) (لەلایەن: ${staffName})`, { count: newRecords.length, mode });
  };

  // Add / Edit record save handler
  const handleSaveRecord = (recordData) => {
    const staffName = getActiveStaffName();
    let updated;
    if (editingRecord) {
      updated = records.map(r => r.id === editingRecord.id ? { ...recordData, id: r.id, handledBy: staffName } : r);
      showToast(`فایلی (${recordData.fileNumber}) بە سەرکەوتوویی دەستکاری کرا`, 'success');
      logActivity('EDIT_RECORD', `دەستکاریکردنی فایلی (${recordData.fileNumber}) بۆ هاووڵاتی (${recordData.citizenName}) (لەلایەن: ${staffName})`, { fileNumber: recordData.fileNumber, citizenName: recordData.citizenName });
    } else {
      const newRecord = {
        ...recordData,
        id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date().toISOString().split('T')[0],
        handledBy: staffName
      };
      updated = [newRecord, ...records];
      showToast(`فایلی نوێ بە ژمارەی (${recordData.fileNumber}) زیادکرا`, 'success');
      logActivity('ADD_RECORD', `تۆمارکردنی فایلی نوێی (${recordData.fileNumber}) بۆ هاووڵاتی (${recordData.citizenName}) (لەلایەن: ${staffName})`, { fileNumber: recordData.fileNumber, citizenName: recordData.citizenName });
    }

    setRecords(updated);
    saveRecordsToCloud(updated);
    setIsRecordModalOpen(false);
    setEditingRecord(null);
  };

  // Delete single record
  const handleDeleteRecord = (id) => {
    const target = records.find(r => r.id === id);
    if (window.confirm(`ئایا دڵنیایت لە سڕینەوەی فایلی (${target?.fileNumber || id})؟`)) {
      const staffName = getActiveStaffName();
      const updated = records.filter(r => r.id !== id);
      setRecords(updated);
      saveRecordsToCloud(updated);
      showToast('دۆسیەکە لە سێرڤەر سڕدرایەوە', 'info');
      logActivity('DELETE_RECORD', `سڕینەوەی فایلی (${target?.fileNumber || id}) بۆ هاووڵاتی (${target?.citizenName || 'نەزانراو'}) (لەلایەن: ${staffName})`, { fileNumber: target?.fileNumber, citizenName: target?.citizenName });
    }
  };

  // Bulk Delete
  const handleBatchDelete = (ids) => {
    if (window.confirm(`ئایا دڵنیایت لە سڕینەوەی ${ids.length} دۆسیەی هەڵبژێردراو لە کڵاود؟`)) {
      const staffName = getActiveStaffName();
      const updated = records.filter(r => !ids.includes(r.id));
      setRecords(updated);
      saveRecordsToCloud(updated);
      showToast(`${ids.length} دۆسیە سڕدرانەوە`, 'info');
      logActivity('BATCH_DELETE', `سڕینەوەی بەکۆمەڵی (${ids.length}) دۆسیە (لەلایەن: ${staffName})`, { count: ids.length });
    }
  };

  // Single record status update
  const handleUpdateStatus = (id, newStatus) => {
    const staffName = getActiveStaffName();
    const target = records.find(r => r.id === id);
    const updated = records.map(r => {
      if (r.id === id) {
        const isComplete = newStatus === 'COMPLETED';
        return {
          ...r,
          status: newStatus,
          completionDate: isComplete ? (r.completionDate || new Date().toISOString().split('T')[0]) : r.completionDate,
          handledBy: staffName
        };
      }
      return r;
    });

    setRecords(updated);
    saveRecordsToCloud(updated);
    showToast('دۆخی مامەڵە لە سێرڤەر گۆڕدرا', 'success');
    logActivity('STATUS_CHANGE', `گۆڕینی دۆخی فایلی (${target?.fileNumber || id}) بۆ (${newStatus}) (لەلایەن: ${staffName})`, {
      fileNumber: target?.fileNumber,
      citizenName: target?.citizenName,
      status: newStatus
    });
  };

  // Toggle single record file type (Yellow Folder vs Paper)
  const handleToggleFileType = (id) => {
    const staffName = getActiveStaffName();
    const target = records.find(r => r.id === id);
    const updated = records.map(r => {
      if (r.id === id) {
        const nextType = r.fileType === 'YELLOW_FOLDER' ? 'PAPER' : 'YELLOW_FOLDER';
        return { ...r, fileType: nextType, handledBy: staffName };
      }
      return r;
    });
    setRecords(updated);
    saveRecordsToCloud(updated);
    showToast('جۆری دۆسیەکە لە کڵاود گۆڕدرا', 'info');
    logActivity('STATUS_CHANGE', `گۆڕینی جۆری فایلی (${target?.fileNumber || id}) (لەلایەن: ${staffName})`, { fileNumber: target?.fileNumber });
  };

  // Fast Delivery Confirmation
  const handleConfirmDelivery = (id, deliveryData) => {
    const staffName = getActiveStaffName();
    const target = records.find(r => r.id === id);
    const updated = records.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: 'DELIVERED',
          deliveredDate: deliveryData.deliveredDate,
          receiverName: deliveryData.receiverName,
          deliveredBy: staffName,
          handledBy: staffName,
          notes: deliveryData.notes ? `${r.notes ? r.notes + ' | ' : ''}${deliveryData.notes}` : r.notes
        };
      }
      return r;
    });

    setRecords(updated);
    saveRecordsToCloud(updated);
    setDeliveryModalRecord(null);
    showToast('دۆسیەکە بە سەرکەوتوویی بە تەسلیمکراو تۆمار کرا', 'success');
    logActivity('DELIVERY', `تەسلیمکردنەوەی فایلی (${target?.fileNumber || id}) بە (${deliveryData.receiverName}) (لەلایەن: ${staffName})`, {
      fileNumber: target?.fileNumber,
      receiverName: deliveryData.receiverName,
      date: deliveryData.deliveredDate
    });
  };

  // Bulk Status update
  const handleBatchUpdateStatus = (ids, newStatus) => {
    const staffName = getActiveStaffName();
    const updated = records.map(r => {
      if (ids.includes(r.id)) {
        return {
          ...r,
          status: newStatus,
          completionDate: newStatus === 'COMPLETED' ? (r.completionDate || new Date().toISOString().split('T')[0]) : r.completionDate,
          handledBy: staffName
        };
      }
      return r;
    });

    setRecords(updated);
    saveRecordsToCloud(updated);
    showToast(`دۆخی ${ids.length} دۆسیە لە کڵاود نوێکرایەوە`, 'success');
    logActivity('BATCH_STATUS', `گۆڕینی بەکۆمەڵی دۆخی (${ids.length}) دۆسیە بۆ (${newStatus}) (لەلایەن: ${staffName})`, { count: ids.length, status: newStatus });
  };

  // Bulk File Type update
  const handleBatchUpdateFileType = (ids, newFileType) => {
    const staffName = getActiveStaffName();
    const updated = records.map(r => {
      if (ids.includes(r.id)) {
        return { ...r, fileType: newFileType, handledBy: staffName };
      }
      return r;
    });
    setRecords(updated);
    saveRecordsToCloud(updated);
    showToast(`جۆری ${ids.length} دۆسیە گۆڕدرا بۆ (${newFileType === 'YELLOW_FOLDER' ? 'فایلی زەرد' : 'ئەوراق'})`, 'success');
    logActivity('BATCH_STATUS', `گۆڕینی بەکۆمەڵی جۆری دۆسیەی (${ids.length}) فایل بۆ (${newFileType}) (لەلایەن: ${staffName})`, { count: ids.length, fileType: newFileType });
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
    <div className="min-h-screen flex flex-col font-kurdish antialiased bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-x-hidden w-full max-w-[100vw]">
      
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
        currentView="admin"
        setCurrentView={() => {}}
        isAdmin={isAdmin}
        isAdminPath={true}
        activeStaff={activeStaff}
        onOpenAdminLogin={() => setIsLoginOpen(true)}
        onAdminLogout={handleAdminLogout}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />

      {/* Main Admin Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {isAdmin ? (
          <AdminDashboard
            records={records}
            activeStaff={activeStaff}
            onOpenExcelImport={() => setIsExcelOpen(true)}
            onOpenAddModal={() => {
              setEditingRecord(null);
              setIsRecordModalOpen(true);
            }}
            onOpenEditModal={(record) => {
              setEditingRecord(record);
              setIsRecordModalOpen(true);
            }}
            onOpenDeliveryModal={(record) => setDeliveryModalRecord(record)}
            onOpenPrintModal={(record) => setPrintModalRecord(record)}
            onDeleteRecord={handleDeleteRecord}
            onBatchDelete={handleBatchDelete}
            onBatchUpdateStatus={handleBatchUpdateStatus}
            onBatchUpdateFileType={handleBatchUpdateFileType}
            onToggleFileType={handleToggleFileType}
            onUpdateStatus={handleUpdateStatus}
            onSaveRecord={handleSaveRecord}
            onResetData={handleResetData}
            onOpenStaffLoginModal={() => setIsLoginOpen(true)}
          />
        ) : (
          <div className="p-12 text-center space-y-4">
            <h2 className="text-xl font-bold">تکایە سەرەتا وەک فەرمانبەر یان ئادمین بچۆ ژوورەوە</h2>
            <button
              onClick={() => setIsLoginOpen(true)}
              className="px-6 py-3 rounded-2xl bg-amber-500 text-slate-950 font-black"
            >
              چوونەژوورەوەی ستاف
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      {isLoginOpen && (
        <AdminLoginModal
          isOpen={isLoginOpen}
          onClose={() => {
            if (isAdmin) setIsLoginOpen(false);
          }}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {isExcelOpen && (
        <ExcelModal
          isOpen={isExcelOpen}
          onClose={() => setIsExcelOpen(false)}
          onImportSuccess={handleImportSuccess}
          existingRecordsCount={records.length}
        />
      )}

      {isRecordModalOpen && (
        <RecordModal
          isOpen={isRecordModalOpen}
          onClose={() => {
            setIsRecordModalOpen(false);
            setEditingRecord(null);
          }}
          onSave={handleSaveRecord}
          initialData={editingRecord}
        />
      )}

      {deliveryModalRecord && (
        <DeliveryModal
          isOpen={Boolean(deliveryModalRecord)}
          record={deliveryModalRecord}
          onClose={() => setDeliveryModalRecord(null)}
          onConfirm={handleConfirmDelivery}
        />
      )}

      {printModalRecord && (
        <PrintReceiptModal
          isOpen={Boolean(printModalRecord)}
          record={printModalRecord}
          onClose={() => setPrintModalRecord(null)}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
