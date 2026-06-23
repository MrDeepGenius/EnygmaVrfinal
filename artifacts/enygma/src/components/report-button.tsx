import { useState } from "react";
import { AlertCircle, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Movie, Series } from "@workspace/api-client-react";

interface ReportButtonProps {
  item: Movie | Series;
  type: "movie" | "serie" | "anime";
}

export function ReportButton({ item, type }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [reason, setReason] = useState("broken_link");

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const reportData = {
        itemId: item.id,
        itemTitle: item.titulo,
        type,
        reason,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };

      // Log the report (en producción enviarías a un servidor)
      console.log("📋 Reporte de contenido:", reportData);

      // Mostrar éxito
      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setReason("broken_link");
      }, 2000);
    } catch (error) {
      console.error("Error al enviar reporte:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Botón de Reporte */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-500 hover:bg-purple-500/20 hover:border-purple-500/50 text-sm font-semibold transition-all"
        title="Reportar si este contenido está caído o fuera de servicio"
      >
        <AlertCircle className="w-4 h-4" />
        Reportar
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-zinc-900 via-black to-zinc-950 border-2 border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-500/20 max-w-md w-full overflow-hidden">
            {isSuccess ? (
              // Success state
              <div className="p-6 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-xl font-black text-white">¡Gracias!</h2>
                <p className="text-sm text-white/70">
                  Tu reporte ha sido registrado. Revisaremos este contenido pronto.
                </p>
              </div>
            ) : (
              // Form state
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-purple-500 flex-shrink-0" />
                  <h2 className="text-lg font-black text-white">Reportar Problema</h2>
                </div>

                <p className="text-sm text-white/70 mb-4">
                  <span className="font-semibold text-white">{item.titulo}</span>
                  <br />
                  Cuéntanos qué problema tiene este contenido.
                </p>

                {/* Reason selector */}
                <div className="space-y-2 mb-6">
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wider">Tipo de Problema</label>
                  <div className="space-y-2">
                    {[
                      { value: "broken_link", label: "🔗 Link caído / No reproduce", color: "red" },
                      { value: "wrong_content", label: "❌ Contenido incorrecto", color: "yellow" },
                      { value: "bad_quality", label: "📺 Mala calidad", color: "orange" },
                      { value: "wrong_subtitle", label: "📝 Subtítulos incorrectos", color: "blue" },
                      { value: "other", label: "❓ Otro problema", color: "purple" },
                    ].map((opt) => (
                      <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="reason"
                          value={opt.value}
                          checked={reason === opt.value}
                          onChange={(e) => setReason(e.target.value)}
                          className="w-4 h-4 accent-purple-500"
                        />
                        <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                          {opt.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => setIsOpen(false)}
                    variant="ghost"
                    className="flex-1 text-white/60 border border-white/10 hover:bg-white/5"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Enviar Reporte
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-white/40 text-center mt-4">
                  Los reportes nos ayudan a mantener el contenido actualizado.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
