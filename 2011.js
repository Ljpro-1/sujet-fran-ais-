"use strict";

const MAX_SCORE = 7.5;
const HISTORY_KEY = "bepc2011_historique_v1";
const MAX_HISTORY = 30;

const EXAMPLE_ITEM9 =
  "À mon avis, lorsque l'enfant va à l'école, il sait d'abord lire et " +
  "écrire et grâce à cela, il aura un avenir sûr. En plus, un enfant " +
  "scolarisé aura plus de chance de devenir responsable dans la société " +
  "où il vit.";

const EXAMPLE_ARTICLE =
  "La nécessité de l'éducation des filles\n\n" +
  "À la campagne, de nombreux parents gardent leurs filles à la maison au " +
  "lieu de les envoyer à l'école. Or, scolariser une fille est un devoir " +
  "et un investissement pour toute la famille.\n\n" +
  "D'abord, une fille qui va à l'école apprend à lire, à écrire et à " +
  "compter. Elle peut ainsi mieux connaître ses droits et se protéger des " +
  "dangers. Ensuite, l'éducation lui ouvre les portes d'un métier. Une " +
  "fille instruite peut devenir institutrice, infirmière ou commerçante et " +
  "gagner sa vie, ce qui aide aussi ses parents. Enfin, une mère instruite " +
  "soigne mieux ses enfants et veille sur leur scolarité : l'éducation " +
  "d'une fille profite donc à toute la société.\n\n" +
  "Certains parents pensent que les filles sont faites pour les tâches " +
  "ménagères et le mariage. Cette idée est dépassée, car filles et " +
  "garçons ont les mêmes droits, notamment le droit à l'éducation.\n\n" +
  "Chers parents, ne privez plus vos filles d'avenir. Inscrivez-les à " +
  "l'école dès aujourd'hui et encouragez-les à poursuivre leurs études. " +
  "Une fille éduquée, c'est un village qui progresse !";

const RIGHTS = [
  { name: "droit de vivre dans une famille", pattern: /famille/ },
  { name: "droit aux loisirs", pattern: /loisir|jouer|amis|divertissement/ },
  { name: "droit à l'identité", pattern: /identite|copie de naissance|acte de naissance/ },
  { name: "droit à l'éducation", pattern: /education|scolarisation|ecole|instruction/ },
  { name: "droit à l'information et à la culture", pattern: /information|culture/ },
  { name: "droit d'être entendu et de donner son avis", pattern: /entendu|avis|expression|exprimer|parole/ },
  { name: "droit à la santé", pattern: /sante|soin|medic|maladie/ },
  { name: "droit à l'appui nutritionnel", pattern: /nutri|aliment|nourri/ },
  { name: "droit à la survie", pattern: /survie/ },
  { name: "droit à la protection contre l'abandon et la négligence", pattern: /protection|abandon|negligence/ }
];

const PHRASE_KEYS = [
  ["prouverlestatutdecitoyen", "elementnecessaire", "profiterdesdroitsquiendecoulent"],
  ["permetdaccederaleducation", "lobtentiondecettecopie", "accederaleducation"]
];

const PHRASE_EXPECTED = [
  "« C'est un élément nécessaire pour prouver le statut de citoyen et pour profiter des droits qui en découlent. »",
  "« L'obtention de cette copie leur permet d'accéder à l'éducation. »"
];

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

function formIsEmpty() {
  const fields = document.querySelectorAll(
    "#exerciseForm input[type='text'], #exerciseForm textarea"
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
    q1 === "defend" ? "défend une idée" : q1,
    "informe",
    q1 === "informe",
    "L'auteur présente des informations sur les droits de l'enfant sans raconter ni décrire : il informe."
  );

  /* ITEM 2 — 1 pt (0,25 par droit valide et différent) */
  const foundRights = [];

  ["q2a", "q2b", "q2c", "q2d"].forEach((id, index) => {
    const raw = getValue(id);
    const right = RIGHTS.find((r) => r.pattern.test(normalize(raw)));
    const valid = Boolean(right) && !foundRights.includes(right.name);

    if (valid) foundRights.push(right.name);

    grader.check(
      "Item 2 · droit n°" + (index + 1),
      0.25,
      raw,
      valid
        ? right.name
        : "un droit du texte, différent des autres (identité, éducation, information et culture, expression, survie, santé, appui nutritionnel, famille, loisirs)",
      valid,
      valid
        ? "Droit reconnu : " + right.name + "."
        : "Cite un droit qui figure dans le texte et qui n'a pas déjà été donné."
    );
  });

  /* ITEM 3 — 1 pt (0,5 par phrase) */
  const matchedPhrases = [];

  ["q3a", "q3b"].forEach((id, index) => {
    const raw = getValue(id);
    const c = compact(raw);

    const keyIndex = PHRASE_KEYS.findIndex((keys) =>
      keys.some((key) => c.includes(key))
    );

    const valid = keyIndex !== -1 && !matchedPhrases.includes(keyIndex);

    if (valid) matchedPhrases.push(keyIndex);

    grader.check(
      "Item 3 · phrase n°" + (index + 1),
      0.5,
      raw,
      valid ? PHRASE_EXPECTED[keyIndex] : PHRASE_EXPECTED.join(" ou "),
      valid,
      "Les deux phrases du premier paragraphe montrent les avantages de la copie de naissance : prouver sa citoyenneté et accéder à l'éducation."
    );
  });

  /* ITEM 4 — 1 pt (0,25 par affirmation) */
  const item4 = [
    { id: "q4a", expected: "V", label: "a", explanation: "Le texte dit que la copie de naissance permet de profiter des droits de citoyen." },
    { id: "q4b", expected: "F", label: "b", explanation: "Le texte dit que l'enfant a droit d'être entendu et de donner son avis." },
    { id: "q4c", expected: "V", label: "c", explanation: "Le texte parle du droit à la santé." },
    { id: "q4d", expected: "F", label: "d", explanation: "Le texte déplore que des enfants errent dans les rues : ce n'est pas un droit." }
  ];

  item4.forEach((entry) => {
    const user = normalize(getValue(entry.id));
    const full = entry.expected === "V" ? "vrai" : "faux";
    const correct = user === entry.expected.toLowerCase() || user === full;

    grader.check(
      "Item 4" + entry.label,
      0.25,
      getValue(entry.id),
      entry.expected,
      correct,
      entry.explanation
    );
  });

  /* ITEM 5 — 1 pt */
  const q5 = getValue("q5");
  const q5c = compact(q5);
  const q5words = normalize(q5).split(" ");

  const synonyms = [
    "ont", "possedent", "profitent", "beneficient", "disposent", "detiennent"
  ];

  const q5Correct =
    q5c.startsWith("lesenfants") &&
    q5c.includes("memesdroitsqueles") &&
    !q5c.includes("jouissent") &&
    synonyms.some((word) => q5words.includes(word));

  grader.check(
    "Item 5",
    1,
    q5,
    "Les enfants ont / possèdent / profitent / bénéficient des mêmes droits que les adultes.",
    q5Correct,
    "« Jouir de » signifie « avoir, profiter de ». Attention à la construction : « bénéficient de », « profitent de » se construisent avec « de » ou « des »."
  );

  /* ITEM 6 — 1 pt (0,25 par case) */
  const item6 = [
    { id: "q6a", accepted: ["negliger", "senegliger"], expected: "négliger", label: "Verbe de « négligence »" },
    { id: "q6b", accepted: ["neglige", "negligee", "negligent", "negligente", "negligeable"], expected: "négligé(e), négligent, négligeable", label: "Adjectif de « négligence »" },
    { id: "q6c", accepted: ["nourrir", "senourrir"], expected: "nourrir, se nourrir", label: "Verbe de « nutritionnel »" },
    { id: "q6d", accepted: ["nutrition", "nourrice", "nourrissage", "nourriture", "nutriment", "nutritionniste"], expected: "nutrition, nourriture, nutriment, nourrissage, nourrice, nutritionniste", label: "Nom de « nutritionnel »" }
  ];

  item6.forEach((entry) => {
    grader.check(
      "Item 6 · " + entry.label,
      0.25,
      getValue(entry.id),
      entry.expected,
      acceptsAny(getValue(entry.id), entry.accepted),
      "Cherche des mots de la même famille que celui donné dans le tableau."
    );
  });

  /* ITEM 7 — 1 pt */
  const q7 = getValue("q7");

  grader.check(
    "Item 7",
    1,
    q7,
    "Il est livré à lui-même.",
    compact(q7) === "ilestlivrealuimeme",
    "Quand le sujet passe au singulier, le verbe, le participe passé et le pronom changent : ils sont livrés → il est livré ; à eux-mêmes → à lui-même."
  );

  /* ITEM 8 — 1 pt */
  const q8 = getValue("q8");

  grader.check(
    "Item 8",
    1,
    q8,
    "Les adultes les ont oubliés.",
    compact(q8) === "lesadulteslesontoublies",
    "« les droits des enfants » est un COD : on le remplace par « les », placé avant le verbe. Le participe passé s'accorde avec ce COD placé avant : oubliés."
  );

  /* ITEM 9 — 2,5 pts : réponse personnelle, pas de note automatique */
  const q9 = getValue("q9");

  addOpenFeedback(
    corrections,
    "Item 9 — 2,5 pts : réponse personnelle",
    q9,
    EXAMPLE_ITEM9,
    "Il n'y a pas une seule bonne réponse. Donne deux ou trois avantages de la scolarisation (savoir lire et écrire, avoir un avenir sûr, devenir responsable, trouver un métier…), une idée par phrase, avec des mots de liaison : d'abord, en plus, enfin."
  );

  $("feedback9").textContent = q9
    ? "Réponse enregistrée. Compare-la avec l'exemple : as-tu donné deux ou trois avantages en deux ou trois phrases ?"
    : "Tu n'as pas répondu. Donne les avantages de la scolarisation en deux ou trois phrases.";

  /* EXPRESSION ÉCRITE — 10 pts : pas de note automatique */
  const writing = getValue("writing");
  const count = (writing.match(/\S+/g) || []).length;

  $("writingFeedback").textContent = writing
    ? "Rédaction enregistrée (" + count + " mots). Vérifie que ton article a un titre, qu'il respecte 150 à 200 mots et qu'il convainc les parents avec des arguments."
    : "Tu n'as pas encore rédigé ton article. Écris un article de journal pour convaincre les parents de scolariser les filles.";

  addOpenFeedback(
    corrections,
    "Expression écrite — 10 pts : réponse personnelle",
    writing,
    EXAMPLE_ARTICLE,
    "Savoir-faire demandé : argumenter. Forme : article de journal. Prévois un titre (par exemple « La nécessité de l'éducation des filles »), une introduction qui présente le problème, un développement avec deux ou trois arguments illustrés d'exemples, puis une conclusion qui lance un appel aux parents. Respecte 150 à 200 mots."
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
  $("startButton").addEventListener("click", startExercise);
  $("correctButton").addEventListener("click", gradeExercise);
  $("writing").addEventListener("input", updateWordCount);

  updateWordCount();
  renderHistory();
});