"use strict";

const MAX_SCORE = 7.5;
const HISTORY_KEY = "bepc2006_historique_v1";

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
      "L'historique n'a pas pu être enregistré dans ce navigateur."
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

function addOpenQuestionFeedback(container, title, userAnswer, model, explanation) {
  const block = document.createElement("div");
  block.className = "correction-item";

  const heading = document.createElement("h4");
  heading.textContent = title;

  const answer = document.createElement("p");
  answer.textContent =
    "Ta réponse : " + (userAnswer || "(sans réponse)");

  const modelAnswer = document.createElement("p");
  modelAnswer.textContent = "Éléments de correction : " + model;

  const details = document.createElement("p");
  details.textContent = explanation;

  block.append(heading, answer, modelAnswer, details);
  container.appendChild(block);
}

function getPerformanceComment(score, previousScore) {
  if (previousScore === null) {
    if (score >= 6) {
      return "Très bon début ! Continue à t'entraîner.";
    }

    if (score >= 4) {
      return "Bon début. Relis les explications pour progresser.";
    }

    return "Continue tes efforts et révise les corrections.";
  }

  if (score > previousScore) {
    return "Progression : ton résultat est meilleur que lors de la tentative précédente.";
  }

  if (score < previousScore) {
    return "Régression : ton résultat a diminué. Relis les corrections et réessaie.";
  }

  return "Résultat stable. Travaille les questions qui te posent des difficultés.";
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

  if (count >= 150 && count <= 200) {
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
    ITEM 1 : 0,5 pt
    Corrigé fourni : l'auteur informe.
  */

  const q1 = getRadioValue("q1");
  const q1Correct = q1 === "informe";

  if (q1Correct) score += 0.5;

  addCorrection(
    corrections,
    "Item 1 — 0,5 pt",
    q1,
    "informe",
    q1Correct,
    "Le corrigé de la session 2006 indique : « Dans ce texte, l'auteur informe »."
  );

  /*
    ITEM 2 : 1,5 pt
    Réponses du corrigé : V, F, V.
  */

  const item2 = [
    {
      id: "q2a",
      expected: ["v", "vrai"],
      points: 0.5,
      answerText: "V",
      explanation: "Réponse du corrigé : V."
    },
    {
      id: "q2b",
      expected: ["f", "faux"],
      points: 0.5,
      answerText: "F",
      explanation: "Réponse du corrigé : F."
    },
    {
      id: "q2c",
      expected: ["v", "vrai"],
      points: 0.5,
      answerText: "V",
      explanation: "Réponse du corrigé : V."
    }
  ];

  item2.forEach((question, index) => {
    const user = getValue(question.id);
    const normalized = normalize(user);

    const correct =
      question.expected.includes(normalized);

    if (correct) score += question.points;

    addCorrection(
      corrections,
      "Item 2" + String.fromCharCode(97 + index) +
        " — 0,5 pt",
      user,
      question.answerText,
      correct,
      question.explanation
    );
  });

  /*
    ITEM 3 : 1 pt
    Deux réponses, 0,5 pt chacune.
  */

  const q3a = getRadioValue("q3a");
  const q3b = getRadioValue("q3b");

  const q3aCorrect = q3a === "tous";
  const q3bCorrect = q3b === "diminuer";

  if (q3aCorrect) score += 0.5;
  if (q3bCorrect) score += 0.5;

  addCorrection(
    corrections,
    "Item 3a — 0,5 pt",
    q3a,
    "Le charbonnier coupe tous les arbres.",
    q3aCorrect,
    "Le corrigé fourni indique : « Le charbonnier coupe tous les arbres »."
  );

  addCorrection(
    corrections,
    "Item 3b — 0,5 pt",
    q3b,
    "Il faut diminuer le prix des autres combustibles.",
    q3bCorrect,
    "Le corrigé fourni indique qu'il faut diminuer le prix des autres combustibles."
  );

  /*
    ITEM 4 : 0,5 pt
  */

  const q4 = getRadioValue("q4");
  const q4Correct = q4 === "hache";

  if (q4Correct) score += 0.5;

  addCorrection(
    corrections,
    "Item 4 — 0,5 pt",
    q4,
    "sous sa hache",
    q4Correct,
    "Le corrigé donne l'expression : « sous sa hache »."
  );

  /*
    ITEM 5 : 1 pt
    0,5 pt pour les deux combustibles cités dans le texte.
    0,5 pt pour un combustible supplémentaire.
  */

  const fuelsFromText = [
    "bois de chauffe",
    "charbon de bois",
    "charbon",
    "sciure",
    "bois"
  ];

  const firstFuel = normalize(getValue("q5a1"));
  const secondFuel = normalize(getValue("q5a2"));

  const firstFuelCorrect =
    fuelsFromText.includes(firstFuel);

  const secondFuelCorrect =
    fuelsFromText.includes(secondFuel) &&
    secondFuel !== firstFuel;

  let fuelScore = 0;

  if (firstFuelCorrect) fuelScore += 0.25;
  if (secondFuelCorrect) fuelScore += 0.25;

  score += fuelScore;

  addCorrection(
    corrections,
    "Item 5a — 0,5 pt",
    getValue("q5a1") + " ; " + getValue("q5a2"),
    "Deux réponses parmi : le bois de chauffe, le charbon de bois, la sciure.",
    firstFuelCorrect && secondFuelCorrect,
    "Le corrigé accepte ces combustibles présents dans le texte. Deux réponses différentes sont demandées."
  );

  const otherFuel = normalize(getValue("q5b"));

  const acceptedOtherFuels = [
    "gaz",
    "gaz butane",
    "butane",
    "petrole",
    "briquettes ardentes",
    "herbes seches",
    "copeaux",
    "bouse"
  ];

  const otherFuelCorrect =
    acceptedOtherFuels.includes(otherFuel);

  if (otherFuelCorrect) score += 0.5;

  addCorrection(
    corrections,
    "Item 5b — 0,5 pt",
    getValue("q5b"),
    "Exemples : le gaz (butane), le pétrole, les briquettes ardentes, les herbes sèches, les copeaux ou la bouse.",
    otherFuelCorrect,
    "Ces exemples sont tirés du corrigé fourni. D'autres réponses peuvent être correctes, même si elles ne figurent pas dans cette liste."
  );

  /*
    ITEM 6 : 1 pt
    Le corrigé propose plusieurs titres possibles.
  */

  const q6 = getValue("q6");
  const normalizedTitle = normalize(q6);

  const acceptedTitles = [
    "la destruction de la foret",
    "ou est partie notre foret",
    "l emploi du charbon de bois et sa consequence",
    "l'emploi du charbon de bois et sa consequence",
    "le charbon de bois et la destruction de la foret"
  ].map(normalize);

  const titleCorrect =
    acceptedTitles.includes(normalizedTitle);

  if (titleCorrect) score += 1;

  addCorrection(
    corrections,
    "Item 6 — 1 pt",
    q6,
    "Exemples du corrigé : « La destruction de la forêt » ; « Où est partie notre forêt ? » ; « L'emploi du charbon de bois et sa conséquence... »",
    titleCorrect,
    "Le corrigé propose plusieurs titres. Un titre pertinent différent peut également être acceptable ; il devra être évalué manuellement."
  );

  /*
    ITEM 7 : 1 pt
    Réponses conformes aux exemples du corrigé.
  */

  const q7 = normalize(getValue("q7"));

  const acceptedQ7 = [
    "il faudrait reboiser pour que la continuite du ravitaillement en charbon de bois soit assuree",
    "il faudrait reboiser pour que la continuite du ravitaillement en charbon de bois soit sure",
    "il faudrait reboiser afin qu on assure la continuite du ravitaillement en charbon de bois"
  ].map(normalize);

  const q7Correct = acceptedQ7.includes(q7);

  if (q7Correct) score += 1;

  addCorrection(
    corrections,
    "Item 7 — 1 pt",
    getValue("q7"),
    "Exemples : « Il faudrait reboiser pour que la continuité du ravitaillement en charbon de bois soit assurée » ; « Il faudrait reboiser pour que la continuité du ravitaillement en charbon de bois soit sûre » ; « Il faudrait reboiser afin qu'on assure la continuité du ravitaillement en charbon de bois ».",
    q7Correct,
    "Il faut transformer le but en proposition subordonnée. Une formulation grammaticalement correcte équivalente peut nécessiter une vérification manuelle."
  );

  /*
    ITEM 8 : 1 pt
  */

  const q8 = normalize(getValue("q8"));

  const acceptedQ8 = [
    "les arbres n ont pas atteint le seuil d exploitation",
    "les arbres n'ont pas atteint le seuil d'exploitation"
  ].map(normalize);

  const q8Correct = acceptedQ8.includes(q8);

  if (q8Correct) score += 1;

  addCorrection(
    corrections,
    "Item 8 — 1 pt",
    getValue("q8"),
    "Les arbres n'ont pas atteint le seuil d'exploitation.",
    q8Correct,
    "Le verbe « atteignent » doit être mis au passé composé : « ont atteint », à la forme négative « n'ont pas atteint »."
  );

  /*
    ITEM 9 : 2,5 pts
    Question d'opinion : pas de correction automatique vrai/faux.
    Elle est exclue du score automatique.
  */

  const q9 = getValue("q9");

  addOpenQuestionFeedback(
    corrections,
    "Item 9 — 2,5 pts : réponse personnelle",
    q9,
    "Exprimer clairement ton avis et le justifier en trois ou quatre lignes. Le corrigé demande de montrer son point de vue.",
    "Cette question est ouverte. Une réponse pertinente ne doit pas être déclarée fausse simplement parce qu'elle utilise d'autres mots. Évalue les arguments, la cohérence et le respect de la consigne."
  );

  showOpenFeedback();

  /*
    SCORE AUTOMATIQUE
    Le score automatique porte sur les items 1 à 8 : 7,5 points.
    L'item 9 sur 2,5 points doit être évalué selon les critères
    de la réponse personnelle.
  */

  score = Math.round(score * 100) / 100;

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
    " La note de l'item 9 (2,5 pts) reste à évaluer séparément.";

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

function showOpenFeedback() {
  const q9 = getValue("q9");

  $("feedback9").textContent = q9
    ? "Réponse enregistrée. Vérifie que tu as exprimé ton avis et donné des arguments en trois ou quatre lignes. La note nécessite une évaluation du contenu."
    : "Tu n'as pas répondu. Pour obtenir des points, exprime ton point de vue et justifie-le en trois ou quatre lignes.";

  const writing = getValue("writing");
  const words = writing.match(/\S+/g) || [];

  $("writingFeedback").textContent = writing
    ? "Ta rédaction est enregistrée. Vérifie le titre, la présentation en article de journal, les informations sur les bienfaits du reboisement, la cohérence, la grammaire, l'orthographe et la longueur demandée. La note sur 10 nécessite une évaluation du texte."
    : "Tu n'as pas encore rédigé l'article. Le sujet demande un article de journal sur les bienfaits du reboisement, de 150 à 200 mots.";
}

function startExercise() {
  alert(
    "Tu peux commencer l'exercice. Réponds aux questions, puis appuie sur Corriger."
  );

  $("q1").focus();
}

document.addEventListener("DOMContentLoaded", () => {
  $("startButton").addEventListener("click", startExercise);

  $("correctButton").addEventListener("click", gradeExercise);

  $("writing").addEventListener("input", updateWordCount);

  updateWordCount();
  renderHistory();
});