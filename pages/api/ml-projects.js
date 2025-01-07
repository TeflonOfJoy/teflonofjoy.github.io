import data from './ml-projects.json';

export const getMlProjects = () => {
  return data;
};

export default (req, res) => {
  const projects = getMlProjects();
  res.json(projects);
};
