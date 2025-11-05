
import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const InputField: React.FC<InputFieldProps> = (props) => {
  return (
    <input
      {...props}
      className="w-full bg-brand-deep-purple/50 border border-brand-light-purple rounded-lg px-4 py-3
                 text-white placeholder-gray-400
                 focus:outline-none focus:ring-2 focus:ring-brand-glow focus:border-transparent
                 transition-all duration-300"
    />
  );
};

export default InputField;
