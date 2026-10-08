const VERSION_URL = "http://localhost:5000/api/Version/";
const SIGNS_URL = "http://localhost:5000/api/Signs/";
const SIGN_IMAGE_URL = "http://localhost:5000/api/SignImage/";
const REGISTER_URL = "http://localhost:5000/api/Register/";
const COMMENTS_URL = "http://localhost:5000/api/Comments/";

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
    // link.setAttribute("href", "#" + sectionName);

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
