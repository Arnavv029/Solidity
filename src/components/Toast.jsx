import React from "react";
import { useEscrow } from "../context/EscrowContext";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheckCircle, FiAlertTriangle, FiXCircle, FiInfo, FiX } from "react-icons/fi";

export const ToastContainer = () => {
  const { toasts, removeToast } = useEscrow();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastCard = ({ toast, onClose }) => {
  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <FiCheckCircle className="text-emerald-400 w-5 h-5 flex-shrink-0" />;
      case "warning":
        return <FiAlertTriangle className="text-amber-400 w-5 h-5 flex-shrink-0" />;
      case "error":
        return <FiXCircle className="text-rose-500 w-5 h-5 flex-shrink-0" />;
      default:
        return <FiInfo className="text-indigo-400 w-5 h-5 flex-shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case "success":
        return "border-emerald-500/30 shadow-emerald-500/10";
      case "warning":
        return "border-amber-500/30 shadow-amber-500/10";
      case "error":
        return "border-rose-500/30 shadow-rose-500/10";
      default:
        return "border-purple-500/30 shadow-purple-500/10";
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      className={`glass-panel flex items-start gap-3 p-4 border bg-dark-900/90 shadow-xl ${getBorderColor()}`}
    >
      {getIcon()}
      <div className="flex-1 text-sm font-medium text-slate-100 pr-2">
        {toast.message}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="text-slate-400 hover:text-white transition-colors flex-shrink-0 mt-0.5"
      >
        <FiX className="w-4 h-4" />
      </button>
    </motion.div>
  );
};
