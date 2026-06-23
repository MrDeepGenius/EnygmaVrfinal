import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff } from "lucide-react";

interface AdminLoginProps {
  onAuthenticate: () => void;
}

const ADMIN_PASSWORD = "GabiTeamo2626!!";

export function AdminLogin({ onAuthenticate }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate a small delay for security feel
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        // Store in sessionStorage so it persists during the session
        sessionStorage.setItem("admin_authenticated", "true");
        onAuthenticate();
      } else {
        setError("Contraseña incorrecta");
        setPassword("");
      }
      setLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center overflow-hidden relative">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.65), rgba(0,0,0,0.95))",
          }}
        />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 100% 80% at 50% 0%, rgba(123,47,190,0.08) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center justify-center w-full px-4"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 sm:mb-12"
        >
          <img
            src="/enygma-logo.png"
            alt="ENYGMA"
            className="h-12 sm:h-16 md:h-20 w-auto object-contain"
            style={{
              filter: "drop-shadow(0 0 24px rgba(123, 47, 190, 0.4))",
            }}
          />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="flex items-center gap-0.5 sm:gap-1 justify-center mb-3">
            <span className="text-2xl sm:text-3xl md:text-4xl font-black tracking-[0.15em] text-white">
              ENY
            </span>
            <span
              className="text-2xl sm:text-3xl md:text-4xl font-black tracking-[0.15em]"
              style={{ color: "#7B2FBE" }}
            >
              G
            </span>
            <span className="text-2xl sm:text-3xl md:text-4xl font-black tracking-[0.15em] text-white">
              MA
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white">
            Panel de Administración
          </h1>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div
            className="backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
            }}
          >
            {/* Lock Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#7B2FBE]/20 flex items-center justify-center">
                <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-[#7B2FBE]" />
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-sm text-white/70 block">Contraseña de Administrador</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Ingresa la contraseña"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#7B2FBE] focus:ring-1 focus:ring-[#7B2FBE]/50 transition-all"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-purple-500/20 border border-purple-500/50 rounded-lg px-4 py-2 text-sm text-red-200"
                >
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#7B2FBE] hover:bg-[#6a28a6] disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Acceder al Admin
                  </>
                )}
              </button>
            </form>

            {/* Info */}
            <p className="text-center text-xs text-white/40 mt-4">
              Acceso restringido. Solo para administradores.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
