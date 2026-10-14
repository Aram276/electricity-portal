import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Portal Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6" dir="rtl">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              کێشەیەک ڕوویدا لە کاتی پیشاندان
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              تکایە دووبارە هەوڵبدەرەوە یان لاپەڕەکە نوێ (Refresh) بکەرەوە.
            </p>
            <button
              onClick={this.handleReload}
              className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>نوێکردنەوەی لاپەڕە (Refresh)</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
