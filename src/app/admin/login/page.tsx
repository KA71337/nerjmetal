"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Giriş alınmadı" }));
        setError(payload.error || "Şifrə yanlışdır");
        setPassword("");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Şəbəkə xətası. Yenidən cəhd edin.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main" className="adm-login">
      <motion.section
        className="adm-login__card"
        initial={{ opacity: 0, y: 22, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 0.68, 0.16, 1] }}
        aria-labelledby="adm-login-title"
      >
        <span className="cat-tile__icon adm-login__icon">
          {<Lock size={20} />}
        </span>
        <p className="eyebrow">NERJ/METAL · Admin</p>
        <h1 id="adm-login-title">Daxil ol</h1>
        <p className="adm-login__lede">İdarəetmə paneli parolla qorunur. Sessiya 8 saatdan sonra avtomatik bitir.</p>

        <form onSubmit={submit} className="adm-login__form">
          <label className="adm-field">
            <span>Şifrə</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              autoFocus
              required
              maxLength={200}
            />
          </label>
          {error && (
            <motion.p
              role="alert"
              className="adm-form-error"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.p>
          )}
          <button type="submit" className="btn btn-acid adm-login__submit" disabled={busy || !password}>
            <ShieldCheck size={17} />
            {busy ? "Yoxlanılır…" : "Daxil ol"}
          </button>
        </form>
      </motion.section>
    </main>
  );
}
