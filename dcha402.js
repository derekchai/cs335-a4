const VERSION_URL = "http://localhost:5000/api/Version";

/**
 * Updates the version text element with the correct API verison, fetched from 
 * the API.
 */
async function updateVersionText() {
  const versionPromise = await fetch(VERSION_URL);
  const versionText = await versionPromise.text();
  console.log(versionText);

  const versionTextElement = document.getElementById("version-text");
  versionTextElement.textContent = `Version ${versionText}`;
}

await updateVersionText();

const navbar = document.querySelector("header");

document.querySelectorAll("section").forEach((section) => {
  const sectionName = section.dataset.name;

  const header = document.createElement("h2");
  header.id = sectionName;
  header.textContent = sectionName;

  section.prepend(header);

  const link = document.createElement("a");
  link.textContent = sectionName;
  link.setAttribute("href", "#" + sectionName);

  navbar.append(link);
});
