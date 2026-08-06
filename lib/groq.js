function normalizeModelOutput(content) {
  if (typeof content === "string") {
    return content.trim();
  }
  if (Array.isArray(content)) {
    return content.map((item) => item?.text || "").join("\n").trim();
  }
  return "";
}

function deterministicReport(parsed, focus) {
  const scoreText = parsed.score?.home !== undefined
    ? `${parsed.score.home}-${parsed.score.away}`
    : parsed.score?.teams?.map((item) => `${item.team}: ${item.goals}`).join(" · ") || "sin marcador confirmado";

  if (focus?.found) {
    const involvement = focus.goals + focus.assists;
    return [
      "## Lectura rápida",
      `${focus.name} aparece en la repetición. El lector encontró ${focus.goals} gol(es), ${focus.assists} asistencia(s) y ${focus.chatMessages} mensaje(s) registrados. El partido terminó con ${scoreText}.`,
      "",
      "## Qué revisar",
      involvement > 0
        ? "- Repite las acciones de gol o asistencia e identifica qué posición ocupabas antes de recibir o soltar el balón."
        : "- Revisa tus recepciones y pérdidas. El lector básico no calcula todavía cada toque, así que conviene comparar el reporte con el video de la rec.",
      "- Observa si ofrecías una línea de pase corta cuando el equipo salía desde atrás.",
      "- Comprueba si regresabas a tu posición después de una pérdida.",
      "",
      "## Trabajo recomendado",
      "- Practica secuencias de dos toques: controlar, orientar y pasar.",
      "- Haz una sesión corta de posicionamiento con el DT usando el simulador de jugadas.",
      "- Marca dos momentos buenos y dos por corregir antes del siguiente oficial.",
      "",
      "## Límite del análisis",
      "Este informe usa metadatos, goles, asistencias y mensajes extraídos. No afirma posesión, pases completados ni mapas de calor porque el lector incluido todavía no calcula esos datos cuadro por cuadro."
    ].join("\n");
  }

  const top = parsed.playerStats.slice(0, 5).map((player) => `${player.name} (${player.goals} G, ${player.assists} A)`).join(", ");
  return [
    "## Resumen",
    `La repetición dura ${parsed.durationLabel}, incluye ${parsed.playerCount} participantes detectados y ${parsed.goalCount} goles. Marcador: ${scoreText}.`,
    "",
    "## Participación visible",
    top ? `Los nombres con participación directa o mayor actividad visible fueron: ${top}.` : "No se detectaron participaciones directas suficientes para ordenar a los jugadores.",
    "",
    "## Puntos para el DT",
    "- Revisar cómo se inicia la salida desde defensa.",
    "- Comprobar las distancias entre líneas cuando se pierde el balón.",
    "- Comparar las jugadas de gol con las simulaciones preparadas antes del partido.",
    "",
    "## Límite del análisis",
    "El lector básico no calcula todavía posesión, pases completos, velocidad ni mapas de calor."
  ].join("\n");
}

export async function createCoachingReport(parsed, focus) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      provider: "local-fallback",
      model: null,
      text: deterministicReport(parsed, focus),
      warning: "GROQ_API_KEY no está configurada; se generó un reporte básico sin IA externa."
    };
  }

  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const compactData = {
    match: {
      fileName: parsed.fileName,
      roomName: parsed.roomName,
      duration: parsed.durationLabel,
      playerCount: parsed.playerCount,
      score: parsed.score,
      goals: parsed.goals
    },
    focusPlayer: focus,
    playerStats: parsed.playerStats.slice(0, 40),
    limitations: parsed.limitations
  };

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      max_completion_tokens: 1200,
      messages: [
        {
          role: "system",
          content: [
            "Eres asistente técnico de un equipo de HaxBall.",
            "Escribe en español natural, directo y útil para jugadores jóvenes.",
            "Usa únicamente los datos JSON entregados.",
            "No inventes posesión, pases, tiros, posiciones, errores ni momentos exactos.",
            "Separa claramente lo observado de lo que debe revisar el DT en la repetición.",
            "Entrega: Lectura rápida, fortalezas observables, aspectos a revisar, ejercicios para la semana y límites del análisis.",
            "No uses frases publicitarias ni un tono exagerado."
          ].join(" ")
        },
        {
          role: "user",
          content: `Genera el informe con estos datos:\n${JSON.stringify(compactData)}`
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      provider: "local-fallback",
      model,
      text: deterministicReport(parsed, focus),
      warning: `Groq respondió ${response.status}. Se utilizó el reporte básico. ${errorText.slice(0, 180)}`
    };
  }

  const data = await response.json();
  const text = normalizeModelOutput(data?.choices?.[0]?.message?.content);
  if (!text) {
    return {
      provider: "local-fallback",
      model,
      text: deterministicReport(parsed, focus),
      warning: "Groq no devolvió texto; se utilizó el reporte básico."
    };
  }

  return { provider: "groq", model, text, warning: null };
}
