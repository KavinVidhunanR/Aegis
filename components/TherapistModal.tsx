import React from 'react';
import { TherapistProfile } from '../types';
import { CloseIcon, UserIcon } from './Icons';

interface TherapistModalProps {
  isOpen: boolean;
  onClose: () => void;
  therapists: TherapistProfile[];
  isLoading: boolean;
}

const TherapistModal: React.FC<TherapistModalProps> = ({ isOpen, onClose, therapists, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md transform rounded-xl bg-white p-6 text-left shadow-xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold leading-6 text-gray-900" id="modal-title">
            Assigned Therapists
          </h3>
          <button
            type="button"
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          By enabling sharing, the following therapists will have access to AI-generated summaries of your chats to support your sessions.
        </p>
        <div className="mt-4 max-h-60 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex justify-center items-center p-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent" />
            </div>
          ) : therapists.length > 0 ? (
            <ul className="space-y-3">
              {therapists.map((therapist) => (
                <li key={therapist.id} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
                    <UserIcon className="h-6 w-6 text-gray-600" />
                  </div>
                  <span className="font-medium text-gray-800">{therapist.full_name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center">
              <p className="text-sm font-medium text-gray-700">No Therapist Assigned</p>
              <p className="mt-1 text-xs text-gray-500">Please contact your provider if you believe this is an error.</p>
            </div>
          )}
        </div>
        <div className="mt-5 sm:mt-6">
          <button
            type="button"
            className="inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
            onClick={onClose}
            style={{ 
                backgroundColor: 'var(--bg-accent)', 
                '--tw-ring-color': 'var(--bg-accent)',
            } as React.CSSProperties}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-accent-darker)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-accent)'}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default TherapistModal;