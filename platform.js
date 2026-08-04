(() => {
    const statusBox = document.querySelector("[data-platform-status]");
    const playerForm = document.querySelector("[data-player-form]");
    const officialForm = document.querySelector("[data-official-form]");
    const linkedPlayers = document.querySelector("[data-linked-players]");
    const officialList = document.querySelector("[data-official-list]");
    const refreshOfficialsButton = document.querySelector("[data-refresh-officials]");

    const replayDrop = document.querySelector("[data-replay-drop]");
    const replayFileInput = document.querySelector("[data-replay-file]");
    const replayFileName = document.querySelector("[data-replay-file-name]");
    const replayPlayer = document.querySelector("[data-replay-player]");
    const analyzeReplayButton = document.querySelector("[data-analyze-replay]");
    const useSampleButton = document.querySelector("[data-use-sample]");
    const replayState = document.querySelector("[data-replay-state]");
    const replayLoading = document.querySelector("[data-replay-loading]");
    const replayPlaceholder = document.querySelector("[data-replay-placeholder]");
    const replayReport = document.querySelector("[data-replay-report]");
    const replayMetrics = document.querySelector("[data-replay-metrics]");
    const replayGoals = document.querySelector("[data-replay-goals]");
    const aiReport = document.querySelector("[data-ai-report]");

    const state = {
        players: [],
        officials: [],
        replayFile: null
    };

    const api = async (path, options = {}) => {
        const response = await fetch(path, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });
        let data;
        try {
            data = await response.json();
        } catch {
            data = { ok: false, error: `Respuesta no válida del servidor (${response.status}).` };
        }
        if (!response.ok || data.ok === false) {
            const error = new Error(data.error || `Error ${response.status}`);
            error.status = response.status;
            throw error;
        }
        return data;
    };

    const escapeHtml = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const showToast = (message, type = "success") => {
        let toast = document.querySelector(".platform-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.className = "platform-toast";
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.className = `platform-toast ${type}`;
        requestAnimationFrame(() => toast.classList.add("show"));
        window.clearTimeout(showToast.timer);
        showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 4200);
    };

    const getAdminSecret = () => {
        let secret = sessionStorage.getItem("newcastle_admin_secret") || "";
        if (!secret) {
            secret = window.prompt("Escribe el código del panel (ADMIN_SECRET de Vercel):") || "";
            if (secret) sessionStorage.setItem("newcastle_admin_secret", secret);
        }
        return secret;
    };

    const adminHeaders = () => {
        const secret = getAdminSecret();
        if (!secret) throw new Error("Se necesita el código del panel.");
        return { "X-Admin-Secret": secret };
    };

    const setPlatformStatus = (health) => {
        if (!statusBox) return;
        statusBox.className = "platform-status reveal visible";
        if (!health) {
            statusBox.classList.add("error");
            statusBox.querySelector("strong").textContent = "No se pudo conectar con las funciones del servidor.";
            return;
        }
        if (health.database === "missing-supabase") {
            statusBox.classList.add("warning");
            statusBox.querySelector("strong").textContent = "La página está en línea, pero falta configurar Supabase para guardar oficiales y checks.";
            return;
        }
        statusBox.classList.add("online");
        const pieces = [
            health.database === "supabase" ? "Base de datos conectada" : "Modo local",
            health.discordConfigured ? "Discord conectado" : "Discord pendiente",
            health.groqConfigured ? "Groq conectado" : "Groq pendiente"
        ];
        statusBox.querySelector("strong").textContent = pieces.join(" · ");
    };

    const loadHealth = async () => {
        try {
            setPlatformStatus(await api("/api/health"));
        } catch {
            setPlatformStatus(null);
        }
    };

    const renderLinkedPlayers = () => {
        if (!linkedPlayers) return;
        if (!state.players.length) {
            linkedPlayers.innerHTML = '<p class="platform-muted">Aún no hay jugadores vinculados.</p>';
            return;
        }
        linkedPlayers.innerHTML = `<div class="linked-player-grid">${state.players.map((player) => `
            <label class="linked-player-option">
                <input type="checkbox" name="playerIds" value="${escapeHtml(player.id)}" ${player.dmOptIn ? "" : "disabled"}>
                <div>
                    <strong>${escapeHtml(player.nickname)}</strong>
                    <small>${player.dmOptIn ? `Discord ····${escapeHtml(player.discordLast4 || "")}` : "Avisos desactivados"}</small>
                </div>
            </label>
        `).join("")}</div>`;
    };

    const loadPlayers = async () => {
        try {
            const data = await api("/api/players");
            state.players = data.players || [];
            renderLinkedPlayers();
        } catch (error) {
            linkedPlayers.innerHTML = `<p class="platform-muted">${escapeHtml(error.message)}</p>`;
        }
    };

    const formatDate = (value) => new Intl.DateTimeFormat("es-MX", {
        dateStyle: "full",
        timeStyle: "short"
    }).format(new Date(value));

    const renderOfficials = () => {
        if (!officialList) return;
        if (!state.officials.length) {
            officialList.innerHTML = '<div class="platform-empty">Todavía no hay oficiales registrados.</div>';
            return;
        }
        officialList.innerHTML = state.officials.map((official) => {
            const counts = (official.invitations || []).reduce((result, invitation) => {
                const key = invitation.status || "pending";
                result[key] = (result[key] || 0) + 1;
                return result;
            }, {});
            const names = (official.invitations || []).map((invitation) => invitation.player?.nickname).filter(Boolean).join(", ");
            return `
                <article class="official-card">
                    <div class="official-card-main">
                        <small>${escapeHtml(official.competition || "PARTIDO")}</small>
                        <strong>vs ${escapeHtml(official.opponent)}</strong>
                        <span>${escapeHtml(official.notes || "Sin nota adicional")}</span>
                    </div>
                    <div class="official-card-date">
                        <strong>${escapeHtml(formatDate(official.startsAt))}</strong>
                        <span>${escapeHtml(names || "Sin convocados")}</span>
                    </div>
                    <div class="official-checks">
                        <span class="confirmed">${counts.confirmed || 0} CHECK</span>
                        <span class="pending">${counts.pending || 0} PENDIENTES</span>
                        <span class="unavailable">${counts.unavailable || 0} NO PUEDEN</span>
                    </div>
                </article>
            `;
        }).join("");
    };

    const loadOfficials = async () => {
        if (!officialList) return;
        try {
            const data = await api("/api/officials");
            state.officials = data.officials || [];
            renderOfficials();
        } catch (error) {
            officialList.innerHTML = `<div class="platform-empty">${escapeHtml(error.message)}</div>`;
        }
    };

    playerForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = playerForm.querySelector('button[type="submit"]');
        const form = new FormData(playerForm);
        button.disabled = true;
        try {
            await api("/api/players", {
                method: "POST",
                headers: adminHeaders(),
                body: JSON.stringify({
                    nickname: form.get("nickname"),
                    discordUserId: form.get("discordUserId"),
                    dmOptIn: form.get("dmOptIn") === "on"
                })
            });
            playerForm.reset();
            playerForm.querySelector('[name="dmOptIn"]').checked = true;
            await loadPlayers();
            showToast("Jugador vinculado correctamente.");
        } catch (error) {
            if (error.status === 401) sessionStorage.removeItem("newcastle_admin_secret");
            showToast(error.message, "error");
        } finally {
            button.disabled = false;
        }
    });

    officialForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = officialForm.querySelector('button[type="submit"]');
        const form = new FormData(officialForm);
        const selected = [...officialForm.querySelectorAll('input[name="playerIds"]:checked')].map((input) => input.value);
        button.disabled = true;
        try {
            const startsAtRaw = String(form.get("startsAt") || "");
            const checkRaw = String(form.get("checkOpensAt") || "");
            const data = await api("/api/officials", {
                method: "POST",
                headers: adminHeaders(),
                body: JSON.stringify({
                    opponent: form.get("opponent"),
                    competition: form.get("competition"),
                    startsAt: startsAtRaw ? new Date(startsAtRaw).toISOString() : "",
                    checkOpensAt: checkRaw ? new Date(checkRaw).toISOString() : null,
                    notes: form.get("notes"),
                    playerIds: selected
                })
            });
            officialForm.reset();
            officialForm.querySelector('[name="competition"]').value = "Liga";
            await loadOfficials();
            const sent = (data.notifications || []).filter((item) => item.ok).length;
            showToast(data.warning || `Oficial creado. Avisos enviados: ${sent}.`);
        } catch (error) {
            if (error.status === 401) sessionStorage.removeItem("newcastle_admin_secret");
            showToast(error.message, "error");
        } finally {
            button.disabled = false;
        }
    });

    refreshOfficialsButton?.addEventListener("click", loadOfficials);

    const setReplayFile = (file) => {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith(".hbr2")) {
            showToast("Selecciona un archivo .hbr2.", "error");
            return;
        }
        if (file.size > 3 * 1024 * 1024) {
            showToast("La rec supera el límite de 3 MB.", "error");
            return;
        }
        state.replayFile = file;
        replayFileName.textContent = `${file.name} · ${(file.size / 1024).toFixed(1)} KB`;
    };

    replayFileInput?.addEventListener("change", () => setReplayFile(replayFileInput.files?.[0]));
    replayDrop?.addEventListener("dragover", (event) => {
        event.preventDefault();
        replayDrop.classList.add("dragging");
    });
    replayDrop?.addEventListener("dragleave", () => replayDrop.classList.remove("dragging"));
    replayDrop?.addEventListener("drop", (event) => {
        event.preventDefault();
        replayDrop.classList.remove("dragging");
        setReplayFile(event.dataTransfer?.files?.[0]);
    });

    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
        reader.onerror = () => reject(new Error("No se pudo leer la repetición."));
        reader.readAsDataURL(file);
    });

    const renderMarkdown = (text) => {
        const lines = String(text || "").split(/\r?\n/);
        let html = "";
        let inList = false;
        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (line.startsWith("## ")) {
                if (inList) { html += "</ul>"; inList = false; }
                html += `<h4>${escapeHtml(line.slice(3))}</h4>`;
            } else if (line.startsWith("- ")) {
                if (!inList) { html += "<ul>"; inList = true; }
                html += `<li>${escapeHtml(line.slice(2))}</li>`;
            } else if (line) {
                if (inList) { html += "</ul>"; inList = false; }
                html += `<p>${escapeHtml(line)}</p>`;
            }
        }
        if (inList) html += "</ul>";
        return html;
    };

    const renderReplayResult = (data) => {
        const parsed = data.parsed;
        replayMetrics.innerHTML = [
            ["DURACIÓN", parsed.durationLabel],
            ["JUGADORES", parsed.playerCount],
            ["GOLES", parsed.goalCount],
            ["VERSIÓN HBR2", parsed.version]
        ].map(([label, value]) => `<article class="replay-metric"><small>${label}</small><strong>${escapeHtml(value)}</strong></article>`).join("");

        replayGoals.innerHTML = parsed.goals.length
            ? parsed.goals.map((goal, index) => `
                <div class="replay-goal-row">
                    <span>GOL ${index + 1}</span>
                    <strong>${escapeHtml(goal.scorer)}</strong>
                    <small>Asistencia: ${escapeHtml(goal.assist || "Sin asistencia")} · ${escapeHtml(goal.team)}</small>
                </div>
            `).join("")
            : '<div class="platform-empty">No se detectaron mensajes de gol en la repetición.</div>';

        const warning = data.ai.warning ? `<p><strong>Aviso:</strong> ${escapeHtml(data.ai.warning)}</p>` : "";
        aiReport.innerHTML = warning + renderMarkdown(data.ai.text);
        replayLoading.hidden = true;
        replayPlaceholder.hidden = true;
        replayReport.hidden = false;
        replayState.textContent = data.ai.provider === "groq" ? "GROQ" : "REPORTE BÁSICO";
    };

    const analyzeFile = async (file) => {
        if (!file) {
            showToast("Primero selecciona una repetición.", "error");
            return;
        }
        analyzeReplayButton.disabled = true;
        useSampleButton.disabled = true;
        replayLoading.hidden = false;
        replayPlaceholder.hidden = true;
        replayReport.hidden = true;
        replayState.textContent = "PROCESANDO";
        try {
            const dataBase64 = await fileToBase64(file);
            const data = await api("/api/replays/analyze", {
                method: "POST",
                body: JSON.stringify({
                    fileName: file.name,
                    dataBase64,
                    playerName: replayPlayer.value.trim()
                })
            });
            renderReplayResult(data);
        } catch (error) {
            replayLoading.hidden = true;
            replayPlaceholder.hidden = false;
            replayState.textContent = "ERROR";
            showToast(error.message, "error");
        } finally {
            analyzeReplayButton.disabled = false;
            useSampleButton.disabled = false;
        }
    };

    analyzeReplayButton?.addEventListener("click", () => analyzeFile(state.replayFile));
    useSampleButton?.addEventListener("click", async () => {
        try {
            const response = await fetch("/samples/Vivet_Hostin_0-3_20260802023930.hbr2");
            if (!response.ok) throw new Error("No se pudo cargar la rec incluida.");
            const blob = await response.blob();
            const file = new File([blob], "Vivet_Hostin_0-3_20260802023930.hbr2", { type: "application/octet-stream" });
            setReplayFile(file);
            await analyzeFile(file);
        } catch (error) {
            showToast(error.message, "error");
        }
    });

    loadHealth();
    loadPlayers();
    loadOfficials();
    window.setInterval(loadOfficials, 60000);
})();
