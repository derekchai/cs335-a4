const VERSION_URL = "http://localhost:5000/api/Version/";
const SIGNS_URL = "http://localhost:5000/api/Signs/";
const SIGN_IMAGE_URL = "http://localhost:5000/api/SignImage/";
const REGISTER_URL = "http://localhost:5000/api/Register/";
const COMMENTS_URL = "http://localhost:5000/api/Comments/";
const ADD_COMMENT_URL = "http://localhost:5000/api/Comment";
const EVENTS_COUNT_URL = "http://localhost:5000/api/EventCount";
const EVENT_URL = "http://localhost:5000/api/Event";
const TEST_AUTH_URL = "http://localhost:5000/api/TestAuth";
const LOG_URL = "http://localhost:5000/api/Log";

document.querySelectorAll("form").forEach((form) => {
    form.setAttribute("onsubmit", "return false;");
});

let encodedCredentials = null;

/**
 * Updates the version text element with the correct API verison, fetched from
 * the API.
 */
async function updateVersionText() {
    const versionPromise = await fetch(VERSION_URL);
    const versionText = await versionPromise.text();

    const versionTextElement = document.getElementById("version-text");
    versionTextElement.textContent = `Version ${versionText}`;
}

await updateVersionText();

async function getSigns(searchTerm) {
    const url = SIGNS_URL + searchTerm;
    const signsPromise = await fetch(url);
    const signs = await signsPromise.json();
    return signs;
}

async function getSignImage(id) {
    const signImagePromise = await fetch(SIGN_IMAGE_URL + id);
    const signImage = await signImagePromise.text();
    return signImage;
}

const signSearchBox = document.getElementById("sign-search-box");
const signsResults = document.getElementById("signs-results");
const signTemplate = document.getElementById("sign-template");

signSearchBox.addEventListener("input", async (event) => {
    signsResults.innerHTML = "";

    if (signSearchBox.value) {
        const signs = await getSigns(signSearchBox.value);

        for (const sign of signs) {
            const svg = await getSignImage(sign.id);

            const signListElement = signTemplate.cloneNode(true);
            signListElement.querySelector("[data-sign-svg]").innerHTML = svg;
            signListElement.querySelector("[data-sign-meanings]").textContent =
                sign.meaning.join(", ");
            signListElement.querySelector(
                "[data-sign-description]",
            ).textContent = sign.description;

            signsResults.append(signListElement);
        }
    }
});

const links = document.getElementById("links");

document.querySelectorAll("section").forEach((section) => {
    const sectionName = section.dataset.name;

    const header = document.createElement("h2");
    header.id = sectionName;
    header.textContent = sectionName;

    section.prepend(header);

    const link = document.createElement("a");
    link.textContent = sectionName;
    link.addEventListener("click", (event) => {
        document.querySelectorAll("section").forEach((section) => {
            if (section.dataset.name === sectionName) {
                section.classList.remove("hidden");

                // Automatically focus and select first text input.
                const firstTextInput =
                    section.querySelector(`input[type="text"]`);

                if (firstTextInput) {
                    firstTextInput.focus();
                    firstTextInput.select();
                }
            } else {
                section.classList.add("hidden");
            }
        });
    });

    links.append(link);
});

async function registerUser(username, password) {
    const registerSection = document.querySelector(`[data-name="Register"]`);

    const response = await fetch(REGISTER_URL, {
        headers: {
            accept: "text/plain",
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
            username: username,
            password: password,
            address: "123 Main St",
        }),
    });

    const responseText = registerSection.querySelector("[data-response-text]");
    responseText.textContent = await response.text();
}

const registerButton = document.getElementById("register-button");
registerButton.addEventListener("click", async () => {
    const usernameField = document.getElementById("username-field");
    const passwordField = document.getElementById("password-field");

    await registerUser(usernameField.value, passwordField.value);
});

const loginUsernameField = document.getElementById("login-username-field");
const loginPasswordField = document.getElementById("login-password-field");

const logInOutButton = document.getElementById("log-in-out-button");

document
    .getElementById("login-button")
    .addEventListener(
        "click",
        async () =>
            await login(loginUsernameField.value, loginPasswordField.value),
    );

logInOutButton.addEventListener("click", () => {
    if (isLoggedIn()) {
        logOut();
    } else {
        showLogInPopUp();
    }
});

function logOut() {
    encodedCredentials = null;
    updateLogInLogOutButtonText();
}

function showLogInPopUp(message = null) {
    const loginModal = document.getElementById("login-modal");
    loginModal.classList.remove("hidden");

    const statusMessage = loginModal.querySelector("[data-status-message]");

    if (statusMessage != null) {
        statusMessage.textContent = message;
    }

    statusMessage.classList.toggle("hidden", message === null);

    loginUsernameField.focus();
    loginUsernameField.select();
}

function isLoggedIn() {
    return encodedCredentials != null;
}

/**
 * @returns { boolean } Whether the user is authenticated.
 */
async function isAuthenticated() {
    const response = await fetch(TEST_AUTH_URL, {
        headers: {
            Authorization: `Basic ${encodedCredentials}`,
        },
    });
    return await response.ok;
}

const commentButton = document.getElementById("comment-button");
commentButton.addEventListener("click", async () => {
    if (!isLoggedIn()) {
        showLogInPopUp();
        return;
    }

    const commentField = document.getElementById("comment-field");

    const url = `${ADD_COMMENT_URL}?comment=${commentField.value}`;

    const headers = {
        accept: "text/plain",
        "Content-Type": "application/json",
    };

    if (encodedCredentials) {
        headers["Authorization"] = `Basic ${encodedCredentials}`;
    }

    const response = await fetch(url, {
        headers: headers,
        method: "POST",
    });

    if ((await response.status) === 401) {
        console.log("add comment: unauthorized (showing login)");
        showLogInPopUp();
        return;
    }

    console.log(
        `add comment: "${await response.text()}" by ${encodedCredentials}`,
    );
    commentField.value = "";

    // Refresh iframe to update with new comment.
    const commentsIframe = document.getElementById("comments-iframe");
    commentsIframe.src = commentsIframe.src;
});

async function login(username, password) {
    encodedCredentials = btoa(`${username}:${password}`);

    if (await isAuthenticated()) {
        document.getElementById("login-modal").classList.add("hidden");
    } else {
        encodedCredentials = null;
        showLogInPopUp("Login credentials were wrong");
    }

    updateLogInLogOutButtonText(username);
}

function updateLogInLogOutButtonText(username) {
    if (isLoggedIn()) {
        document.getElementById("login-text").textContent =
            `You are logged in as ${username}`;

        logInOutButton.textContent = "Log out";
    } else {
        document.getElementById("login-text").textContent =
            `You are not logged in`;

        logInOutButton.textContent = "Log in";
    }
}

updateLogInLogOutButtonText();

async function getEvents() {
    const eventsList = document.getElementById("events-list");
    const eventTemplate = document.getElementById("event-template");

    const eventsCount = await getEventsCount();
    for (let i = 0; i < eventsCount; i++) {
        const url = `${EVENT_URL}/${i}`;
        const response = await fetch(url);

        const event = await response.text();
        const lines = event.split("\n");

        const title = findValueOfField("SUMMARY");
        const description = findValueOfField("DESCRIPTION");
        const startTime = findValueOfField("DTSTART");
        const endTime = findValueOfField("DTEND");

        const eventListItem = eventTemplate.cloneNode(true);

        eventListItem.querySelector("[data-title]").textContent = title;
        eventListItem
            .querySelector("[data-link]")
            .setAttribute("href", `${EVENT_URL}/${i}`);
        eventListItem.querySelector("[data-description]").textContent =
            description;
        eventListItem.querySelector("[data-start-time]").textContent =
            formattedTime(startTime);
        eventListItem.querySelector("[data-end-time]").textContent =
            formattedTime(endTime);

        eventsList.appendChild(eventListItem);

        function findValueOfField(field) {
            return lines
                .find((line) => line.startsWith(field))
                .slice(field.length + 1);
        }

        function formattedTime(time) {
            const year = time.slice(0, 4);
            const month = time.slice(4, 6);
            const day = time.slice(6, 8);
            const hour = time.slice(9, 11);
            const minute = time.slice(11, 13);
            const second = time.slice(13, 15);

            // Convert to ISO 8601 (e.g. "2026-10-03T02:00:00Z")
            const isoStr = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
            return new Date(isoStr).toLocaleString();
        }
    }
}

await getEvents();

/**
 * @returns {Number} Event count
 */
async function getEventsCount() {
    return (await fetch(EVENTS_COUNT_URL)).json();
}

async function getLog() {
    return (await fetch(LOG_URL)).json();
}

const log = await getLog();

const plotsSvg = document.getElementById("plots-svg");
const title = plotsSvg.querySelector("[data-title]");
const yLabel = plotsSvg.querySelector("[data-y-label]");
const xLabel = plotsSvg.querySelector("[data-x-label]");
const yTicks = plotsSvg.querySelector("[data-y-ticks]");
const xTicks = plotsSvg.querySelector("[data-x-ticks]");
const points = plotsSvg.querySelector("[data-points]");

const Y_LABEL_KEY = "quizScore";
const X_LABEL_KEY = "practiceMinutes";

const SVG_WIDTH = 500;
const SVG_HEIGHT = 500;

const X_OFFSET = 50;
const Y_OFFSET = 50;

const graphWidth = SVG_WIDTH - X_OFFSET;
const graphHeight = SVG_HEIGHT - Y_OFFSET;

const TICK_COUNT = 10;

yLabel.textContent = Y_LABEL_KEY;
xLabel.textContent = X_LABEL_KEY;
title.textContent = `${yLabel.textContent} vs ${xLabel.textContent}`;

const maxY = Math.max(...log.map((l) => l[Y_LABEL_KEY]));
const minY = Math.max(...log.map((l) => l[Y_LABEL_KEY]));
const maxX = Math.max(...log.map((l) => l[X_LABEL_KEY]));
const minX = Math.max(...log.map((l) => l[X_LABEL_KEY]));

const xTickExample = document.querySelector("[data-x-tick-example]");
const yTickExample = document.querySelector("[data-y-tick-example]");
const pointExample = document.querySelector("[data-point-example]");

// X axis ticks
for (let i = 0; i <= TICK_COUNT; i++) {
    const tick = xTickExample.cloneNode(true);
    const p = i / TICK_COUNT;
    const x = pToX(p);

    tick.textContent = Math.round(p * maxX);
    tick.setAttribute("x", x);
    xTicks.append(tick);
}

// Y axis ticks
for (let i = 0; i <= TICK_COUNT; i++) {
    const tick = yTickExample.cloneNode(true);
    const p = i / TICK_COUNT;
    const y = pToY(p);

    tick.textContent = Math.round(p * maxY);
    tick.setAttribute("y", y);
    yTicks.append(tick);
}

log.forEach((point) => {
    const px = point[X_LABEL_KEY] / maxX;
    const py = point[Y_LABEL_KEY] / maxY;

    const pointElement = pointExample.cloneNode(true);
    pointElement.setAttribute("cx", pToX(px));
    pointElement.setAttribute("cy", pToY(py));
    points.append(pointElement);
});

function pToX(p) {
    return X_OFFSET + p * graphWidth;
}

function pToY(p) {
    return SVG_HEIGHT - p * graphHeight + (1 / TICK_COUNT) * graphHeight;
}

const rowExample = document.querySelector("[data-row-example]");
const headingX = document.querySelector("[data-heading-x]");
const headingY = document.querySelector("[data-heading-y]");

headingX.textContent = X_LABEL_KEY;
headingY.textContent = Y_LABEL_KEY;

const tableBody = document.getElementById("table-body");

log.forEach((point, index) => {
    const row = rowExample.cloneNode(true);

    row.querySelector("[data-index]").textContent = index;
    row.querySelector("[data-x]").textContent = point[X_LABEL_KEY];
    row.querySelector("[data-y]").textContent = point[Y_LABEL_KEY];

    tableBody.append(row);
});

rowExample.setAttribute("hidden", "hidden");
