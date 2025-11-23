"use client";
import Link from "next/link";
import { useState } from "react";
import { Toaster, toast } from "sonner";
import { FcGoogle } from "react-icons/fc";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Please enter both email and password.");
      return;
    }
    setLoading(true);
    const res = await signIn("credentials", {
      redirect: false,
      email: form.email,
      password: form.password,
    });
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Logged in successfully! Redirecting to home...");
      setTimeout(() => {
        router.push("/");
      }, 1200);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 mt-24">
      <Toaster richColors position="top-center" />
      <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
        Welcome Back
      </h1>
      <p className="text-gray-600 mb-8 text-center">
        Sign in to continue to ELIF
      </p>
      <form className="bg-white rounded-xl shadow p-8" onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your email"
            className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-gray-700"
            required
            autoComplete="email"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-gray-700 pr-10"
              required
              minLength={8}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-2 top-2 text-gray-400"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              <span role="img" aria-label="Show password">
                👁️
              </span>
            </button>
          </div>
        </div>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <input
              name="remember"
              type="checkbox"
              checked={form.remember}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Remember me</span>
          </div>
          <Link href="#" className="text-blue-600 text-sm underline">
            Forgot password?
          </Link>
        </div>
        <button
          type="submit"
          className={`w-full px-6 py-2 rounded-lg bg-blue-700 text-white font-medium hover:bg-blue-800 transition mb-4 ${
            loading ? "opacity-60 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
        <div className="flex items-center gap-4 my-6">
          <hr className="grow border-gray-300" />
          <span className="text-gray-500 font-medium">OR</span>
          <hr className="grow border-gray-300" />
        </div>
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-400 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors shadow mb-4"
          onClick={() => signIn("google", { callbackUrl: "/" })}
        >
          <FcGoogle size={22} />
          <span className="font-medium">Sign In With Google</span>
        </button>
        <div className="text-center text-gray-700">
          Don't have an account?{" "}
          <Link href="/auth/signup" className="text-blue-600 underline">
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
}
