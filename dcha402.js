const VERSION_URL = "http://localhost:5000/api/Version/";
const SIGNS_URL = "http://localhost:5000/api/Signs/";
const SIGN_IMAGE_URL = "http://localhost:5000/api/SignImage/";
const REGISTER_URL = "http://localhost:5000/api/Register/";
const COMMENTS_URL = "http://localhost:5000/api/Comments/";
const ADD_COMMENT_URL = "http://localhost:5000/api/Comment";
const EVENTS_COUNT_URL = "http://localhost:5000/api/EventCount";
const EVENT_URL = "http://localhost:5000/api/Event";
const TEST_AUTH_URL = "http://localhost:5000/api/TestAuth";

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

document.getElementById("login-button").addEventListener("click", async () => {
    await login(loginUsernameField.value, loginPasswordField.value);

    document.getElementById("login-modal").classList.add("hidden");

    if (!isAuthenticated()) {
        logInOutButton.dispatchEvent(new Event("click"));
    }
});

logInOutButton.addEventListener("click", showLogInPopUp);

function showLogInPopUp() {
    document.getElementById("login-modal").classList.remove("hidden");

    loginUsernameField.focus();
    loginUsernameField.select();
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
        document.getElementById("login-text").textContent =
            `You are logged in as ${username}`;
    }
}

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
