import { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { Moon, Sparkles, BookOpen, Send, Loader2, ChevronRight } from "lucide-react";

// Types based on the JSON structure
interface DictionaryEntry {
  mot_cle_principal: string;
  signification_generale: string;
  significations_complementaires?: string[];
  interpretation_culturelle?: {
    arabe?: string | null;
    occidentale?: string | null;
  };
  contexte_emotionnel?: string | null;
  source_url: string;
}

// Nettoie un mot (minuscules, sans accents)
function cleanWord(word: string): string {
  return word
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Liste des mots vides à ignorer
const STOP_WORDS = new Set([
  "le", "la", "les", "un", "une", "de", "du", "des", "a", "au", "aux",
  "je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles",
  "et", "ou", "donc", "or", "ni", "car", "dans", "par", "pour", "sur",
  "avec", "sans", "sous", "chez", "ce", "cette", "ces", "mon", "ton", "son",
  "ma", "ta", "sa", "mes", "tes", "ses", "y", "en", "est", "suis", "ete"
]);

function detecterSymboles(texte: string, dictionnaire: DictionaryEntry[]): DictionaryEntry[] {
  // Découper en mots
  const mots = texte.split(/[\s,.;:!?'-]+/).filter(m => m.length > 1);
  const symbolesTrouves: DictionaryEntry[] = [];
  
  mots.forEach(motBrut => {
    const motNettoye = cleanWord(motBrut);
    
    // Ignorer les stop words
    if (STOP_WORDS.has(motNettoye)) return;
    
    // Chercher dans le dictionnaire
    dictionnaire.forEach(entry => {
      const motCleBrut = entry.mot_cle_principal.replace("Rêver de ", "").replace("rêver de ", "");
      const motCleNettoye = cleanWord(motCleBrut);
      
      // Correspondance EXACTE après nettoyage
      if (motNettoye === motCleNettoye || motNettoye + "s" === motCleNettoye || motNettoye === motCleNettoye + "s") {
        if (!symbolesTrouves.find(s => s.mot_cle_principal === entry.mot_cle_principal)) {
          symbolesTrouves.push(entry);
        }
      }
    });
  });
  
  return symbolesTrouves;
}

export default function App() {
  const [dreamText, setDreamText] = useState('');
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [dictionnaire, setDictionnaire] = useState<DictionaryEntry[]>([]);
  const [result, setResult] = useState<{
    synthesis: string;
    reflections: string[];
    symbols: DictionaryEntry[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/dictionnaire_complet.json')
      .then(response => {
        if (!response.ok) throw new Error('Failed to load dictionary');
        return response.json();
      })
      .then(data => setDictionnaire(data))
      .catch(err => {
        console.error('Error loading dictionary:', err);
        setError("Impossible de charger le dictionnaire des rêves.");
      });
  }, []);

  const interpretDream = async () => {
    if (!dreamText.trim() || dictionnaire.length === 0) return;

    setIsInterpreting(true);
    setError(null);
    setResult(null);

    try {
      // 1. Keyword detection
      const detectedSymbols = detecterSymboles(dreamText, dictionnaire);

      if (detectedSymbols.length === 0) {
        // If no symbols found, we still want Gemini to try but warn the user
        // Or just use the text. The prompt says "based ONLY on provided symbols".
        // Let's find at least something or tell Gemini to be general if none found.
      }

      // 2. Gemini Synthesis
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const symbolsSummary = detectedSymbols
        .map(s => `${s.mot_cle_principal}: ${s.signification_generale}`)
        .join('\n');

      const prompt = `Agis comme un expert en rêves. Propose une interprétation narrative (3-4 phrases) et 2-3 pistes de réflexion concrètes basées UNIQUEMENT sur les symboles fournis.
      
Récit du rêve : "${dreamText}"

Symboles détectés dans le dictionnaire :
${symbolsSummary || "Aucun symbole spécifique détecté dans le dictionnaire, base-toi sur le récit de manière générale mais reste sobre."}

Réponds au format JSON suivant :
{
  "synthesis": "L'interprétation narrative ici...",
  "reflections": ["Piste 1", "Piste 2"]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const aiData = JSON.parse(response.text || '{}');

      setResult({
        synthesis: aiData.synthesis || "Interprétation non disponible.",
        reflections: aiData.reflections || [],
        symbols: detectedSymbols
      });
    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue lors de l'interprétation. Veuillez réessayer.");
    } finally {
      setIsInterpreting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Decor */}
      <div className="bg-blob-coral" />
      <div className="bg-bar-sage" />
      <div className="bg-rect-ochre" />

      <div className="max-w-4xl mx-auto px-4 py-12 relative z-10">
        <header className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block p-4 mb-6"
          >
            <Moon className="w-10 h-10 text-coral" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl dream-h1 mb-6"
          >
            L'Interprète de Rêves
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-mid-gray max-w-xl mx-auto text-lg"
          >
            Une lecture sobre et profonde de vos nuits. 
            Décryptage symbolique par intelligence collaborative.
          </motion.p>
        </header>

        <main className="space-y-12">
          <section className="bg-white rounded-2xl shadow-sm border border-black/[0.03] p-1 overflow-hidden">
            <textarea
              id="dream-input"
              className="w-full h-56 p-6 bg-transparent border-none focus:ring-0 resize-none text-deep-ink text-xl placeholder:text-mid-gray/30"
              placeholder="Décrivez votre songe avec précision..."
              value={dreamText}
              onChange={(e) => setDreamText(e.target.value)}
            />
            <div className="p-4 flex justify-end bg-main-bg/50 border-t border-black/[0.02]">
              <button
                id="interpret-button"
                onClick={interpretDream}
                disabled={isInterpreting || !dreamText.trim()}
                className="btn-primary"
              >
                {isInterpreting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Interprétation...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Analyser le rêve</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-red-50 text-red-600 rounded-xl text-center border border-red-100 font-medium"
            >
              {error}
            </motion.div>
          )}

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-20 pt-12"
              >
                {/* PARTIE 1: SYNTHÈSE */}
                <section id="synthesis-section" className="space-y-8">
                  <div className="flex items-center space-x-3 text-deep-ink">
                    <div className="w-8 h-1 bg-coral rounded-full" />
                    <h2 className="text-2xl font-medium tracking-tight">Synthèse & Perspectives</h2>
                  </div>
                  
                  <div className="space-y-12">
                    <p className="interpretation-text">
                      {result.synthesis}
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      {result.reflections.map((reflection, idx) => (
                        <div key={idx} className="dream-card border-t-2 border-t-sage">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-mid-gray/50 mb-3">
                            Piste {idx + 1}
                          </h3>
                          <p className="text-deep-ink leading-relaxed font-medium">
                            {reflection}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <div className="h-px bg-black/[0.05]" />

                {/* PARTIE 2: ANNEXE */}
                <section id="dictionary-section" className="space-y-8 pb-20">
                  <div className="flex items-center space-x-3 text-deep-ink">
                    <div className="w-8 h-1 bg-ochre rounded-full" />
                    <h2 className="text-2xl font-medium tracking-tight">Le dictionnaire de votre rêve</h2>
                  </div>

                  <div className="grid gap-8">
                    {result.symbols.length > 0 ? (
                      result.symbols.map((symbol, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="dream-card"
                        >
                          <div className="flex items-start justify-between mb-6">
                            <h3 className="text-xl font-semibold text-deep-ink">
                              Rêver de <span className="text-sage capitalize">{symbol.mot_cle_principal}</span>
                            </h3>
                          </div>
                          
                          <div className="space-y-6">
                            <div className="text-deep-ink/90 leading-relaxed">
                              {symbol.signification_generale}
                            </div>
                            
                            {symbol.significations_complementaires && symbol.significations_complementaires.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-black/[0.02]">
                                {symbol.significations_complementaires.slice(0, 4).map((sig, sIdx) => (
                                  <div key={sIdx} className="flex items-start space-x-2">
                                    <div className="w-1.5 h-1.5 bg-ochre rounded-full mt-2 shrink-0" />
                                    <p className="text-sm text-mid-gray leading-tight">
                                      {sig.replace(/^\[.*?\]\s*/, '')}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {symbol.interpretation_culturelle?.arabe && (
                              <div className="p-4 bg-ochre/5 rounded-lg text-sm text-mid-gray border border-ochre/10 grayscale-[0.5] hover:grayscale-0 transition-all">
                                <span className="font-semibold text-deep-ink block mb-1">Perspective culturelle (Arabe)</span>
                                {symbol.interpretation_culturelle.arabe}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-16 bg-black/[0.01] rounded-3xl border border-dashed border-black/10">
                        <p className="text-mid-gray italic">
                          Aucun symbole majeur extrait du dictionnaire.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="mt-12 text-center text-mid-gray/40 text-xs pb-12">
          <p>© {new Date().getFullYear()} L'Interprète de Rêves — Approche sobre & analytique</p>
        </footer>
      </div>
    </div>
  );
}
