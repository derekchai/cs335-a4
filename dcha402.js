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
