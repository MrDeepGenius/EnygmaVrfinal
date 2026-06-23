import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useProfile, type ProfileId } from "@/lib/profile-context";

const PROFILES = [
  {
    id: "senor",
    name: "Sr. Enigma",
    avatar: "/avatar-senor.png",
    glowColor: "#7B2FBE",
  },
  {
    id: "senora",
    name: "Sra. Enigma",
    avatar: "/avatar-senora.png",
    glowColor: "#e91e9e",
  },
  {
    id: "kids",
    name: "Kids",
    avatar: "/avatar-kids.png",
    glowColor: "#facc15",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const profileVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      damping: 22,
      stiffness: 180,
    },
  },
};

export default function Profiles() {
  const [, setLocation] = useLocation();
  const { setProfile } = useProfile();

  const handleSelectProfile = (id: string) => {
    setProfile(id as ProfileId);
    setLocation("/home");
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center overflow-hidden relative">
      {/* Cinematographic Background */}
      <div className="absolute inset-0 z-0">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://ia600404.us.archive.org/10/items/chat-gpt-image-7-jun-2026-10-50-43-p.m./ChatGPT%20Image%207%20jun%202026%2C%2010_50_43%20p.m..png')",
            opacity: 0.75,
            backgroundAttachment: "fixed",
          }}
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.65))",
          }}
        />
        {/* Subtle animated gradient */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 100% 80% at 50% 0%, rgba(123,47,190,0.08) 0%, transparent 70%)",
          }}
        />
        {/* Film grain texture */}
        <div
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center w-full h-full px-4 sm:px-6 py-8 sm:py-12"
        initial="hidden"
        animate="visible"
      >
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, y: -32, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center mb-6 sm:mb-10 md:mb-14"
        >
          {/* Logo Image */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="mb-4 sm:mb-5"
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

          {/* Logo Text */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <span className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[0.15em] text-white">
              ENY
            </span>
            <span
              className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[0.15em]"
              style={{ color: "#7B2FBE" }}
            >
              G
            </span>
            <span className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[0.15em] text-white">
              MA
            </span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.5 }}
          className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-8 sm:mb-12 md:mb-16 text-center leading-tight tracking-tight"
        >
          ¿Quién está viendo?
        </motion.h2>

        {/* Profiles Container */}
        <motion.div
          variants={containerVariants}
          className="flex flex-col items-center w-full"
        >
          {/* Profiles Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 w-full max-w-6xl px-2 sm:px-4">
            {/* Existing Profiles */}
            {PROFILES.map((profile) => (
              <motion.button
                key={profile.id}
                variants={profileVariants}
                whileHover={{ y: -8, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelectProfile(profile.id)}
                className="group flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7B2FBE] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-lg transition-all duration-300"
              >
                {/* Avatar Container */}
                <motion.div
                  className="relative w-full aspect-square mb-3 sm:mb-4"
                  whileHover={{
                    boxShadow: `0 0 48px ${profile.glowColor}80, 0 0 96px ${profile.glowColor}40`,
                  }}
                  initial={{
                    boxShadow: `0 0 24px ${profile.glowColor}40, 0 0 48px ${profile.glowColor}20`,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Avatar Image */}
                  <div 
                    className="relative w-full h-full rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden border-2 sm:border-3 transition-all duration-300 group-hover:border-opacity-100"
                    style={{
                      borderColor: profile.glowColor,
                    }}
                  >
                    <img
                      src={profile.avatar}
                      alt={profile.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/8 via-transparent to-black/40 pointer-events-none" />

                    {/* Shine Effect on Hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </motion.div>

                {/* Profile Name */}
                <motion.span
                  className="text-sm sm:text-base md:text-lg font-bold text-white/70 group-hover:text-white transition-colors duration-300 text-center"
                  whileHover={{ color: "#ffffff" }}
                >
                  {profile.name}
                </motion.span>
              </motion.button>
            ))}
          </div>
        </motion.div>


      </motion.div>
    </div>
  );
}
