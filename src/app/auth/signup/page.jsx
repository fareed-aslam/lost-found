"use client";
import Link from "next/link";
import { useState } from "react";
import { Toaster, toast } from "sonner";
import { FcGoogle } from "react-icons/fc";
import axios from "axios";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function SignupPage() {
  const [form, setForm] = useState({
    fullName: "",
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });
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
    // Add a validate function or remove if not needed
    if (typeof validate === "function") {
      const errorMsg = validate();
      if (errorMsg) {
        toast.error(errorMsg);
        return;
      }
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, {
        userName: form.userName,
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phoneNumber: "",
      });
      toast.success("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/auth/login");
      }, 1200);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 mt-24">
      <Toaster richColors position="top-center" />
      <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
        Create Account
      </h1>
      <p className="text-gray-600 mb-8 text-center">
        Join ELIF to help reconnect lost items
      </p>
      <form className="bg-white rounded-xl shadow p-8" onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            name="userName"
            type="text"
            value={form.userName}
            onChange={handleChange}
            placeholder="Enter your username"
            className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-gray-700"
            required
            autoComplete="username"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            name="fullName"
            type="text"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Enter your full name"
            className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-gray-700"
            required
            autoComplete="name"
          />
        </div>
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
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Create a password"
            className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-gray-700"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-gray-700"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <div className="mb-6 flex items-center">
          <input
            name="agree"
            type="checkbox"
            checked={form.agree}
            onChange={handleChange}
            className="mr-2"
            required
          />
          <span className="text-sm text-gray-700">
            I agree to the{" "}
            <Link href="#" className="text-blue-600 underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-blue-600 underline">
              Privacy Policy
            </Link>
          </span>
        </div>
        {/* Error notification handled by toast, so error div removed */}
        <button
          type="submit"
          className={`w-full px-6 py-2 rounded-lg bg-blue-700 text-white font-medium hover:bg-blue-800 transition mb-4 ${
            loading ? "opacity-60 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Create Account"}
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
          <span className="font-medium">Sign Up With Google</span>
        </button>
        <div className="text-center text-gray-700">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-blue-600 underline">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
