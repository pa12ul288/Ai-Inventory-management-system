"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Mode = "signin" | "signup" | "forgot-request" | "forgot-verify";

export default function Login() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function resetMessages() {
    setError(null);
    setInfo(null);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    resetMessages();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    resetMessages();

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      // Signed in immediately — the app's auth listener shows the dashboard.
      return;
    }

    setInfo("Account created. Check your email for a confirmation link, then log in.");
    setMode("signin");
  }

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    resetMessages();
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setInfo(`We sent a one-time code to ${email}.`);
    setMode("forgot-verify");
  }

  async function handleVerifyAndReset(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    resetMessages();

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "recovery",
    });
    if (verifyError) {
      setLoading(false);
      setError(verifyError.message);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    // A verified session now exists; the app's auth listener picks it up
    // and shows the dashboard automatically.
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-base font-bold text-white">
            M
          </span>
          <h1 className="text-xl font-semibold text-slate-900">MedStock AI</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your inventory dashboard</p>
        </div>

        {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {info && !error && (
          <p className="mb-4 rounded-lg bg-teal-50 px-4 py-3 text-sm text-teal-700">{info}</p>
        )}

        {mode === "signin" && (
          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            <Field label="Email" type="email" value={email} onChange={setEmail} autoFocus />
            <Field label="Password" type="password" value={password} onChange={setPassword} />
            <SubmitButton loading={loading} label="Log In" loadingLabel="Signing in…" />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setMode("forgot-request");
                }}
                className="text-sm text-teal-700 underline hover:text-teal-800"
              >
                Forgot password?
              </button>
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setMode("signup");
                }}
                className="text-sm text-slate-500 underline hover:text-slate-700"
              >
                Create account
              </button>
            </div>
          </form>
        )}

        {mode === "signup" && (
          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            <p className="text-sm text-slate-500">
              Set the email and password you&apos;ll use to sign in to this dashboard.
            </p>
            <Field label="Email" type="email" value={email} onChange={setEmail} autoFocus />
            <Field label="Password" type="password" value={password} onChange={setPassword} />
            <Field
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
            <SubmitButton loading={loading} label="Create Account" loadingLabel="Creating…" />
            <BackButton onClick={() => { resetMessages(); setMode("signin"); }} />
          </form>
        )}

        {mode === "forgot-request" && (
          <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
            <p className="text-sm text-slate-500">
              Enter your email and we&apos;ll send you a one-time code to reset your password.
            </p>
            <Field label="Email" type="email" value={email} onChange={setEmail} autoFocus />
            <SubmitButton loading={loading} label="Send Code" loadingLabel="Sending…" />
            <BackButton onClick={() => { resetMessages(); setMode("signin"); }} />
          </form>
        )}

        {mode === "forgot-verify" && (
          <form onSubmit={handleVerifyAndReset} className="flex flex-col gap-4">
            <p className="text-sm text-slate-500">
              Enter the code we emailed you and choose a new password.
            </p>
            <Field label="One-time code" type="text" value={otp} onChange={setOtp} autoFocus />
            <Field label="New password" type="password" value={newPassword} onChange={setNewPassword} />
            <Field
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
            <SubmitButton loading={loading} label="Reset Password" loadingLabel="Resetting…" />
            <BackButton onClick={() => { resetMessages(); setMode("signin"); }} />
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  autoFocus,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoFocus={autoFocus}
        className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
      />
    </label>
  );
}

function SubmitButton({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300"
    >
      {loading ? loadingLabel : label}
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-sm text-slate-500 underline hover:text-slate-700">
      Back to login
    </button>
  );
}
