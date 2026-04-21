"use client";

import { useState } from "react";

export default function TestPasswordPage() {
  const [password, setPassword] = useState("");
  const [hash, setHash] = useState("");
  const [comparePassword, setComparePassword] = useState("");
  const [compareHash, setCompareHash] = useState("");
  const [result, setResult] = useState(null);
  const [loadingHash, setLoadingHash] = useState(false);
  const [loadingCompare, setLoadingCompare] = useState(false);

  const generateHash = async () => {
    try {
      setLoadingHash(true);
      setHash("");

      const res = await fetch("/api/auth/test-password/hash", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Generate hash failed");
      }

      setHash(data.hash);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingHash(false);
    }
  };

  const compareHashs = async () => {
    try {
      setLoadingCompare(true);
      setResult(null);

      const res = await fetch("/api/auth/test-password/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: comparePassword,
          hash: compareHash,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Compare failed");
      }

      setResult(data.is_match);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingCompare(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Password Hash Test
          </h1>
          <p className="text-sm text-slate-500">
            ใช้ทดสอบการ hash password และ compare ว่าตรงกันหรือไม่
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Generate Hash
          </h2>

          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          />

          <button
            type="button"
            onClick={generateHash}
            disabled={loadingHash}
            className="rounded-2xl bg-slate-900 text-white px-5 py-3"
          >
            {loadingHash ? "Generating..." : "Generate Hash"}
          </button>

          {hash ? (
            <div className="rounded-2xl bg-slate-100 p-4 break-all text-sm text-slate-700">
              {hash}
            </div>
          ) : null}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Compare Password & Hash
          </h2>

          <input
            type="text"
            value={comparePassword}
            onChange={(e) => setComparePassword(e.target.value)}
            placeholder="Enter password"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          />

          <textarea
            value={compareHash}
            onChange={(e) => setCompareHash(e.target.value)}
            placeholder="Paste bcrypt hash"
            rows={4}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          />

          <button
            type="button"
            onClick={compareHashs}
            disabled={loadingCompare}
            className="rounded-2xl bg-emerald-600 text-white px-5 py-3"
          >
            {loadingCompare ? "Checking..." : "Compare"}
          </button>

          {result !== null ? (
            <div
              className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                result
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {result
                ? "Password ตรงกับ hash"
                : "Password ไม่ตรงกับ hash"}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}


/*
  Generate Hash 
     เอารหัส ยาววๆ ไปใส่ ในข้อมูลมูลของเรา

  update public.user_accounts
  set password_hash = '$xxxxxxxxxxx'   
  where username = 'admin';   

*/