"use strict";

const MAX_SCORE = 7.5;
const HISTORY_KEY = "bepc2007_historique_v1";

const $ = (id) => document.getElementById(id);

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/[.,;:!?()[\]"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
    alert(
      "Impossible d'enregistrer l'historique dans ce navigateur."
    );
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
  user.textContent =
    "Ta réponse : " + (userAnswer || "(sans réponse)");

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
  answer.textContent =
    "Ta réponse : " + (userAnswer || "(sans réponse)");

  const model = document.createElement("p");
  model.textContent = "Exemple de réponse : " + modelAnswer;

  const details = document.createElement("p");
  details.textContent = explanation;

  block.append(heading, answer, model, details);
  container.appendChild(block);
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
      attempt.score + "/" + MAX_SCORE;

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

  if (count >= 150 && count <= 250) {
    counter.classList.add("valid");
  } else {
    counter.classList.add("invalid");
  }
}

function gradeExercise() {
  const corrections = $("corrections");
  corrections.replaceChildren();

  let score = 0;

  /*
    ITEM 1 — 0,5 point
    Réponse du corrigé : argumente.
  */

  const q1 = getRadioValue("q1");
  const q1Correct = q1 === "argumente";

  if (q1Correct) score += 0.5;

  addCorrection(
    corrections,
    "Item 1 — 0,5 pt",
    q1,
    "argumente",
    q1Correct,
    "Le corrigé fourni indique : « Dans ce texte, l'auteur argumente »."
  );

  /*
    ITEM 2 — 1 point
    Je = l'auteur, Martin Luther King.
    Vous = les jeunes.
  */

  const q2a = normalize(getValue("q2a"));
  const q2b = normalize(getValue("q2b"));

  const q2aCorrect = [
    "l'auteur",
    "l auteur",
    "martin luther king",
    "l'auteur martin luther king",
    "l auteur martin luther king"
  ].map(normalize).includes(q2a);

  const q2bCorrect = [
    "les jeunes",
    "les jeunes auxquels l'auteur s'adresse",
    "les jeunes auxquels l auteur s adresse"
  ].map(normalize).includes(q2b);

  if (q2aCorrect) score += 0.5;
  if (q2bCorrect) score += 0.5;

  addCorrection(
    corrections,
    "Item 2a — 0,5 pt",
    getValue("q2a"),
    "L'auteur (Martin Luther King).",
    q2aCorrect,
    "Le pronom personnel « Je » désigne l'auteur du texte."
  );

  addCorrection(
    corrections,
    "Item 2b — 0,5 pt",
    getValue("q2b"),
    "Les jeunes.",
    q2bCorrect,
    "Le pronom personnel « Vous » désigne les jeunes auxquels l'auteur s'adresse."
  );

  /*
    ITEM 3 — 0,5 point
    Réponse du corrigé : travail.
  */

  const q3 = normalize(getValue("q3"));
  const q3Correct = q3 === "travail";

  if (q3Correct) score += 0.5;

  addCorrection(
    corrections,
    "Item 3 — 0,5 pt",
    getValue("q3"),
    "Travail.",
    q3Correct,
    "Le corrigé donne le mot « travail »."
  );

  /*
    ITEM 4 — 0,5 point
    Hôte : haute, ôte.
    Pin : pain, peint.
    Chaque réponse vaut 0,25 point.
  */

  const q4a = normalize(getValue("q4a"));
  const q4b = normalize(getValue("q4b"));

  const q4aCorrect = ["haute", "ote"].includes(q4a);
  const q4bCorrect = ["pain", "peint"].includes(q4b);

  if (q4aCorrect) score += 0.25;
  if (q4bCorrect) score += 0.25;

  addCorrection(
    corrections,
    "Item 4a — 0,25 pt",
    getValue("q4a"),
    "Haute ou ôte.",
    q4aCorrect,
    "Le corrigé propose « haute » et « ôte » comme homonymes de « hôte »."
  );

  addCorrection(
    corrections,
    "Item 4b — 0,25 pt",
    getValue("q4b"),
    "Pain ou peint.",
    q4bCorrect,
    "Le corrigé propose « pain » et « peint » comme homonymes de « pin »."
  );

  /*
    ITEM 5 — 2 points
    a) V ; b) V ; c) F ; d) F.
    Chaque réponse vaut 0,5 point.
  */

  const item5 = [
    { id: "q5a", expected: "v", label: "a", answer: "V" },
    { id: "q5b", expected: "v", label: "b", answer: "V" },
    { id: "q5c", expected: "f", label: "c", answer: "F" },
    { id: "q5d", expected: "f", label: "d", answer: "F" }
  ];

  item5.forEach((question) => {
    const user = normalize(getValue(question.id));
    const correct =
      user === question.expected ||
      user === (question.expected === "v" ? "vrai" : "faux");

    if (correct) score += 0.5;

    addCorrection(
      corrections,
      "Item 5" + question.label + " — 0,5 pt",
      getValue(question.id),
      question.answer,
      correct,
      "Réponse indiquée dans le corrigé officiel fourni."
    );
  });

  /*
    ITEM 6 — 1 point
    Tu vaincras : vaincre / as vaincu.
    Il vécut : vivre / a vécu.
    Chaque case vaut 0,25 point.
  */

  const item6 = [
    {
      id: "q6a1",
      answer: ["vaincre"],
      expected: "vaincre",
      label: "Infinitif de « tu vaincras »"
    },
    {
      id: "q6a2",
      answer: ["as vaincu"],
      expected: "as vaincu",
      label: "Passé composé de « tu vaincras »"
    },
    {
      id: "q6b1",
      answer: ["vivre"],
      expected: "vivre",
      label: "Infinitif de « il vécut »"
    },
    {
      id: "q6b2",
      answer: ["a vecu"],
      expected: "a vécu",
      label: "Passé composé de « il vécut »"
    }
  ];

  item6.forEach((question) => {
    const user = normalize(getValue(question.id));
    const correct = question.answer.includes(user);

    if (correct) score += 0.25;

    addCorrection(
      corrections,
      "Item 6 — 0,25 pt",
      getValue(question.id),
      question.expected,
      correct,
      question.label + "."
    );
  });

  /*
    ITEM 7 — 1 point
    Réponse du corrigé :
    Le travail a été bien fait par le balayeur des rues.
  */

  const q7 = normalize(getValue("q7"));

  const acceptedQ7 = [
    "le travail a ete bien fait par le balayeur des rues",
    "le travail a bien ete fait par le balayeur des rues"
  ].map(normalize);

  const q7Correct = acceptedQ7.includes(q7);

  if (q7Correct) score += 1;

  addCorrection(
    corrections,
    "Item 7 — 1 pt",
    getValue("q7"),
    "Le travail a été bien fait par le balayeur des rues.",
    q7Correct,
    "Il faut transformer la phrase à la voix passive. Le complément d'objet direct « le travail » devient le sujet."
  );

  /*
    ITEM 8 — 1 point
    Réponse du corrigé :
    Ici vécut un grand balayeur des rues.
    Un grand balayeur des rues fit bien son travail.
  */

  const q8 = normalize(getValue("q8"));

  const acceptedQ8 = [
    "ici vecut un grand balayeur des rues un grand balayeur des rues fit bien son travail",
    "ici vecut un grand balayeur des rues. un grand balayeur des rues fit bien son travail",
    "ici vivait un grand balayeur des rues un grand balayeur des rues faisait bien son travail"
  ].map(normalize);

  const q8Correct = acceptedQ8.includes(q8);

  if (q8Correct) score += 1;

  addCorrection(
    corrections,
    "Item 8 — 1 pt",
    getValue("q8"),
    "Ici vécut un grand balayeur des rues. Un grand balayeur des rues fit bien son travail.",
    q8Correct,
    "Il faut séparer la proposition relative en une deuxième phrase simple. Une formulation différente mais grammaticalement correcte peut nécessiter une vérification manuelle."
  );

  /*
    ITEM 9 — 3 points
    Réponse personnelle : ne pas noter automatiquement vrai ou faux.
  */

  const q9 = getValue("q9");

  addOpenFeedback(
    corrections,
    "Item 9 — 3 pts : réponse personnelle",
    q9,
    "Cette phrase signifie que chacun doit faire de son mieux, quel que soit son métier ou la place qu'il occupe. Toutes les professions ont de la valeur si le travail est bien fait.",
    "Le corrigé demande d'expliquer son point de vue en quatre ou cinq lignes. La réponse doit être évaluée selon son sens, ses arguments et le respect de la consigne, et non uniquement selon les mots utilisés."
  );

  $("feedback9").textContent = q9
    ? "Réponse enregistrée. Vérifie que tu expliques la phrase en quatre ou cinq lignes. La note nécessite une évaluation du contenu."
    : "Tu n'as pas répondu. Explique ce que signifie cette phrase en quatre ou cinq lignes.";

  /*
    EXPRESSION ÉCRITE — 10 points
    Évaluation séparée, sans correction automatique de la qualité du texte.
  */

  const writing = getValue("writing");
  const wordList = writing.match(/\S+/g) || [];
  const wordCount = wordList.length;

  $("writingFeedback").textContent = writing
    ? "Rédaction enregistrée. Vérifie que tu donnes ton avis sur l'importance de tout travail, que tu l'illustres par des exemples et que ton texte est cohérent. La note sur 10 points nécessite une évaluation de la rédaction."
    : "Tu n'as pas encore rédigé ton texte. Le sujet demande de donner ton avis sur l'importance de tout travail et de l'illustrer avec des exemples.";

  score = Math.round(score * 100) / 100;

  /*
    HISTORIQUE ET PROGRESSION
  */

  const history = getHistory();

  const previousScore =
    history.length > 0
      ? Number(history[history.length - 1].score)
      : null;

  const comment = getPerformanceComment(score, previousScore);

  $("score").textContent =
    score.toLocaleString("fr-FR") + "/" +
    MAX_SCORE.toLocaleString("fr-FR");

  $("scoreMessage").textContent =
    comment +
    " L'item 9 (3 pts) et l'expression écrite (10 pts) nécessitent une évaluation séparée.";

  $("progressBar").style.width =
    Math.max(0, Math.min(100, score / MAX_SCORE * 100)) + "%";

  history.push({
    score: score,
    date: new Date().toLocaleString("fr-FR"),
    comment: comment
  });

  saveHistory(history);
  renderHistory();

  $("resultSection").hidden = false;

  $("resultSection").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function startExercise() {
  alert(
    "Tu peux commencer l'exercice. Réponds aux questions, puis appuie sur Corriger."
  );

  const firstQuestion = document.querySelector(
    'input[name="q1"]'
  );

  if (firstQuestion) {
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