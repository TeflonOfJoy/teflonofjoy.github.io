import Head from 'next/head';

const CustomHead = ({ title }) => {
  return (
    <Head>
      <title>{title}</title>
      <meta
        name="description"
        content="Emanuel Nibizi's Profolio."
      />
      <meta
        name="keywords"
        content="emanuel nibizi, emanuel, nibizi, data scientist portfolio, machine learning, emanuel nibizi portfolio, vscode-portfolio"
      />
      <meta property="og:title" content="Emanuel Nibizi's Profolio" />
      <meta
        property="og:description"
        content="Emanuel Nibizi's Profolio."
      />
      <meta property="og:image" content="https://imgur.com/YTNNknY.png" />
      <meta property="og:url" content="https://gkos.dev" />
      <meta name="twitter:card" content="summary_large_image" />
    </Head>
  );
};

export default CustomHead;

CustomHead.defaultProps = {
  title: 'Emanuel Nibizi',
};
