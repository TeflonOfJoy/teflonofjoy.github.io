import Link from 'next/link';
// import Illustration from '../components/Illustration';
import Image from "next/image";
import styles from '../styles/HomePage.module.css';

export default function HomePage() {
  return (
    <>
      <div className={styles.container}>
        <div className={styles.background}>
          <h1>Computer</h1>
          <h1>Science</h1>
        </div>
        <div className={styles.foreground}>
          <div className={styles.content}>
            <h1 className={styles.name}>Emanuel Nibizi</h1>
            <h6 className={styles.bio}>Computer Science Undergraduate</h6>
            <div className={styles.cardContainer}>
              <div className={styles.card}>
                <div className={styles.content}>
                  <h4>Skill Set</h4>
                  <div className={styles.tags}>
                    <span key='Computer-Science' className='Computer-Science'>
                      Computer-Science
                    </span>
                    <span key='C' className='C'>
                      C
                    </span>
                    <span key='Python' className='Python'>
                      Python
                    </span>
                    <span key='Software-Design' className='Software-Design'>
                      Software-Design
                    </span>
                    <span key='Apache-Kafka' className='Apache-Kafka'>
                      Apache-Kafka
                    </span>
                    <span key='Apache-Maven' className='Apache-Maven'>
                      Apache-Maven
                    </span>
                    <span key='Spring-Boot' className='Spring-Boot'>
                      Spring-Boot
                    </span>
                    <span key='SQL' className='SQL'>
                      SQL
                    </span>
                    <span key='Bots' className='Bots'>
                      Bots
                    </span>
                    <span key='APIs' className='APIs'>
                      Docker
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <Link href="/resume">
              <button className={styles.button}>Resume</button>
            </Link>
            <Link href="https://blog.teflonofjoy.com/">
              <button className={styles.button}>My Blog</button>
            </Link>
            <Link href="/contact">
              <button className={styles.outlined}>Contact</button>
            </Link>
          </div>
          {/* <Illustration className={styles.illustration} /> */}
          <div className={styles.right}>
            <div className={styles.picture_boader}>
              <Image
                className={styles.picture}
                src="/me.png"
                width={300}
                height={300}
                alt="Spaceman"
              />
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export async function getStaticProps() {
  return {
    props: { title: 'Home' },
  };
}
