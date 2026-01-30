import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader } from "lucide-react";
import logo from "../images/logo.png";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(email, password);
            // Optional: Add a small delay for smoother transition effect
            setTimeout(() => navigate("/"), 500);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen font-inter bg-gray-900">
            {/* Left Panel: Branding & Visuals */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-900 to-gray-900 relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=2670')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>

                <div className="relative z-10 text-center">
                    <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-xl rounded-2xl mb-8 shadow-2xl border border-white/10">
                        <img src={logo} alt="Revsit Logo" className="w-28 h-28 object-contain" />
                    </div>
                    <h1 className="text-5xl font-extrabold text-white mb-6 leading-tight">
                        Safety First.<br />
                        <span className="text-blue-400">Revsit</span> Standard.
                    </h1>
                    <p className="text-lg text-gray-300 max-w-lg mx-auto leading-relaxed">
                        Streamlining incident reporting and risk management for a safer workplace environment.
                    </p>
                </div>

                {/* Decorative Circles */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
            </div>

            {/* Right Panel: Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-950">
                <div className="w-full max-w-md animate-fade-in-up">
                    <div className="mb-8 text-center lg:text-left">
                        <div className="flex lg:hidden justify-center mb-4">
                            <img src={logo} alt="Revsit Logo" className="w-20 h-20 object-contain" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                        <p className="text-gray-400">Sign in to your Revsit account</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-200 rounded-xl flex items-start gap-3 backdrop-blur-sm">
                            <div className="mt-0.5 max-w-5">⚠️</div>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">Work Email</label>
                            <input
                                type="email"
                                required
                                className="w-full bg-gray-900 border border-gray-800 text-white text-lg rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder-gray-600"
                                placeholder="name@revsit.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-medium text-gray-300">Password</label>
                                <a href="#" className="text-xs text-blue-400 hover:text-blue-300 transition">Forgot password?</a>
                            </div>
                            <input
                                type="password"
                                required
                                className="w-full bg-gray-900 border border-gray-800 text-white text-lg rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder-gray-600"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-lg font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader className="animate-spin" size={20} />
                                    Signing In...
                                </>
                            ) : (
                                <>
                                    Sign In to Dashboard
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-gray-500 text-sm">
                        © 2026 Revsit Inc. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
