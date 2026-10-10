import React from 'react';
import { Modal } from '../../components/common/Modal.jsx';
export function GoogleLoginModal({ isOpen, onClose }) {
  return <Modal isOpen={isOpen} onClose={onClose} title="Đăng nhập Google"><p className="text-sm text-slate-600">Đăng nhập Google chưa khả dụng. Vui lòng dùng tài khoản SCMS; máy chủ chưa hỗ trợ xác minh Google OAuth.</p></Modal>;
}
