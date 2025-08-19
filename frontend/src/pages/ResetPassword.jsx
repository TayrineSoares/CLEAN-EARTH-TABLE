import { useState } from "react";
import loginImage from "../assets/images/accountImage.png"
import "../styles/ResetPassword.css"

// One source of truth for your API base:
const ROOT = (import.meta.env.VITE_API_BASE || 'http://localhost:8080').replace(/\/+$/, '');
const API_BASE = `${ROOT}/api`;

// Small helper to safely join paths (accepts '/users' or 'users'):
const apiUrl = (p = '') => `${API_BASE}${p.startsWith('/') ? '' : '/'}${p}`;


const ResetPassword = () => {
  const [ email, setEmail ] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch(apiUrl('/login/reset-password'), {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(' Reset email sent. Check your inbox!');
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (err) {
      alert('❌ Something went wrong.');
      console.error(err);

    }
  }

  return (
    <div className="reset-password page">
      <div className="contact-header-image-container">
        <img
          className="contact-header-image"
          src={loginImage}
        />
      </div>

      <div className="page-wrapper">
        <div className="reset-password-header">
          <p className="password-text">Reset Your Password</p>
        </div>
 
      <h1 className='your-name-header'>Email</h1>

      <form onSubmit={handleSubmit}>
        <input
        className="login-detail-input-field" 
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        
        />
        <br></br>
        <br></br>
        <button className='contact-submit-button' type="submit">Send reset Link </button>
      </form>
      </div>
    </div>
  )
};

export default ResetPassword;
