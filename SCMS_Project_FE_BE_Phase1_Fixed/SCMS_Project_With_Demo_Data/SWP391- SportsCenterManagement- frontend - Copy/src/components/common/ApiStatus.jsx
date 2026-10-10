import React from 'react';

export function ApiStatus({ children, path }) {
  const [error, setError] = React.useState('');
  const [attempt, setAttempt] = React.useState(0);
  React.useEffect(() => {
    setError('');
    const onError = event => setError(event.detail);
    window.addEventListener('SCMS_API_ERROR', onError);
    return () => window.removeEventListener('SCMS_API_ERROR', onError);
  }, [path]);
  return <>
    {error && <div role="alert" className="mb-4 p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800">
      <p>{error}</p>
      <button className="mt-2 underline font-bold" onClick={() => { setError(''); setAttempt(n => n + 1); }}>Tải lại dữ liệu trang</button>
      <button className="ml-4 underline" onClick={() => setError('')}>Đóng và giữ nội dung đang nhập</button>
    </div>}
    <React.Fragment key={`${path}:${attempt}`}>{children}</React.Fragment>
  </>;
}
