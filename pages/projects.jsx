import ProjectCard from '../components/ProjectCard';
import { getBotsProjects } from './api/bots-projects';
import styles from '../styles/ProjectsPage.module.css';

const ProjectsPage = ({ bots_projects }) => {
  return (
    <>
      <h3>Open Source Projects</h3>
      <br/>
      <center><h4>Bots</h4></center>
      <hr/>
      <div className={styles.container}>
        {bots_projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </>
  );
};

export async function getStaticProps() {
  const bots_projects = getBotsProjects();

  return {
    props: { title: 'Projects', bots_projects },
  };
}

export default ProjectsPage;
