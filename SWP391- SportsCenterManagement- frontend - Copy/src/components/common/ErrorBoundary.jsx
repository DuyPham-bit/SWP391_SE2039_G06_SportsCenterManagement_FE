import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('SCMS không thể hiển thị màn hình.', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main role="alert" className="min-h-screen grid place-items-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="font-chivo text-xl font-bold text-slate-900">Không thể hiển thị trang</h1>
          <p className="mt-3 text-sm text-slate-600">Vui lòng thử tải lại trang hoặc quay về trang chủ SCMS.</p>
          <button type="button" onClick={() => {
            window.location.hash = '#/';
            this.setState({ hasError: false });
          }} className="mt-6 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700">Về trang chủ</button>
        </div>
      </main>
    );
  }
}
