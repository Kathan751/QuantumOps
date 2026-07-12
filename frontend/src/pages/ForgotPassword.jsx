import { Link } from 'react-router-dom';
import { useState } from 'react';
import { authApi } from '../services/api.js';
import { AuthFrame } from './Login.jsx';
import { Button, Field, Input } from '../components/ui.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  async function submit(e) {
    e.preventDefault();
    const result = await authApi.forgot({ email });
    setMessage(result.message);
  }
  return <AuthFrame title="Forgot password" subtitle="Demo stub: reset tokens are logged server-side.">
    <form onSubmit={submit} className="grid gap-4">
      {message && <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">{message}</p>}
      <Field label="Email"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      <Button>Generate reset token</Button>
      <Link className="text-sm text-brand-600" to="/login">Back to login</Link>
    </form>
  </AuthFrame>;
}
