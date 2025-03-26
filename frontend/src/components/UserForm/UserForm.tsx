// src/components/UserForm/UserForm.tsx
import React, { useState, FormEvent } from 'react';

const UserForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [interruptTime, setInterrupt] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log({ name, email, interruptTime });
  };

  return (
    <div>
      <h2>User Information Form</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>How often would you like to be interrupted:</label>
          <input 
            type="interruptTime" 
            value={interruptTime} 
            onChange={(e) => setInterrupt(e.target.value)} 
            required 
          />
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default UserForm;
