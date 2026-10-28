"use strict";

const MAX_SCORE = 6.5;
const HISTORY_KEY = "bepc2008_historique_v1";
const MAX_HISTORY = 30;

const EXAMPLE_ITEM8 =
  "« L'importance des langues étrangères » ou « Pourquoi apprendre une " +
  "langue étrangère ? »";

const EXAMPLE_ITEM9 =
  "Je préfère apprendre l'anglais car c'est aujourd'hui la langue de la " +
  "communication internationale. Elle me permettra de voyager partout dans " +
  "le monde et d'échanger facilement avec des personnes de cultures " +
  "différentes. De plus, la maîtrise de cette langue constitue un atout " +
  "indispensable pour mon futur parcours professionnel.";

const EXAMPLE_ARTICLE =
  "L'école : la clé de l'avenir de nos enfants\n\n" +
  "Chers parents,\n\n" +
  "De nos jours, le monde évolue à un rythme effréné et l'éducation est " +
  "devenue le pilier central de toute réussite. Pourtant, certains d'entre " +
  "vous hésitent encore à envoyer leurs enfants sur les bancs de l'école. " +
  "C'est une erreur que nos jeunes pourraient payer cher à l'âge adulte.\n\n" +
  "L'école n'est pas seulement un lieu où l'on apprend à lire et à écrire. " +
  "C'est un formidable espace d'épanouissement où les enfants acquièrent " +
  "des connaissances essentielles, développent leur esprit critique et " +
  "apprennent à devenir des citoyens responsables. De nos jours, face aux " +
  "exigences du marché de l'emploi, un enfant non scolarisé se retrouve " +
  "malheureusement marginalisé et privé d'opportunités économiques.\n\n" +
  "L'instruction est le plus beau trésor et le meilleur héritage que vous " +
  "puissiez léguer à votre progéniture. Elle leur donne les armes " +
  "nécessaires pour sortir de la précarité et bâtir une vie meilleure. " +
  "Investir dans l'éducation de vos enfants aujourd'hui, c'est garantir la " +
  "sécurité de leur avenir et le développement de notre communauté. Ne " +
  "fermons pas la porte du savoir à notre jeunesse : envoyons tous nos " +
  "enfants à l'école !";

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
    if (score >= 5) {
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
    q1 === "decrit" ? "décrit" : q1,
    "argumente",
    q1 === "argumente",
    "L'auteur défend l'idée qu'il faut apprendre des langues étrangères et donne des raisons : il argumente."
  );

  /* ITEM 2 — 0,5 pt */
  const q2 = getRadioValue("q2");
  const q2Labels = {
    a: "Il n'y a aucune raison d'apprendre les langues.",
    b: "Pour des multiples raisons, il faut apprendre des langues étrangères."
  };

  grader.check(
    "Item 2",
    0.5,
    q2Labels[q2] || "",
    q2Labels.b,
    q2 === "b",
    "Tout le texte explique les avantages d'apprendre une langue étrangère : la phrase b) est donc la bonne."
  );

  /* ITEM 3 — 1 pt (0,5 + 0,5) */
  const q3a = getValue("q3a");

  grader.check(
    "Item 3a",
    0.5,
    q3a,
    "apprentissage (ou l'action d'étudier)",
    acceptsAny(q3a, ["apprentissage", "lapprentissage", "actiondetudier", "lactiondetudier"]),
    "« Étude » a pour synonyme « apprentissage » : c'est l'action d'étudier."
  );

  const q3b = getValue("q3b");

  grader.check(
    "Item 3b",
    0.5,
    q3b,
    "profits",
    acceptsAny(q3b, ["profits", "profit", "lesprofits"]),
    "Le texte commence par « quels profits pouvons-nous tirer… » : « profits » est synonyme d'« avantages »."
  );

  /* ITEM 4 — 1,5 pt (0,25 par case) */
  const item4 = [
    { id: "q4a", accepted: ["acquisition", "acquis", "lacquisition"], expected: "acquisition (ou acquis)", label: "Nom de « acquérir »" },
    { id: "q4b", accepted: ["acquis", "acquise"], expected: "acquis", label: "Adjectif de « acquérir »" },
    { id: "q4c", accepted: ["apprendre", "sapprendre"], expected: "apprendre", label: "Verbe de « apprentissage »" },
    { id: "q4d", accepted: ["appris", "apprise"], expected: "appris", label: "Adjectif de « apprentissage »" },
    { id: "q4e", accepted: ["pouvoir", "etrepossible"], expected: "pouvoir (ou être possible)", label: "Verbe de « possible »" },
    { id: "q4f", accepted: ["possibilite", "lapossibilite"], expected: "possibilité", label: "Nom de « possible »" }
  ];

  item4.forEach((entry) => {
    grader.check(
      "Item 4 · " + entry.label,
      0.25,
      getValue(entry.id),
      entry.expected,
      acceptsAny(getValue(entry.id), entry.accepted),
      "Cherche des mots de la même famille : acquérir, acquisition, acquis ; apprendre, apprentissage, appris ; pouvoir, possible, possibilité."
    );
  });

  /* ITEM 5 — 1 pt */
  const q5 = getValue("q5");
  const q5c = compact(q5);

  const q5Correct =
    (q5c.startsWith("onpeutdire") || q5c.startsWith("nouspouvonsdire")) &&
    q5c.includes("quapprendreuneoudeslanguesetrangeresestunenecessitepourchacundenous") &&
    !q5c.includes("nepas") &&
    !q5c.includes("nepeut");

  grader.check(
    "Item 5",
    1,
    q5,
    "On peut dire qu'apprendre une ou des langues étrangères est une nécessité pour chacun de nous.",
    q5Correct,
    "Pour passer à la forme déclarative affirmative, on supprime « ne… pas », l'inversion « peut-on » devient « on peut » et le point d'interrogation devient un point."
  );

  /* ITEM 6 — 1 pt */
  const q6 = getValue("q6");
  const q6c = compact(q6);

  const q6Correct =
    q6c === "deslanguesetrangeressontapprisesalecole" ||
    q6c === "leslanguesetrangeressontapprisesalecole";

  grader.check(
    "Item 6",
    1,
    q6,
    "Des langues étrangères sont apprises à l'école.",
    q6Correct,
    "À la voix passive, le COD « des langues étrangères » devient le sujet, le verbe se met à « être + participe passé » (accordé : apprises) et le sujet « on » disparaît."
  );

  /* ITEM 7 — 1 pt */
  const q7 = getValue("q7");
  const q7c = compact(q7);

  const q7Correct =
    q7c.includes("enrichissez") || q7c.includes("enrichirez");

  grader.check(
    "Item 7",
    1,
    q7,
    "Si vous apprenez une langue étrangère, vous enrichissez (ou enrichirez) votre culture personnelle.",
    q7Correct,
    "Après « si » + présent, on utilise le présent ou le futur de l'indicatif : « vous enrichissez » ou « vous enrichirez »."
  );

  /* ITEM 8 — 1 pt : réponse personnelle, pas de note automatique */
  const q8 = getValue("q8");

  addOpenFeedback(
    corrections,
    "Item 8 — 1 pt : réponse personnelle",
    q8,
    EXAMPLE_ITEM8,
    "Plusieurs titres sont possibles. Un bon titre est court, il résume l'idée principale du texte (l'importance d'apprendre des langues étrangères) et peut prendre la forme d'un groupe nominal ou d'une question."
  );

  $("feedback8").textContent = q8
    ? "Titre enregistré. Compare-le avec l'exemple : résume-t-il bien l'idée principale du texte ?"
    : "Tu n'as pas répondu. Propose un titre court qui résume le texte.";

  /* ITEM 9 — 2,5 pts : réponse personnelle, pas de note automatique */
  const q9 = getValue("q9");

  addOpenFeedback(
    corrections,
    "Item 9 — 2,5 pts : réponse personnelle",
    q9,
    EXAMPLE_ITEM9,
    "Il n'y a pas une seule bonne réponse. Indique clairement la langue que tu préfères (anglais, chinois, espagnol…), puis donne deux ou trois raisons (voyager, communiquer, trouver un emploi…) en trois ou quatre phrases. Utilise des mots de liaison : car, de plus, enfin."
  );

  $("feedback9").textContent = q9
    ? "Réponse enregistrée. Compare-la avec l'exemple : as-tu nommé une langue et donné au moins deux raisons en trois ou quatre phrases ?"
    : "Tu n'as pas répondu. Dis quelle langue tu préfères et pourquoi, en trois ou quatre phrases.";

  /* EXPRESSION ÉCRITE — 10 pts : pas de note automatique */
  const writing = getValue("writing");
  const count = (writing.match(/\S+/g) || []).length;

  $("writingFeedback").textContent = writing
    ? "Rédaction enregistrée (" + count + " mots). Vérifie que ton article a un titre, qu'il respecte 150 à 200 mots et qu'il convainc les parents avec des arguments."
    : "Tu n'as pas encore rédigé ton article. Écris un article de journal pour convaincre les parents d'envoyer leurs enfants à l'école.";

  addOpenFeedback(
    corrections,
    "Expression écrite — 10 pts : réponse personnelle",
    writing,
    EXAMPLE_ARTICLE,
    "Savoir-faire demandé : argumenter (convaincre). Forme : article de journal. Prévois un titre accrocheur, une introduction qui présente le problème, un développement avec deux ou trois arguments illustrés d'exemples, puis une conclusion qui lance un appel aux parents. Respecte 150 à 200 mots."
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
    " L'item 8 (1 pt), l'item 9 (2,5 pts) et l'expression écrite (10 pts) nécessitent une évaluation séparée.";

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