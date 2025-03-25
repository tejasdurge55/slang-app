export const Button = ({ children, onClick, className, disabled }) => (
  <button onClick={onClick} className={className} disabled={disabled}>
    {children}
  </button>
);
