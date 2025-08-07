/********************************************************************************
 *  WEB322 – Assignment 06
 * 
 *  I declare that this assignment is my own work in accordance with Seneca's
 *  Academic Integrity Policy:
 * 
 *  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 * 
 *  Name: __Khushil Varsani________________ Student ID: __169660222__ Date: __2025/08/06__
 *
 *  Published URL: _____________________________________________
 *
 ********************************************************************************/

const express = require("express");
const clientSessions = require("client-sessions");
const authData = require("./modules/auth-service");
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

// View engine and static files
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(clientSessions({
  cookieName:    "session",
  secret:        "a-very-long-random-secret-string",
  duration:      2 * 60 * 60 * 1000,   // 2 hours
  activeDuration: 30 * 60 * 1000       // extend by 30 minutes
}));

// Expose session to views
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Route guard
function ensureLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

// --- Public Routes ---

app.get("/", (req, res) => {
  res.redirect("/solutions/projects");
});

app.get("/about", (req, res) => {
  res.render("about", { page: "/about" });
});

// Login & Register Views
app.get("/login", (req, res) => {
  res.render("login", { errorMessage: "", userName: "" });
});

app.get("/register", (req, res) => {
  res.render("register", {
    errorMessage: "",
    successMessage: "",
    userName: ""
  });
});

// Process Registration
app.post("/register", (req, res) => {
  authData.registerUser(req.body)
    .then(() => {
      res.render("register", {
        errorMessage: "",
        successMessage: "User created",
        userName: ""
      });
    })
    .catch(err => {
      res.render("register", {
        errorMessage: err,
        successMessage: "",
        userName: req.body.userName
      });
    });
});

// Process Login
app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");
  authData.checkUser(req.body)
    .then(user => {
      req.session.user = {
        userName:     user.userName,
        email:        user.email,
        loginHistory: user.loginHistory
      };
      res.redirect("/solutions/projects");
    })
    .catch(err => {
      res.render("login", {
        errorMessage: err,
        userName: req.body.userName
      });
    });
});

// Logout
app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

// User History (protected)
app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory");
});

// --- Project CRUD (protected) ---

// List projects
app.get("/solutions/projects", ensureLogin, (req, res) => {
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

// View single project
app.get("/solutions/projects/:id", ensureLogin, (req, res) => {
  getProjectById(+req.params.id)
    .then(project => {
      res.render("project", { project, page: "" });
    })
    .catch(err => {
      res.status(404).render("404", { message: err.message });
    });
});

// Show Add Project form
app.get("/solutions/addProject", ensureLogin, (req, res) => {
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

// Handle Add Project
app.post("/solutions/addProject", ensureLogin, (req, res) => {
  addProject(req.body)
    .then(() => res.redirect("/solutions/projects"))
    .catch(err => {
      res.render("500", { message: err.errors?.[0].message || err.message });
    });
});

// Show Edit Project form
app.get("/solutions/editProject/:id", ensureLogin, (req, res) => {
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

// Handle Edit Project
app.post("/solutions/editProject", ensureLogin, (req, res) => {
  const id = +req.body.id;
  editProject(id, req.body)
    .then(() => res.redirect("/solutions/projects"))
    .catch(err => {
      res.render("500", { message: err.errors?.[0].message || err.message });
    });
});

// Handle Delete Project
app.get("/solutions/deleteProject/:id", ensureLogin, (req, res) => {
  deleteProject(+req.params.id)
    .then(() => res.redirect("/solutions/projects"))
    .catch(err => {
      res.render("500", { message: err.errors?.[0].message || err.message });
    });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render("404", {
    message: "Sorry, page not found."
  });
});

const PORT = process.env.PORT || 8080;

// Initialize Postgres & MongoDB, then start
initialize()
  .then(authData.initialize)
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Server listening on http://localhost:${PORT}`)
    );
  })
  .catch(err => {
    console.error("ERROR: Unable to start server:", err);
  });
