require('dotenv').config();
const Sequelize = require('sequelize');

const sequelize = new Sequelize(
  process.env.PGDATABASE,
  process.env.PGUSER,
  process.env.PGPASSWORD,
  {
    host: process.env.PGHOST,
    dialect: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
  }
);

const Sector = sequelize.define('Sector', {
  id:          { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  sector_name: Sequelize.STRING
}, { timestamps: false });

const Project = sequelize.define('Project', {
  id:                   { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  title:                Sequelize.STRING,
  feature_img_url:      Sequelize.TEXT,
  summary_short:        Sequelize.TEXT,
  intro_short:          Sequelize.TEXT,
  impact:               Sequelize.TEXT,
  original_source_url:  Sequelize.TEXT,
  sector_id:            Sequelize.INTEGER
}, { timestamps: false });

Project.belongsTo(Sector, { foreignKey: 'sector_id' });

function initialize() {
  return sequelize.sync();
}
function getAllProjects() {
  return Project.findAll({ include: [Sector] });
}
function getProjectById(id) {
  return Project.findAll({ include: [Sector], where: { id } })
    .then(r => { if (!r.length) throw new Error('Unable to find requested project'); return r[0]; });
}
function getProjectsBySector(s) {
  return Project.findAll({
    include: [Sector],
    where: { '$Sector.sector_name$': { [Sequelize.Op.iLike]: `%${s}%` } }
  })
  .then(r => { if (!r.length) throw new Error('Unable to find requested projects'); return r; });
}
function addProject(d)    { return Project.create(d); }
function getAllSectors()   { return Sector.findAll(); }
function editProject(id,d) { return Project.update(d, { where: { id } }); }
function deleteProject(id) { return Project.destroy({ where: { id } }); }

module.exports = {
  initialize,
  getAllProjects,
  getProjectById,
  getProjectsBySector,
  addProject,
  getAllSectors,
  editProject,
  deleteProject
};
