const VERSION_URL = "http://localhost:5000/api/Version/";
const SIGNS_URL = "http://localhost:5000/api/Signs/";
const SIGN_IMAGE_URL = "http://localhost:5000/api/SignImage/";
const REGISTER_URL = "http://localhost:5000/api/Register/";
const COMMENTS_URL = "http://localhost:5000/api/Comments/";
const ADD_COMMENT_URL = "http://localhost:5000/api/Comment";

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

const navbar = document.querySelector("header");

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
            } else {
                section.classList.add("hidden");
            }
        });
    });

    navbar.append(link);
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

document.getElementById("login-button").addEventListener("click", () => {
    login(loginUsernameField.value, loginPasswordField.value);

    document.getElementById("login-modal").classList.add("hidden");

    commentButton.dispatchEvent(new Event("click"));
});

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
        document.getElementById("login-modal").classList.remove("hidden");

        loginUsernameField.focus();
        loginUsernameField.select();
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

function login(username, password) {
    encodedCredentials = btoa(`${username}:${password}`);
}
