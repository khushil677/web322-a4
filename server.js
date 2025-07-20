/********************************************************************************
 *  WEB322 – Assignment 05
 * 
 *  I declare that this assignment is my own work in accordance with Seneca's
 *  Academic Integrity Policy:
 * 
 *  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 * 
 *  Name: __Khushil Varsani________________ Student ID: __169660222__ Date: __7/19/2025__
 *
 *  Published URL: _____________________________________________
 *
 ********************************************************************************/

const express = require("express");
const {
  initialize,
  getAllProjects,
  getProjectById,
  getProjectsBySector,
  addProject,
  getAllSectors,
  editProject,
  deleteProject
} = require("./modules/projects");

const app = express();

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Redirect root to projects list
app.get("/", (req, res) => {
  res.redirect("/solutions/projects");
});

// About page
app.get("/about", (req, res) => {
  res.render("about", { page: "/about" });
});

// Projects list (optional ?sector= filter)
app.get("/solutions/projects", (req, res) => {
  const sector = req.query.sector;
  const promise = sector
    ? getProjectsBySector(sector)
    : getAllProjects();

  promise
    .then(projects => {
      res.render("projects", {
        projects,
        page: "/solutions/projects"
      });
    })
    .catch(err => {
      res.status(404).render("404", { message: err.message });
    });
});

// Single project detail
app.get("/solutions/projects/:id", (req, res) => {
  getProjectById(+req.params.id)
    .then(project => {
      res.render("project", { project, page: "" });
    })
    .catch(err => {
      res.status(404).render("404", { message: err.message });
    });
});

// Show Add Project form
app.get("/solutions/addProject", (req, res) => {
  getAllSectors()
    .then(sectors => {
      res.render("addProject", {
        sectors,
        page: "/solutions/addProject"
      });
    })
    .catch(err => {
      res.render("500", { message: err.message });
    });
});

// Handle Add Project form submission
app.post("/solutions/addProject", (req, res) => {
  addProject(req.body)
    .then(() => {
      res.redirect("/solutions/projects");
    })
    .catch(err => {
      res.render("500", { message: err.errors?.[0].message || err.message });
    });
});

// Show Edit Project form
app.get("/solutions/editProject/:id", (req, res) => {
  Promise.all([
    getProjectById(+req.params.id),
    getAllSectors()
  ])
    .then(([project, sectors]) => {
      res.render("editProject", { project, sectors, page: "" });
    })
    .catch(err => {
      res.status(404).render("404", { message: err.message });
    });
});

// Handle Edit Project form submission
app.post("/solutions/editProject", (req, res) => {
  const id = +req.body.id;
  editProject(id, req.body)
    .then(() => {
      res.redirect("/solutions/projects");
    })
    .catch(err => {
      res.render("500", { message: err.errors?.[0].message || err.message });
    });
});

// Handle Delete Project
app.get("/solutions/deleteProject/:id", (req, res) => {
  deleteProject(+req.params.id)
    .then(() => {
      res.redirect("/solutions/projects");
    })
    .catch(err => {
      res.render("500", { message: err.errors?.[0].message || err.message });
    });
});

// Catch‐all 404
app.use((req, res) => {
  res.status(404).render("404", {
    message: "Sorry, page not found."
  });
});

const PORT = process.env.PORT || 8080;

// Sync DB then start server
initialize()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Server listening on http://localhost:${PORT}`)
    );
  })
  .catch(err => {
    console.error("ERROR: Unable to sync database:", err);
  });
