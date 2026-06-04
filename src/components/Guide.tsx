import { 
  Heart, 
  Brain, 
  Lightbulb, 
  AlertCircle, 
  BookOpen, 
  Eye, 
  HelpCircle
} from 'lucide-react';

export default function Guide() {
  const benefits = [
    {
      icon: <Heart className="w-5 h-5 text-rose-600" />,
      title: "Régulation émotionnelle",
      description: "Les rêves aident à digérer les expériences difficiles et à moduler l'intensité des émotions."
    },
    {
      icon: <Brain className="w-5 h-5 text-indigo-600" />,
      title: "Consolidation de la mémoire",
      description: "Pendant le sommeil, le cerveau trie et archive ce qui mérite d'être retenu."
    },
    {
      icon: <Lightbulb className="w-5 h-5 text-amber-600" />,
      title: "Résolution créative",
      description: "De nombreuses découvertes scientifiques et œuvres artistiques ont émergé d'un rêve."
    },
    {
      icon: <AlertCircle className="w-5 h-5 text-stone-600" />,
      title: "Signal d'alarme",
      description: "Un rêve récurrent signale souvent un conflit intérieur non résolu qui demande attention."
    }
  ];

  const steps = [
    {
      num: "01",
      title: "Carnet de chevet",
      description: "Posez un carnet et un stylo à portée de main. Au réveil, notez immédiatement — avant même de consulter votre téléphone."
    },
    {
      num: "02",
      title: "Mots-clés d'abord",
      description: "Écrivez six à dix mots-clés en premier : les lieux, les personnages, les émotions dominantes. La narration peut venir ensuite."
    },
    {
      num: "03",
      title: "Ne forcez pas",
      description: "Si le souvenir est fragmentaire, consignez les fragments. Un détail isolé vaut mieux que rien — il peut déclencher le reste."
    },
    {
      num: "04",
      title: "Régularité",
      description: "La mémoire onirique est une compétence. Plus vous la pratiquez, plus vos rêves deviennent accessibles et précis."
    }
  ];

  return (
    <div className="space-y-16 max-w-4xl mx-auto py-10 px-4 animate-fade-in" id="guide-section">
      {/* Intro section */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="text-[11px] uppercase tracking-widest text-rose-600 font-semibold bg-rose-50 px-3 py-1 rounded-full">
          Pratique Onirique
        </span>
        <h2 className="text-4xl font-light text-stone-900 dream-h1 tracking-tight">Guide des rêves</h2>
        <p className="text-stone-600 text-[15px] leading-relaxed font-light">
          Apprendre à écouter ce que votre subconscient tente de vous communiquer chaque nuit.
        </p>
      </div>

      {/* Section : Pourquoi prêter attention */}
      <div className="space-y-8" id="importance-section">
        <div className="border-t border-stone-200/80 pt-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-1 space-y-3">
            <h3 className="text-xl font-light text-stone-900 dream-h1">Pourquoi prêter attention à vos rêves ?</h3>
            <p className="text-stone-500 text-[13px] leading-relaxed font-light">
              Les rêves ne sont pas des images aléatoires. Ils sont le langage que votre subconscient emploie pour traiter ce que votre esprit conscient ne peut — ou ne veut — pas affronter.
            </p>
            <p className="text-stone-500 text-[13px] leading-relaxed font-light">
              Rêver, c'est recevoir un rapport quotidien sur votre état intérieur. Ignorer vos rêves, c'est vous priver d'informations précieuses sur ce qui vous préoccupe, vous motive ou vous freine.
            </p>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4" id="benefits-grid">
            {benefits.map((benefit, i) => (
              <div 
                key={i} 
                className="p-5 bg-white border border-stone-200/70 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300"
                id={`benefit-card-${i}`}
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="p-2 bg-stone-50 rounded-lg border border-stone-100">
                    {benefit.icon}
                  </div>
                  <h4 className="text-sm font-semibold text-stone-850">{benefit.title}</h4>
                </div>
                <p className="text-stone-600 text-[12px] leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section : Comment se souvenir */}
      <div className="space-y-8 border-t border-stone-200/80 pt-10" id="remembering-section">
        <div className="space-y-2">
          <h3 className="text-xl font-light text-stone-900 dream-h1">Comment se souvenir de ses rêves</h3>
          <p className="text-stone-500 text-xs">Des conseils simples pour stimuler votre rappel onirique au réveil.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6" id="steps-grid">
          {steps.map((step, i) => (
            <div 
              key={i} 
              className="p-6 bg-white/70 border border-stone-200/80 rounded-2xl relative hover:border-stone-300 transition-all duration-300 flex flex-col justify-between"
              id={`step-card-${step.num}`}
            >
              <div className="space-y-4">
                <span className="font-mono text-3xl font-extralight text-stone-300 tracking-tighter block">
                  {step.num}
                </span>
                <h4 className="text-sm font-semibold text-stone-850">{step.title}</h4>
                <p className="text-stone-600 text-[12px] leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Un exemple de note au réveil */}
        <div className="max-w-2xl mx-auto pt-4" id="example-notebook-container">
          <div className="bg-gradient-to-tr from-amber-50/40 via-stone-50/20 to-white border border-stone-250/60 rounded-2xl p-6 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BookOpen className="w-20 h-20 text-stone-800" />
            </div>
            <div className="space-y-3 relative z-10">
              <div className="flex items-center gap-2">
                <span className="flex w-2 h-2 rounded-full bg-amber-500" />
                <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Un exemple de note au réveil</h4>
              </div>
              <div className="pl-4 border-l-2 border-amber-500/30 py-1 space-y-2">
                <p className="text-[11px] font-mono uppercase tracking-widest text-stone-400">
                  Fragment de carnet — 07h14
                </p>
                <p className="text-stone-700 text-[13px] font-mono bg-white/60 p-3 rounded-xl border border-stone-200/40 inline-block">
                  Train — gare inconnue — nuit — mon père — poursuite — peur intense
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4 : Les Grandes Écoles de Lecture */}
      <div className="p-8 bg-stone-100/60 border border-stone-200/85 rounded-3xl space-y-6" id="schools-comparison">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5 text-rose-600" />
          <h3 className="text-xl font-light text-stone-900 dream-h1">Les Grandes Écoles de Lecture</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 p-6 bg-white rounded-2xl border border-stone-200/60 shadow-sm" id="freud-intro">
            <h4 className="text-rose-700 font-semibold text-xs tracking-wider uppercase">L'Approche Freudienne (Sigmund Freud)</h4>
            <p className="text-stone-700 text-[12px] leading-relaxed">
              Le rêve est l'expression métaphorique d'un <strong>désir refoulé</strong>, souvent datant de l'enfance. Le conscient travestit le sens profond du rêve (votre contenu latent) en images plus acceptables (votre contenu manifeste) sous forme de rébus ou de condensations pour échapper à la censure de l'esprit rationnel.
            </p>
            <div className="text-xs text-rose-600/80 italic pt-2">
              « Le rêve est la voie royale qui mène à la connaissance de l'inconscient. »
            </div>
          </div>

          <div className="space-y-3 p-6 bg-white rounded-2xl border border-stone-200/60 shadow-sm" id="jung-intro">
            <h4 className="text-indigo-800 font-semibold text-xs tracking-wider uppercase">L'Approche Jungienne (Carl Gustav Jung)</h4>
            <p className="text-stone-700 text-[12px] leading-relaxed">
              Le subconscient n'est pas une simple poubelle à désirs réprimés. Les rêves sont des messages de <strong>compensation psychologique</strong> qui cherchent à rétablir l'équilibre de l'esprit. Ils utilisent des <strong>archétypes</strong> — des symboles universels partagés par toute l'humanité (l'ombre, le sage, l'anima) — pour guider notre développement intérieur.
            </p>
            <div className="text-xs text-indigo-700/80 italic pt-2">
              « Qui regarde dehors rêve ; qui regarde à l'intérieur s'éveille. »
            </div>
          </div>
        </div>
      </div>

      {/* Helpful advice section */}
      <div className="flex flex-col md:flex-row gap-5 p-6 bg-stone-50 border border-stone-200 rounded-2xl items-start" id="final-advice-box">
        <HelpCircle className="w-6 h-6 text-stone-400 shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <h4 className="text-stone-800 font-medium text-xs uppercase tracking-wider">Un rappel de sagesse</h4>
          <p className="text-stone-600 text-[12px] leading-relaxed font-light">
            Les symboles automatisés d'un dictionnaire constituent d'excellentes clés inspirantes, mais ils ne prétendront jamais cerner le fil exact de votre mémoire intime. Écoutez toujours en priorité les échos que ces interprétations réveillent en vous. C'est là que réside la véritable sagesse.
          </p>
        </div>
      </div>
    </div>
  );
}
