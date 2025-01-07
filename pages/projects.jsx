import ProjectCard from '../components/ProjectCard';
import { getMlProjects } from './api/ml-projects';
import { getBotsProjects } from './api/bots-projects';
import { getMiscProjects } from './api/misc-projects';
import styles from '../styles/ProjectsPage.module.css';

const ProjectsPage = ({ ml_projects, bots_projects, misc_projects }) => {
  return (
    <>
      <h3>Open Source Projects</h3>
      <br/>
      <center><h4>Machine Learning</h4></center>
      <hr/>
      <div className={styles.container}>
        {ml_projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
      <br/>
      <center><h4>Bots</h4></center>
      <hr/>
      <div className={styles.container}>
        {bots_projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
      <br/>
      <center><h4>Miscellaneous</h4></center>
      <hr/>
      <div className={styles.container}>
        {misc_projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </>
  );
};

export async function getStaticProps() {
  const ml_projects = getMlProjects();
  const bots_projects = getBotsProjects();
  const misc_projects = getMiscProjects();

  return {
    props: { title: 'Projects', ml_projects, bots_projects, misc_projects },
  };
}

export default ProjectsPage;
