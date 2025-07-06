/********************************************************************************
*  WEB322 – Assignment 04
*  I declare that this assignment is my own work ...
*  Name: Khushil Varsani   Student ID: 169660222   Date: 2025-07-06
*  Published URL: https://your-vercel-url.vercel.app
********************************************************************************/

const express = require("express");
const app = express();
const projects = require("./data/projects");

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static("public"));

app.get("/", (req, res) => {
  // redirect root to projects list
  res.redirect("/solutions/projects");
});

app.get("/about", (req, res) => {
  res.render("about", { page: "/about" });
});

app.get("/solutions/projects", (req, res) => {
  const sector = req.query.sector;
  let list = projects;
  if (sector) {
    list = list.filter(p => p.sector === sector);
    if (!list.length) {
      return res.status(404).render("404", { message: `No projects found for sector: ${sector}` });
    }
  }
  res.render("projects", { projects: list, page: "/solutions/projects" });
});

app.get("/solutions/projects/:id", (req, res) => {
  const proj = projects.find(p => p.id == req.params.id);
  if (!proj) {
    return res.status(404).render("404", { message: `No project found with ID: ${req.params.id}` });
  }
  res.render("project", { project: proj, page: "" });
});

// catch-all 404
app.use((req, res) => {
  res.status(404).render("404", { message: "Sorry, page not found." });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
