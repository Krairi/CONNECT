/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import ToolsPage from "./pages/ToolsPage";
import TasksPage from "./pages/TasksPage";
import InventoryPage from "./pages/InventoryPage";
import DomyliConnectionModal from "./components/DomyliConnectionModal";
import ProfilesPage from "./pages/ProfilesPage";
import DashboardPage from "./pages/DashboardPage";
import CapacityPage from "./pages/CapacityPage";
import MealsPage from "./pages/MealsPage";
import ShoppingPage from "./pages/ShoppingPage";
import StatusPage from "./pages/StatusPage";
import { motion, useScroll, useTransform } from "motion/react";
import {
  ChevronRight,
  Package,
  Utensils,
  Users,
  Wrench,
  ShieldCheck,
  ArrowRight,
  Menu,
  X,
  Check,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { navigateTo } from "./lib/navigation";

const Navbar = ({ onOpenModal }: { onOpenModal: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 border border-gold flex items-center justify-center rotate-45">
            <span className="text-gold font-serif -rotate-45 text-lg">D</span>
          </div>
          <span className="text-2xl font-serif tracking-widest uppercase">Domyli</span>
        </div>

        <div className="hidden md:flex items-center gap-12">
          {["Manifeste", "Architecture", "Intelligence", "Tarifs"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm uppercase tracking-widest text-alabaster/60 hover:text-gold transition-colors"
            >
              {item}
            </a>
          ))}
          <button
            onClick={onOpenModal}
            className="px-6 py-2 border border-gold/50 text-gold text-xs uppercase tracking-[0.2em] hover:bg-gold hover:text-obsidian transition-all duration-500 cursor-pointer"
          >
            Connexion
          </button>
        </div>

        <button className="md:hidden text-gold" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden absolute top-20 left-0 w-full bg-obsidian border-b border-white/10 p-6 flex flex-col gap-6"
        >
          {["Manifeste", "Architecture", "Intelligence", "Tarifs"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-lg font-serif text-alabaster/80"
              onClick={() => setIsOpen(false)}
            >
              {item}
            </a>
          ))}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenModal();
            }}
            className="w-full py-4 border border-gold text-gold uppercase tracking-widest cursor-pointer"
          >
            Démarrer
          </button>
        </motion.div>
      )}
    </nav>
  );
};

const Hero = ({ onOpenModal }: { onOpenModal: () => void }) => {
  const containerRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center pt-32 overflow-hidden px-6"
    >
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div style={{ y, opacity }} className="relative z-10 text-center max-w-4xl mx-auto">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-block text-gold uppercase tracking-[0.4em] text-xs mb-8"
        >
          L&apos;excellence domestique réinventée
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl md:text-8xl lg:text-9xl mb-8 font-serif italic"
        >
          Reprenez la souveraineté <br />
          <span className="not-italic text-alabaster/90">de votre foyer.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-xl text-alabaster/60 max-w-2xl mx-auto mb-12 font-light leading-relaxed"
        >
          Le premier Système d&apos;Exploitation pour une vie domestique d&apos;excellence.
          Organisez, structurez et fiabilisez chaque flux de votre quotidien.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <button
            onClick={onOpenModal}
            className="group relative px-10 py-5 bg-gold text-obsidian font-medium uppercase tracking-widest overflow-hidden transition-all duration-500 hover:pr-14 cursor-pointer"
          >
            <span className="relative z-10">Démarrer l’organisation — Gratuitement</span>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500" />
          </button>
          <a
            href="#architecture"
            className="px-10 py-5 border border-white/10 hover:border-gold/50 text-alabaster uppercase tracking-widest transition-all duration-500 inline-block cursor-pointer"
          >
            Découvrir le système
          </a>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.8 }}
        className="relative mt-24 w-full max-w-6xl mx-auto"
      >
        <div className="glass rounded-t-2xl p-4 md:p-8 metallic-border gold-glow">
          <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-4">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            </div>
            <div className="h-4 w-32 bg-white/5 rounded-full" />
          </div>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-3 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-white/5 rounded-lg border border-white/5" />
              ))}
            </div>
            <div className="col-span-12 md:col-span-9 grid grid-cols-2 gap-6">
              <div className="h-64 bg-night/20 rounded-xl border border-white/5 p-6">
                <div className="w-1/2 h-4 bg-gold/20 rounded-full mb-4" />
                <div className="space-y-2">
                  <div className="w-full h-2 bg-white/5 rounded-full" />
                  <div className="w-full h-2 bg-white/5 rounded-full" />
                  <div className="w-3/4 h-2 bg-white/5 rounded-full" />
                </div>
              </div>
              <div className="h-64 bg-white/5 rounded-xl border border-white/5 p-6">
                <div className="w-1/2 h-4 bg-white/10 rounded-full mb-4" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-square bg-white/5 rounded-lg" />
                  <div className="aspect-square bg-white/5 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

const Manifesto = () => (
  <section id="manifeste" className="py-32 px-6 bg-obsidian">
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-24 items-center">
        <div>
          <span className="text-gold uppercase tracking-[0.4em] text-xs mb-6 block">
            Le Manifeste de l&apos;Ordre
          </span>
          <h2 className="text-5xl md:text-7xl mb-8 italic">
            De la charge mentale <br />
            <span className="not-italic text-alabaster/90">à la maîtrise absolue.</span>
          </h2>
          <p className="text-xl text-alabaster/60 font-light leading-relaxed mb-12">
            Le foyer moderne est une infrastructure complexe. Sans système, il devient une source de
            chaos. DOMYLI transforme l&apos;exécution domestique en une routine invisible et parfaite.
          </p>

          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="w-12 h-12 rounded-full border border-red-500/30 flex items-center justify-center shrink-0">
                <X className="text-red-500" size={20} />
              </div>
              <div>
                <h4 className="text-lg font-medium mb-2">Le Chaos</h4>
                <p className="text-alabaster/40 text-sm">
                  Oublis, stress, gaspillage et désorganisation constante.
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="w-12 h-12 rounded-full border border-gold/30 flex items-center justify-center shrink-0">
                <Check className="text-gold" size={20} />
              </div>
              <div>
                <h4 className="text-lg font-medium mb-2">Le Système</h4>
                <p className="text-alabaster/40 text-sm">
                  Fluidité, anticipation, économies et sérénité retrouvée.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-6 mt-12">
            <div className="aspect-[4/5] glass rounded-2xl metallic-border p-8 flex flex-col justify-end">
              <span className="text-4xl font-serif italic text-gold mb-2">01</span>
              <span className="text-sm uppercase tracking-widest text-alabaster/60">Souveraineté</span>
            </div>
            <div className="aspect-square glass rounded-2xl metallic-border p-8 flex flex-col justify-end">
              <span className="text-4xl font-serif italic text-gold mb-2">02</span>
              <span className="text-sm uppercase tracking-widest text-alabaster/60">Précision</span>
            </div>
          </div>
          <div className="space-y-6">
            <div className="aspect-square glass rounded-2xl metallic-border p-8 flex flex-col justify-end">
              <span className="text-4xl font-serif italic text-gold mb-2">03</span>
              <span className="text-sm uppercase tracking-widest text-alabaster/60">Harmonie</span>
            </div>
            <div className="aspect-[4/5] glass rounded-2xl metallic-border p-8 flex flex-col justify-end">
              <span className="text-4xl font-serif italic text-gold mb-2">04</span>
              <span className="text-sm uppercase tracking-widest text-alabaster/60">Héritage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Architecture = () => {
  const features = [
    {
      title: "Gestion des Stocks",
      description: "Inventaire en temps réel de vos ressources, de l'épicerie fine aux fournitures ménagères.",
      icon: <Package className="text-gold" size={24} />,
      size: "lg:col-span-2",
    },
    {
      title: "Nutrition d'Excellence",
      description: "Planification adaptée à vos contraintes (Halal, Diabète, Allergies, Sport).",
      icon: <Utensils className="text-gold" size={24} />,
      size: "lg:col-span-1",
    },
    {
      title: "Coordination des Membres",
      description: "Assignation intelligente des responsabilités et flux de communication unifiés.",
      icon: <Users className="text-gold" size={24} />,
      size: "lg:col-span-1",
    },
    {
      title: "Maintenance & Matériel",
      description: "Suivi du cycle de vie de vos outils et planification des entretiens préventifs.",
      icon: <Wrench className="text-gold" size={24} />,
      size: "lg:col-span-2",
    },
  ];

  return (
    <section id="architecture" className="py-32 px-6 bg-obsidian">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <span className="text-gold uppercase tracking-[0.4em] text-xs mb-6 block">
            L&apos;Architecture du Système
          </span>
          <h2 className="text-5xl md:text-7xl italic">Des modules interconnectés.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -10 }}
              className={`${feature.size} glass rounded-3xl p-10 metallic-border group transition-all duration-500`}
            >
              <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center mb-8 border border-white/10 group-hover:border-gold/50 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-serif mb-4 italic">{feature.title}</h3>
              <p className="text-alabaster/50 font-light leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Intelligence = ({ onOpenModal }: { onOpenModal: () => void }) => (
  <section id="intelligence" className="py-32 px-6 relative overflow-hidden">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-night/10 rounded-full blur-[150px] pointer-events-none" />

    <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
      <div className="relative">
        <div className="glass rounded-3xl p-12 metallic-border relative z-10">
          <div className="flex items-center gap-6 mb-12">
            <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
              <Users className="text-gold" size={32} />
            </div>
            <div>
              <h4 className="text-2xl font-serif italic">Fiche Profil : Fatim</h4>
              <p className="text-gold text-xs uppercase tracking-widest">Membre Premium</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <span className="text-xs text-alabaster/40 uppercase tracking-widest block mb-2">
                Contraintes Nutritionnelles
              </span>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-red-500/10 text-red-400 text-[10px] uppercase border border-red-500/20 rounded-full">
                  Allergie Arachides
                </span>
                <span className="px-3 py-1 bg-gold/10 text-gold text-[10px] uppercase border border-gold/20 rounded-full">
                  Sans Gluten
                </span>
              </div>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <span className="text-xs text-alabaster/40 uppercase tracking-widest block mb-2">
                Impact Système
              </span>
              <p className="text-sm text-alabaster/60 italic">
                &quot;Filtre automatique appliqué sur les stocks et les menus de la semaine.&quot;
              </p>
            </div>
          </div>
        </div>

        <div className="absolute -top-10 -right-10 w-40 h-40 border border-gold/20 rounded-full animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 border border-white/5 rounded-full" />
      </div>

      <div>
        <span className="text-gold uppercase tracking-[0.4em] text-xs mb-6 block">
          Intelligence Contextuelle
        </span>
        <h2 className="text-5xl md:text-7xl mb-8 italic">
          L&apos;OS qui s&apos;adapte <br />
          <span className="not-italic text-alabaster/90">à votre réalité.</span>
        </h2>
        <p className="text-xl text-alabaster/60 font-light leading-relaxed mb-12">
          DOMYLI n&apos;est pas une base de données statique. C&apos;est un moteur intelligent qui comprend
          les contraintes de chaque membre pour sécuriser l&apos;ensemble du foyer.
        </p>
        <button
          onClick={onOpenModal}
          className="flex items-center gap-4 text-gold uppercase tracking-widest text-sm group cursor-pointer"
        >
          En savoir plus sur l&apos;intelligence DOMYLI
          <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
        </button>
      </div>
    </div>
  </section>
);

const Pricing = ({ onOpenModal }: { onOpenModal: () => void }) => {
  const plans = [
    {
      name: "Essentiel",
      price: "0€",
      features: ["Fondations du foyer", "Inventaire simple", "Shopping simple", "Repas simples", "Tâches simples"],
      cta: "Commencer gratuitement",
      highlight: false,
    },
    {
      name: "Souverain",
      price: "4,99€",
      period: "/mois",
      features: ["Fondations du foyer", "Inventaire simple", "Shopping simple", "Repas simples", "Tâches simples"],
      cta: "Choisir le plan Souverain",
      highlight: true,
    },
    {
      name: "Héritage",
      price: "9,99€",
      period: "/mois",
      features: [
        "Multi-membres avancé",
        "Répartition des efforts",
        "Vision globale du foyer",
        "Orchestration plus complète",
        "Niveau DOMYLI le plus puissant",
      ],
      cta: "Contacter un expert",
      highlight: false,
    },
  ];

  return (
    <section id="tarifs" className="py-32 px-6 bg-obsidian">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <span className="text-gold uppercase tracking-[0.4em] text-xs mb-6 block">Investissement</span>
          <h2 className="text-5xl md:text-7xl italic">Choisissez votre niveau de maîtrise.</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`glass rounded-3xl p-12 metallic-border flex flex-col ${
                plan.highlight ? "scale-105 gold-glow border-gold/30" : ""
              }`}
            >
              <h3 className="text-2xl font-serif italic mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-serif">{plan.price}</span>
                {plan.period && <span className="text-alabaster/40 text-sm">{plan.period}</span>}
              </div>

              <ul className="space-y-4 mb-12 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-alabaster/60">
                    <ShieldCheck size={16} className="text-gold/50" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={onOpenModal}
                className={`w-full py-4 uppercase tracking-widest text-xs transition-all duration-500 cursor-pointer ${
                  plan.highlight
                    ? "bg-gold text-obsidian hover:bg-white hover:text-obsidian"
                    : "border border-white/10 hover:border-gold text-alabaster"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = ({ onOpenModal }: { onOpenModal: () => void }) => (
  <footer className="py-20 px-6 border-t border-white/5 bg-obsidian">
    <div className="max-w-7xl mx-auto">
      <div className="grid md:grid-cols-4 gap-12 mb-20">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 border border-gold flex items-center justify-center rotate-45">
              <span className="text-gold font-serif -rotate-45 text-lg">D</span>
            </div>
            <span className="text-2xl font-serif tracking-widest uppercase">Domyli</span>
          </div>
          <p className="text-alabaster/40 max-w-sm font-light leading-relaxed">
            L&apos;infrastructure de gouvernance domestique pour ceux qui exigent l&apos;excellence dans chaque
            aspect de leur vie.
          </p>
        </div>

        <div>
          <h5 className="text-gold uppercase tracking-widest text-xs mb-6">Système</h5>
          <ul className="space-y-4 text-sm text-alabaster/60">
            <li>
              <a href="#architecture" className="hover:text-gold transition-colors">
                Fonctionnalités
              </a>
            </li>
            <li>
              <a href="#intelligence" className="hover:text-gold transition-colors">
                Sécurité
              </a>
            </li>
            <li>
              <a href="#tarifs" className="hover:text-gold transition-colors">
                Tarifs
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h5 className="text-gold uppercase tracking-widest text-xs mb-6">Compagnie</h5>
          <ul className="space-y-4 text-sm text-alabaster/60">
            <li>
              <a href="#manifeste" className="hover:text-gold transition-colors">
                Manifeste
              </a>
            </li>
            <li>
              <a href="mailto:contact@domyli.com" className="hover:text-gold transition-colors">
                Contact
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenModal();
                }}
                className="hover:text-gold transition-colors"
              >
                Mentions Légales
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col md:row items-center justify-between pt-12 border-t border-white/5 text-[10px] uppercase tracking-[0.2em] text-alabaster/20">
        <span>© 2026 DOMYLI Ecosystem. All rights reserved.</span>
        <div className="flex gap-8 mt-4 md:mt-0">
          <a href="#" className="hover:text-gold transition-colors">
            Twitter
          </a>
          <a href="#" className="hover:text-gold transition-colors">
            Instagram
          </a>
          <a href="#" className="hover:text-gold transition-colors">
            LinkedIn
          </a>
        </div>
      </div>
    </div>
  </footer>
);

function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  return (
    <div className="min-h-screen selection:bg-gold/30 selection:text-gold">
      <Navbar onOpenModal={() => setIsModalOpen(true)} />

      <main>
        <Hero onOpenModal={() => setIsModalOpen(true)} />
        <Manifesto />
        <Architecture />
        <Intelligence onOpenModal={() => setIsModalOpen(true)} />

        <section className="py-32 px-6 bg-night/10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            >
              <h2 className="text-4xl md:text-6xl font-serif italic mb-12 leading-tight">
                &quot;DOMYLI n&apos;a pas ajouté une tâche à ma journée, <br />
                <span className="text-gold">il en a supprimé dix.</span>&quot;
              </h2>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 mb-4" />
                <span className="text-sm uppercase tracking-widest text-alabaster/80">Marc-Antoine D.</span>
                <span className="text-[10px] uppercase tracking-widest text-alabaster/40">
                  Propriétaire, Domaine de L&apos;Ermitage
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        <Pricing onOpenModal={() => setIsModalOpen(true)} />

        <section className="py-32 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gold/5 blur-[100px] pointer-events-none" />
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-serif italic mb-12">Prêt à instaurer l&apos;ordre ?</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-12 py-6 bg-gold text-obsidian font-medium uppercase tracking-[0.3em] hover:bg-white transition-all duration-500 hover:scale-105 cursor-pointer"
            >
              Créer mon foyer maintenant
            </button>
          </div>
        </section>
      </main>

      <Footer onOpenModal={() => setIsModalOpen(true)} />

      <DomyliConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  if (path === "/profiles") {
    return <ProfilesPage />;
  }

  if (path === "/dashboard") {
    return <DashboardPage />;
  }

  if (path === "/inventory") {
  return <InventoryPage />;
  }

  if (path === "/tasks") {
  return <TasksPage />;
  }

  if (path === "/tools") {
  return <ToolsPage />;
  }

  if (path === "/capacity") {
  return <CapacityPage />;
  }

  if (path === "/meals") {
  return <MealsPage />;
  }

  if (path === "/shopping") {
  return <ShoppingPage />;
  }

  if (path === "/status") {
  return <StatusPage />;
  }

  if (path !== "/") {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster flex items-center justify-center px-6">
        <div className="max-w-xl w-full border border-white/10 bg-white/5 p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-gold/80">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-serif italic">Page introuvable</h1>
          <p className="mt-4 text-alabaster/70">
            Cette route n’est pas encore disponible dans la version actuelle du front.
          </p>
          <button
            onClick={() => navigateTo("/")}
            className="mt-8 border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
          >
            Retour à l’accueil
          </button>
        </div>
      </div>
    );
  }

  return <LandingPage />;
}