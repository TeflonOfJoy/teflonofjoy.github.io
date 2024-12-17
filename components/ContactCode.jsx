import styles from '../styles/ContactCode.module.css';

const contactItems = [
  {
    social: 'Email',
    link: 'emanuel.nibizi@unito.edu.it',
    href: 'mailto:emanuel.nibizi@unito.edu.it',
  },
  {
    social: 'Matrix',
    link: 'matrix.to/#/@teflonofjoy:matrix.org',
    href: 'https://matrix.to/#/@teflonofjoy:matrix.org',
  },
  {
    social: 'GitHub',
    link: 'github.com/teflonofjoy',
    href: 'https://github.com/teflonofjoy',
  },
  {
    social: 'Website',
    link: 'teflonofjoy.com',
    href: 'https://teflonofjoy.com',
  },
];

const ContactCode = () => {
  return (
    <div className={styles.code}>
       <p className={styles.line}>
       tag: <a>production</a>
        </p>
      <p className={styles.line}>
        <span>TeflonOfJoy</span>&#58;
      </p>
      <p className={styles.line}>
        &nbsp;&nbsp;&nbsp;&#8212; <span>socials</span>&#58;
      </p>
      {contactItems.slice(0, 8).map((item, index) => (
        <p className={styles.line} key={index}>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{item.social}:{' '}
          <a href={item.href} target="_blank" rel="noopener">
            {item.link}
          </a>
        </p>
      ))}
      {contactItems.slice(8, contactItems.length).map((item, index) => (
        <p className={styles.line} key={index}>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{item.social}:{' '}
          <a href={item.href} target="_blank" rel="noopener">
            {item.link}
          </a>
        </p>
      ))}
    </div>
  );
};

export default ContactCode;
