function Button({ type = 'button', children, onClick, ...rest }) {
  return (
    <button type={type} onClick={onClick} {...rest}>
      {children}
    </button>
  );
}

export default Button;

