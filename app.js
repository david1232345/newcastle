const body = document.body;
const splash = document.querySelector(".intro");
const header = document.querySelector(".site-header");
const cursorGlow = document.querySelector(".cursor-glow");
const progress = document.querySelector(".reading-line span");
const menuButton = document.querySelector(".menu-button");
const mobileMenu = document.querySelector(".mobile-menu");
const navButtons = document.querySelectorAll("[data-scroll]");
const sections = document.querySelectorAll(".section-anchor");
const reveals = document.querySelectorAll(".reveal");

const teamStorageKey = "newcastle_team_competitions_v2";
const rosterStorageKey = "newcastle_team_rosters_v2";
const datesStorageKey = "newcastle_team_dates_v2";
const lineupStorageKey = "newcastle_team_lineups_v2";
const dtSessionKey = "newcastle_team_dt_session_v2";
const simulationStorageKey = "newcastle_team_simulations_v1";
// Códigos de acceso del panel DT.
// IMPORTANTE: al estar en JavaScript del navegador, esto funciona como acceso básico,
// no como seguridad real. Para una página pública se recomienda validar en un servidor.
const dtCodes = Object.freeze({
    Dysta: "NCT2026",
    Valdo: "NCT2026"
});

const defaultTeams = ["Newcastle Team"];

const signedPlayers = [
    "D1zks",
    "dloto",
    "h2o",
    "Jockie Music",
    "Leo64",
    "luxe",
    "morata",
    "Night",
    "paulo",
    "raz.",
    "viejo(cabron)",
    "xyz",
    "zk"
];

const signedPlayerSet = new Set(signedPlayers.map((player) => player.toLocaleLowerCase("es")));
const removedPlayerKeys = new Set(["nekotina"]);

const defaultRoster = [
    "D1zks",
    "dloto",
    "h2o",
    "Jockie Music",
    "Leo64",
    "luxe",
    "morata",
    "Night",
    "paulo",
    "raz.",
    "viejo(cabron)",
    "xyz",
    "zk",
    "Alexandre Pato",
    "Apollo",
    "Hormiga God",
    "iTvoss",
    "klea",
    "mathi",
    "mostasa2",
    "nekro",
    "wl.",
    "yan",
    "09021",
    "6abix_83",
    "6sami (kenny)",
    "[AFK] andrew GS",
    "Abraham_26491",
    "adriguille",
    "AexsZK",
    "Alex(haxszcbo)",
    "AndrexC7/7",
    "Arsha",
    "bananajoies",
    "BazukeroEnPotencia",
    "Darwin Núñez",
    "Dysta",
    "GZX",
    "GZX 9.",
    "Harold",
    "Hazio(original)",
    "Hornet mala",
    "Jerito",
    "jimenez",
    "Joos",
    "jose",
    "JoseM_2314",
    "Kenny",
    "Kmada",
    "lechero",
    "leww",
    "Lex ()",
    "lloris montana",
    "malibú",
    "mathias",
    "Mehdi Ghavedi",
    "Michi7ril",
    "miguelzz288",
    "Milan",
    "Montiel",
    "Papaya",
    "Quansah",
    "queso",
    "Red Panzario",
    "ryota",
    "S-GR",
    "saed",
    "Sebas)",
    "sisi ñamñam",
    "Smfhzz",
    "Sumire",
    "the_crab",
    "Triplenelli",
    "Valdo",
    "Yasez",
    "yo-liss",
    "Zeta",
    "zida ne",
    "zsaez",
    "¿why?",
    "Matt",
    "L.Yamal",
    "Steeven"
];

const formationMap = {
    "4-3-3": [
        { role: "EI", x: 22, y: 15 },
        { role: "DC", x: 50, y: 12 },
        { role: "ED", x: 78, y: 15 },
        { role: "MC", x: 25, y: 39 },
        { role: "MCD", x: 50, y: 46 },
        { role: "MC", x: 75, y: 39 },
        { role: "LI", x: 17, y: 68 },
        { role: "DFC", x: 39, y: 72 },
        { role: "DFC", x: 61, y: 72 },
        { role: "LD", x: 83, y: 68 },
        { role: "POR", x: 50, y: 90 }
    ],
    "4-4-2": [
        { role: "DC", x: 36, y: 15 },
        { role: "DC", x: 64, y: 15 },
        { role: "MI", x: 18, y: 42 },
        { role: "MC", x: 39, y: 47 },
        { role: "MC", x: 61, y: 47 },
        { role: "MD", x: 82, y: 42 },
        { role: "LI", x: 17, y: 69 },
        { role: "DFC", x: 39, y: 73 },
        { role: "DFC", x: 61, y: 73 },
        { role: "LD", x: 83, y: 69 },
        { role: "POR", x: 50, y: 90 }
    ],
    "3-5-2": [
        { role: "DC", x: 36, y: 14 },
        { role: "DC", x: 64, y: 14 },
        { role: "MI", x: 14, y: 40 },
        { role: "MC", x: 34, y: 46 },
        { role: "MCO", x: 50, y: 36 },
        { role: "MC", x: 66, y: 46 },
        { role: "MD", x: 86, y: 40 },
        { role: "DFC", x: 25, y: 72 },
        { role: "DFC", x: 50, y: 76 },
        { role: "DFC", x: 75, y: 72 },
        { role: "POR", x: 50, y: 91 }
    ],
    "5-3-2": [
        { role: "DC", x: 36, y: 14 },
        { role: "DC", x: 64, y: 14 },
        { role: "MC", x: 27, y: 43 },
        { role: "MCD", x: 50, y: 49 },
        { role: "MC", x: 73, y: 43 },
        { role: "CAI", x: 10, y: 68 },
        { role: "DFC", x: 29, y: 73 },
        { role: "DFC", x: 50, y: 76 },
        { role: "DFC", x: 71, y: 73 },
        { role: "CAD", x: 90, y: 68 },
        { role: "POR", x: 50, y: 91 }
    ]
};

const readData = (key, fallback) => {
    try {
        const parsed = JSON.parse(localStorage.getItem(key));
        return parsed ?? structuredClone(fallback);
    } catch {
        return structuredClone(fallback);
    }
};

let teams = readData(teamStorageKey, readData("newcastle_team_competitions_v1", defaultTeams));
const legacyRosters = readData("newcastle_team_rosters_v1", {});
let rosters = readData(
    rosterStorageKey,
    Object.keys(legacyRosters).length ? legacyRosters : { "Newcastle Team": defaultRoster }
);
let dates = readData(datesStorageKey, readData("newcastle_team_dates_v1", { "Newcastle Team": [] }));
let savedLineups = readData(lineupStorageKey, readData("newcastle_team_lineups_v1", {}));
let selectedPlayer = "";
let assignments = {};
let activeDt = "Dysta";

const ensureData = () => {
    if (!Array.isArray(teams) || !teams.length) {
        teams = [...defaultTeams];
    }

    teams.forEach((team) => {
        if (!Array.isArray(rosters[team])) {
            rosters[team] = [];
        }

        rosters[team] = rosters[team].filter((player) => {
            const key = String(player).trim().toLocaleLowerCase("es");
            return key && !removedPlayerKeys.has(key);
        });

        if (!Array.isArray(dates[team])) {
            dates[team] = [];
        }
    });

    if (!teams.includes("Newcastle Team")) {
        teams.unshift("Newcastle Team");
    }

    const currentPlayers = Array.isArray(rosters["Newcastle Team"])
        ? rosters["Newcastle Team"]
        : [];

    const mergedPlayers = new Map();

    [...defaultRoster, ...currentPlayers].forEach((player) => {
        const name = String(player).trim();

        const key = name.toLocaleLowerCase("es");

        if (name && !removedPlayerKeys.has(key)) {
            mergedPlayers.set(key, name);
        }
    });

    rosters["Newcastle Team"] = [...mergedPlayers.values()];

    localStorage.setItem(teamStorageKey, JSON.stringify(teams));
    localStorage.setItem(rosterStorageKey, JSON.stringify(rosters));
    localStorage.setItem(datesStorageKey, JSON.stringify(dates));
};

ensureData();

body.classList.add("intro-active");

const closeSplash = () => {
    splash.classList.add("hidden");
    body.classList.remove("intro-active");
    window.setTimeout(() => splash.remove(), 850);
};

window.addEventListener("load", () => {
    window.setTimeout(closeSplash, 3900);
});

window.setTimeout(closeSplash, 5200);

const scrollToSection = (name) => {
    const target = document.querySelector(`[data-section="${name}"]`);

    if (!target) {
        return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    mobileMenu.classList.remove("open");
};

navButtons.forEach((button) => {
    button.addEventListener("click", () => scrollToSection(button.dataset.scroll));
});

menuButton.addEventListener("click", () => {
    mobileMenu.classList.toggle("open");
});

const updateScroll = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
    progress.style.width = `${Math.min(ratio, 1) * 100}%`;
    header.classList.toggle("compact", window.scrollY > 35);
};

window.addEventListener("scroll", updateScroll, { passive: true });
updateScroll();

const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                revealObserver.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.14 }
);

reveals.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min((index % 5) * 55, 220)}ms`;
    revealObserver.observe(element);
});

const navObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            document.querySelectorAll(".desktop-nav button").forEach((button) => {
                button.classList.toggle("active", button.dataset.scroll === entry.target.dataset.section);
            });
        });
    },
    { rootMargin: "-35% 0px -55% 0px" }
);

sections.forEach((section) => navObserver.observe(section));

const calendarTeamSelect = document.querySelector(".calendar-team-select");
const calendarFilterSelect = document.querySelector(".calendar-filter-select");
const dateList = document.querySelector("[data-date-list]");
const dateEmpty = document.querySelector("[data-date-empty]");
const nextDate = document.querySelector("[data-next-date]");
const nextEvent = document.querySelector("[data-next-event]");
const dateCount = document.querySelector("[data-date-count]");
const confirmedCount = document.querySelector("[data-confirmed-count]");
const homeNextDate = document.querySelector("[data-home-next-date]");
const homeRosterCount = document.querySelector("[data-home-roster-count]");
const homeActiveTeam = document.querySelector("[data-home-active-team]");

const lineupTeamSelect = document.querySelector(".lineup-team-select");
const formationSelect = document.querySelector(".formation-select");
const lineupName = document.querySelector(".lineup-name");
const playerSearch = document.querySelector(".player-search");
const rosterList = document.querySelector("[data-roster-list]");
const rosterCount = document.querySelector("[data-roster-count]");
const rosterEmpty = document.querySelector("[data-roster-empty]");
const pickedPlayer = document.querySelector("[data-picked-player]");
const pitchTitle = document.querySelector("[data-pitch-title]");
const pitchSlots = document.querySelector("[data-pitch-slots]");

const dtModal = document.querySelector("[data-dt-modal]");
const dtLoginView = document.querySelector("[data-dt-login-view]");
const dtEditor = document.querySelector("[data-dt-editor]");
const dtCodeInput = document.querySelector(".dt-code");
const dtLoginMessage = document.querySelector(".dt-login-message");
const activeDtLabel = document.querySelector("[data-active-dt]");
const dtPlayerTeam = document.querySelector(".dt-player-team");
const dtPlayerName = document.querySelector(".dt-player-name");
const editorPlayerCount = document.querySelector("[data-editor-player-count]");
const editorPlayerList = document.querySelector("[data-editor-player-list]");
const dtDateTeam = document.querySelector(".dt-date-team");
const editorDateList = document.querySelector("[data-editor-date-list]");
const dtTeamName = document.querySelector(".dt-team-name");
const editorTeamList = document.querySelector("[data-editor-team-list]");

const fillSelect = (select, currentValue = "") => {
    const value = currentValue || select.value || teams[0];
    select.innerHTML = teams.map((team) => `<option value="${team}">${team}</option>`).join("");
    select.value = teams.includes(value) ? value : teams[0];
};

const refreshAllSelects = () => {
    [calendarTeamSelect, lineupTeamSelect, dtPlayerTeam, dtDateTeam].filter(Boolean).forEach((select) => {
        fillSelect(select);
    });
};

const initials = (name) => {
    const cleaned = name.replace(/[^\p{L}\p{N}\s]/gu, " ").trim();
    const pieces = cleaned.split(/\s+/).filter(Boolean);

    if (!pieces.length) {
        return "NT";
    }

    if (pieces.length === 1) {
        return pieces[0].slice(0, 2).toUpperCase();
    }

    return `${pieces[0][0]}${pieces[1][0]}`.toUpperCase();
};

const formatDate = (value) => {
    if (!value) {
        return { day: "SIN", month: "FECHA", full: "Por confirmar" };
    }

    const date = new Date(`${value}T12:00:00`);

    return {
        day: new Intl.DateTimeFormat("es-MX", { day: "2-digit" }).format(date),
        month: new Intl.DateTimeFormat("es-MX", { month: "short" }).format(date).replace(".", "").toUpperCase(),
        full: new Intl.DateTimeFormat("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(date)
    };
};

const stateLabels = {
    pending: "Pendiente",
    confirmed: "Confirmada",
    finished: "Finalizada"
};

const renderDates = () => {
    const team = calendarTeamSelect.value;
    const filter = calendarFilterSelect.value;
    const allDates = [...dates[team]];
    const visibleDates = allDates
        .filter((item) => filter === "all" || item.status === filter)
        .sort((a, b) => {
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;
            return `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`);
        });

    dateList.innerHTML = visibleDates.map((item) => {
        const date = formatDate(item.date);
        const detail = [item.detail, item.time ? `${item.time} h` : ""].filter(Boolean).join(" · ");

        return `
            <article class="date-card">
                <div class="date-block">
                    <strong>${date.day}</strong>
                    <span>${date.month}</span>
                </div>
                <div class="date-copy">
                    <small>${team.toUpperCase()}</small>
                    <h3>${item.title}</h3>
                    <p>${detail || "Información por confirmar"}</p>
                </div>
                <div class="date-state">
                    <span class="${item.status}">${stateLabels[item.status]}</span>
                    <small>${date.full}</small>
                </div>
            </article>
        `;
    }).join("");

    dateEmpty.hidden = visibleDates.length > 0;
    dateCount.textContent = String(allDates.length);

    const confirmed = allDates.filter((item) => item.status === "confirmed" && item.date);
    confirmedCount.textContent = String(confirmed.length);

    const upcoming = allDates
        .filter((item) => item.date && item.status !== "finished")
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0];

    if (upcoming) {
        const formatted = formatDate(upcoming.date);
        const shortValue = upcoming.time
            ? `${formatted.day} ${formatted.month} · ${upcoming.time}`
            : `${formatted.day} ${formatted.month}`;

        nextDate.textContent = shortValue;
        nextEvent.textContent = upcoming.title;
        homeNextDate.textContent = shortValue;
    } else {
        nextDate.textContent = "Por confirmar";
        nextEvent.textContent = allDates[0]?.title || "Sin fecha cargada";
        homeNextDate.textContent = "Por confirmar";
    }

    homeActiveTeam.textContent = team;
};

const setSelectedPlayer = (player) => {
    selectedPlayer = player;
    pickedPlayer.textContent = player || "Ninguno";

    document.querySelectorAll(".roster-player").forEach((button) => {
        button.classList.toggle("selected", button.dataset.player === player);
    });
};

const renderRoster = () => {
    const team = lineupTeamSelect.value;
    const query = playerSearch.value.trim().toLowerCase();
    const players = [...rosters[team]]
        .sort((a, b) => a.localeCompare(b, "es"))
        .filter((player) => player.toLowerCase().includes(query));

    rosterCount.textContent = `${rosters[team].length} jugadores`;
    rosterEmpty.hidden = rosters[team].length > 0;
    homeRosterCount.textContent = String(rosters["Newcastle Team"]?.length || 0);

    rosterList.innerHTML = players.map((player) => {
        const isSigned = signedPlayerSet.has(player.toLocaleLowerCase("es"));
        const status = isSigned ? '<span>FICHADO</span>' : '';

        return `
            <button class="roster-player${selectedPlayer === player ? " selected" : ""}" type="button" data-player="${player}" draggable="true">
                <span class="player-initials">${initials(player)}</span>
                <strong>${player}</strong>
                ${status}
            </button>
        `;
    }).join("");

    rosterList.querySelectorAll(".roster-player").forEach((button) => {
        button.addEventListener("click", () => setSelectedPlayer(button.dataset.player));
        button.addEventListener("dragstart", (event) => {
            event.dataTransfer.setData("text/plain", button.dataset.player);
            setSelectedPlayer(button.dataset.player);
        });
    });
};

const assignPlayer = (player, slotIndex) => {
    if (!player) {
        return;
    }

    Object.keys(assignments).forEach((key) => {
        if (assignments[key] === player) {
            delete assignments[key];
        }
    });

    assignments[slotIndex] = player;
    setSelectedPlayer("");
    renderPitch();
};

const renderPitch = () => {
    const formation = formationSelect.value;
    const team = lineupTeamSelect.value;
    const positions = formationMap[formation];

    pitchTitle.textContent = `${team} · ${formation}`;

    pitchSlots.innerHTML = positions.map((position, index) => {
        const player = assignments[index] || "";

        return `
            <button
                class="pitch-slot${player ? " filled" : ""}"
                type="button"
                data-slot="${index}"
                style="left:${position.x}%;top:${position.y}%"
            >
                <span class="slot-number">${index + 1}</span>
                <span class="slot-role">${position.role}</span>
                <strong class="slot-player">${player || "VACÍO"}</strong>
            </button>
        `;
    }).join("");

    pitchSlots.querySelectorAll(".pitch-slot").forEach((slot) => {
        slot.addEventListener("dragover", (event) => event.preventDefault());

        slot.addEventListener("drop", (event) => {
            event.preventDefault();
            assignPlayer(event.dataTransfer.getData("text/plain"), Number(slot.dataset.slot));
        });

        slot.addEventListener("click", () => {
            const index = Number(slot.dataset.slot);
            const current = assignments[index];

            if (selectedPlayer) {
                assignPlayer(selectedPlayer, index);
                return;
            }

            if (current) {
                delete assignments[index];
                setSelectedPlayer(current);
                renderPitch();
            }
        });
    });
};

const clearLineup = () => {
    assignments = {};
    setSelectedPlayer("");
    renderPitch();
};

const lineupKey = () => `${lineupTeamSelect.value}__${formationSelect.value}`;

const saveLineup = () => {
    savedLineups[lineupKey()] = {
        name: lineupName.value.trim(),
        team: lineupTeamSelect.value,
        formation: formationSelect.value,
        assignments: { ...assignments }
    };

    localStorage.setItem(lineupStorageKey, JSON.stringify(savedLineups));
    window.alert("Alineación guardada en este navegador.");
};

const loadLineup = () => {
    const saved = savedLineups[lineupKey()];

    if (!saved) {
        window.alert("No hay una alineación guardada para esta competencia y formación.");
        return;
    }

    lineupName.value = saved.name || "";
    assignments = { ...saved.assignments };
    setSelectedPlayer("");
    renderPitch();
};

const lineupText = () => {
    const formation = formationSelect.value;
    const positions = formationMap[formation];
    const lines = [
        lineupName.value.trim() || "Alineación",
        `${lineupTeamSelect.value} · ${formation}`,
        ""
    ];

    positions.forEach((position, index) => {
        lines.push(`${index + 1}. ${position.role} — ${assignments[index] || "Sin jugador"}`);
    });

    return lines.join("\n");
};

const copyLineup = async () => {
    const text = lineupText();

    try {
        await navigator.clipboard.writeText(text);
        window.alert("Alineación copiada.");
    } catch {
        window.prompt("Copia la alineación:", text);
    }
};

const downloadLineup = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const context = canvas.getContext("2d");
    const formation = formationSelect.value;
    const positions = formationMap[formation];

    const background = context.createLinearGradient(0, 0, 1080, 1350);
    background.addColorStop(0, "rgb(5, 7, 9)");
    background.addColorStop(1, "rgb(13, 43, 51)");
    context.fillStyle = background;
    context.fillRect(0, 0, 1080, 1350);

    context.strokeStyle = "rgba(239, 243, 245, 0.36)";
    context.lineWidth = 4;
    context.strokeRect(70, 175, 940, 1080);

    context.beginPath();
    context.moveTo(70, 715);
    context.lineTo(1010, 715);
    context.stroke();

    context.beginPath();
    context.arc(540, 715, 120, 0, Math.PI * 2);
    context.stroke();

    context.strokeRect(300, 175, 480, 180);
    context.strokeRect(300, 1075, 480, 180);

    context.fillStyle = "rgb(239, 243, 245)";
    context.font = "700 56px Arial";
    context.fillText(lineupName.value.trim() || "Alineación", 70, 85);

    context.fillStyle = "rgb(166, 177, 184)";
    context.font = "28px Arial";
    context.fillText(`${lineupTeamSelect.value} · ${formation}`, 70, 130);

    positions.forEach((position, index) => {
        const x = 70 + position.x / 100 * 940;
        const y = 175 + position.y / 100 * 1080;
        const player = assignments[index] || "Sin jugador";

        context.beginPath();
        context.arc(x, y, 42, 0, Math.PI * 2);
        context.fillStyle = "rgb(226, 173, 61)";
        context.fill();

        context.fillStyle = "rgb(5, 7, 9)";
        context.font = "700 24px Arial";
        context.textAlign = "center";
        context.fillText(String(index + 1), x, y + 8);

        context.fillStyle = "rgb(239, 243, 245)";
        context.font = "700 22px Arial";
        context.fillText(player.slice(0, 20), x, y + 76);

        context.fillStyle = "rgb(72, 199, 230)";
        context.font = "17px Arial";
        context.fillText(position.role, x, y + 102);
    });

    context.textAlign = "left";
    context.fillStyle = "rgb(166, 177, 184)";
    context.font = "22px Arial";
    context.fillText("NEWCASTLE TEAM", 70, 1310);

    const link = document.createElement("a");
    link.download = `${(lineupName.value.trim() || "alineacion").replace(/\s+/g, "-").toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
};

const openDtModal = () => {
    dtModal.classList.add("open");
    dtModal.setAttribute("aria-hidden", "false");
    body.classList.add("no-scroll");

    const session = sessionStorage.getItem(dtSessionKey);

    if (session) {
        activeDt = session;
        showEditor();
    }
};

const closeDtModal = () => {
    dtModal.classList.remove("open");
    dtModal.setAttribute("aria-hidden", "true");
    body.classList.remove("no-scroll");
};

const showEditor = () => {
    dtLoginView.hidden = true;
    dtEditor.hidden = false;
    activeDtLabel.textContent = activeDt;
    refreshAllSelects();
    renderEditorPlayers();
    renderEditorDates();
    renderEditorTeams();
    initializeSimulationEditor();
};

const renderEditorPlayers = () => {
    const team = dtPlayerTeam.value;
    const players = [...rosters[team]].sort((a, b) => a.localeCompare(b, "es"));
    editorPlayerCount.textContent = `${players.length} jugadores`;

    editorPlayerList.innerHTML = players.map((player) => `
        <div class="editor-row">
            <span>${player}</span>
            <button type="button" data-remove-player="${player}">QUITAR</button>
        </div>
    `).join("");

    editorPlayerList.querySelectorAll("[data-remove-player]").forEach((button) => {
        button.addEventListener("click", () => {
            rosters[team] = rosters[team].filter((player) => player !== button.dataset.removePlayer);
            localStorage.setItem(rosterStorageKey, JSON.stringify(rosters));
            renderEditorPlayers();

            if (lineupTeamSelect.value === team) {
                renderRoster();
            }
        });
    });
};

const renderEditorDates = () => {
    const team = dtDateTeam.value;

    editorDateList.innerHTML = dates[team].map((item) => {
        const formatted = formatDate(item.date);
        const detail = item.date
            ? `${formatted.full}${item.time ? ` · ${item.time}` : ""}`
            : "Fecha por confirmar";

        return `
            <div class="editor-row">
                <div>
                    <strong>${item.title}</strong>
                    <small>${detail}</small>
                </div>
                <button type="button" data-remove-date="${item.id}">QUITAR</button>
            </div>
        `;
    }).join("");

    editorDateList.querySelectorAll("[data-remove-date]").forEach((button) => {
        button.addEventListener("click", () => {
            dates[team] = dates[team].filter((item) => item.id !== button.dataset.removeDate);
            localStorage.setItem(datesStorageKey, JSON.stringify(dates));
            renderEditorDates();

            if (calendarTeamSelect.value === team) {
                renderDates();
            }
        });
    });
};

const renderEditorTeams = () => {
    editorTeamList.innerHTML = teams.map((team) => `
        <div class="editor-row">
            <span>${team}</span>
            ${team === "Newcastle Team" ? "" : `<button type="button" data-remove-team="${team}">QUITAR</button>`}
        </div>
    `).join("");

    editorTeamList.querySelectorAll("[data-remove-team]").forEach((button) => {
        button.addEventListener("click", () => {
            const team = button.dataset.removeTeam;
            teams = teams.filter((name) => name !== team);
            delete rosters[team];
            delete dates[team];

            localStorage.setItem(teamStorageKey, JSON.stringify(teams));
            localStorage.setItem(rosterStorageKey, JSON.stringify(rosters));
            localStorage.setItem(datesStorageKey, JSON.stringify(dates));

            refreshAllSelects();
            renderEditorTeams();
            renderEditorPlayers();
            renderEditorDates();
            renderDates();
            renderRoster();
            renderPitch();
        });
    });
};

document.querySelectorAll("[data-open-dt]").forEach((button) => {
    button.addEventListener("click", openDtModal);
});

document.querySelectorAll("[data-close-dt]").forEach((button) => {
    button.addEventListener("click", closeDtModal);
});

document.querySelectorAll("[data-dt-name]").forEach((button) => {
    button.addEventListener("click", () => {
        document.querySelectorAll("[data-dt-name]").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        activeDt = button.dataset.dtName;
    });
});

document.querySelector(".dt-login-submit").addEventListener("click", () => {
    if (dtCodeInput.value.trim() !== dtCodes[activeDt]) {
        dtLoginMessage.textContent = "El código no es correcto.";
        return;
    }

    sessionStorage.setItem(dtSessionKey, activeDt);
    dtLoginMessage.textContent = "";
    dtCodeInput.value = "";
    showEditor();
});

dtCodeInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        document.querySelector(".dt-login-submit").click();
    }
});

document.querySelector("[data-dt-logout]").addEventListener("click", () => {
    sessionStorage.removeItem(dtSessionKey);
    dtEditor.hidden = true;
    dtLoginView.hidden = false;
});

document.querySelectorAll("[data-dt-tab]").forEach((button) => {
    button.addEventListener("click", () => {
        document.querySelectorAll("[data-dt-tab]").forEach((tab) => {
            tab.classList.toggle("active", tab === button);
        });

        document.querySelectorAll("[data-dt-panel]").forEach((panel) => {
            panel.classList.toggle("active", panel.dataset.dtPanel === button.dataset.dtTab);
        });
    });
});

document.querySelector(".dt-add-player").addEventListener("click", () => {
    const team = dtPlayerTeam.value;
    const player = dtPlayerName.value.trim();

    if (!player) {
        return;
    }

    if (removedPlayerKeys.has(player.toLocaleLowerCase("es"))) {
        window.alert("Este jugador fue retirado de la plantilla.");
        dtPlayerName.value = "";
        return;
    }

    if (!rosters[team].some((name) => name.toLowerCase() === player.toLowerCase())) {
        rosters[team].push(player);
        localStorage.setItem(rosterStorageKey, JSON.stringify(rosters));
    }

    dtPlayerName.value = "";
    renderEditorPlayers();

    if (lineupTeamSelect.value === team) {
        renderRoster();
    }
});

document.querySelector(".dt-add-date").addEventListener("click", () => {
    const team = dtDateTeam.value;
    const titleInput = document.querySelector(".dt-date-title");
    const dateInput = document.querySelector(".dt-date-value");
    const timeInput = document.querySelector(".dt-date-time");
    const detailInput = document.querySelector(".dt-date-detail");
    const statusInput = document.querySelector(".dt-date-status");
    const title = titleInput.value.trim();

    if (!title) {
        window.alert("Escribe el nombre de la fecha o jornada.");
        return;
    }

    dates[team].push({
        id: crypto.randomUUID(),
        title,
        date: dateInput.value,
        time: timeInput.value,
        detail: detailInput.value.trim(),
        status: statusInput.value
    });

    localStorage.setItem(datesStorageKey, JSON.stringify(dates));

    titleInput.value = "";
    dateInput.value = "";
    timeInput.value = "";
    detailInput.value = "";
    statusInput.value = "pending";

    renderEditorDates();

    if (calendarTeamSelect.value === team) {
        renderDates();
    }
});

document.querySelector(".dt-add-team").addEventListener("click", () => {
    const team = dtTeamName.value.trim();

    if (!team) {
        return;
    }

    if (!teams.some((name) => name.toLowerCase() === team.toLowerCase())) {
        teams.push(team);
        rosters[team] = [];
        dates[team] = [];

        localStorage.setItem(teamStorageKey, JSON.stringify(teams));
        localStorage.setItem(rosterStorageKey, JSON.stringify(rosters));
        localStorage.setItem(datesStorageKey, JSON.stringify(dates));
    }

    dtTeamName.value = "";
    refreshAllSelects();
    renderEditorTeams();
});

calendarTeamSelect.addEventListener("change", renderDates);
calendarFilterSelect.addEventListener("change", renderDates);

lineupTeamSelect.addEventListener("change", () => {
    selectedPlayer = "";
    assignments = {};
    pickedPlayer.textContent = "Ninguno";
    renderRoster();
    renderPitch();
});

formationSelect.addEventListener("change", () => {
    assignments = {};
    renderPitch();
});

playerSearch.addEventListener("input", renderRoster);
dtPlayerTeam.addEventListener("change", renderEditorPlayers);
dtDateTeam.addEventListener("change", renderEditorDates);

document.querySelector("[data-save-lineup]").addEventListener("click", saveLineup);
document.querySelector("[data-clear-lineup]").addEventListener("click", clearLineup);
document.querySelector("[data-load-lineup]").addEventListener("click", loadLineup);
document.querySelector("[data-copy-lineup]").addEventListener("click", copyLineup);
document.querySelector("[data-download-lineup]").addEventListener("click", downloadLineup);

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dtModal.classList.contains("open")) {
        closeDtModal();
    }
});



if (window.matchMedia("(pointer: fine)").matches) {
    document.addEventListener("pointermove", (event) => {
        if (!cursorGlow) {
            return;
        }

        cursorGlow.style.left = `${event.clientX}px`;
        cursorGlow.style.top = `${event.clientY}px`;
        cursorGlow.style.opacity = "1";
    });

    document.addEventListener("pointerleave", () => {
        if (cursorGlow) {
            cursorGlow.style.opacity = "0";
        }
    });

    document.querySelectorAll("[data-parallax]").forEach((element) => {
        element.addEventListener("pointermove", (event) => {
            const rect = element.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            element.style.transform = `perspective(1050px) rotateX(${y * -3.2}deg) rotateY(${x * 4.2}deg) translateY(-3px)`;
        });

        element.addEventListener("pointerleave", () => {
            element.style.transform = "";
        });
    });

    document.querySelectorAll(".date-card, .coach-card, .simulation-notes").forEach((card) => {
        card.addEventListener("pointermove", (event) => {
            const rect = card.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `perspective(900px) rotateX(${y * -1.8}deg) rotateY(${x * 2.2}deg) translateY(-4px)`;
        });

        card.addEventListener("pointerleave", () => {
            card.style.transform = "";
        });
    });
}



const makeId = () => {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }

    return `sim-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const defaultSimulations = [
    {
        id: "salida-derecha",
        team: "Newcastle Team",
        title: "Salida por derecha",
        description: "El portero juega con el central. El lateral se abre, el medio se acerca para dar apoyo y el extremo recibe por fuera.",
        players: [
            { name: "D1zks", x: 50, y: 89 },
            { name: "dloto", x: 38, y: 74 },
            { name: "h2o", x: 63, y: 74 },
            { name: "Jockie Music", x: 82, y: 61 },
            { name: "Leo64", x: 58, y: 51 },
            { name: "luxe", x: 80, y: 39 },
            { name: "morata", x: 58, y: 26 },
            { name: "Night", x: 81, y: 14 }
        ],
        passes: [
            { from: 0, to: 2 },
            { from: 2, to: 3 },
            { from: 3, to: 4 },
            { from: 4, to: 5 },
            { from: 5, to: 7 }
        ]
    },
    {
        id: "apoyo-interior",
        team: "Newcastle Team",
        title: "Apoyo por dentro",
        description: "El central conduce unos metros, encuentra al medio por dentro y el delantero descarga de primera para que llegue un compañero de frente.",
        players: [
            { name: "D1zks", x: 50, y: 89 },
            { name: "dloto", x: 42, y: 73 },
            { name: "Leo64", x: 50, y: 54 },
            { name: "morata", x: 50, y: 31 },
            { name: "Night", x: 68, y: 19 },
            { name: "luxe", x: 72, y: 44 }
        ],
        passes: [
            { from: 0, to: 1 },
            { from: 1, to: 2 },
            { from: 2, to: 3 },
            { from: 3, to: 5 },
            { from: 5, to: 4 }
        ]
    }
];

let simulations = readData(simulationStorageKey, defaultSimulations);

if (!Array.isArray(simulations) || !simulations.length) {
    simulations = structuredClone(defaultSimulations);
}

const simulationSelect = document.querySelector(".simulation-select");
const simulationSpeed = document.querySelector(".simulation-speed");
const simulationPlayButton = document.querySelector(".simulation-play");
const simulationResetButton = document.querySelector(".simulation-reset");
const simulationTitle = document.querySelector("[data-simulation-title]");
const simulationStep = document.querySelector("[data-simulation-step]");
const simulationDescription = document.querySelector("[data-simulation-description]");
const simulationRoute = document.querySelector("[data-simulation-route]");
const simulationLines = document.querySelector("[data-simulation-lines]");
const simulationMarkers = document.querySelector("[data-simulation-markers]");
const simulationBall = document.querySelector("[data-simulation-ball]");

const dtSimulationSelect = document.querySelector(".dt-simulation-select");
const dtSimulationTeam = document.querySelector(".dt-simulation-team");
const dtSimulationTitle = document.querySelector(".dt-simulation-title");
const dtSimulationDescription = document.querySelector(".dt-simulation-description");
const dtSimulationPlayer = document.querySelector(".dt-simulation-player");
const dtSimulationPitch = document.querySelector("[data-dt-simulation-pitch]");
const dtSimulationLines = document.querySelector("[data-dt-simulation-lines]");
const dtSimulationMarkers = document.querySelector("[data-dt-simulation-markers]");
const dtSimulationStatus = document.querySelector("[data-sim-editor-status]");
const dtPassModeButton = document.querySelector("[data-sim-pass-mode]");

let activeSimulationId = simulations[0].id;
let simulationFrame = 0;
let simulationRunToken = 0;
let workingSimulation = structuredClone(simulations[0]);
let editorSelectedPlayer = -1;
let editorPassSource = -1;
let editorPassMode = false;

const currentSimulation = () => simulations.find((simulation) => simulation.id === activeSimulationId) || simulations[0];

const arrowDefinition = (id) => `
    <defs>
        <marker id="${id}" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L6,3 z" fill="rgb(224, 175, 69)"></path>
        </marker>
    </defs>
`;

const fillSimulationSelect = (select, value = "") => {
    if (!select) {
        return;
    }

    select.innerHTML = simulations.map((simulation) => `<option value="${simulation.id}">${simulation.title}</option>`).join("");
    select.value = simulations.some((simulation) => simulation.id === value) ? value : simulations[0].id;
};

const renderPassLines = (svg, simulation, activeIndex = -1, markerId = "pass-arrow") => {
    if (!svg) {
        return;
    }

    const lines = simulation.passes.map((pass, index) => {
        const from = simulation.players[pass.from];
        const to = simulation.players[pass.to];

        if (!from || !to) {
            return "";
        }

        return `<line class="simulation-pass-line${index === activeIndex ? " active" : ""}" data-pass-index="${index}" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" marker-end="url(#${markerId})"></line>`;
    }).join("");

    svg.innerHTML = arrowDefinition(markerId) + lines;
};

const renderPublicSimulation = () => {
    if (!simulationSelect) {
        return;
    }

    const simulation = currentSimulation();
    simulationSelect.value = simulation.id;
    simulationTitle.textContent = simulation.title;
    simulationDescription.textContent = simulation.description || "Sin indicaciones cargadas.";
    simulationStep.textContent = "Lista para reproducir";

    simulationMarkers.innerHTML = simulation.players.map((player, index) => `
        <div class="simulation-marker" data-public-player="${index}" data-number="${index + 1}" style="left:${player.x}%;top:${player.y}%">
            <span>${player.name}</span>
        </div>
    `).join("");

    renderPassLines(simulationLines, simulation, -1, "public-pass-arrow");

    simulationRoute.innerHTML = simulation.passes.map((pass) => {
        const from = simulation.players[pass.from]?.name || "Jugador";
        const to = simulation.players[pass.to]?.name || "Jugador";
        return `<li>${from} pasa con ${to}</li>`;
    }).join("") || "<li>El DT todavía no ha marcado pases.</li>";

    resetSimulation();
};

const setPublicBall = (x, y, visible = true) => {
    simulationBall.style.left = `${x}%`;
    simulationBall.style.top = `${y}%`;
    simulationBall.classList.toggle("visible", visible);
};

const resetSimulation = () => {
    simulationRunToken += 1;
    cancelAnimationFrame(simulationFrame);
    const simulation = currentSimulation();
    const firstPass = simulation.passes[0];
    const firstPlayer = firstPass ? simulation.players[firstPass.from] : simulation.players[0];

    document.querySelectorAll(".simulation-pass-line, .simulation-marker").forEach((element) => {
        element.classList.remove("active");
    });

    simulationStep.textContent = "Lista para reproducir";

    if (firstPlayer) {
        setPublicBall(firstPlayer.x, firstPlayer.y, true);
    } else {
        setPublicBall(50, 50, false);
    }
};

const animateSegment = (from, to, duration, token) => new Promise((resolve) => {
    const start = performance.now();

    const frame = (time) => {
        if (token !== simulationRunToken) {
            resolve(false);
            return;
        }

        const rawProgress = Math.min((time - start) / duration, 1);
        const progress = rawProgress < 0.5
            ? 2 * rawProgress * rawProgress
            : 1 - Math.pow(-2 * rawProgress + 2, 2) / 2;

        setPublicBall(
            from.x + (to.x - from.x) * progress,
            from.y + (to.y - from.y) * progress,
            true
        );

        if (rawProgress < 1) {
            simulationFrame = requestAnimationFrame(frame);
        } else {
            resolve(true);
        }
    };

    simulationFrame = requestAnimationFrame(frame);
});

const playSimulation = async () => {
    const simulation = currentSimulation();

    if (!simulation.passes.length) {
        simulationStep.textContent = "Esta jugada todavía no tiene pases";
        return;
    }

    resetSimulation();
    const token = simulationRunToken;
    const speed = Number(simulationSpeed.value) || 1;

    for (let index = 0; index < simulation.passes.length; index += 1) {
        if (token !== simulationRunToken) {
            return;
        }

        const pass = simulation.passes[index];
        const from = simulation.players[pass.from];
        const to = simulation.players[pass.to];

        if (!from || !to) {
            continue;
        }

        document.querySelectorAll("[data-simulation-lines] .simulation-pass-line").forEach((line) => {
            line.classList.toggle("active", Number(line.dataset.passIndex) === index);
        });

        document.querySelectorAll("[data-simulation-markers] .simulation-marker").forEach((marker) => {
            const playerIndex = Number(marker.dataset.publicPlayer);
            marker.classList.toggle("active", playerIndex === pass.from || playerIndex === pass.to);
        });

        simulationStep.textContent = `${from.name} → ${to.name}`;
        const completed = await animateSegment(from, to, 900 * speed, token);

        if (!completed) {
            return;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 180 * speed));
    }

    if (token === simulationRunToken) {
        simulationStep.textContent = "Jugada terminada";
        document.querySelectorAll("[data-simulation-lines] .simulation-pass-line").forEach((line) => line.classList.remove("active"));
        document.querySelectorAll("[data-simulation-markers] .simulation-marker").forEach((marker) => marker.classList.remove("active"));
    }
};

const fillSimulationTeams = () => {
    if (!dtSimulationTeam) {
        return;
    }

    const current = workingSimulation.team || teams[0];
    dtSimulationTeam.innerHTML = teams.map((team) => `<option value="${team}">${team}</option>`).join("");
    dtSimulationTeam.value = teams.includes(current) ? current : teams[0];
};

const fillSimulationPlayers = () => {
    if (!dtSimulationPlayer || !dtSimulationTeam) {
        return;
    }

    const players = rosters[dtSimulationTeam.value] || [];
    dtSimulationPlayer.innerHTML = players
        .slice()
        .sort((a, b) => a.localeCompare(b, "es"))
        .map((player) => `<option value="${player}">${player}</option>`)
        .join("");
};

const renderEditorSimulation = () => {
    if (!dtSimulationMarkers) {
        return;
    }

    dtSimulationTitle.value = workingSimulation.title || "";
    dtSimulationDescription.value = workingSimulation.description || "";
    fillSimulationTeams();
    fillSimulationPlayers();

    dtSimulationMarkers.innerHTML = workingSimulation.players.map((player, index) => `
        <button class="simulation-marker${editorSelectedPlayer === index ? " editor-selected" : ""}${editorPassSource === index ? " pass-source" : ""}" type="button" data-editor-player="${index}" data-number="${index + 1}" style="left:${player.x}%;top:${player.y}%">
            <span>${player.name}</span>
        </button>
    `).join("");

    renderPassLines(dtSimulationLines, workingSimulation, -1, "editor-pass-arrow");

    dtSimulationMarkers.querySelectorAll("[data-editor-player]").forEach((marker) => {
        const index = Number(marker.dataset.editorPlayer);
        let moved = false;
        let startX = 0;
        let startY = 0;

        marker.addEventListener("pointerdown", (event) => {
            event.preventDefault();
            moved = false;
            startX = event.clientX;
            startY = event.clientY;
            marker.setPointerCapture(event.pointerId);

            const move = (moveEvent) => {
                const rect = dtSimulationPitch.getBoundingClientRect();
                const x = Math.min(95, Math.max(5, (moveEvent.clientX - rect.left) / rect.width * 100));
                const y = Math.min(95, Math.max(5, (moveEvent.clientY - rect.top) / rect.height * 100));

                if (Math.abs(moveEvent.clientX - startX) > 3 || Math.abs(moveEvent.clientY - startY) > 3) {
                    moved = true;
                }

                workingSimulation.players[index].x = Number(x.toFixed(2));
                workingSimulation.players[index].y = Number(y.toFixed(2));
                marker.style.left = `${x}%`;
                marker.style.top = `${y}%`;
                renderPassLines(dtSimulationLines, workingSimulation, -1, "editor-pass-arrow");
            };

            const up = () => {
                marker.removeEventListener("pointermove", move);
                marker.removeEventListener("pointerup", up);
                marker.removeEventListener("pointercancel", up);

                if (!moved) {
                    handleEditorMarkerClick(index);
                }
            };

            marker.addEventListener("pointermove", move);
            marker.addEventListener("pointerup", up);
            marker.addEventListener("pointercancel", up);
        });
    });
};

const handleEditorMarkerClick = (index) => {
    if (editorPassMode) {
        if (editorPassSource < 0) {
            editorPassSource = index;
            dtSimulationStatus.textContent = "Ahora selecciona el jugador que recibirá el pase.";
        } else if (editorPassSource !== index) {
            workingSimulation.passes.push({ from: editorPassSource, to: index });
            editorPassSource = -1;
            editorPassMode = false;
            dtPassModeButton.classList.remove("active");
            dtSimulationStatus.textContent = "Pase añadido. Puedes guardar la jugada.";
        }
    } else {
        editorSelectedPlayer = index;
        dtSimulationStatus.textContent = `${workingSimulation.players[index].name} seleccionado.`;
    }

    renderEditorSimulation();
};

const loadWorkingSimulation = (id) => {
    const simulation = simulations.find((item) => item.id === id) || simulations[0];
    workingSimulation = structuredClone(simulation);
    editorSelectedPlayer = -1;
    editorPassSource = -1;
    editorPassMode = false;
    dtPassModeButton?.classList.remove("active");
    renderEditorSimulation();
};

const refreshSimulationOptions = () => {
    fillSimulationSelect(simulationSelect, activeSimulationId);
    fillSimulationSelect(dtSimulationSelect, workingSimulation?.id);
};

function initializeSimulationEditor() {
    if (!dtSimulationSelect) {
        return;
    }

    refreshSimulationOptions();
    loadWorkingSimulation(dtSimulationSelect.value);
}

simulationSelect?.addEventListener("change", () => {
    activeSimulationId = simulationSelect.value;
    renderPublicSimulation();
});

simulationPlayButton?.addEventListener("click", playSimulation);
simulationResetButton?.addEventListener("click", resetSimulation);

document.querySelectorAll("[data-open-simulation-editor]").forEach((button) => {
    button.addEventListener("click", () => {
        window.setTimeout(() => {
            const tab = document.querySelector('[data-dt-tab="simulations"]');
            tab?.click();
        }, 80);
    });
});

dtSimulationSelect?.addEventListener("change", () => loadWorkingSimulation(dtSimulationSelect.value));

dtSimulationTeam?.addEventListener("change", () => {
    workingSimulation.team = dtSimulationTeam.value;
    fillSimulationPlayers();
});

document.querySelector("[data-sim-add-player]")?.addEventListener("click", () => {
    const player = dtSimulationPlayer.value;

    if (!player) {
        return;
    }

    if (workingSimulation.players.some((item) => item.name.toLocaleLowerCase("es") === player.toLocaleLowerCase("es"))) {
        window.alert("Ese jugador ya está en la jugada.");
        return;
    }

    const index = workingSimulation.players.length;
    const column = index % 4;
    const row = Math.floor(index / 4);
    workingSimulation.players.push({
        name: player,
        x: 20 + column * 20,
        y: Math.min(88, 82 - row * 16)
    });
    editorSelectedPlayer = workingSimulation.players.length - 1;
    renderEditorSimulation();
});

dtPassModeButton?.addEventListener("click", () => {
    editorPassMode = !editorPassMode;
    editorPassSource = -1;
    dtPassModeButton.classList.toggle("active", editorPassMode);
    dtSimulationStatus.textContent = editorPassMode
        ? "Selecciona al jugador que dará el pase."
        : "Modo pase cancelado.";
    renderEditorSimulation();
});

document.querySelector("[data-sim-remove-player]")?.addEventListener("click", () => {
    if (editorSelectedPlayer < 0) {
        window.alert("Selecciona un jugador en la cancha.");
        return;
    }

    const removedIndex = editorSelectedPlayer;
    workingSimulation.players.splice(removedIndex, 1);
    workingSimulation.passes = workingSimulation.passes
        .filter((pass) => pass.from !== removedIndex && pass.to !== removedIndex)
        .map((pass) => ({
            from: pass.from > removedIndex ? pass.from - 1 : pass.from,
            to: pass.to > removedIndex ? pass.to - 1 : pass.to
        }));

    editorSelectedPlayer = -1;
    editorPassSource = -1;
    renderEditorSimulation();
});

document.querySelector("[data-sim-remove-pass]")?.addEventListener("click", () => {
    workingSimulation.passes.pop();
    renderEditorSimulation();
});

document.querySelector("[data-sim-new]")?.addEventListener("click", () => {
    workingSimulation = {
        id: makeId(),
        team: teams[0],
        title: "Nueva jugada",
        description: "",
        players: [],
        passes: []
    };
    editorSelectedPlayer = -1;
    editorPassSource = -1;
    renderEditorSimulation();
    dtSimulationStatus.textContent = "Jugada nueva. Añade jugadores y marca los pases.";
});

document.querySelector("[data-sim-save]")?.addEventListener("click", () => {
    const title = dtSimulationTitle.value.trim();

    if (!title) {
        window.alert("Escribe un título para la jugada.");
        return;
    }

    workingSimulation.title = title;
    workingSimulation.description = dtSimulationDescription.value.trim();
    workingSimulation.team = dtSimulationTeam.value;

    const index = simulations.findIndex((simulation) => simulation.id === workingSimulation.id);

    if (index >= 0) {
        simulations[index] = structuredClone(workingSimulation);
    } else {
        simulations.push(structuredClone(workingSimulation));
    }

    localStorage.setItem(simulationStorageKey, JSON.stringify(simulations));
    activeSimulationId = workingSimulation.id;
    refreshSimulationOptions();
    renderPublicSimulation();
    dtSimulationStatus.textContent = "Jugada guardada en este navegador.";
});

document.querySelector("[data-sim-delete]")?.addEventListener("click", () => {
    if (simulations.length <= 1) {
        window.alert("Debe quedar por lo menos una jugada.");
        return;
    }

    simulations = simulations.filter((simulation) => simulation.id !== workingSimulation.id);
    localStorage.setItem(simulationStorageKey, JSON.stringify(simulations));
    activeSimulationId = simulations[0].id;
    workingSimulation = structuredClone(simulations[0]);
    refreshSimulationOptions();
    renderEditorSimulation();
    renderPublicSimulation();
});

refreshSimulationOptions();
renderPublicSimulation();


refreshAllSelects();
renderDates();
renderRoster();
renderPitch();
