import { motion } from "motion/react";
import { BookOpen, HelpCircle, Sun, PenTool, Clipboard } from "lucide-react";

export default function Guide() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-16 py-8"
    >
      {/* Intro Section */}
      <section className="space-y-6">
        <div className="flex items-center space-x-3 text-deep-ink">
          <BookOpen className="w-6 h-6 text-coral" />
          <h2 className="text-3xl font-medium tracking-tight">Pourquoi prêter attention à vos rêves</h2>
        </div>
        
        <div className="dream-card bg-white/50 backdrop-blur-sm">
          <h3 className="text-xl font-semibold mb-4 text-deep-ink">À quoi servent les rêves ?</h3>
          <div className="space-y-4 text-mid-gray leading-relaxed text-lg">
            <p>
              Les rêves ne sont pas des images aléatoires. Ils sont le langage de votre subconscient. 
              Pendant que vous dormez, votre cerveau traite les émotions de la journée, trie les souvenirs 
              et tente de résoudre des problèmes que votre esprit conscient néglige.
            </p>
            <p>
              Rêver, c'est recevoir un rapport quotidien sur votre état intérieur. 
              Ignorer vos rêves, c'est vous priver d'informations précieuses sur ce qui vous préoccupe, 
              vous motive ou vous freine.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl border border-black/[0.03] bg-white/30">
            <h4 className="font-semibold text-deep-ink mb-3 flex items-center gap-2">
              <Sun className="w-4 h-4 text-ochre" /> Régulation émotionnelle
            </h4>
            <p className="text-sm text-mid-gray">Les rêves aident à digérer les expériences difficiles.</p>
          </div>
          <div className="p-6 rounded-xl border border-black/[0.03] bg-white/30">
            <h4 className="font-semibold text-deep-ink mb-3 flex items-center gap-2">
              <Clipboard className="w-4 h-4 text-sage" /> Consolidation de la mémoire
            </h4>
            <p className="text-sm text-mid-gray">Ils trient ce qui est important de ce qui ne l'est pas.</p>
          </div>
          <div className="p-6 rounded-xl border border-black/[0.03] bg-white/30">
            <h4 className="font-semibold text-deep-ink mb-3 flex items-center gap-2">
              <PenTool className="w-4 h-4 text-coral" /> Résolution créative
            </h4>
            <p className="text-sm text-mid-gray">De nombreux artistes et scientifiques ont trouvé des solutions en rêve.</p>
          </div>
          <div className="p-6 rounded-xl border border-black/[0.03] bg-white/30">
            <h4 className="font-semibold text-deep-ink mb-3 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-mid-gray" /> Signal d'alarme
            </h4>
            <p className="text-sm text-mid-gray">Un rêve récurrent ou perturbant peut indiquer un problème non résolu.</p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="space-y-6">
        <div className="flex items-center space-x-3 text-deep-ink">
          <div className="w-8 h-1 bg-sage rounded-full" />
          <h2 className="text-2xl font-medium tracking-tight">L'utilité du souvenir</h2>
        </div>
        <div className="space-y-4 text-mid-gray leading-relaxed">
          <p>
            Se souvenir de ses rêves, c'est apprendre à mieux se connaître. 
            Chaque rêve est une conversation avec une partie de vous qui ne s'exprime pas pendant la journée.
          </p>
          <ul className="grid gap-3 pt-4">
            {[
              "Identifier des schémas récurrents qui révèlent vos préoccupations profondes.",
              "Repérer des blocages que votre esprit conscient refuse d'affronter.",
              "Suivre votre évolution personnelle sur plusieurs semaines ou mois.",
              "Développer votre créativité en accédant à des associations d'idées inédites."
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-sage mt-2 shrink-0" />
                <span className="text-deep-ink/80">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Methods Section */}
      <section className="space-y-8">
        <div className="flex items-center space-x-3 text-deep-ink">
          <div className="w-8 h-1 bg-ochre rounded-full" />
          <h2 className="text-2xl font-medium tracking-tight">Comment se souvenir de ses rêves</h2>
        </div>

        <div className="space-y-12">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-deep-ink">Au réveil, ne bougez pas tout de suite</h3>
              <p className="text-mid-gray leading-relaxed">
                Gardez les yeux fermés quelques instants. Restez dans la position où vous vous êtes réveillé. 
                Le mouvement et la lumière effacent rapidement les souvenirs du rêve.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-deep-ink">Capturez des mots-clés, pas un récit</h3>
              <p className="text-mid-gray leading-relaxed">
                N'essayez pas de tout écrire parfaitement. Notez immédiatement des mots-clés sur votre téléphone 
                ou un carnet. Ces quelques mots suffiront à faire ressurgir l'histoire plus tard.
              </p>
            </div>
          </div>

          <div className="dream-card border-l-4 border-l-coral bg-coral/5">
            <h3 className="text-lg font-semibold text-deep-ink mb-6">Ce qu'il est utile de noter :</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { label: "Objets", desc: "Quels objets avez-vous vus ou utilisés ?" },
                { label: "Lieux", desc: "Où se déroulait le rêve ? Était-ce familier ou inconnu ?" },
                { label: "Personnes", desc: "Qui était présent ? Des proches, des inconnus ?" },
                { label: "Ambiance", desc: "Faisait-il jour ou nuit ? Quel temps faisait-il ?" },
                { label: "Émotions", desc: "Peur, joie, colère, tristesse, surprise, dégoût... C'est le plus important.", highlight: true },
              ].map((item, i) => (
                <div key={i} className={`p-4 rounded-lg bg-white/50 border border-black/[0.03] ${item.highlight ? 'ring-1 ring-coral/20' : ''}`}>
                  <span className="font-bold text-deep-ink block mb-1">{item.label}</span>
                  <p className="text-xs text-mid-gray leading-tight">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-deep-ink text-white rounded-2xl">
              <span className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2 block">Exemple de notes au réveil</span>
              <p className="text-xl font-medium tracking-tight">Train – gare inconnue – nuit – mon père – poursuite – peur intense</p>
            </div>
            <p className="text-sm text-mid-gray italic text-center">
              Avec ces six mots-clés, vous pourrez reconstituer l'essentiel du rêve plus tard.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 pt-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-deep-ink">Ne cherchez pas la perfection</h3>
              <p className="text-mid-gray leading-relaxed text-sm">
                Le récit que vous reconstruirez sera peut-être légèrement différent du rêve original. Ce n'est pas grave. 
                Votre cerveau a conservé l'essentiel. Les détails manquants ne changent pas la signification profonde du rêve.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-deep-ink">Tenez un journal de rêves</h3>
              <p className="text-mid-gray leading-relaxed text-sm">
                Relisez vos notes de temps en temps. Vous verrez apparaître des motifs, des thèmes, des personnages récurrents. 
                Ces redites sont des messages insistants de votre subconscient.
              </p>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
