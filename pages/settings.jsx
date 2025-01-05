import ThemeInfo from '../components/ThemeInfo';
import styles from '../styles/SettingsPage.module.css';

const SettingsPage = () => {
  return (
    <>
      <h2>Manage Themes</h2>
      <div className={styles.container}>
        <ThemeInfo
          name="Dracula"
          icon="/dracula.png"
          publisher="Dracula Theme"
          theme="dracula"
          description="Official Dracula Theme. A dark theme for many editors, shells, and more."
        />
        <ThemeInfo
          name="GitHub Dark"
          icon="/github-dark.png"
          publisher="GitHub"
          theme="github-dark"
          description="GitHub theme for VS Code"
        />
        <ThemeInfo
          name="Catppuccin Mocha"
          icon="/catppuccin.png"
          publisher="Catppuccin"
          theme="catppuccin-mocha"
          description="Catppuccin is a community-driven pastel theme that aims to be the middle ground between low and high contrast themes."
        />
        <ThemeInfo
          name="Catppuccin Macchiato"
          icon="/catppuccin.png"
          publisher="Catppuccin"
          theme="catppuccin-macchiato"
          description="Catppuccin is a community-driven pastel theme that aims to be the middle ground between low and high contrast themes."
        />
        <ThemeInfo
          name="Catppuccin Frappé"
          icon="/catppuccin.png"
          publisher="Catppuccin"
          theme="catppuccin-frappé"
          description="Catppuccin is a community-driven pastel theme that aims to be the middle ground between low and high contrast themes."
        />
        <ThemeInfo
          name="Nord"
          icon="/nord.png"
          publisher="arcticicestudio"
          theme="nord"
          description="An arctic, north-bluish clean and elegant Visual Studio Code theme."
        />
      </div>
    </>
  );
};

export async function getStaticProps() {
  return {
    props: { title: 'Settings' },
  };
}

export default SettingsPage;
