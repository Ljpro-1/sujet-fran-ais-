"use strict";

const MAX_SCORE = 7;
const HISTORY_KEY = "sujet4_historique_v1";
const MAX_HISTORY = 30;

const EXAMPLE_ITEM5 =
  "Plus on détruit les forêts, plus les animaux perdent leur habitat.";

const EXAMPLE_ITEM9 =
  "Oui, il est possible de protéger les espèces. Il faut créer des " +
  "réserves naturelles, limiter la chasse et lutter contre la " +
  "déforestation. Il faut aussi sensibiliser la population à la " +
  "protection de la nature.";

const CAUSES = [
  {
    name: "la déforestation (forêt coupée)",
    terms: ["deforestation", "deboisement", "foret coupee", "forets coupees", "coupe des forets", "couper la foret", "couper les forets"]
  },
  {
    name: "l'assèchement des marais",
    terms: ["assechement", "marais asseche", "marais asseches", "assecher"]
  },
  {
    name: "la transformation des prairies en pâturages",
    terms: ["paturage", "transformation des prairies", "prairies transformees"]
  },
  {
    name: "l'extension des villes",
    terms: ["extension des villes", "villes s'etendent", "etendent", "urbanisation"]
  },
  {
    name: "les routes et les barrages (infrastructures)",
    terms: ["route", "barrage", "infrastructure"]
  },
  {
    name: "la chasse excessive",
    terms: ["chasse", "chasseur"]
  },
  {
    name: "la destruction ou l'abîme des habitats",
    terms: ["habitat detruit", "destruction de l'habitat", "destruction des habitats", "habitats detruits"]
  }
];

const $ = (id) => document.getElementById(id);

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘`´]/g, "'")
    .replace(/[.,;:!?()[\]"“”«»…\/-]/g, " ")
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
    partial(title, earned, max, userAnswer, expected, explanation) {
      total += earned;

      addCorrection(
        container,
        title + " — " + fmt(earned) + "/" + fmt(max) + " pt",
        userAnswer,
        expected,
        earned === max,
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
    if (score >= 5.5) {
      return "Très bon début ! Continue à t'entraîner.";
    }

    if (score >= 3.5) {
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
      fmt(Number(attempt.score) || 0) + "/" + fmt(MAX_SCORE);

    const date = document.createElement("p");
    date.textContent = attempt.date || "";

    const comment = document.createElement("p");
    comment.textContent = attempt.comment || "";

    row.append(title, date, comment);
    container.appendChild(row);
  });
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

  const q1Labels = {
    distrait: "distrait ses lecteurs d'une histoire de la nature",
    proteger: "incite les lecteurs à protéger les lémuriens",
    origines: "informe ses lecteurs des origines de la disparition des espèces",
    decrit: "décrit la vie des espèces en voie de disparition"
  };

  grader.check(
    "Item 1",
    0.5,
    q1Labels[q1] || "",
    q1Labels.origines,
    q1 === "origines",
    "Le texte présente plusieurs causes de la raréfaction ou de la disparition des espèces : l'auteur informe sur leurs origines."
  );

  /* ITEM 2 — 0,5 pt (0,125 par affirmation) */
  const item2 = [
    { id: "q2a", expected: "F", label: "a", explanation: "Le texte parle des activités humaines, pas de causes naturelles." },
    { id: "q2b", expected: "V", label: "b", explanation: "Le territoire des animaux est découpé par des routes et le cours des fleuves est interrompu par les barrages." },
    { id: "q2c", expected: "V", label: "c", explanation: "Toutes les espèces de lémuriens sont menacées à Madagascar." },
    { id: "q2d", expected: "F", label: "d", explanation: "Les causes sont multiples : arrêter la chasse ne suffit pas à protéger les animaux de la destruction de leur habitat." }
  ];

  item2.forEach((entry) => {
    const user = normalize(getValue(entry.id));
    const full = entry.expected === "V" ? "vrai" : "faux";
    const correct = user === entry.expected.toLowerCase() || user === full;

    grader.check(
      "Item 2" + entry.label,
      0.125,
      getValue(entry.id),
      entry.expected,
      correct,
      entry.explanation
    );
  });

  /* ITEM 3 — 1 pt (0,5 + 0,5) */
  const q3a = getValue("q3a");
  const n3a = " " + normalize(q3a) + " ";

  const good3a =
    n3a.includes("especes") &&
    /rares|rarefi/.test(n3a) &&
    !n3a.includes(" pas ");

  grader.check(
    "Item 3a",
    0.5,
    q3a,
    "Les espèces sont rares. / Les espèces se raréfient.",
    good3a,
    "Pour passer de la phrase nominale à la phrase verbale, on utilise un verbe conjugué : « la raréfaction » devient « se raréfient » ou « sont rares »."
  );

  const q3b = getValue("q3b");
  const n3b = normalize(q3b);

  const good3b =
    n3b.includes("habitat") &&
    /destruction|deterioration|degradation/.test(n3b);

  grader.check(
    "Item 3b",
    0.5,
    q3b,
    "La destruction de l'habitat. / La détérioration de l'habitat.",
    good3b,
    "Pour passer de la phrase verbale à la phrase nominale, on remplace le verbe par un nom : « est détruit » devient « la destruction de l'habitat »."
  );

  /* ITEM 4 — 1 pt */
  const q4 = getValue("q4");

  grader.check(
    "Item 4",
    1,
    q4,
    "rare / endémique",
    acceptsAny(q4, ["rare", "endemique"]),
    "Une espèce présente seulement sur un petit territoire est dite « rare » ou « endémique »."
  );

  /* ITEM 5 — 1 pt : réponse personnelle, pas de note automatique */
  const q5 = getValue("q5");

  addOpenFeedback(
    corrections,
    "Item 5 — 1 pt : réponse personnelle",
    q5,
    EXAMPLE_ITEM5,
    "La structure « plus…, plus… » relie deux évolutions qui augmentent ensemble. Ta phrase doit être logique et grammaticalement correcte, avec deux fois « plus »."
  );

  const plusCount = (normalize(q5).match(/\bplus\b/g) || []).length;

  $("feedback5").textContent = !q5
    ? "Tu n'as pas répondu. Écris une phrase avec la structure « Plus…, plus… »."
    : plusCount >= 2
      ? "Réponse enregistrée. La structure « plus…, plus… » est présente : vérifie que les deux faits sont bien liés."
      : "Réponse enregistrée. Attention : la structure demandée contient deux fois « plus » (Plus…, plus…).";

  /* ITEM 6 — 1 pt */
  const q6 = getValue("q6");
  const q6c = compact(q6);

  const q6Correct =
    q6c === "lachasseexcessivelaprovoquee" ||
    q6c === "lachasseexcessivelaprovoque";

  grader.check(
    "Item 6",
    1,
    q6,
    "La chasse excessive l'a provoquée.",
    q6Correct,
    "« la raréfaction de nombreuses espèces » est un COD : on le remplace par « la » (l'), placé avant le verbe. Le participe passé s'accorde avec ce COD féminin : provoquée."
  );

  /* ITEM 7 — 1,5 pt */
  const q7 = getValue("q7");
  const q7c = compact(q7);

  const q7Correct =
    q7c.includes("silleschasseursnavaientpasmassacre") &&
    (q7c.includes("cesoiseauxauraientencoreexiste") ||
      q7c.includes("cesoiseauxauraientexisteencore"));

  grader.check(
    "Item 7",
    1.5,
    q7,
    "Si les chasseurs n'avaient pas massacré les pigeons migrateurs, ces oiseaux auraient encore existé.",
    q7Correct,
    "Après « si » + plus-que-parfait, on emploie le conditionnel passé dans la principale : « n'avaient pas massacré » → « auraient existé »."
  );

  /* ITEM 8 — 1,5 pt (0,5 par cause, 3 maximum) */
  const q8 = getValue("q8");
  const n8 = normalize(q8);

  const found = CAUSES.filter((cause) =>
    cause.terms.some((term) => n8.includes(normalize(term)))
  );

  const earned8 = Math.min(found.length, 3) * 0.5;

  grader.partial(
    "Item 8",
    earned8,
    1.5,
    q8,
    "trois parmi : la déforestation ; l'assèchement des marais ; la transformation des prairies en pâturages ; l'extension des villes ; les routes et les barrages ; la chasse excessive.",
    Math.min(found.length, 3) + "/3 cause(s) distincte(s) reconnue(s). Ces interventions de l'homme sont relevées dans les paragraphes 3, 5 et 6 du texte."
  );

  /* ITEM 9 — 2 pts : réponse personnelle, pas de note automatique */
  const q9 = getValue("q9");

  addOpenFeedback(
    corrections,
    "Item 9 — 2 pts : réponse personnelle",
    q9,
    EXAMPLE_ITEM9,
    "Il n'y a pas une seule bonne réponse. Réponds clairement par oui ou par non, puis justifie en trois à cinq lignes avec des mesures concrètes (réserves naturelles, limitation de la chasse, lutte contre la déforestation, sensibilisation). Une autre opinion convient si elle est bien justifiée."
  );

  $("feedback9").textContent = q9
    ? "Réponse enregistrée. Compare-la avec l'exemple : as-tu répondu clairement et justifié ton opinion en trois à cinq lignes ?"
    : "Tu n'as pas répondu. Dis s'il est possible de protéger les espèces et justifie ta réponse en trois à cinq lignes.";

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
    " Les items 5 (1 pt) et 9 (2 pts) nécessitent une évaluation séparée.";

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

  renderHistory();
});