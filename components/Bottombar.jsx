import ErrorIcon from './icons/ErrorIcon';
import WarningIcon from './icons/WarningIcon';
import BellIcon from './icons/BellIcon';
import GithubIcon from './icons/GithubIcon';
import LinkedinIcon from './icons/LinkedinIcon';
import ScholarIcon from './icons/ScholarIcon';
import SourceControlIcon from './icons/SourceControlIcon';
import styles from '../styles/Bottombar.module.css';

const Bottombar = () => {
  return (
    <footer className={styles.bottomBar}>
      <div className={styles.container}>
        <a
          href="https://github.com/teflonofjoy/teflonofjoy.github.io"
          target="_blank"
          rel="noreferrer noopener"
          className={styles.section}
        >
          <SourceControlIcon className={styles.icon} />
          <p>main</p>
        </a>
        <div className={styles.section}>
          <ErrorIcon className={styles.icon} />
          <p className={styles.errorText}>0</p>&nbsp;&nbsp;
          <WarningIcon className={styles.icon} />
          <p>0</p>
        </div>
      </div>
      <div className={styles.container}>
        <a href="https://github.com/teflonofjoy" target="_blank" rel="noopener">
          <div className={styles.section}>
            <GithubIcon className={styles.icon} />
            <p>Github</p>
          </div>
        </a>
        {/* <div className={styles.section}>
          <NextjsIcon className={styles.icon} />
          <p>Powered by Next.js</p>
        </div> */}
        {/* <div className={styles.section}>
          <CheckIcon className={styles.icon} />
          <p>Prettier</p>
        </div> */}
        <div className={styles.section}>
          <BellIcon />
        </div>
      </div>
    </footer>
  );
};

export default Bottombar;
