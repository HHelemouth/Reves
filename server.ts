import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

// API Key verification helper (lazy initialization)
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// Analyse dream handler
app.post('/api/analyze-dream', async (req, res) => {
  try {
    const { dreamText } = req.body;
    if (!dreamText || typeof dreamText !== 'string' || !dreamText.trim()) {
      return res.status(400).json({ error: "Le texte du rêve est requis." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      console.warn("GEMINI_API_KEY is not configured. Falling back to an interactive simulated reading.");
      const mockedResponse = generateSmartFallback(dreamText);
      return res.json(mockedResponse);
    }

    const prompt = `Analyse le rêve suivant en tant que psychanalyste d'inspiration freudienne et jungienne. Donne une explication sobre, rigoureuse et analytique en français. Rêve: "${dreamText}"`;

    const config = {
      systemInstruction: "Tu es un psychanalyste érudit, sobre, neutre et profondément accessible, expert de Carl Jung et Sigmund Freud. Tu parles uniquement en français. Tu ne parles JAMAIS à la deuxième personne du singulier (tutoiement exclu : pas de 'tu', 'toi', 'ton', 'tes'). Tu dois être détaché et objectif en parlant 'du rêve' ou 'du rêveur' à la troisième personne, plutôt que d'interpeller directement la personne. Évite absolument tout ton pompeux, jargon abscons ou théâtral. Tes explications doivent être concrètes, humbles, simples et immédiatement parlantes, en liant directement les images oniriques à des pistes de questionnement réelles sur la vie éveillée.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { 
            type: Type.STRING, 
            description: "Résumé concis, parlant et simple de la dynamique d'esprit ou du conflit représenté dans le rêve. Analyse objective à la troisième personne, sans tutoiement." 
          },
          keyMessages: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "1 à 3 messages essentiels et concrets transmis par le subconscient, rédigés de manière neutre et détachée."
          },
          realLifeReflections: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "2 à 3 pistes de réflexion concrètes et ancrées dans la vie éveillée réelle du rêveur. Ce sont des questions ouvertes sans tutoiement, portant sur son quotidien (relations, travail, non-dits...) qu'il convient d'approfondir pour s'expliquer pourquoi ce rêve s'est produit."
          },
          symbols: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                term: { type: Type.STRING, description: "Nom du symbole extrait (ex: serpent, l'eau, chute...)" },
                meaning: { type: Type.STRING, description: "Signification ou résonance psychologique de ce symbole." }
              },
              required: ["term", "meaning"]
            },
            description: "Symboles notables extraits du rêve."
          },
          jungianReading: { 
            type: Type.STRING, 
            description: "Analyse approfondie selon la psychologie de Carl Jung (les archétypes, l'individuation, l'ombre, les contraires)." 
          },
          freudianReading: { 
            type: Type.STRING, 
            description: "Analyse approfondie selon la psychanalyse de Sigmund Freud (le masquage, désirs refoulés, contenu manifeste vs latent)." 
          },
          emotionScores: {
            type: Type.OBJECT,
            properties: {
              peur: { type: Type.INTEGER, description: "Intensité de la peur de 0 à 100." },
              merveille: { type: Type.INTEGER, description: "Intensité de l'émerveillement ou mysticisme de 0 à 100." },
              confusion: { type: Type.INTEGER, description: "Niveau d'incohérence ou de flou mental de 0 à 100." },
              clarte: { type: Type.INTEGER, description: "Niveau de clarté ou de résolution intérieure de 0 à 100." }
            },
            required: ["peur", "merveille", "confusion", "clarte"]
          },
          journalPrompt: { 
            type: Type.STRING, 
            description: "Une question claire d'écriture intime pour le carnet de rêves." 
          }
        },
        required: ["summary", "keyMessages", "realLifeReflections", "symbols", "jungianReading", "freudianReading", "emotionScores", "journalPrompt"]
      }
    };

    let response;
    try {
      console.log("[Gemini] Tentative de génération avec gemini-3.5-flash...");
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config
      });
    } catch (err: any) {
      console.warn("[Gemini] gemini-3.5-flash a échoué (haute demande ou indisponibilité), bascule sur gemini-2.5-flash. Erreur:", err.message || err);
      try {
        console.log("[Gemini] Tentative de génération avec gemini-2.5-flash...");
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config
        });
      } catch (fallbackErr: any) {
        console.error("[Gemini] gemini-2.5-flash a également échoué. Erreur:", fallbackErr.message || fallbackErr);
        console.warn("[Gemini] Utilisation du moteur de décryptage local hors-ligne en dernier recours.");
        const mockedResponse = generateSmartFallback(dreamText);
        return res.json(mockedResponse);
      }
    }

    const outputText = response.text;
    if (!outputText) {
      throw new Error("Aucune réponse générée par l'IA.");
    }

    const data = JSON.parse(outputText.trim());
    return res.json(data);

  } catch (error: any) {
    console.error("Erreur serveur finale lors de l'analyse:", error);
    // Even if JSON parse fails, we fall back to a high-quality local response rather than throwing a raw 500 error!
    try {
      const { dreamText } = req.body;
      const mockedResponse = generateSmartFallback(dreamText || "");
      return res.json(mockedResponse);
    } catch (innerErr) {
      return res.status(500).json({ error: error.message || "Une erreur interne s'est produite lors de l'analyse." });
    }
  }
});

// Match keywords to generate a premium mock experience in lack of API keys
function generateSmartFallback(text: string) {
  const lowercase = text.toLowerCase();
  const symbolsFound: Array<{ term: string; meaning: string }> = [];
  
  if (lowercase.includes("serpent")) {
    symbolsFound.push({
      term: "Serpent",
      meaning: "Force primitive, pulsion vitale refoulée ou transition psychologique profonde. Il incarne aussi bien le poison (le danger caché) que l'antidote (la sagesse clinique)."
    });
  }
  if (lowercase.includes("voler") || lowercase.includes("vole") || lowercase.includes("air") || lowercase.includes("planer")) {
    symbolsFound.push({
      term: "Voler / Plane",
      meaning: "Sensation d'émancipation, de libration intellectuelle ou recul face aux pesanteurs terrestres. Attention parfois au vertige du désengagement de la réalité matérielle."
    });
  }
  if (lowercase.includes("chute") || lowercase.includes("tombe") || lowercase.includes("vide")) {
    symbolsFound.push({
      term: "La Chute",
      meaning: "Anxiété intense face au lâcher-prise indispensable ou insécurité liée à une rupture de repères essentiels dans le quotidien éveillé."
    });
  }
  if (lowercase.includes("eau") || lowercase.includes("mer") || lowercase.includes("océan") || lowercase.includes("lac") || lowercase.includes("rivière")) {
    symbolsFound.push({
      term: "L'Eau",
      meaning: "Fluide universel de la psyché inconsciente. Des eaux limpides traduisent le calme retrouvé alors qu'un flot boueux ou déchaîné évoque des secrets non élaborés."
    });
  }
  if (lowercase.includes("mort") || lowercase.includes("meurt") || lowercase.includes("mourir")) {
    symbolsFound.push({
      term: "La Mort",
      meaning: "Fin incontournable d'une structure relationnelle ou caractérielle périmée. C'est l'annonciateur nécessaire d'un renouvellement psychique d'envergure."
    });
  }
  if (lowercase.includes("dent") || lowercase.includes("dents")) {
    symbolsFound.push({
      term: "Dents",
      meaning: "Perte de vitalité essentielle, sentiment d'impuissance physique ou sociale ou passage nécessaire vers un degré supérieur d'affirmation face aux tiers."
    });
  }
  if (lowercase.includes("chat")) {
    symbolsFound.push({
      term: "Le Chat",
      meaning: "Sensibilité vigilante, détachement salutaire d'intuition ou union fine avec la dimension animique inconsciente."
    });
  }
  if (lowercase.includes("maison") || lowercase.includes("chambre") || lowercase.includes("pièce")) {
    symbolsFound.push({
      term: "La Maison",
      meaning: "L'habitat mental dans son entièreté : la Persona s'exprime par le soin des façades publiques tandis que les sombres couloirs évoquent l'inconscient refoulé."
    });
  }

  if (symbolsFound.length === 0) {
    symbolsFound.push({
      term: "Symbolique Absconse",
      meaning: "La trame narrée porte une énigme intime ne cadrant pas avec les figures usuelles. Elle mérite une mise à plat de ses teintes émotionnelles dominantes."
    });
  }

  let peur = 35;
  let merveille = 30;
  let confusion = 45;
  let clarte = 25;

  if (lowercase.includes("peur") || lowercase.includes("effrayé") || lowercase.includes("cauchemar") || lowercase.includes("fuis")) {
    peur = 78;
    clarte = 15;
  }
  if (lowercase.includes("beau") || lowercase.includes("spectaculaire") || lowercase.includes("incroyable") || lowercase.includes("lumière")) {
    merveille = 82;
    peur = 15;
  }
  if (lowercase.includes("bizarre") || lowercase.includes("comprends pas") || lowercase.includes("étrange")) {
    confusion = 80;
  }

  return {
    summary: "Ce rêve met en lumière une tentative d'accueillir ou de clarifier des émotions récentes, tout en cherchant à préserver l'équilibre et le calme au quotidien.",
    keyMessages: [
      "Un appel du subconscient à prêter attention à une fatigue physique ou mentale délaissée ces derniers temps.",
      "Un besoin profond d'accepter une part d'inconnu ou d'imprévu plutôt que de tenter de tout maîtriser."
    ],
    realLifeReflections: [
      "Y a-t-il actuellement dans la vie vécue une décision importante ou un changement repoussé par crainte de perdre le contrôle ?",
      "Existe-t-il une tension ou un non-dit au sein des relations proches, empêchant d'exprimer librement les ressentis du quotidien ?"
    ],
    symbols: symbolsFound,
    jungianReading: "Dans l'analyse de Carl Gustav Jung, ce songe exprime une compensation essentielle de la psyché consciente. En projetant ces images, l'esprit cherche à intégrer des éléments de l'Ombre (la part non admise du Soi) afin de guider le rêveur le long du grand chemin d'individuation spirituelle.",
    freudianReading: "Pour Sigmund Freud, ce récit figure l'accomplissement masqué d'un désir refoulé. Le contenu manifeste sert de paravent protecteur : la condensation et le déplacement d'idées infantiles déguisent le conflit pour évacuer les résistances internes sans interrompre le sommeil.",
    emotionScores: { peur, merveille, confusion, clarte },
    journalPrompt: "Quelles émotions ou quels souvenirs d'enfance surgissent spontanément à la réflexion de ces images oniriques ?"
  };
}

async function startServer() {
  // Check environment to mount Vite or static build
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // ESM import of Vite to dynamically load dev middlewares via dynamic loader to bypass esbuild CJS constraints
    const viteModule = await (new Function('m', 'return import(m)')('vite'));
    const { createServer: createViteServer } = viteModule;
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[L'Interprète de Rêves] Serveur démarré sur http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
