"use strict";

const MAX_SCORE = 7.5;
const HISTORY_KEY = "bepc2010_historique_v1";
const MAX_HISTORY = 30;

const EXAMPLE_ITEM9 =
  "Il est juste que le pêcheur et son épouse redeviennent aussi pauvres " +
  "qu'auparavant parce qu'ils sont d'abord trop prétentieux. Ensuite, ils " +
  "n'ont pas respecté la condition imposée par la carpe. Alors, la carpe a " +
  "vraiment raison de les punir.";

const EXAMPLE_LETTER =
  "Antananarivo, le 12 mars 2010\n\n" +
  "Cher oncle,\n\n" +
  "J'ai bien reçu ta lettre et je te remercie de t'intéresser à mon avenir. " +
  "Tu me demandes quel métier je choisirai après mes études ; je t'écris " +
  "donc pour te donner ma réponse.\n\n" +
  "Plus tard, je voudrais devenir infirmier. D'abord, ce métier me permet " +
  "d'aider les malades et de sauver des vies. À Madagascar, beaucoup de " +
  "villages manquent de personnel de santé, et je veux être utile à mon " +
  "pays. Ensuite, j'admire l'infirmière de notre quartier, qui soigne tout " +
  "le monde avec patience et gentillesse. Son exemple m'a donné envie de " +
  "suivre la même voie. Ce métier m'offrira aussi un salaire pour aider ma " +
  "famille. Enfin, je suis courageux, sérieux et j'aime les sciences " +
  "naturelles, ce qui m'aidera pendant mes études.\n\n" +
  "Je sais que ce métier demande beaucoup d'efforts, mais je suis prêt à " +
  "travailler dur pour réussir. Je compte donc sur tes conseils et sur ton " +
  "soutien.\n\n" +
  "Je t'embrasse bien fort et j'attends de tes nouvelles avec impatience.\n\n" +
  "Ton neveu,\nHery";

const $ = (id) => document.getElementById(id);

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/[.,;:!?()[\]"«»…\/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value) {
  return normalize(value).replace(/['\s]/g, "");
}

function acceptsAny(raw, accepted) {
  return String(raw || "")
    .split(/[,;\/]|\bou\b/i)
    .map(compact)
    .some((token) => token && accepted.includes(token));
}

function fmt(number) {
  return number.toLocaleString("fr-FR");
}

function getValue(id) {
  const element = $(id);
  return element ? element.value.trim() : "";
}

function getRadioValue(name) {
  const selected = document.querySelector(
    'input[name="' + name + '"]:checked'
  );

  return selected ? selected.value : "";
}

function getHistory() {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    const parsed = stored ? JSON.parse(stored) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    alert("Impossible d'enregistrer l'historique dans ce navigateur.");
  }
}

function addCorrection(
  container,
  title,
  userAnswer,
  expectedAnswer,
  correct,
  explanation
) {
  const block = document.createElement("div");

  block.className =
    "correction-item " + (correct ? "correct" : "incorrect");

  const heading = document.createElement("h4");
  heading.textContent = title;

  const user = document.createElement("p");
  user.textContent = "Ta réponse : " + (userAnswer || "(sans réponse)");

  const expected = document.createElement("p");
  expected.textContent = "Réponse attendue : " + expectedAnswer;
  expected.className = correct ? "correct-answer" : "wrong-answer";

  const details = document.createElement("p");
  details.textContent = explanation;

  block.append(heading, user, expected, details);
  container.appendChild(block);
}

function addOpenFeedback(
  container,
  title,
  userAnswer,
  modelAnswer,
  explanation
) {
  const block = document.createElement("div");
  block.className = "correction-item";

  const heading = document.createElement("h4");
  heading.textContent = title;

  const answer = document.createElement("p");
  answer.textContent = "Ta réponse : " + (userAnswer || "(sans réponse)");

  const model = document.createElement("p");
  model.textContent = "Exemple de réponse : " + modelAnswer;

  const details = document.createElement("p");
  details.textContent = explanation;

  block.append(heading, answer, model, details);
  container.appendChild(block);
}

function createGrader(container) {
  let total = 0;

  return {
    check(title, points, userAnswer, expected, correct, explanation) {
      if (correct) total += points;

      addCorrection(
        container,
        title + " — " + fmt(points) + " pt",
        userAnswer,
        expected,
        correct,
        explanation
      );
    },
    getTotal() {
      return total;
    }
  };
}

function getPerformanceComment(score, previousScore) {
  if (previousScore === null) {
    if (score >= 6) {
      return "Très bon début ! Continue à t'entraîner.";
    }

    if (score >= 4) {
      return "Bon début. Relis les corrections pour progresser.";
    }

    return "Continue tes efforts. Relis les explications et réessaie.";
  }

  if (score > previousScore) {
    return "Progression : ton résultat est meilleur que lors de la tentative précédente.";
  }

  if (score < previousScore) {
    return "Régression : ton résultat a diminué. Révise les questions difficiles.";
  }

  return "Résultat stable. Continue à travailler les points difficiles.";
}

function renderHistory() {
  const container = $("history");
  if (!container) return;

  container.replaceChildren();

  const history = getHistory();

  if (history.length === 0) {
    container.textContent = "Aucune tentative enregistrée.";
    return;
  }

  history.forEach((attempt, index) => {
    const row = document.createElement("div");
    row.className = "history-item";

    const title = document.createElement("strong");
    title.textContent =
      "Essai " + (index + 1) + " : " +
      fmt(Number(attempt.score)) + "/" + fmt(MAX_SCORE);

    const date = document.createElement("p");
    date.textContent = attempt.date;

    const comment = document.createElement("p");
    comment.textContent = attempt.comment;

    row.append(title, date, comment);
    container.appendChild(row);
  });
}

function updateWordCount() {
  const text = getValue("writing");
  const words = text.match(/\S+/g) || [];
  const count = words.length;

  const counter = $("wordCount");
  counter.textContent = "Nombre de mots : " + count;

  counter.classList.remove("invalid", "valid");

  if (count >= 150 && count <= 200) {
    counter.classList.add("valid");
  } else {
    counter.classList.add("invalid");
  }
}

function fillSelects() {
  document.querySelectorAll("select[data-options]").forEach((select) => {
    const first = document.createElement("option");
    first.value = "";
    first.textContent = select.dataset.placeholder || "Choisir…";
    select.appendChild(first);

    select.dataset.options.split("|").forEach((label) => {
      const option = document.createElement("option");
      option.value = label;
      option.textContent = label;
      select.appendChild(option);
    });
  });
}

function formIsEmpty() {
  const fields = document.querySelectorAll(
    "#exerciseForm input[type='text'], #exerciseForm textarea, #exerciseForm select"
  );

  const hasText = Array.from(fields).some(
    (field) => field.value.trim() !== ""
  );

  const hasRadio = document.querySelector(
    '#exerciseForm input[type="radio"]:checked'
  );

  return !hasText && !hasRadio;
}

function gradeExercise() {
  if (formIsEmpty()) {
    alert("Réponds d'abord à quelques questions avant de corriger.");
    return;
  }

  const corrections = $("corrections");
  corrections.replaceChildren();

  const grader = createGrader(corrections);

  /* ITEM 1 — 0,5 pt */
  const q1 = getRadioValue("q1");

  grader.check(
    "Item 1",
    0.5,
    q1,
    "raconte",
    q1 === "raconte",
    "Le texte raconte une histoire avec des personnages et des événements qui se suivent : l'auteur raconte."
  );

  /* ITEM 2 — 1 pt (0,25 par fait bien placé) */
  const item2 = [
    { id: "q2a", fact: "La carpe était en colère.", expected: "4" },
    { id: "q2b", fact: "La carpe aida le pêcheur et sa femme à transformer leur vie.", expected: "1" },
    { id: "q2c", fact: "L'homme transmit le souhait de son épouse au poisson.", expected: "2" },
    { id: "q2d", fact: "La femme du pêcheur n'est jamais satisfaite.", expected: "3" }
  ];

  item2.forEach((entry) => {
    const user = getValue(entry.id);

    grader.check(
      "Item 2 · " + entry.fact,
      0.25,
      user ? "place " + user : "",
      "place " + entry.expected,
      user === entry.expected,
      "Ordre correct dans le texte : 2) la carpe aide, 3) le souhait est transmis, 4) la femme n'est jamais satisfaite, 1) la carpe est en colère."
    );
  });

  /* ITEM 3 — 0,5 pt */
  const q3 = getValue("q3");
  const q3c = compact(q3);
  const q3Correct = q3c.includes("souhait") && !q3c.includes("desir");

  grader.check(
    "Item 3",
    0.5,
    q3,
    "L'homme retourna au lac et présenta le souhait de son épouse.",
    q3Correct,
    "Le synonyme de « désir » présent dans le texte est « souhait » (« souhaita alors une maison »)."
  );

  /* ITEM 4 — 1 pt (0,25 par case) */
  const item4 = [
    { id: "q4a", accepted: ["patience"], expected: "Patience", label: "Nom de « patienter »" },
    { id: "q4b", accepted: ["patient", "patiente"], expected: "Patient(e)", label: "Adjectif de « patienter »" },
    { id: "q4c", accepted: ["richesse"], expected: "Richesse", label: "Nom de « riche »" },
    { id: "q4d", accepted: ["senrichir", "enrichir"], expected: "S'enrichir", label: "Verbe de « riche »" }
  ];

  item4.forEach((entry) => {
    grader.check(
      "Item 4 · " + entry.label,
      0.25,
      getValue(entry.id),
      entry.expected,
      acceptsAny(getValue(entry.id), entry.accepted),
      "Pense à la famille de mots : richesse, riche, s'enrichir ; patience, patient, patienter."
    );
  });

  /* ITEM 5 — 1,5 pt (0,5 par personnage) */
  const item5 = [
    { id: "q5a", who: "La carpe", expected: "La générosité" },
    { id: "q5b", who: "La femme", expected: "L'insatisfaction" },
    { id: "q5c", who: "Le pêcheur", expected: "La naïveté" }
  ];

  const item5Explanations = {
    "La carpe": "La carpe est généreuse : elle accepte de réaliser tous les souhaits.",
    "La femme": "La femme n'est jamais satisfaite : elle veut toujours davantage.",
    "Le pêcheur": "Le pêcheur est naïf : il obéit à sa femme sans réfléchir aux conséquences."
  };

  item5.forEach((entry) => {
    const user = getValue(entry.id);

    grader.check(
      "Item 5 · " + entry.who,
      0.5,
      user,
      entry.expected,
      normalize(user) === normalize(entry.expected),
      item5Explanations[entry.who]
    );
  });

  /* ITEM 6 — 1 pt (0,25 par réponse) */
  grader.check(
    "Item 6 · Infinitif",
    0.25,
    getValue("q6a"),
    "demander",
    acceptsAny(getValue("q6a"), ["demander"]),
    "« demanda » vient du verbe « demander »."
  );

  grader.check(
    "Item 6 · Groupe",
    0.25,
    getValue("q6b"),
    "1er groupe",
    getValue("q6b") === "1er groupe",
    "Les verbes en -er (sauf « aller ») appartiennent au 1er groupe."
  );

  grader.check(
    "Item 6 · Temps",
    0.25,
    getValue("q6c"),
    "Passé simple",
    getValue("q6c") === "Passé simple",
    "La terminaison -a à la 3e personne du singulier est celle du passé simple des verbes en -er."
  );

  grader.check(
    "Item 6 · Mode",
    0.25,
    getValue("q6d"),
    "Indicatif",
    getValue("q6d") === "Indicatif",
    "Le passé simple est un temps du mode indicatif."
  );

  /* ITEM 7 — 1 pt (0,5 + 0,5) */
  const q7a = getValue("q7a");
  const q7aCorrect = compact(q7a).includes("quantalacarpeelledisparut");

  grader.check(
    "Item 7a",
    0.5,
    q7a,
    "Quant à la carpe, elle disparut pour toujours.",
    q7aCorrect,
    "La phrase emphatique met en valeur « la carpe » en la reprenant par le pronom « elle »."
  );

  const q7b = getValue("q7b");
  const n7b = normalize(q7b);

  const q7bCorrect =
    n7b.includes("c'est la carpe qui disparut pour toujours") ||
    n7b.includes("la carpe c'est elle qui disparut pour toujours") ||
    (n7b.includes("la carpe elle disparut pour toujours") &&
      !n7b.includes("quant"));

  grader.check(
    "Item 7b",
    0.5,
    q7b,
    "C'est la carpe qui disparut pour toujours. / La carpe, c'est elle qui disparut pour toujours. / La carpe, elle disparut pour toujours.",
    q7bCorrect,
    "On peut exprimer l'emphase avec « c'est… qui » ou en reprenant le sujet par un pronom. Une autre formulation correcte peut nécessiter une vérification manuelle."
  );

  /* ITEM 8 — 1 pt */
  const q8 = getValue("q8");
  const q8c = compact(q8);

  const q8Correct =
    q8c.startsWith("lacarpelui") && q8c.includes("denepaslacapturer");

  grader.check(
    "Item 8",
    1,
    q8,
    "La carpe lui proposa de ne pas la capturer.",
    q8Correct,
    "Au discours indirect, les guillemets disparaissent, l'impératif devient « de + infinitif » et « me » devient « la »."
  );

  /* ITEM 9 — 2,5 pts : réponse personnelle, pas de note automatique */
  const q9 = getValue("q9");

  addOpenFeedback(
    corrections,
    "Item 9 — 2,5 pts : réponse personnelle",
    q9,
    EXAMPLE_ITEM9,
    "Il n'y a pas une seule bonne réponse : tu peux trouver la punition juste ou injuste. Donne clairement ton avis, puis justifie-le avec au moins deux arguments (par exemple : la prétention de la femme, le non-respect de la condition de la carpe) en trois ou quatre phrases. Utilise des mots de liaison : d'abord, ensuite, alors."
  );

  $("feedback9").textContent = q9
    ? "Réponse enregistrée. Compare-la avec l'exemple : as-tu donné ton avis et au moins deux arguments en trois ou quatre phrases ?"
    : "Tu n'as pas répondu. Donne ton avis sur la punition et justifie-le en trois ou quatre phrases.";

  /* EXPRESSION ÉCRITE — 10 pts : pas de note automatique */
  const writing = getValue("writing");
  const count = (writing.match(/\S+/g) || []).length;

  $("writingFeedback").textContent = writing
    ? "Rédaction enregistrée (" + count + " mots). Vérifie que ta lettre respecte 150 à 200 mots et qu'elle justifie ton choix de métier."
    : "Tu n'as pas encore rédigé ta lettre. Écris à ton oncle pour lui dire quel métier tu choisis et pourquoi.";

  addOpenFeedback(
    corrections,
    "Expression écrite — 10 pts : réponse personnelle",
    writing,
    EXAMPLE_LETTER,
    "Structure d'une lettre : lieu et date, formule d'appel (« Cher oncle, »), introduction (remercier et annoncer ta réponse), développement (ton choix de métier et deux ou trois raisons avec des exemples), conclusion, formule de politesse et signature. Respecte 150 à 200 mots."
  );

  const score = Math.round(grader.getTotal() * 100) / 100;

  /* HISTORIQUE ET PROGRESSION */
  const history = getHistory();

  const previousScore =
    history.length > 0
      ? Number(history[history.length - 1].score)
      : null;

  const comment = getPerformanceComment(score, previousScore);

  $("score").textContent = fmt(score) + "/" + fmt(MAX_SCORE);

  $("scoreMessage").textContent =
    comment +
    " L'item 9 (2,5 pts) et l'expression écrite (10 pts) nécessitent une évaluation séparée.";

  $("progressBar").style.width =
    Math.max(0, Math.min(100, (score / MAX_SCORE) * 100)) + "%";

  history.push({
    score: score,
    date: new Date().toLocaleString("fr-FR"),
    comment: comment
  });

  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }

  saveHistory(history);
  renderHistory();

  $("resultSection").hidden = false;

  $("resultSection").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function startExercise() {
  const firstQuestion = document.querySelector('input[name="q1"]');

  if (firstQuestion) {
    firstQuestion.scrollIntoView({ behavior: "smooth", block: "center" });
    firstQuestion.focus();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fillSelects();

  $("startButton").addEventListener("click", startExercise);
  $("correctButton").addEventListener("click", gradeExercise);
  $("writing").addEventListener("input", updateWordCount);

  updateWordCount();
  renderHistory();
});