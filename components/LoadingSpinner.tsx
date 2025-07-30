// components/LoadingSpinner.tsx
export default function LoadingSpinner() {
    return (
      <div className="spinner">
        {/* simple CSS spinner */}
        <style jsx>{`
          .spinner {
            border: 4px solid rgba(0,0,0,0.1);
            border-left-color: #4f46e5;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            animation: spin 1s linear infinite;
            margin: auto;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  