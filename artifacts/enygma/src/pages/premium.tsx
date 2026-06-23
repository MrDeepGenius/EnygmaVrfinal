import { useState } from "react";
import { Zap, Check, CreditCard } from "lucide-react";
import { Layout } from "@/components/layout";
import { Link } from "wouter";

export default function PremiumPage() {
  const [formData, setFormData] = useState({
    nombre: "",
    usuario: "",
    email: "",
    metodo_pago: "transferencia",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/premium/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit request");
      }

      setSuccess(true);
      setFormData({ nombre: "", usuario: "", email: "", metodo_pago: "transferencia" });

      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 py-10 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-black font-display text-white mb-4">
              ENYGMA Premium
            </h1>
            <p className="text-xl text-white/70">
              Disfruta de contenido sin interrupciones publicitarias
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            {/* Benefits */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white mb-8">Beneficios</h2>

              <div className="space-y-4">
                {[
                  "Sin publicidades interrumpen tu experiencia",
                  "Acceso 100% a todo el catálogo",
                  "Streaming en 4K UHD",
                  "Soporte prioritario 24/7",
                  "Actualizaciones exclusivas",
                  "Compatibilidad con todos tus dispositivos",
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#7B2FBE] flex items-center justify-center flex-shrink-0 mt-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white/80 text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-6">
              <div
                className="rounded-2xl p-8 border-2 border-[#7B2FBE]"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(123, 47, 190, 0.15), rgba(123, 47, 190, 0.05))",
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Zap className="w-8 h-8 text-[#7B2FBE]" />
                  <h3 className="text-2xl font-black text-white">Premium</h3>
                </div>

                <div className="mb-6">
                  <div className="text-5xl font-black text-[#7B2FBE] mb-2">
                    USD 3
                  </div>
                  <div className="text-white/60 text-sm">
                    o{" "}
                    <span className="text-white font-semibold">
                      ARS 4.000
                    </span>
                  </div>
                </div>

                <p className="text-white/70 mb-8">
                  Acceso ilimitado a todo el contenido sin publicidades
                </p>

                <div className="space-y-2 text-white/70 text-sm">
                  <p>💳 Métodos de pago:</p>
                  <p className="text-white font-semibold">
                    • Transferencia Bancaria
                  </p>
                  <p className="text-[#7B2FBE] text-xs mt-2">
                    🔜 Próximamente: USDT (BNB/TRON)
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900 border border-white/10 rounded-xl p-4">
                <p className="text-white/60 text-sm">
                  <span className="text-[#7B2FBE] font-bold">✓ Pago seguro</span>
                  {" "}Tus datos están protegidos
                </p>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="max-w-2xl mx-auto mb-16">
            <div
              className="rounded-2xl p-8 border-2"
              style={{
                borderColor: "rgba(123, 47, 190, 0.3)",
                background:
                  "linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(13, 13, 13, 0.8))",
              }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                Solicitar Premium
              </h2>

              {success && (
                <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                  <p className="text-green-400 font-semibold">
                    ✓ Solicitud enviada correctamente
                  </p>
                  <p className="text-green-400/80 text-sm mt-1">
                    El administrador revisará tu solicitud pronto. Te contactaremos cuando sea aprobada.
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-purple-500/20 border border-purple-500/50 rounded-lg">
                  <p className="text-red-400 font-semibold">Error: {error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    placeholder="Tu nombre"
                    className="w-full px-4 py-3 bg-zinc-900 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-[#7B2FBE] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    Usuario (cuenta ENYGMA) *
                  </label>
                  <input
                    type="text"
                    name="usuario"
                    value={formData.usuario}
                    onChange={handleChange}
                    required
                    placeholder="Tu usuario"
                    className="w-full px-4 py-3 bg-zinc-900 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-[#7B2FBE] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    Email (opcional)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tu@email.com"
                    className="w-full px-4 py-3 bg-zinc-900 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-[#7B2FBE] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    Método de Pago *
                  </label>
                  <select
                    name="metodo_pago"
                    value={formData.metodo_pago}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-zinc-900 border border-white/20 rounded-lg text-white focus:border-[#7B2FBE] focus:outline-none transition-colors"
                  >
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="crypto" disabled>
                      Criptomonedas (próximamente)
                    </option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-gradient-to-r from-[#7B2FBE] to-[#b20710] hover:from-[#ff2a2a] hover:to-[#6a28a6] text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Solicitar Premium
                    </>
                  )}
                </button>

                <p className="text-white/40 text-xs text-center">
                  Al solicitar, confirmas que realizarás el pago indicado.
                  El administrador aprobará tu solicitud una vez recibido el pago.
                </p>
              </form>
            </div>
          </div>

          {/* Info Section */}
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: "🏦",
                title: "Transferencia Bancaria",
                desc: "USD 3 o ARS 4.000 a cuenta verificada",
              },
              {
                icon: "⚡",
                title: "Activación Rápida",
                desc: "Aprobado en menos de 24 horas",
              },
              {
                icon: "🔒",
                title: "100% Seguro",
                desc: "Tu información está protegida",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-xl bg-zinc-900/50 border border-white/10 text-center"
              >
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="text-white font-bold mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA Back to Home */}
          <div className="text-center">
            <Link href="/">
              <button className="px-6 py-3 border border-white/30 text-white rounded-lg hover:border-white transition-colors">
                ← Volver al Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
