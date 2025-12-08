import React from "react";

const UnsavedChangesModal = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm text-center">
        
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Discard Changes?
        </h3>

        <p className="text-sm text-gray-600 mb-6">
          You have some unsaved details. Do you want to leave without saving?
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition text-sm"
          >
            Stay on Page
          </button>

          <button
            onClick={onConfirm}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition text-sm"
          >
            Discard Changes
          </button>
        </div>

      </div>
    </div>
  );
};

export default UnsavedChangesModal
