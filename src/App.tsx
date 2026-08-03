import { useState, useEffect } from 'react';
import { 
  Moon, 
  BookOpen, 
  Search, 
  Sparkles, 
  ArrowRight, 
  AlertCircle, 
  Bookmark, 
  Activity, 
  PenTool, 
  CornerDownRight,
  User as UserIcon,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Guide from './components/Guide.tsx';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase.ts';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { fallbackSymbols } from './fallbackData.ts';

function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

interface AnalysisResult {
  summary: string;
  keyMessages: string[];
  realLifeReflections?: string[];
  symbols: { term: string; meaning: string }[];
  jungianReading: string;
  freudianReading: string;
  emotionScores: {
    peur: number;
    merveille: number;
    confusion: number;
    clarte: number;
  };
  journalPrompt: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [expandedDreamId, setExpandedDreamId] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [pendingDream, setPendingDream] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'interprete' | 'dictionnaire' | 'guide' | 'journal'>('interprete');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [dreamText, setDreamText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dreams, setDreams] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState('');
  const [filterKeyword, setFilterKeyword] = useState('');

  const handleDeleteDream = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rêve ?')) return;
    try {
      await deleteDoc(doc(db, 'dreams', id));
      setDreams(dreams.filter(d => d.id !== id));
      alert('Rêve supprimé !');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'dreams');
    }
  };

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'dreams'), where('userId', '==', user.uid), orderBy('date', 'desc'));
      getDocs(q).then(snapshot => {
        setDreams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }).catch(err => {
        console.error("Erreur lors du chargement des rêves de l'utilisateur:", err);
      });
    }
  }, [user]);

  // Dictionary states
  const [dictionarySymbols, setDictionarySymbols] = useState<any[]>(fallbackSymbols);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && pendingDream) {
        handleSaveDream(pendingDream).catch(err => {
          console.error("Erreur de sauvegarde automatique après connexion:", err);
        });
        setPendingDream(null);
      }
    });
    return () => unsubscribe();
  }, [pendingDream]);

  const handleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("SignIn error:", error);
      if (error.code === 'auth/network-request-failed') {
        alert("La connexion internet semble instable. Veuillez vérifier votre réseau pour vous connecter avec Google.");
      } else if (error.code === 'auth/popup-blocked') {
        alert("La fenêtre contextuelle a été bloquée par votre navigateur. Veuillez autoriser les fenêtres contextuelles pour ce site.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        // User closed popup
      } else {
        alert("Impossible de se connecter pour le moment. Veuillez réessayer plus tard.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error("SignOut error:", error);
      alert("Une erreur est survenue lors de la déconnexion.");
    }
  };

  const handleSaveDream = async (dreamToSave?: any) => {
    const data = dreamToSave || {
      content: dreamText,
      title: analysisResult?.summary.substring(0, 50) + "...",
      interpretation: JSON.stringify(analysisResult),
    };

    if (!data.content || !data.interpretation) return;

    const currentUser = auth.currentUser;

    if (!currentUser) {
      setPendingDream(data);
      await handleSignIn();
      return;
    }

    try {
      await addDoc(collection(db, 'dreams'), {
        userId: currentUser.uid,
        ...data,
        date: new Date().toISOString()
      });
      alert('Rêve sauvegardé !');
      
      // Refresh the dreams list instantly
      const q = query(collection(db, 'dreams'), where('userId', '==', currentUser.uid), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      setDreams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'dreams');
    }
  };

  const loadingMessages = [
    "Exploration des couches du rêve...",
    "Recherche des symboles sous-jacents...",
    "Évaluation des dynamiques émotionnelles...",
    "Rapprochement analytique (Jung & Freud)...",
    "Finalisation de l'interprétation poétique..."
  ];

  // Fetch dictionary from server
  useEffect(() => {
    // Tenter de charger d'abord d'immenses dictionnaires s'ils existent
    fetch('/dictionnaire_reves.json')
      .then(res => {
        if (!res.ok) throw new Error("Accès impossible au dictionnaire personnalisé.");
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          if (data[0].mot_cle_principal) {
            // Mapping du format dictionnaire_reves.json chargé par l'utilisateur
            const mapped = data.map(item => {
              const symbol = item.mot_cle_principal ? (item.mot_cle_principal.charAt(0).toUpperCase() + item.mot_cle_principal.slice(1)) : '';
              const firstChar = symbol.charAt(0).toUpperCase();
              let category = "Index U - Z";
              if (firstChar >= 'A' && firstChar <= 'D') category = "Index A - D";
              else if (firstChar >= 'E' && firstChar <= 'H') category = "Index E - H";
              else if (firstChar >= 'I' && firstChar <= 'L') category = "Index I - L";
              else if (firstChar >= 'M' && firstChar <= 'P') category = "Index M - P";
              else if (firstChar >= 'Q' && firstChar <= 'T') category = "Index Q - T";
              
              let arInterpretation = "";
              if (item.interpretation_culturelle?.arabe) {
                arInterpretation = `Tradition arabe-musulmane : ${item.interpretation_culturelle.arabe}`;
              }
              
              let occidentaleInterpretation = "";
              if (item.interpretation_culturelle?.occidentale) {
                occidentaleInterpretation = `Tradition occidentale : ${item.interpretation_culturelle.occidentale}`;
              }

              const extraTexts = [];
              if (item.significations_complementaires && item.significations_complementaires.length > 0) {
                extraTexts.push(...item.significations_complementaires);
              }
              if (arInterpretation) extraTexts.push(arInterpretation);
              if (occidentaleInterpretation) extraTexts.push(occidentaleInterpretation);

              return {
                symbol,
                category,
                meaning: item.signification_generale || "Aucune description globale.",
                jung: "",
                freud: "",
                advice: extraTexts.length > 0 ? extraTexts.join("\n\n") : undefined
              };
            });
            setDictionarySymbols(mapped);
          } else {
            setDictionarySymbols(data);
          }
        } else {
          throw new Error("Format ou données invalides.");
        }
      })
      .catch(() => {
        // Fallback standard si indisponible ou erreur
        fetch('/dictionnaire_complet.json')
          .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
          })
          .then(data => {
            if (Array.isArray(data)) setDictionarySymbols(data);
          })
          .catch(() => {
            console.log("Utilisation des symboles de secours locaux");
          });
      });
  }, []);

  // Cycle loading messages when loading
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMessageIdx((prev) => (prev + 1) % loadingMessages.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [loading]);

  const handleAnalyze = async () => {
    if (!dreamText.trim()) return;
    setLoading(true);
    setLoadingMessageIdx(0);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/analyze-dream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dreamText })
      });

      if (!response.ok) {
        throw new Error("Une erreur s'est produite lors de la connexion au service de décryptage.");
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err: any) {
      setError(err.message || "Impossible d'analyser le rêve pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  const filteredSymbols = dictionarySymbols.filter(item => {
    // 1. Filter by category
    if (selectedCategory !== 'Tous' && item.category !== selectedCategory) {
      return false;
    }

    // 2. Filter by searched query (accent-insensitive, content-aware)
    const normalizedQuery = normalizeText(searchQuery.trim());
    if (!normalizedQuery) return true;

    return (
      normalizeText(item.symbol).includes(normalizedQuery) ||
      normalizeText(item.category).includes(normalizedQuery) ||
      normalizeText(item.meaning).includes(normalizedQuery) ||
      normalizeText(item.jung).includes(normalizedQuery) ||
      normalizeText(item.freud).includes(normalizedQuery) ||
      normalizeText(item.advice).includes(normalizedQuery)
    );
  });

  return (
    <div className="relative min-h-screen bg-[#FAF9F5] text-stone-800 flex flex-col justify-between font-sans selection:bg-rose-100 selection:text-rose-900">
      
      {/* 1. Ambient Background Gradients (Selector support helpers) */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(224,122,95,0.05),transparent)] pointer-events-none z-0" />
      
      {/* 2. Delicate Celestial Grid Texture */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      {/* 3. Toast/Error container helper */}
      <div className="fixed top-4 right-4 z-50 pointer-events-none" />

      {/* 4. Main App Container matching selector 'div#root > div > div:nth-of-type(4)' */}
      <div className="relative z-10 flex flex-col min-h-screen w-full">
        
        
        <div className="sticky top-0 z-50 bg-[#FAF9F5]/90 backdrop-blur-sm pt-4 pb-2 border-b border-stone-200/50">
            <div id="navigation-tabs" className="flex justify-between items-center px-4 max-w-5xl mx-auto">
              <div /> {/* Spacer */}
              <div className="p-1.5 bg-stone-100/80 border border-stone-200 rounded-full flex gap-1 shadow-inner w-full max-w-lg">
                <button
                  onClick={() => { setActiveTab('interprete'); }}
                  className={`flex-1 px-2 py-2 rounded-full text-[10px] sm:text-xs font-medium tracking-wider uppercase transition-all duration-300 flex justify-center items-center gap-1.5 cursor-pointer ${activeTab === 'interprete' ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400/20' : 'text-stone-500 hover:text-stone-800'}`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  Interprète
                </button>
                <button
                  onClick={() => { setActiveTab('dictionnaire'); }}
                  className={`flex-1 px-2 py-2 rounded-full text-[10px] sm:text-xs font-medium tracking-wider uppercase transition-all duration-300 flex justify-center items-center gap-1.5 cursor-pointer ${activeTab === 'dictionnaire' ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400/20' : 'text-stone-500 hover:text-stone-800'}`}
                >
                  <Search className="w-3.5 h-3.5" />
                  Dictionnaire
                </button>
                <button
                  onClick={() => { setActiveTab('guide'); }}
                  className={`flex-1 px-2 py-2 rounded-full text-[10px] sm:text-xs font-medium tracking-wider uppercase transition-all duration-300 flex justify-center items-center gap-1.5 cursor-pointer ${activeTab === 'guide' ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400/20' : 'text-stone-500 hover:text-stone-800'}`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Guide
                </button>
              </div>
              <div className="relative flex justify-end gap-2">
                {user ? (
                  <>
                    <button 
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="flex items-center p-2 bg-white border border-stone-200 rounded-full text-stone-600 hover:text-stone-900 transition-all"
                    >
                      {user.photoURL ? <img src={user.photoURL} alt="Profile" className="w-5 h-5 rounded-full" /> : <UserIcon className="w-4 h-4" />}
                    </button>
                    {showProfileMenu && (
                      <div className="absolute top-12 right-0 mt-1 p-2 bg-white border border-stone-200 rounded-xl shadow-lg w-40 z-50 animate-in fade-in zoom-in duration-200">
                        <button onClick={() => { setActiveTab('journal'); setShowProfileMenu(false); }} className="block w-full text-left p-2 hover:bg-stone-50 rounded-lg text-xs">Mon Journal</button>
                        <button onClick={() => { handleSignOut(); setShowProfileMenu(false); }} className="block w-full text-left p-2 hover:bg-stone-50 rounded-lg text-xs text-rose-600 flex items-center gap-2">
                          <LogOut className="w-3 h-3" />
                          Déconnexion
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <button onClick={handleSignIn} className="flex items-center gap-2 px-3 py-2 bg-rose-600 text-white rounded-full text-[10px] hover:bg-rose-700 transition-all">
                    <UserIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

      {/* Header Block matching 'div#root > div > div:nth-of-type(4) > header' */}
        <header className="pt-10 pb-10 px-4 text-center">
            {activeTab === 'interprete' && (
              <div className="text-center w-[801px] max-w-full mx-auto space-y-4">
                <div className="inline-flex p-3 bg-white border border-stone-200/80 rounded-2xl text-rose-600 shadow-md">
                  <Moon className="w-8 h-8" />
                </div>
                
                <h1 className="text-4xl md:text-5xl dream-h1 mb-6 text-stone-900 uppercase tracking-wide">
                  L'Interprète de Rêves
                </h1>
                
                <p className="text-stone-600 w-[800px] max-w-full mx-auto text-[14px] leading-relaxed font-light">
                  Les symboles de vos rêves sont interprétés à partir de significations partagées par tous. 
                  Mais chaque rêve est unique, et certains symboles n'appartiennent qu'à vous. 
                  Leur sens profond mérite parfois une exploration plus personnelle.
                </p>
              </div>
            )}


        </header>

        {/* Main Content matching 'div#root > div > div:nth-of-type(4) > main' */}
        <main className="flex-grow max-w-5xl mx-auto w-full px-4 pb-12">
          
          {/* TAP 1: THE INTERPRETER */}
          {activeTab === 'interprete' && (
            <div className="space-y-12" id="interpreter-tab">
              
              {/* Main Input Card */}
              <section className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden" id="input-section">
                
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 text-rose-600 font-medium">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-widest">Analyse thématique active</span>
                  </div>
                  
                  <textarea
                    id="dream-input"
                    className="w-full h-56 p-6 bg-stone-50/40 border border-stone-200/80 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20 rounded-2xl resize-none text-stone-850 text-base placeholder:text-stone-400 outline-none transition-all duration-300"
                    placeholder="Décrivez le rêve avec précision..."
                    value={dreamText}
                    onChange={(e) => setDreamText(e.target.value)}
                    disabled={loading}
                  />

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <p className="text-xs text-stone-500 italic max-w-md">
                      Mentionnez le décor, les êtres vivants rencontrés, les émotions ressenties ainsi que les couleurs dominantes pour de meilleurs résultats.
                    </p>
                    
                    <button
                      onClick={handleAnalyze}
                      disabled={loading || !dreamText.trim()}
                      className="w-full sm:w-auto px-8 py-3.5 bg-stone-900 hover:bg-stone-850 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white text-sm font-medium tracking-wide transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
                          <span>Décryptage...</span>
                        </>
                      ) : (
                        <>
                          <span>Explorer l'Inconscient</span>
                          <ArrowRight className="w-4 h-4 text-rose-200" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </section>

              {/* Loader */}
              {loading && (
                <div className="py-12 flex flex-col items-center justify-center space-y-4" id="analysis-loader">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border border-stone-200 border-t-rose-600 animate-spin" />
                    <Moon className="w-6 h-6 text-rose-500/60 absolute top-5 left-5 animate-pulse" />
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={loadingMessageIdx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.6 }}
                      className="text-stone-600 text-sm font-light italic"
                    >
                      {loadingMessages[loadingMessageIdx]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              )}

              {/* Error Frame */}
              {error && (
                <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex gap-3 text-red-800" id="error-alert">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-sm">
                    <h4 className="font-semibold">Une anomalie s'est produite</h4>
                    <p className="text-red-800/80 leading-relaxed">{error}</p>
                    <button 
                      onClick={handleAnalyze}
                      className="text-red-950 hover:text-black underline font-medium mt-2 block"
                    >
                      Réessayer l'analyse
                    </button>
                  </div>
                </div>
              )}

              {/* RESULTS AREA */}
              {analysisResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="space-y-10"
                  id="results-block"
                >
                  
                  {/* Summary / Subconscious Intent */}
                  <div className="p-8 bg-white border border-stone-200 rounded-3xl relative overflow-hidden shadow-sm" id="summary-card">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-600" />
                    <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-xs uppercase tracking-widest text-rose-700 font-semibold flex items-center gap-1.5 shrink-0">
                        <Activity className="w-3.5 h-3.5" />
                        Message Subconscient Global
                      </span>
                      <button onClick={() => handleSaveDream()} className="text-xs text-rose-600 hover:text-rose-800 underline ml-2">Sauvegarder ce rêve</button>
                    </div>
                      <h3 className="text-2xl font-light text-stone-900 dream-h1">Synthèse Thématique</h3>
                      <p className="text-stone-700 leading-relaxed text-sm">
                        {analysisResult.summary}
                      </p>

                      <div className="pt-6 border-t border-stone-100 mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analysisResult.keyMessages.map((msg, i) => (
                          <div key={i} className="flex gap-2.5 items-start p-3.5 bg-stone-50 rounded-xl border border-stone-100 shadow-inner">
                            <CornerDownRight className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-stone-600 leading-relaxed italic">{msg}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Reflections / Pistes de réflexions sur le réel */}
                  {analysisResult.realLifeReflections && analysisResult.realLifeReflections.length > 0 && (
                    <div className="p-8 bg-gradient-to-br from-rose-50/40 via-stone-50/20 to-white border border-stone-200 rounded-3xl relative overflow-hidden shadow-sm" id="reflections-card">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-stone-800" />
                      <div className="space-y-4">
                        <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                          Pistes de Réflexion sur le Réel
                        </span>
                        <h3 className="text-2xl font-light text-stone-900 dream-h1">Quels aspects de la vie éveillée méritent d'être approfondis ?</h3>
                        <p className="text-stone-600 text-sm leading-relaxed font-light">
                          Afin de comprendre l'origine profonde de ces images oniriques, il s'avère précieux de les mettre en perspective avec le quotidien. Voici des pistes concrètes à explorer :
                        </p>
                        
                        <div className="space-y-3 pt-2">
                          {analysisResult.realLifeReflections.map((reflection, i) => (
                            <div key={i} className="flex gap-3.5 items-start p-4 bg-white/70 rounded-2xl border border-stone-200/60 shadow-sm hover:border-rose-300/40 transition-all">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <p className="text-[13px] text-stone-700 leading-relaxed font-medium">{reflection}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Symbols Detected inside the analyzed dream */}
                  <div className="space-y-4" id="discovered-symbols">
                    <span className="text-xs uppercase tracking-widest text-indigo-800 font-semibold flex items-center gap-1.5 px-1">
                      <Bookmark className="w-3.5 h-3.5" />
                      Symbolique Détectée dans le Rêve
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysisResult.symbols.map((symbol, idx) => (
                        <div key={idx} className="p-5 bg-white border border-stone-250/60 rounded-2xl shadow-sm space-y-1.5">
                          <h4 className="text-rose-700 font-semibold text-base flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-rose-600 rounded-full" />
                            {symbol.term}
                          </h4>
                          <p className="text-stone-600 text-xs leading-relaxed">
                            {symbol.meaning}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Emotional Score Gauges */}
                  <div className="p-6 bg-white border border-stone-200 rounded-3xl space-y-6 shadow-sm" id="emotional-gauges">
                    <span className="text-xs uppercase tracking-widest text-emerald-800 font-semibold px-2 block">
                      Vecteurs Émotionnels Mesurés
                    </span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "Peur", value: analysisResult.emotionScores.peur, color: "bg-rose-50/80 text-rose-700 border-rose-200" },
                        { label: "Émerveillement", value: analysisResult.emotionScores.merveille, color: "bg-emerald-50/80 text-emerald-800 border-emerald-200" },
                        { label: "Confusion", value: analysisResult.emotionScores.confusion, color: "bg-[#FCF6E5] text-[#B07A10] border-[#EADBB8]" },
                        { label: "Clarté", value: analysisResult.emotionScores.clarte, color: "bg-indigo-50/80 text-indigo-800 border-indigo-200" }
                      ].map((gauge, i) => (
                        <div key={i} className={`p-4 rounded-xl border text-center space-y-2 ${gauge.color}`}>
                          <div className="text-2xl font-semibold tracking-tight">{gauge.value}%</div>
                          <div className="text-xs uppercase font-medium tracking-wider opacity-95">{gauge.label}</div>
                          {/* Progress bar */}
                          <div className="w-full h-1 bg-[#ECEAE2] rounded-full overflow-hidden">
                            <div className="h-full bg-current duration-500" style={{ width: `${gauge.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Psychoanalytical Reading Tab Panel */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="dual-readings">
                    
                    {/* Freud Reading */}
                    <div className="p-6 bg-white border border-stone-200 rounded-2xl space-y-3 relative overflow-hidden shadow-sm">
                      <div className="absolute top-0 right-0 p-3 text-stone-100 font-mono text-3xl font-bold select-none pointer-events-none">SF</div>
                      <h4 className="text-rose-700 font-semibold text-xs tracking-wider uppercase">Lecture de S. Freud</h4>
                      <p className="text-stone-700 text-[13px] leading-relaxed italic">
                        {analysisResult.freudianReading}
                      </p>
                    </div>

                    {/* Jung Reading */}
                    <div className="p-6 bg-white border border-stone-200 rounded-2xl space-y-3 relative overflow-hidden shadow-sm">
                      <div className="absolute top-0 right-0 p-3 text-stone-100 font-mono text-3xl font-bold select-none pointer-events-none">CGJ</div>
                      <h4 className="text-indigo-800 font-semibold text-xs tracking-wider uppercase">Lecture de C.G. Jung</h4>
                      <p className="text-stone-700 text-[13px] leading-relaxed italic">
                        {analysisResult.jungianReading}
                      </p>
                    </div>
                  </div>

                  {/* Journal Prompt to write manually */}
                  <div className="p-8 bg-white border border-stone-200 rounded-3xl space-y-4 flex flex-col md:flex-row gap-6 items-center shadow-sm relative overflow-hidden" id="journal-prompt-card">
                    <div className="p-4 bg-rose-50 rounded-full text-rose-600 shrink-0">
                      <PenTool className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5 text-center md:text-left">
                      <h4 className="font-light text-lg text-stone-900 dream-h1">Consigne de Journalisation</h4>
                      <p className="text-stone-500 text-sm leading-relaxed">
                        Une invitation à consigner cette réflexion au sein d'un journal intime de rêves :
                      </p>
                      <p className="text-rose-700 text-sm font-semibold italic pt-1 leading-relaxed">
                        « {analysisResult.journalPrompt} »
                      </p>
                    </div>
                  </div>

                </motion.div>
              )}
            </div>
          )}

          {/* TAB 2: DICTIONARY OF SYMBOLS */}
          {activeTab === 'dictionnaire' && (
            <div className="space-y-6" id="dictionary-tab">
              
              <div className="text-center max-w-xl mx-auto space-y-2 mb-4">
                <h2 className="text-2xl font-light text-stone-900 dream-h1">Moteur d'Interprétation Onirique</h2>
                <p className="text-stone-500 text-xs">
                  Recherchez et explorez intuitivement les définitions, archétypes de Jung, grilles freudiennes et orientations d'action de toute notre base de connaissances.
                </p>
              </div>

              {/* Search Bar config */}
              <div className="relative max-w-lg mx-auto" id="search-bar-container">
                <Search className="absolute left-4 top-3.5 text-stone-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher un mot, un thème ou une définition..."
                  className="w-full pl-12 pr-12 py-3.5 bg-white border border-stone-200 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20 text-stone-800 placeholder:text-stone-400 rounded-2xl outline-none transition-all shadow-sm text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-3 text-stone-400 hover:text-stone-600 bg-stone-100 hover:bg-stone-200 active:scale-95 rounded-full p-1 transition-all text-xs"
                    title="Effacer la recherche"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Pills Selector */}
              <div className="max-w-4xl mx-auto" id="category-filter-container">
                <div className="flex flex-wrap justify-center gap-1.5 py-1">
                  {['Tous', ...Array.from(new Set(dictionarySymbols.map(item => item.category).filter(Boolean))).sort()].map((cat) => {
                    const count = cat === 'Tous' 
                      ? dictionarySymbols.length 
                      : dictionarySymbols.filter(item => item.category === cat).length;
                    
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          // We do not clear query automatically, letting them narrow search, but we can make it smooth
                        }}
                        className={`text-xs px-3.5 py-1.5 rounded-full border transition-all ${
                          isSelected
                            ? 'bg-rose-800 text-white border-rose-800 shadow-sm font-medium'
                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50 hover:text-stone-900'
                        }`}
                      >
                        {cat} <span className={`text-[10px] ml-1 opacity-70`}>({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Available Symbols Tags Index */}
              <div className="max-w-4xl mx-auto bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-3" id="symbol-index-container">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/50 pb-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                    Index des symboles disponibles ({dictionarySymbols.length})
                  </span>
                  {(searchQuery || selectedCategory !== 'Tous') && (
                    <button 
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('Tous');
                      }}
                      className="text-xs text-rose-800 hover:underline hover:text-rose-900 transition-all text-left"
                    >
                      Réinitialiser tous les filtres
                    </button>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 pt-1">
                  {(dictionarySymbols.length > 100 ? filteredSymbols : dictionarySymbols).slice(0, 80).map((item, idx) => {
                    const isMatch = filteredSymbols.some(fs => fs.symbol === item.symbol);
                    const isCurrentlySearched = searchQuery.toLowerCase().trim() === item.symbol.toLowerCase();
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSearchQuery(item.symbol);
                          // Ensure we transition category filter if needed, OR keep current if matched
                          if (selectedCategory !== 'Tous' && item.category !== selectedCategory) {
                            setSelectedCategory('Tous');
                          }
                        }}
                        className={`px-3 py-1 rounded-xl text-xs transition-all ${
                          isCurrentlySearched
                            ? 'bg-rose-700 text-white font-medium shadow-sm border border-rose-700'
                            : isMatch
                              ? 'bg-white hover:bg-rose-50 text-stone-700 border border-stone-200 hover:border-stone-300'
                              : 'bg-stone-100 text-stone-400 border border-dashed border-stone-200 opacity-60 cursor-not-allowed text-[11px]'
                        }`}
                        title={`${item.symbol} (${item.category})`}
                        disabled={!isMatch && searchQuery !== ''}
                      >
                        {item.symbol}
                      </button>
                    );
                  })}
                  {filteredSymbols.length > 80 && (
                    <span className="text-[11px] text-stone-400 self-center px-2 italic">
                      ... et {filteredSymbols.length - 80} autres symboles (utilisez la barre de recherche)
                    </span>
                  )}
                </div>
              </div>

              {/* Matching Status Info */}
              <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-200/50" id="search-statistics">
                <span>
                  Affichage de <strong className="text-stone-800">{filteredSymbols.length}</strong> symbole{filteredSymbols.length > 1 ? 's' : ''} sur <strong className="text-stone-800">{dictionarySymbols.length}</strong>
                </span>
                {selectedCategory !== 'Tous' && (
                  <span>
                    Filtre actif : <strong className="text-rose-700">{selectedCategory}</strong>
                  </span>
                )}
              </div>

              {/* Direct Detailed Symbols list */}
              <div className="space-y-8" id="symbols-detailed-list">
                {filteredSymbols.slice(0, 20).map((item, index) => {
                  const isExpanded = expandedIndex === index;
                  return (
                    <div 
                      key={index} 
                      className={`bg-white border ${isExpanded ? 'border-rose-200' : 'border-stone-200'} rounded-3xl p-6 md:p-8 shadow-sm space-y-6 hover:shadow-md transition-all duration-300 relative overflow-hidden`}
                      id={`dict-item-${index}`}
                    >
                      {/* Header: Thème et Mot */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                            Thème : {item.category}
                          </span>
                          <h3 className="text-xl md:text-2xl font-light text-stone-900 dream-h1 flex items-center gap-2 mt-1">
                            <Bookmark className="w-5 h-5 text-rose-600 shrink-0" />
                            Mot : <span className="font-semibold text-rose-800">{item.symbol}</span>
                          </h3>
                        </div>
                        <button 
                          onClick={() => setExpandedIndex(isExpanded ? null : index)}
                          className="text-xs text-rose-600 font-medium hover:text-rose-800 underline transition-colors"
                        >
                          {isExpanded ? 'Réduire' : 'En savoir plus'}
                        </button>
                      </div>

                      {/* Content Section containing the requested headings */}
                      <div className={`grid grid-cols-1 gap-6 ${isExpanded ? 'block' : 'hidden'}`}>
                        
                        {/* Interpretation */}
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold tracking-wider text-rose-700 uppercase flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                            Interprétation
                          </h4>
                          <p className="text-stone-700 text-sm leading-relaxed pl-4 border-l border-stone-200">
                            {item.meaning}
                          </p>
                        </div>

                        {/* Écho C.G. Jung (Archétypes) */}
                        {item.jung && (
                          <div className="space-y-1.5">
                            <h4 className="text-xs font-bold tracking-wider text-indigo-800 uppercase flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                              Écho C.G. Jung (Archétypes)
                            </h4>
                            <p className="text-stone-600 text-sm leading-relaxed italic pl-4 border-l border-indigo-200">
                              {item.jung}
                            </p>
                          </div>
                        )}

                        {/* Écho S. Freud (Désirs censurés) */}
                        {item.freud && (
                          <div className="space-y-1.5">
                            <h4 className="text-xs font-bold tracking-wider text-amber-700 uppercase flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                              Écho S. Freud (Désirs censurés)
                            </h4>
                            <p className="text-stone-600 text-sm leading-relaxed italic pl-4 border-l border-amber-200">
                              {item.freud}
                            </p>
                          </div>
                        )}

                        {/* Conseil pour l'Individu */}
                        {item.advice && (
                          <div className="space-y-1.5">
                            <h4 className="text-xs font-bold tracking-wider text-emerald-800 uppercase flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              Conseil pour l'Individu
                            </h4>
                            <p className="text-stone-700 text-sm whitespace-pre-line leading-relaxed pl-4 border-l border-emerald-200 bg-stone-50/50 p-4 rounded-xl">
                              {item.advice}
                            </p>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}

                {filteredSymbols.length > 20 && (
                  <div className="text-center py-6 bg-stone-50 border border-stone-200 rounded-3xl" id="too-many-results-fallback">
                    <p className="text-stone-500 text-sm italic">
                      Affichage limité aux 20 premiers résultats pour préserver la fluidité. Veuillez utiliser la barre de recherche ou les filtres thématiques ci-dessus pour un accès plus précis.
                    </p>
                  </div>
                )}

                {filteredSymbols.length === 0 && (
                  <div className="text-center py-16 bg-white border border-stone-200 rounded-3xl" id="empty-symbols">
                    <p className="text-stone-500 text-sm italic">Aucun symbole correspondant trouvé dans notre dictionnaire complet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: GUIDE PANEL */}
          {activeTab === 'guide' && <Guide />}

          {/* TAB 4: JOURNAL */}
          {activeTab === 'journal' && (
            <div className="space-y-6" id="journal-tab">
               <h2 className="text-2xl font-light text-stone-900 dream-h1">Mon Journal de Rêves</h2>
               
               <div className="flex flex-col sm:flex-row gap-4">
                 <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="p-2 border border-stone-200 rounded-lg text-sm" />
                 <input type="text" placeholder="Rechercher par mot-clé..." value={filterKeyword} onChange={(e) => setFilterKeyword(e.target.value)} className="p-2 border border-stone-200 rounded-lg text-sm flex-grow" />
               </div>

               {dreams.length === 0 ? (
                 <p className="text-stone-500 italic">Aucun rêve enregistré pour le moment.</p>
               ) : (
                 <div className="grid gap-4">
                   {dreams.filter(d => {
                     let dateMatch = true;
                     if (filterDate) {
                       try {
                         const dDate = d.date ? new Date(d.date) : null;
                         const fDate = new Date(filterDate);
                         dateMatch = (dDate && !isNaN(dDate.getTime())) ? dDate.toLocaleDateString() === fDate.toLocaleDateString() : false;
                       } catch (e) {
                         dateMatch = false;
                       }
                     }
                     let textMatch = true;
                     if (filterKeyword) {
                       const kw = filterKeyword.toLowerCase();
                       const titleStr = (d.title || '').toLowerCase();
                       const interpStr = (d.interpretation || '').toLowerCase();
                       const contentStr = (d.content || '').toLowerCase();
                       textMatch = titleStr.includes(kw) || interpStr.includes(kw) || contentStr.includes(kw);
                     }
                     return dateMatch && textMatch;
                   }).map((dream: any) => {
                     const isExpanded = expandedDreamId === dream.id;
                     let analysis: AnalysisResult | null = null;
                     try {
                        analysis = JSON.parse(dream.interpretation);
                     } catch (e) {
                        analysis = { summary: dream.interpretation } as any;
                     }
                     return (
                       <div key={dream.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                         <div className="flex justify-between items-start cursor-pointer" onClick={() => setExpandedDreamId(isExpanded ? null : dream.id)}>
                           <div>
                             <h3 className="text-lg font-medium text-stone-900">{dream.title || "Rêve sans titre"}</h3>
                             <p className="text-xs text-stone-500">
                               {(() => {
                                 if (!dream.date) return 'Date inconnue';
                                 try {
                                   const d = new Date(dream.date);
                                   return isNaN(d.getTime()) ? 'Date inconnue' : d.toLocaleDateString();
                                 } catch (e) {
                                   return 'Date inconnue';
                                 }
                               })()}
                             </p>
                           </div>
                           <div className="flex items-center gap-2">
                             <button className="text-xs text-rose-600 underline">
                               {isExpanded ? 'Réduire' : 'En savoir plus'}
                             </button>
                             <button onClick={(e) => handleDeleteDream(dream.id, e)} className="text-rose-600 hover:text-rose-800 text-xs font-semibold">Supprimer</button>
                           </div>
                         </div>
                         {isExpanded && analysis && (
                           <div className="mt-4 pt-4 border-t border-stone-100 space-y-4">
                              <div className="space-y-1">
                                <h4 className="font-semibold text-stone-900">Rêve original</h4>
                                <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-wrap">{dream.content}</p>
                              </div>
                              <h4 className="font-semibold text-stone-900">Synthèse</h4>
                              <p className="text-stone-700 text-sm leading-relaxed">{analysis.summary}</p>
                              
                              {analysis.keyMessages && analysis.keyMessages.length > 0 && (
                                <div className="space-y-1">
                                  <h4 className="font-semibold text-stone-900">Messages Clés</h4>
                                  <ul className="list-disc pl-5 text-stone-600 text-sm">
                                      {analysis.keyMessages.map((msg, i) => <li key={i}>{msg}</li>)}
                                  </ul>
                                </div>
                              )}

                              {analysis.realLifeReflections && analysis.realLifeReflections.length > 0 && (
                                <div className="space-y-1">
                                  <h4 className="font-semibold text-stone-900">Pistes de Réflexion sur le Réel</h4>
                                  <ul className="list-disc pl-5 text-stone-600 text-sm">
                                      {analysis.realLifeReflections.map((msg, i) => <li key={i}>{msg}</li>)}
                                  </ul>
                                </div>
                              )}
                              
                              {analysis.emotionScores && (
                                <div className="space-y-1">
                                  <h4 className="font-semibold text-stone-900">Vecteurs Émotionnels Mesurés</h4>
                                  <div className="flex gap-4 text-sm text-stone-600">
                                      <span>Peur: {analysis.emotionScores.peur}%</span>
                                      <span>Merveille: {analysis.emotionScores.merveille}%</span>
                                      <span>Confusion: {analysis.emotionScores.confusion}%</span>
                                      <span>Clarté: {analysis.emotionScores.clarte}%</span>
                                  </div>
                                </div>
                              )}
                              
                              {analysis.symbols && analysis.symbols.length > 0 && (
                                <div className="space-y-1">
                                  <h4 className="font-semibold text-stone-900">Symboles</h4>
                                  <ul className="list-disc pl-5 text-stone-600 text-sm">
                                      {analysis.symbols.map((s, i) => <li key={i}><strong>{s.term}</strong>: {s.meaning}</li>)}
                                  </ul>
                                </div>
                              )}

                              {analysis.jungianReading && (
                                  <>
                                    <h4 className="font-semibold text-stone-900">Lecture Jungienne</h4>
                                    <p className="text-stone-600 text-sm italic">{analysis.jungianReading}</p>
                                  </>
                              )}
                              {analysis.freudianReading && (
                                  <>
                                    <h4 className="font-semibold text-stone-900">Lecture Freudienne</h4>
                                    <p className="text-stone-600 text-sm italic">{analysis.freudianReading}</p>
                                  </>
                              )}
                              
                              {analysis.journalPrompt && (
                                  <>
                                    <h4 className="font-semibold text-stone-900">Consigne de journalisation</h4>
                                    <p className="text-stone-600 text-sm italic font-medium">« {analysis.journalPrompt} »</p>
                                  </>
                              )}
                           </div>
                         )}
                         {isExpanded && !analysis && (
                            <div className="mt-4 pt-4 border-t border-stone-100 italic text-stone-500 text-sm">
                                {dream.interpretation}
                            </div>
                         )}
                       </div>
                     );
                   })}
                 </div>
               )}
            </div>
          )}

        </main>

        {/* Footer block matching 'div#root > div > div:nth-of-type(4) > footer' */}
        <footer className="mt-12 text-center text-[#9C958E] text-[11px] pb-12 font-light">
          <p>Conçu et développé avec soin par Helena H.</p>
        </footer>

      </div>
    </div>
  );
}
