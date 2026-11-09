import './InputField.css';

function InputField({ label, type = 'text', placeholder, value, onChange, rightElement, ...rest }) {
  return (
    <div className="input-group">
      {label && <label>{label}</label>}
      <div className={`input-wrapper ${rightElement ? 'has-right-element' : ''}`}>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          {...rest}
        />
        {rightElement}
      </div>
    </div>
  );
}

export default InputField;

