const body = document.body;
const intro = document.querySelector(".intro");
const menuButton = document.querySelector(".menu-button");
const mobileMenu = document.querySelector(".mobile-menu");
const scrollButtons = document.querySelectorAll("[data-scroll]");
const revealItems = document.querySelectorAll(".reveal");
const sections = document.querySelectorAll(".section-anchor");
const navButtons = document.querySelectorAll(".desktop-nav [data-scroll]");

body.classList.add("intro-active");

const closeIntro = () => {
    intro.classList.add("hidden");
    body.classList.remove("intro-active");
};

window.addEventListener("load", () => {
    window.setTimeout(closeIntro, 4300);
});

window.setTimeout(closeIntro, 5900);

const closeMenu = () => {
    mobileMenu.classList.remove("open");
    mobileMenu.setAttribute("aria-hidden", "true");
    menuButton.setAttribute("aria-expanded", "false");
};

menuButton.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("open");
    mobileMenu.setAttribute("aria-hidden", String(!open));
    menuButton.setAttribute("aria-expanded", String(open));
});

scrollButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const target = document.querySelector(`[data-section="${button.dataset.scroll}"]`);
        if (!target) {
            return;
        }
        closeMenu();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
});

const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                revealObserver.unobserve(entry.target);
            }
        });
    },
    {
        threshold: 0.12,
        rootMargin: "0px 0px -45px 0px"
    }
);

revealItems.forEach((item) => revealObserver.observe(item));

const sectionObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            navButtons.forEach((button) => {
                button.classList.toggle("active", button.dataset.scroll === entry.target.dataset.section);
            });
        });
    },
    {
        threshold: 0.25,
        rootMargin: "-20% 0px -60% 0px"
    }
);

sections.forEach((section) => sectionObserver.observe(section));

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeMenu();
    }
});


const ruleSearch = document.querySelector(".rule-search");
const ruleChapters = document.querySelectorAll(".rule-chapter");
const ruleJumpButtons = document.querySelectorAll("[data-rule-jump]");
const rulesOpenButton = document.querySelector("[data-rules-open]");
const rulesCloseButton = document.querySelector("[data-rules-close]");

rulesOpenButton.addEventListener("click", () => {
    ruleChapters.forEach((chapter) => {
        if (!chapter.hidden) {
            chapter.open = true;
        }
    });
});

rulesCloseButton.addEventListener("click", () => {
    ruleChapters.forEach((chapter) => {
        chapter.open = false;
    });
});

ruleJumpButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const chapter = document.querySelector(`[data-rule-chapter="${button.dataset.ruleJump}"]`);
        chapter.hidden = false;
        chapter.open = true;
        chapter.scrollIntoView({ behavior: "smooth", block: "start" });
    });
});

ruleSearch.addEventListener("input", () => {
    const query = ruleSearch.value.trim().toLowerCase();

    ruleChapters.forEach((chapter) => {
        const matches = !query || chapter.textContent.toLowerCase().includes(query);
        chapter.hidden = !matches;

        if (query && matches) {
            chapter.open = true;
        }
    });
});


const pageProgress = document.querySelector(".page-progress span");
const siteHeader = document.querySelector(".site-header");
const cursorGlow = document.querySelector(".cursor-glow");
const parallaxTarget = document.querySelector("[data-parallax]");
const interactiveCards = document.querySelectorAll(".team-card, .community-partner-card");
const ruleNumbers = document.querySelectorAll(".rule-summary strong");

const updateScrollEffects = () => {
    const scrollTop = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollHeight > 0 ? Math.min(scrollTop / scrollHeight, 1) : 0;

    pageProgress.style.width = `${progress * 100}%`;
    siteHeader.classList.toggle("compact", scrollTop > 40);
};

window.addEventListener("scroll", updateScrollEffects, { passive: true });
updateScrollEffects();

revealItems.forEach((item, index) => {
    item.style.setProperty("--reveal-delay", `${Math.min((index % 6) * 55, 275)}ms`);
});

if (window.matchMedia("(pointer: fine)").matches) {
    document.addEventListener("pointermove", (event) => {
        cursorGlow.style.left = `${event.clientX}px`;
        cursorGlow.style.top = `${event.clientY}px`;
        cursorGlow.style.opacity = "1";
    });

    document.addEventListener("pointerleave", () => {
        cursorGlow.style.opacity = "0";
    });

    if (parallaxTarget) {
        parallaxTarget.addEventListener("pointermove", (event) => {
            const rect = parallaxTarget.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;

            parallaxTarget.style.transform = `perspective(1000px) rotateX(${y * -4}deg) rotateY(${x * 5}deg)`;
        });

        parallaxTarget.addEventListener("pointerleave", () => {
            parallaxTarget.style.transform = "";
        });
    }

    interactiveCards.forEach((card) => {
        card.addEventListener("pointermove", (event) => {
            const rect = card.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;

            card.style.transform = `perspective(900px) rotateX(${y * -3}deg) rotateY(${x * 4}deg) translateY(-5px)`;
        });

        card.addEventListener("pointerleave", () => {
            card.style.transform = "";
        });
    });
}

const countObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            const element = entry.target;
            const original = element.textContent.trim();
            const numeric = Number.parseInt(original, 10);

            if (Number.isNaN(numeric) || original.includes("-")) {
                countObserver.unobserve(element);
                return;
            }

            let start = 0;
            const duration = 700;
            const startTime = performance.now();

            const animate = (time) => {
                const progress = Math.min((time - startTime) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                element.textContent = String(Math.round(start + (numeric - start) * eased));

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            requestAnimationFrame(animate);
            countObserver.unobserve(element);
        });
    },
    {
        threshold: 0.7
    }
);

ruleNumbers.forEach((number) => countObserver.observe(number));


const lineupData = {"leagues": ["Newcastle League", "Club World League", "Margarita", "AMX League", "SDH 2K26", "LMF HaxBall México", "Haxcomm"], "signed_players": ["D1zks", "dloto", "h2o", "Jockie Music", "Leo64", "luxe", "morata", "Night", "paulo", "raz.", "viejo(cabron)", "xyz", "zk"], "discord_players": ["Alexandre Pato", "Apollo", "Hormiga God", "iTvoss", "klea", "mathi", "mostasa2", "Nekotina", "nekro", "wl.", "yan", "09021", "6abix_83", "6sami (kenny)", "[AFK] andrew GS", "Abraham_26491", "adriguille", "AexsZK", "Alex(haxszcbo)", "AndrexC7/7", "Arsha", "bananajoies", "BazukeroEnPotencia", "Darwin Núñez", "Dysta", "GZX", "GZX 9.", "Harold", "Hazio(original)", "Hornet mala", "Jerito", "jimenez", "Joos", "jose", "JoseM_2314", "Kenny", "Kmada", "lechero", "leww", "Lex ()", "lloris montana", "malibú", "mathias", "Mehdi Ghavedi", "Michi7ril", "miguelzz288", "Milan", "Montiel", "Papaya", "Quansah", "queso", "Red Panzario", "ryota", "S-GR", "saed", "Sebas)", "sisi ñamñam", "Smfhzz", "Sumire", "the_crab", "Triplenelli", "Valdo", "Yasez", "yo-liss", "Zeta", "zida ne", "zsaez", "¿why?", "Matt", "L.Yamal", "Steeven"]};

const rosterStorageKey = "newcastle_rosters_v1";
const scheduleStorageKey = "newcastle_schedule_v1";
const lineupStorageKey = "newcastle_lineups_v1";
const dtSessionStorageKey = "newcastle_dt_session_v1";
const dtAccessCode = "NCL2026";

const defaultRosters = lineupData.leagues.reduce((result, league) => {
    result[league] = league === "Newcastle League" ? [...lineupData.signed_players] : [];
    return result;
}, {});

const defaultSchedule = lineupData.leagues.reduce((result, league) => {
    result[league] = league === "Newcastle League"
        ? [
            { id: crypto.randomUUID(), title: "Jornada 1", date: "", time: "", rival: "Rival por confirmar", status: "pending", channel: "Servidor oficial" },
            { id: crypto.randomUUID(), title: "Jornada 2", date: "", time: "", rival: "Rival por confirmar", status: "pending", channel: "Servidor oficial" },
            { id: crypto.randomUUID(), title: "Copa", date: "", time: "", rival: "Cruce por confirmar", status: "pending", channel: "Servidor oficial" }
        ]
        : [];
    return result;
}, {});

const formations = {
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

const readStoredObject = (key, fallback) => {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value && typeof value === "object" ? value : structuredClone(fallback);
    } catch {
        return structuredClone(fallback);
    }
};

let rosters = readStoredObject(rosterStorageKey, defaultRosters);
let schedule = readStoredObject(scheduleStorageKey, defaultSchedule);
let savedLineups = readStoredObject(lineupStorageKey, {});
let selectedPlayer = "";
let activeAssignments = {};
let activeDtName = "Dysta";

lineupData.leagues.forEach((league) => {
    if (!Array.isArray(rosters[league])) {
        rosters[league] = [];
    }

    if (!Array.isArray(schedule[league])) {
        schedule[league] = [];
    }
});

const calendarLeagueSelect = document.querySelector(".calendar-league-select");
const calendarStatusSelect = document.querySelector(".calendar-status-select");
const scheduleList = document.querySelector("[data-schedule-list]");
const calendarEmpty = document.querySelector("[data-calendar-empty]");
const nextDateElement = document.querySelector("[data-next-date]");
const nextEventElement = document.querySelector("[data-next-event]");
const eventCountElement = document.querySelector("[data-event-count]");
const confirmedCountElement = document.querySelector("[data-confirmed-count]");

const lineupLeagueSelect = document.querySelector(".lineup-league-select");
const formationSelect = document.querySelector(".formation-select");
const lineupNameInput = document.querySelector(".lineup-name");
const rosterList = document.querySelector("[data-roster-list]");
const rosterEmpty = document.querySelector("[data-roster-empty]");
const rosterCount = document.querySelector("[data-roster-count]");
const playerSearch = document.querySelector(".player-search");
const selectedPlayerElement = document.querySelector("[data-selected-player]");
const pitchSlots = document.querySelector("[data-pitch-slots]");
const pitchTitle = document.querySelector("[data-pitch-title]");

const dtModal = document.querySelector("[data-dt-modal]");
const dtAccess = document.querySelector("[data-dt-access]");
const dtEditor = document.querySelector("[data-dt-editor]");
const dtCodeInput = document.querySelector(".dt-code-input");
const dtMessage = document.querySelector("[data-dt-message]");
const dtSessionName = document.querySelector("[data-dt-session-name]");
const dtRosterLeague = document.querySelector(".dt-roster-league");
const dtCalendarLeague = document.querySelector(".dt-calendar-league");
const dtPlayerInput = document.querySelector(".dt-player-input");
const dtRosterList = document.querySelector("[data-dt-roster-list]");
const dtRosterCount = document.querySelector("[data-dt-roster-count]");
const dtEventList = document.querySelector("[data-dt-event-list]");
const discordPlayersDatalist = document.getElementById("discord-players");

const fillLeagueSelect = (select) => {
    select.innerHTML = lineupData.leagues
        .map((league) => `<option value="${league}">${league}</option>`)
        .join("");
};

[calendarLeagueSelect, lineupLeagueSelect, dtRosterLeague, dtCalendarLeague].forEach(fillLeagueSelect);

discordPlayersDatalist.innerHTML = [...new Set([...lineupData.signed_players, ...lineupData.discord_players])]
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((player) => `<option value="${player}"></option>`)
    .join("");

const getInitials = (name) => {
    const clean = name.replace(/[^\p{L}\p{N}\s]/gu, " ").trim();
    const parts = clean.split(/\s+/).filter(Boolean);

    if (!parts.length) {
        return "EX";
    }

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const formatDate = (dateValue) => {
    if (!dateValue) {
        return { day: "SIN", month: "FECHA", full: "Por confirmar" };
    }

    const date = new Date(`${dateValue}T12:00:00`);
    const day = new Intl.DateTimeFormat("es-MX", { day: "2-digit" }).format(date);
    const month = new Intl.DateTimeFormat("es-MX", { month: "short" }).format(date).replace(".", "").toUpperCase();
    const full = new Intl.DateTimeFormat("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(date);

    return { day, month, full };
};

const statusLabels = {
    pending: "Por confirmar",
    confirmed: "Confirmado",
    finished: "Finalizado"
};

const renderSchedule = () => {
    const league = calendarLeagueSelect.value;
    const filter = calendarStatusSelect.value;
    const events = [...schedule[league]]
        .filter((event) => filter === "all" || event.status === filter)
        .sort((a, b) => {
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;
            return `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`);
        });

    scheduleList.innerHTML = events.map((event) => {
        const date = formatDate(event.date);
        const detail = [event.rival, event.time ? `${event.time} h` : "", event.channel]
            .filter(Boolean)
            .join(" · ");

        return `
            <article class="schedule-card">
                <div class="schedule-date">
                    <strong>${date.day}</strong>
                    <span>${date.month}</span>
                </div>
                <div class="schedule-content">
                    <small>${league.toUpperCase()}</small>
                    <h3>${event.title}</h3>
                    <p>${detail || "Información por confirmar"}</p>
                </div>
                <div class="schedule-status">
                    <span class="${event.status}">${statusLabels[event.status]}</span>
                    <small>${date.full}</small>
                </div>
            </article>
        `;
    }).join("");

    calendarEmpty.hidden = events.length > 0;
    eventCountElement.textContent = String(schedule[league].length);

    const confirmedEvents = schedule[league].filter((event) => event.status === "confirmed" && event.date);
    confirmedCountElement.textContent = String(confirmedEvents.length);

    const nextEvent = schedule[league]
        .filter((event) => event.date && event.status !== "finished")
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0];

    if (nextEvent) {
        const date = formatDate(nextEvent.date);
        nextDateElement.textContent = nextEvent.time ? `${date.day} ${date.month} · ${nextEvent.time}` : `${date.day} ${date.month}`;
        nextEventElement.textContent = nextEvent.title;
    } else {
        nextDateElement.textContent = "Por confirmar";
        nextEventElement.textContent = schedule[league][0]?.title || "Sin jornada cargada";
    }
};

const setSelectedPlayer = (player) => {
    selectedPlayer = player;
    selectedPlayerElement.textContent = player || "Ninguno";
    document.querySelectorAll(".roster-player").forEach((button) => {
        button.classList.toggle("selected", button.dataset.player === player);
    });
};

const renderRoster = () => {
    const league = lineupLeagueSelect.value;
    const query = playerSearch.value.trim().toLowerCase();
    const players = [...rosters[league]]
        .sort((a, b) => a.localeCompare(b, "es"))
        .filter((player) => player.toLowerCase().includes(query));

    rosterCount.textContent = `${rosters[league].length} jugadores`;
    rosterEmpty.hidden = rosters[league].length > 0;

    rosterList.innerHTML = players.map((player) => `
        <button class="roster-player${selectedPlayer === player ? " selected" : ""}" type="button" draggable="true" data-player="${player}">
            <span class="roster-player-avatar">${getInitials(player)}</span>
            <strong>${player}</strong>
            <span>FICHADO</span>
        </button>
    `).join("");

    rosterList.querySelectorAll(".roster-player").forEach((button) => {
        button.addEventListener("click", () => {
            setSelectedPlayer(button.dataset.player);
        });

        button.addEventListener("dragstart", (event) => {
            event.dataTransfer.setData("text/plain", button.dataset.player);
            setSelectedPlayer(button.dataset.player);
        });
    });
};

const renderPitch = () => {
    const formation = formationSelect.value;
    const league = lineupLeagueSelect.value;
    const positions = formations[formation];

    pitchTitle.textContent = `${league} · ${formation}`;

    pitchSlots.innerHTML = positions.map((position, index) => {
        const player = activeAssignments[index] || "";

        return `
            <button
                class="pitch-slot${player ? " filled" : ""}"
                type="button"
                data-slot="${index}"
                style="left: ${position.x}%; top: ${position.y}%;"
                title="${player ? "Haz clic para mover o quitar al jugador" : "Colocar jugador"}"
            >
                <span class="pitch-slot-number">${index + 1}</span>
                <span class="pitch-slot-position">${position.role}</span>
                <strong class="pitch-slot-player">${player || "VACÍO"}</strong>
            </button>
        `;
    }).join("");

    pitchSlots.querySelectorAll(".pitch-slot").forEach((slot) => {
        slot.addEventListener("dragover", (event) => event.preventDefault());

        slot.addEventListener("drop", (event) => {
            event.preventDefault();
            const player = event.dataTransfer.getData("text/plain");
            assignPlayerToSlot(player, Number(slot.dataset.slot));
        });

        slot.addEventListener("click", () => {
            const index = Number(slot.dataset.slot);
            const currentPlayer = activeAssignments[index];

            if (selectedPlayer) {
                assignPlayerToSlot(selectedPlayer, index);
                return;
            }

            if (currentPlayer) {
                delete activeAssignments[index];
                setSelectedPlayer(currentPlayer);
                renderPitch();
            }
        });
    });
};

const assignPlayerToSlot = (player, index) => {
    if (!player) {
        return;
    }

    Object.keys(activeAssignments).forEach((slotIndex) => {
        if (activeAssignments[slotIndex] === player) {
            delete activeAssignments[slotIndex];
        }
    });

    activeAssignments[index] = player;
    setSelectedPlayer("");
    renderPitch();
};

const resetLineupForContext = () => {
    selectedPlayer = "";
    activeAssignments = {};
    selectedPlayerElement.textContent = "Ninguno";
    renderRoster();
    renderPitch();
};

const getLineupKey = () => `${lineupLeagueSelect.value}__${formationSelect.value}`;

const saveLineup = () => {
    const key = getLineupKey();
    savedLineups[key] = {
        league: lineupLeagueSelect.value,
        formation: formationSelect.value,
        name: lineupNameInput.value.trim(),
        assignments: { ...activeAssignments }
    };

    localStorage.setItem(lineupStorageKey, JSON.stringify(savedLineups));
    window.alert("Alineación guardada en este navegador.");
};

const loadLineup = () => {
    const lineup = savedLineups[getLineupKey()];

    if (!lineup) {
        window.alert("No hay una alineación guardada para esta liga y formación.");
        return;
    }

    lineupNameInput.value = lineup.name || "";
    activeAssignments = { ...lineup.assignments };
    setSelectedPlayer("");
    renderPitch();
};

const copyLineup = async () => {
    const formation = formationSelect.value;
    const positions = formations[formation];
    const lines = [
        lineupNameInput.value.trim() || "Alineación",
        `${lineupLeagueSelect.value} · ${formation}`,
        ""
    ];

    positions.forEach((position, index) => {
        lines.push(`${index + 1}. ${position.role} — ${activeAssignments[index] || "Sin jugador"}`);
    });

    try {
        await navigator.clipboard.writeText(lines.join("\n"));
        window.alert("Alineación copiada.");
    } catch {
        window.prompt("Copia la alineación:", lines.join("\n"));
    }
};

const downloadLineup = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const context = canvas.getContext("2d");
    const formation = formationSelect.value;
    const positions = formations[formation];

    const gradient = context.createLinearGradient(0, 0, 1080, 1350);
    gradient.addColorStop(0, "rgb(5, 12, 20)");
    gradient.addColorStop(1, "rgb(8, 54, 50)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = "rgba(255, 255, 255, 0.38)";
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

    context.fillStyle = "rgb(247, 249, 253)";
    context.font = "700 54px Arial";
    context.fillText(lineupNameInput.value.trim() || "Alineación", 70, 85);

    context.fillStyle = "rgb(159, 170, 187)";
    context.font = "28px Arial";
    context.fillText(`${lineupLeagueSelect.value} · ${formation}`, 70, 130);

    positions.forEach((position, index) => {
        const x = 70 + position.x / 100 * 940;
        const y = 175 + position.y / 100 * 1080;
        const player = activeAssignments[index] || "Sin jugador";

        const circleGradient = context.createLinearGradient(x - 38, y - 38, x + 38, y + 38);
        circleGradient.addColorStop(0, "rgb(112, 151, 255)");
        circleGradient.addColorStop(1, "rgb(158, 123, 255)");

        context.beginPath();
        context.arc(x, y, 42, 0, Math.PI * 2);
        context.fillStyle = circleGradient;
        context.fill();

        context.fillStyle = "rgb(255, 255, 255)";
        context.font = "700 24px Arial";
        context.textAlign = "center";
        context.fillText(String(index + 1), x, y + 8);

        context.fillStyle = "rgb(247, 249, 253)";
        context.font = "700 23px Arial";
        context.fillText(player.slice(0, 20), x, y + 76);

        context.fillStyle = "rgb(126, 239, 216)";
        context.font = "17px Arial";
        context.fillText(position.role, x, y + 103);
    });

    context.textAlign = "left";
    context.fillStyle = "rgb(159, 170, 187)";
    context.font = "22px Arial";
    context.fillText("NEWCASTLE LEAGUE", 70, 1310);

    const link = document.createElement("a");
    link.download = `${(lineupNameInput.value.trim() || "alineacion").replace(/\s+/g, "-").toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
};

const openDtModal = () => {
    dtModal.classList.add("open");
    dtModal.setAttribute("aria-hidden", "false");
    body.style.overflow = "hidden";

    const savedDt = sessionStorage.getItem(dtSessionStorageKey);

    if (savedDt) {
        activeDtName = savedDt;
        showDtEditor();
    }
};

const closeDtModal = () => {
    dtModal.classList.remove("open");
    dtModal.setAttribute("aria-hidden", "true");
    body.style.overflow = "";
};

const showDtEditor = () => {
    dtAccess.hidden = true;
    dtEditor.hidden = false;
    dtSessionName.textContent = activeDtName;
    dtRosterLeague.value = lineupLeagueSelect.value;
    dtCalendarLeague.value = calendarLeagueSelect.value;
    renderDtRoster();
    renderDtEvents();
};

const renderDtRoster = () => {
    const league = dtRosterLeague.value;
    const players = [...rosters[league]].sort((a, b) => a.localeCompare(b, "es"));

    dtRosterCount.textContent = `${players.length} jugadores`;
    dtRosterList.innerHTML = players.map((player) => `
        <div class="dt-roster-row">
            <span>${player}</span>
            <button type="button" data-remove-player="${player}">QUITAR</button>
        </div>
    `).join("");

    dtRosterList.querySelectorAll("[data-remove-player]").forEach((button) => {
        button.addEventListener("click", () => {
            rosters[league] = rosters[league].filter((player) => player !== button.dataset.removePlayer);
            localStorage.setItem(rosterStorageKey, JSON.stringify(rosters));
            renderDtRoster();

            if (lineupLeagueSelect.value === league) {
                resetLineupForContext();
            }
        });
    });
};

const renderDtEvents = () => {
    const league = dtCalendarLeague.value;
    const events = schedule[league];

    dtEventList.innerHTML = events.map((event) => {
        const date = formatDate(event.date);
        const detail = event.date ? `${date.full}${event.time ? ` · ${event.time}` : ""}` : "Fecha por confirmar";

        return `
            <div class="dt-event-row">
                <div>
                    <strong>${event.title}</strong>
                    <small>${detail}</small>
                </div>
                <button type="button" data-remove-event="${event.id}">QUITAR</button>
            </div>
        `;
    }).join("");

    dtEventList.querySelectorAll("[data-remove-event]").forEach((button) => {
        button.addEventListener("click", () => {
            schedule[league] = schedule[league].filter((event) => event.id !== button.dataset.removeEvent);
            localStorage.setItem(scheduleStorageKey, JSON.stringify(schedule));
            renderDtEvents();

            if (calendarLeagueSelect.value === league) {
                renderSchedule();
            }
        });
    });
};

document.querySelectorAll("[data-open-dt]").forEach((button) => {
    button.addEventListener("click", openDtModal);
});

document.querySelectorAll("[data-close-dt]").forEach((button) => {
    button.addEventListener("click", closeDtModal);
});

document.querySelectorAll(".dt-access-card").forEach((button) => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".dt-access-card").forEach((card) => card.classList.remove("active"));
        button.classList.add("active");
        activeDtName = button.dataset.dtName;
    });
});

document.querySelector("[data-dt-login]").addEventListener("click", () => {
    if (dtCodeInput.value.trim() !== dtAccessCode) {
        dtMessage.textContent = "Código incorrecto.";
        return;
    }

    sessionStorage.setItem(dtSessionStorageKey, activeDtName);
    dtMessage.textContent = "";
    dtCodeInput.value = "";
    showDtEditor();
});

document.querySelector("[data-dt-logout]").addEventListener("click", () => {
    sessionStorage.removeItem(dtSessionStorageKey);
    dtEditor.hidden = true;
    dtAccess.hidden = false;
});

document.querySelectorAll("[data-dt-tab]").forEach((button) => {
    button.addEventListener("click", () => {
        document.querySelectorAll("[data-dt-tab]").forEach((tab) => tab.classList.toggle("active", tab === button));
        document.querySelectorAll("[data-dt-panel]").forEach((panel) => {
            panel.classList.toggle("active", panel.dataset.dtPanel === button.dataset.dtTab);
        });
    });
});

dtRosterLeague.addEventListener("change", renderDtRoster);
dtCalendarLeague.addEventListener("change", renderDtEvents);

document.querySelector(".dt-add-player").addEventListener("click", () => {
    const league = dtRosterLeague.value;
    const player = dtPlayerInput.value.trim();

    if (!player) {
        return;
    }

    if (!rosters[league].some((name) => name.toLowerCase() === player.toLowerCase())) {
        rosters[league].push(player);
        localStorage.setItem(rosterStorageKey, JSON.stringify(rosters));
    }

    dtPlayerInput.value = "";
    renderDtRoster();

    if (lineupLeagueSelect.value === league) {
        renderRoster();
    }
});

document.querySelector(".dt-add-event").addEventListener("click", () => {
    const league = dtCalendarLeague.value;
    const titleInput = document.querySelector(".dt-event-title");
    const dateInput = document.querySelector(".dt-event-date");
    const timeInput = document.querySelector(".dt-event-time");
    const rivalInput = document.querySelector(".dt-event-rival");
    const statusInput = document.querySelector(".dt-event-status");
    const channelInput = document.querySelector(".dt-event-channel");
    const title = titleInput.value.trim();

    if (!title) {
        window.alert("Escribe el nombre de la jornada o evento.");
        return;
    }

    schedule[league].push({
        id: crypto.randomUUID(),
        title,
        date: dateInput.value,
        time: timeInput.value,
        rival: rivalInput.value.trim(),
        status: statusInput.value,
        channel: channelInput.value.trim()
    });

    localStorage.setItem(scheduleStorageKey, JSON.stringify(schedule));

    titleInput.value = "";
    dateInput.value = "";
    timeInput.value = "";
    rivalInput.value = "";
    channelInput.value = "";
    statusInput.value = "pending";

    renderDtEvents();

    if (calendarLeagueSelect.value === league) {
        renderSchedule();
    }
});

calendarLeagueSelect.addEventListener("change", renderSchedule);
calendarStatusSelect.addEventListener("change", renderSchedule);

lineupLeagueSelect.addEventListener("change", resetLineupForContext);
formationSelect.addEventListener("change", () => {
    activeAssignments = {};
    renderPitch();
});
playerSearch.addEventListener("input", renderRoster);

document.querySelector("[data-save-lineup]").addEventListener("click", saveLineup);
document.querySelector("[data-load-lineup]").addEventListener("click", loadLineup);
document.querySelector("[data-copy-lineup]").addEventListener("click", copyLineup);
document.querySelector("[data-download-lineup]").addEventListener("click", downloadLineup);
document.querySelector("[data-clear-lineup]").addEventListener("click", () => {
    activeAssignments = {};
    setSelectedPlayer("");
    renderPitch();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dtModal.classList.contains("open")) {
        closeDtModal();
    }
});

renderSchedule();
renderRoster();
renderPitch();
